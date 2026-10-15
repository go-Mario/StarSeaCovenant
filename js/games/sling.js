"use strict";
/* =====================================================================
   引力弹弓（1977）：拖动探测器向后拉，松手发射；借行星的引力拐弯。
   四关：火星 · 木星借力 · 旅行者路线 · 金唱片（通关后为唱片选问候语）
   ===================================================================== */
GAMES.sling=(function(){
  const LV=[
    {name:'去火星',start:[110,330],target:[860,250,46],pl:[{x:480,y:470,r:16,m:.35,c:'#C9C6BD',n:'月球'}],pred:1.2},
    {name:'木星借力',start:[100,520],target:[880,150,52],pl:[{x:520,y:330,r:34,m:2.4,c:'#E2B07A',n:'木星',band:true}],wall:[[640,60,40,210]],pred:.75},
    {name:'旅行者路线',start:[90,540],target:[950,80,40],pl:[{x:360,y:330,r:30,m:2.0,c:'#E2B07A',n:'木星',band:true},{x:690,y:220,r:24,m:1.5,c:'#E9D49A',n:'土星',ring:true}],wall:[[520,0,30,190],[520,420,30,200]],pred:.5},
    {name:'金唱片',start:[80,560],target:[960,60,36],pl:[{x:300,y:380,r:30,m:2.1,c:'#E2B07A',n:'木星',band:true},{x:560,y:200,r:22,m:1.4,c:'#E9D49A',n:'土星',ring:true},{x:800,y:400,r:18,m:.9,c:'#8EC5E8',n:'天王星'}],pred:.45}];
  const GREET=['你好','Hello','Jambo','नमस्ते','Hola','مرحبا','Kia ora','こんにちは','Здравствуйте','Olá','雨声','心跳','笑声','鸟鸣','海浪'];
  let stopF=null;
  function start(host,api,lvArg){
    const rec=SAVE.game('sling'),lvI=clamp(lvArg==null?Math.min(rec.level||0,LV.length-1):lvArg,0,LV.length-1),L=LV[lvI];
    const C=stageCanvas(host),ctx=C.ctx,W=C.w(),H=C.h();
    const k=Math.min(W/1000,H/620),ox=(W-1000*k)/2,oy=(H-620*k)/2;
    const X=function(x){return ox+x*k;},Y=function(y){return oy+y*k;};
    const bg=starfield(W,H,31+lvI,320,['#02030A','#0A1026']);
    const st={p:null,v:null,flying:false,trail:[],tries:0,aim:null,t:0,done:false,boom:0};
    function reset(){st.p={x:L.start[0],y:L.start[1]};st.v={x:0,y:0};st.flying=false;st.trail=[];st.t=0;}
    reset();
    api.setScore(L.name+' · 第 <b>'+(st.tries+1)+'</b> 次');
    function accel(p){let ax=0,ay=0;L.pl.forEach(function(pl){const dx=pl.x-p.x,dy=pl.y-p.y,d2=dx*dx+dy*dy+400,d=Math.sqrt(d2),f=pl.m*42000/d2;ax+=f*dx/d;ay+=f*dy/d;});return {x:ax,y:ay};}
    function hitWall(p){return (L.wall||[]).some(function(w){return p.x>w[0]&&p.x<w[0]+w[2]&&p.y>w[1]&&p.y<w[1]+w[3];});}
    function step(p,v,dt){const a=accel(p);v.x+=a.x*dt;v.y+=a.y*dt;p.x+=v.x*dt;p.y+=v.y*dt;}
    function toWorld(e){const r=C.c.getBoundingClientRect();return {x:(e.clientX-r.left-ox)/k,y:(e.clientY-r.top-oy)/k};}
    C.c.addEventListener('pointerdown',function(e){if(st.flying||st.done)return;st.aim={s:toWorld(e),c:toWorld(e)};C.c.setPointerCapture(e.pointerId);});
    C.c.addEventListener('pointermove',function(e){if(st.aim)st.aim.c=toWorld(e);});
    C.c.addEventListener('pointerup',function(){
      if(!st.aim)return;const v=launchV();st.aim=null;
      if(Math.hypot(v.x,v.y)<20)return;
      st.v=v;st.flying=true;st.tries++;SFX.whoosh();api.setScore(L.name+' · 第 <b>'+st.tries+'</b> 次');
    });
    function launchV(){const a=st.aim;let dx=a.s.x-a.c.x,dy=a.s.y-a.c.y;const len=Math.hypot(dx,dy),mx=160;if(len>mx){dx*=mx/len;dy*=mx/len;}return {x:dx*2.6,y:dy*2.6};}
    stopF=loop(function(dt){
      if(st.flying){
        for(let i=0;i<4;i++){step(st.p,st.v,dt/4);}
        st.t+=dt;st.trail.push({x:st.p.x,y:st.p.y});if(st.trail.length>400)st.trail.shift();
        const tg=L.target;
        if(Math.hypot(st.p.x-tg[0],st.p.y-tg[1])<tg[2]){st.flying=false;st.done=true;SFX.ok();FX.sparkle(X(tg[0]),Y(tg[1]),'#F6C35B',30);setTimeout(win,700);}
        else if(L.pl.some(function(pl){return Math.hypot(st.p.x-pl.x,st.p.y-pl.y)<pl.r;})||hitWall(st.p)){st.flying=false;st.boom=.6;SFX.drop();buzz(30);setTimeout(reset,700);}
        else if(st.p.x<-60||st.p.x>1060||st.p.y<-60||st.p.y>680||st.t>14){st.flying=false;SFX.drop();setTimeout(reset,300);}
      }
      ctx.drawImage(bg,0,0,W,H);
      /* 太阳在画面左侧外，留一道暖光 */
      const sg=ctx.createRadialGradient(X(-80),Y(310),10,X(-80),Y(310),360*k);sg.addColorStop(0,'rgba(255,214,140,.45)');sg.addColorStop(1,'rgba(255,214,140,0)');ctx.fillStyle=sg;ctx.fillRect(0,0,W,H);
      (L.wall||[]).forEach(function(w){ctx.fillStyle='rgba(140,130,120,.25)';ctx.fillRect(X(w[0]),Y(w[1]),w[2]*k,w[3]*k);const R=rng(w[0]);ctx.fillStyle='#8E8B84';for(let i=0;i<14;i++){ctx.beginPath();ctx.arc(X(w[0]+R()*w[2]),Y(w[1]+R()*w[3]),(R()*3+1.5)*k,0,7);ctx.fill();}});
      const tg=L.target;ctx.strokeStyle='rgba(246,195,91,.85)';ctx.lineWidth=2;ctx.setLineDash([6,6]);ctx.beginPath();ctx.arc(X(tg[0]),Y(tg[1]),tg[2]*k,0,7);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle='rgba(246,195,91,.12)';ctx.beginPath();ctx.arc(X(tg[0]),Y(tg[1]),tg[2]*k,0,7);ctx.fill();
      ctx.fillStyle='#F6C35B';ctx.font='600 '+Math.round(13*Math.max(1,k*1.2))+'px sans-serif';ctx.textAlign='center';ctx.fillText(lvI===0?'火星':lvI===3?'星际空间':'目标',X(tg[0]),Y(tg[1]-tg[2]-8));
      L.pl.forEach(function(pl){
        const g=ctx.createRadialGradient(X(pl.x-pl.r*.3),Y(pl.y-pl.r*.3),1,X(pl.x),Y(pl.y),pl.r*k);g.addColorStop(0,'#fff');g.addColorStop(.25,pl.c);g.addColorStop(1,'#2A2A30');
        ctx.fillStyle='rgba(120,160,255,.06)';ctx.beginPath();ctx.arc(X(pl.x),Y(pl.y),pl.r*k*3.2,0,7);ctx.fill();
        if(pl.ring){ctx.strokeStyle='rgba(233,212,154,.7)';ctx.lineWidth=3*k;ctx.beginPath();ctx.ellipse(X(pl.x),Y(pl.y),pl.r*k*1.9,pl.r*k*.5,-.3,0,7);ctx.stroke();}
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(X(pl.x),Y(pl.y),pl.r*k,0,7);ctx.fill();
        if(pl.band){ctx.strokeStyle='rgba(160,100,60,.5)';ctx.lineWidth=3*k;for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(X(pl.x-pl.r*.9),Y(pl.y+i*pl.r*.35));ctx.lineTo(X(pl.x+pl.r*.9),Y(pl.y+i*pl.r*.35));ctx.stroke();}}
        ctx.fillStyle='rgba(234,240,251,.7)';ctx.font=Math.round(11*Math.max(1,k*1.2))+'px sans-serif';ctx.fillText(pl.n,X(pl.x),Y(pl.y+pl.r+16));
      });
      /* 地球 */
      ctx.fillStyle='#2F6FE4';ctx.beginPath();ctx.arc(X(L.start[0]),Y(L.start[1]),12*k,0,7);ctx.fill();
      /* 轨迹 */
      if(st.trail.length>1){ctx.strokeStyle='rgba(95,169,255,.7)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(X(st.trail[0].x),Y(st.trail[0].y));st.trail.forEach(function(p){ctx.lineTo(X(p.x),Y(p.y));});ctx.stroke();}
      /* 瞄准与预测 */
      if(st.aim){const v=launchV(),p={x:st.p.x,y:st.p.y},vv={x:v.x,y:v.y};
        ctx.fillStyle='rgba(246,195,91,.85)';for(let i=0;i<40*L.pred;i++){for(let j=0;j<3;j++)step(p,vv,1/120);if(i%2===0){ctx.beginPath();ctx.arc(X(p.x),Y(p.y),2,0,7);ctx.fill();}}
        ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(X(st.p.x),Y(st.p.y));ctx.lineTo(X(st.aim.c.x),Y(st.aim.c.y));ctx.stroke();}
      /* 探测器 */
      if(st.boom>0){st.boom-=dt;ctx.fillStyle='rgba(255,180,94,'+st.boom+')';ctx.beginPath();ctx.arc(X(st.p.x),Y(st.p.y),(1-st.boom)*30,0,7);ctx.fill();}
      else{ctx.save();ctx.translate(X(st.p.x),Y(st.p.y));ctx.fillStyle='#E9ECF0';ctx.fillRect(-4,-4,8,8);ctx.strokeStyle='#E9ECF0';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(-1,-8,6,3.4,6.0);ctx.stroke();ctx.restore();}
      if(!st.flying&&!st.aim&&!st.done){ctx.fillStyle='rgba(234,240,251,.8)';ctx.font='13px sans-serif';ctx.textAlign='center';ctx.fillText('从探测器往后拖，松手发射',W/2,H-20);}
    });
    function win(){
      if(stopF)stopF();
      const r=SAVE.game('sling'),first=(r.level||0)<lvI+1;r.level=Math.max(r.level||0,lvI+1);
      const stars=st.tries<=1?3:st.tries<=3?2:1;
      const notes=['探测器没有足够的燃料一路开到火星，大部分路程是“滑过去”的。发射时机和角度决定了一切。',
        '飞过大行星身边，借它的引力“甩”一下，能免费拐弯、加速。这叫引力助推。',
        '1977 年，旅行者 2 号赶上了一次一百多年一遇的行星排列，一口气飞掠了木星、土星、天王星和海王星。',
        '两艘旅行者号各带着一张金唱片，录有 55 种语言的问候。它们已经飞出了太阳风的边界，还在往外走。'];
      if(lvI===3){record(stars,first);return;}
      api.end({score:stars,big:'★'.repeat(stars)+'☆'.repeat(3-stars),dust:first?20+lvI*5:5,note:notes[lvI],lv:lvI,
        againLabel:'下一关：'+LV[lvI+1].name,again:function(){Games.start(lvI+1);}});
    }
    function record(stars,first){
      host.innerHTML='<div class="rec-wrap"><div class="paper rec-card"><div class="gm-k">金唱片</div><h3>选三样东西放进你的唱片</h3><div class="rec-disc"><span id="recPick"></span></div><div class="rec-opts">'+GREET.map(function(g,i){return '<button data-i="'+i+'">'+g+'</button>';}).join('')+'</div><button class="btn amber block" id="recGo" disabled>封存唱片</button></div></div>';
      const picked=[];
      $$('.rec-opts button',host).forEach(function(b){b.onclick=function(){const i=+b.getAttribute('data-i');const k=picked.indexOf(i);
        if(k>=0){picked.splice(k,1);b.classList.remove('on');}else if(picked.length<3){picked.push(i);b.classList.add('on');SFX.chime(picked.length+2);}
        byId('recPick').textContent=picked.map(function(x){return GREET[x];}).join(' · ');byId('recGo').disabled=picked.length<3;};});
      byId('recGo').onclick=function(){
        SFX.stamp();const r=SAVE.game('sling');r.record=picked.map(function(x){return GREET[x];});save();
        api.end({score:stars,big:'★'.repeat(stars)+'☆'.repeat(3-stars),dust:first?40:5,lv:3,
          note:'你的唱片里有：<b>'+r.record.join('、')+'</b>。<br>1977 年的金唱片里有 55 种语言的问候、雨声、心跳和各地的音乐。没人知道会不会有人听到，但人们还是认真挑了要放什么。'});
      };
    }
  }
  return {
    kind:'side',title:'引力弹弓',sub:'1977 · 旅行者号出发',year:'1977',music:'frontier',
    how:'从探测器往后拖，像拉弹弓一样，松手发射。<br>经过行星身边会被它的引力拉弯。飞进金色圆圈就算到达。',
    fact:'飞向外行星的探测器燃料有限，常常要绕着行星“借力”加速。这叫引力助推。',
    levels:function(){const r=S.games.sling||{};return LV.map(function(l,i){const open=i<=(r.level||0);return '<button class="btn sm '+(open?'ghost':'')+'" data-lv="'+i+'"'+(open?'':' disabled')+'>'+(i+1)+'. '+l.name+'</button>';}).join('');},
    badge:function(r){return r.level?('第 '+r.level+'/4 关'):'';},
    start:start,stop:function(){if(stopF)stopF();}
  };
})();
