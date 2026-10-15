"use strict";
/* =====================================================================
   空间站对接（1998）：舱段左右来回移动，点一下对接。
   对得越准，留下的越多；完全对齐是“完美对接”。
   每个舱段写着它的登记方：在空间站上，法律跟着舱段走。
   ===================================================================== */
GAMES.station=(function(){
  const PARTNERS=[['南岸','#E8775A'],['蓝洲','#5FA9FF'],['金沙','#E9C46A'],['北岭','#A9B1BE'],['枫叶','#D4574A'],['拾星','#5E9E4A'],['湖城','#7FD1C1'],['高地','#B9A6E8']];
  let stopF=null;
  function start(host,api){
    const C=stageCanvas(host),ctx=C.ctx,W=C.w(),H=C.h();
    const bg=GameArt.sky(W,H,{seed:41,band:{x:.5,y:.25,a:-.3,w:.12,al:.1}});
    const EL=GameArt.earthLimb(W,H*1.6,W/2,H*2.35,H*1.6,41);
    const MH=34,baseW=Math.min(W*.52,230);
    const st={stack:[{x:W/2-baseW/2,w:baseW,p:0}],cur:null,dir:1,speed:150,cam:0,camT:0,falling:[],labels:[],over:false,combo:0,t:0};
    function next(){const last=st.stack[st.stack.length-1],n=st.stack.length;const side=n%2?-1:1;
      st.cur={x:side<0?-last.w:W,w:last.w,p:n%PARTNERS.length};st.dir=side<0?1:-1;st.speed=Math.min(380,150+n*12);}
    next();
    api.setScore('<b>0</b> 个舱段');
    function drop(){
      if(st.over||!st.cur)return;
      const last=st.stack[st.stack.length-1],c=st.cur;
      const L=Math.max(c.x,last.x),R=Math.min(c.x+c.w,last.x+last.w),ov=R-L;
      if(ov<=4){st.over=true;st.falling.push({x:c.x,y:yOf(st.stack.length),w:c.w,p:c.p,vy:0,vx:st.dir*40,rot:0});SFX.error();buzz([60,40,60]);setTimeout(done,900);st.cur=null;return;}
      let nx=L,nw=ov;
      if(Math.abs(c.x-last.x)<6){nx=last.x;nw=Math.min(baseW,last.w+4);st.combo++;SFX.chime(4+st.combo);SFX.dock();buzz(20);st.labels.push({t:'完美对接',y:yOf(st.stack.length),a:1,c:'#F6C35B'});}
      else{st.combo=0;SFX.dock();buzz(12);
        if(c.x<last.x)st.falling.push({x:c.x,y:yOf(st.stack.length),w:last.x-c.x,p:c.p,vy:0,vx:-60,rot:0});
        if(c.x+c.w>last.x+last.w)st.falling.push({x:last.x+last.w,y:yOf(st.stack.length),w:c.x+c.w-(last.x+last.w),p:c.p,vy:0,vx:60,rot:0});}
      st.stack.push({x:nx,w:nw,p:c.p});
      const P=PARTNERS[c.p];st.labels.push({t:P[0]+'舱 · 适用'+P[0]+'的法律',y:yOf(st.stack.length-1),a:1.4,c:P[1]});
      api.setScore('<b>'+(st.stack.length-1)+'</b> 个舱段');
      st.camT=Math.max(0,(st.stack.length-6)*MH);
      next();
    }
    function yOf(i){return H*.8-i*MH;}
    C.c.addEventListener('pointerdown',drop);
    const kd=function(e){if(e.key===' '||e.key==='Enter'){e.preventDefault();drop();}};addEventListener('keydown',kd);
    stopF=loop(function(dt){
      st.t+=dt;
      if(st.cur){st.cur.x+=st.dir*st.speed*dt;if(st.cur.x<-st.cur.w*.6){st.dir=1;}if(st.cur.x>W-st.cur.w*.4){st.dir=-1;}}
      st.cam+=(st.camT-st.cam)*Math.min(1,dt*4);
      ctx.drawImage(bg,0,0,W,H);
      /* 地球边缘：往上搭得越高，地球沉得越低 */
      ctx.drawImage(EL.c,0,st.cam*.3,W,H*1.6);
      ctx.save();ctx.translate(0,st.cam);
      function mod(m,y,alpha,rot){
        const P=PARTNERS[m.p],h=MH-6;ctx.globalAlpha=alpha==null?1:alpha;
        if(rot){ctx.save();ctx.translate(m.x+m.w/2,y+h/2);ctx.rotate(rot);ctx.translate(-(m.x+m.w/2),-(y+h/2));}
        /* 圆柱舱：上亮下暗，一圈圈加强筋 */
        let q=ctx.createLinearGradient(0,y,0,y+h);q.addColorStop(0,'#FAFBFD');q.addColorStop(.35,'#D5DAE2');q.addColorStop(.75,'#8D96A5');q.addColorStop(1,'#545C69');
        ctx.fillStyle=q;GameArt.rr(ctx,m.x,y,m.w,h,9);ctx.fill();
        ctx.save();GameArt.rr(ctx,m.x,y,m.w,h,9);ctx.clip();
        ctx.fillStyle='rgba(30,36,50,.18)';for(let k=m.x+14;k<m.x+m.w-6;k+=15)ctx.fillRect(k,y,1.2,h);
        ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(m.x,y+3,m.w,1.2);
        /* 伙伴的标识色带 */
        q=ctx.createLinearGradient(0,y,0,y+h);q.addColorStop(0,P[1]);q.addColorStop(1,'rgba(0,0,0,.35)');ctx.fillStyle=q;ctx.fillRect(m.x+8,y,Math.max(0,Math.min(10,m.w-16)),h);
        /* 舷窗 */
        for(let k=m.x+30;k<m.x+m.w-14;k+=30){ctx.fillStyle='#16233F';ctx.beginPath();ctx.arc(k,y+h*.45,3.2,0,7);ctx.fill();ctx.fillStyle='rgba(255,220,150,.75)';ctx.beginPath();ctx.arc(k,y+h*.45,1.6,0,7);ctx.fill();}
        ctx.restore();
        ctx.strokeStyle='rgba(20,24,36,.55)';ctx.lineWidth=1;GameArt.rr(ctx,m.x,y,m.w,h,9);ctx.stroke();
        if(rot)ctx.restore();
        ctx.globalAlpha=1;
      }
      function wing(x,y,w,flip){
        /* 太阳翼：深蓝电池片 + 金色框线 */
        const h=MH-14;ctx.fillStyle='#9AA3B2';ctx.fillRect(flip?x+w:x-8,y+h/2+3,8,2);
        const q=ctx.createLinearGradient(x,y,x+w,y+h);q.addColorStop(0,'#2C5BB0');q.addColorStop(.5,'#163675');q.addColorStop(1,'#0C1E47');ctx.fillStyle=q;ctx.fillRect(x,y+4,w,h);
        ctx.strokeStyle='rgba(230,190,110,.75)';ctx.lineWidth=.8;ctx.strokeRect(x,y+4,w,h);
        ctx.strokeStyle='rgba(140,190,255,.25)';ctx.beginPath();for(let k=x+w/6;k<x+w-1;k+=w/6){ctx.moveTo(k,y+4);ctx.lineTo(k,y+4+h);}ctx.moveTo(x,y+4+h/2);ctx.lineTo(x+w,y+4+h/2);ctx.stroke();
        ctx.fillStyle='rgba(255,255,255,.08)';ctx.beginPath();ctx.moveTo(x,y+4);ctx.lineTo(x+w*.4,y+4);ctx.lineTo(x+w*.2,y+4+h);ctx.lineTo(x,y+4+h);ctx.fill();
      }
      st.stack.forEach(function(m,i){
        const y=yOf(i);
        if(i>0&&i%3===0){const pw=Math.min(90,W*.18);wing(m.x-pw-8,y,pw,false);wing(m.x+m.w+8,y,pw,true);}
        mod(m,y);
      });
      if(st.cur){const y=yOf(st.stack.length),last=st.stack[st.stack.length-1];
        /* 对位辅助线：下面那一节的两端 */
        ctx.strokeStyle='rgba(246,195,91,.22)';ctx.setLineDash([3,5]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(last.x,y-6);ctx.lineTo(last.x,y+MH);ctx.moveTo(last.x+last.w,y-6);ctx.lineTo(last.x+last.w,y+MH);ctx.stroke();ctx.setLineDash([]);
        GameArt.soft(ctx,st.dir<0?st.cur.x+st.cur.w:st.cur.x,y+MH/2-3,8,'200,225,255',.5);
        mod(st.cur,y);}
      st.falling=st.falling.filter(function(f){f.vy+=200*dt;f.y+=f.vy*dt;f.x+=f.vx*dt;f.rot=(f.rot||0)+f.vx*.002*dt*60;return f.y<H+200;});
      st.falling.forEach(function(f){mod(f,f.y,.75,f.rot);});
      st.labels=st.labels.filter(function(l){l.a-=dt*.7;l.y-=dt*16;return l.a>0;});
      st.labels.forEach(function(l){ctx.globalAlpha=Math.min(1,l.a);if(l.t==='完美对接')GameArt.glowText(ctx,l.t,W/2,l.y-10,17,l.c,12);else GameArt.caption(ctx,l.t,W/2,l.y-8,{size:12,color:l.c,bg:.55});});ctx.globalAlpha=1;
      ctx.restore();
      if(st.stack.length<3)GameArt.caption(ctx,'舱段对准下面那一节时，点一下',W/2,H*.14,{size:12.5});
    });
    function done(){
      if(stopF)stopF();removeEventListener('keydown',kd);
      const n=st.stack.length-1,rec=SAVE.game('station'),first8=(rec.best||0)<8&&n>=8;
      api.end({score:n,big:n+' 个舱段',dust:Math.min(40,n*3)+(first8?15:0),
        note:'1998 年，国际空间站的第一个舱段升空。参与国签的协定规定：每个伙伴登记自己的舱段，对自己的舱段和本国航天员保有管辖权；在某个舱段里做出的发明，视为在登记该舱段的国家做出。同一座空间站，好几套法律，按舱段划分。'});
    }
    GAMES.station._kd=kd;
  }
  return {
    kind:'side',title:'空间站对接',sub:'1998 · 国际空间站开始组装',year:'1998',music:'tech',
    how:'舱段会左右移动。点屏幕（或按空格）把它接到下面那一节上。对不齐的部分会掉下去，完全对齐是“完美对接”。',
    fact:'国际空间站由五个航天机构、十几个国家合作建造。它也是一个法律上的“拼图”。',
    badge:function(r){return r.best!=null?('最多 '+r.best+' 节'):'';},
    start:start,stop:function(){if(stopF)stopF();if(GAMES.station._kd)removeEventListener('keydown',GAMES.station._kd);}
  };
})();
