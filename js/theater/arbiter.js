"use strict";
/* =====================================================================
   仲裁员模式（第 5–6 章）：你坐到中间。
   · 发问：提问次数有限；问到点子上，事实“记录在案”；
           诱导、跑题会被提出异议，也会让人觉得你不公正。
   · 现场勘验：到现场看，记下所见，不消耗提问次数。
   · 起草裁决：每个争议点选一个结论，结论要有在案事实支撑；
               判了没请你判的事（超裁），那一部分会被撤销。
   ===================================================================== */
function factDef(id){return CUR&&CUR.facts&&CUR.facts[id];}
function addFact(id){
  if(!id||TH.facts.indexOf(id)>=0)return false;
  TH.facts.push(id);SFX.stamp();
  const f=factDef(id);if(f)toast('记录在案：'+f.short);
  return true;
}
function updateImpartial(dir){
  const e=byId('standing');e.innerHTML='';
  for(let i=0;i<5;i++){const d=el('i');if(i>=TH.impartial)d.className='lost';e.appendChild(d);}
  e.setAttribute('data-k','公正');
  if(dir){e.classList.remove('up','down');void e.offsetWidth;e.classList.add(dir>0?'up':'down');}
}
function factChips(){
  return TH.facts.map(function(id){const f=factDef(id);return '<span class="chip fact" title="'+esc(f.t)+'">'+esc(f.short)+'</span>';}).join('')||'<span class="muted small">还没有事实记录在案。</span>';
}

/* ---------------- 发问 ---------------- */
async function doHearing(d){
  TH.qLeft=d.budget;updateImpartial();
  if(d.intro)for(const op of d.intro){const r=await runOp(op);if(r==='fail')return 'fail';}
  const asked={};
  while(TH.running&&TH.qLeft>0){
    const pickId=await new Promise(function(res){
      const b=byId('board');
      let h='<div class="bd-in"><div class="bd-head"><b>发问</b><span>剩余 <em>'+TH.qLeft+'</em> 次</span></div>';
      h+='<div class="bd-facts"><span class="bd-k">记录在案</span>'+factChips()+'</div><div class="bd-qs">';
      const groups={};d.qs.forEach(function(q){(groups[q.to]=groups[q.to]||[]).push(q);});
      Object.keys(groups).forEach(function(to){
        const info=who(to);
        h+='<div class="bd-grp"><div class="bd-to"><i class="dlg-av">'+avatarSVG(to)+'</i>'+esc(info.n)+'<small>'+esc(info.tag)+'</small></div>';
        groups[to].forEach(function(q){h+='<button class="bd-q'+(asked[q.id]?' done':'')+'" data-q="'+q.id+'"'+(asked[q.id]?' disabled':'')+'>'+fill(q.q)+'</button>';});
        h+='</div>';
      });
      h+='</div><button class="btn ghost sm bd-end" data-q="__end">结束发问，进入下一步</button></div>';
      b.innerHTML=h;b.classList.add('on');
      $$('#board [data-q]').forEach(function(btn){btn.onclick=function(e){if(e.target.closest('.term'))return;SFX.tap();b.classList.remove('on');res(btn.getAttribute('data-q'));};});
    });
    if(pickId==='__end')break;
    const q=d.qs.find(function(x){return x.id===pickId;});asked[q.id]=true;TH.qLeft--;
    await say('me',q.q);
    if(q.kind==='improper'){
      SFX.objection();showObjection('反<br>对');await sleep(700);
      await say(q.obj[0],q.obj[1]);
      TH.impartial=Math.max(0,TH.impartial-1);updateImpartial(-1);logPick('发问',false,'问题不当');
      await say('chen',q.fa||'这个问题本身就站了队。仲裁员发问，只问事实，不替任何一方说话。');
      continue;
    }
    for(const op of (q.ans||[])){const r=await runOp(op);if(r==='fail')return 'fail';}
    if(q.fact){addFact(q.fact);logPick('发问',true,'问出事实');}
    else logPick('发问',true,'无关紧要');
  }
  byId('board').classList.remove('on');
  if(d.outro)for(const op of d.outro)await runOp(op);
}

/* ---------------- 现场勘验 ---------------- */
async function doInspect(d){
  MUSIC.setMode('invest');
  await irisTo(function(){setScene(d.scene);});
  if(d.intro)for(const op of d.intro)await runOp(op);
  setMission('现场勘验 · 点画面上的标记');
  const svg=byId('scSvg');let left=d.spots.length;
  await new Promise(function(resolve){
    let fin=false;
    const done=function(){if(fin)return;fin=true;$$('#scSvg .hotspot').forEach(function(h){h.remove();});Search.end();resolve();};
    const btn=byId('inspectDone');btn.classList.add('on');btn.onclick=function(){if(TH.busy||TH.typing||TH.resolver)return;SFX.tap();btn.classList.remove('on');done();};
    d.spots.forEach(function(sp){
      const g=document.createElementNS('http://www.w3.org/2000/svg','g');
      g.setAttribute('class','hotspot blue');g.setAttribute('transform','translate('+sp.x+','+sp.y+')');g.setAttribute('data-x',sp.x);g.setAttribute('data-y',sp.y);
      g.innerHTML='<circle class="ring" r="16"/><circle class="dot" r="5"/><circle class="hit" r="42"/>';
      g.addEventListener('click',async function(e){
        e.stopPropagation();if(fin)return;if(TH.busy||TH.typing||TH.resolver){dlgTap();return;}
        TH.busy=true;SFX.reveal();g.remove();left--;Search.idle(false);
        for(const op of sp.say)await runOp(op);
        if(sp.fact)addFact(sp.fact);
        TH.busy=false;
        if(left<=0){btn.classList.remove('on');done();}
        else Search.idle(true);
      });
      svg.appendChild(g);
    });
    Search.begin(d.hint);
  });
  if(!TH.running)return 'fail';/* 勘验途中退出了本章：不要在别的章节里接着跑 */
  setMission('');
  if(d.outro)for(const op of d.outro)await runOp(op);
  await irisTo(function(){setScene(d.back);});MUSIC.setMode('court');
}

/* ---------------- 起草裁决 ---------------- */
function holdingQuality(o){
  const met=(o.need||[]).every(function(f){return TH.facts.indexOf(f)>=0;});
  if(o.legal==='ultra')return {k:'ultra',n:'超出请求范围',c:'red',pts:0};
  if(o.legal==='wrong')return {k:'wrong',n:'法律适用有误',c:'red',pts:0};
  if(o.legal==='alt')return met?{k:'alt',n:'可以成立，但理由偏弱',c:'amber',pts:1}:{k:'thin',n:'理由不足',c:'amber',pts:0};
  return met?{k:'solid',n:'说理充分',c:'ok',pts:2}:{k:'thin',n:'结论对，但在案事实撑不住',c:'amber',pts:1};
}
async function doAward(d){
  MUSIC.setMode('verdict');
  if(d.intro)for(const op of d.intro)await runOp(op);
  const picks=d.issues.map(function(){return -1;});
  while(TH.running){
    const act=await new Promise(function(res){
      const b=byId('board');
      let h='<div class="bd-in award"><div class="bd-head"><b>裁决书草稿</b><span>'+d.issues.length+' 个争议点</span></div>';
      h+='<div class="bd-facts"><span class="bd-k">记录在案</span>'+factChips()+'</div>';
      d.issues.forEach(function(iss,k){
        const o=picks[k]>=0?iss.opts[picks[k]]:null;
        h+='<div class="aw-iss"><div class="aw-t">争议点'+cnNum(k+1)+' · '+iss.title+'</div>';
        if(o){h+='<div class="aw-pick">'+fill(o.t)+'</div><div class="aw-need">'+((o.need||[]).map(function(f){const on=TH.facts.indexOf(f)>=0;return '<span class="chip '+(on?'ok':'red')+'">'+(on?'✓ ':'✗ ')+esc(factDef(f).short)+'</span>';}).join('')||'<span class="muted small">不依赖具体事实</span>')+'</div>';}
        h+='<button class="btn sm '+(o?'ghost':'')+'" data-a="'+k+'">'+(o?'改一改':'写这一项')+'</button></div>';
      });
      const all=picks.every(function(p){return p>=0;});
      h+='<button class="btn red block" data-a="sign"'+(all?'':' disabled')+'>签发裁决</button></div>';
      b.innerHTML=h;b.classList.add('on');
      $$('#board [data-a]').forEach(function(btn){btn.onclick=function(e){if(e.target.closest('.term'))return;SFX.tap();b.classList.remove('on');res(btn.getAttribute('data-a'));};});
    });
    if(act==='sign')break;
    const k=+act,iss=d.issues[k];
    const i=await choose('争议点'+cnNum(k+1)+' · '+iss.title,iss.q,iss.opts,function(o){
      const need=(o.need||[]).map(function(f){const on=TH.facts.indexOf(f)>=0;return '<span class="chip '+(on?'ok':'fact')+'">'+(on?'在案：':'依据：')+esc(factDef(f).short)+'</span>';}).join(' ');
      return fill(o.t)+(need?'<div class="cevd">'+need+'</div>':'');
    });
    picks[k]=i;
  }
  byId('board').classList.remove('on');
  /* 评定 */
  let pts=0,max=d.issues.length*2;const res=[];let ultra=null;
  d.issues.forEach(function(iss,k){const o=iss.opts[picks[k]],q=holdingQuality(o);pts+=q.pts;res.push({iss:iss,o:o,q:q});if(q.k==='ultra')ultra={iss:iss,o:o};
    TH.picks.push({q:iss.title,ok:q.k==='solid',tag:q.n});if(q.k!=='solid')TH.flawless=false;});
  TH.award={res:res,pts:pts,max:max,ultra:ultra};
  /* 谁来申请撤销：超裁那一项对谁不利，就是谁；否则看整份裁决对哪一方更不利 */
  const tally={c:0,r:0};res.forEach(function(r){if(r.o.fav)tally[r.o.fav]++;});
  const sideOfFav=function(f){return f==='r'?d.claimant:f==='c'?d.respondent:null;};
  const applicant=(ultra&&(ultra.o.harm||sideOfFav(ultra.o.fav)))||(tally.r>tally.c?d.claimant:tally.c>tally.r?d.respondent:null)||d.loser||CUR.opp;
  SFX.gavel();await sleep(300);
  await say(CUR.bench,d.sign||'本庭裁决如下。');
  for(const r of res){await say(CUR.bench,'关于'+r.iss.title+'：'+r.o.t);}
  for(const r of res){if(r.o.after)for(const op of r.o.after)await runOp(op);}
  /* 撤销程序：从仲裁员这一边再看一次“终局” */
  if(CUR.advisory){
    if(ultra){await say('bankole','青年席，“'+ultra.iss.title+'”这一项超出了请求方提出的问题。咨询意见只回答被问到的问题，这一段在定稿时删去。');TH.ultraHit=true;SFX.lose();}
  }else if(ultra){
    await say(applicant,'我方申请撤销裁决中关于“'+ultra.iss.title+'”的部分。理由：双方从未请求仲裁庭对此作出决定，仲裁庭超出了请求范围。');
    await say('chen','超裁是法定的撤销理由。法院审查后，撤销了这一部分，其他部分仍然有效。');
    SFX.lose();TH.ultraHit=true;
  }else{
    await say(applicant,'我方认为裁决认定错误，申请撤销。');
    await say('chen','法院驳回了撤销申请：对事实认定和法律适用不服，不是撤销理由。你的裁决站住了。');
  }
  /* 结尾那句话要和裁决的实际质量对得上 */
  const outro=((pts<max||ultra)&&d.outroFlawed)?d.outroFlawed:d.outro;
  if(outro)for(const op of outro)await runOp(op);
}

/* ---------------- 第六章：青年席意见与回信 ---------------- */
async function doOpinion(d){
  MUSIC.setMode('deep');
  await say(CUR.bench,d.q);
  const i=await choose('青年席意见',d.ask,d.opts,function(o){return '<b class="ctag">'+o.tag+'</b><br>'+fill(o.x);});
  const o=d.opts[i];
  await say('me',o.x);
  await say(CUR.bench,o.echo);
  S.moralLog.push({tag:o.tag,ch:TH.ch,day:todayStr()});S.opinion=o.tag;save();
}
async function doReply(d){
  await say(CUR.bench,d.q);
  const i=await choose('人类的第一句话',d.ask,d.opts);
  const o=d.opts[i];
  S.reply=stripTags(fill(o.x));save();
  await say('narr','<em>'+fill(o.x)+'</em>');
  if(o.echo)await say(CUR.bench,o.echo);
}
