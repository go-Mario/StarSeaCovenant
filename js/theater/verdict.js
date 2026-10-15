"use strict";
/* =====================================================================
   裁决书、裁决后程序、章节结算与“现实原型”卡片
   ===================================================================== */
function showVerdictDoc(o){
  o=o||{};
  return new Promise(function(res){
    const C=CUR,M=C.verdict,box=byId('verdict'),doc=byId('vdoc');
    const seal=COSMETICS.seal.find(function(x){return x.id===S.equip.seal;})||COSMETICS.seal[0];
    const paper=COSMETICS.paper.find(function(x){return x.id===S.equip.paper;})||COSMETICS.paper[0];
    doc.className='vdoc era-'+C.era+' '+paper.css;
    const resp=C.role==='被申请人';
    let body,hold;
    if(o.lost){
      body=resp?'审理中，被申请人代理人未能就其抗辩完成举证。抗辩同样需要证据支持，本庭对被申请人的抗辩事由不予采纳。':'审理中，申请人代理人未能就其主张完成举证。依举证责任分配规则，主张者负举证责任，举证不能的，承担不利后果。';
      hold=(resp?'支持申请人的请求。':'驳回申请人的全部请求。')+'本案不形成可供援引的先例。';
    }else if(o.settled){
      body='双方当事人在裁决作出前达成和解。应双方请求，本庭以“按和解条款作出的裁决”记录该协议。本庭不就争议的法律问题作出认定，本案不形成先例。';
      hold=M.settleHold||'按和解协议履行。';
    }else if(TH.award){
      body=M.body;
      hold=TH.award.res.map(function(r,k){return '<div class="v-iss"><b>'+cnNum(k+1)+'、'+r.iss.title+'</b>'+fill(r.o.t)+(r.q.k==='ultra'&&TH.ultraHit?' <span class="v-annul">'+(C.advisory?'（定稿时删去）':'（已被撤销）')+'</span>':'')+'</div>';}).join('');
    }else{body=M.body;hold=M.hold;}
    const d=new Date();
    doc.innerHTML=
      '<div class="vhd">'+M.court+'</div>'+
      '<div class="vti">'+(o.settled?'和 解 裁 决 书':(C.advisory?'咨 询 意 见':'裁 决 书'))+'</div>'+
      '<div class="vno">'+M.no+'</div><div class="vrule"></div>'+
      '<div class="vrow"><div class="vk">案　　由</div><div class="vv">'+M.cause+'</div></div>'+
      '<div class="vrow"><div class="vk">'+(C.advisory?'请 求 方':'申 请 人')+'</div><div class="vv">'+M.pl+'</div></div>'+
      '<div class="vrow"><div class="vk">'+(C.advisory?'相 关 方':'被申请人')+'</div><div class="vv">'+M.df+'</div></div>'+
      '<div class="vrow"><div class="vk">依　　据</div><div class="vv">'+M.law+'</div></div>'+
      '<div class="vbody">'+fill(body)+'</div>'+
      '<div class="vhold"><span class="vhk">'+(C.advisory?'意 见 如 下':'裁 决 如 下')+'</span>'+fill(hold)+'</div>'+
      (o.settled||C.advisory?'':'<div class="vfinal"><span class="vhk">终 局 性</span>本裁决为终局裁决，自作出之日起对双方具有约束力，当事人不得就实体问题上诉。</div>')+
      '<div class="vfoot"><div class="vsign">'+M.sign+'<br><span class="v-date">'+(C.yearFull||C.year)+'</span><span class="v-re">重演：'+esc(S.profile.name)+' · '+d.getFullYear()+'.'+(d.getMonth()+1)+'.'+d.getDate()+'</span></div>'+
      '<div class="vseal '+seal.css+(o.lost?' dim':'')+'">'+M.seal+'</div></div>'+
      '<button class="vclose" id="vclose">收起</button>';
    box.classList.add('on');setTimeout(function(){SFX.stamp();},1050);
    byId('vclose').onclick=function(){SFX.tap();box.classList.remove('on');res();};
  });
}

/* 裁决后程序：第一章只简单交代；第二章起可以亲手试 */
const POST_OPTS=[
 {k:'interp',t:'请求解释裁决',law:'收到裁决后 30 日内',d:'请仲裁庭说明某一项的含义。不会改变结果。'},
 {k:'correct',t:'请求更正',law:'30 日内',d:'只限计算错误、笔误之类。',rej:'本庭复核过，没有计算或文字错误。更正程序不能拿来改裁决的内容。驳回。'},
 {k:'addit',t:'请求补充裁决',law:'30 日内',d:'只限“提了但仲裁庭没处理”的请求。',rej:'双方提出的每一项请求，本庭都已经处理，没有遗漏。驳回。'},
 {k:'annul',t:'向法院申请撤销',law:'收到裁决后 3 个月内',d:'只限程序问题：没有管辖权、没机会陈述、超裁、程序违反约定等。',rej:'申请人说的，其实是不同意本庭的事实认定和法律适用。这不属于撤销理由。驳回。'},
 {k:'accept',t:'接受裁决',law:'',d:'裁决生效，双方履行。'}
];
async function doPostAward(){
  if(!hasMech('postAward')){
    await say(CUR.bench,'本裁决为终局裁决，双方不得上诉。');
    await say('chen','“一裁终局”就是这个意思：判完就是判完了。下一章你可以试试，输的一方还能做些什么。');
    return;
  }
  if(S.tips.indexOf('postAward')<0)await showTip('postAward');
  const again=!!S.postSeen;S.postTried=S.postTried||{};
  await say(CUR.bench,'本裁决为终局裁决，双方不得就实体问题上诉。如认为存在法定情形，可在期限内提出以下申请。');
  if(!again)await say('chen','你可以站在输的那一方试试看，每条路能走多远。');
  S.postSeen=true;save();
  const used={};
  while(TH.running){
    const i=await choose('裁决之后','从收到裁决之日起算期限。',POST_OPTS,function(o){return '<b>'+o.t+'</b>'+(used[o.k]?' <span class="chip">已试过</span>':'')+'<div class="cevd">'+o.d+(o.law?'　·　'+o.law:'')+'</div>';});
    const o=POST_OPTS[i];
    if(o.k==='accept'){await say(CUR.bench,'裁决生效。本案终结。');break;}
    if(used[o.k]){await say(CUR.bench,'这项申请已经处理过了。');continue;}
    used[o.k]=true;
    if(o.k==='interp'){await say(CUR.bench,CUR.interp);await say('chen','他会解释给你听，但一个字都不会改。');}
    else if(S.postTried[o.k]){await say(CUR.bench,'理由和上一案一样：这项申请不符合法定情形，本庭不予受理。');}/* 前几章试过的路，不再把同一段话念一遍 */
    else{await say(CUR.bench,o.rej);if(o.k==='annul')await say('chen','可以不服，但没有第二次开庭。');}
    S.postTried[o.k]=true;save();
  }
}

/* 评定的高低，用来保留最好的一次 */
function gradeRank(g){if(!g)return -1;const b=String(g).replace(/（.*）/,''),L=['难以服众','险胜','勉强过关','有惊无险','基本成立','和解结案','干净利落','说理扎实','无懈可击','堪称范本'];let k=L.indexOf(b);if(k<0)k=0;return k*2-(/（/.test(g)?1:0);}
/* 章节收尾：评定、奖励、存档、现实原型 */
async function finishChapter(d){
  d=d||{};
  const C=CUR,id=TH.ch,settled=!!d.settled;
  if(!settled&&!C.arbiter){
    if(C.winLines)for(const op of C.winLines)await runOp(op);
    SFX.gavel();await sleep(300);MUSIC.setMode('victory');SFX.win();FX.center();
  }else if(C.arbiter){MUSIC.setMode('victory');FX.center();}
  /* 评定 */
  let grade;
  if(settled)grade='和解结案';
  else if(C.arbiter){const a=TH.award,r=a.pts/a.max-(TH.impartial<=2?.25:0);/* 发问时失了公正，评定降一档 */grade=(r>=1&&!a.ultra)?'堪称范本':r>=.75?'说理扎实':r>=.5?'基本成立':r>=.25?'勉强过关':'难以服众';if(a.ultra)grade+=C.advisory?'（越题部分已删去）':'（部分被撤销）';}
  else{const miss=TH.picks.filter(function(p){return !p.ok;}).length;grade=miss===0&&TH.flawless?'无懈可击':miss===0?'干净利落':miss<=2?'有惊无险':'险胜';}
  await showVerdictDoc({settled:settled});
  if(!settled&&!C.arbiter)await doPostAward();
  /* 奖励 */
  const first=!SAVE.chDone(id);
  const prev=S.ch[id]||{};
  let dust=first?60:10,rep=0;
  if(first){rep=C.rep||5;if(grade==='无懈可击'||grade==='堪称范本'){rep+=1;dust+=20;}}
  /* 重玩不会把档案里的评定改差：存最好的那次 */
  const best=gradeRank(grade)>=gradeRank(prev.best||prev.grade)?grade:(prev.best||prev.grade);
  S.ch[id]={done:true,grade:grade,ending:TH.ending,flawless:TH.flawless,picks:TH.picks.slice(),evs:TH.evs.slice(),facts:TH.facts.slice(),date:Date.now(),best:best};
  const newLaw=unlockLaw(C.unlock||C.law,true)?(C.unlock||C.law):null;
  let newPrec=null,precNote='';
  /* 仲裁员章节：只有关键争点判得扎实，才写入先例 */
  const precOk=!C.arbiter||!TH.award||(TH.award.res[C.precIssue||0]&&TH.award.res[C.precIssue||0].q.k==='solid');
  if(!settled&&C.prec&&S.precs.indexOf(C.prec)<0){if(precOk){S.precs.push(C.prec);newPrec=PREC_BY[C.prec];}else precNote='这一份裁决的关键争点说理不够扎实，没有写入先例。重来一次，可以争取写进去。';}
  S.standing=TH.standing;S.rep+=rep;S.dust+=dust;S.focus=clamp(S.focus-20,0,100);
  (C.hist||[]).forEach(function(h){SAVE.seeHist(h);});
  save();checkAchs();
  if(id==='ch6'){await Ending.play();}
  await chapterResult(C,grade,{dust:dust,rep:rep,first:first,newPrec:newPrec,settled:settled,newLaw:newLaw,precNote:precNote});
  endTheater(true);
}
function chapterResult(C,grade,r){
  return new Promise(function(res){
    const card=byId('chapterCard');
    const nextId=CH_ORDER[CH_ORDER.indexOf(TH.ch)+1];
    card.className='layer on result dossier era-'+C.era;
    card.innerHTML='<div class="cr-in dz">'+
      '<div class="cr-k">'+C.num+' · '+C.year+'</div><div class="cr-t">'+C.title+'</div>'+
      '<div class="cr-grade"><span class="stamp">'+grade+'</span></div>'+
      '<div class="cr-rw">'+(r.rep?'<span class="chip">声望 +'+r.rep+'</span>':'')+'<span class="chip amber">星尘 +'+r.dust+'</span><span class="chip">精力 -20</span>'+(r.newLaw&&LAW_BY[r.newLaw]?'<span class="chip ok">法典新增：'+LAW_BY[r.newLaw].name+'</span>':'')+'</div>'+
      (r.newPrec?'<div class="cr-prec"><b>写入先例 · '+r.newPrec.name+'</b>'+r.newPrec.rule+'</div>':(r.settled?'<div class="cr-prec muted">和解结案，不形成先例。</div>':(r.precNote?'<div class="cr-prec muted">'+r.precNote+'</div>':'')))+
      '<hr><div class="cr-real"><div class="cr-rk">现实原型</div>'+fill(C.real)+'</div>'+
      (nextId&&r.first?'<div class="cr-next">星图上，<b>'+CHAPTERS[nextId].year+' · '+CHAPTERS[nextId].title+'</b> 已经亮起。</div>':'')+
      (!nextId&&r.first&&C.id==='ch6'?'<div class="cr-next">开庭剧场的最后一站，<b>尾声 · 回信台</b> 已经开放：这一次，写你自己想说的话。</div>':'')+
      '<button class="btn block dz-go" id="crOk">回到星图</button><i class="dz-c tl"></i><i class="dz-c tr"></i><i class="dz-c bl"></i><i class="dz-c br"></i></div>';
    byId('crOk').onclick=function(){SFX.tap();card.classList.remove('on');res();};
  });
}

/* ---------------- 终章：片尾 ---------------- */
const Ending={
  play(){
    return new Promise(function(res){
      const e=byId('ending');MUSIC.setMode('deep');
      const items=HISTORY.filter(function(h){return h.kind==='fact';}).slice(0);
      let h='<div class="en-scroll"><div class="en-top"><div class="en-y">1957</div><div class="en-l">一颗只会“嘀嘀”叫的金属球</div></div>';
      items.forEach(function(it){h+='<div class="en-row"><span>'+it.y+'</span><b>'+esc(it.t)+'</b></div>';});
      h+='<div class="en-row story"><span>2077</span><b>远音</b></div>';
      h+='<div class="en-reply"><div class="en-k">人类的第一句回答</div><div class="en-q">'+esc(S.reply||'')+'</div><div class="en-note">以光速走 41 年。如果有人听见并回答，回音最早在 2159 年前后到达。<br>那时候坐在这把椅子上的，会是另一个人。</div></div>';
      h+='<div class="en-fin"><div class="en-title">星海公约</div><div class="en-sig">thank you for listening</div><div class="en-cred">剧本 · 美术 · 音乐：程序生成与手写　｜　法律依据均为真实条约，案中国家与公司均为虚构</div><button class="btn" id="enOk">合上卷宗</button></div></div>';
      e.innerHTML=h;e.classList.add('on');
      const sc=e.querySelector('.en-scroll');sc.scrollTop=0;
      let y=0,stop=false;
      function roll(){if(stop)return;y+=.6;sc.scrollTop=y;if(y<sc.scrollHeight-sc.clientHeight-2)requestAnimationFrame(roll);}
      setTimeout(roll,1200);
      sc.addEventListener('pointerdown',function(){stop=true;},{once:true});
      byId('enOk').onclick=function(){SFX.tap();stop=true;e.classList.remove('on');res();};
    });
  }
};
