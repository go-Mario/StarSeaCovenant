"use strict";
/* =====================================================================
   休憩舱：三个解压小游戏。没有失败，只有放松。
   · 同一片天：连出不同文化里的星座
   · 碎片清扫：划过太空垃圾，把它们送进大气层烧掉
   · 引力画板：放几颗“星”，看光点绕着它们画画
   ===================================================================== */
GAMES.const=(function(){
  /* 坐标是示意位置，不是精确星图 */
  const SETS=[
   {id:'beidou',name:'北斗七星',from:'中国',
    stars:[[.72,.28,'天枢'],[.72,.46,'天璇'],[.54,.52,'天玑'],[.52,.36,'天权'],[.39,.32,'玉衡'],[.27,.3,'开阳'],[.13,.4,'摇光']],
    lines:[[0,1],[1,2],[2,3],[3,0],[3,4],[4,5],[5,6]],
    note:'古人看北斗的斗柄判断季节：“斗柄东指，天下皆春；斗柄南指，天下皆夏。”同一组星，在欧洲叫“大勺子”，是大熊座的一部分。'},
   {id:'shen',name:'参宿与猎户',from:'中国 · 古希腊',
    stars:[[.33,.2,'参宿四'],[.64,.24,'参宿五'],[.42,.5,'参宿一'],[.5,.48,'参宿二'],[.58,.46,'参宿三'],[.38,.8,'参宿六'],[.67,.77,'参宿七']],
    lines:[[0,1],[0,2],[1,4],[2,3],[3,4],[2,5],[4,6]],
    note:'在中国，这是“参宿”。参宿和心宿此起彼落，永远不会同时出现在夜空，杜甫写过“人生不相见，动如参与商”。在古希腊，它是猎人奥利翁，腰间那三颗星是他的腰带。'},
   {id:'crux',name:'南十字',from:'南半球各民族',
    stars:[[.5,.16,'十字架三'],[.48,.82,'十字架一'],[.3,.46,'十字架二'],[.68,.42,'十字架四'],[.57,.58,''],[.12,.66,'半人马α'],[.2,.56,'半人马β']],
    lines:[[0,1],[2,3],[5,6]],
    note:'南半球的航海者靠它找南方。毛利人叫它 Māhutonga；澳大利亚原住民把它旁边的暗星云看成“天上的鸸鹋”的头。左边两颗亮星是半人马座的“指针星”。'},
   {id:'pleiades',name:'七姐妹',from:'毛利 · 日本 · 中国 · 印度…',
    stars:[[.5,.5,''],[.66,.52,''],[.69,.43,''],[.35,.42,''],[.42,.31,''],[.4,.57,''],[.51,.27,'']],
    lines:[[3,4],[4,6],[6,0],[0,1],[1,2],[3,5],[5,0]],
    note:'这一小团星，几乎每个民族都有名字：中国叫“昴宿”，日本叫“すばる”，印度叫 Krittika，毛利人叫 Matariki。新西兰从 2022 年起，把 Matariki 升起的时节定为公共假日，当作新年。'},
   {id:'triangle',name:'夏夜大三角',from:'中国 · 阿拉伯 · 欧洲',
    stars:[[.28,.24,'织女'],[.72,.2,'天津四'],[.56,.8,'牛郎']],
    lines:[[0,1],[1,2],[2,0]],milky:true,
    note:'织女星和牛郎星隔着银河，七夕的故事就从这里来；天津四正好在银河上，像一座桥。这几颗星的西方名字 Vega、Altair、Deneb，都来自阿拉伯语。'}
  ];
  let stopF=null;
  function start(host,api,lvArg){
    const rec=SAVE.game('const');rec.done=rec.done||[];
    const idx=lvArg!=null?lvArg:SETS.findIndex(function(s){return rec.done.indexOf(s.id)<0;});const set=SETS[idx<0?0:idx];
    const C=stageCanvas(host),ctx=C.ctx,W=C.w(),H=C.h();
    const bg=starfield(W,H,51+idx,520,['#02030A','#0A1026']);
    const box={x:W*.1,y:H*.12,w:W*.8,h:H*.66};
    const P=set.stars.map(function(s){return {x:box.x+s[0]*box.w,y:box.y+s[1]*box.h,n:s[2]};});
    const drawn=[],st={sel:-1,idle:0,t:0,done:false,glow:0,ripples:[]};
    api.setScore(set.name+' · '+set.from);
    function key(a,b){return a<b?a+'-'+b:b+'-'+a;}
    C.c.addEventListener('pointerdown',function(e){
      if(st.done)return;const r=C.c.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
      let hit=-1,bd=1e9;P.forEach(function(p,i){const d=Math.hypot(p.x-x,p.y-y);if(d<36&&d<bd){bd=d;hit=i;}});
      st.idle=0;if(hit<0){st.sel=-1;return;}
      st.ripples.push({x:P[hit].x,y:P[hit].y,t:0});
      if(st.sel<0||st.sel===hit){st.sel=hit;SFX.pluck(hit);return;}
      const k=key(st.sel,hit),ok=set.lines.some(function(l){return key(l[0],l[1])===k;});
      if(ok&&drawn.indexOf(k)<0){drawn.push(k);SFX.chime(drawn.length+1);buzz(8);
        if(drawn.length===set.lines.length){st.done=true;st.glow=0;setTimeout(function(){SFX.ach();FX.center(['#F6C35B','#fff','#9FD3FF']);},200);setTimeout(finish,2200);}}
      else SFX.pluck(hit);
      st.sel=hit;
    });
    stopF=loop(function(dt){
      st.t+=dt;st.idle+=dt;if(st.done)st.glow=Math.min(1,st.glow+dt*.8);
      ctx.drawImage(bg,0,0,W,H);
      if(set.milky){ctx.save();ctx.translate(W*.5,H*.5);ctx.rotate(-1.1);const g=ctx.createLinearGradient(0,-H*.12,0,H*.12);g.addColorStop(0,'rgba(200,200,255,0)');g.addColorStop(.5,'rgba(220,210,240,.18)');g.addColorStop(1,'rgba(200,200,255,0)');ctx.fillStyle=g;ctx.fillRect(-W,-H*.12,W*2,H*.24);ctx.restore();}
      /* 提示：闲着 5 秒，淡淡地画出该连的线 */
      if(st.idle>5&&!st.done){ctx.setLineDash([3,8]);ctx.strokeStyle='rgba(234,240,251,'+Math.min(.35,(st.idle-5)*.1)+')';ctx.lineWidth=1;set.lines.forEach(function(l){if(drawn.indexOf(key(l[0],l[1]))>=0)return;ctx.beginPath();ctx.moveTo(P[l[0]].x,P[l[0]].y);ctx.lineTo(P[l[1]].x,P[l[1]].y);ctx.stroke();});ctx.setLineDash([]);}
      ctx.strokeStyle='rgba(246,195,91,'+(.75+st.glow*.25)+')';ctx.lineWidth=2+st.glow*1.5;ctx.shadowColor='#F6C35B';ctx.shadowBlur=8+st.glow*16;
      drawn.forEach(function(k){const ab=k.split('-');ctx.beginPath();ctx.moveTo(P[+ab[0]].x,P[+ab[0]].y);ctx.lineTo(P[+ab[1]].x,P[+ab[1]].y);ctx.stroke();});
      ctx.shadowBlur=0;
      P.forEach(function(p,i){const tw=.75+.25*Math.sin(st.t*2+i);
        const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,16);g.addColorStop(0,'rgba(255,255,255,'+tw+')');g.addColorStop(.3,'rgba(200,220,255,.35)');g.addColorStop(1,'rgba(200,220,255,0)');
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,16,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(p.x,p.y,3.2,0,7);ctx.fill();
        if(i===st.sel){ctx.strokeStyle='#F6C35B';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,13,0,7);ctx.stroke();}
        if(p.n&&(st.done||i===st.sel)){ctx.fillStyle='rgba(234,240,251,.85)';ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillText(p.n,p.x,p.y+28);}});
      st.ripples=st.ripples.filter(function(r){r.t+=dt;return r.t<.6;});
      st.ripples.forEach(function(r){ctx.strokeStyle='rgba(246,195,91,'+(1-r.t/.6)+')';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(r.x,r.y,8+r.t*50,0,7);ctx.stroke();});
      ctx.fillStyle='rgba(234,240,251,.75)';ctx.font='13px sans-serif';ctx.textAlign='center';
      ctx.fillText(st.done?set.name:'点一颗星，再点另一颗，把它们连起来（'+drawn.length+'/'+set.lines.length+'）',W/2,H-26);
    });
    function finish(){
      if(stopF)stopF();
      const first=rec.done.indexOf(set.id)<0;if(first)rec.done.push(set.id);save();
      const nxt=SETS.findIndex(function(s){return rec.done.indexOf(s.id)<0;});
      api.end({big:set.name,dust:first?12:3,note:set.note,
        againLabel:nxt>=0?'下一组：'+SETS[nxt].name:'再看一遍',again:function(){Games.start(nxt>=0?nxt:idx);}});
    }
  }
  return {kind:'relax',title:'同一片天',sub:'不同文化，看见的是同一片星空',
    how:'点一颗星，再点另一颗，把属于同一个星座的星连起来。没有时间限制，不会失败。发呆五秒，会出现提示线。',
    fact:'几千年来，世界各地的人看着同一片星空，编出了不一样的故事。',
    levels:function(){const r=S.games.const||{};return SETS.map(function(s,i){const d=(r.done||[]).indexOf(s.id)>=0;return '<button class="btn sm ghost" data-lv="'+i+'">'+(d?'✓ ':'')+s.name+'</button>';}).join('');},
    badge:function(r){return r.done?(r.done.length+'/5'):'';},
    start:start,stop:function(){if(stopF)stopF();}};
})();

GAMES.sweep=(function(){
  let stopF=null;
  const KINDS=['bolt','panel','stage','chip','tank'];
  function start(host,api){
    const C=stageCanvas(host),ctx=C.ctx,W=C.w(),H=C.h();
    const bg=starfield(W,H,61,240);
    const st={t:0,left:60,items:[],burns:[],trail:[],score:0,combo:0,comboT:0,down:false,spawn:0,over:false,hitSat:0};
    function spawn(){
      const sat=Math.random()<.12,fromL=Math.random()<.5;
      st.items.push({x:fromL?-30:W+30,y:H*(.12+Math.random()*.55),vx:(fromL?1:-1)*(40+Math.random()*70),vy:(Math.random()-.5)*20,rot:Math.random()*6,vr:(Math.random()-.5)*2,
        k:sat?'sat':KINDS[Math.floor(Math.random()*KINDS.length)],s:sat?1:(.7+Math.random()*.8),alive:true});
    }
    function slice(x0,y0,x1,y1){
      let n=0;
      st.items.forEach(function(it){if(!it.alive)return;
        const dx=x1-x0,dy=y1-y0,L2=dx*dx+dy*dy||1,t=clamp(((it.x-x0)*dx+(it.y-y0)*dy)/L2,0,1),px=x0+dx*t,py=y0+dy*t;
        if(Math.hypot(it.x-px,it.y-py)<22*it.s){it.alive=false;
          if(it.k==='sat'){st.hitSat++;st.score=Math.max(0,st.score-3);SFX.error();buzz([40,30,40]);st.burns.push({x:it.x,y:it.y,t:0,bad:true});}
          else{n++;st.score++;st.burns.push({x:it.x,y:it.y,t:0,vx:it.vx*.3,vy:120});}}});
      if(n>0){st.combo+=n;st.comboT=.6;for(let i=0;i<n;i++)setTimeout(function(){SFX.chime(st.combo+i);},i*60);buzz(8);api.setScore('清掉 <b>'+st.score+'</b> 块');}
    }
    let last=null;
    C.c.addEventListener('pointerdown',function(e){st.down=true;const r=C.c.getBoundingClientRect();last={x:e.clientX-r.left,y:e.clientY-r.top};st.trail=[last];C.c.setPointerCapture(e.pointerId);});
    C.c.addEventListener('pointermove',function(e){if(!st.down||st.over)return;const r=C.c.getBoundingClientRect(),p={x:e.clientX-r.left,y:e.clientY-r.top};slice(last.x,last.y,p.x,p.y);last=p;st.trail.push(p);if(st.trail.length>12)st.trail.shift();});
    C.c.addEventListener('pointerup',function(){st.down=false;st.combo=0;});
    api.setScore('清掉 <b>0</b> 块');
    function drawItem(it){
      ctx.save();ctx.translate(it.x,it.y);ctx.rotate(it.rot);ctx.scale(it.s,it.s);ctx.strokeStyle='#141824';ctx.lineWidth=1.6;
      if(it.k==='sat'){ctx.fillStyle='#F6C35B';ctx.fillRect(-8,-6,16,12);ctx.strokeRect(-8,-6,16,12);ctx.fillStyle='#2D5FA8';ctx.fillRect(-26,-4,16,8);ctx.fillRect(10,-4,16,8);ctx.strokeStyle='#5FA9FF';ctx.beginPath();ctx.arc(0,0,20,0,7);ctx.stroke();}
      else if(it.k==='bolt'){ctx.fillStyle='#9AA3B2';ctx.fillRect(-10,-3,20,6);ctx.strokeRect(-10,-3,20,6);ctx.fillRect(-12,-6,5,12);}
      else if(it.k==='panel'){ctx.fillStyle='#3A4A66';ctx.beginPath();ctx.moveTo(-14,-8);ctx.lineTo(12,-10);ctx.lineTo(14,8);ctx.lineTo(-10,10);ctx.closePath();ctx.fill();ctx.stroke();}
      else if(it.k==='stage'){ctx.fillStyle='#E9ECF0';ctx.fillRect(-18,-7,36,14);ctx.strokeRect(-18,-7,36,14);ctx.fillStyle='#B8362B';ctx.fillRect(-18,-7,6,14);}
      else if(it.k==='tank'){ctx.fillStyle='#C9C6BD';ctx.beginPath();ctx.ellipse(0,0,12,8,0,0,7);ctx.fill();ctx.stroke();}
      else{ctx.fillStyle='#D8B23C';ctx.fillRect(-6,-6,12,12);ctx.strokeRect(-6,-6,12,12);}
      ctx.restore();
    }
    stopF=loop(function(dt){
      if(!st.over){st.t+=dt;st.left=Math.max(0,60-st.t);st.spawn-=dt;if(st.spawn<=0){spawn();st.spawn=Math.max(.22,.7-st.t*.006);}
        if(st.left<=0){st.over=true;setTimeout(done,600);}}
      st.comboT-=dt;
      ctx.drawImage(bg,0,0,W,H);
      const ey=H*1.75,er=H*1.05;const g=ctx.createRadialGradient(W/2,ey-er*.7,er*.2,W/2,ey,er);g.addColorStop(0,'#5FA9FF');g.addColorStop(.5,'#1E4FA8');g.addColorStop(1,'#0A1A33');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(W/2,ey,er,0,7);ctx.fill();ctx.strokeStyle='rgba(159,211,255,.8)';ctx.lineWidth=5;ctx.stroke();
      st.items.forEach(function(it){it.x+=it.vx*dt;it.y+=it.vy*dt;it.rot+=it.vr*dt;});
      st.items=st.items.filter(function(it){return it.alive&&it.x>-60&&it.x<W+60;});
      st.items.forEach(drawItem);
      st.burns=st.burns.filter(function(b){b.t+=dt;return b.t<1.2;});
      st.burns.forEach(function(b){
        if(b.bad){ctx.strokeStyle='rgba(255,106,82,'+(1-b.t)+')';ctx.lineWidth=3;ctx.beginPath();ctx.arc(b.x,b.y,10+b.t*40,0,7);ctx.stroke();ctx.fillStyle='rgba(255,106,82,'+(1-b.t)+')';ctx.font='600 13px sans-serif';ctx.textAlign='center';ctx.fillText('那是在用的卫星！',b.x,b.y-24);return;}
        const x=b.x+b.vx*b.t,y=b.y+b.vy*b.t*b.t*1.4+b.t*60;
        const gr=ctx.createLinearGradient(x,y-30,x,y);gr.addColorStop(0,'rgba(255,180,94,0)');gr.addColorStop(1,'rgba(255,214,150,'+(1-b.t/1.2)+')');
        ctx.strokeStyle=gr;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x,y-34);ctx.lineTo(x,y);ctx.stroke();ctx.fillStyle='rgba(255,240,200,'+(1-b.t/1.2)+')';ctx.beginPath();ctx.arc(x,y,3,0,7);ctx.fill();});
      if(st.trail.length>1&&st.down){ctx.strokeStyle='rgba(159,211,255,.8)';ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(st.trail[0].x,st.trail[0].y);st.trail.forEach(function(p){ctx.lineTo(p.x,p.y);});ctx.stroke();}
      if(st.comboT>0&&st.combo>=3){ctx.fillStyle='#F6C35B';ctx.font='700 20px sans-serif';ctx.textAlign='center';ctx.fillText('连清 ×'+st.combo,W/2,H*.18);}
      ctx.fillStyle='rgba(234,240,251,.8)';ctx.font='13px sans-serif';ctx.textAlign='center';ctx.fillText('划过碎片，送它们进大气层 · 避开带蓝圈的卫星 · '+Math.ceil(st.left)+' 秒',W/2,H-18);
    });
    function done(){
      if(stopF)stopF();
      api.end({score:st.score,big:'清掉 '+st.score+' 块',dust:Math.min(30,Math.floor(st.score/3)),
        note:(st.hitSat?'你误伤了 '+st.hitSat+' 颗在用的卫星。真实的清除任务会反复确认目标，宁可慢也不能错。<br>':'')+'据公开估计，轨道上直径超过 1 厘米的碎片有上百万块，超过 10 厘米的有数万块。真正去“扫”它们，比这个游戏难得多：每一块都有主人，动之前要先弄清是谁的。'});
    }
  }
  return {kind:'relax',title:'碎片清扫',sub:'把太空垃圾送回大气层',
    how:'手指划过飘过的碎片，它们会掉进大气层烧掉。一笔划掉几块会有连击。<br>带蓝色圆圈的是还在工作的卫星，别碰。一局 60 秒。',
    fact:'太空碎片飞得比子弹还快，一颗螺丝钉也能把卫星打出洞。',
    badge:function(r){return r.best!=null?('最多 '+r.best):'';},
    start:start,stop:function(){if(stopF)stopF();}};
})();

GAMES.paint=(function(){
  let stopF=null;
  const THEMES=[{n:'极光',h:[150,190]},{n:'余晖',h:[10,45]},{n:'星海',h:[200,280]},{n:'彩虹',h:[0,360]}];
  function start(host,api){
    host.innerHTML='<div class="pt-bar"><button class="btn sm ghost" id="ptTheme">配色：极光</button><button class="btn sm ghost" id="ptClear">清空</button><button class="btn sm amber" id="ptSave">保存画作</button><button class="btn sm green" id="ptDone">画好了</button></div>';
    const C=stageCanvas(host,'pt'),ctx=C.ctx,W=C.w(),H=C.h();
    const trail=document.createElement('canvas');trail.width=C.c.width;trail.height=C.c.height;const tg=trail.getContext('2d');tg.setTransform(DPR(),0,0,DPR(),0,0);
    tg.fillStyle='#04050C';tg.fillRect(0,0,W,H);
    const st={wells:[{x:W/2,y:H/2,m:1}],ps:[],theme:0,t:0,down:null,emit:0};
    function addP(x,y,vx,vy){const th=THEMES[st.theme],h=th.h[0]+Math.random()*(th.h[1]-th.h[0]);st.ps.push({x:x,y:y,vx:vx,vy:vy,h:h,life:14});if(st.ps.length>900)st.ps.shift();}
    C.c.addEventListener('pointerdown',function(e){const r=C.c.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;st.down={x:x,y:y,t:performance.now(),px:x,py:y,moved:false};C.c.setPointerCapture(e.pointerId);});
    C.c.addEventListener('pointermove',function(e){if(!st.down)return;const r=C.c.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
      if(Math.hypot(x-st.down.x,y-st.down.y)>8)st.down.moved=true;
      if(st.down.moved){for(let i=0;i<3;i++)addP(x,y,(x-st.down.px)*6+(Math.random()-.5)*30,(y-st.down.py)*6+(Math.random()-.5)*30);if(Math.random()<.3)SFX.pluck(Math.floor(y/H*10));}
      st.down.px=x;st.down.py=y;});
    C.c.addEventListener('pointerup',function(){
      if(st.down&&!st.down.moved){if(st.wells.length>=5)st.wells.shift();st.wells.push({x:st.down.x,y:st.down.y,m:.8+Math.random()*.6});SFX.chime(st.wells.length+2);
        for(let i=0;i<24;i++){const a=i/24*6.283;addP(st.down.x+Math.cos(a)*60,st.down.y+Math.sin(a)*60,-Math.sin(a)*120,Math.cos(a)*120);}}
      st.down=null;});
    byId('ptTheme').onclick=function(){st.theme=(st.theme+1)%THEMES.length;this.textContent='配色：'+THEMES[st.theme].n;SFX.tap();};
    byId('ptClear').onclick=function(){tg.fillStyle='#04050C';tg.fillRect(0,0,W,H);st.ps=[];SFX.whoosh();};
    byId('ptSave').onclick=function(){
      try{const a=document.createElement('a');a.download='星海公约-引力画板.png';a.href=trail.toDataURL('image/png');document.body.appendChild(a);a.click();a.remove();
        SAVE.game('paint').saved=true;save();checkAchs();toast('已保存。手机上如果没反应，可以截屏保存。');SFX.ok();}catch(e){toast('这个浏览器不支持直接保存，截屏也可以。');}};
    byId('ptDone').onclick=function(){SFX.tap();finish();};
    /* 开场先放一圈，免得画面是空的 */
    for(let i=0;i<60;i++){const a=i/60*6.283;addP(W/2+Math.cos(a)*120,H/2+Math.sin(a)*120,-Math.sin(a)*140,Math.cos(a)*140);}
    stopF=loop(function(dt){
      st.t+=dt;
      tg.fillStyle='rgba(4,5,12,.035)';tg.fillRect(0,0,W,H);
      tg.globalCompositeOperation='lighter';
      st.ps.forEach(function(p){
        let ax=0,ay=0;st.wells.forEach(function(w){const dx=w.x-p.x,dy=w.y-p.y,d2=dx*dx+dy*dy+900,d=Math.sqrt(d2),f=w.m*60000/d2;ax+=f*dx/d;ay+=f*dy/d;});
        const ox=p.x,oy=p.y;p.vx+=ax*dt;p.vy+=ay*dt;p.vx*=.999;p.vy*=.999;p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;
        tg.strokeStyle='hsla('+((p.h+st.t*8)%360)+',85%,62%,.55)';tg.lineWidth=1.4;tg.beginPath();tg.moveTo(ox,oy);tg.lineTo(p.x,p.y);tg.stroke();
      });
      tg.globalCompositeOperation='source-over';
      st.ps=st.ps.filter(function(p){return p.life>0&&p.x>-W&&p.x<W*2&&p.y>-H&&p.y<H*2;});
      ctx.drawImage(trail,0,0,W,H);
      st.wells.forEach(function(w){const g=ctx.createRadialGradient(w.x,w.y,0,w.x,w.y,22);g.addColorStop(0,'rgba(255,248,220,.95)');g.addColorStop(1,'rgba(255,220,150,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(w.x,w.y,22,0,7);ctx.fill();});
      ctx.fillStyle='rgba(234,240,251,.6)';ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillText('点一下放一颗“星”（最多 5 颗）· 按住拖动，把光甩出去',W/2,H-16);
    });
    function finish(){if(stopF)stopF();SAVE.game('paint').count=(SAVE.game('paint').count||0)+1;save();
      api.end({big:'一幅星轨',dust:5,note:'行星绕着恒星转，月球绕着地球转，探测器借着行星的引力拐弯，用的都是同一条万有引力定律。'});}
  }
  return {kind:'relax',title:'引力画板',sub:'没有目标，只有轨迹',
    how:'点一下放一颗“星”，光点会绕着它转；按住拖动，把光甩出去。<br>想停就点“画好了”。画得好看可以保存下来。',
    fact:'你画出的每一条曲线，都和真实的轨道遵守同一条物理定律。',
    badge:function(r){return r.count?('画了 '+r.count+' 幅'):'';},
    start:start,stop:function(){if(stopF)stopF();}};
})();
