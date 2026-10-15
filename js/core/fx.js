"use strict";
/* =====================================================================
   特效层：纸屑、光点、星尘飞入。只在有事发生时出现。
   ===================================================================== */
const FX=(function(){
  let cv,cx,parts=[],running=false;
  function size(){if(!cv)return;const d=DPR();cv.width=Math.round(vw()*d);cv.height=Math.round(vh()*d);cv.style.width=vw()+'px';cv.style.height=vh()+'px';cx.setTransform(d,0,0,d,0,0);}
  function init(){cv=byId('fx');if(!cv)return;cx=cv.getContext('2d');size();addEventListener('resize',size);}
  function loop(){
    if(!parts.length){cx.clearRect(0,0,vw(),vh());running=false;return;}
    running=true;cx.clearRect(0,0,vw(),vh());
    parts=parts.filter(function(p){return p.life>0;});
    for(const p of parts){
      if(p.kind==='home'){ /* 飞向目标点（比如星尘计数器） */
        p.t+=p.sp;const e=p.t<1?1-Math.pow(1-p.t,3):1;
        p.x=lerp(p.x0,p.tx,e)+Math.sin(p.t*3.14)*p.wob;p.y=lerp(p.y0,p.ty,e)-Math.sin(p.t*3.14)*60;
        if(p.t>=1){p.life=0;if(p.done)p.done();}
        cx.globalAlpha=1;cx.fillStyle=p.c;cx.beginPath();cx.arc(p.x,p.y,p.r,0,7);cx.fill();
        cx.globalAlpha=.35;cx.beginPath();cx.arc(p.x,p.y,p.r*2.4,0,7);cx.fill();continue;
      }
      p.x+=p.vx;p.y+=p.vy;p.vy+=p.g;p.vx*=.97;p.vy*=.985;p.rot+=p.vr;p.life-=p.decay;
      cx.globalAlpha=Math.max(p.life,0)*.85;cx.fillStyle=p.c;
      if(p.kind==='dot'){cx.beginPath();cx.arc(p.x,p.y,p.r,0,7);cx.fill();}
      else{cx.save();cx.translate(p.x,p.y);cx.rotate(p.rot);cx.fillRect(-p.w/2,-p.h/2,p.w,p.h);cx.restore();}
    }
    cx.globalAlpha=1;requestAnimationFrame(loop);
  }
  function kick(){if(!running)requestAnimationFrame(loop);}
  return {
    init:init,
    burst(x,y,colors,n,power){
      colors=[].concat(colors||['#F6C35B','#B8362B','#5FA9FF','#F3EDE1']);
      for(let i=0;i<(n||30);i++){const a=Math.random()*6.283,v=(Math.random()*.7+.3)*(power||6);
        parts.push({kind:Math.random()<.35?'dot':'rect',x:x,y:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-2,g:.12,life:1,decay:Math.random()*.01+.01,
          w:Math.random()*6+3,h:Math.random()*3+1.5,r:Math.random()*2+1,rot:Math.random()*6.28,vr:(Math.random()-.5)*.3,c:colors[i%colors.length]});}
      kick();
    },
    sparkle(x,y,color,n){for(let i=0;i<(n||10);i++){const a=Math.random()*6.283,v=Math.random()*2+.6;
      parts.push({kind:'dot',x:x,y:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:0,life:1,decay:.025,r:Math.random()*1.8+.8,rot:0,vr:0,c:color||'#fff'});}kick();},
    /* 星尘飞向 HUD 上的计数器 */
    flyTo(x,y,tx,ty,n,color,done){
      for(let i=0;i<(n||8);i++){parts.push({kind:'home',x0:x+(Math.random()-.5)*40,y0:y+(Math.random()-.5)*40,x:x,y:y,tx:tx,ty:ty,t:-i*.06,sp:.022+Math.random()*.01,
        wob:(Math.random()-.5)*60,r:2.6,c:color||'#F6C35B',life:1,done:i===0?done:null});}
      kick();
    },
    center(colors){this.burst(vw()/2,vh()*.42,colors,46,8);}
  };
})();
