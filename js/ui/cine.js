"use strict";
/* =====================================================================
   开场动画 · 影院版（WebGL）
   七个镜头各是一段片元着色器：地球夜半球与城市灯光、大气散射与日出、
   会反射环境的斯普特尼克金属球、月面低角度阳光下的长影子、云海上的再入火球、
   黄昏雪原上冒烟的碎片、星云里旋转的环形空间站、仲裁院拱窗透进来的光柱。
   另有一块 2D 画布叠在上面，画卫星轨道、挖掘机、扬尘这类小东西。
   分辨率会按帧时自动降一档；手机不支持 WebGL 时，回落到 film.js 的手绘版。
   ===================================================================== */
const Cine=(function(){
  const VS='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  /* ---------- 公共部分：噪声、星空、相机、球体、色调与胶片颗粒 ---------- */
  const COMMON=`
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;uniform float uT,uP,uA,uG,uAsp;
#define PI 3.14159265
float h11(float n){return fract(sin(n)*43758.5453);}
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float h31(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}
float n3(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
  return mix(mix(mix(h31(i),h31(i+vec3(1.,0.,0.)),f.x),mix(h31(i+vec3(0.,1.,0.)),h31(i+vec3(1.,1.,0.)),f.x),f.y),
             mix(mix(h31(i+vec3(0.,0.,1.)),h31(i+vec3(1.,0.,1.)),f.x),mix(h31(i+vec3(0.,1.,1.)),h31(i+vec3(1.,1.,1.)),f.x),f.y),f.z);}
float fbm2(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*n2(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}
float fbm3(vec3 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*n3(p);p=p*2.02+vec3(3.1,1.7,5.3);a*=.5;}return s;}
float fbm3l(vec3 p){float a=.5,s=0.;for(int i=0;i<3;i++){s+=a*n3(p);p=p*2.02+vec3(3.1,1.7,5.3);a*=.5;}return s/.875;}
float ez(float t){t=clamp(t,0.,1.);return t<.5?2.*t*t:1.-pow(-2.*t+2.,2.)/2.;}
mat3 rotX(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}
mat3 rotY(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}
mat3 rotZ(float a){float c=cos(a),s=sin(a);return mat3(c,s,0.,-s,c,0.,0.,0.,1.);}
vec3 stars2(vec2 uv,float sc,float th){
  vec3 c=vec3(0.);
  for(int i=0;i<2;i++){float k=sc*(1.+float(i)*1.7);vec2 g=uv*k,id=floor(g),f=fract(g)-.5;float h=h21(id+float(i)*13.1);
    if(h>th){vec2 o=vec2(h21(id+3.1),h21(id+7.7))-.5;float d=length(f-o*.6);float tw=.7+.3*sin(uG*(2.+h*5.)+h*40.);
      c+=smoothstep(.09,0.,d)*(h-th)/(1.-th)*tw*mix(vec3(1.,.82,.66),vec3(.68,.8,1.),h21(id+1.3))*2.2;}}
  return c;
}
vec3 stars3(vec3 rd){
  vec3 c=vec3(0.);
  for(int i=0;i<2;i++){float k=i==0?160.:360.;vec3 q=rd*k,id=floor(q),f=fract(q)-.5;float h=h31(id+float(i)*7.);
    if(h>.97){float d=length(f);c+=smoothstep(.16,0.,d)*(h-.97)*33.*mix(vec3(1.,.85,.7),vec3(.7,.8,1.),h31(id+3.));}}
  return c;
}
float sphHit(vec3 ro,vec3 rd,vec3 c,float r){vec3 oc=ro-c;float b=dot(oc,rd);float h=b*b-dot(oc,oc)+r*r;if(h<0.)return -1.;return -b-sqrt(h);}
mat3 camM(vec3 ro,vec3 ta,float roll){vec3 f=normalize(ta-ro),r=normalize(cross(vec3(sin(roll),cos(roll),0.),f)),u=cross(f,r);return mat3(r,u,f);}
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
vec3 post(vec3 c,vec2 frag){
  vec2 q=frag/uRes;
  c=aces(c*1.05);
  c=pow(c,vec3(.4545));
  c*=.55+.45*pow(16.*q.x*q.y*(1.-q.x)*(1.-q.y),.18);
  c+=(h21(frag+fract(uG*7.3)*91.)-.5)*.045;
  return c;
}
/* 地球表面：海、陆、冰盖、云，日面与夜面（城市灯光） */
vec3 earthSurf(vec3 p,vec3 n,vec3 L,vec3 V,float cityK){
  vec3 q=p*2.3;
  float land=fbm3(q+vec3(2.,1.,.5));
  float isL=smoothstep(.52,.545,land);
  float lat=abs(p.y);
  float ice=smoothstep(.8,.9,lat+(fbm3l(q*3.)-.5)*.2);
  float dry=smoothstep(.45,.75,fbm3l(q*2.5+9.))*smoothstep(.55,.15,lat);
  vec3 oc=mix(vec3(.004,.02,.07),vec3(.01,.05,.12),fbm3l(q*5.));
  vec3 lc=mix(vec3(.03,.07,.02),vec3(.2,.13,.06),dry);
  vec3 alb=mix(oc,lc,isL);alb=mix(alb,vec3(.75,.8,.86),ice);
  float cl=smoothstep(.52,.8,fbm3(p*4.6+vec3(uG*.006,0.,uG*.002)))*.9;
  float NL=dot(n,L),lit=smoothstep(-.12,.25,NL);
  vec3 col=mix(alb,vec3(.8,.82,.86),cl*.85)*max(NL,0.)*1.8;
  vec3 H=normalize(L+V);col+=vec3(1.,.9,.75)*pow(max(dot(n,H),0.),60.)*(1.-isL)*(1.-cl)*max(NL,0.)*1.4;
  col*=mix(vec3(1.,.55,.35),vec3(1.),smoothstep(0.,.3,NL));
  float city=pow(fbm3(p*110.),2.2)*smoothstep(.48,.72,fbm3l(p*20.+5.))*isL*(1.-ice)+pow(n3(p*600.),12.)*isL*.6;
  col+=vec3(1.,.58,.22)*city*cityK*(1.-lit)*(1.-cl*.85);
  col+=vec3(.006,.009,.02)*(1.+cl*2.)*(1.-lit);
  float fr=pow(1.-max(dot(n,V),0.),4.);
  col+=mix(vec3(.12,.32,1.),vec3(1.,.5,.2),pow(max(dot(V,-L)*.5+.5,0.),8.)*.3)*fr*(smoothstep(-.35,.35,NL)*1.6+.03);
  return col;
}
`;
  /* ---------- 七个镜头 ---------- */
  const SH=[];
  /* 1 · 1957：夜半球上空，斯普特尼克 1 号滑过，太阳从地平线后升起 */
  SH[0]=`
vec3 SUN;vec3 RO;
vec3 bg(vec3 ro,vec3 rd){
  float t=sphHit(ro,rd,vec3(0.),1.);
  float tc=dot(-ro,rd);vec3 cp=ro+rd*max(tc,0.);float b=length(cp);
  vec3 col;
  if(t>0.){vec3 p=ro+rd*t,n=normalize(p);col=earthSurf(n,n,SUN,-rd,7.);}
  else{
    col=stars3(rd)*.8;
    float h=max(b-1.,0.);
    float sunSide=smoothstep(-.6,.7,dot(normalize(cp),SUN));
    vec3 atmC=mix(vec3(.1,.28,1.),vec3(1.,.42,.12),pow(max(dot(rd,SUN),0.),5.));
    col+=atmC*exp(-h*60.)*(sunSide*2.6+.06);
    col+=vec3(.4,.6,1.)*exp(-h*30.)*sunSide*.1;
    float sd=max(dot(rd,SUN),0.);
    col+=vec3(1.,.9,.75)*(pow(sd,3000.)*60.+pow(sd,80.)*.6+pow(sd,8.)*.06);
  }
  return col;
}
vec3 shot(vec2 uv,vec2 frag){
  float dip=acos(1./1.06);
  float e=dip+.025-ez(uP)*.06;
  float az=.1+atan(uAsp*.55/1.55);
  SUN=normalize(vec3(sin(az)*cos(e),-sin(e),cos(az)*cos(e)));
  RO=vec3(0.,1.06,0.);
  vec3 ta=RO+vec3(.12-.1*uP,-.27,1.);
  mat3 cm=camM(RO,ta,-.08);
  float fl=1.55+.08*ez(uP);
  vec3 rd=normalize(cm*vec3(uv,fl));
  vec3 col=bg(RO,rd);
  /* 斯普特尼克：位置在相机坐标里，近景合成 */
  float kk=.55/fl;vec3 sc=vec3(mix(-uAsp*1.1,uAsp*.8,clamp(uP*.95+.03,0.,1.))*kk,(.34+.02*sin(uT*.4))*kk,.55);
  vec3 C=RO+cm*sc;float R=.026;
  /* 天线朝后拖，整颗星绕飞行方向慢慢自转 */
  mat3 rot=rotX(uT*.6)*rotY(-cm[2].x*.0)*tr3(cm);
  float ts=sphHit(RO,rd,C,R);
  if(ts>0.){
    vec3 p=RO+rd*ts,n=normalize(p-C),rf=reflect(rd,n);
    vec3 env=bg(RO,rf);
    float fres=.55+.45*pow(1.-max(dot(n,-rd),0.),3.);
    vec3 base=vec3(.78,.8,.83);
    col=env*base*fres*1.1+vec3(1.,.95,.86)*pow(max(dot(rf,SUN),0.),250.)*40.+base*max(dot(n,SUN),0.)*.35;
    col+=vec3(.03,.06,.12)*max(-n.y,0.);
    vec3 ln=rot*n;col*=1.-.7*smoothstep(.035,.0,abs(ln.y));
  }
  /* 四根天线：投影成屏幕上的线段，被球挡住的部分不画 */
  float zs=ts>0.?ts:1e3;
  for(int i=0;i<4;i++){
    float fi=float(i);
    vec3 a=vec3(.0,.0,.0),b;
    float sy=(fi<1.5?1.:-1.),sz=(mod(fi,2.)<.5?1.:-1.);
    a=normalize(vec3(.55,.42*sy,.42*sz))*R*.97;
    b=a+normalize(vec3(-1.,.16*sy+.03,.16*sz-.12))*R*(fi<1.5?8.3:10.)*(1.-.12*mod(fi,2.));
    vec3 wa=C+tr3(rot)*a,wb=C+tr3(rot)*b;
    vec3 la=wa-RO,lb=wb-RO;
    vec3 ca=vec3(dot(la,cm[0]),dot(la,cm[1]),dot(la,cm[2])),cb=vec3(dot(lb,cm[0]),dot(lb,cm[1]),dot(lb,cm[2]));
    vec2 pa=ca.xy/ca.z*fl,pb=cb.xy/cb.z*fl;
    vec2 pq=uv-pa,ba=pb-pa;float hh=clamp(dot(pq,ba)/dot(ba,ba),0.,1.);float d=length(pq-ba*hh);
    float z=mix(ca.z,cb.z,hh);
    float w=.0028*(.55/z);
    float m=smoothstep(w,w*.2,d)*step(z,zs);
    vec3 dir=normalize(wb-wa);
    float glint=pow(max(dot(normalize(cross(dir,cross(SUN,dir))),SUN),0.),2.);
    col=mix(col,vec3(.75,.77,.8)*(.35+glint*.9)+vec3(1.,.9,.7)*pow(1.-hh,6.)*.2,m*.9);
  }
  /* 电波：每 0.6 秒一圈 */
  vec3 lc=C-RO;vec3 cc=vec3(dot(lc,cm[0]),dot(lc,cm[1]),dot(lc,cm[2]));vec2 sp=cc.xy/cc.z*fl;
  float ph=fract((uT-.4)/.6);float rr=.03+ph*.32;float dd=length(uv-sp);
  col+=vec3(.55,.8,1.)*exp(-pow((dd-rr)/.004,2.))*pow(1.-ph,2.)*.35*step(.4,uT);
  /* 日出的镜头光晕 */
  vec3 ls=SUN;vec3 cs=vec3(dot(ls,cm[0]),dot(ls,cm[1]),dot(ls,cm[2]));
  if(cs.z>0.){vec2 ss=cs.xy/cs.z*fl;float vis=smoothstep(-.012,.012,dip-e);
    col+=vec3(1.,.75,.45)*exp(-abs(uv.y-ss.y)*140.)*exp(-abs(uv.x-ss.x)*1.2)*vis*.9;
    col+=vec3(1.,.7,.4)*exp(-length(uv-ss)*6.)*vis*.25;}
  return col;
}`;
  /* 2 · 六十多年后：白天的地球，轨道越来越挤（卫星画在叠加层） */
  SH[1]=`
vec3 shot(vec2 uv,vec2 frag){
  float R=mix(1.5,1.22,ez(uP))*(.68+.32*clamp(uAsp,0.,1.)),cy=-R-.02+.22;
  vec2 C=vec2(0.,cy);vec2 q=(uv-C)/R;float r2=dot(q,q);
  vec3 L=normalize(vec3(-.55,.45,.7));
  vec3 col=stars2(uv,60.,.94)*.6;
  float rr=sqrt(r2);
  col+=vec3(.12,.3,1.)*exp(-(rr-1.)*R*22.)*step(1.,rr)*(.4+.6*smoothstep(-.6,.6,dot(normalize(vec3(q,0.)),L)));
  if(r2<1.){vec3 n=vec3(q.x,q.y,sqrt(1.-r2));vec3 p=rotX(.4)*rotY(uG*.015+2.2)*n;col=earthSurf(p,n,L,vec3(0.,0.,1.),2.);}
  return col;
}`;
  /* 3 · 月球南极：低角度阳光，长影子，两台挖掘机（叠加层），两家界线的重叠处发红 */
  SH[2]=`
float crat(vec2 p,float s){vec2 g=p/s,id=floor(g);float h=0.;
  for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 c=id+vec2(float(i),float(j));float k=h21(c);if(k<.4)continue;
    vec2 o=c+.2+.6*vec2(h21(c+.7),h21(c+3.3));float r=.22+.25*h21(c+9.1);float d=length(g-o)/r;
    h+=(d<1.?(d*d-1.)*.5:0.)+.16*exp(-pow((d-1.)/.28,2.));}
  return h*s;}
float n2s(vec2 p){return n2(p)*.6+n2(p*2.03+1.7)*.4;}
/* 步进与阴影用低细节地形，法线用全细节 */
float hgtL(vec2 p){float h=crat(p,3.2)*.22+(n2s(p*.35)-.5)*.6;
  float pad=smoothstep(.8,2.,length(p-vec2(-.6,5.2)))*smoothstep(.8,2.,length(p-vec2(1.9,6.3)));return h*pad;}
float hgt(vec2 p){float h=crat(p,3.2)*.22+crat(p+17.,1.1)*.18+(fbm2(p*.35)-.5)*.6;
  float pad=smoothstep(.8,2.,length(p-vec2(-.6,5.2)))*smoothstep(.8,2.,length(p-vec2(1.9,6.3)));return h*pad;}
vec3 shot(vec2 uv,vec2 frag){
  vec3 ro=vec3(.4+ez(uP)*1.6,.85,0.);
  mat3 cm=camM(ro,ro+vec3(0.,-.16,1.),0.);
  vec3 rd=normalize(cm*vec3(uv,1.6));
  vec3 L=normalize(vec3(-1.,.12,.3));
  vec3 col=vec3(0.);
  float hy=.16*1.6;
  bool hit=false;float t=.4;
  if(rd.y<.02){
    for(int i=0;i<56;i++){vec3 p=ro+rd*t;float d=p.y-hgtL(p.xz);if(d<.002*t){hit=true;break;}t+=max(d*.6,.006*t);if(t>48.)break;}
  }
  if(hit){
    vec3 g=ro+rd*t;
    float e=.03*max(1.,t*.15),h0=hgt(g.xz);
    vec3 n=normalize(vec3(h0-hgt(g.xz+vec2(e,0.)),e,h0-hgt(g.xz+vec2(0.,e))));
    n=normalize(n+vec3(fbm2(g.xz*9.)-.5,0.,fbm2(g.xz*9.+4.)-.5)*.12/max(1.,t*.3));
    float sh=1.;for(int k=1;k<7;k++){vec3 s=vec3(g.x,h0+.01,g.z)+L*float(k)*.3*(1.+float(k)*.18);sh=min(sh,clamp((s.y-hgtL(s.xz))*5.+.4,0.,1.));}
    float dif=max(dot(n,L),0.)*sh;
    vec3 alb=vec3(.58,.56,.53)*(.85+.3*fbm2(g.xz*1.3));
    col=alb*dif*3.+alb*vec3(.025,.03,.045)*(.5+.5*n.y);
    col*=1.-smoothstep(14.,46.,t);
    vec2 c1=vec2(-.6,5.2),c2=vec2(1.9,6.3);float r1=2.,r2=2.15;
    float d1=length(g.xz-c1),d2=length(g.xz-c2);float w=.012*t;
    float a1=atan(g.z-c1.y,g.x-c1.x),a2=atan(g.z-c2.y,g.x-c2.x);
    col+=vec3(1.,.2,.12)*smoothstep(w,0.,abs(d1-r1))*step(.5,fract(a1*9.))*.7;
    col+=vec3(.2,.5,1.)*smoothstep(w,0.,abs(d2-r2))*step(.5,fract(a2*9.))*.7;
    col+=vec3(1.,.12,.06)*step(d1,r1)*step(d2,r2)*(.07+.06*sin(uT*5.))*smoothstep(0.,.3,uP);
  }else{
    col=stars2(uv,70.,.93)*.8;
    vec2 ec=vec2(uAsp*.55,.5);float er=.11;vec2 q=(uv-ec)/er;float r2=dot(q,q);
    if(r2<1.){vec3 n=vec3(q,sqrt(1.-r2));col=earthSurf(rotY(uG*.02)*n,n,normalize(vec3(-.8,.2,.5)),vec3(0.,0.,1.),2.)*1.3;}
    col+=vec3(.15,.35,1.)*exp(-(sqrt(r2)-1.)*er*60.)*step(1.,r2)*.4;
    float rh=hy+.012+.05*fbm2(vec2(uv.x*1.6+ro.x*.25,2.))+.01*fbm2(vec2(uv.x*8.,5.));
    if(uv.y<rh){float rim=smoothstep(.012,.0,rh-uv.y);col=vec3(.006,.006,.007)+vec3(.9,.85,.75)*rim*.35*smoothstep(.2,-.6,uv.x/uAsp);}
  }
  return col;
}`;
  /* 4 · 再入：黄昏的云海上方，一团火球拖着尾巴落下 */
  SH[3]=`
vec3 shot(vec2 uv,vec2 frag){
  vec2 sh=vec2(h11(floor(uG*24.))-.5,h11(floor(uG*24.)+3.)-.5)*.004*smoothstep(.2,.6,uP);uv+=sh;
  vec3 ro=vec3(0.,1.2,uG*.15);vec3 rd=normalize(vec3(uv.x,uv.y-.18,1.5));
  vec3 sunD=normalize(vec3(-.8,-.02,1.));
  float hz=clamp(rd.y,0.,1.);
  vec3 sky=mix(vec3(1.,.5,.25),vec3(.55,.25,.4),smoothstep(0.,.12,hz));
  sky=mix(sky,vec3(.04,.05,.16),smoothstep(.1,.5,hz));
  sky+=vec3(1.,.6,.3)*pow(max(dot(rd,sunD),0.),12.)*.8;
  vec3 col=sky+stars2(uv,80.,.95)*smoothstep(.2,.5,hz)*.5;
  if(rd.y<0.){
    float t=-ro.y/rd.y;vec3 g=ro+rd*t;vec2 cp=g.xz*.35+vec2(uG*.02,0.);
    vec2 w=vec2(fbm2(cp+3.),fbm2(cp+7.));float d=fbm2(cp+w*1.2);
    float e=.08,d2=fbm2(cp+vec2(e,0.)+w*1.2),d3=fbm2(cp+vec2(0.,e)+w*1.2);
    vec3 n=normalize(vec3(d-d2,.12,d-d3));
    float lit=max(dot(n,normalize(vec3(-1.,.35,.6))),0.);
    vec3 cl=mix(vec3(.18,.12,.3),vec3(1.,.55,.32),lit*lit)*smoothstep(.35,.6,d)+vec3(.02,.03,.08)*(1.-smoothstep(.35,.6,d));
    cl+=vec3(1.,.7,.5)*pow(lit,6.)*.4*smoothstep(.5,.7,d);
    float fog=1.-exp(-t*.05);col=mix(cl,sky,fog);
  }
  /* 火球 */
  vec2 A=vec2(-uAsp*.95-.1,.75),B=vec2(uAsp*.55,-.02);vec2 H=mix(A,B,ez(uP));
  vec2 dir=normalize(B-A);vec2 v=uv-H;float a=dot(v,-dir),c=dot(v,vec2(-dir.y,dir.x));
  float sz=mix(1.,.6,uP);
  float head=exp(-length(v)*70./sz);
  float wd=(.008+max(a,0.)*.07)*sz;
  float tail=exp(-c*c/(wd*wd))*exp(-max(a,0.)*2.2/sz)*step(0.,a);
  float turb=fbm2(vec2(a*14.-uT*9.,c*40.));
  vec3 fire=vec3(1.,.95,.85)*head*6.+mix(vec3(1.,.55,.2),vec3(.9,.2,.08),clamp(a*3.,0.,1.))*tail*(1.4+turb*1.6);
  float smoke=exp(-c*c/(wd*wd*4.))*smoothstep(.0,.6,a)*exp(-a*.8)*fbm2(vec2(a*6.,c*12.)+uT*.5);
  col=mix(col,vec3(.12,.1,.14),smoke*.35);
  col+=fire;
  for(int k=0;k<14;k++){float fk=float(k);float s=fract(uT*.7+h11(fk));vec2 sp=H-dir*(.05+s*.45)*sz+vec2(h11(fk+1.)-.5,h11(fk+2.)-.5)*s*.08;
    col+=vec3(1.,.7,.3)*smoothstep(.006,0.,length(uv-sp))*(1.-s)*1.5;}
  col+=vec3(1.,.5,.2)*exp(-length(uv-H)*3.)*.18;
  return pow(max(col,0.),vec3(2.2));
}`;
  /* 5 · 黄昏雪原：一串碎片落在冻土上，冒着烟 */
  SH[4]=`
float ridgeY(float x,float base,float amp,float fr,float o){return base+amp*(fbm2(vec2(x*fr+o,o*1.3))-.5)*2.;}
vec3 shot(vec2 uv,vec2 frag){
  float pan=ez(uP)*.35;vec2 p=uv+vec2(pan,0.);
  vec3 sky=mix(vec3(1.,.62,.38),vec3(.62,.32,.5),smoothstep(-.05,.35,uv.y));
  sky=mix(sky,vec3(.12,.1,.28),smoothstep(.3,1.,uv.y));
  vec2 sp=vec2(uAsp*.62-pan*.2,-.02);float sd=length(uv-sp);
  sky+=vec3(1.,.75,.45)*(exp(-sd*7.)*.6+smoothstep(.045,.04,sd)*1.5);
  sky=mix(sky,sky*vec3(1.15,1.,1.05),smoothstep(.55,.75,fbm2(vec2(p.x*1.5-uT*.01,p.y*7.))));
  vec3 col=sky;
  vec3 fogC=vec3(.85,.55,.55);
  float y1=ridgeY(p.x*.6,.02,.09,1.4,1.),y2=ridgeY(p.x*.8,-.05,.07,2.,4.),y3=ridgeY(p.x,-.11,.05,3.,8.);
  if(uv.y<y1){col=mix(vec3(.42,.28,.45),fogC,.45);col+=vec3(1.,.6,.4)*smoothstep(.012,0.,y1-uv.y)*.25;}
  if(uv.y<y2){col=mix(vec3(.28,.18,.36),fogC,.25);col+=vec3(1.,.6,.4)*smoothstep(.01,0.,y2-uv.y)*.18;}
  if(uv.y<y3){col=vec3(.17,.12,.26);}
  float tb=-.16;
  float cell=floor(p.x*38.),fx=fract(p.x*38.);float th=.03+.06*h11(cell);
  if(uv.y<tb+th*(1.-abs(fx-.5)*2.)&&uv.y>tb-.02&&h11(cell+5.)>.25)col=vec3(.1,.08,.16);
  if(uv.y<tb-.012){
    float dz=1./max(-(uv.y-tb)+.012,.001);
    vec2 g=vec2(p.x*dz*.3,dz);
    vec3 snow=mix(vec3(.55,.55,.75),vec3(.95,.82,.82),smoothstep(-.6,-.15,uv.y));
    snow*=.92+.08*fbm2(g*vec2(1.,.4)*2.);
    float glint=step(.996,h21(floor(frag*.5)+floor(uG*6.)))*smoothstep(-.2,-.5,uv.y);
    col=snow+glint*.8;
    /* 碎片：一条线上的余烬 */
    for(int k=0;k<12;k++){float fk=float(k);vec2 e=vec2(-.75+fk*.13+h11(fk)*.04-pan*.0,-.26-fk*.012-h11(fk+2.)*.02);
      vec2 ep=e;ep.x-=pan;float d=length((uv-ep)*vec2(1.,2.2));float fl=.6+.4*sin(uG*4.+fk*1.7);
      col+=vec3(1.,.45,.15)*(exp(-d*60.)*1.2+exp(-d*14.)*.25)*fl;
      col=mix(col,vec3(.12,.08,.1),smoothstep(.012,.006,d)*.8);}
  }
  /* 烟柱 */
  for(int k=0;k<4;k++){float fk=float(k);float bx=-.7+fk*.39+h11(fk+11.)*.05-pan;float by=-.27-fk*.04;
    vec2 q=uv-vec2(bx,by);if(q.y>0.){float wd=.02+q.y*.25;float dens=smoothstep(wd,0.,abs(q.x+sin(q.y*6.+uG*.6)*q.y*.12))*fbm2(vec2(q.x*12.,q.y*6.-uG*.5))*exp(-q.y*2.5);
      col=mix(col,vec3(.3,.24,.3),dens*.7);}}
  /* 飘雪 */
  for(int k=0;k<3;k++){float fk=float(k);vec2 g=uv*(10.+fk*8.)+vec2(uG*(.3+fk*.2),uG*(1.2+fk*.4));vec2 id=floor(g),f=fract(g)-.5;
    float h=h21(id+fk*7.);if(h>.82){vec2 o=vec2(h21(id+1.),h21(id+2.))-.5;col+=vec3(1.)*smoothstep(.07,.0,length(f-o*.7))*(.25+fk*.12);}}
  return pow(max(col,0.),vec3(2.2));
}`;
  /* 6 · 深空：星云里一座旋转的环形空间站 */
  SH[5]=`
float sdT(vec3 p,vec2 t){vec2 q=vec2(length(p.xz)-t.x,p.y);return length(q)-t.y;}
float sdC(vec3 p,vec3 a,vec3 b,float r){vec3 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h)-r;}
float sdB(vec3 p,vec3 b){vec3 d=abs(p)-b;return length(max(d,0.))+min(max(d.x,max(d.y,d.z)),0.);}
float ANG;
float map(vec3 p){
  p=rotY(ANG)*p;
  float d=sdT(p,vec2(1.,.075));
  d=min(d,length(p)-.16);
  d=min(d,sdC(p,vec3(0.,-.9,0.),vec3(0.,.9,0.),.035));
  for(int i=0;i<6;i++){float a=float(i)/6.*2.*PI;d=min(d,sdC(p,vec3(0.),vec3(cos(a),0.,sin(a)),.018));}
  d=min(d,sdB(p-vec3(0.,1.02,0.),vec3(.45,.01,.12)));
  d=min(d,sdB(p-vec3(0.,-1.02,0.),vec3(.45,.01,.12)));
  return d;
}
vec3 nrm(vec3 p){vec2 e=vec2(.002,0.);return normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx)));}
vec3 neb(vec2 uv){
  vec2 q=uv*1.3+vec2(uG*.004,0.);
  vec2 w=vec2(fbm2(q+1.),fbm2(q+5.2));float f=fbm2(q*1.4+w*1.6);
  vec3 c=mix(vec3(.06,.02,.12),vec3(.55,.15,.45),smoothstep(.35,.8,f));
  c=mix(c,vec3(.08,.45,.5),smoothstep(.5,.9,fbm2(q*2.+w)));
  c*=smoothstep(.2,.8,f)*.9;
  c*=1.-.8*smoothstep(.55,.75,fbm2(q*3.+w*2.));
  return c*.8;
}
vec3 shot(vec2 uv,vec2 frag){
  ANG=uG*.14;
  vec3 col=neb(uv+vec2(0.,ez(uP)*.08))+stars2(uv,90.,.92);
  vec2 sp=vec2(-uAsp*.7,.62);float sd=length(uv-sp);
  col+=vec3(1.,.9,.75)*(exp(-sd*30.)*1.5+exp(-abs(uv.y-sp.y)*200.)*exp(-abs(uv.x-sp.x)*4.)*.5+exp(-abs(uv.x-sp.x)*200.)*exp(-abs(uv.y-sp.y)*5.)*.35);
  vec3 ro=vec3(0.,.9-ez(uP)*.5,-3.6+ez(uP)*.4);
  mat3 cm=camM(ro,vec3(0.,0.,0.),.12);
  vec3 rd=normalize(cm*vec3(uv,1.8*min(1.,uAsp*1.4+.2)));
  float tb=sphHit(ro,rd,vec3(0.),1.25);
  if(tb>0.){
    float t=tb;bool hit=false;
    for(int i=0;i<64;i++){vec3 p=ro+rd*t;float d=map(p);if(d<.001){hit=true;break;}t+=d;if(t>tb+2.6)break;}
    if(hit){
      vec3 p=ro+rd*t,n=nrm(p);vec3 L=normalize(vec3(-.7,.5,-.4));
      float dif=max(dot(n,L),0.);vec3 h=normalize(L-rd);
      vec3 base=vec3(.72,.74,.78);
      vec3 c=base*dif*1.6+vec3(1.,.9,.8)*pow(max(dot(n,h),0.),40.)*1.2+base*vec3(.18,.08,.22)*(.5+.5*n.y)+vec3(.1,.3,.35)*pow(1.-max(dot(n,-rd),0.),3.)*.6;
      vec3 lp=rotY(ANG)*p;float ra=length(lp.xz);
      if(abs(ra-1.)<.09){float ang=atan(lp.z,lp.x);float win=step(.55,fract(ang*48./(2.*PI)))*smoothstep(.03,.0,abs(lp.y))*step(ra,1.06)*step(.94,ra);
        c+=vec3(1.,.8,.5)*win*1.6;}
      if(abs(lp.y)>.98&&abs(lp.x)<.45)c=mix(c,vec3(.08,.12,.3)+vec3(.3,.5,1.)*pow(max(dot(reflect(rd,n),L),0.),20.),.8);
      col=c;
    }
  }
  return col;
}`;
  /* 7 · 2077，星海仲裁院：拱窗、地球、光柱、浮尘、三把高背椅 */
  SH[6]=`
float winMask(vec2 p,float ww,float wh,float yb){
  float r=ww;vec2 q=p-vec2(0.,yb);
  if(q.y<0.||abs(q.x)>ww)return 0.;
  if(q.y<wh)return 1.;
  return step(length(vec2(q.x,(q.y-wh)*1.)),r);
}
vec3 shot(vec2 uv,vec2 frag){
  float s=1.-.07*ez(uP);vec2 p=uv*s+vec2(0.,.02*ez(uP));
  float ww=min(.62,uAsp*.82),wh=.45,yb=-.32;
  float m=winMask(p,ww,wh,yb);
  vec3 col=mix(vec3(.025,.03,.05),vec3(.05,.045,.05),smoothstep(-1.,1.,p.y));
  col+=vec3(.6,.45,.25)*smoothstep(.004,.0,abs(fract(p.x*3.)-.5)-.497)*.04;
  if(m>0.){
    vec2 q=(p-vec2(0.,yb))/max(ww,.1);
    vec3 sky=stars2(p,50.,.93)*.9;
    vec2 ec=vec2(.1,-1.32);float er=1.6;vec2 e=(q-ec)/er;float r2=dot(e,e);
    vec3 L=normalize(vec3(-.6,.55,.55));
    if(r2<1.){vec3 n=vec3(e,sqrt(1.-r2));sky=earthSurf(rotX(.3)*rotY(uG*.01+.6)*n,n,L,vec3(0.,0.,1.),2.)*1.1;}
    else sky+=vec3(.15,.38,1.)*exp(-(sqrt(r2)-1.)*er*14.)*.9;
    vec2 sp=vec2(-.62,.95);sky+=vec3(1.,.85,.6)*(exp(-length(q-sp)*9.)*.9+exp(-abs(q.y-sp.y)*60.)*exp(-abs(q.x-sp.x)*1.5)*.25);
    col=sky;
    float fr=0.;fr=max(fr,smoothstep(.006,.0,abs(abs(p.x)-ww*.333)));fr=max(fr,smoothstep(.006,.0,abs(p.y-(yb+wh*.62))));
    col=mix(col,vec3(.5,.38,.2),fr*.7);
  }
  float edge=abs(winMask(p,ww+.012,wh,yb-.012)-m);
  col=mix(col,vec3(.9,.7,.38),edge*.9);
  /* 光柱：朝窗户方向积分 */
  vec2 lp=vec2(-.1,yb+wh*.9);vec2 dlt=(p-lp)/24.;float acc=0.;vec2 sq=p;
  for(int i=0;i<24;i++){sq-=dlt;acc+=winMask(sq,ww,wh,yb)*(1.-float(i)/24.);}
  float shaft=acc/24.*(1.-m)*smoothstep(.0,-.9,p.y-yb-wh);
  col+=vec3(1.,.8,.55)*shaft*.55;
  /* 浮尘 */
  for(int k=0;k<2;k++){float fk=float(k);vec2 g=p*(14.+fk*9.)+vec2(uG*.05,-uG*(.08+fk*.04));vec2 id=floor(g),f=fract(g)-.5;
    float h=h21(id+fk*3.);if(h>.86){vec2 o=vec2(h21(id+1.),h21(id+2.))-.5;col+=vec3(1.,.85,.6)*smoothstep(.08,.0,length(f-o*.7))*shaft*3.;}}
  /* 地面反光 */
  float fy=-.55;if(p.y<fy){vec2 rp=vec2(p.x,2.*fy-p.y);float rm=winMask(rp,ww,wh,yb);col=mix(col,vec3(.45,.5,.75)*.35,rm*.4*smoothstep(-1.,fy,p.y));col*=.85;}
  /* 法官席与三把高背椅 */
  float dy=-.5,dh=.12,dw=min(.85,uAsp*.95);
  if(abs(p.x)<dw&&p.y<dy&&p.y>dy-dh){col=vec3(.03,.028,.035)+vec3(.9,.65,.35)*smoothstep(.006,0.,abs(p.y-dy))*.6;}
  for(int i=-1;i<=1;i++){float cx=float(i)*dw*.42;float chh=i==0?.36:.29;vec2 c=p-vec2(cx,dy);
    float body=step(abs(c.x),.075)*step(0.,c.y)*step(c.y,chh-.06)+step(length(vec2(c.x,(c.y-(chh-.06))*1.3)),.075);
    if(body>0.){col=vec3(.02,.02,.03);col+=vec3(.9,.65,.35)*smoothstep(.012,0.,abs(abs(c.x)-.075))*.25*smoothstep(0.,chh,c.y);}}
  col+=vec3(1.,.75,.45)*exp(-length(p-vec2(0.,yb+wh*.5))*1.4)*.08;
  return pow(max(col,0.),vec3(2.2));
}`;
  SH.forEach(function(s,i){SH[i]=s.replace(/transpose3\(rot\)/g,'tr3(rot)');});
  const MAIN=`
mat3 tr3(mat3 m){return mat3(m[0].x,m[1].x,m[2].x,m[0].y,m[1].y,m[2].y,m[0].z,m[1].z,m[2].z);}
`;
  const TAIL=`
void main(){vec2 uv=(gl_FragCoord.xy*2.-uRes)/uRes.y;vec3 c=shot(uv,gl_FragCoord.xy);c=post(c,gl_FragCoord.xy);gl_FragColor=vec4(c*uA,uA);}`;

  /* ---------- 叠加层：轨道上的卫星、挖掘机与扬尘 ---------- */
  function ez(t){t=Math.max(0,Math.min(1,t));return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;}
  const OV=[];
  OV[1]=function(o,W,H,p,T){
    const R=(1.5+(1.22-1.5)*ez(p))*(.68+.32*Math.min(1,W/H)),cy=-R-.02+.22,cx=W/2,cyp=H/2-cy*H/2,r=R*H/2;
    const n=Math.floor(30+330*ez(Math.min(1,p*1.25))),Rn=rng(5);
    o.globalCompositeOperation='lighter';
    for(let i=0;i<n;i++){const k=1.06+Rn()*.55,tilt=(Rn()-.5)*.9,sp=(Rn()<.5?1:-1)*(.00006+Rn()*.00012)*(2-k),a=T*sp*1000+Rn()*7,fl=Rn();
      const ox=Math.cos(a)*r*k,oy=Math.sin(a)*r*k*.28,x=cx+ox*Math.cos(tilt)-oy*Math.sin(tilt),y=cyp+ox*Math.sin(tilt)+oy*Math.cos(tilt);
      if(Math.sin(a)<0&&Math.hypot(x-cx,y-cyp)<r)continue;
      if(i%11===0){o.strokeStyle='rgba(120,170,255,.06)';o.lineWidth=1;o.beginPath();o.ellipse(cx,cyp,r*k,r*k*.28,tilt,Math.PI,Math.PI*2);o.stroke();}
      const tw=.5+.5*Math.sin(T*3+i);
      o.fillStyle=i%29===0?'rgba(255,110,90,'+(.6+.4*tw).toFixed(2)+')':'rgba(215,232,255,'+(.35+.55*tw*fl).toFixed(2)+')';o.fillRect(x-.8,y-.8,1.6,1.6);
    }
    /* 偶尔两颗靠得太近：红色预警圈 */
    const k2=(T*.4)%1;if(p>.35){o.strokeStyle='rgba(255,90,70,'+(.8*(1-k2)).toFixed(2)+')';o.lineWidth=1.2;o.beginPath();o.arc(cx+r*.55,cyp-r*.86,4+k2*16,0,7);o.stroke();}
    o.globalCompositeOperation='source-over';
  };
  OV[2]=function(o,W,H,p,T){
    /* 与着色器同一台相机：ro=(.4+1.6·ez(p),.85,0)，朝 (0,-.16,1)，焦距 1.6 */
    const rx=.4+ez(p)*1.6,ry=.85,f=norm([0,-.16,1]),r=norm(cross([0,1,0],f)),u=cross(f,r);
    const proj=function(x,y,z){const v=[x-rx,y-ry,z];const cz=dot(v,f);return {x:W/2+dot(v,r)/cz*1.6*H/2,y:H/2-dot(v,u)/cz*1.6*H/2,s:1.6*H/2/cz};};
    [[-.6,5.2,1],[1.9,6.3,-1]].forEach(function(R,i){
      const b=proj(R[0],0,R[1]),u0=b.s*.42,dir=R[2],sw=Math.sin(T*1.6+i*2);
      o.save();o.translate(b.x,b.y);
      o.fillStyle='#16171B';o.beginPath();o.ellipse(0,0,u0*1.3,u0*.22,0,0,7);o.fill();
      o.fillStyle='#24262C';o.fillRect(-u0*.9,-u0*.72,u0*1.5,u0*.58);o.fillStyle='#2E3138';o.fillRect(-u0*.55*dir-u0*.25,-u0*1.22,u0*.7,u0*.52);
      o.fillStyle='rgba(235,232,222,.85)';o.fillRect(-u0*.9,-u0*.72,u0*.12,u0*.58);o.fillRect(-u0*.55*dir-u0*.25,-u0*1.22,u0*.1,u0*.52);o.fillRect(-u0*.9,-u0*.74,u0*1.5,u0*.05);
      o.fillStyle='rgba(255,214,140,.95)';o.fillRect(-u0*.4*dir-u0*.1,-u0*1.08,u0*.22,u0*.11);
      o.strokeStyle='#22242A';o.lineCap='round';o.lineWidth=u0*.2;const ax=u0*.5*dir,ay=-u0*.68,ex=ax+u0*1.5*dir,ey=ay-u0*.85+sw*u0*.15,qx=ex+u0*.6*dir,qy=-u0*.12+sw*u0*.08;
      o.beginPath();o.moveTo(ax,ay);o.lineTo(ex,ey);o.lineTo(qx,qy);o.stroke();
      o.fillStyle=(Math.floor(T*2)+i)%2?(i?'rgba(110,180,255,1)':'rgba(255,110,90,1)'):'rgba(255,255,255,.15)';o.beginPath();o.arc(-u0*.2*dir,-u0*1.3,u0*.07,0,7);o.fill();
      /* 月面没有空气：扬尘走抛物线，慢慢落回地面 */
      for(let k=0;k<26;k++){const ph=(T*.35+k/26)%1,vx=(.4+((k*37)%10)/14)*dir,vy=1.1+((k*53)%10)/9;const x=qx+vx*ph*u0*3,y=qy-(vy*ph-.9*ph*ph*1.6)*u0*2.2;
        if(y>u0*.1)continue;o.fillStyle='rgba(225,222,212,'+(.5*(1-ph)).toFixed(2)+')';o.fillRect(x-1,y-1,2,2);}
      o.restore();
    });
  };
  function norm(v){const l=Math.hypot(v[0],v[1],v[2]);return [v[0]/l,v[1]/l,v[2]/l];}
  function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
  function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}

  /* ---------- 渲染器 ---------- */
  let cv,gl,ov,og,buf,progs=[],W=0,H=0,scale=.8,on=false,paused=false,clock=0,last=0,raf=0;
  let cur=-1,prev=-1,tCur=0,tPrev=0,durCur=6000,durPrev=6000,fadeT=0,slow=0,frames=0,okFlag=null,lost=false;
  function compile(i){
    if(progs[i]!==undefined)return progs[i];
    const src=COMMON+MAIN+SH[i]+TAIL;
    const vs=gl.createShader(gl.VERTEX_SHADER);gl.shaderSource(vs,VS);gl.compileShader(vs);
    const fs=gl.createShader(gl.FRAGMENT_SHADER);gl.shaderSource(fs,src);gl.compileShader(fs);
    if(!gl.getShaderParameter(fs,gl.COMPILE_STATUS)){console.warn('cine shot '+i+': '+gl.getShaderInfoLog(fs));progs[i]=null;return null;}
    const p=gl.createProgram();gl.attachShader(p,vs);gl.attachShader(p,fs);gl.bindAttribLocation(p,0,'p');gl.linkProgram(p);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS)){console.warn('cine link '+i);progs[i]=null;return null;}
    p.u={};['uRes','uT','uP','uA','uG','uAsp'].forEach(function(n){p.u[n]=gl.getUniformLocation(p,n);});
    progs[i]=p;return p;
  }
  function size(){
    const d=Math.min(window.devicePixelRatio||1,1.5);W=innerWidth;H=innerHeight;
    cv.width=Math.max(1,Math.round(W*d*scale));cv.height=Math.max(1,Math.round(H*d*scale));
    ov.width=Math.round(W*d);ov.height=Math.round(H*d);og.setTransform(d,0,0,d,0,0);
  }
  function drawShot(i,t,dur,alpha){
    const p=compile(i);if(!p)return false;
    gl.useProgram(p);
    gl.uniform2f(p.u.uRes,cv.width,cv.height);gl.uniform1f(p.u.uT,t/1000);gl.uniform1f(p.u.uP,Math.min(1.15,t/dur));
    gl.uniform1f(p.u.uA,alpha);gl.uniform1f(p.u.uG,clock/1000);gl.uniform1f(p.u.uAsp,W/H);
    gl.drawArrays(gl.TRIANGLES,0,3);return true;
  }
  function frame(now){
    if(!on){raf=0;return;}raf=requestAnimationFrame(frame);
    const dt=Math.min(100,now-(last||now));last=now;if(paused)return;clock+=dt;
    /* 帧时太长就把分辨率降一档 */
    frames++;if(frames>8){if(dt>30)slow++;else slow=Math.max(0,slow-.5);if(slow>10&&scale>.42){scale=Math.max(.42,scale*.78);slow=0;size();}}
    gl.viewport(0,0,cv.width,cv.height);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);
    const fk=prev>=0?Math.min(1,(clock-fadeT)/1000):1;
    if(prev>=0&&fk<1)drawShot(prev,clock-tPrev,durPrev,1);
    if(cur>=0)drawShot(cur,clock-tCur,durCur,prev>=0?fk:1);
    if(fk>=1)prev=-1;
    og.clearRect(0,0,W,H);
    if(prev>=0&&OV[prev]){og.globalAlpha=1-fk;OV[prev](og,W,H,Math.min(1.15,(clock-tPrev)/durPrev),(clock-tPrev)/1000);}
    if(cur>=0&&OV[cur]){og.globalAlpha=prev>=0?fk:1;OV[cur](og,W,H,Math.min(1.15,(clock-tCur)/durCur),(clock-tCur)/1000);}
    og.globalAlpha=1;
  }
  function rz(){if(on)size();}
  return {
    ok(){
      if(okFlag!==null)return okFlag;
      try{const c=document.createElement('canvas');const g=c.getContext('webgl',{alpha:false,antialias:false,premultipliedAlpha:true})||c.getContext('experimental-webgl');okFlag=!!g;}catch(e){okFlag=false;}
      return okFlag;
    },
    start(){
      cv=byId('introGL');ov=byId('introOv');og=ov.getContext('2d');
      gl=cv.getContext('webgl',{alpha:false,antialias:false,premultipliedAlpha:true,preserveDrawingBuffer:false})||cv.getContext('experimental-webgl');
      if(!gl){okFlag=false;return false;}
      if(!cv._lossBound){cv._lossBound=true;cv.addEventListener('webglcontextlost',function(e){e.preventDefault();lost=true;});}
      if(gl.isContextLost&&gl.isContextLost())return false;lost=false;progs=[];
      buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
      gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
      size();if(!compile(0)){okFlag=false;return false;}
      /* 其余镜头分几帧编译，免得开场卡一下 */
      let k=1;const pre=function(){if(!on||k>=SH.length)return;compile(k++);setTimeout(pre,60);};setTimeout(pre,120);
      on=true;paused=false;clock=0;last=0;cur=-1;prev=-1;frames=0;slow=0;
      cv.classList.add('on');ov.classList.add('on');if(!raf)raf=requestAnimationFrame(frame);
      addEventListener('resize',rz);return true;
    },
    show(i,ms,cut){if(lost||!compile(i))return false;if(cur>=0&&!cut){prev=cur;tPrev=tCur;durPrev=durCur;fadeT=clock;}else prev=-1;cur=i;tCur=clock;durCur=ms||6000;return true;},
    pause(b){paused=!!b;},
    stop(){on=false;if(cv)cv.classList.remove('on');if(ov){ov.classList.remove('on');og.clearRect(0,0,W,H);}removeEventListener('resize',rz);},
    failed(i){return progs[i]===null;},
    count:SH.length,
    _scale:function(){return scale;},
    /* 调试：暂停循环，按给定进度画某一镜（截图用） */
    _still:function(i,p,sc){paused=true;if(sc){scale=sc;size();}const d=6000;clock=p*d+1000;tCur=clock-p*d;durCur=d;cur=i;prev=-1;
      gl.viewport(0,0,cv.width,cv.height);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);drawShot(i,p*d,d,1);
      og.clearRect(0,0,W,H);if(OV[i])OV[i](og,W,H,p,p*d/1000);return true;}
  };
})();
