"use strict";
/* =====================================================================
   小游戏框架：统一的标题栏、说明卡、结算卡。
   支线（side）跟着人类航天史走；休憩舱（relax）是解压用的，
   玩完会恢复精力，下一章开庭时多一格气势。
   ===================================================================== */
const GAMES={};
const Games=(function(){
  let cur=null,curId='',running=false;
  const stage=function(){return byId('gmStage');};
  function setScore(t){byId('gmScore').innerHTML=t||'';}
  function relaxGain(){
    const k='rx-'+todayKey();S.rxCount=S.rxCount||{};const n=S.rxCount[k]||0;S.rxCount[k]=n+1;
    return n<3?18:n<6?8:3;
  }
  function open(id){
    const G=GAMES[id];if(!G)return;
    cur=G;curId=id;
    byId('game').className='layer on kind-'+G.kind+' g-'+id;
    byId('gmTitle').textContent=G.title;byId('gmSub').textContent=G.sub||'';
    setScore('');stage().innerHTML='';
    byId('gmResult').classList.remove('on');
    const intro=byId('gmIntro');
    intro.innerHTML='<div class="paper gm-in"><div class="gm-k">'+(G.kind==='relax'?'休憩舱':'人类的太空之路 · '+(G.year||''))+'</div><h3>'+G.title+'</h3>'+
      '<div class="gm-how">'+G.how+'</div>'+(G.fact?'<div class="gm-fact"><b>你知道吗</b>'+fill(G.fact)+'</div>':'')+
      (G.levels?'<div class="gm-levels">'+G.levels()+'</div>':'')+
      '<div class="btnrow"><button class="btn '+(G.kind==='relax'?'green':'amber')+'" id="gmStart">'+(G.kind==='relax'?'开始放松':'开始')+'</button></div></div>';
    intro.classList.add('on');
    byId('gmStart').onclick=function(){SFX.tap();start();};
    $$('#gmIntro [data-lv]').forEach(function(b){b.onclick=function(){SFX.tap();start(+b.getAttribute('data-lv'));};});
    HUD.hideHub();
    MUSIC.setMode(G.kind==='relax'?'relax':(G.music||'game'));
  }
  function start(lv){
    byId('gmIntro').classList.remove('on');byId('gmResult').classList.remove('on');
    stage().innerHTML='';running=true;
    try{cur.start(stage(),api,lv);}catch(e){showFatal(e.message);}
  }
  function stop(){if(cur&&cur.stop)try{cur.stop();}catch(e){}running=false;Thruster.kill();}
  function close(){
    stop();byId('game').className='layer';stage().innerHTML='';cur=null;
    HUD.showHub();Hub.refresh();MUSIC.setMode(Hub.musicHere());
  }
  /* 游戏结束：显示结算卡，发放奖励 */
  function end(r){
    running=false;
    const rec=SAVE.game(curId);
    let newBest=false;
    if(typeof r.score==='number'&&(rec.best==null||r.score>rec.best)){rec.best=r.score;newBest=true;}
    if(r.rec)Object.assign(rec,r.rec);
    rec.plays=(rec.plays||0)+1;
    let dust=r.dust||0,focus=0;
    if(cur.kind==='relax'){focus=relaxGain();S.focus=clamp(S.focus+focus,0,100);}
    S.dust+=dust;save();checkAchs();HUD.refresh();
    const box=byId('gmResult');
    box.innerHTML='<div class="paper gm-in"><div class="gm-k">'+(r.ok===false?'这一局':'完成')+'</div><h3>'+(r.title||cur.title)+'</h3>'+
      (r.big?'<div class="gm-big">'+r.big+'</div>':'')+(newBest&&rec.plays>1?'<div class="chip amber">新纪录</div>':'')+
      '<div class="gm-rw">'+(dust?'<span class="chip amber">星尘 +'+dust+'</span>':'')+(focus?'<span class="chip ok">精力 +'+focus+'</span>':'')+'</div>'+
      (r.note?'<div class="gm-fact">'+fill(r.note)+'</div>':'')+
      '<div class="btnrow"><button class="btn ghost" id="gmAgain">'+(r.againLabel||'再来一局')+'</button><button class="btn" id="gmDone">回到星图</button></div></div>';
    box.classList.add('on');
    if(dust)SFX.coin();
    byId('gmAgain').onclick=function(){SFX.tap();box.classList.remove('on');if(r.again)r.again();else start(r.lv);};
    byId('gmDone').onclick=function(){SFX.tap();close();};
  }
  const api={setScore:setScore,end:end,stage:stage,isRunning:function(){return running;}};
  return {open:open,close:close,start:start,api:api,current:function(){return curId;}};
})();

/* 画布小工具：铺满舞台、按像素比缩放 */
function stageCanvas(host,cls){
  const c=document.createElement('canvas');c.className='gm-cv '+(cls||'');host.appendChild(c);
  const ctx=c.getContext('2d');
  function fit(){const d=DPR(),w=host.clientWidth,h=host.clientHeight;c.width=Math.round(w*d);c.height=Math.round(h*d);c.style.width=w+'px';c.style.height=h+'px';ctx.setTransform(d,0,0,d,0,0);c._w=w;c._h=h;}
  fit();
  return {c:c,ctx:ctx,fit:fit,w:function(){return c._w;},h:function(){return c._h;}};
}
/* 通用星空背景（预渲染） */
function starfield(w,h,seed,n,tint){
  const o=document.createElement('canvas');o.width=w;o.height=h;const g=o.getContext('2d');
  const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,tint&&tint[0]||'#03050D');gr.addColorStop(1,tint&&tint[1]||'#0A1430');g.fillStyle=gr;g.fillRect(0,0,w,h);
  const R=rng(seed||3);for(let i=0;i<(n||220);i++){g.fillStyle='rgba(235,240,255,'+(R()*.7+.15).toFixed(2)+')';g.beginPath();g.arc(R()*w,R()*h,R()<.05?1.6:R()*.9+.3,0,7);g.fill();}
  return o;
}
/* 动画循环：返回 stop() */
function loop(fn){let on=true,last=performance.now();function f(t){if(!on)return;const dt=Math.min(.05,(t-last)/1000);last=t;fn(dt,t);requestAnimationFrame(f);}requestAnimationFrame(f);return function(){on=false;};}
