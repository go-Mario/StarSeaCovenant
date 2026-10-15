"use strict";
/* =====================================================================
   轨位争夺（1976）：地球静止轨道只有一圈。
   金色：空轨位，点了就是你的申报；红色：别人已登记在用，点了就是有害干扰；
   蓝色：长期闲置被收回的轨位，分值更高。
   ===================================================================== */
GAMES.orbit=(function(){
  let stopF=null;
  function start(host,api){
    const C=stageCanvas(host),ctx=C.ctx,W=C.w(),H=C.h();
    const bg=starfield(W,H,23,260);
    const cx=W/2,cy=H*.52,er=Math.min(W,H)*.14,rr=Math.min(W,H)*.38;
    const st={t:0,left:15,score:0,marks:[],spawn:0,over:false,claimed:[],flash:[]};
    function spawn(){
      const used=st.marks.map(function(m){return m.a;}).concat(st.claimed);
      let a=0,tries=0;do{a=Math.random()*6.283;tries++;}while(tries<20&&used.some(function(u){return Math.abs(((u-a+9.42)%6.283)-3.14)<.32;}));
      const r=Math.random(),kind=r<.66?'gold':r<.9?'red':'blue';
      const life=(kind==='gold'?Math.max(.55,1.25-st.score*.05):1.2+Math.random()*.6);
      st.marks.push({a:a,kind:kind,life:life,max:life});
    }
    function tap(e){
      if(st.over)return;
      const rect=C.c.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;
      let hit=null,bd=1e9;
      st.marks.forEach(function(m){const mx=cx+Math.cos(m.a)*rr,my=cy+Math.sin(m.a)*rr*.62,d=Math.hypot(mx-x,my-y);if(d<34&&d<bd){bd=d;hit=m;}});
      if(!hit){SFX.tap();return;}
      st.marks.splice(st.marks.indexOf(hit),1);
      const mx=cx+Math.cos(hit.a)*rr,my=cy+Math.sin(hit.a)*rr*.62;
      if(hit.kind==='red'){st.over=true;SFX.error();buzz([60,40,60]);st.flash.push({x:mx,y:my,t:0,c:'#FF6A52'});setTimeout(function(){done('interference');},700);return;}
      const pts=hit.kind==='blue'?2:1;st.score+=pts;st.claimed.push(hit.a);
      SFX.chime(st.score);buzz(10);st.flash.push({x:mx,y:my,t:0,c:hit.kind==='blue'?'#5FA9FF':'#F6C35B'});
      api.setScore('<b>'+st.score+'</b> 个轨位');
    }
    C.c.addEventListener('pointerdown',tap);
    api.setScore('<b>0</b> 个轨位');
    stopF=loop(function(dt){
      if(!st.over){st.t+=dt;st.left=Math.max(0,15-st.t);st.spawn-=dt;
        if(st.spawn<=0){spawn();st.spawn=Math.max(.32,.8-st.t*.025);}
        st.marks.forEach(function(m){m.life-=dt;});st.marks=st.marks.filter(function(m){return m.life>0;});
        if(st.left<=0){st.over=true;setTimeout(function(){done('time');},300);}}
      ctx.drawImage(bg,0,0,W,H);
      const g=ctx.createRadialGradient(cx-er*.3,cy-er*.4,er*.1,cx,cy,er);g.addColorStop(0,'#8CC4F2');g.addColorStop(.5,'#2F6FE4');g.addColorStop(1,'#0E2A66');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,er,0,7);ctx.fill();ctx.strokeStyle='rgba(159,211,255,.6)';ctx.lineWidth=2;ctx.stroke();
      ctx.strokeStyle='rgba(95,169,255,.35)';ctx.setLineDash([3,7]);ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(cx,cy,rr,rr*.62,0,0,7);ctx.stroke();ctx.setLineDash([]);
      st.claimed.forEach(function(a){const x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr*.62;ctx.fillStyle='#F6C35B';ctx.fillRect(x-4,y-3,8,6);ctx.fillStyle='#2D5FA8';ctx.fillRect(x-12,y-2,7,4);ctx.fillRect(x+5,y-2,7,4);});
      st.marks.forEach(function(m){
        const x=cx+Math.cos(m.a)*rr,y=cy+Math.sin(m.a)*rr*.62,k=m.life/m.max;
        const col=m.kind==='gold'?'246,195,91':m.kind==='red'?'255,106,82':'95,169,255';
        ctx.fillStyle='rgba('+col+',.22)';ctx.beginPath();ctx.arc(x,y,18+(1-k)*6,0,7);ctx.fill();
        ctx.fillStyle='rgba('+col+',1)';ctx.beginPath();ctx.arc(x,y,9,0,7);ctx.fill();
        ctx.strokeStyle='rgba('+col+',.9)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,15,-1.57,-1.57+6.283*k);ctx.stroke();
        if(m.kind==='red'){ctx.strokeStyle='#5A1A12';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(x-6,y+6);ctx.lineTo(x+6,y-6);ctx.stroke();}
        if(m.kind==='blue'){ctx.fillStyle='#fff';ctx.font='700 11px sans-serif';ctx.textAlign='center';ctx.fillText('收回',x,y-22);}
      });
      st.flash=st.flash.filter(function(f){f.t+=dt;return f.t<.5;});
      st.flash.forEach(function(f){ctx.strokeStyle=f.c;ctx.globalAlpha=1-f.t*2;ctx.lineWidth=3;ctx.beginPath();ctx.arc(f.x,f.y,10+f.t*60,0,7);ctx.stroke();});ctx.globalAlpha=1;
      ctx.fillStyle='#fff';ctx.font='600 15px '+getComputedStyle(document.body).fontFamily;ctx.textAlign='center';
      ctx.fillText('剩余 '+st.left.toFixed(1)+' 秒',cx,H*.1);
      ctx.fillStyle='rgba(234,240,251,.7)';ctx.font='12px sans-serif';ctx.fillText('金色＝空轨位　红色＝别人在用　蓝色＝闲置收回',cx,H-24);
    });
    function done(why){
      if(stopF)stopF();
      const rec=SAVE.game('orbit'),first8=(rec.best||0)<8&&st.score>=8;
      api.end({score:st.score,big:st.score+' 个轨位',dust:Math.min(30,st.score*2)+(first8?20:0),ok:why!=='interference',
        title:why==='interference'?'有害干扰':'时间到',
        note:(why==='interference'?'你点中了别人已经登记、正在使用的轨位。在国际电联的规则下，这叫<b>有害干扰</b>，后来的一方必须让开。<br>':'')+
          '地球静止轨道只有一圈，轨位由国际电联按“[[先申报先协调]]”的原则安排；申报了却长期不用，会被收回。1976 年，八个赤道国家发表《波哥大宣言》，主张自己头顶上那段轨道归自己。主张没被接受，但它问了一个好问题：后来的国家，还能分到什么？'});
    }
  }
  return {
    kind:'side',title:'轨位争夺',sub:'1976 · 赤道上空的一圈轨道',year:'1976',music:'tech',
    how:'15 秒里，点金色的空轨位抢先申报；蓝色是闲置被收回的轨位，分更高；<b>千万别点红色</b>，那是别人正在用的。',
    fact:'地球静止轨道上的卫星和地球一起转，从地面看一动不动，非常适合通信和气象。但这样的位置只有一圈。',
    badge:function(r){return r.best!=null?('最佳 '+r.best):'';},
    start:start,stop:function(){if(stopF)stopF();}
  };
})();
