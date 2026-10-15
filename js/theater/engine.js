"use strict";
/* =====================================================================
   剧场引擎：对白、立绘、镜头、选项、证据架。
   章节数据只描述“发生什么”，引擎负责“怎么演”。
   每一章用 mech 列表声明本章启用哪些机制，引擎据此显示对应的界面。
   ===================================================================== */
/* 剧本写法的小助手 */
function SC(sc,mus){return {t:'scene',sc:sc,mus:mus};}
function L(w,x,o){return Object.assign({t:'say',w:w,x:x},o||{});}
function N(x){return {t:'say',w:'narr',x:x};}
function TIP(id){return {t:'tip',id:id};}

let TH={running:false};
let CUR=null;            /* 当前章节定义 */
let scriptGen=0;

/* ---------------- 新机制说明卡 ---------------- */
const TIPS={
  choice:{t:'当庭表态',d:'对方说完，轮到你回应。选错不会立刻输，但会掉一格<b>气势</b>。气势掉光，就是“举证不能”，这一章要重来。',ic:'ic-chat'},
  invest:{t:'现场取证',d:'在画面上找发光的点，点一下收进证物袋。<b>带“关键”标记的证物</b>收齐才能回庭。多拿几件也没坏处，庭上用不用由你。',ic:'ic-search'},
  cross:{t:'质证',d:'证人会一句一句地说。每一句你可以：<br><b>追问</b>：让他多说一点，有时会说漏嘴；<br><b>出示证据</b>：拿出和这句话矛盾的证物，当场戳穿。<br>拿错证物会掉气势。证词说完还没找到破绽，会再听一遍。',ic:'ic-file'},
  law:{t:'引用法条',d:'质证中多了一个按钮：<b>引律</b>。选中本案真正适用的那一条，能把争论拉回正确的轨道，气势 +1。选错了，对方会当场指出你引错了。',ic:'ic-law'},
  chain:{t:'组证据链',d:'一个主张要满足几个<b>构成要件</b>，每个要件配一件证据。全部选完一起提交，仲裁庭只告诉你“几环站得住”，不告诉你是哪几环。',ic:'ic-link'},
  postAward:{t:'裁决之后',d:'仲裁一裁终局，不能上诉。不服的一方只能申请解释、更正笔误、补充漏裁，或者以程序问题申请撤销。下面你可以亲手试一试这几条路。',ic:'ic-gavel'},
  cost:{t:'人望',d:'有些问法能赢得更快，但会让人难堪。屏幕左上角的绿色圆点是<b>人望</b>。人望高，证人愿意多说；人望太低，证人会拒绝回答。选项只标出对气势的影响，人望怎么变，你得自己掂量。',ic:'ic-heart'},
  precCite:{t:'你说过的话',d:'重演室会读取你在前几章表过的态。对方可能拿你的原话来堵你。好的应对通常是<b>区分</b>：说清楚两个案子哪里不一样。',ic:'ic-book'},
  settle:{t:'和解',d:'对方可能提出和解。接受，稳妥，但仲裁庭不会就法律问题表态，也不会留下先例；拒绝，风险更高，但只有裁决能把规则说清楚。两条路都能走完这一章。',ic:'ic-hand'},
  lean:{t:'你的裁判记录',d:'你在“裁判练习”里落过的槌是公开的。对方会研究你的偏向，当庭拿来说事。',ic:'ic-scale'},
  hearing:{t:'你来主持',d:'这一次你坐在中间。双方说完开场，你有<b>有限的提问次数</b>。问到点子上，事实会被“记录在案”；问得不当（诱导、跑题），会被提出异议，也会损害你的公正形象。',ic:'ic-gavel'},
  inspect:{t:'现场勘验',d:'仲裁庭到现场看一看。点画面上的标记，记下你看到的东西。勘验不消耗提问次数。',ic:'ic-search'},
  award:{t:'起草裁决',d:'每个争议点选一个结论。结论要有<b>记录在案的事实</b>撑着才算说理充分。注意：只能判双方请你判的事，多判了叫<b>超裁</b>，那部分会被撤销。',ic:'ic-pen'}
};
function showTip(id){
  return new Promise(function(res){
    const T=TIPS[id];if(!T){res();return;}
    if(S.tips.indexOf(id)<0){S.tips.push(id);save();}
    const card=byId('tipCard');
    card.innerHTML='<div class="tc-in paper"><div class="tc-k">新机制</div><div class="tc-t">'+icon(T.ic)+' '+T.t+'</div><div class="tc-d">'+T.d+'</div><button class="btn block" id="tcOk">明白了</button></div>';
    card.classList.add('on');SFX.page();
    byId('tcOk').onclick=function(){SFX.tap();card.classList.remove('on');setTimeout(res,180);};
  });
}

/* ---------------- 舞台 ---------------- */
let curScene='';
function setScene(name){
  curScene=name;
  byId('scSvg').innerHTML='<use href="#sc-'+name+'"/>';
  const inside=SCENES.isChamber(name);
  byId('scBench').innerHTML=inside?'<use href="#fg-bench-'+name+'"/>':'';
  byId('scDesk').innerHTML=inside?'<use href="#fg-desks-'+name+'"/>':'';
  const th=byId('theater');th.setAttribute('data-scene',name);th.setAttribute('data-inside',inside?'1':'0');
  ['actL','actR','actM'].forEach(function(id){const e=byId(id);e.className='actor '+(id==='actL'?'left':id==='actR'?'right':'mid');e.innerHTML='';e.removeAttribute('data-who');});
  if(inside&&CUR&&CUR.bench)showActor('actM',CUR.bench);
  byId('crossbar').classList.remove('on');
  camTo(null);layoutStage();
}
function layoutStage(){
  const sc=byId('thScene');if(!sc)return;
  const W=sc.clientWidth,H=sc.clientHeight;if(!W||!H)return;
  const s=Math.max(W/1200,H/600),ox=(W-1200*s)/2,oy=(H-600*s)/2,inside=SCENES.isChamber(curScene);
  const M=byId('actM'),aw=150*s;
  M.style.width=aw.toFixed(1)+'px';M.style.left=(ox+600*s-aw/2).toFixed(1)+'px';M.style.top=(oy+(292-61*1.25)*s).toFixed(1)+'px';M.style.bottom='auto';
  const narrow=W<700,deskOn=inside&&(ox+330*s>60);
  [['actL',150],['actR',1050]].forEach(function(p){
    const e=byId(p[0]),w=narrow?Math.min(W*.52,250):Math.max(180,Math.min(W*.18,290)),h=w*170/120;
    e.style.width=w.toFixed(1)+'px';
    let bottom=0;if(deskOn){const deskY=oy+488*s,top=deskY-h*(140/170);bottom=H-(top+h);}
    e.style.bottom=bottom.toFixed(1)+'px';
    if(narrow){e.style.left=p[0]==='actL'?'1%':'auto';e.style.right=p[0]==='actR'?'1%':'auto';}
    else if(p[0]==='actL'){e.style.left=Math.max(8,ox+p[1]*s-w/2).toFixed(1)+'px';e.style.right='auto';}
    else{e.style.right=Math.max(8,W-(ox+p[1]*s+w/2)).toFixed(1)+'px';e.style.left='auto';}
  });
}
addEventListener('resize',function(){if(TH.running)layoutStage();});
function camTo(side){
  const c=byId('thCam');if(!c)return;byId('theater').setAttribute('data-spk',side||'');
  c.style.transform=side==='left'?'scale(1.05) translate(1.1%,0)':side==='right'?'scale(1.05) translate(-1.1%,0)':side==='mid'?'scale(1.075) translate(0,1.4%)':'scale(1.045)';
}
function camShake(big){const c=byId('thScene');c.classList.remove('jolt','jolt2');void c.offsetWidth;c.classList.add(big?'jolt2':'jolt');setTimeout(function(){c.classList.remove('jolt','jolt2');},big?620:420);}
function sideOf(w){
  const b=baseOf(w);
  if(CUR&&CUR.sides&&CUR.sides[b])return CUR.sides[b];
  return who(w).side;
}
function showActor(slot,w){
  const e=byId(slot),info=who(w);
  if(e.getAttribute('data-who')!==w){
    const fresh=!e.getAttribute('data-who');
    e.innerHTML=info.svg?'<svg viewBox="0 0 120 170" style="--blink:'+(2+Math.random()*3).toFixed(2)+'s"><use href="#'+info.svg+'"/></svg>':'';
    e.setAttribute('data-who',w);
    if(fresh){e.classList.remove('enter');void e.offsetWidth;e.classList.add('enter');}
  }
  e.classList.add('show');return e;
}
function slotFor(side){return side==='left'?'actL':side==='right'?'actR':side==='mid'?'actM':null;}
function setPlate(w,tag){
  const info=who(w),el=byId('dlgName');
  if(!info.n){el.style.display='none';return;}
  el.style.display='';
  el.innerHTML=(info.svg?'<i class="dlg-av">'+avatarSVG(w)+'</i>':'')+'<span class="dn">'+esc(info.n)+'</span>'+((tag||info.tag)?'<span class="dn-tag">'+esc(tag||info.tag)+'</span>':'');
  byId('dlg').style.setProperty('--spk',info.col);
}

/* ---------------- 打字机 ---------------- */
let VOICE='';
function typeText(html){
  return new Promise(function(res){
    const el=byId('dlgText');el.scrollTop=0;
    const tokens=[];let i=0;
    while(i<html.length){if(html[i]==='<'){const j=html.indexOf('>',i);tokens.push(html.slice(i,j+1));i=j+1;}else{tokens.push(html[i]);i++;}}
    let out='',k=0;el.innerHTML='';TH.typing=true;TH.fullText=html;
    const talker=$('#thCam .actor.speaking');if(talker)talker.classList.add('talking');
    function fin(){TH.typing=false;if(talker)talker.classList.remove('talking','mo');res();}
    function step(){
      if(!TH.running){fin();return;}
      if(!TH.typing||TH.skipHold){el.innerHTML=html;if(el.scrollHeight>el.clientHeight)el.scrollTop=el.scrollHeight;fin();return;}
      if(k>=tokens.length){fin();return;}
      out+=tokens[k];k++;el.innerHTML=out;
      if(el.scrollHeight>el.clientHeight)el.scrollTop=el.scrollHeight;
      const tk=tokens[k-1];
      if(tk.length===1&&/[一-鿿A-Za-z0-9]/.test(tk)){if(talker&&k%2===0)talker.classList.toggle('mo');if(k%2===1&&VOICE!=='narr')SFX.voice(VOICE);}
      else if(talker)talker.classList.remove('mo');
      setTimeout(step,/[，。！？；：…,!?]/.test(tk)?(/[。！？!?…]/.test(tk)?140:70):(S.textSpeed==='fast'?12:24));
    }
    step();
  });
}
function waitTap(){return new Promise(function(r){TH.resolver=r;});}
function dlgTap(){
  if(!TH.running)return;
  if(TH.typing){TH.typing=false;byId('dlgText').innerHTML=TH.fullText;return;}
  if(TH.resolver){const r=TH.resolver;TH.resolver=null;r();return;}
  if(TH.crossRes)nudgeCross();
}
function nudgeCross(){const cb=byId('crossbar');if(!cb.classList.contains('on'))return;cb.classList.remove('nudge');void cb.offsetWidth;cb.classList.add('nudge');}
let skipTimer=null;
function skipHold(on){TH.skipHold=on;if(on&&!skipTimer){skipTimer=setInterval(function(){if(TH.resolver&&!TH.typing){const r=TH.resolver;TH.resolver=null;r();}},70);}if(!on){clearInterval(skipTimer);skipTimer=null;}}

/* 一句台词 */
async function say(w,x,o){
  o=o||{};
  if(!TH.running)return;
  const info=who(w),side=w==='narr'?'none':sideOf(w);
  setPlate(w,o.tag);VOICE=w;
  const slotId=slotFor(side);
  ['actL','actR','actM'].forEach(function(id){if(id!==slotId)byId(id).classList.remove('speaking');});
  if(slotId&&info.svg){const e=showActor(slotId,w);e.classList.add('speaking');
    if(o.shake){e.classList.add('shake');setTimeout(function(){e.classList.remove('shake');},500);camShake(false);}}
  camTo(slotId?side:null);
  const d=byId('dlg');d.classList.toggle('solemn',!!(CUR&&CUR.bench===w)||baseOf(w)==='narr');d.classList.toggle('narr',w==='narr');
  byId('dlgNext').style.display='none';
  await typeText(fill(x));
  byId('dlgNext').style.display='block';
  await waitTap();
}
/* 选项面板：返回所选下标 */
function choose(head,ask,opts,render){
  return new Promise(function(res){
    const box=byId('choices');
    box.innerHTML=(head?'<div class="chead">'+head+'</div>':'')+(ask?'<div class="cask">'+fill(ask)+'</div>':'');
    opts.forEach(function(o,i){
      const b=el('button','choice'+(o.cls?' '+o.cls:''));b.style.animationDelay=(i*.06)+'s';
      b.innerHTML='<span class="ci">'+(i+1)+'</span><span class="cbody">'+(render?render(o,i):fill(o.x||o.t))+'</span>';
      b.onclick=function(e){if(e.target.closest('.term'))return;SFX.tap();box.classList.remove('on');box.innerHTML='';res(i);};
      box.appendChild(b);
    });
    box.classList.add('on');
  });
}
/* 证据架 / 法条架 */
function shelf(title,items,render,cancel){
  return new Promise(function(res){
    const sh=byId('shelf'),ls=byId('shelfList');
    byId('shelfTitle').textContent=title;ls.innerHTML='';
    items.forEach(function(it,i){
      const d=el('div','sh-item'+(it.key?' key':'')+(it.dim?' dim':''));
      d.innerHTML='<kbd>'+(i+1)+'</kbd><div class="sh-body">'+render(it)+'</div>';
      d.onclick=function(e){if(e.target.closest('.term'))return;SFX.card();sh.classList.remove('on');res(it.id);};
      ls.appendChild(d);
    });
    byId('shelfCancel').style.display=cancel===false?'none':'';
    byId('shelfCancel').onclick=function(){SFX.tap();sh.classList.remove('on');res(null);};
    sh.classList.add('on');
  });
}
function showObjection(word){
  const o=byId('objection'),w=byId('objWord');w.innerHTML=word||'异<br>议';
  o.classList.remove('on','out');void o.offsetWidth;o.classList.add('on');camShake(true);
  setTimeout(function(){o.classList.add('out');},720);setTimeout(function(){o.classList.remove('on','out');},1040);
}

/* ---------------- 气势与人望 ---------------- */
function hasMech(m){return !!(CUR&&CUR.mech&&CUR.mech.indexOf(m)>=0);}
function updateMorale(){
  const m=byId('morale');if(!hasMech('morale')){m.innerHTML='';return;}
  m.innerHTML='';for(let i=0;i<TH.mcap;i++){const d=el('i');if(i>=TH.morale)d.className='lost';else if(i>=5)d.className='extra';m.appendChild(d);}
}
function updateStanding(dir){
  const e=byId('standing');if(!hasMech('standing')){e.innerHTML='';return;}
  e.innerHTML='';for(let i=0;i<5;i++){const d=el('i');if(i>=TH.standing)d.className='lost';e.appendChild(d);}
  if(dir){e.classList.remove('up','down');void e.offsetWidth;e.classList.add(dir>0?'up':'down');}
}
function logPick(q,ok,tag){TH.picks.push({q:q,ok:ok,tag:tag});if(!ok)TH.flawless=false;}
/* 掉一格气势；掉光返回 true（已判举证不能） */
async function hurt(q,tag){
  logPick(q,false,tag);SFX.lose();buzz([20,40,20]);
  TH.morale--;updateMorale();
  if(TH.morale<=0){await theaterFail();return true;}
  return false;
}
function heal(){TH.morale=Math.min(TH.mcap,TH.morale+1);updateMorale();}
function setMission(t){const e=byId('mission');e.textContent=t||'';e.classList.toggle('on',!!t);}

/* ---------------- 开章 ---------------- */
async function startChapter(id){
  const C=CHAPTERS[id];if(!C)return;
  if(!chapterUnlocked(id)){toast('先完成上一章。');SFX.error();return;}
  CUR=C;
  SFX.tap();MUSIC.setMode('intro');
  ROLE_TAG.me=C.myTag||'本方代理人';ROLE_TAG.meSide=C.mySide||'left';
  const fresh=(S.focus||0)>=70;
  TH={running:true,ch:id,morale:fresh?6:5,mcap:fresh?6:5,standing:clamp(typeof S.standing==='number'?S.standing:3,1,5),flawless:true,evs:(C.startEvs||[]).slice(),
      picks:[],facts:[],resolver:null,typing:false,fullText:'',skipHold:false,crossRes:null,lawCited:false,ending:'verdict',busy:false,fresh:fresh,costDone:false,qLeft:0,impartial:5};
  byId('theater').setAttribute('data-ch',id);byId('theater').setAttribute('data-era',C.era);
  await chapterCard(C);
  if(!TH.running)return;
  document.body.classList.add('in-theater');
  byId('theater').classList.add('on');
  byId('thYear').textContent=C.year;
  updateMorale();updateStanding();setMission('');
  byId('hintBtn').classList.toggle('hidden',!hasMech('cross')&&!hasMech('chain'));
  HUD.hideHub();
  await irisTo(function(){layoutStage();});
  runScript(C.script);
}
function chapterUnlocked(id){const i=CH_ORDER.indexOf(id);return i<=0||SAVE.chDone(CH_ORDER[i-1]);}
function chapterCard(C){
  return new Promise(function(res){
    const card=byId('chapterCard');
    const newM=(C.newMech||[]).map(function(m){return '<span class="chip">'+(TIPS[m]?TIPS[m].t:m)+'</span>';}).join('');
    card.className='layer on dossier era-'+C.era;
    const M=C.verdict||{},row=function(k,v){return v?'<div class="dz-row"><span>'+k+'</span><b>'+v+'</b></div>':'';};
    card.innerHTML='<div class="dz">'+
      '<div class="dz-tab">案 卷</div>'+
      '<div class="dz-no">'+(M.no||'')+'</div>'+
      '<div class="dz-year">'+C.year+'</div>'+
      '<div class="dz-num">'+C.num+(C.arbiter?' · 仲裁员':'')+'</div>'+
      '<div class="dz-title">'+C.title+'</div>'+
      '<div class="dz-sub">'+C.sub+'</div>'+
      '<div class="dz-rule"></div>'+
      row('受理机构',M.court?String(M.court).replace(/\s+/g,''):'')+row('你的身份',C.roleLine)+row('争议焦点',C.issue)+row('适用规则',M.law)+
      (newM?'<div class="dz-new"><span>本章新机制</span>'+newM+'</div>':'')+
      (TH.fresh?'<div class="dz-buff">精力充沛：气势多一格</div>':'<div class="dz-buff dim">精力不足 70，本章没有额外气势。去休憩舱放松一下会好些。</div>')+
      '<div class="dz-btns"><button class="btn ghost sm" id="ccBack">返回</button><button class="btn dz-go" id="ccGo">开 庭</button></div>'+
      '<i class="dz-c tl"></i><i class="dz-c tr"></i><i class="dz-c bl"></i><i class="dz-c br"></i></div>';
    SFX.whoosh();
    byId('ccGo').onclick=function(){SFX.gavel();card.classList.remove('on');res();};
    byId('ccBack').onclick=function(){SFX.tap();card.classList.remove('on');TH.running=false;res();};
  });
}

/* ---------------- 剧本执行 ---------------- */
async function runScript(ops){
  const my=++scriptGen;
  for(let pc=0;pc<ops.length;pc++){
    if(my!==scriptGen||!TH.running)return;
    const s=ops[pc];
    if(TH.skipHold)TH.typing=false;
    const r=await runOp(s);
    if(r==='fail'||!TH.running)return;
  }
}
async function runOp(s){
  switch(s.t){
    case 'scene':await irisTo(function(){setScene(s.sc);});if(s.mus)MUSIC.setMode(s.mus);await sleep(200);return;
    case 'say':return say(s.w,s.x,s);
    case 'music':MUSIC.setMode(s.m);return;
    case 'tip':return showTip(s.id);
    case 'mission':setMission(s.x);return;
    case 'choice':return doChoice(s);
    case 'invest':return doInvest(s.d);
    case 'cross':return doCross(s.d);
    case 'chain':return doChain(s.d);
    case 'cost':return doCost(s.d);
    case 'precCite':return doPrecCite(s.d);
    case 'lean':return doLean(s.d);
    case 'settle':return doSettle(s.d);
    case 'final':return doFinal(s.d);
    case 'moral':return doMoral(s.d);
    case 'hearing':return doHearing(s.d);
    case 'inspect':return doInspect(s.d);
    case 'award':return doAward(s.d);
    case 'opinion':return doOpinion(s.d);
    case 'reply':return doReply(s.d);
    case 'verdict':return finishChapter(s.d||{});
    case 'fn':return s.f();
  }
}

/* ---------------- 当庭表态 ---------------- */
async function doChoice(s){
  const i=await choose(s.head||'当庭回应',s.q,s.opts);
  const o=s.opts[i];
  if(!o.ok){
    if(o.after)for(const a of o.after)await runOp(a);
    if(await hurt(s.q,o.tag||'失着'))return 'fail';
    return;
  }
  logPick(s.q,true,o.tag||'应对得当');
  if(o.lean)noteLean(o.lean);
  if(o.after)for(const a of o.after)await runOp(a);
}
function noteLean(k){if(!k)return;S.leanLog.push(k);save();}

/* ---------------- 退出 / 失败 ---------------- */
async function theaterFail(){
  TH.ending='dismissed';
  MUSIC.setMode('verdict');byId('crossbar').classList.remove('on');
  const role=CUR.role||'申请人';
  if(role==='申请人'){await say(CUR.bench,'申请人代理人已无新的证据提交。主张者负举证责任，举证不能的，承担不利后果。本庭驳回申请人的全部请求。');}
  else{await say(CUR.bench,'被申请人代理人未能就其抗辩完成举证。本庭支持申请人的仲裁请求。');}
  SFX.gavel();await sleep(400);
  await showVerdictDoc({lost:true});
  await say('chen','这一庭输了。不要紧，重演室就是用来输的。回星图上再开一次，换个打法。');
  endTheater(false);
  return 'fail';
}
function exitTheater(){
  if(!TH.running)return;
  if(!confirm('退出本章？本次进度不会保存。'))return;
  endTheater(false);
}
function endTheater(won){
  TH.running=false;scriptGen++;
  skipHold(false);
  ['choices','shelf','crossbar','tipCard','board'].forEach(function(id){byId(id).classList.remove('on');});
  byId('theater').classList.remove('on');document.body.classList.remove('in-theater');
  HUD.showHub();Hub.refresh(won?TH.ch:null);
  MUSIC.setMode(Hub.musicHere());
}
