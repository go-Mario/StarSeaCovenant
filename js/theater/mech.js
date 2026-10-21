"use strict";
/* =====================================================================
   代理人模式下的各项机制（第 1–4 章）：
   现场取证 · 质证（追问 / 出示证据 / 引律）· 证据链 · 人望代价 ·
   旧话重提（先例）· 裁判记录 · 和解 · 终局陈述 · 立场选择
   ===================================================================== */
function evDef(id){return CUR&&CUR.ev&&CUR.ev[id];}
function evList(ids){return ids.map(function(id){const e=evDef(id);return e?Object.assign({id:id},e):null;}).filter(Boolean);}
function renderEv(e){return '<div class="sh-n">'+esc(e.name)+(e.key?' <span class="chip red">关键</span>':'')+'</div><div class="sh-d">'+fill(e.desc)+'</div>';}

/* ---------------- 现场取证 ---------------- */
async function doInvest(d){
  MUSIC.setMode('invest');
  await irisTo(function(){setScene(d.scene);});
  const keys=d.spots.filter(function(s){return evDef(s.id)&&evDef(s.id).key;}).length;
  const found=function(){return d.spots.filter(function(s){return evDef(s.id).key&&TH.evs.indexOf(s.id)>=0;}).length;};
  if(d.intro)for(const op of d.intro)await runOp(op);
  if(!TH.running)return 'fail';
  setMission(I18N.t('现场取证 · 关键证物 ','Evidence gathering · key items ')+found()+'/'+keys);
  const svg=byId('scSvg');
  await new Promise(function(resolve){
    /* 取证结束后立刻撤掉剩下的标记，免得转场时再点出一段对白 */
    let fin=false;
    const done=function(){if(fin)return;fin=true;$$('#scSvg .hotspot').forEach(function(h){h.remove();});Search.end();resolve();};
    d.spots.forEach(function(sp){
      if(TH.evs.indexOf(sp.id)>=0)return;
      const g=document.createElementNS('http://www.w3.org/2000/svg','g');
      g.setAttribute('class','hotspot');g.setAttribute('transform','translate('+sp.x+','+sp.y+')');g.setAttribute('data-x',sp.x);g.setAttribute('data-y',sp.y);
      g.innerHTML='<circle class="ring" r="16"/><circle class="dot" r="5"/><circle class="hit" r="42"/>';
      g.addEventListener('click',async function(e){
        e.stopPropagation();
        if(fin)return;
        if(TH.busy||TH.typing||TH.resolver){dlgTap();return;}
        TH.busy=true;SFX.reveal();buzz(14);TH.evs.push(sp.id);
        const bb=g.getBoundingClientRect();FX.sparkle(bb.left+bb.width/2,bb.top+bb.height/2,'#F6C35B',14);g.remove();Search.idle(false);
        const ev=evDef(sp.id);
        await say(d.guide||'chen','<em>收进证物袋：「'+ev.name+'」</em><br>'+ev.desc);
        if(sp.say)await say(sp.say[0],sp.say[1]);
        setMission(found()>=keys?I18N.t('关键证物已齐 · 可以回庭','All key items collected · you may return to court'):I18N.t('现场取证 · 关键证物 ','Evidence gathering · key items ')+found()+'/'+keys);
        const left=$$('#scSvg .hotspot').length;
        if(found()>=keys&&!backOn){backOn=true;await say('chen',left?(d.done||I18N.t('该拿的都拿到了。','You have everything worth taking.'))+I18N.t('剩下的也可以看看，多拿几件没坏处；想走了就点“回庭”。','The rest is optional; a few extra items do no harm. When you want to leave, tap "Return to court.".'):(d.done||I18N.t('该拿的都拿到了。回去开庭。','You have everything worth taking. Go back and open the hearing.')));}
        TH.busy=false;
        if(found()>=keys){if(!left)done();else showBack();}
        if(!fin)Search.idle(true);
      });
      svg.appendChild(g);
    });
    Search.begin(d.hint);
    /* 关键证物齐了：不急着收走剩下的标记，给一个“回庭”按钮，由玩家决定什么时候走 */
    let backOn=false;
    const btn=byId('inspectDone');
    const showBack=function(){btn.textContent='回庭';btn.classList.add('on');btn.onclick=function(){if(TH.busy||TH.typing||TH.resolver)return;SFX.tap();btn.classList.remove('on');done();};};
    if(found()>=keys){if($$('#scSvg .hotspot').length){backOn=true;showBack();}else done();}
  });
  byId('inspectDone').classList.remove('on');byId('inspectDone').textContent='结束勘验';
  if(!TH.running)return 'fail';
  setMission('');
  await irisTo(function(){setScene(d.back);});MUSIC.setMode('court');
}

/* ---------------- 质证 ---------------- */
async function doCross(d){
  MUSIC.setMode('tension');document.body.classList.add('cine');
  if(d.intro)for(const op of d.intro){const r=await runOp(op);if(r==='fail')return 'fail';}
  const lines=d.lines.map(function(l){return Object.assign({},l);});
  let idx=0,loops=0,hintLv=0,idleN=0,again=false;
  /* 追问问不出东西时，证人的回答换着说，带教律师的提醒只说一次 */
  const IDLE=[d.idle||'我说的就是事实，没什么可补充的。','这一点我没有什么要补充的。','我的回答和刚才一样。','这句话就是字面上的意思。'];
  const hintTarget=function(){const t=lines.findIndex(function(l){return l.weak&&TH.evs.indexOf(l.weak)>=0&&l.end;});return t>=0?t:lines.findIndex(function(l){return l.weak;});};
  while(TH.running){
    if(idx>=lines.length){
      loops++;idx=0;
      const t=hintTarget();
      if(loops===1)await say('chen',I18N.t('证词说完了，还没找到破绽。再听一遍，留意哪一句和证物对不上。','The testimony is over and you have not found the opening. Hear it again, and watch for the sentence that clashes with your evidence.'));
      else if(t>=0)await say('chen',I18N.t('又绕回来了。给你指个方向：<em>第 '+(t+1)+' 句</em>，拿它和证物袋里的东西对一对。','Off track again. A pointer: <em>sentence '+(t+1)+'</em>. Compare it with what is in your evidence bag.'));
      else await say('chen',I18N.t('再听一遍。不确定的话，先“追问”，让他多说几句。','Hear it again. If you are unsure, press him first and let him say more.'));
    }
    const ln=lines[idx];
    setPlate(d.witness,I18N.t('证词 ','Testimony ')+(idx+1)+'/'+lines.length);VOICE=d.witness;
    const slot=slotFor(sideOf(d.witness));
    ['actL','actR','actM'].forEach(function(id){byId(id).classList.remove('speaking');});
    if(slot)showActor(slot,d.witness).classList.add('speaking');camTo(sideOf(d.witness));
    byId('dlgNext').style.display='none';
    /* 用完提示、引完法条、或者取消出证回到同一句时，直接把这句摆回来，不再逐字打一遍 */
    if(again){const el=byId('dlgText');el.innerHTML=fill(ln.x);TH.fullText=el.innerHTML;}
    else await typeText(fill(ln.x));
    again=false;
    byId('dlgNext').style.display='block';
    byId('btnLaw').classList.toggle('hidden',!hasMech('law')||TH.lawCited);
    byId('crossbar').classList.add('on');
    const act=await new Promise(function(res){TH.crossRes=res;});
    TH.crossRes=null;byId('crossbar').classList.remove('on');
    if(!TH.running)return 'fail';
    if(act==='next'){idx++;continue;}
    if(act==='hint'){
      const t=hintTarget();again=true;
      if(t<0){await say('chen',I18N.t('现在没什么可提示的，先往下听。','There is nothing to hint at yet. Keep listening.'));continue;}
      hintLv++;
      if(hintLv===1)await say('chen',I18N.t('提示：注意<em>第 '+(t+1)+' 句</em>。它和你手里的某件证物说的不是一回事。','Hint: watch <em>sentence '+(t+1)+'</em>. It does not say the same thing as one of your items.'));
      else await say('chen',I18N.t('提示：第 '+(t+1)+' 句，用<em>「'+evDef(lines[t].weak).name+'」</em>。','Hint: for sentence '+(t+1)+', use <em>"'+evDef(lines[t].weak).name+'"</em>.'));
      continue;
    }
    if(act==='law'){const r=await citeLaw();if(r==='fail')return 'fail';again=true;continue;}
    if(act==='press'){
      if(hasMech('standing')&&TH.standing<=1){
        await say(d.witness,d.refuse||'我已经回答过了。别的，我不想再说。');
        await say('chen',I18N.t('证人不肯开口了。你前面问得太狠，人家记着。','The witness will not speak. You pressed too hard, and he remembers.'));idx++;continue;
      }
      if(ln.press&&ln.pressed){
        /* 第二轮再追问同一句：不把整段问答重放一遍 */
        await say(d.witness,'这个问题我刚才回答过了。');
        if(ln.add)await say('chen',I18N.t('他补充的那句就在后面，接着听。','The line he adds comes later. Keep listening.'));
        idx++;continue;
      }
      if(ln.press){
        ln.pressed=true;
        for(const op of ln.press){const r=await runOp(op);if(r==='fail')return 'fail';}
        if(ln.add&&!ln.added){ln.added=true;lines.splice(idx+1,0,Object.assign({},ln.add));}
        if(ln.cost&&hasMech('cost')&&!TH.costDone){const r=await doCost(ln.cost);if(r==='fail')return 'fail';}
      }else{
        idleN++;await say(d.witness,IDLE[(idleN-1)%IDLE.length]);
        if(hasMech('standing')&&TH.standing>=4&&d.gift&&!TH.giftDone){TH.giftDone=true;await say(d.witness,d.gift);await say('chen',I18N.t('这句话他本可以不说。你对人客气，人家也愿意多说一点。','He could have left that unsaid. Treat people with courtesy, and they say more.'));}
        else if(idleN===1)await say('chen',I18N.t('这一句问不出什么。把力气留给有毛病的那句。','This question yields nothing. Save your effort for the flawed sentence.'));
      }
      idx++;continue;
    }
    if(act==='ev'){
      const pickId=await shelf(I18N.t('出示哪一件证物','Which item to show'),evList(TH.evs),renderEv);
      if(!pickId){again=true;continue;}
      const ev=evDef(pickId);
      if(pickId===ln.weak){
        SFX.objection();buzz([50,30,70]);showObjection();await sleep(850);
        logPick(I18N.t('质证 · 第','Cross-examination · sentence ')+(idx+1)+I18N.t('句',''),true,I18N.t('出证命中','Hit'));
        for(const op of (ln.reveal||[])){const r=await runOp(op);if(r==='fail')return 'fail';}
        if(ln.end)break;
        ln.weak=null;idx++;continue;
      }
      await say('me','请仲裁庭看这份材料：「'+ev.name+'」。');
      await say(CUR.bench,'本庭看过了。这份材料说的是：'+stripTags(fill(ev.desc))+' 而证人刚才那句话说的是：“'+stripTags(fill(ln.x))+'”。两者说的不是同一件事，谈不上矛盾。');
      if(await hurt(I18N.t('质证 · 第','Cross-examination · sentence ')+(idx+1)+I18N.t('句',''),I18N.t('证物不对题','Wrong item')))return 'fail';
      await say('chen',I18N.t('出示证据要对准他刚说的那一句，不是整个案子。','Aim the evidence at the sentence he just said, not at the whole case.'));
      idx++;continue;
    }
  }
  document.body.classList.remove('cine');byId('crossbar').classList.remove('on');
  /* 这一章的“代价”选择挂在某句证词的追问上；玩家没追问到的话，在质证结束时补上 */
  if(TH.running&&hasMech('cost')&&!TH.costDone){const c=lines.find(function(l){return l.cost;});if(c){const r=await doCost(c.cost);if(r==='fail')return 'fail';}}
}
function crossAct(a){if(!TH.crossRes)return;const r=TH.crossRes;TH.crossRes=null;r(a);}
async function useHint(){
  if(!TH.running)return;
  if(TH.crossRes){
    if(S.hints>0){ECON.hint();crossAct('hint');return;}
    const ok=await ECON.rewarded('看一段短片，换一张提示卡');
    if(ok){crossAct('hint');}else toast(I18N.t('提示卡用完了。可以在档案馆的小卖部用星尘买。','Hint cards are used up. You can buy them with stardust at the archive shop.'));
    return;
  }
  if(TH.chainHint){TH.chainHint();return;}
  toast(I18N.t('现在用不上提示。质证和组证据链时可以用。','Hints are not usable now. Save them for cross-examination and the evidence chain.'));
}
/* 庭上引律 */
async function citeLaw(){
  const items=LAWS.map(function(l){return Object.assign({},l,{dim:S.laws.indexOf(l.id)<0});});
  const id=await shelf(I18N.t('引用哪一条','Which provision to cite'),items,function(l){
    const known=S.laws.indexOf(l.id)>=0;
    return '<div class="sh-n">'+l.name+' <span class="sh-src">'+l.src+'</span>'+(known?' <span class="chip ok">法典已收</span>':'')+'</div><div class="sh-d">'+(known?l.text:'<i>你对这一条只记得个大概：'+l.text.slice(0,16)+'……</i>')+'</div>';
  });
  if(!id)return;
  const l=LAW_BY[id],right=(id===CUR.law);
  await say('me','本方援引'+l.src+'：'+l.text);
  if(right&&!TH.lawCited){
    TH.lawCited=true;SFX.objection();showObjection(I18N.t('引<br>律','CITE LAW'));await sleep(700);heal();
    logPick('庭上引律',true,'引对了条文');
    await say(CUR.bench,CUR.lawOk||'本庭注意到了。这一条正是本案的责任基础。请继续。');
    await say('chen',I18N.t('条文一摆出来，争论的范围就定了。之后他说什么，都得在这条线里说。','Once the provision is on the table, the scope of the argument is fixed. Whatever he says afterward must stay inside that line.'));
  }else if(right){
    await say(CUR.bench,'这一条本庭已经记下了，不必重复。');
  }else{
    await say(CUR.opp,I18N.t('仲裁庭，'+l.src+'管的是“'+l.scope+'”。本案争的是“'+CUR.issue+'”。对方引错了。','Presiding Arbitrator, '+l.src+' governs "'+l.scope+'." This case is about "'+CUR.issue+'." The citation is wrong.'));
    if(await hurt('庭上引律','引错条文'))return 'fail';
    await say('chen',I18N.t('条文不是挑最响亮的，是挑和本案争点对得上的那条。回法典看看每一条管什么。','Do not pick the loudest provision; pick the one that matches the issue in this case. Check the Code to see what each provision governs.'));
  }
}

/* ---------------- 证据链 ---------------- */
async function doChain(d){
  MUSIC.setMode('tension');
  const pool=(TH.evs.length?TH.evs:Object.keys(CUR.ev)).slice();
  if(d.intro)await say('chen',d.intro);
  let round=0,docSaid=false;const hintedLinks={};
  while(TH.running){
    round++;const draft=[];
    for(let i=0;i<d.links.length;i++){
      const ln=d.links[i];
      TH.chainHint=async function(){
        if(hintedLinks[i]){toast(I18N.t('提示：这一环用「'+evDef(ln.need).name+'」','Hint: for this link use "'+evDef(ln.need).name+'"'));return;}
        if(S.hints<=0){const ok=await ECON.rewarded(I18N.t('看一段短片，换一张提示卡','Watch a short clip for one hint card'));if(!ok){toast(I18N.t('提示卡用完了。','Hint cards are used up.'));return;}}else ECON.hint();
        hintedLinks[i]=true;toast(I18N.t('提示：这一环用「'+evDef(ln.need).name+'」','Hint: for this link use "'+evDef(ln.need).name+'"'));
      };
      const items=evList(pool);
      const idx=await choose(d.title+I18N.t(' · 第 ',' · Link ')+(i+1)+'/'+d.links.length+I18N.t(' 环',''),ln.k+'：'+ln.ask,items,function(e){return '<b>'+esc(e.name)+'</b><div class="cevd">'+fill(e.desc)+'</div>';});
      TH.chainHint=null;
      draft.push(items[idx].id);
      await say('me','<em>'+ln.k+'</em>：提交「'+items[idx].name+'」。');
    }
    TH.chainHint=null;
    await say('me','以上几份证据一并提交，请仲裁庭审查。');
    const hit=draft.filter(function(id,k){return id===d.links[k].need;}).length;
    if(hit===d.links.length){
      SFX.objection();showObjection(I18N.t('成<br>链','CHAIN FORMED'));await sleep(700);logPick(I18N.t('证据链','Evidence chain'),true,I18N.t('链条闭合','Chain closed'));
      await say(CUR.bench,I18N.t('本庭逐项审查完毕。'+cnNum(hit)+'项证据各自对应一个要件，链条完整。','The tribunal has reviewed each item. All '+hit+' items correspond to one element each; the chain is complete.'));
      if(d.doctrine&&!docSaid)await say('chen',d.doctrine);
      return;
    }
    await say(CUR.bench,I18N.t('本庭审查结果：'+cnNum(d.links.length)+'项之中，'+cnNum(hit)+'项站得住。具体是哪几项，本庭不替代理人判断。','Result of the review: of '+d.links.length+' items, '+hit+' hold. Which ones, the tribunal will not decide for counsel.'));
    if(await hurt(I18N.t('证据链 · 第','Evidence chain · attempt ')+round+I18N.t('次',''),I18N.t('链条没扣上','Chain not closed')))return 'fail';
    await say(CUR.opp,'链条不完整，对方的主张就立不起来。');
    if(round===1)await say('chen',hit===0?I18N.t('一环都没对上。回头看每一环要证明的到底是什么，别只看哪份材料分量重。','Not one link matched. Look again at what each link is meant to prove; do not just weigh which document looks heavy.'):I18N.t('有对的，也有错的。仲裁庭不会告诉你是哪几环。想清楚每一环要证明什么，再交一次。','Some are right and some are wrong. The tribunal will not tell you which. Think through what each link must prove, then submit again.'));
    else await say('chen',I18N.t('对上了 '+cnNum(hit)+' 环。别整条推倒重来，从你最没把握的那一环改起；实在拿不准，可以用一张提示卡。','Matched '+hit+' link(s). Do not tear up the whole chain; start from the link you are least sure of. If you really cannot tell, use a hint card.'));
    if(round>=2&&d.doctrine&&!docSaid){docSaid=true;await say('chen',d.doctrine);}
  }
}

/* ---------------- 人望代价 ---------------- */
async function doCost(d){
  if(TH.costDone)return;TH.costDone=true;
  if(d.lead)for(const op of d.lead)await runOp(op);
  const i=await choose('怎么问下去',d.q,d.opts,function(o){
    return fill(o.t)+'<div class="cevd">'+fill(o.d)+'</div><div class="ccost">'+(o.dm>0?'<span class="up">气势 +'+o.dm+'</span>':o.dm<0?'<span class="dn">气势 '+o.dm+'</span>':'<span class="no">气势不变</span>')+'</div>';
  });
  const o=d.opts[i];
  TH.morale=clamp(TH.morale+o.dm,1,TH.mcap);TH.standing=clamp(TH.standing+o.ds,0,5);
  updateMorale();updateStanding(o.ds);
  TH.picks.push({q:'怎么问下去',ok:true,tag:o.ds>0?'留了余地':'不留情面'});
  noteLean(o.ds>0?'comm':'open');
  for(const op of o.say)await runOp(op);
  await say('chen',o.fa);
}

/* ---------------- 旧话重提：对方拿你上一章的立场说事 ---------------- */
async function doPrecCite(d){
  const log=S.moralLog||[];if(!log.length)return;
  const prevCh=CH_ORDER[CH_ORDER.indexOf(TH.ch)-1],ent=log.filter(function(e){return e.ch===prevCh;}).pop()||log[log.length-1];
  const tag=ent.tag;
  const f=function(t){return String(t).split('$TAG').join(tag);};
  MUSIC.setMode('tension');
  await say(CUR.bench,'开庭前先处理一个程序问题。对方代理人申请就本方代理人此前的公开立场发问。本庭准许。');
  await say(d.opp,f(d.hook));
  await say('chen',I18N.t('重演室把你上一章的表态调出来了。真正的对手也会这么研究你。','The replay room has pulled up the position you took last chapter. A real opponent will study you the same way.'));
  const i=await choose(I18N.t('对方翻出了你说过的话','Your own words, produced'),I18N.t('你上一章选择了「'+tag+'」。','Last chapter you chose "'+tag+'."'),d.opts.map(function(o){return {x:f(o.x),ok:!!o.ok};}));
  const o=d.opts[i];
  if(o.ok){SFX.objection();showObjection(I18N.t('区<br>分','DISTINGUISH'));await sleep(700);heal();logPick(I18N.t('旧话重提','Old words revived'),true,I18N.t('区分成功','Distinguished'));
    await say(CUR.bench,I18N.t('本庭接受代理人的区分。两案情况不同，前述立场与本案无关。','The tribunal accepts counsel\'s distinction. The two cases differ, and the earlier position is irrelevant to this one.'));await say('chen',f(o.fa));}
  else{await say(d.opp,f(o.corr));if(await hurt(I18N.t('旧话重提','Old words revived'),I18N.t('被旧话拿住','Caught by your own record')))return 'fail';await say('chen',f(o.fa));}
}

/* ---------------- 裁判记录 ---------------- */
const LEAN={
 order:{n:'秩序',c:'#5FA9FF',d:'先看规矩和手续。规矩立在那里，就照着走。'},
 open:{n:'开拓',c:'#EBA43A',d:'先看行动和效率。不先迈出去，规矩管的就是一片空地。'},
 comm:{n:'共有',c:'#3FA36F',d:'先看全体和长远。天上那点地方，是所有人的。'}
};
function leanTally(){const t={order:0,open:0,comm:0};(S.leanLog||[]).forEach(function(k){if(t[k]!==undefined)t[k]++;});
  Object.keys(S.judge||{}).forEach(function(k){const st=S.judge[k],p=BENCH_BY[k];if(st&&p&&p.lean)t[p.lean[st.ch]]++;});return t;}
function leanTop(){const t=leanTally(),ks=Object.keys(t).sort(function(a,b){return t[b]-t[a];});
  if(t[ks[0]]===0)return null;if(t[ks[0]]===t[ks[1]])return {k:'mixed',n:'持中',c:'#A8B4CC',d:'三条路你都走过一段，没有明显偏向。'};return Object.assign({k:ks[0]},LEAN[ks[0]]);}
const LEAN_READ={
 order:{hook:'我方查阅了对方代理人过往的表态和裁判记录。几乎每一次，他都把手续放在最前面。一个凡事先问“手续齐不齐”的人，今天却要仲裁庭体谅一个没走手续的当事人？',
  opts:[{x:'正因为我看重手续，才知道手续是干什么用的：让人能被找到、能被通知。我方当事人查了登记、发了公告，手续比对方做得完整。',ok:true,fa:'对方把那叠记录收了回去。'},
        {x:'我过往的表态和记录跟本案没有关系。那些都是在别的场合、针对别的问题说的，请仲裁庭就事论事，只看本案的证据。',ok:false,fa:'首席仲裁员没有接话，记录还摊在桌上。'},
        {x:'没错，我一向看重手续，这一点我不否认。所以本案也应该严格按手续来办，谁没走手续，谁就承担不利的后果。',ok:false,fa:'这句话等于替对方说了一半。'}]},
 open:{hook:'对方代理人的过往记录显示，他总站在“先干了再说”的一边。那么请问：我方当事人先把采矿站送上去再补登记，按他自己的标准，有什么错？',
  opts:[{x:'我确实支持先迈出去。但迈出去的人，要自己承担脚下的坑。先行动不等于可以不留联系方式。',ok:true,fa:'对方想再问一遍，首席仲裁员示意他坐下。'},
        {x:'练习是练习，本案是本案。过去在别的场合说过什么，跟今天这座采矿站该怎么处理，没有任何关系。',ok:false,fa:'对方笑了笑，坐下了。'},
        {x:'那我收回之前的看法。经过这个案子，我现在认为太空里的事必须严格按规矩来，先登记再行动。',ok:false,fa:'书记员停了一下，才把这句话记下来。'}]},
 comm:{hook:'对方代理人的过往记录里，“全人类”出现得很频繁。既然太空是大家的，那我方的采矿站被人拖走，是不是也该算“大家的事”，不必赔？',
  opts:[{x:'共有的是那片空间，不是某一家的设备。正因为航道是大家的，挡在航道上的东西才必须有人负责、能被找到。',ok:true,fa:'对方没有再提“全人类”这三个字。'},
        {x:'我不认为代理人过去的表态，可以拿来质疑他今天在这个案子里的主张。请对方回到本案的证据上来。',ok:false,fa:'首席仲裁员把问题又念了一遍。'},
        {x:'确实，太空是大家的，损失也应该由大家共同分担。不过本案的情况比较特殊，不能简单套用这个道理。',ok:false,fa:'“特殊”两个字，被对方记了下来。'}]},
 mixed:{hook:'我方看了对方代理人的过往记录，前后的表态各不相同，看不出什么原则。一个自己都没想清楚的人，来告诉仲裁庭什么是对的？',
  opts:[{x:'案子不一样，答案就该不一样。把不同的案子判成一个样，那才叫没看卷宗。',ok:true,fa:'首席仲裁员点了点头，示意继续。'},
        {x:'我的立场一直很清楚，前后完全一致，是对方断章取义、故意曲解。',ok:false,fa:'对方把那几份记录一份一份念了出来。'},
        {x:'本方对这个问题不作任何回应，请仲裁庭直接进入下一项议程。',ok:false,fa:'笔录上，这一栏是空的。'}]}
};
async function doLean(d){
  const n=(S.leanLog||[]).length+Object.keys(S.judge||{}).length;
  if(n<2){
    await say(d.opp,I18N.t('我方想查一查对方代理人的过往记录，几乎是一张白纸。','We would like to examine the opposing representative\'s record. It is almost a blank page.'));
    await say('chen',I18N.t('你在“裁判练习”里落的槌太少，对方抓不到把柄。不过以后你写下的每一笔，都会有人来读。','You have dropped too few gavels in bench practice for the opponent to find a handle. But every stroke you write from now on will be read.'));
    return;
  }
  const top=leanTop(),key=top&&LEAN_READ[top.k]?top.k:'mixed',C=LEAN_READ[key];
  MUSIC.setMode('tension');
  await say(CUR.bench,I18N.t('本庭准许对方就代理人的过往表态和裁判记录发问。','The tribunal permits the opposing side to question the representative on past positions and bench records.'));
  await say(d.opp,C.hook);
  if(d.tail)await say(CUR.bench,d.tail);
  const i=await choose(I18N.t('对方读出了你的偏向','Your leanings, read out'),I18N.t('对方的判断：<b style="color:'+(top?top.c:'#A8B4CC')+'">'+(top?top.n:'持中')+'</b>（依据你此前 '+n+' 次取舍）','Their read: <b style="color:'+(top?top.c:'#A8B4CC')+'">'+(top?top.n:'Balanced')+'</b> (from your '+n+' previous choices)'),C.opts);
  const o=C.opts[i];
  if(o.ok){SFX.objection();showObjection();await sleep(650);heal();logPick(I18N.t('裁判记录','Bench record'),true,I18N.t('用自己的记录反驳','Answered with your own record'));await say(CUR.bench,I18N.t('代理人的说明前后一致。对方的质疑不予采纳。','Counsel\'s account is consistent throughout. The challenge is not adopted.'));}
  else{await say(d.opp,I18N.t('请书记员记下这句话。','Let the clerk record that sentence.'));if(await hurt(I18N.t('裁判记录','Bench record'),I18N.t('被自己的记录拿住','Caught by your own record')))return 'fail';}
  await say('chen',o.fa);
}

/* ---------------- 和解 ---------------- */
async function doSettle(d){
  MUSIC.setMode('court');
  await say(d.opp,d.offer);
  await say(CUR.bench,I18N.t('本庭依惯例询问'+CUR.role+'代理人：是否接受和解？','As is customary, the tribunal asks the '+CUR.role+'\'s representative: do you accept a settlement?'));
  const i=await choose(I18N.t('这一案怎么收场','How this case ends'),'',[
    {x:I18N.t('拒绝和解，请仲裁庭作出裁决。<div class="cevd">风险更高。但只有裁决会把规则说清楚，留下先例。</div>','Refuse the settlement and ask the tribunal to award.<div class="cevd">Riskier. But only an award states the rule clearly and leaves a precedent.</div>')},
    {x:(CUR.role==='申请人'?I18N.t('接受和解。拿到钱，到此为止。','Accept the settlement. Take the money and stop here.'):I18N.t('接受和解。各退一步，到此为止。','Accept the settlement. Each side steps back, and stop here.'))+'<div class="cevd">'+I18N.t('稳妥。但仲裁庭不会就法律问题表态，也不会留下先例。','Safe. But the tribunal takes no position on the law, and no precedent is left.')+'</div>'}]);
  if(i===1){
    TH.ending='settle';logPick(I18N.t('收场方式','How the case ends'),true,I18N.t('和解','Settlement'));noteLean('open');
    await say(CUR.bench,'双方达成和解。本庭记录和解协议，本案终结，不作实体裁决。');
    await say('chen',d.cost);
    return finishChapter({settled:true});
  }
  TH.ending='verdict';logPick(I18N.t('收场方式','How the case ends'),true,I18N.t('请求裁决','Award requested'));noteLean('order');
  await say('me',CUR.role==='申请人'?I18N.t('本方拒绝和解，请仲裁庭作出裁决。我们要的不只是钱，还有一个说法。','We refuse the settlement and ask the tribunal to award. What we want is not only the money, but a ruling.'):I18N.t('本方拒绝和解，请仲裁庭作出裁决。这件事该说清楚。','We refuse the settlement and ask the tribunal to award. This matter should be made clear.'));
}

/* ---------------- 终局陈述 ---------------- */
async function doFinal(d){
  MUSIC.setMode('tension');
  await say('chen',d.lead||I18N.t('最后陈述。挑一句说完之后对方再也翻不过来的话。','Closing statement. Pick the one line your opponent can never get around.'));
  const i=await choose(I18N.t('终局陈述','Closing statement'),d.ask,d.opts);
  const o=d.opts[i];
  if(!o.ok){
    await say(CUR.opp,o.corr);
    if(await hurt('终局陈述',o.tag||'失着'))return 'fail';
    await say('chen',o.fa);
    await say('chen',I18N.t('还来得及补救。改用正确的依据再说一遍。','There is still time to fix it. Say it again with the correct basis.'));
    await say('me',d.opts.find(function(x){return x.ok;}).x);
    return;
  }
  logPick('终局陈述',true,'说中要害');
  await say('me',o.x);
  await say('chen',o.fa);
}

/* ---------------- 立场（没有对错） ---------------- */
async function doMoral(d){
  document.body.classList.remove('cine');MUSIC.setMode('court');
  await say('chen',d.q);
  const i=await choose('你的立场','没有标准答案。你的选择会被记下，后面的章节可能会被人提起。',d.opts,function(o){return '<b class="ctag">'+o.tag+'</b><br>'+fill(o.x);});
  const o=d.opts[i];
  await say('chen',o.echo);
  const had=S.moralLog.some(function(e){return e.ch===TH.ch;});
  S.moralLog=S.moralLog.filter(function(e){return e.ch!==TH.ch;});S.moralLog.push({tag:o.tag,ch:TH.ch,day:todayStr()});save();
  if(o.lean&&!had)noteLean(o.lean);/* 重玩时不把同一章的偏向再记一遍 */
}
