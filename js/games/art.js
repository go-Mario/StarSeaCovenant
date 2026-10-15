"use strict";
/* =====================================================================
   小游戏共用的美术：深空背景、写实星球、从轨道上看到的地球边缘、柔光粒子。
   能预渲染的都画到离屏画布上，每帧只做 drawImage，手机上也跑得动。
   ===================================================================== */
const GameArt=(function(){
  const D=function(){return Math.min(1.5,DPR());};
  function cnv(w,h){const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w));c.height=Math.max(1,Math.round(h));return c;}
  let FONT='';
  function font(px,wt){if(!FONT)FONT=getComputedStyle(document.body).fontFamily;return (wt||500)+' '+px+'px '+FONT;}
  function mono(px,wt){return (wt||600)+' '+px+'px "IBM Plex Mono",ui-monospace,Menlo,monospace';}

  /* 深空：底色渐变 → 几团星云 → 银河带 → 三种色温的星点，亮星带十字光 */
  function sky(w,h,o){
    o=o||{};const d=D(),c=cnv(w*d,h*d),g=c.getContext('2d'),R=rng(o.seed||5);g.scale(d,d);
    const t=o.tint||['#02040B','#081022'];
    let gr=g.createLinearGradient(0,0,w*.35,h);gr.addColorStop(0,t[0]);gr.addColorStop(1,t[1]);g.fillStyle=gr;g.fillRect(0,0,w,h);
    const M=Math.max(w,h);
    (o.neb||[[.18,.22,.55,'86,70,170',.16],[.86,.62,.5,'40,120,175',.13],[.5,.95,.45,'150,70,120',.08]]).forEach(function(n){
      for(let k=0;k<7;k++){
        const x=(n[0]+(R()-.5)*.22)*w,y=(n[1]+(R()-.5)*.18)*h,r=n[2]*M*(.25+R()*.4);
        const q=g.createRadialGradient(x,y,0,x,y,r);q.addColorStop(0,'rgba('+n[3]+','+(n[4]*(.5+R()*.6)).toFixed(3)+')');q.addColorStop(1,'rgba('+n[3]+',0)');
        g.fillStyle=q;g.fillRect(0,0,w,h);
      }
    });
    if(o.band){
      const b=o.band;g.save();g.translate(w*(b.x==null?.5:b.x),h*(b.y==null?.45:b.y));g.rotate(b.a==null?-.5:b.a);
      const bw=M*(b.w||.16);
      gr=g.createLinearGradient(0,-bw,0,bw);gr.addColorStop(0,'rgba(170,170,230,0)');gr.addColorStop(.5,'rgba(205,200,235,'+(b.al||.14)+')');gr.addColorStop(1,'rgba(170,170,230,0)');
      g.fillStyle=gr;g.fillRect(-M,-bw,M*2,bw*2);
      for(let i=0;i<M*2.2;i++){const x=(R()-.5)*M*2,y=(R()+R()+R()-1.5)*bw*.7;g.fillStyle='rgba(230,228,255,'+(R()*.4+.08).toFixed(2)+')';g.fillRect(x,y,1,1);}
      /* 暗带：几片半透明的深色，模仿银河中间的尘埃 */
      for(let i=0;i<9;i++){const x=(R()-.5)*M*1.6,y=(R()-.5)*bw*.3;const q=g.createRadialGradient(x,y,0,x,y,bw*(.4+R()*.5));q.addColorStop(0,'rgba(3,4,10,.35)');q.addColorStop(1,'rgba(3,4,10,0)');g.fillStyle=q;g.fillRect(x-bw,y-bw,bw*2,bw*2);}
      g.restore();
    }
    const n=o.n||Math.round(w*h/1500);
    for(let i=0;i<n;i++){
      const a=R(),x=R()*w,y=R()*h*(o.starH||1),big=R()<(o.big==null?.025:o.big),r=big?1.3+R()*.8:R()*.75+.25;
      const col=a<.1?'255,224,190':a<.22?'190,210,255':'242,245,255',al=(big?.9:R()*.6+.2).toFixed(2);
      g.fillStyle='rgba('+col+','+al+')';g.beginPath();g.arc(x,y,r,0,7);g.fill();
      if(big){const q=g.createRadialGradient(x,y,0,x,y,r*6);q.addColorStop(0,'rgba('+col+',.35)');q.addColorStop(1,'rgba('+col+',0)');g.fillStyle=q;g.fillRect(x-r*6,y-r*6,r*12,r*12);
        g.strokeStyle='rgba('+col+',.35)';g.lineWidth=.6;g.beginPath();g.moveTo(x-r*7,y);g.lineTo(x+r*7,y);g.moveTo(x,y-r*7);g.lineTo(x,y+r*7);g.stroke();}
    }
    if(o.vignette!==false){gr=g.createRadialGradient(w/2,h/2,M*.3,w/2,h/2,M*.8);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.45)');g.fillStyle=gr;g.fillRect(0,0,w,h);}
    return c;
  }

  /* 星球贴图：沿用星图的画法（光从左上来，带大气边） */
  const plCache={};
  function planet(look,R,seed){
    const k=look+'|'+Math.round(R*4)+'|'+(seed||7);
    if(!plCache[k])plCache[k]=MapArt.planet(look,R,D(),seed||7);
    return plCache[k];
  }
  function drawPlanet(ctx,look,x,y,R,seed){const p=planet(look,R,seed);ctx.drawImage(p.c,x-p.half,y-p.half,p.half*2,p.half*2);}

  /* 从低轨道看到的地球：只露出上面一段弧。海、云、陆地、晨昏线、夜里的城市灯光、大气层的蓝边 */
  function earthLimb(w,h,cx,cy,R,seed){
    const d=D(),c=cnv(w*d,h*d),g=c.getContext('2d'),rn=rng(seed||17);g.scale(d,d);
    const top=cy-R;
    /* 大气的光晕：画在球外 */
    let gr=g.createRadialGradient(cx,cy,R*.98,cx,cy,R*1.09);
    gr.addColorStop(0,'rgba(140,200,255,.0)');gr.addColorStop(.12,'rgba(150,210,255,.75)');gr.addColorStop(.3,'rgba(90,160,255,.35)');gr.addColorStop(1,'rgba(40,90,220,0)');
    g.fillStyle=gr;g.beginPath();g.arc(cx,cy,R*1.09,0,7);g.fill();
    g.save();g.beginPath();g.arc(cx,cy,R,0,7);g.clip();
    gr=g.createLinearGradient(0,top,0,top+R*.6);gr.addColorStop(0,'#3F86E0');gr.addColorStop(.3,'#1D56B4');gr.addColorStop(1,'#0A2459');
    g.fillStyle=gr;g.fillRect(0,top,w,h-top+10);
    /* 陆地：贴着弧面压扁的一些软块 */
    for(let i=0;i<9;i++){
      const x=rn()*w,y=top+R*(.04+rn()*.32),rx=w*(.06+rn()*.12),ry=rx*(.12+(y-top)/R*.5);
      g.fillStyle=i%3?'rgba(70,120,80,.55)':'rgba(150,130,90,.5)';g.beginPath();
      for(let k=0;k<14;k++){const a=k/14*6.283,q=.7+rn()*.5;const px=x+Math.cos(a)*rx*q,py=y+Math.sin(a)*ry*q;k?g.lineTo(px,py):g.moveTo(px,py);}g.closePath();g.fill();
    }
    /* 云：顺着弧面的长条 */
    g.lineCap='round';
    for(let i=0;i<70;i++){
      const x=rn()*w,y=top+R*(.01+Math.pow(rn(),1.6)*.4),len=w*(.04+rn()*.12),th=(1.5+rn()*5)*(.4+(y-top)/R*2.2);
      g.strokeStyle='rgba(255,255,255,'+(.18+rn()*.35).toFixed(2)+')';g.lineWidth=th;
      g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+len*.5,y-th*.6+(rn()-.5)*th,x+len,y+(rn()-.5)*th);g.stroke();
    }
    /* 晨昏线：右边入夜 */
    gr=g.createLinearGradient(w*.45,0,w*1.05,0);gr.addColorStop(0,'rgba(2,6,18,0)');gr.addColorStop(.45,'rgba(2,6,18,.55)');gr.addColorStop(1,'rgba(2,6,18,.9)');
    g.fillStyle=gr;g.fillRect(0,top,w,h);
    /* 城市灯光 */
    for(let i=0;i<260;i++){
      const x=w*(.62+rn()*.4),y=top+R*(.03+Math.pow(rn(),1.3)*.4);if(rn()<.4)continue;
      g.fillStyle='rgba(255,'+(190+Math.floor(rn()*50))+',120,'+(.35+rn()*.5).toFixed(2)+')';g.fillRect(x,y,rn()<.15?1.6:1,1);
    }
    /* 太阳的反光 */
    gr=g.createRadialGradient(w*.22,top+R*.08,0,w*.22,top+R*.08,w*.35);gr.addColorStop(0,'rgba(255,245,220,.28)');gr.addColorStop(1,'rgba(255,245,220,0)');
    g.fillStyle=gr;g.fillRect(0,top,w,h);
    /* 往下越来越暗 */
    gr=g.createLinearGradient(0,top,0,top+R*.7);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(2,5,14,.75)');g.fillStyle=gr;g.fillRect(0,top,w,h);
    g.restore();
    /* 大气的细亮边 */
    g.strokeStyle='rgba(185,225,255,.85)';g.lineWidth=1.6;g.beginPath();g.arc(cx,cy,R+.5,Math.PI*1.02,Math.PI*1.98);g.stroke();
    g.strokeStyle='rgba(120,180,255,.35)';g.lineWidth=5;g.beginPath();g.arc(cx,cy,R+3,Math.PI*1.02,Math.PI*1.98);g.stroke();
    return {c:c,top:top};
  }

  /* 柔光圆点：预渲染，粒子多的时候比每次建渐变省得多 */
  const dotCache={};
  function dot(rgb){
    if(dotCache[rgb])return dotCache[rgb];
    const S=64,c=cnv(S,S),g=c.getContext('2d'),q=g.createRadialGradient(S/2,S/2,0,S/2,S/2,S/2);
    q.addColorStop(0,'rgba('+rgb+',1)');q.addColorStop(.25,'rgba('+rgb+',.6)');q.addColorStop(1,'rgba('+rgb+',0)');g.fillStyle=q;g.fillRect(0,0,S,S);
    return dotCache[rgb]=c;
  }
  function soft(ctx,x,y,r,rgb,a){if(a<=0)return;const o=ctx.globalAlpha;ctx.globalAlpha=o*Math.min(1,a);ctx.drawImage(dot(rgb),x-r,y-r,r*2,r*2);ctx.globalAlpha=o;}
  function glow(ctx,x,y,r,rgb,a){soft(ctx,x,y,r,rgb,a);}

  /* 太阳：几层光晕加一条横向的镜头光 */
  function sun(ctx,x,y,r,a){
    a=a==null?1:a;const op=ctx.globalCompositeOperation;ctx.globalCompositeOperation='lighter';
    soft(ctx,x,y,r*7,'255,190,120',.25*a);soft(ctx,x,y,r*3,'255,214,150',.45*a);soft(ctx,x,y,r*1.4,'255,244,220',.95*a);
    const q=ctx.createLinearGradient(x-r*14,y,x+r*14,y);q.addColorStop(0,'rgba(255,220,170,0)');q.addColorStop(.5,'rgba(255,236,200,'+(.35*a)+')');q.addColorStop(1,'rgba(255,220,170,0)');
    ctx.fillStyle=q;ctx.fillRect(x-r*14,y-1.2,r*28,2.4);
    ctx.globalCompositeOperation=op;
  }

  /* 画布里的说明文字：一条半透明的深色底，字不会被背景吃掉 */
  function caption(ctx,text,x,y,o){
    o=o||{};ctx.save();ctx.font=font(o.size||12.5,o.wt||500);ctx.textAlign='center';ctx.textBaseline='middle';
    const tw=ctx.measureText(text).width,ph=(o.size||12.5)+12,pw=tw+26;
    ctx.fillStyle='rgba(6,9,20,'+(o.bg==null?.62:o.bg)+')';
    const r=ph/2;ctx.beginPath();ctx.moveTo(x-pw/2+r,y-r);ctx.lineTo(x+pw/2-r,y-r);ctx.arc(x+pw/2-r,y,r,-1.5708,1.5708);ctx.lineTo(x-pw/2+r,y+r);ctx.arc(x-pw/2+r,y,r,1.5708,4.7124);ctx.fill();
    ctx.strokeStyle='rgba(200,178,115,'+(o.line==null?.28:o.line)+')';ctx.lineWidth=1;ctx.stroke();
    ctx.fillStyle=o.color||'rgba(236,232,220,.92)';ctx.fillText(text,x,y+.5);ctx.restore();
  }
  /* 金色带光晕的字 */
  function glowText(ctx,text,x,y,px,col,blur){
    ctx.save();ctx.font=font(px,700);ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor=col||'#F6C35B';ctx.shadowBlur=blur||14;
    ctx.fillStyle=col||'#F6C35B';ctx.fillText(text,x,y);ctx.shadowBlur=0;ctx.fillStyle='rgba(255,250,235,.9)';ctx.globalAlpha=.35;ctx.fillText(text,x,y);ctx.restore();
  }
  function rr(ctx,x,y,w,h,r){r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}

  /* 一颗小卫星：金箔本体、两片太阳翼。用在轨位、清扫、发射 */
  function satellite(ctx,x,y,s,ang,body,tint){
    ctx.save();ctx.translate(x,y);ctx.rotate(ang||0);ctx.scale(s,s);
    ctx.strokeStyle='rgba(200,210,225,.8)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-17,0);ctx.lineTo(17,0);ctx.stroke();
    [-1,1].forEach(function(k){
      const px=k<0?-30:12;
      const q=ctx.createLinearGradient(px,-5,px,5);q.addColorStop(0,tint||'#3C6FC4');q.addColorStop(1,'#132A5C');ctx.fillStyle=q;ctx.fillRect(px,-5,18,10);
      ctx.strokeStyle='rgba(230,200,120,.7)';ctx.lineWidth=.7;ctx.strokeRect(px,-5,18,10);ctx.beginPath();ctx.moveTo(px+6,-5);ctx.lineTo(px+6,5);ctx.moveTo(px+12,-5);ctx.lineTo(px+12,5);ctx.moveTo(px,0);ctx.lineTo(px+18,0);ctx.stroke();
    });
    const q=ctx.createLinearGradient(-7,-7,7,7);q.addColorStop(0,body||'#F6D27A');q.addColorStop(1,'#9C6A1C');ctx.fillStyle=q;rr(ctx,-7,-6,14,12,2);ctx.fill();
    ctx.strokeStyle='rgba(255,240,200,.5)';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(-5,-2);ctx.lineTo(4,-4);ctx.moveTo(-4,3);ctx.lineTo(5,1);ctx.stroke();
    ctx.fillStyle='#E9ECF0';ctx.beginPath();ctx.ellipse(0,-8,4,1.6,0,0,7);ctx.fill();
    ctx.restore();
  }
  return {sky:sky,planet:planet,drawPlanet:drawPlanet,earthLimb:earthLimb,dot:dot,soft:soft,glow:glow,sun:sun,caption:caption,glowText:glowText,font:font,mono:mono,rr:rr,satellite:satellite};
})();
