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
  setMission('现场取证 · 关键证物 '+found()+'/'+keys);
  const svg=byId('scSvg');
  await new Promise(function(resolve){
    /* 取证结束后立刻撤掉剩下的标记，免得转场时再点出一段对白 */
    let fin=false;
    const done=function(){if(fin)return;fin=true;$$('#scSvg .hotspot').forEach(function(h){h.remove();});resolve();};
    d.spots.forEach(function(sp){
      if(TH.evs.indexOf(sp.id)>=0)return;
      const g=document.createElementNS('http://www.w3.org/2000/svg','g');
      g.setAttribute('class','hotspot');g.setAttribute('transform','translate('+sp.x+','+sp.y+')');
      g.innerHTML='<circle class="ring" r="16"/><circle class="dot" r="5"/><circle class="hit" r="42"/>';
      g.addEventListener('click',async function(e){
        e.stopPropagation();
        if(fin)return;
        if(TH.busy||TH.typing||TH.resolver){dlgTap();return;}
        TH.busy=true;SFX.reveal();buzz(14);TH.evs.push(sp.id);
        const bb=g.getBoundingClientRect();FX.sparkle(bb.left+bb.width/2,bb.top+bb.height/2,'#F6C35B',14);g.remove();
        const ev=evDef(sp.id);
        await say(d.guide||'chen','<em>收进证物袋：「'+ev.name+'」</em><br>'+ev.desc);
        if(sp.say)await say(sp.say[0],sp.say[1]);
        setMission(found()>=keys?'关键证物已齐 · 回庭':'现场取证 · 关键证物 '+found()+'/'+keys);
        if(found()>=keys){await say('chen',d.done||'该拿的都拿到了。回去开庭。');TH.busy=false;done();}
        else TH.busy=false;
      });
      svg.appendChild(g);
    });
    if(found()>=keys)done();
  });
  setMission('');
  await irisTo(function(){setScene(d.back);});MUSIC.setMode('court');
}

/* ---------------- 质证 ---------------- */
async function doCross(d){
  MUSIC.setMode('tension');document.body.classList.add('cine');
  if(d.intro)for(const op of d.intro){const r=await runOp(op);if(r==='fail')return 'fail';}
  const lines=d.lines.map(function(l){return Object.assign({},l);});
  let idx=0,loops=0,hintLv=0;
  while(TH.running){
    if(idx>=lines.length){
      loops++;idx=0;
      await say('chen',loops===1?'证词说完了，还没找到破绽。再听一遍，留意哪一句和证物对不上。':'再听一遍。不确定的话，先“追问”，让他多说几句。');
    }
    const ln=lines[idx];
    setPlate(d.witness,'证词 '+(idx+1)+'/'+lines.length);VOICE=d.witness;
    const slot=slotFor(sideOf(d.witness));
    ['actL','actR','actM'].forEach(function(id){byId(id).classList.remove('speaking');});
    if(slot)showActor(slot,d.witness).classList.add('speaking');camTo(sideOf(d.witness));
    byId('dlgNext').style.display='none';
    await typeText(fill(ln.x));
    byId('btnLaw').classList.toggle('hidden',!hasMech('law'));
    byId('crossbar').classList.add('on');
    const act=await new Promise(function(res){TH.crossRes=res;});
    TH.crossRes=null;byId('crossbar').classList.remove('on');
    if(!TH.running)return 'fail';
    if(act==='hint'){
      const target=lines.findIndex(function(l){return l.weak&&TH.evs.indexOf(l.weak)>=0&&l.end;});
      const t=target>=0?target:lines.findIndex(function(l){return l.weak;});
      if(t<0){await say('chen','现在没什么可提示的，先往下听。');continue;}
      hintLv++;
      if(hintLv===1)await say('chen','提示：注意<em>第 '+(t+1)+' 句</em>。它和你手里的某件证物说的不是一回事。');
      else await say('chen','提示：第 '+(t+1)+' 句，用<em>「'+evDef(lines[t].weak).name+'」</em>。');
      continue;
    }
    if(act==='law'){const r=await citeLaw();if(r==='fail')return 'fail';continue;}
    if(act==='press'){
      if(hasMech('standing')&&TH.standing<=1){
        await say(d.witness,d.refuse||'我已经回答过了。别的，我不想再说。');
        await say('chen','证人不肯开口了。你前面问得太狠，人家记着。');idx++;continue;
      }
      if(ln.press){
        for(const op of ln.press){const r=await runOp(op);if(r==='fail')return 'fail';}
        if(ln.add&&!ln.added){ln.added=true;lines.splice(idx+1,0,Object.assign({},ln.add));}
        if(ln.cost&&hasMech('cost')&&!TH.costDone){const r=await doCost(ln.cost);if(r==='fail')return 'fail';}
      }else{
        await say(d.witness,d.idle||'我说的就是事实，没什么可补充的。');
        if(hasMech('standing')&&TH.standing>=4&&d.gift&&!TH.giftDone){TH.giftDone=true;await say(d.witness,d.gift);await say('chen','这句话他本可以不说。你对人客气，人家也愿意多说一点。');}
        else await say('chen','这一句问不出什么。把力气留给有毛病的那句。');
      }
      idx++;continue;
    }
    if(act==='ev'){
      const pickId=await shelf('出示哪一件证物',evList(TH.evs),renderEv);
      if(!pickId)continue;
      const ev=evDef(pickId);
      if(pickId===ln.weak){
        SFX.objection();buzz([50,30,70]);showObjection();await sleep(850);
        logPick('质证 · 第'+(idx+1)+'句',true,'出证命中');
        for(const op of (ln.reveal||[])){const r=await runOp(op);if(r==='fail')return 'fail';}
        if(ln.end)break;
        ln.weak=null;idx++;continue;
      }
      await say('me','请仲裁庭看这份材料：「'+ev.name+'」。');
      await say(CUR.bench,'本庭看过了。这份材料说的是：'+stripTags(fill(ev.desc))+' 而证人刚才那句话说的是：“'+stripTags(fill(ln.x))+'”。两者说的不是同一件事，谈不上矛盾。');
      if(await hurt('质证 · 第'+(idx+1)+'句','证物不对题'))return 'fail';
      await say('chen','出示证据要对准他刚说的那一句，不是整个案子。');
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
    if(ok){crossAct('hint');}else toast('提示卡用完了。可以在档案馆的小卖部用星尘买。');
    return;
  }
  if(TH.chainHint){TH.chainHint();return;}
  toast('现在用不上提示。质证和组证据链时可以用。');
}
/* 庭上引律 */
async function citeLaw(){
  const items=LAWS.map(function(l){return Object.assign({},l,{dim:S.laws.indexOf(l.id)<0});});
  const id=await shelf('引用哪一条',items,function(l){
    const known=S.laws.indexOf(l.id)>=0;
    return '<div class="sh-n">'+l.name+' <span class="sh-src">'+l.src+'</span>'+(known?' <span class="chip ok">法典已收</span>':'')+'</div><div class="sh-d">'+(known?l.text:'<i>你对这一条只记得个大概：'+l.text.slice(0,16)+'……</i>')+'</div>';
  });
  if(!id)return;
  const l=LAW_BY[id],right=(id===CUR.law);
  await say('me','本方援引'+l.src+'：'+l.text);
  if(right&&!TH.lawCited){
    TH.lawCited=true;SFX.objection();showObjection('引<br>律');await sleep(700);heal();
    logPick('庭上引律',true,'引对了条文');
    await say(CUR.bench,CUR.lawOk||'本庭注意到了。这一条正是本案的责任基础。请继续。');
    await say('chen','条文一摆出来，争论的范围就定了。之后他说什么，都得在这条线里说。');
  }else if(right){
    await say(CUR.bench,'这一条本庭已经记下了，不必重复。');
  }else{
    await say(CUR.opp,'仲裁庭，'+l.src+'管的是“'+l.scope+'”。本案争的是“'+CUR.issue+'”。对方引错了。');
    if(await hurt('庭上引律','引错条文'))return 'fail';
    await say('chen','条文不是挑最响亮的，是挑和本案争点对得上的那条。回法典看看每一条管什么。');
  }
}

/* ---------------- 证据链 ---------------- */
async function doChain(d){
  MUSIC.setMode('tension');
  const pool=(TH.evs.length?TH.evs:Object.keys(CUR.ev)).slice();
  if(d.intro)await say('chen',d.intro);
  let round=0;
  while(TH.running){
    round++;const draft=[];
    let hinted=-1;
    for(let i=0;i<d.links.length;i++){
      const ln=d.links[i];
      TH.chainHint=async function(){
        if(S.hints<=0){const ok=await ECON.rewarded('看一段短片，换一张提示卡');if(!ok){toast('提示卡用完了。');return;}}else ECON.hint();
        hinted=i;toast('提示：这一环用「'+evDef(ln.need).name+'」');
      };
      const items=evList(pool);
      const idx=await choose(d.title+' · 第 '+(i+1)+'/'+d.links.length+' 环',ln.k+'：'+ln.ask,items,function(e){return '<b>'+esc(e.name)+'</b><div class="cevd">'+fill(e.desc)+'</div>';});
      draft.push(items[idx].id);
      await say('me','<em>'+ln.k+'</em>：提交「'+items[idx].name+'」。');
    }
    TH.chainHint=null;
    await say('me','以上几份证据一并提交，请仲裁庭审查。');
    const hit=draft.filter(function(id,k){return id===d.links[k].need;}).length;
    if(hit===d.links.length){
      SFX.objection();showObjection('成<br>链');await sleep(700);logPick('证据链',true,'链条闭合');
      await say(CUR.bench,'本庭逐项审查完毕。'+cnNum(hit)+'项证据各自对应一个要件，链条完整。');
      if(d.doctrine)await say('chen',d.doctrine);
      return;
    }
    await say(CUR.bench,'本庭审查结果：'+cnNum(d.links.length)+'项之中，'+cnNum(hit)+'项站得住。具体是哪几项，本庭不替代理人判断。');
    if(await hurt('证据链 · 第'+round+'次','链条没扣上'))return 'fail';
    await say(CUR.opp,'链条不完整，对方的主张就立不起来。');
    await say('chen',hit===0?'一环都没对上。回头看每一环要证明的到底是什么，别只看哪份材料分量重。':'有对的，也有错的。仲裁庭不会告诉你是哪几环。想清楚每一环要证明什么，再交一次。');
    if(round>=2&&d.doctrine)await say('chen',d.doctrine);
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
  const tag=log[log.length-1].tag;
  const f=function(t){return String(t).split('$TAG').join(tag);};
  MUSIC.setMode('tension');
  await say(CUR.bench,'开庭前先处理一个程序问题。对方代理人申请就本方代理人此前的公开立场发问。本庭准许。');
  await say(d.opp,f(d.hook));
  await say('chen','重演室把你上一章的表态调出来了。真正的对手也会这么研究你。');
  const i=await choose('对方翻出了你说过的话','你上一章选择了「'+tag+'」。',d.opts.map(function(o){return {x:f(o.x)};}));
  const o=d.opts[i];
  if(o.ok){SFX.objection();showObjection('区<br>分');await sleep(700);heal();logPick('旧话重提',true,'区分成功');
    await say(CUR.bench,'本庭接受代理人的区分。两案情况不同，前述立场与本案无关。');await say('chen',f(o.fa));}
  else{await say(d.opp,f(o.corr));if(await hurt('旧话重提','被旧话拿住'))return 'fail';await say('chen',f(o.fa));}
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
 order:{hook:'我方查阅了对方代理人的裁判练习记录。几乎每一案，他都把手续放在最前面。一个凡事先问“手续齐不齐”的人，今天却要仲裁庭体谅一个没走手续的当事人？',
  opts:[{x:'正因为我看重手续，我才知道手续是用来干什么的：让人能被找到、能被通知。我方当事人查了登记、发了公告，手续做得比对方完整。',ok:true,fa:'对方把那叠记录收了回去。'},
        {x:'我的练习记录和本案无关，请仲裁庭就事论事。',ok:false,fa:'首席仲裁员没有接话，记录还摊在桌上。'},
        {x:'没错，我一向重手续，所以本案也应该严格按手续办。',ok:false,fa:'这句话等于替对方说了一半。'}]},
 open:{hook:'对方代理人的练习记录显示，他总站在“先干了再说”的一边。那么请问：我方当事人先把采矿站送上去再补登记，按他自己的标准，有什么错？',
  opts:[{x:'我确实支持先迈出去。但迈出去的人，要自己承担脚下的坑。先行动不等于可以不留联系方式。',ok:true,fa:'对方想再问一遍，首席仲裁员示意他坐下。'},
        {x:'练习是练习，本案是本案。',ok:false,fa:'对方笑了笑，坐下了。'},
        {x:'那我收回之前的看法，本案我主张严格按规矩办。',ok:false,fa:'书记员停了一下，才把这句话记下来。'}]},
 comm:{hook:'对方代理人的练习记录里，“全人类”出现得很频繁。既然太空是大家的，那我方的采矿站被人拖走，是不是也该算“大家的事”，不必赔？',
  opts:[{x:'共有的是那片空间，不是某一家的设备。正因为航道是大家的，挡在航道上的东西才必须有人负责、能被找到。',ok:true,fa:'对方没有再提“全人类”这三个字。'},
        {x:'我不认为练习记录可以拿来质疑代理人。',ok:false,fa:'首席仲裁员把问题又念了一遍。'},
        {x:'确实，损失应该大家分担。但本案情况特殊。',ok:false,fa:'“特殊”两个字，被对方记了下来。'}]},
 mixed:{hook:'我方看了对方代理人的练习记录，五案五个样，看不出什么原则。一个自己都没想清楚的人，来告诉仲裁庭什么是对的？',
  opts:[{x:'案子不一样，答案就该不一样。把五个不同的案子判成一个样，那叫没看卷宗。',ok:true,fa:'首席仲裁员点了点头，示意继续。'},
        {x:'我的立场一直很清楚，是对方断章取义。',ok:false,fa:'对方把五份练习一份一份念了出来。'},
        {x:'本方不回应。',ok:false,fa:'笔录上，这一栏是空的。'}]}
};
async function doLean(d){
  const n=(S.leanLog||[]).length+Object.keys(S.judge||{}).length;
  if(n<2){
    await say(d.opp,'我方想查一查对方代理人的过往记录，几乎是一张白纸。');
    await say('chen','你在“裁判练习”里落的槌太少，对方抓不到把柄。不过以后你写下的每一笔，都会有人来读。');
    return;
  }
  const top=leanTop(),key=top&&LEAN_READ[top.k]?top.k:'mixed',C=LEAN_READ[key];
  MUSIC.setMode('tension');
  await say(CUR.bench,'本庭准许对方就代理人的裁判练习记录发问。');
  await say(d.opp,C.hook);
  if(d.tail)await say(CUR.bench,d.tail);
  const i=await choose('对方读出了你的偏向','对方的判断：<b style="color:'+(top?top.c:'#A8B4CC')+'">'+(top?top.n:'持中')+'</b>（依据你此前 '+n+' 次取舍）',C.opts);
  const o=C.opts[i];
  if(o.ok){SFX.objection();showObjection();await sleep(650);heal();logPick('裁判记录',true,'用自己的记录反驳');await say(CUR.bench,'代理人的说明前后一致。对方的质疑不予采纳。');}
  else{await say(d.opp,'请书记员记下这句话。');if(await hurt('裁判记录','被自己的记录拿住'))return 'fail';}
  await say('chen',o.fa);
}

/* ---------------- 和解 ---------------- */
async function doSettle(d){
  MUSIC.setMode('court');
  await say(d.opp,d.offer);
  await say(CUR.bench,'本庭依惯例询问'+CUR.role+'代理人：是否接受和解？');
  const i=await choose('这一案怎么收场','',[
    {x:'拒绝和解，请仲裁庭作出裁决。<div class="cevd">风险更高。但只有裁决会把规则说清楚，留下先例。</div>'},
    {x:(CUR.role==='申请人'?'接受和解。拿到钱，到此为止。':'接受和解。各退一步，到此为止。')+'<div class="cevd">稳妥。但仲裁庭不会就法律问题表态，也不会留下先例。</div>'}]);
  if(i===1){
    TH.ending='settle';logPick('收场方式',true,'和解');noteLean('open');
    await say(CUR.bench,'双方达成和解。本庭记录和解协议，本案终结，不作实体裁决。');
    await say('chen',d.cost);
    return finishChapter({settled:true});
  }
  TH.ending='verdict';logPick('收场方式',true,'请求裁决');noteLean('order');
  await say('me',CUR.role==='申请人'?'本方拒绝和解，请仲裁庭作出裁决。我们要的不只是钱，还有一个说法。':'本方拒绝和解，请仲裁庭作出裁决。这件事该说清楚。');
}

/* ---------------- 终局陈述 ---------------- */
async function doFinal(d){
  MUSIC.setMode('tension');
  await say('chen',d.lead||'最后陈述。挑一句说完之后对方再也翻不过来的话。');
  const i=await choose('终局陈述',d.ask,d.opts);
  const o=d.opts[i];
  if(!o.ok){
    await say(CUR.opp,o.corr);
    if(await hurt('终局陈述',o.tag||'失着'))return 'fail';
    await say('chen',o.fa);
    await say('chen','还来得及补救。改用正确的依据再说一遍。');
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
  S.moralLog.push({tag:o.tag,ch:TH.ch,day:todayStr()});save();
  if(o.lean)noteLean(o.lean);
}
