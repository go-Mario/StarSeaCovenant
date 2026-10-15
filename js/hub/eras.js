"use strict";
/* =====================================================================
   长卷五个时代的背景插画
   e1 仰望：复古纸张、网点太阳、刻线山丘
   e2 出发：卡通明快色，蓝天白云绿草地
   e3 拥挤：科技蓝，网格与密密麻麻的轨道
   e4 开拓：扁平分层的黄昏群山，过渡到月面
   e5 远望：写实深空（银河、星云、黑洞用画布实时绘制）
   每张图高 900，宽度 VW 按屏幕上这一段长卷的实际比例生成，
   宽屏不会被裁掉天空，竖屏也不会被压扁。
   ===================================================================== */
const ERA_ART=(function(){
  function svg(VW,inner){return '<svg class="era-svg" viewBox="0 0 '+VW+' 900" preserveAspectRatio="xMidYMax slice">'+inner+'</svg>';}
  function dots(seed,n,x0,y0,x1,y1,r,col){const R=rng(seed);let s='';for(let i=0;i<n;i++)s+='<circle cx="'+(x0+R()*(x1-x0)).toFixed(0)+'" cy="'+(y0+R()*(y1-y0)).toFixed(0)+'" r="'+(R()*(r||1.4)+.3).toFixed(2)+'" fill="'+(col||'#fff')+'" opacity="'+(R()*.6+.2).toFixed(2)+'"/>';return s;}
  /* 一条横贯全宽的起伏地平线 */
  function ridge(VW,seed,y,amp,step,col,jag){
    const R=rng(seed);let d='M0 900 L0 '+y;
    for(let x=0;x<=VW+step;x+=step){const yy=y+(R()-.5)*amp*2;d+=jag?(' L'+x.toFixed(0)+' '+yy.toFixed(0)):(' Q'+(x-step/2).toFixed(0)+' '+(yy+(R()-.5)*amp).toFixed(0)+' '+x.toFixed(0)+' '+yy.toFixed(0));}
    return '<path d="'+d+' L'+VW+' 900 Z" fill="'+col+'"/>';
  }
  function lay(d,inner){return '<div class="lay" data-d="'+d+'">'+inner+'</div>';}
  const A={};
  /* ---- 1957–1969 · 复古 ---- */
  A.e1=function(VW){
    let far='<defs><linearGradient id="e1sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EFE3C8"/><stop offset=".7" stop-color="#E6CFA2"/><stop offset="1" stop-color="#D9B57E"/></linearGradient>'+
      '<pattern id="e1dot" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="2.6" fill="#C8492F"/></pattern>'+
      '<radialGradient id="e1fade"><stop offset=".55" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>';
    const sx=VW*.72;
    far+='<rect width="'+VW+'" height="900" fill="url(#e1sky)"/><mask id="e1m"><circle cx="'+sx+'" cy="300" r="190" fill="url(#e1fade)"/></mask>';
    far+='<circle cx="'+sx+'" cy="300" r="190" fill="url(#e1dot)" mask="url(#e1m)" opacity=".85"/>';
    far+='<g fill="none" stroke="#9A7A4C" stroke-width="1.2" opacity=".5">';for(let i=0;i<14;i++)far+='<path d="M0 '+(560+i*6)+' C'+(VW*.25)+' '+(520+i*6)+' '+(VW*.5)+' '+(600+i*6)+' '+VW+' '+(540+i*6)+'"/>';far+='</g>';
    far+=ridge(VW,3,600,26,240,'#C9A570');
    let mid='<g opacity=".9"><ellipse cx="'+(VW*.36)+'" cy="250" rx="'+Math.min(300,VW*.22)+'" ry="70" fill="none" stroke="#7A5A34" stroke-width="1.6" stroke-dasharray="6 8" transform="rotate(-12 '+(VW*.36)+' 250)"/>'+
      '<g transform="translate('+(VW*.36+Math.min(300,VW*.22)*.85)+' 205)"><circle r="16" fill="#B8BCC0" stroke="#4A3A28" stroke-width="2"/><path d="M-10 6 L-60 46 M-4 12 L-30 70 M8 10 L40 60 M12 2 L70 30" stroke="#4A3A28" stroke-width="2"/></g></g>';
    mid+=ridge(VW,5,690,22,260,'#B48A55');
    mid+='<g fill="none" stroke="#7A5A34" stroke-width="1" opacity=".45">';for(let i=0;i<9;i++)mid+='<path d="M0 '+(735+i*14)+' C'+(VW*.2)+' '+(705+i*14)+' '+(VW*.45)+' '+(725+i*14)+' '+VW+' '+(690+i*14)+'"/>';mid+='</g>';
    let near='';
    const pads=Math.max(1,Math.round(VW/1400));
    for(let k=0;k<pads;k++){const x=VW*(.12+k*.9/pads);
      near+='<g transform="translate('+x+' 690)"><path d="M-4 0 L-4 -230 M34 0 L34 -230 M-4 -40 L34 -70 M-4 -100 L34 -130 M-4 -160 L34 -190" stroke="#3A2C1E" stroke-width="5" fill="none"/>'+
      '<path d="M60 0 L60 -200 C60 -240 80 -262 90 -270 C100 -262 120 -240 120 -200 L120 0 Z" fill="#EFE3C8" stroke="#3A2C1E" stroke-width="4"/><path d="M60 -60 L40 0 L60 0 Z M120 -60 L140 0 L120 0 Z" fill="#B8362B" stroke="#3A2C1E" stroke-width="3"/><circle cx="90" cy="-150" r="10" fill="#5FA9FF" stroke="#3A2C1E" stroke-width="3"/></g>';}
    near+='<g transform="translate('+(VW*.86)+' 700)"><path d="M-70 0 A70 70 0 0 1 70 0 Z" fill="#E9DDC2" stroke="#3A2C1E" stroke-width="4"/><path d="M-12 -70 L50 -110" stroke="#3A2C1E" stroke-width="10"/><rect x="-80" y="0" width="160" height="60" fill="#D9C39A" stroke="#3A2C1E" stroke-width="4"/></g>';
    near+=ridge(VW,7,800,14,300,'#8E6A3E');
    return lay(.2,svg(VW,far))+lay(.5,svg(VW,mid))+lay(.85,svg(VW,near));
  };
  /* ---- 1970–1999 · 卡通 ---- */
  A.e2=function(VW){
    let far='<defs><linearGradient id="e2sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5E9BE0"/><stop offset=".6" stop-color="#A9D0F2"/><stop offset="1" stop-color="#E9F2E4"/></linearGradient></defs>';
    far+='<rect width="'+VW+'" height="900" fill="url(#e2sky)"/><circle cx="'+(VW*.82)+'" cy="180" r="70" fill="#FFE7A0"/><circle cx="'+(VW*.82)+'" cy="180" r="110" fill="#FFE7A0" opacity=".25"/>';
    function cloud(x,y,s){return '<g transform="translate('+x+' '+y+') scale('+s+')" class="cloud"><ellipse cx="0" cy="0" rx="70" ry="30" fill="#fff"/><ellipse cx="-50" cy="8" rx="44" ry="24" fill="#fff"/><ellipse cx="50" cy="10" rx="50" ry="22" fill="#fff"/><ellipse cx="10" cy="-18" rx="40" ry="28" fill="#fff"/><ellipse cx="0" cy="14" rx="110" ry="14" fill="#DDE9F5"/></g>';}
    const R=rng(2);for(let x=120;x<VW;x+=420+R()*260)far+=cloud(x,110+R()*170,.7+R()*.6);
    /* 旅行者号：碟形天线 + 机身 + 长杆 */
    far+='<g transform="translate('+(VW*.42)+' 290) rotate(-10)"><path d="M-40 -2 L60 -2" stroke="#2A2A2A" stroke-width="2"/><rect x="-12" y="-9" width="24" height="16" fill="#E9C46A" stroke="#2A2A2A" stroke-width="2"/>'+
      '<ellipse cx="0" cy="-22" rx="26" ry="9" fill="#fff" stroke="#2A2A2A" stroke-width="2.5"/><path d="M0 -22 L0 -9" stroke="#2A2A2A" stroke-width="2"/><circle cx="60" cy="-2" r="4" fill="#2A2A2A"/><path d="M-40 -2 L-50 18 M-40 -2 L-56 -10" stroke="#2A2A2A" stroke-width="2"/></g>';
    let mid=ridge(VW,11,560,40,300,'#8CC56A')+ridge(VW,13,630,30,320,'#6BAA4A');
    mid+='<path d="M'+(VW*.45)+' 650 C'+(VW*.6)+' 620 '+(VW*.75)+' 640 '+VW+' 610 L'+VW+' 900 L'+(VW*.45)+' 900 Z" fill="#E2C14A"/>';
    for(let x=100;x<VW;x+=210+R()*120){const y=600+R()*40;mid+='<g transform="translate('+x.toFixed(0)+' '+y.toFixed(0)+')"><rect x="-4" y="-10" width="8" height="40" fill="#6A4A2A"/><circle cy="-30" r="34" fill="#3F8A3E"/><circle cx="-18" cy="-18" r="22" fill="#4E9E48"/><circle cx="16" cy="-40" r="20" fill="#5CAE52"/></g>';}
    let near='<g transform="translate('+(VW*.74)+' 760)"><path d="M-60 0 A60 60 0 0 1 60 0 Z" fill="#F3EDE1" stroke="#2A2A2A" stroke-width="3"/><path d="M-60 0 L60 0 L60 60 L-60 60 Z" fill="#E8775A" stroke="#2A2A2A" stroke-width="3"/><rect x="-10" y="20" width="20" height="40" fill="#2A2A2A"/><path d="M-10 -56 L10 -56 L10 -40 L-10 -40 Z" fill="#2A2A2A"/></g>';
    near+=ridge(VW,17,790,16,280,'#4E8F3E');
    for(let x=10;x<VW;x+=41){const h=10+(x*7)%14;near+='<path d="M'+x+' 850 L'+(x+4)+' '+(850-h)+' L'+(x+8)+' 850 Z" fill="#3F7A45"/>';}
    return lay(.15,svg(VW,far))+lay(.5,svg(VW,mid))+lay(.9,svg(VW,near));
  };
  /* ---- 2000–2029 · 科技蓝 ---- */
  A.e3=function(VW){
    let far='<defs><linearGradient id="e3sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#06122E"/><stop offset=".55" stop-color="#0E2A66"/><stop offset="1" stop-color="#1E4FA8"/></linearGradient>'+
      '<radialGradient id="e3earth" cx=".5" cy="0" r=".9"><stop offset="0" stop-color="#5FA9FF"/><stop offset=".25" stop-color="#2F6FE4"/><stop offset=".7" stop-color="#0E2A66"/><stop offset="1" stop-color="#06122E"/></radialGradient></defs>';
    far+='<rect width="'+VW+'" height="900" fill="url(#e3sky)"/>'+dots(31,Math.round(VW/9),0,0,VW,600,1.2,'#CFE3FF');
    far+='<g stroke="#3CC7E6" stroke-width="1" opacity=".16">';for(let x=0;x<=VW;x+=100)far+='<path d="M'+x+' 0 L'+x+' 900"/>';for(let j=0;j<=9;j++)far+='<path d="M0 '+(j*100)+' L'+VW+' '+(j*100)+'"/>';far+='</g>';
    const ex=VW/2,ery=1000,erx=Math.max(VW*.8,1300);
    let mid='<ellipse cx="'+ex+'" cy="1650" rx="'+erx+'" ry="'+ery+'" fill="url(#e3earth)"/><ellipse cx="'+ex+'" cy="1650" rx="'+erx+'" ry="'+ery+'" fill="none" stroke="#9FD3FF" stroke-width="6" opacity=".6"/>';
    ['#5FA9FF','#3CC7E6','#F6C35B','#5FA9FF','#3CC7E6'].forEach(function(c,i){mid+='<ellipse cx="'+ex+'" cy="1650" rx="'+(erx+40+i*40)+'" ry="'+(ery+40+i*40)+'" fill="none" stroke="'+c+'" stroke-width="1.4" opacity=".32" stroke-dasharray="2 10"/>';});
    let near='<g class="sats">';const R=rng(5);for(let i=0;i<Math.round(VW/30);i++){const a=-Math.PI+.25+R()*(Math.PI-.5),x=ex+Math.cos(a)*(erx+60+R()*200),y=1650+Math.sin(a)*(ery+60+R()*200);if(y>760||y<40)continue;near+='<g transform="translate('+x.toFixed(0)+' '+y.toFixed(0)+')"><rect x="-3" y="-2" width="6" height="4" fill="#E6F0FF"/><rect x="-10" y="-1" width="5" height="2" fill="#5FA9FF"/><rect x="5" y="-1" width="5" height="2" fill="#5FA9FF"/></g>';}near+='</g>';
    near+='<g transform="translate('+(VW*.7)+' 330)"><circle r="40" fill="none" stroke="#FF6A52" stroke-width="2" class="blink"/><path d="M-12 -12 L12 12 M12 -12 L-12 12" stroke="#FF6A52" stroke-width="3"/><text x="52" y="6" font-family="monospace" font-size="18" fill="#FF8A72">CONJ · 2009-02-10</text></g>';
    return lay(.1,svg(VW,far))+lay(.45,svg(VW,mid))+lay(.8,svg(VW,near));
  };
  /* ---- 2030–2049 · 扁平分层（黄昏 → 月面） ---- */
  A.e4=function(VW){
    let far='<defs><linearGradient id="e4sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A2556"/><stop offset=".45" stop-color="#7A4A7A"/><stop offset=".72" stop-color="#E5795A"/><stop offset=".9" stop-color="#F6C35B"/></linearGradient>'+
      '<linearGradient id="e4moon" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#05060C" stop-opacity="0"/><stop offset=".55" stop-color="#05060C" stop-opacity="0"/><stop offset=".75" stop-color="#05060C" stop-opacity=".92"/><stop offset="1" stop-color="#05060C"/></linearGradient></defs>';
    far+='<rect width="'+VW+'" height="900" fill="url(#e4sky)"/><circle cx="'+(VW*.26)+'" cy="560" r="120" fill="#FFD38A"/><circle cx="'+(VW*.26)+'" cy="560" r="220" fill="#FFD38A" opacity=".18"/>';
    far+='<rect width="'+VW+'" height="900" fill="url(#e4moon)"/>'+dots(41,Math.round(VW/16),VW*.62,0,VW,500,1.2,'#fff');
    far+='<circle cx="'+(VW*.86)+'" cy="180" r="44" fill="#4C86D6"/><path d="M'+(VW*.86-40)+' 170 C'+(VW*.86-20)+' 150 '+(VW*.86+10)+' 160 '+(VW*.86+30)+' 150" stroke="#E9F2E4" stroke-width="7" fill="none" opacity=".7" stroke-linecap="round"/>';
    const cut=VW*.64;
    let mid='<clipPath id="e4l"><rect width="'+cut+'" height="900"/></clipPath><clipPath id="e4r"><rect x="'+(cut-60)+'" width="'+(VW-cut+60)+'" height="900"/></clipPath>';
    mid+='<g clip-path="url(#e4l)">'+ridge(VW,21,560,60,140,'#8A5A8A',true)+ridge(VW,23,640,40,160,'#5E3F6E',true)+'</g>';
    mid+='<g clip-path="url(#e4r)">'+ridge(VW,25,620,22,160,'#8E8B84')+'</g>';
    let near='<g clip-path="url(#e4l)">'+ridge(VW,27,720,30,180,'#3A2A4E',true);
    for(let x=80;x<cut-60;x+=170){near+='<path d="M'+x+' 760 L'+(x+26)+' 680 L'+(x+52)+' 760 Z" fill="#2A1E3E"/><path d="M'+(x+10)+' 740 L'+(x+26)+' 700 L'+(x+42)+' 740 Z" fill="#2A1E3E"/>';}
    near+='</g><g clip-path="url(#e4r)">'+ridge(VW,29,740,14,200,'#C9C6BD')+'<ellipse cx="'+(VW*.78)+'" cy="800" rx="90" ry="18" fill="#A9A69E"/><ellipse cx="'+(VW*.93)+'" cy="770" rx="50" ry="10" fill="#A9A69E"/></g>';
    near+='<g transform="translate('+(VW*.86)+' 720)"><rect x="-40" y="-36" width="80" height="36" rx="6" fill="#E9ECF0"/><rect x="-40" y="-36" width="80" height="8" fill="#E8775A"/><path d="M-30 -36 L-60 -90 L20 -100" stroke="#9AA3B2" stroke-width="5" fill="none"/><circle cx="20" cy="-100" r="5" fill="#E8775A" class="blink"/></g>';
    return lay(.15,svg(VW,far))+lay(.5,svg(VW,mid))+lay(.85,svg(VW,near));
  };
  /* ---- 2050– · 写实深空：画布 ---- */
  A.e5=function(){return '<canvas class="deep-cv"></canvas>';};
  return A;
})();

/* 深空画布：银河、星云、黑洞。只在可见时动画 */
const DeepSky=(function(){
  let cv,cx,stars=null,W=0,H=0,t0=performance.now(),on=false;
  function build(){
    const d=Math.min(window.devicePixelRatio||1,1.5);
    W=cv.clientWidth;H=cv.clientHeight;if(!W||!H)return false;
    cv.width=Math.round(W*d);cv.height=Math.round(H*d);cx.setTransform(d,0,0,d,0,0);
    stars=document.createElement('canvas');stars.width=W;stars.height=H;const s=stars.getContext('2d');
    const g=s.createLinearGradient(0,0,0,H);g.addColorStop(0,'#02030A');g.addColorStop(1,'#070B1C');s.fillStyle=g;s.fillRect(0,0,W,H);
    const R=rng(17);
    [['rgba(118,83,214,.30)',.25,.35,.42],['rgba(42,167,161,.22)',.62,.22,.36],['rgba(201,86,143,.18)',.45,.7,.3],['rgba(95,169,255,.16)',.85,.6,.32]].forEach(function(n){
      const r=Math.max(W,H)*n[3],gg=s.createRadialGradient(W*n[1],H*n[2],0,W*n[1],H*n[2],r);gg.addColorStop(0,n[0]);gg.addColorStop(1,'rgba(0,0,0,0)');s.fillStyle=gg;s.fillRect(0,0,W,H);});
    s.save();s.translate(W*.5,H*.42);s.rotate(-.42);
    for(let i=0;i<2600;i++){const x=(R()-.5)*W*1.8,y=(R()+R()+R()-1.5)*H*.12;s.fillStyle='rgba(235,235,255,'+(R()*.7+.1).toFixed(2)+')';const z=R()<.06?1.6:.9;s.fillRect(x,y,z,z);}
    const band=s.createLinearGradient(0,-H*.18,0,H*.18);band.addColorStop(0,'rgba(200,200,255,0)');band.addColorStop(.5,'rgba(220,210,240,.16)');band.addColorStop(1,'rgba(200,200,255,0)');
    s.fillStyle=band;s.fillRect(-W,-H*.18,W*2,H*.36);
    s.strokeStyle='rgba(3,4,10,.55)';s.lineWidth=H*.03;try{s.filter='blur(8px)';}catch(e){}s.beginPath();s.moveTo(-W,6);s.bezierCurveTo(-W*.3,-20,W*.2,24,W,-4);s.stroke();try{s.filter='none';}catch(e){}
    s.restore();
    for(let i=0;i<700;i++){const a=R();s.fillStyle='rgba('+(a<.1?'255,220,190':a<.2?'190,210,255':'255,255,255')+','+(R()*.8+.1).toFixed(2)+')';const r=R()<.03?1.8:R()*.9+.3;s.beginPath();s.arc(R()*W,R()*H,r,0,7);s.fill();}
    return true;
  }
  /* 写实感黑洞：后半盘面 → 黑影与被引力弯折的光环 → 前半盘面 */
  function blackHole(c,x,y,r,t){
    let g=c.createRadialGradient(x,y,r*.8,x,y,r*5);g.addColorStop(0,'rgba(255,190,120,.35)');g.addColorStop(1,'rgba(255,150,80,0)');c.fillStyle=g;c.beginPath();c.arc(x,y,r*5,0,7);c.fill();
    function disk(back){
      c.save();c.translate(x,y);
      const rx=r*3.4,ry=r*.55;
      for(let k=0;k<3;k++){
        const lw=r*(.55-k*.14),rr=rx*(1-k*.12),ryy=ry*(1-k*.1);
        const gr=c.createLinearGradient(-rr,0,rr,0);
        gr.addColorStop(0,'rgba(255,214,150,0)');gr.addColorStop(.2,'rgba(255,236,190,'+(.85-k*.15)+')');gr.addColorStop(.5,'rgba(255,190,110,'+(.9-k*.2)+')');gr.addColorStop(.8,'rgba(255,140,70,'+(.6-k*.15)+')');gr.addColorStop(1,'rgba(255,120,60,0)');
        c.strokeStyle=gr;c.lineWidth=lw;c.beginPath();
        if(back)c.ellipse(0,0,rr,ryy,0,Math.PI,Math.PI*2);else c.ellipse(0,0,rr,ryy,0,0,Math.PI);
        c.stroke();
      }
      c.setLineDash([r*.4,r*.25]);c.lineDashOffset=-t*.02;c.strokeStyle='rgba(255,245,220,.35)';c.lineWidth=r*.06;c.beginPath();
      if(back)c.ellipse(0,0,rx*.92,ry*.92,0,Math.PI,Math.PI*2);else c.ellipse(0,0,rx*.92,ry*.92,0,0,Math.PI);c.stroke();c.setLineDash([]);
      c.restore();
    }
    disk(true);
    c.save();c.translate(x,y);
    const halo=c.createRadialGradient(0,0,r*1.02,0,0,r*1.75);halo.addColorStop(0,'rgba(255,240,205,.95)');halo.addColorStop(.25,'rgba(255,200,130,.7)');halo.addColorStop(1,'rgba(255,150,80,0)');
    c.fillStyle=halo;c.beginPath();c.ellipse(0,0,r*1.75,r*1.6,0,0,7);c.fill();
    c.fillStyle='#000';c.beginPath();c.arc(0,0,r,0,7);c.fill();
    c.strokeStyle='rgba(255,246,225,.9)';c.lineWidth=Math.max(1,r*.04);c.beginPath();c.arc(0,0,r*1.04,0,7);c.stroke();
    c.restore();
    disk(false);
  }
  function frame(t){
    if(!on)return;requestAnimationFrame(frame);
    if(!stars&&!build())return;
    cx.clearRect(0,0,W,H);cx.drawImage(stars,0,0,W,H);
    const r=Math.min(W*.06,H*.075);
    blackHole(cx,W*.5,H*.3,r,t-t0);
    const p=.6+.4*Math.sin(t*.003),sx=W*.86,sy=H*.2;
    cx.fillStyle='rgba(255,200,140,'+p.toFixed(2)+')';cx.beginPath();cx.arc(sx,sy,2.4,0,7);cx.fill();
    cx.strokeStyle='rgba(255,180,100,'+(p*.4).toFixed(2)+')';cx.lineWidth=1;cx.beginPath();cx.arc(sx,sy,10+p*6,0,7);cx.stroke();
  }
  return {
    attach(c){cv=c;cx=c.getContext('2d');stars=null;},
    resize(){stars=null;},
    start(){if(on||!cv)return;on=true;requestAnimationFrame(frame);},
    stop(){on=false;}
  };
})();
