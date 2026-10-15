// 离线验证登月三关：一个“还算会开”的自动驾驶在不同屏幕、不同地形下能否落稳
const fs=require('fs');const src=fs.readFileSync(require('path').resolve(__dirname,'../../js/games')+'/lander.js','utf8');
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function rng(seed){let s=(seed>>>0)||1;return function(){s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
const LV=eval('('+src.match(/const LV=(\[[\s\S]*?\]);\n  let stopF/)[1]+')');
const terrain=eval('('+src.match(/function terrain\(W,H,L,R\)\{[\s\S]*?\n  \}/)[0]+')');
function groundY(T,x){const p=T.pts;for(let i=0;i<p.length-1;i++){if(x>=p[i].x&&x<=p[i+1].x){const k=(x-p[i].x)/(p[i+1].x-p[i].x);return p[i].y+(p[i+1].y-p[i].y)*k;}}return p[p.length-1].y;}
function fly(W,H,lvI,seedPlays){
  const L=LV[lvI],R=rng(7+lvI*13+(seedPlays%5)),T=terrain(W,H,L,R);
  const sc=clamp(H/700,.55,1.4),G=24*sc,TH=60*sc,ROT=2.4,VY=44*sc,VX=26*sc,pc0=(T.padX0+T.padX1)/2;
  const s={x:clamp(pc0-Math.sign(L.vx)*Math.min(W*.3,260*sc),30,W-30),y:H*.12,vx:L.vx*sc,vy:0,a:0,fuel:L.fuel};
  const pc=(T.padX0+T.padX1)/2;const dt=1/60;let t=0;
  if(process.env.TR)console.log("pad",T.padX0.toFixed(0),T.padX1.toFixed(0),T.padY.toFixed(0),"start",s.x.toFixed(0),s.y.toFixed(0),"vx",s.vx);let fr=0;
  while(t<60){t+=dt;if(process.env.TR&&(fr++%20===0))console.log(t.toFixed(1),"x",s.x.toFixed(0),"y",s.y.toFixed(0),"vx",s.vx.toFixed(1),"vy",s.vy.toFixed(1),"a",s.a.toFixed(2),"f",s.fuel.toFixed(0));
    const gy=groundY(T,s.x),alt=gy-s.y-16,dx=pc-s.x;
    const vxd=clamp(dx*.35,-50*sc,50*sc),err=vxd-s.vx;
    let ad=0,hz=false;
    if(Math.abs(err)>8*sc&&alt>110*sc){ad=Math.sign(err)*.7;hz=Math.abs(s.a-ad)<.12;}
    else ad=clamp(err*.01/sc,-.15,.15);
    if(alt<35*sc)ad=0;
    const left=s.a>ad+.02,right=s.a<ad-.02;
    const dec=TH*Math.cos(s.a)-G,need=s.vy>0?(s.vy*s.vy-(30*sc)*(30*sc))/(2*Math.max(dec,1)):-1;
    let thrust=hz||(need>alt-20*sc&&s.vy>22*sc);
    thrust=thrust&&s.fuel>0;
    if(left)s.a-=ROT*dt;if(right)s.a+=ROT*dt;s.a=clamp(s.a,-1.4,1.4);
    s.vy+=G*dt;if(thrust){s.vx+=Math.sin(s.a)*TH*dt;s.vy-=Math.cos(s.a)*TH*dt;s.fuel=Math.max(0,s.fuel-14*dt);}
    s.x+=s.vx*dt;s.y+=s.vy*dt;
    if(s.x<10){s.x=10;s.vx=Math.abs(s.vx)*.3;}if(s.x>W-10){s.x=W-10;s.vx=-Math.abs(s.vx)*.3;}
    const g2=groundY(T,s.x);
    if(s.y+16>=g2){const onPad=s.x-10>=T.padX0&&s.x+10<=T.padX1;const ok=onPad&&s.vy<VY&&Math.abs(s.vx)<VX&&Math.abs(s.a)<.22;
      return ok?'ok':(!onPad?'miss':s.vy>=VY?'fast':Math.abs(s.vx)>=VX?'side':'tilt')+'(fuel '+s.fuel.toFixed(0)+')';}
  }
  return 'timeout';
}
if(process.env.TR){console.log(fly(390,844,0,1));process.exit();}
for(const [n,W,H] of [['phone',390,844],['desk',1280,760],['land',844,390]]){
  for(let lv=0;lv<3;lv++){const r=[];for(let sp=0;sp<5;sp++)r.push(fly(W,H,lv,sp));console.log(n,lv,LV[lv].name,r.join(' '));}
}
