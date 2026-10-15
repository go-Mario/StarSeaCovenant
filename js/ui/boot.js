"use strict";
/* 开机页上半部分的“照片”：地球边缘的日出，一颗小卫星慢慢划过。
   用暖色调和颗粒模拟老照片，和下面的米色纸面拼成一张海报。 */
(function(){
  const cv=byId('bootCv');if(!cv)return;
  const cx=cv.getContext('2d');let W=0,H=0,stars=null,on=true,t0=performance.now();
  function fit(){const d=Math.min(window.devicePixelRatio||1,2);W=cv.clientWidth;H=cv.clientHeight;cv.width=Math.round(W*d);cv.height=Math.round(H*d);cx.setTransform(d,0,0,d,0,0);
    stars=document.createElement('canvas');stars.width=W;stars.height=H;const s=stars.getContext('2d');const R=rng(9);
    for(let i=0;i<260;i++){s.fillStyle='rgba(255,246,228,'+(R()*.7+.15).toFixed(2)+')';s.beginPath();s.arc(R()*W,R()*H*.75,R()<.05?1.5:R()*.8+.3,0,7);s.fill();}}
  function draw(t){
    if(!on)return;requestAnimationFrame(draw);if(!W)fit();
    const k=(t-t0)/1000;
    const g=cx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0C1222');g.addColorStop(.62,'#1F2C4A');g.addColorStop(.86,'#7A5A4A');g.addColorStop(1,'#E9A35B');
    cx.fillStyle=g;cx.fillRect(0,0,W,H);cx.drawImage(stars,0,0,W,H);
    /* 地球弧线与大气 */
    const R=Math.max(W,H)*1.6,ex=W*.5,ey=H+R*.86;
    const atm=cx.createRadialGradient(ex,ey,R*.98,ex,ey,R*1.05);atm.addColorStop(0,'rgba(120,180,255,.0)');atm.addColorStop(.4,'rgba(140,200,255,.55)');atm.addColorStop(.7,'rgba(255,190,120,.35)');atm.addColorStop(1,'rgba(255,190,120,0)');
    cx.fillStyle=atm;cx.beginPath();cx.arc(ex,ey,R*1.05,0,7);cx.fill();
    const eg=cx.createRadialGradient(ex-R*.1,ey-R,R*.1,ex,ey,R);eg.addColorStop(0,'#3F6FA8');eg.addColorStop(.3,'#1E3E6E');eg.addColorStop(1,'#0A1426');
    cx.fillStyle=eg;cx.beginPath();cx.arc(ex,ey,R,0,7);cx.fill();
    /* 日出 */
    const sx=W*.72,sy=ey-R*.995;const sg=cx.createRadialGradient(sx,sy,0,sx,sy,W*.5);sg.addColorStop(0,'rgba(255,240,205,.95)');sg.addColorStop(.08,'rgba(255,200,130,.6)');sg.addColorStop(1,'rgba(255,170,100,0)');
    cx.fillStyle=sg;cx.fillRect(0,0,W,H);
    /* 小卫星 */
    const px=((k*14)%(W+120))-60,py=H*.32+Math.sin(px/W*3.1)*-18;
    cx.fillStyle='#E9DDC2';cx.beginPath();cx.arc(px,py,3.2,0,7);cx.fill();
    cx.strokeStyle='rgba(233,221,194,.8)';cx.lineWidth=1;cx.beginPath();cx.moveTo(px,py);cx.lineTo(px-14,py+9);cx.moveTo(px,py);cx.lineTo(px-10,py+12);cx.stroke();
    if(Math.floor(k*1.6)%2===0){cx.strokeStyle='rgba(255,220,170,.4)';cx.beginPath();cx.arc(px,py,8+(k*30)%10,0,7);cx.stroke();}
  }
  addEventListener('resize',function(){W=0;});
  requestAnimationFrame(draw);
  const boot=byId('boot');
  new MutationObserver(function(){if(boot.classList.contains('off'))on=false;}).observe(boot,{attributes:true,attributeFilter:['class']});
})();
