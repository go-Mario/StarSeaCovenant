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
    const bg=GameArt.sky(W,H,{seed:23,band:{x:.5,y:.3,a:-.62,w:.12,al:.11},neb:[[.15,.15,.5,'60,80,170',.12],[.9,.85,.5,'120,60,150',.1]]});
    const cx=W/2,cy=H*.52,er=Math.min(W,H)*.14,rr=Math.min(W,H)*.38,TILT=.62;
    const st={t:0,left:15,score:0,marks:[],spawn:0,over:false,claimed:[],flash:[]};
    /* 低轨道上来来往往的卫星，只是背景 */
    const leo=[];for(let i=0;i<14;i++)leo.push({a:Math.random()*6.283,r:er*(1.18+Math.random()*.35),tilt:(Math.random()-.5)*1.4,sp:.5+Math.random()*.7});
    const pos=function(a){return {x:cx+Math.cos(a)*rr,y:cy+Math.sin(a)*rr*TILT,back:Math.sin(a)<0};};
    function spawn(){
      const used=st.marks.map(function(m){return m.a;}).concat(st.claimed);
      let a=0,tries=0;do{a=Math.random()*6.283;tries++;}while(tries<20&&used.some(function(u){return Math.abs(((u-a+9.42)%6.283)-3.14)<.32;}));
      const r=Math.random(),kind=r<.66?'gold':r<.9?'red':'blue';
      const life=(kind==='gold'?Math.max(.55,1.25-st.score*.05):1.2+Math.random()*.6);
      st.marks.push({a:a,kind:kind,life:life,max:life,born:st.t});
    }
    function tap(e){
      if(st.over)return;
      const rect=C.c.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;
      let hit=null,bd=1e9;
      st.marks.forEach(function(m){const p=pos(m.a),d=Math.hypot(p.x-x,p.y-y);if(d<34&&d<bd){bd=d;hit=m;}});
      if(!hit){SFX.tap();return;}
      st.marks.splice(st.marks.indexOf(hit),1);
      const p=pos(hit.a);
      if(hit.kind==='red'){st.over=true;SFX.error();buzz([60,40,60]);st.flash.push({x:p.x,y:p.y,t:0,c:'255,106,82',txt:'有害干扰'});setTimeout(function(){done('interference');},700);return;}
      const pts=hit.kind==='blue'?2:1;st.score+=pts;st.claimed.push(hit.a);
      SFX.chime(st.score);buzz(10);st.flash.push({x:p.x,y:p.y,t:0,c:hit.kind==='blue'?'95,169,255':'246,195,91',txt:'+'+pts});
      api.setScore('<b>'+st.score+'</b> 个轨位');
    }
    C.c.addEventListener('pointerdown',tap);
    api.setScore('<b>0</b> 个轨位');
    function ring(back){
      /* 静止轨道：后半圈暗一些，前半圈亮一些，看得出远近 */
      ctx.lineWidth=6;ctx.strokeStyle='rgba(95,169,255,'+(back?.05:.09)+')';ctx.beginPath();ctx.ellipse(cx,cy,rr,rr*TILT,0,back?Math.PI:0,back?Math.PI*2:Math.PI);ctx.stroke();
      ctx.lineWidth=1.2;ctx.strokeStyle='rgba(140,195,255,'+(back?.28:.55)+')';ctx.setLineDash([2,6]);ctx.lineDashOffset=-st.t*6;ctx.beginPath();ctx.ellipse(cx,cy,rr,rr*TILT,0,back?Math.PI:0,back?Math.PI*2:Math.PI);ctx.stroke();ctx.setLineDash([]);
    }
    function drawSlot(a){const p=pos(a),sc=p.back?.8:1;GameArt.soft(ctx,p.x,p.y,14*sc,'246,195,91',.35);GameArt.satellite(ctx,p.x,p.y,.62*sc,a+1.5708);}
    function drawMark(m){
      const p=pos(m.a),k=m.life/m.max,sc=p.back?.85:1,age=Math.min(1,(st.t-m.born)*6);
      const col=m.kind==='gold'?'246,195,91':m.kind==='red'?'255,106,82':'95,169,255';
      ctx.save();ctx.translate(p.x,p.y);ctx.scale(sc*age,sc*age);
      GameArt.soft(ctx,0,0,30+Math.sin(st.t*8)*3,col,.45);
      ctx.strokeStyle='rgba('+col+',.35)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,19,0,7);ctx.stroke();
      ctx.strokeStyle='rgba('+col+',1)';ctx.lineWidth=2.4;ctx.lineCap='round';ctx.beginPath();ctx.arc(0,0,19,-1.5708,-1.5708+6.283*k);ctx.stroke();
      if(m.kind==='red'){GameArt.satellite(ctx,0,0,.55,m.a+1.5708,'#E8775A','#7A2A22');ctx.strokeStyle='rgba(255,106,82,.95)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-13,13);ctx.lineTo(13,-13);ctx.stroke();}
      else{ctx.fillStyle='rgba('+col+',1)';ctx.beginPath();ctx.arc(0,0,6.5,0,7);ctx.fill();ctx.fillStyle='rgba(255,255,255,.85)';ctx.beginPath();ctx.arc(-1.5,-1.5,2.2,0,7);ctx.fill();}
      ctx.restore();
      if(m.kind==='blue')GameArt.caption(ctx,'收回',p.x,p.y-32,{size:11,color:'#BFE0FF',bg:.5,line:.15});
    }
    stopF=loop(function(dt){
      if(!st.over){st.t+=dt;st.left=Math.max(0,15-st.t);st.spawn-=dt;
        if(st.spawn<=0){spawn();st.spawn=Math.max(.32,.8-st.t*.025);}
        st.marks.forEach(function(m){m.life-=dt;});st.marks=st.marks.filter(function(m){return m.life>0;});
        if(st.left<=0){st.over=true;setTimeout(function(){done('time');},300);}}
      ctx.drawImage(bg,0,0,W,H);
      ring(true);
      st.claimed.forEach(function(a){if(Math.sin(a)<0)drawSlot(a);});
      st.marks.forEach(function(m){if(Math.sin(m.a)<0)drawMark(m);});
      /* 地球与低轨道的小卫星 */
      GameArt.soft(ctx,cx,cy,er*1.9,'70,140,255',.18);
      leo.forEach(function(o){o.a+=o.sp*dt*.5;if(Math.sin(o.a)<0){const x=cx+Math.cos(o.a)*o.r,y=cy+Math.sin(o.a)*o.r*.35+Math.cos(o.a)*o.r*o.tilt*.3;ctx.fillStyle='rgba(220,230,255,.5)';ctx.fillRect(x-1,y-1,2,2);}});
      GameArt.drawPlanet(ctx,'earth',cx,cy,er,9);
      leo.forEach(function(o){if(Math.sin(o.a)>=0){const x=cx+Math.cos(o.a)*o.r,y=cy+Math.sin(o.a)*o.r*.35+Math.cos(o.a)*o.r*o.tilt*.3;ctx.fillStyle='rgba(235,240,255,.85)';ctx.fillRect(x-1,y-1,2,2);}});
      ring(false);
      st.claimed.forEach(function(a){if(Math.sin(a)>=0)drawSlot(a);});
      st.marks.forEach(function(m){if(Math.sin(m.a)>=0)drawMark(m);});
      st.flash=st.flash.filter(function(f){f.t+=dt;return f.t<.7;});
      st.flash.forEach(function(f){const k=1-f.t/.7;ctx.strokeStyle='rgba('+f.c+','+k+')';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(f.x,f.y,12+f.t*70,0,7);ctx.stroke();
        ctx.globalAlpha=k;GameArt.glowText(ctx,f.txt,f.x,f.y-30-f.t*30,f.txt.length>2?15:18,'rgb('+f.c+')',10);ctx.globalAlpha=1;});
      /* 倒计时：一条细金线 + 秒数 */
      const bw=Math.min(240,W*.6),bx=cx-bw/2,by=H*.1+14,k=st.left/15;
      ctx.fillStyle='rgba(255,255,255,.1)';ctx.fillRect(bx,by,bw,3);
      ctx.fillStyle=k<.25?'#FF8A72':'#E6B34D';ctx.fillRect(bx,by,bw*k,3);GameArt.soft(ctx,bx+bw*k,by+1.5,8,k<.25?'255,138,114':'246,195,91',.9);
      ctx.font=GameArt.mono(20,600);ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillStyle=k<.25?'#FF8A72':'#F3EDE1';ctx.fillText(st.left.toFixed(1),cx,H*.1+2);
      GameArt.caption(ctx,'金色＝空轨位　红色＝别人在用　蓝色＝闲置收回',cx,H-30,{size:12});
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
