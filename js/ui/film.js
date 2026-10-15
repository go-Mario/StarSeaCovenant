"use strict";
/* =====================================================================
   开场动画（程序绘制版）。七个镜头，和开场字幕一一对应。
   全部用代码画在一块 canvas 上：重的部分（星空、地球、地面）开场前先画成贴图，
   每帧只做平移缩放和少量粒子，手机上也能跑满帧。
   镜头一的斯普特尼克 1 号按真实外形画：一个抛光金属球，后面拖着四根天线。
   ===================================================================== */
const Film=(function(){
  let cv,g,W=0,H=0,D=1,raf=0,on=false,paused=false,clock=0,last=0;
  let cur=-1,prev=-1,tCur=0,tPrev=0,durCur=6000,durPrev=6000,fadeT=0;
  const A={};
  const lerp=function(a,b,t){return a+(b-a)*t;},ez=function(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;};
  function cnv(w,h){const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*D));c.height=Math.max(1,Math.round(h*D));const x=c.getContext('2d');x.scale(D,D);return [c,x];}

  /* ---------------- 贴图 ---------------- */
  function build(){
    const R=rng(77);
    /* 星空：比屏幕大一圈，方便慢慢平移 */
    let [c,x]=cnv(W*1.3,H*1.3);x.fillStyle='#02030A';x.fillRect(0,0,W*1.3,H*1.3);
    for(let i=0;i<W*H/900;i++){const a=R();x.fillStyle='rgba('+(a<.08?'255,226,196':a<.18?'196,214,255':'240,244,255')+','+(R()*.7+.15).toFixed(2)+')';const r=R()<.04?1.5:R()*.8+.3;x.fillRect(R()*W*1.3,R()*H*1.3,r,r);}
    A.stars=c;
    /* 夜半球地球的弧面：深蓝夜面、城市灯光、薄薄一层大气，右侧日出 */
    const ER=Math.max(W,H)*1.15;[c,x]=cnv(W*1.2,H*.75);A.limbH=H*.75;
    const cx=W*.6,cy=H*.75+ER*.86;
    let gr=x.createRadialGradient(cx,cy,ER*.9,cx,cy,ER);gr.addColorStop(0,'#05080F');gr.addColorStop(1,'#0B1630');x.fillStyle=gr;x.beginPath();x.arc(cx,cy,ER,0,7);x.fill();
    x.save();x.beginPath();x.arc(cx,cy,ER,0,7);x.clip();
    for(let i=0;i<900;i++){const a=-Math.PI/2+(R()-.5)*1.1,rr=ER*(.86+R()*.135),px=cx+Math.cos(a)*rr,py=cy+Math.sin(a)*rr;
      if(R()<.7){x.fillStyle='rgba(255,'+(170+R()*60|0)+',90,'+(R()*.6+.2).toFixed(2)+')';x.fillRect(px,py,R()<.1?1.6:1,R()<.1?1.6:1);}}
    gr=x.createLinearGradient(W*1.2,0,W*.5,0);gr.addColorStop(0,'rgba(120,170,255,.25)');gr.addColorStop(1,'rgba(120,170,255,0)');x.fillStyle=gr;x.fillRect(0,0,W*1.2,H*.75);
    x.restore();
    gr=x.createRadialGradient(cx,cy,ER*.995,cx,cy,ER*1.045);gr.addColorStop(0,'rgba(110,170,255,.9)');gr.addColorStop(.25,'rgba(80,140,255,.35)');gr.addColorStop(1,'rgba(60,110,255,0)');
    x.fillStyle=gr;x.beginPath();x.arc(cx,cy,ER*1.045,0,7);x.arc(cx,cy,ER*.995,0,7,true);x.fill();
    /* 日出：只在大气那一圈里亮，避免整块矩形发光 */
    const sx=W*(W<H?.98:1.08),sy=cy-Math.sqrt(Math.max(0,ER*ER-(sx-cx)*(sx-cx)));A.sunX=sx;A.sunY=sy;
    x.save();x.beginPath();x.arc(cx,cy,ER*1.045,0,7);x.arc(cx,cy,ER*.97,0,7,true);x.clip();
    gr=x.createRadialGradient(sx,sy,0,sx,sy,W*.45);gr.addColorStop(0,'rgba(255,236,190,.95)');gr.addColorStop(.15,'rgba(255,190,110,.6)');gr.addColorStop(1,'rgba(255,150,80,0)');
    x.fillStyle=gr;x.fillRect(0,0,W*1.2,H*.75);x.restore();
    A.limb=c;
    /* 整颗地球（镜头二用） */
    const r2=Math.min(W,H)*.34;[c,x]=cnv(r2*2.6,r2*2.6);x.translate(r2*1.3,r2*1.3);MapArt.drawPlanet(x,'earth',r2,31);A.earth=c;A.er=r2;
    /* 小地球（镜头三、七的天空里） */
    const r3=Math.min(W,H)*.06;[c,x]=cnv(r3*2.8,r3*2.8);x.translate(r3*1.4,r3*1.4);MapArt.drawPlanet(x,'earth',r3,9);A.earthS=c;A.er3=r3;
    /* 月面：低太阳、长影子、坑 */
    [c,x]=cnv(W*1.4,H*.5);A.moonH=H*.5;
    gr=x.createLinearGradient(0,0,0,H*.5);gr.addColorStop(0,'#BDBCB6');gr.addColorStop(.3,'#8E8C86');gr.addColorStop(1,'#3E3D3A');x.fillStyle=gr;
    x.beginPath();x.moveTo(0,H*.06);for(let px=0;px<=W*1.4;px+=W*.05){x.lineTo(px,H*.04+Math.sin(px*.011)*H*.015+R()*H*.01);}x.lineTo(W*1.4,H*.5);x.lineTo(0,H*.5);x.fill();
    for(let i=0;i<60;i++){const px=R()*W*1.4,py=H*.08+R()*H*.4,rx=(8+R()*40)*(.4+py/(H*.5)),ry=rx*.28;
      x.fillStyle='rgba(30,30,28,.35)';x.beginPath();x.ellipse(px,py,rx,ry,0,0,7);x.fill();x.strokeStyle='rgba(235,235,230,.35)';x.lineWidth=1;x.beginPath();x.ellipse(px+rx*.08,py+ry*.2,rx,ry,0,Math.PI*.05,Math.PI*.95);x.stroke();}
    A.moon=c;
    /* 云层（镜头四） */
    [c,x]=cnv(W*1.4,H*.5);
    gr=x.createLinearGradient(0,0,0,H*.12);gr.addColorStop(0,'rgba(255,150,90,0)');gr.addColorStop(1,'rgba(255,150,90,.35)');x.fillStyle=gr;x.fillRect(0,0,W*1.4,H*.12);
    for(let row=0;row<4;row++)for(let i=0;i<26;i++){const px=R()*W*1.4,py=H*(.1+row*.09)+R()*H*.04,rr=Math.min(W,H)*(.05+R()*.06)*(1+row*.35);
      gr=x.createLinearGradient(0,py-rr*.6,0,py+rr*.5);gr.addColorStop(0,'rgba('+(170-row*25)+','+(150-row*25)+','+(200-row*20)+',.95)');gr.addColorStop(1,'rgba(20,24,52,.98)');
      x.fillStyle=gr;x.beginPath();x.ellipse(px,py,rr*1.5,rr*.62,0,0,7);x.fill();}
    A.clouds=c;
    /* 雪原（镜头五）：扁平分层的黄昏山脊 */
    [c,x]=cnv(W*1.3,H);
    gr=x.createLinearGradient(0,0,0,H*.7);gr.addColorStop(0,'#2A2556');gr.addColorStop(.5,'#8A4E7A');gr.addColorStop(.85,'#E5795A');gr.addColorStop(1,'#F2B279');x.fillStyle=gr;x.fillRect(0,0,W*1.3,H);
    x.fillStyle='rgba(255,226,170,.85)';x.beginPath();x.arc(W*.85,H*.6,Math.min(W,H)*.05,0,7);x.fill();
    [['#5B3B6E',.56,.05],['#3E2C5A',.62,.04],['#2A2246',.68,.03]].forEach(function(L,i){x.fillStyle=L[0];x.beginPath();x.moveTo(0,H);
      for(let px=0;px<=W*1.3;px+=W*.04){x.lineTo(px,H*L[1]+Math.sin(px*.008+i*2)*H*L[2]+(R()-.5)*H*.012);}x.lineTo(W*1.3,H);x.fill();});
    gr=x.createLinearGradient(0,H*.7,0,H);gr.addColorStop(0,'#C9D3EA');gr.addColorStop(1,'#8E9BC4');x.fillStyle=gr;
    x.beginPath();x.moveTo(0,H*.74);x.quadraticCurveTo(W*.6,H*.69,W*1.3,H*.75);x.lineTo(W*1.3,H);x.lineTo(0,H);x.fill();
    x.fillStyle='#2A2246';for(let i=0;i<26;i++){const px=R()*W*1.3,py=H*(.7+R()*.04),h=H*(.03+R()*.05);x.beginPath();x.moveTo(px,py-h);x.lineTo(px-h*.25,py);x.lineTo(px+h*.25,py);x.fill();}
    A.snow=c;
    /* 星云（镜头六） */
    [c,x]=cnv(W*1.3,H*1.3);x.drawImage(A.stars,0,0,W*1.3,H*1.3);
    [['rgba(118,83,214,.35)',.3,.35,.5],['rgba(42,167,161,.25)',.7,.3,.4],['rgba(201,86,143,.22)',.5,.75,.35]].forEach(function(n){
      gr=x.createRadialGradient(W*1.3*n[1],H*1.3*n[2],0,W*1.3*n[1],H*1.3*n[2],Math.max(W,H)*n[3]);gr.addColorStop(0,n[0]);gr.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=gr;x.fillRect(0,0,W*1.3,H*1.3);});
    A.neb=c;
  }

  /* ---------------- 小部件 ---------------- */
  /* 斯普特尼克 1 号：直径 58 厘米的抛光球，四根 2.4–2.9 米的天线向后掠 */
  function sputnik(x,y,r,rot){
    g.save();g.translate(x,y);g.rotate(rot);
    g.strokeStyle='rgba(225,230,238,.9)';g.lineCap='round';
    [[-.45,8.6],[-.25,10.2],[.25,10.2],[.45,8.6]].forEach(function(a,i){const ang=Math.PI+a[0];g.lineWidth=Math.max(.8,r*.07);
      g.beginPath();g.moveTo(Math.cos(ang)*r*.8,Math.sin(ang)*r*.8+(i<2?-r*.2:r*.2));g.lineTo(Math.cos(ang)*r*a[1],Math.sin(ang)*r*a[1]*.55+(i<2?-r*.2:r*.2));g.stroke();});
    let gr=g.createRadialGradient(-r*.35,-r*.4,r*.05,0,0,r);gr.addColorStop(0,'#FFFFFF');gr.addColorStop(.25,'#DDE3EA');gr.addColorStop(.65,'#8A949F');gr.addColorStop(1,'#2A2F36');
    g.fillStyle=gr;g.beginPath();g.arc(0,0,r,0,7);g.fill();
    g.strokeStyle='rgba(40,46,54,.6)';g.lineWidth=Math.max(.6,r*.05);g.beginPath();g.ellipse(0,0,r*.28,r,0,0,7);g.stroke();
    g.fillStyle='rgba(255,255,255,.85)';g.beginPath();g.ellipse(-r*.38,-r*.42,r*.18,r*.1,-.6,0,7);g.fill();
    g.restore();
  }
  function station(x,y,r,rot){
    g.save();g.translate(x,y);
    g.strokeStyle='rgba(234,214,160,.85)';g.lineWidth=r*.12;g.beginPath();g.ellipse(0,0,r*1.9,r*.6,0,0,7);g.stroke();
    g.strokeStyle='rgba(234,214,160,.35)';g.lineWidth=r*.04;for(let i=0;i<8;i++){const a=i/8*Math.PI*2+rot;g.beginPath();g.moveTo(0,0);g.lineTo(Math.cos(a)*r*1.9,Math.sin(a)*r*.6);g.stroke();}
    for(let i=0;i<24;i++){const a=i/24*Math.PI*2+rot;g.fillStyle=Math.sin(a)>0?'rgba(255,236,190,.95)':'rgba(255,236,190,.4)';g.fillRect(Math.cos(a)*r*1.9-1.2,Math.sin(a)*r*.6-1.2,2.4,2.4);}
    g.fillStyle='#C9CED6';g.fillRect(-r*.08,-r*1.6,r*.16,r*3.2);
    const gr=g.createRadialGradient(0,0,0,0,0,r*.5);gr.addColorStop(0,'#FFF3D6');gr.addColorStop(1,'rgba(230,179,77,.2)');g.fillStyle=gr;g.beginPath();g.arc(0,0,r*.45,0,7);g.fill();
    g.restore();
  }
  function cover(img,iw,ih,s,ox,oy){g.drawImage(img,(W-iw*s)/2+ox,(H-ih*s)/2+oy,iw*s,ih*s);}

  /* ---------------- 七个镜头：p 为本镜头进度（0→1），T 为全局时钟（毫秒） ---------------- */
  const SHOTS=[
    /* 1957：夜半球上空，一颗金属球滑过，嘀——嘀 */
    function(p,T,t){
      cover(A.stars,W*1.3,H*1.3,1,-W*.08*p,0);
      const s=lerp(1,1.08,ez(p)),lx=-W*.1-W*.05*p,ly=H-A.limbH*s+H*.02;g.drawImage(A.limb,lx,ly,W*1.2*s,A.limbH*s);
      const fx=lx+A.sunX*s,fy=ly+A.sunY*s,fr=Math.min(W,H)*(.12+.03*Math.sin(T*.001));g.save();g.globalCompositeOperation='lighter';
      const fg=g.createRadialGradient(fx,fy,0,fx,fy,fr);fg.addColorStop(0,'rgba(255,240,210,.8)');fg.addColorStop(.25,'rgba(255,190,110,.25)');fg.addColorStop(1,'rgba(255,150,80,0)');g.fillStyle=fg;g.beginPath();g.arc(fx,fy,fr,0,7);g.fill();g.restore();
      const r=Math.max(7,Math.min(W,H)*.042),x=lerp(-W*.05,W*.78,p),y=lerp(H*.42,H*.36,p);
      const ph=(t-400)%600;if(ph>0&&ph<600){const k=ph/600;g.strokeStyle='rgba(180,220,255,'+(.35*(1-k)).toFixed(2)+')';g.lineWidth=1.2;g.beginPath();g.arc(x,y,r*(1.5+k*6),0,7);g.stroke();}
      sputnik(x,y,r,-.08+Math.sin(T*.0006)*.04);
    },
    /* 六十多年后：轨道越来越挤 */
    function(p,T){
      cover(A.stars,W*1.3,H*1.3,1,W*.04*p,0);
      const s=lerp(1.15,1,ez(p)),ex=W*.5,ey=H*.78,er=A.er*s;
      g.drawImage(A.earth,ex-er*1.3,ey-er*1.3,er*2.6,er*2.6);
      const n=Math.floor(lerp(20,360,ez(Math.min(1,p*1.3)))),R=rng(5);
      g.lineWidth=1;
      for(let i=0;i<n;i++){const k=1.08+R()*.9,tilt=(R()-.5)*1.2,sp=(R()<.5?1:-1)*(.00008+R()*.00016)*(2.2-k),a=T*sp+R()*7;
        const ox=Math.cos(a)*er*k,oy=Math.sin(a)*er*k*.32,x=ex+ox*Math.cos(tilt)-oy*Math.sin(tilt),y=ey+ox*Math.sin(tilt)+oy*Math.cos(tilt);
        if(Math.sin(a)<0&&Math.hypot(x-ex,y-ey)<er)continue;
        if(i%9===0){g.strokeStyle='rgba(95,169,255,.08)';g.beginPath();g.ellipse(ex,ey,er*k,er*k*.32,tilt,0,7);g.stroke();}
        g.fillStyle=i%23===0?'rgba(255,120,100,.9)':'rgba(200,225,255,.85)';g.fillRect(x-1,y-1,2,2);}
    },
    /* 月面挖冰：两家的界线叠在了一起 */
    function(p,T){
      g.drawImage(A.stars,-W*.1,-H*.1,W*1.3,H*1.3);
      g.drawImage(A.earthS,W*.22-A.er3*1.4,H*.2-A.er3*1.4,A.er3*2.8,A.er3*2.8);
      const ox=-W*.25*ez(p);g.drawImage(A.moon,ox-W*.05,H*.5,W*1.4,A.moonH);
      [[.45,'rgba(255,110,90,'],[.78,'rgba(110,180,255,']].forEach(function(r,i){
        const bx=ox+W*r[0],by=H*.62;
        const u=Math.min(W,H)*.05,dir=i?-1:1,sw=Math.sin(T*.0016+i*2);
        g.fillStyle='#202227';g.beginPath();g.ellipse(bx,by,u*1.3,u*.28,0,0,7);g.fill();
        g.fillStyle='#2C2F36';g.fillRect(bx-u*.9,by-u*.75,u*1.5,u*.6);g.fillStyle='#3A3E47';g.fillRect(bx-u*.55*dir-u*.25,by-u*1.25,u*.7,u*.55);
        g.fillStyle='rgba(255,214,140,.9)';g.fillRect(bx-u*.4*dir-u*.1,by-u*1.1,u*.22,u*.12);
        g.strokeStyle='#2C2F36';g.lineCap='round';g.lineWidth=u*.22;g.beginPath();const ax=bx+u*.5*dir,ay=by-u*.7,ex=ax+u*1.5*dir,ey=ay-u*.9+sw*u*.15,qx=ex+u*.6*dir,qy=by-u*.15+sw*u*.1;
        g.moveTo(ax,ay);g.lineTo(ex,ey);g.lineTo(qx,qy);g.stroke();g.fillStyle='#2C2F36';g.beginPath();g.moveTo(qx-u*.25*dir,qy-u*.2);g.lineTo(qx+u*.3*dir,qy);g.lineTo(qx,qy+u*.2);g.fill();
        const bl=(Math.floor(T/500)+i)%2;g.fillStyle=bl?r[1]+'1)':r[1]+'.3)';g.beginPath();g.arc(bx-u*.2*dir,by-u*1.32,u*.07,0,7);g.fill();
        for(let k=0;k<14;k++){const q=((T*.0005+k/14)%1);g.fillStyle='rgba(220,220,210,'+(.3*(1-q)).toFixed(2)+')';g.beginPath();g.arc(bx+u*2.6*dir+Math.sin(k*3)*q*u*1.2,by-q*u*1.8,2+q*u*.3,0,7);g.fill();}
        g.setLineDash([6,6]);g.strokeStyle=r[1]+'.75)';g.lineWidth=1.5;g.beginPath();g.ellipse(bx,by+H*.06,W*.2,H*.07,0,0,7);g.stroke();g.setLineDash([]);
      });
      const k=.25+.2*Math.sin(T*.006);g.fillStyle='rgba(255,80,60,'+(k*Math.min(1,p*3)).toFixed(2)+')';g.beginPath();g.ellipse(ox+W*.615,H*.68,W*.04,H*.045,0,0,7);g.fill();
    },
    /* 有时候，天上的东西会掉下来 */
    function(p,T){
      const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#05081A');gr.addColorStop(.6,'#1B2350');gr.addColorStop(1,'#4A3A60');g.fillStyle=gr;g.fillRect(0,0,W,H);
      g.globalAlpha=.6;g.drawImage(A.stars,0,0,W*1.3,H*.6);g.globalAlpha=1;
      const hz=g.createLinearGradient(0,H*.5,0,H*.66);hz.addColorStop(0,'rgba(255,140,90,0)');hz.addColorStop(1,'rgba(255,140,90,.35)');g.fillStyle=hz;g.fillRect(0,H*.5,W,H*.16);
      g.drawImage(A.clouds,-W*.15*p,H*.56,W*1.4,H*.5);
      const x=lerp(W*.1,W*.85,ez(p)),y=lerp(H*.08,H*.62,ez(p)),dx=W*.75,dy=H*.54,len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len;
      g.save();g.globalCompositeOperation='lighter';
      for(let i=0;i<5;i++){const L=Math.min(W,H)*(.22+i*.06),gg=g.createLinearGradient(x,y,x-ux*L,y-uy*L);gg.addColorStop(0,'rgba(255,220,160,'+(.55-i*.08)+')');gg.addColorStop(1,'rgba(255,90,40,0)');
        g.strokeStyle=gg;g.lineWidth=(14-i*2.4)*(Math.min(W,H)/600);g.lineCap='round';g.beginPath();g.moveTo(x,y);g.lineTo(x-ux*L,y-uy*L);g.stroke();}
      const R=rng(Math.floor(T/60));for(let i=0;i<10;i++){const b=R()*Math.min(W,H)*.25;g.fillStyle='rgba(255,'+(150+R()*90|0)+',80,'+(R()*.8).toFixed(2)+')';g.fillRect(x-ux*b+(R()-.5)*20,y-uy*b+(R()-.5)*20,2,2);}
      const hg=g.createRadialGradient(x,y,0,x,y,Math.min(W,H)*.05);hg.addColorStop(0,'rgba(255,255,240,1)');hg.addColorStop(.3,'rgba(255,200,120,.8)');hg.addColorStop(1,'rgba(255,120,60,0)');g.fillStyle=hg;g.beginPath();g.arc(x,y,Math.min(W,H)*.05,0,7);g.fill();
      g.restore();
    },
    /* 掉在谁的土地上，谁来赔？ */
    function(p,T){
      g.drawImage(A.snow,-W*.25*ez(p),0,W*1.3,H);
      const ox=-W*.25*ez(p),R=rng(3);
      const u=Math.min(W,H)/100;
      for(let i=0;i<18;i++){const x=ox+W*(.12+i*.055)+R()*W*.02,y=H*(.8+i*.007)+R()*H*.012,f=.5+.5*Math.sin(T*.004+i*1.7),sz=u*(.5+R()*.9);
        if(i%3===0){for(let k=0;k<6;k++){const q=((T*.00035+k/6+i*.13)%1);g.fillStyle='rgba(70,60,90,'+(.22*(1-q)).toFixed(2)+')';g.beginPath();g.arc(x+q*u*5,y-q*u*16,u*(.8+q*2.6),0,7);g.fill();}}
        const hg=g.createRadialGradient(x,y,0,x,y,sz*4);hg.addColorStop(0,'rgba(255,170,90,'+(.55*f+.2).toFixed(2)+')');hg.addColorStop(1,'rgba(255,120,60,0)');g.fillStyle=hg;g.beginPath();g.arc(x,y,sz*4,0,7);g.fill();
        g.fillStyle='#2B2230';g.save();g.translate(x,y);g.rotate(i);g.fillRect(-sz,-sz*.5,sz*2,sz);g.restore();
        g.fillStyle='rgba(255,'+(150+R()*60|0)+',90,'+(.6+.4*f).toFixed(2)+')';g.fillRect(x-sz*.4,y-sz*.3,sz*.8,sz*.6);}
    },
    /* 太空里没有警察，也没有法院 */
    function(p,T){
      cover(A.neb,W*1.3,H*1.3,1,0,H*.06*(1-ez(p))-H*.03);
      station(W*.5,lerp(H*.5,H*.44,ez(p)),Math.min(W,H)*lerp(.09,.11,p),T*.00018);
    },
    /* 2077，星海仲裁院 */
    function(p,T){
      const s=lerp(1,1.08,ez(p));g.save();g.translate(W/2,H/2);g.scale(s,s);g.translate(-W/2,-H/2);
      g.fillStyle='#0B0E18';g.fillRect(0,0,W,H);
      const wx=W*.5,wy=H*.52,ww=Math.min(W*.86,H*1.2),wh=Math.min(H*.62,ww*.62);
      g.save();g.beginPath();g.moveTo(wx-ww/2,wy+wh/2);g.lineTo(wx-ww/2,wy-wh*.2);g.quadraticCurveTo(wx-ww/2,wy-wh/2,wx,wy-wh/2);g.quadraticCurveTo(wx+ww/2,wy-wh/2,wx+ww/2,wy-wh*.2);g.lineTo(wx+ww/2,wy+wh/2);g.closePath();g.clip();
      g.drawImage(A.stars,wx-ww/2,wy-wh/2,ww*1.2,wh*1.2);g.drawImage(A.limb,wx-ww*.62,wy+wh/2-A.limbH*.55,ww*1.2,A.limbH*.62);
      g.restore();
      g.strokeStyle='rgba(230,190,110,.85)';g.lineWidth=3;g.beginPath();g.moveTo(wx-ww/2,wy+wh/2);g.lineTo(wx-ww/2,wy-wh*.2);g.quadraticCurveTo(wx-ww/2,wy-wh/2,wx,wy-wh/2);g.quadraticCurveTo(wx+ww/2,wy-wh/2,wx+ww/2,wy-wh*.2);g.lineTo(wx+ww/2,wy+wh/2);g.stroke();
      g.lineWidth=1.5;g.strokeStyle='rgba(230,190,110,.4)';for(let i=1;i<4;i++){g.beginPath();g.moveTo(wx-ww/2+ww*i/4,wy-wh*.45);g.lineTo(wx-ww/2+ww*i/4,wy+wh/2);g.stroke();}
      g.fillStyle='#121726';g.fillRect(0,wy+wh/2,W,H);
      const bw=ww*.8,by=wy+wh*.38;g.fillStyle='#1A1F30';g.fillRect(wx-bw/2,by,bw,wh*.2);g.fillStyle='rgba(230,190,110,.6)';g.fillRect(wx-bw/2,by,bw,2);
      [-1,0,1].forEach(function(k){const cx=wx+k*bw*.3,ch=wh*(k?.24:.3);g.fillStyle='#0E1220';g.beginPath();g.moveTo(cx-bw*.06,by);g.lineTo(cx-bw*.06,by-ch*.8);g.quadraticCurveTo(cx,by-ch*1.05,cx+bw*.06,by-ch*.8);g.lineTo(cx+bw*.06,by);g.fill();});
      const lg=g.createRadialGradient(wx,wy+wh*.5,0,wx,wy+wh*.5,ww*.6);lg.addColorStop(0,'rgba(255,200,120,.18)');lg.addColorStop(1,'rgba(255,200,120,0)');g.fillStyle=lg;g.fillRect(0,0,W,H);
      g.restore();
    }
  ];

  function frame(now){
    if(!on){raf=0;return;}raf=requestAnimationFrame(frame);
    const dt=Math.min(50,now-(last||now));last=now;if(!paused)clock+=dt;
    if(paused)return;
    g.setTransform(D,0,0,D,0,0);g.globalAlpha=1;g.globalCompositeOperation='source-over';
    g.fillStyle='#000';g.fillRect(0,0,W,H);
    const fk=prev>=0?Math.min(1,(clock-fadeT)/900):1;
    if(prev>=0&&fk<1){g.globalAlpha=1;SHOTS[prev](Math.min(1.15,(clock-tPrev)/durPrev),clock,clock-tPrev);}
    if(cur>=0){g.globalAlpha=prev>=0?fk:1;SHOTS[cur](Math.min(1.15,(clock-tCur)/durCur),clock,clock-tCur);g.globalAlpha=1;}
    if(fk>=1)prev=-1;
  }
  function size(){D=Math.min(window.devicePixelRatio||1,1.5);W=innerWidth;H=innerHeight;cv.width=Math.round(W*D);cv.height=Math.round(H*D);build();}
  return {
    start(){cv=byId('introCv');g=cv.getContext('2d');size();on=true;clock=0;last=0;cur=-1;prev=-1;cv.classList.add('on');if(!raf)raf=requestAnimationFrame(frame);
      addEventListener('resize',Film._rz);},
    show(i,ms,cut){if(cur>=0&&!cut){prev=cur;tPrev=tCur;durPrev=durCur;fadeT=clock;}else prev=-1;cur=i;tCur=clock;durCur=ms||6000;},
    pause(b){paused=!!b;},
    stop(){on=false;if(cv)cv.classList.remove('on');removeEventListener('resize',Film._rz);},
    _rz(){if(on)size();},
    count:7
  };
})();
