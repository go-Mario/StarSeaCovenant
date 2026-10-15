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
    const bg=starfield(W,H,41,260);
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
      /* 地球边缘 */
      const ey=H*1.55+st.cam*.3,er=H*.9;
      const g=ctx.createRadialGradient(W/2,ey-er*.6,er*.2,W/2,ey,er);g.addColorStop(0,'#5FA9FF');g.addColorStop(.6,'#1E4FA8');g.addColorStop(1,'#0A1A33');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(W/2,ey,er,0,7);ctx.fill();ctx.strokeStyle='rgba(159,211,255,.7)';ctx.lineWidth=4;ctx.stroke();
      ctx.save();ctx.translate(0,st.cam);
      function mod(m,y,alpha){
        const P=PARTNERS[m.p];ctx.globalAlpha=alpha==null?1:alpha;
        ctx.fillStyle='#E9ECF0';ctx.strokeStyle='#141824';ctx.lineWidth=2;
        const r=10;ctx.beginPath();ctx.moveTo(m.x+r,y);ctx.lineTo(m.x+m.w-r,y);ctx.quadraticCurveTo(m.x+m.w,y,m.x+m.w,y+r);ctx.lineTo(m.x+m.w,y+MH-4-r);ctx.quadraticCurveTo(m.x+m.w,y+MH-4,m.x+m.w-r,y+MH-4);ctx.lineTo(m.x+r,y+MH-4);ctx.quadraticCurveTo(m.x,y+MH-4,m.x,y+MH-4-r);ctx.lineTo(m.x,y+r);ctx.quadraticCurveTo(m.x,y,m.x+r,y);ctx.closePath();ctx.fill();ctx.stroke();
        ctx.fillStyle=P[1];ctx.fillRect(m.x+6,y+6,Math.max(0,Math.min(18,m.w-12)),MH-16);
        ctx.fillStyle='rgba(20,24,36,.25)';for(let k=m.x+30;k<m.x+m.w-8;k+=16)ctx.fillRect(k,y+8,8,MH-20);
        ctx.globalAlpha=1;
      }
      st.stack.forEach(function(m,i){
        const y=yOf(i);
        if(i>0&&i%3===0){ctx.fillStyle='#2D5FA8';ctx.strokeStyle='#8CC4F2';ctx.lineWidth=1;const pw=Math.min(90,W*.18);
          ctx.fillRect(m.x-pw-8,y+4,pw,MH-12);ctx.strokeRect(m.x-pw-8,y+4,pw,MH-12);ctx.fillRect(m.x+m.w+8,y+4,pw,MH-12);ctx.strokeRect(m.x+m.w+8,y+4,pw,MH-12);
          ctx.fillStyle='#9AA3B2';ctx.fillRect(m.x-8,y+MH/2-4,8,4);ctx.fillRect(m.x+m.w,y+MH/2-4,8,4);}
        mod(m,y);
      });
      if(st.cur)mod(st.cur,yOf(st.stack.length));
      st.falling=st.falling.filter(function(f){f.vy+=200*dt;f.y+=f.vy*dt;f.x+=f.vx*dt;return f.y<H+200;});
      st.falling.forEach(function(f){mod(f,f.y,.7);});
      st.labels=st.labels.filter(function(l){l.a-=dt*.7;l.y-=dt*16;return l.a>0;});
      st.labels.forEach(function(l){ctx.globalAlpha=Math.min(1,l.a);ctx.fillStyle=l.c;ctx.font='600 13px sans-serif';ctx.textAlign='center';ctx.fillText(l.t,W/2,l.y-6);});ctx.globalAlpha=1;
      ctx.restore();
      if(st.stack.length<3){ctx.fillStyle='rgba(234,240,251,.8)';ctx.font='13px sans-serif';ctx.textAlign='center';ctx.fillText('舱段对准下面那一节时，点一下',W/2,H*.12);}
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
