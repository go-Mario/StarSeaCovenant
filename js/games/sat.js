"use strict";
/* =====================================================================
   卫星工坊（1957）：组装 → 登记 → 发射
   想告诉玩家的事：发射前要登记，登记要写哪些东西。
   ===================================================================== */
GAMES.sat=(function(){
  const PARTS=[
    {id:'wingL',name:'太阳翼',slot:'wingL',ic:'wing'},{id:'wingR',name:'太阳翼',slot:'wingR',ic:'wing'},
    {id:'ant',name:'天线',slot:'ant',ic:'ant'},{id:'eng',name:'推进器',slot:'eng',ic:'eng'},
    {id:'umb',name:'雨伞',decoy:'太空里不下雨。雨伞留在地上吧。',ic:'umb'},
    {id:'prop',name:'螺旋桨',decoy:'太空里几乎没有空气，螺旋桨转起来也推不动。',ic:'prop'}];
  const COLORS=['#E8775A','#F6C35B','#5FA9FF','#7FD1C1'];
  const ORBITS=[
    {id:'leo',name:'近地轨道',d:'几百公里高，绕地球一圈一个半小时。离地面近，拍照清楚，但挤。'},
    {id:'geo',name:'地球静止轨道',d:'约 3.6 万公里高，和地球自转同步，看起来一动不动。轨位要向国际电联申报。'},
    {id:'sso',name:'太阳同步轨道',d:'每天同一时间经过同一地方，适合对地观测。'}];
  const MISSIONS=['通信','对地观测','科学实验','导航'];
  let st=null,stopAnim=null;
  function partSVG(ic,col){
    if(ic==='wing')return '<svg viewBox="0 0 80 40"><rect x="2" y="4" width="76" height="32" rx="3" fill="#2D5FA8" stroke="#141824" stroke-width="2.5"/><path d="M21 4 V36 M40 4 V36 M59 4 V36 M2 20 H78" stroke="#8CC4F2" stroke-width="1.5"/></svg>';
    if(ic==='ant')return '<svg viewBox="0 0 60 60"><path d="M10 40 A26 26 0 0 0 50 40 Z" fill="#E9ECF0" stroke="#141824" stroke-width="2.5"/><path d="M30 40 L30 12" stroke="#141824" stroke-width="3"/><circle cx="30" cy="10" r="4" fill="#E8775A" stroke="#141824" stroke-width="2"/></svg>';
    if(ic==='eng')return '<svg viewBox="0 0 60 60"><path d="M20 10 H40 L48 46 H12 Z" fill="#9AA3B2" stroke="#141824" stroke-width="2.5"/><path d="M14 46 H46 L42 54 H18 Z" fill="#5A6474" stroke="#141824" stroke-width="2.5"/></svg>';
    if(ic==='umb')return '<svg viewBox="0 0 60 60"><path d="M6 30 A24 22 0 0 1 54 30 Z" fill="#E8775A" stroke="#141824" stroke-width="2.5"/><path d="M30 30 V50 Q30 56 24 54" stroke="#141824" stroke-width="3" fill="none"/></svg>';
    if(ic==='prop')return '<svg viewBox="0 0 60 60"><ellipse cx="30" cy="16" rx="7" ry="14" fill="#F6C35B" stroke="#141824" stroke-width="2.5"/><ellipse cx="30" cy="44" rx="7" ry="14" fill="#F6C35B" stroke="#141824" stroke-width="2.5"/><circle cx="30" cy="30" r="5" fill="#141824"/></svg>';
    return '';
  }
  function satSVG(){
    const c=COLORS[st.color];
    const f=st.filled;
    return '<svg class="sat-frame" viewBox="0 0 320 240">'+
      '<rect x="110" y="80" width="100" height="80" rx="10" fill="'+c+'" stroke="#141824" stroke-width="4"/><rect x="122" y="92" width="76" height="20" rx="4" fill="#fff" opacity=".35"/>'+
      '<circle cx="160" cy="132" r="12" fill="#141824"/><circle cx="160" cy="132" r="6" fill="#5FA9FF"/>'+
      slot('wingL',10,100,90,44,f.wingL?'<g transform="translate(10 100) scale(1.12 1.1)">'+inner('wing')+'</g><path d="M100 122 H110" stroke="#141824" stroke-width="4"/>':'')+
      slot('wingR',220,100,90,44,f.wingR?'<g transform="translate(220 100) scale(1.12 1.1)">'+inner('wing')+'</g><path d="M210 122 H220" stroke="#141824" stroke-width="4"/>':'')+
      slot('ant',130,14,60,60,f.ant?'<g transform="translate(130 18)">'+inner('ant')+'</g>':'')+
      slot('eng',130,164,60,60,f.eng?'<g transform="translate(130 162)">'+inner('eng')+'</g>':'')+
      '</svg>';
  }
  function inner(ic){return partSVG(ic).replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');}
  function slot(id,x,y,w,h,content){
    if(content)return content;
    return '<rect class="sat-slot" data-slot="'+id+'" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="8" fill="rgba(255,255,255,.08)" stroke="#F6C35B" stroke-width="2.5" stroke-dasharray="7 6"/>';
  }
  function renderBuild(host){
    host.innerHTML='<div class="sat-wrap"><div class="sat-steps"><b class="on">① 组装</b><b>② 登记</b><b>③ 发射</b></div>'+
      '<div class="sat-stage">'+satSVG()+'</div>'+
      '<div class="sat-colors">'+COLORS.map(function(c,i){return '<button class="sw'+(i===st.color?' on':'')+'" data-c="'+i+'" style="background:'+c+'"></button>';}).join('')+'</div>'+
      '<div class="sat-tray">'+PARTS.map(function(p){const used=p.slot&&st.filled[p.slot];return '<button class="part'+(used?' used':'')+'" data-p="'+p.id+'">'+partSVG(p.ic)+'<span>'+p.name+'</span></button>';}).join('')+'</div>'+
      '<div class="sat-tip">点零件，把它装到卫星上。有两件东西，太空里用不上。</div></div>';
    $$('.sw',host).forEach(function(b){b.onclick=function(){st.color=+b.getAttribute('data-c');SFX.pop();renderBuild(host);};});
    $$('.part',host).forEach(function(b){b.onclick=function(){
      const p=PARTS.find(function(x){return x.id===b.getAttribute('data-p');});
      if(p.decoy){SFX.error();b.classList.remove('shake');void b.offsetWidth;b.classList.add('shake');toast(p.decoy,2600);return;}
      if(st.filled[p.slot])return;
      st.filled[p.slot]=true;SFX.dock();buzz(15);
      const r=b.getBoundingClientRect();FX.sparkle(r.left+r.width/2,r.top+r.height/2,'#F6C35B',12);
      renderBuild(host);
      if(['wingL','wingR','ant','eng'].every(function(k){return st.filled[k];})){SFX.ok();setTimeout(function(){renderReg(host);},650);}
    };});
  }
  function renderReg(host){
    host.innerHTML='<div class="sat-wrap"><div class="sat-steps"><b>① 组装</b><b class="on">② 登记</b><b>③ 发射</b></div>'+
      '<div class="paper reg-form"><div class="rf-hd">空间物体登记表<small>依据《登记公约》第四条</small></div>'+
      '<label>名称</label><input id="rfName" maxlength="10" value="'+esc(st.name)+'">'+
      '<label>功能</label><div class="rf-opts" id="rfMis">'+MISSIONS.map(function(m,i){return '<button class="'+(i===st.mis?'on':'')+'" data-m="'+i+'">'+m+'</button>';}).join('')+'</div>'+
      '<label>轨道</label><div class="rf-orb" id="rfOrb">'+ORBITS.map(function(o,i){return '<button class="'+(i===st.orb?'on':'')+'" data-o="'+i+'"><b>'+o.name+'</b><small>'+o.d+'</small></button>';}).join('')+'</div>'+
      '<div class="rf-note">登记表要写：发射国、名称或编号、发射日期和地点、基本轨道参数、用途。登记之后，大家才知道天上这个东西是谁的、出了事找谁。</div>'+
      '<div class="btnrow"><button class="btn red" id="rfStamp">盖章登记</button><button class="btn ghost sm" id="rfSkip">不登记，直接发射</button></div></div></div>';
    $$('#rfMis button',host).forEach(function(b){b.onclick=function(){st.mis=+b.getAttribute('data-m');SFX.tap();$$('#rfMis button',host).forEach(function(x){x.classList.toggle('on',x===b);});};});
    $$('#rfOrb button',host).forEach(function(b){b.onclick=function(){st.orb=+b.getAttribute('data-o');SFX.tap();$$('#rfOrb button',host).forEach(function(x){x.classList.toggle('on',x===b);});};});
    byId('rfStamp').onclick=function(){if(st.launching)return;st.launching=true;byId('rfSkip').disabled=true;this.disabled=true;st.name=(byId('rfName').value||'星火-1').slice(0,10);st.reg=true;SFX.stamp();buzz(30);
      const f=$('.reg-form',host);const s=el('div','rf-stamp','已登记');f.appendChild(s);setTimeout(function(){launch(host);},900);};
    byId('rfSkip').onclick=function(){if(st.launching)return;st.launching=true;byId('rfStamp').disabled=true;st.name=(byId('rfName').value||'星火-1').slice(0,10);st.reg=false;SFX.tap();launch(host);};
  }
  /* 发射：黄昏的发射场 → 镜头跟着火箭往上，天慢慢变黑 → 卫星入轨 */
  function launch(host){
    host.innerHTML='<div class="sat-steps over"><b>① 组装</b><b>② 登记</b><b class="on">③ 发射</b></div>';
    const S2=stageCanvas(host),ctx=S2.ctx,W=S2.w(),H=S2.h();
    const space=GameArt.sky(W,H,{seed:7,band:{x:.5,y:.4,a:-.6,w:.14,al:.14}});
    const GY=H*.84,TX=W/2-34;
    /* 地面层：远山、发射塔、灯，预渲染一次 */
    const land=document.createElement('canvas');land.width=S2.c.width;land.height=S2.c.height;(function(){
      const g=land.getContext('2d'),d=land.width/W,R=rng(19);g.scale(d,d);
      [[GY-H*.07,'#2A2440',.05],[GY-H*.03,'#1B1830',.035]].forEach(function(l){const ph=R()*6;g.fillStyle=l[1];g.beginPath();g.moveTo(0,GY+2);for(let x=0;x<=W;x+=6)g.lineTo(x,l[0]-(Math.sin(x*.008+ph)*.6+Math.sin(x*.023+ph)*.4)*H*l[2]);g.lineTo(W,GY+2);g.fill();});
      let q=g.createLinearGradient(0,GY,0,H);q.addColorStop(0,'#14121E');q.addColorStop(1,'#07060C');g.fillStyle=q;g.fillRect(0,GY,W,H-GY);
      g.fillStyle='#2A2A34';g.fillRect(W/2-46,GY-4,92,6);
      /* 塔架 */
      g.strokeStyle='#4A3F3A';g.lineWidth=2;g.strokeRect(TX-8,GY-150,14,148);g.lineWidth=1;g.beginPath();for(let y=GY-150;y<GY;y+=12){g.moveTo(TX-8,y);g.lineTo(TX+6,y+12);g.moveTo(TX+6,y);g.lineTo(TX-8,y+12);}g.stroke();
      g.fillStyle='#4A3F3A';g.fillRect(TX+6,GY-118,16,3);g.fillRect(TX+6,GY-70,16,3);
      /* 远处的灯 */
      for(let i=0;i<14;i++){const x=R()*W,y=GY+2+R()*8;g.fillStyle='rgba(255,210,150,.8)';g.fillRect(x,y,1.5,1.5);}
    })();
    const dusk=function(k){/* k：0 地面 → 1 太空 */
      const q=ctx.createLinearGradient(0,0,0,H);
      q.addColorStop(0,'rgba(8,10,30,'+(1-k)+')');q.addColorStop(.55,'rgba(62,50,110,'+(1-k)+')');q.addColorStop(.85,'rgba(220,120,90,'+(1-k)+')');q.addColorStop(1,'rgba(255,190,120,'+(1-k)+')');return q;};
    let t=0,count=3,phase='count',camY=0,rocketY=0,smoke=[],orbitA=0,shake=0;
    SFX.radio();
    const col=COLORS[st.color];
    function rocket(x,y,fire){
      ctx.save();ctx.translate(x,y);
      if(fire){const op=ctx.globalCompositeOperation;ctx.globalCompositeOperation='lighter';
        GameArt.soft(ctx,0,10,60,'255,170,90',.6);
        const len=40+Math.random()*26,q=ctx.createLinearGradient(0,0,0,len);q.addColorStop(0,'rgba(255,255,235,1)');q.addColorStop(.3,'rgba(255,210,130,.9)');q.addColorStop(1,'rgba(255,110,40,0)');
        ctx.fillStyle=q;ctx.beginPath();ctx.moveTo(-9,0);ctx.quadraticCurveTo(-11,len*.5,0,len);ctx.quadraticCurveTo(11,len*.5,9,0);ctx.closePath();ctx.fill();ctx.globalCompositeOperation=op;}
      ctx.fillStyle='#2E2E36';ctx.beginPath();ctx.moveTo(-8,-4);ctx.lineTo(8,-4);ctx.lineTo(10,2);ctx.lineTo(-10,2);ctx.closePath();ctx.fill();
      /* 箭体：左亮右暗 */
      let q=ctx.createLinearGradient(-14,0,14,0);q.addColorStop(0,'#C9C4BA');q.addColorStop(.35,'#FBF8F1');q.addColorStop(1,'#8F8A80');
      ctx.fillStyle=q;ctx.beginPath();ctx.moveTo(-13,-4);ctx.lineTo(-13,-96);ctx.quadraticCurveTo(-13,-122,0,-138);ctx.quadraticCurveTo(13,-122,13,-96);ctx.lineTo(13,-4);ctx.closePath();ctx.fill();
      ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(-13,-60,26,1.2);ctx.fillRect(-13,-30,26,1.2);
      ctx.fillStyle=col;ctx.fillRect(-13,-92,26,12);ctx.fillStyle='rgba(255,255,255,.3)';ctx.fillRect(-8,-92,4,12);
      ctx.fillStyle='#1E2230';ctx.font=GameArt.font(7,700);ctx.textAlign='center';ctx.save();ctx.translate(2,-46);ctx.rotate(-1.5708);ctx.fillText(st.name.slice(0,6),0,0);ctx.restore();
      ctx.fillStyle='#A8302A';[-1,1].forEach(function(k){ctx.beginPath();ctx.moveTo(13*k,-26);ctx.lineTo(25*k,0);ctx.lineTo(25*k,4);ctx.lineTo(13*k,-2);ctx.closePath();ctx.fill();});
      ctx.restore();
    }
    stopAnim=loop(function(dt){
      t+=dt;
      if(phase==='count'){if(t>1){t=0;count--;if(count>0)SFX.pluck(count+2);else{phase='lift';SFX.launch();buzz([60,40,60]);shake=1;}}}
      else if(phase==='lift'){rocketY+=dt*(60+t*260);camY=Math.max(0,rocketY-H*.35);shake=Math.max(0,shake-dt*.4);
        const n=rocketY<H*.4?5:2;for(let i=0;i<n;i++){const low=rocketY<60;smoke.push({x:W/2+(Math.random()-.5)*20,y:GY-rocketY+40,vx:(low?(Math.random()<.5?-1:1)*(60+Math.random()*120):(Math.random()-.5)*40),vy:low?-Math.random()*10:30+Math.random()*50,r:10+Math.random()*14,a:1});}
        if(t>3.4){phase='orbit';t=0;SFX.whoosh();}}
      else if(phase==='orbit'){orbitA+=dt*1.4;if(t>4.2&&!st.done){st.done=true;finish();}}
      /* 画 */
      if(phase!=='orbit'){
        const off=camY,k=clamp(camY/(H*1.6),0,1);
        const sx=(Math.random()-.5)*shake*4,sy=(Math.random()-.5)*shake*3;
        ctx.save();ctx.translate(sx,sy);
        ctx.drawImage(space,0,0,W,H);
        ctx.fillStyle=dusk(k);ctx.fillRect(-10,-10,W+20,H+20);
        ctx.drawImage(land,0,off,W,H);
        const ry=GY-rocketY+off;
        /* 塔上的灯 */
        if(off<H)[GY-150,GY-118,GY-70].forEach(function(y,i){GameArt.soft(ctx,TX-1,y+off,10,'255,120,90',.4+.4*Math.sin(t*4+i));});
        smoke=smoke.filter(function(p){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=1-dt*.8;p.r+=dt*18;p.a-=dt*.32;return p.a>0;});
        smoke.forEach(function(p){const warm=clamp(1-Math.hypot(p.x-W/2,p.y-(ry-off))/200,0,1);
          GameArt.soft(ctx,p.x,p.y+off,p.r*1.6,warm>.3?'255,200,150':'225,220,215',p.a*(.45+warm*.3));});
        rocket(W/2,ry,phase==='lift');
        ctx.restore();
        if(phase==='count'&&count>0){ctx.save();ctx.globalAlpha=clamp(1.2-t,0,1);GameArt.glowText(ctx,String(count),W/2,H*.32,76,'#F6D58E',24);ctx.restore();}
      }else{
        ctx.drawImage(space,0,0,W,H);
        const ex=W/2,ey=H*.56,er=Math.min(W,H)*.22,tilt=-.2;
        const rx=er*(st.orb===1?2.1:1.45),ry=rx*.42;
        const P=function(a){return {x:ex+Math.cos(a)*rx*Math.cos(tilt)-Math.sin(a)*ry*Math.sin(tilt),y:ey+Math.cos(a)*rx*Math.sin(tilt)+Math.sin(a)*ry*Math.cos(tilt),back:Math.sin(a)<0};};
        const arc=function(back){ctx.strokeStyle='rgba(246,195,91,'+(back?.25:.6)+')';ctx.setLineDash([4,8]);ctx.lineDashOffset=-t*10;ctx.lineWidth=1.4;ctx.save();ctx.translate(ex,ey);ctx.rotate(tilt);ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,back?Math.PI:0,back?Math.PI*2:Math.PI);ctx.stroke();ctx.restore();ctx.setLineDash([]);};
        const sp=P(orbitA);
        arc(true);
        if(sp.back)GameArt.satellite(ctx,sp.x,sp.y,.8,orbitA,col);
        GameArt.soft(ctx,ex,ey,er*1.6,'70,140,255',.2);
        GameArt.drawPlanet(ctx,'earth',ex,ey,er,12);
        arc(false);
        if(!sp.back)GameArt.satellite(ctx,sp.x,sp.y,1,orbitA,col);
        const ph=(t*1.7)%1;ctx.strokeStyle='rgba(246,195,91,'+(1-ph)*.7+')';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(sp.x,sp.y,10+ph*22,0,7);ctx.stroke();
        ctx.save();ctx.globalAlpha=clamp(t*1.5,0,1);GameArt.glowText(ctx,'「'+st.name+'」进入'+ORBITS[st.orb].name,W/2,H*.16,19,'#F6D58E',12);ctx.restore();
        if(Math.floor(t/0.6)!==Math.floor((t-dt)/0.6))beep(1020,.18,'square',.02);
      }
    });
  }
  function finish(){
    const rec=SAVE.game('sat');rec.list=rec.list||[];
    const first=!rec.launched;
    rec.list.unshift({name:st.name,orb:ORBITS[st.orb].name,mis:MISSIONS[st.mis],reg:st.reg,d:todayStr()});if(rec.list.length>12)rec.list.pop();
    rec.launched=true;rec.reg=(rec.reg||0)+(st.reg?1:0);
    const dust=(first?30:10)+(st.reg?10:0);
    setTimeout(function(){
      if(stopAnim)stopAnim();
      Games.api.end({big:'「'+esc(st.name)+'」'+(st.reg?'<span class="stamp">已登记</span>':'<span class="stamp" style="color:#7C8293;border-color:#7C8293">未登记</span>'),dust:dust,rec:{},
        note:st.reg?'你的卫星已经写进登记册。1975 年的《登记公约》要求发射国登记每一个送上太空的物体，并报告联合国。这样，天上的每样东西都能找到主人。':'卫星上天了，但没有登记。没人知道它是谁的，出了事也没法找你。第四章里，你会看到一个没登记的采矿站惹出的麻烦。',
        againLabel:'再造一颗'});
    },400);
  }
  return {
    kind:'side',title:'卫星工坊',sub:'1957 · 第一颗人造卫星升空',year:'1957',music:'cartoon',
    how:'选零件，把卫星装好；填一张登记表；然后发射。<br>操作：点击零件即可安装。',
    fact:'1957 年 10 月，斯普特尼克 1 号升空。它只是一个装着电台的金属球，会发出“嘀——嘀”的信号。',
    badge:function(r){return r.list?('已发射 '+r.list.length):'';},
    start:function(host){st={color:0,filled:{},name:'星火-'+(((S.games.sat&&S.games.sat.list)||[]).length+1),mis:0,orb:0,reg:false,done:false};renderBuild(host);},
    stop:function(){if(stopAnim)stopAnim();stopAnim=null;}
  };
})();
