"use strict";
/* =====================================================================
   面板：档案馆（档案 / 法典 / 先例 / 史实 / 成就 / 小卖部 / 设置）、
   裁判练习、休憩舱、史实卡、形象设置
   ===================================================================== */
const Panels=(function(){
  let cur='',tab='me',benchCur=null,qz=null,qzT=0;
  function shell(title,body,tabs){
    const p=byId('panel');
    p.innerHTML='<div class="pn-sheet paper"><div class="pn-head"><button class="pn-back" id="pnBack">'+icon('ic-back')+'</button><h2>'+title+'</h2></div>'+
      (tabs?'<div class="pn-tabs">'+tabs+'</div>':'')+'<div class="pn-body">'+body+'</div></div>';
    p.classList.add('on');
    byId('pnBack').onclick=function(){SFX.tap();close();};
    $$('#panel [data-tab]').forEach(function(b){b.onclick=function(){SFX.tap();tab=b.getAttribute('data-tab');render();};});
  }
  function close(){stopQuizTimer();byId('panel').classList.remove('on');cur='';qz=null;Hub.refresh();}
  function render(){
    if(cur==='archive')archive();else if(cur==='bench')bench();else if(cur==='quiz')quiz();else if(cur==='relax')relax();
  }
  /* ---------------- 档案馆 ---------------- */
  const TABS=[['me','档案'],['laws','法典'],['precs','先例'],['hist','史实'],['achs','成就'],['shop','小卖部'],['set','设置']];
  function archive(){
    const tabs=TABS.map(function(t){return '<button data-tab="'+t[0]+'" class="'+(tab===t[0]?'on':'')+'">'+t[1]+'</button>';}).join('');
    let b='';
    if(tab==='me'){
      const done=CH_ORDER.filter(function(id){return SAVE.chDone(id);}).length;
      b+='<div class="me-card"><div class="me-av">'+portraitSVG('me')+'</div><div class="me-info"><div class="me-name">'+esc(S.profile.name)+'</div><div class="me-rank">'+rankOf(S.rep)+'</div>'+
        '<div class="me-bar"><i style="width:'+Math.min(100,(S.rep-rankFloor(S.rep))/Math.max(1,rankNext(S.rep)-rankFloor(S.rep))*100)+'%"></i></div><div class="muted small">声望 '+S.rep+' / 下一级 '+rankNext(S.rep)+'</div>'+
        '<button class="btn sm ghost" id="meEdit">修改形象</button></div></div>';
      b+='<div class="stat-row"><div><b>'+done+'/6</b><span>章节</span></div><div><b>'+S.precs.length+'</b><span>先例</span></div><div><b>'+S.laws.length+'/'+LAWS.length+'</b><span>法典</span></div><div><b>'+S.hist.length+'</b><span>史实卡</span></div></div>';
      b+='<h3>结案记录</h3>';
      b+=CH_ORDER.map(function(id){const C=CHAPTERS[id],r=S.ch[id];return '<div class="row-item"><span class="ri-y">'+C.year+'</span><span class="ri-t">'+C.title+'</span><span class="ri-r">'+(r?'<span class="stamp sm">'+esc(r.grade)+'</span>':'<span class="muted small">未开庭</span>')+'</span></div>';}).join('');
      const tags=(S.moralLog||[]).map(function(m){return '<span class="chip">'+esc(m.tag)+'</span>';}).join(' ');
      b+='<h3>你表过的态</h3>'+(tags||'<div class="muted small">还没有。每章结束前，带教律师会问你一个没有标准答案的问题。</div>');
      const top=leanTop();
      b+='<h3>裁判偏向</h3>'+leanChart()+(top?'<div class="small" style="margin-top:6px">偏向：<b style="color:'+top.c+'">'+top.n+'</b>。'+top.d+'</div>':'');
      const sats=(S.games.sat&&S.games.sat.list)||[];
      if(sats.length)b+='<h3>我的卫星</h3>'+sats.map(function(s){return '<div class="row-item"><span class="ri-t">「'+esc(s.name)+'」'+s.orb+' · '+s.mis+'</span><span class="ri-r">'+(s.reg?'<span class="chip ok">已登记</span>':'<span class="chip red">未登记</span>')+'</span></div>';}).join('');
      if(S.games.sling&&S.games.sling.record)b+='<h3>我的金唱片</h3><div class="small">'+S.games.sling.record.map(esc).join(' · ')+'</div>';
      if(S.reply)b+='<h3>人类的第一句回答</h3><div class="serif">“'+esc(S.reply)+'”</div>';
    }else if(tab==='laws'){
      b+='<div class="muted small">办一个案子，记一条法。没收进法典的条文，庭上也能引用，只是你只记得个大概。</div>';
      b+=LAWS.map(function(l){const on=S.laws.indexOf(l.id)>=0;return '<div class="law-card'+(on?'':' off')+'"><div class="lc-h"><b>'+l.name+'</b><span>'+l.src+'</span></div><div class="lc-t">'+(on?l.text:'还没收进法典。')+'</div>'+(on?'<div class="lc-s">管什么：'+l.scope+'</div>':'')+'</div>';}).join('');
      b+='<h3>术语表</h3><div class="muted small">剧情里带点状下划线的词都可以点。这里是全部术语。</div><div class="term-grid">'+Object.keys(GLOSSARY).map(function(k){const seen=S.terms.indexOf(k)>=0;return '<span class="term'+(seen?' seen':'')+'" data-term="'+esc(k)+'">'+esc(k)+'</span>';}).join('')+'</div>';
    }else if(tab==='precs'){
      b+='<div class="muted small">每一次以裁决结案，都会写下一条先例。和解结案不会。</div>';
      b+=PRECS.map(function(p){const on=S.precs.indexOf(p.id)>=0;return '<div class="law-card'+(on?'':' off')+'"><div class="lc-h"><b>'+(on?p.name:'？？？')+'</b><span>'+CHAPTERS[p.ch].year+'</span></div><div class="lc-t">'+(on?p.rule:'在第'+cnNum(CH_ORDER.indexOf(p.ch)+1)+'章以裁决结案后写入。')+'</div></div>';}).join('');
    }else if(tab==='hist'){
      b+='<div class="muted small">星图外圈航迹上的每个标记都是一张卡片。<span class="chip">史实</span><span class="chip amber">计划</span><span class="chip fact">推演</span><span class="chip red">游戏故事</span></div>';
      ERAS.forEach(function(E){
        b+='<h3>'+E.from+'—'+E.to+'　'+E.name+'</h3>';
        b+=HISTORY.filter(function(h){return h.y>=E.from&&h.y<=E.to;}).map(function(h){const seen=S.hist.indexOf(h.id)>=0;return '<button class="row-item hist-row'+(seen?'':' new')+'" data-hist="'+h.id+'"><span class="ri-y">'+h.y+'</span><span class="ri-t">'+esc(h.t)+'</span><span class="ri-r">'+kindChip(h.kind)+'</span></button>';}).join('');
      });
    }else if(tab==='achs'){
      b+='<div class="ach-grid">'+ACHS.map(function(a){const got=S.achs.indexOf(a.id)>=0;return '<div class="ach'+(got?' got':'')+'">'+icon('ic-star')+'<b>'+(got?a.name:'？？？')+'</b><span>'+a.desc+'</span></div>';}).join('')+'</div>';
    }else if(tab==='shop'){
      b+='<div class="shop-top"><span>星尘 <b>'+S.dust+'</b></span><span>提示卡 <b>'+S.hints+'</b></span><span>精力 <b>'+S.focus+'</b></span></div>';
      b+='<div class="muted small">星尘从支线和休憩舱里攒。这里只卖方便和好看，不卖输赢。</div>';
      b+=SHOP_ITEMS.map(function(it){return '<div class="shop-item"><div><b>'+it.name+'</b><div class="muted small">'+it.sub+'</div></div><button class="btn sm amber" data-buy="'+it.id+'">'+it.cost+' 星尘</button></div>';}).join('');
      if(MONETIZE.adsDemo)b+='<div class="shop-item"><div><b>看一段短片</b><div class="muted small">换一张提示卡（开发阶段为占位演示）</div></div><button class="btn sm ghost" id="shopAd">免费</button></div>';
      ['seal','paper'].forEach(function(kind){
        b+='<h3>'+(kind==='seal'?'裁决书印章':'裁决书纸样')+'</h3>';
        b+=COSMETICS[kind].map(function(c){const own=S.owned[kind].indexOf(c.id)>=0,eq=S.equip[kind]===c.id;
          return '<div class="shop-item cos"><span class="cos-prev '+c.css+'">'+(kind==='seal'?'印':'纸')+'</span><div><b>'+c.name+'</b><div class="muted small">'+c.d+'</div></div><button class="btn sm '+(eq?'green':own?'ghost':'amber')+'" data-cos="'+kind+':'+c.id+'"'+(eq?' disabled':'')+'>'+(eq?'使用中':own?'换上':c.cost+' 星尘')+'</button></div>';}).join('');
      });
    }else if(tab==='set'){
      b+='<div class="set-row"><span>音效</span><button class="btn sm ghost" id="stSnd">'+(S.sound?'开':'关')+'</button></div>';
      b+='<div class="set-row"><span>音乐</span><button class="btn sm ghost" id="stBgm">'+(S.bgm?'开':'关')+'</button></div>';
      b+='<div class="set-row"><span>文字速度</span><button class="btn sm ghost" id="stSpd">'+(S.textSpeed==='fast'?'快':'标准')+'</button></div>';
      b+='<div class="set-row"><span>开场影像</span><button class="btn sm ghost" id="stIntro">再看一遍</button></div>';
      b+='<h3>关于</h3><div class="small">真实的是法，虚构的是国。<br><i>The law is real. The nations are fictional.</i><br>游戏里引用的条约和史实都是真的；案件里的国家、公司和人物是虚构的。每章结尾的“现实原型”会说明哪些地方做了改动。</div>';
      b+='<h3>存档</h3><div class="btnrow"><button class="btn sm red" id="stReset">清空存档</button></div>';
    }
    shell('档案馆',b,tabs);
    const e=byId('meEdit');if(e)e.onclick=function(){SFX.tap();Avatar.open(false);};
    $$('#panel [data-buy]').forEach(function(x){x.onclick=function(){buyItem(x.getAttribute('data-buy'));};});
    $$('#panel [data-cos]').forEach(function(x){x.onclick=function(){const kv=x.getAttribute('data-cos').split(':');buyCos(kv[0],kv[1]);};});
    $$('#panel [data-hist]').forEach(function(x){x.onclick=function(){SFX.page();history(x.getAttribute('data-hist'));};});
    const ad=byId('shopAd');if(ad)ad.onclick=async function(){const ok=await ECON.rewarded('换一张提示卡');if(ok){S.hints++;save();HUD.refresh();toast('提示卡 +1');render();}};
    const sn=byId('stSnd');if(sn)sn.onclick=function(){toggleSound();render();};
    const bg=byId('stBgm');if(bg)bg.onclick=function(){toggleBgm();render();};
    const sp=byId('stSpd');if(sp)sp.onclick=function(){S.textSpeed=S.textSpeed==='fast'?'normal':'fast';save();SFX.tap();render();};
    const it=byId('stIntro');if(it)it.onclick=function(){close();Intro.play(true);};
    const rs=byId('stReset');if(rs)rs.onclick=function(){if(confirm('清空全部进度、星尘和成就？这一步不能撤销。')){SAVE.reset();location.reload();}};
  }
  function kindChip(k){return k==='fact'?'<span class="chip">史实</span>':k==='plan'?'<span class="chip amber">计划</span>':k==='spec'?'<span class="chip fact">推演</span>':'<span class="chip red">游戏故事</span>';}
  function leanChart(){
    const t=leanTally(),total=t.order+t.open+t.comm;
    if(!total)return '<div class="muted small">还没有记录。开庭、裁判练习里的取舍都会记在这里。</div>';
    return '<div class="lean">'+['order','open','comm'].map(function(k){const L=LEAN[k],v=t[k];return '<div class="lean-row"><span style="color:'+L.c+'">'+L.n+'</span><i><b style="width:'+(v/total*100)+'%;background:'+L.c+'"></b></i><em>'+v+'</em></div>';}).join('')+'</div>';
  }
  /* ---------------- 史实卡（弹窗） ---------------- */
  function history(id){
    const h=HIST_BY[id];if(!h)return;
    const first=SAVE.seeHist(id);
    if(first){S.dust+=2;save();HUD.refresh();}
    const m=byId('histCard');
    m.innerHTML='<div class="hc-in paper"><div class="hc-y">'+h.y+(h.m?'.'+String(h.m).padStart(2,'0'):'')+'</div>'+kindChip(h.kind)+'<h3>'+esc(h.t)+'</h3><div class="hc-d">'+fill(h.d)+'</div>'+
      (h.ch&&CHAPTERS[h.ch]?'<div class="hc-ch">对应 · '+CHAPTERS[h.ch].num+'「'+CHAPTERS[h.ch].title+'」</div>':'')+
      (first?'<div class="chip amber">读史 · 星尘 +2</div>':'')+'<button class="btn block" id="hcOk">合上</button></div>';
    m.classList.add('on');
    byId('hcOk').onclick=function(){SFX.tap();m.classList.remove('on');checkAchs();if(cur)render();};
  }
  /* ---------------- 裁判练习 ---------------- */
  function bench(){
    let b='';
    if(!benchCur){
      b+='<div class="muted small">五个已经结案的小案子，卷宗发给你来裁。<b>不打分</b>，三个选项都说得通，现行法只是其中一条路。你的选择会记成“裁判偏向”，第四章的对手会来翻。想考考条文本身，去旁边的“每日速判”。</div>';
      b+='<h3>你的偏向</h3>'+leanChart();
      b+='<h3>五个案子</h3>'+BENCH.map(function(p){const s=S.judge[p.id];const L=s?LEAN[p.lean[s.ch]]:null;return '<button class="row-item" data-bench="'+p.id+'"><span class="ri-t">'+p.title+'</span><span class="ri-r">'+(L?'<span class="chip" style="color:'+L.c+'">'+L.n+'</span>':'<span class="muted small">待裁</span>')+'</span></button>';}).join('');
    }else{
      const p=BENCH_BY[benchCur],s=S.judge[p.id];
      b+='<div class="bench-brief">'+fill(p.brief)+'</div>';
      const pick=s?s.ch:null;
      b+='<h3>你的裁决</h3>'+p.opts.map(function(o,i){return '<button class="bench-opt'+(pick===i?' on':'')+'" data-opt="'+i+'"><b>'+String.fromCharCode(65+i)+'</b>'+fill(o)+'</button>';}).join('');
      if(pick!=null){
        const L=LEAN[p.lean[pick]];
        b+='<div class="bench-res"><div><span class="chip" style="color:'+L.c+'">'+L.n+'</span>'+L.d+'</div><div class="br-after"><b>此后</b>'+p.after[pick]+'</div>'+
          '<div class="br-law"><b>现行法的立场</b>'+(pick===p.ans?'<span class="chip ok">和你一致</span>':'<span class="chip amber">和你不同</span>')+'<div>'+fill(p.why)+'</div></div></div>';
        b+='<div class="muted small">改主意了？再选一次就行，偏向会跟着变。</div>';
      }
      b+='<div class="btnrow"><button class="btn ghost" id="bnBack">回到列表</button></div>';
    }
    shell(benchCur?'裁判练习 · '+BENCH_BY[benchCur].title:'裁判练习',b);
    $$('#panel [data-bench]').forEach(function(x){x.onclick=function(){SFX.page();benchCur=x.getAttribute('data-bench');bench();};});
    $$('#panel [data-opt]').forEach(function(x){x.onclick=function(e){if(e.target.closest('.term'))return;answer(+x.getAttribute('data-opt'));};});
    const bb=byId('bnBack');if(bb)bb.onclick=function(){SFX.tap();benchCur=null;bench();};
  }
  function answer(i){
    const p=BENCH_BY[benchCur];
    const first=!S.judge[p.id];S.judge[p.id]={ch:i};
    if(first){S.rep+=p.rep;S.dust+=6;unlockLaw(p.law);SFX.gavel();}else SFX.card();
    save();checkAchs();HUD.refresh();bench();
  }
  /* ---------------- 每日速判 ----------------
     五句话判对错，每句限时；答完马上看依据。进度存档，中途退出再进来接着答，不能重来刷分。 */
  const QN=5,QT=20;
  function yesterdayKey(){const y=new Date(Date.now()-86400000);return y.getFullYear()+'-'+(y.getMonth()+1)+'-'+y.getDate();}
  function quizSet(seed){
    const R=rng(seed),pool=QUIZ.slice(),out=[],cnt={t:0,f:0};
    for(let i=pool.length-1;i>0;i--){const j=Math.floor(R()*(i+1)),t=pool[i];pool[i]=pool[j];pool[j]=t;}
    pool.forEach(function(q){if(out.length>=QN)return;const k=q.a?'t':'f';if(cnt[k]>=3)return;cnt[k]++;out.push(q.id);});
    return out;
  }
  function stopQuizTimer(){if(qzT){cancelAnimationFrame(qzT);qzT=0;}}
  function startQuiz(practice){
    const dk=todayKey();
    if(practice)qz={practice:true,ids:quizSet((Date.now()%100000)+11),i:0,res:[]};
    else{const pg=S.daily.prog;qz=(pg&&pg.d===dk)?{practice:false,ids:pg.ids,i:pg.res.length,res:pg.res.slice()}:{practice:false,ids:quizSet(dayHash()*7+13),i:0,res:[]};}
    SFX.page();qz.t0=performance.now();quiz();
  }
  function quizAnswer(v){
    if(!qz||qz.res[qz.i]!=null)return;stopQuizTimer();
    const q=QUIZ_BY[qz.ids[qz.i]],to=v==null,ok=!to&&v===q.a;
    qz.res[qz.i]={ok:ok,to:to};
    if(ok){SFX.ok();buzz(10);}else{SFX.error();buzz([30,30,30]);}
    if(!qz.practice){S.daily.prog={d:todayKey(),ids:qz.ids,res:qz.res.slice()};save();}
    quiz();
  }
  function quizNext(){if(!qz)return;SFX.page();qz.i++;qz.t0=performance.now();if(qz.i>=QN)quizFinish();else quiz();}
  function quizFinish(){
    const c=qz.res.filter(function(r){return r.ok;}).length;
    if(!qz.practice){
      const dk=todayKey();
      if(S.daily.last!==dk){
        S.daily.streak=(S.daily.last===yesterdayKey()?(S.daily.streak||0):0)+1;S.daily.last=dk;
        S.daily.score=c;S.daily.best=Math.max(S.daily.best||0,c);S.daily.ids=qz.ids;S.daily.res=qz.res.map(function(r){return r.ok?1:0;});delete S.daily.prog;
        const dust=c*2+(c===QN?4:0);S.dust+=dust;S.focus=clamp(S.focus+5,0,100);qz.dust=dust;
        save();checkAchs();HUD.refresh();SFX.gavel();if(dust)setTimeout(SFX.coin,250);
      }
    }else SFX.card();
    qz.done=true;quiz();
  }
  function quizRows(ids,res){
    return '<div class="qz-list">'+ids.map(function(id,i){const q=QUIZ_BY[id],ok=res[i]&&(res[i].ok||res[i]===1);
      return '<details class="qz-row"><summary><i class="'+(ok?'ok':'bad')+'">'+(ok?'✓':'✗')+'</i><span>'+fill(q.s)+'</span><em>'+(q.a?'对':'错')+'</em></summary><div class="qz-why">'+fill(q.why)+'</div></details>';}).join('')+'</div>';
  }
  function quiz(){
    stopQuizTimer();
    const dk=todayKey(),doneToday=S.daily.last===dk;
    let b='';
    if(!qz){
      b+='<div class="qz-intro"><div class="qz-k">DAILY · '+dk.replace(/-/g,'.')+'</div><div class="qz-lead">五句话，判对还是错。<br>每句 '+QT+' 秒，答完马上看依据。</div>'+
        '<div class="qz-stats"><div><b>'+(S.daily.streak||0)+'</b><span>连续天数</span></div><div><b>'+(doneToday&&S.daily.score!=null?S.daily.score+'/'+QN:'—')+'</b><span>今天</span></div><div><b>'+(S.daily.best!=null?S.daily.best+'/'+QN:'—')+'</b><span>最好成绩</span></div></div>';
      if(doneToday){
        b+=(S.daily.ids?'<h3>今天的五句</h3>'+quizRows(S.daily.ids,S.daily.res||[]):'')+'<div class="muted small">明天换一组新的。想多练几句，可以再来一组，不计奖励。</div><button class="btn ghost block" id="qzPrac">再练一组</button>';
      }else{
        const pg=S.daily.prog,mid=pg&&pg.d===dk&&pg.res.length;
        b+='<button class="btn red block" id="qzGo">'+(mid?'接着答（第 '+(pg.res.length+1)+' 句）':'开始')+'</button><div class="muted small">每答对一句得 2 星尘，全对再加 4；连续三天有成就。</div>';
      }
      b+='<div class="qz-note">和“五个小案子”不同：小案子没有标准答案，只记你的裁判偏向；这里每一句都有确定的答案，考的是条文本身。</div></div>';
      shell('每日速判',b);
      const g=byId('qzGo');if(g)g.onclick=function(){startQuiz(false);};
      const pr=byId('qzPrac');if(pr)pr.onclick=function(){startQuiz(true);};
      return;
    }
    const title=qz.practice?'每日速判 · 练习':'每日速判';
    const dots='<div class="qz-dots">'+qz.ids.map(function(_,i){const r=qz.res[i];return '<i class="'+(r?(r.ok?'ok':'bad'):i===qz.i&&!qz.done?'cur':'')+'"></i>';}).join('')+'</div>';
    if(qz.done){
      const c=qz.res.filter(function(r){return r.ok;}).length;
      b+='<div class="qz-top">'+dots+'</div><div class="qz-end"><div class="qz-score">'+c+'<small>/'+QN+'</small></div><div class="qz-end-t">'+(c===QN?'全部判对':c>=3?'判得不错':'再接再厉')+'</div>'+
        (qz.practice?'<div class="muted small">练习不计奖励。</div>':'<div class="gm-rw qz-rw">'+(qz.dust?'<span class="chip amber">星尘 +'+qz.dust+'</span>':'')+'<span class="chip ok">精力 +5</span><span class="chip">连续 '+(S.daily.streak||1)+' 天</span></div>')+'</div>';
      b+=quizRows(qz.ids,qz.res)+'<div class="btnrow"><button class="btn ghost" id="qzPrac">再练一组</button><button class="btn" id="qzClose">合上</button></div>';
      shell(title,b);
      byId('qzPrac').onclick=function(){startQuiz(true);};byId('qzClose').onclick=function(){SFX.tap();close();};
      return;
    }
    const q=QUIZ_BY[qz.ids[qz.i]],r=qz.res[qz.i];
    b+='<div class="qz-top">'+dots+'<div class="qz-time'+(r?' off':'')+'"><i id="qzBar"></i></div></div>';
    b+='<div class="qz-card'+(r?(r.ok?' ok':' bad'):'')+'" '+(r?'':'style="--qd:'+qz.i+'"')+'><div class="qz-no">第 '+(qz.i+1)+' 句 / 共 '+QN+' 句</div><div class="qz-s">'+fill(q.s)+'</div>';
    if(!r)b+='</div><div class="qz-btns"><button class="qz-b yes" data-qa="1"><b>对</b><small>← 或 1</small></button><button class="qz-b no" data-qa="0"><b>错</b><small>→ 或 2</small></button></div>';
    else b+='<div class="qz-verdict"><span class="stamp">'+(r.to?'超时':r.ok?'判对了':'判错了')+'</span><em>这句话是<b>'+(q.a?'对':'错')+'</b>的</em></div><div class="qz-why">'+fill(q.why)+'</div></div>'+
      '<button class="btn block qz-next" id="qzNext">'+(qz.i<QN-1?'下一句':'看结果')+'</button>';
    shell(title,b);
    $$('#panel [data-qa]').forEach(function(x){x.onclick=function(){quizAnswer(x.getAttribute('data-qa')==='1');};});
    const nx=byId('qzNext');if(nx)nx.onclick=quizNext;
    if(!r){
      const bar=byId('qzBar');
      const tick=function(){const left=1-(performance.now()-qz.t0)/1000/QT;if(left<=0){quizAnswer(null);return;}
        if(bar){bar.style.transform='scaleX('+left.toFixed(4)+')';bar.parentNode.classList.toggle('low',left<.25);}qzT=requestAnimationFrame(tick);};
      qzT=requestAnimationFrame(tick);
    }
  }
  /* 切到后台时倒计时暂停，回来接着算，不会一回来就超时 */
  document.addEventListener('visibilitychange',function(){
    if(!qz||qz.done)return;
    if(document.hidden)qz.hid=performance.now();else if(qz.hid){qz.t0+=performance.now()-qz.hid;qz.hid=0;}
  });
  addEventListener('keydown',function(e){
    if(cur!=='quiz'||!qz||qz.done)return;
    const r=qz.res[qz.i];
    if(!r&&(e.key==='ArrowLeft'||e.key==='1'||e.key==='y')){e.preventDefault();quizAnswer(true);}
    else if(!r&&(e.key==='ArrowRight'||e.key==='2'||e.key==='n')){e.preventDefault();quizAnswer(false);}
    else if(r&&(e.key==='Enter'||e.key===' ')){e.preventDefault();quizNext();}
  });
  /* ---------------- 休憩舱 ---------------- */
  function relax(){
    let b='<div class="rx-top"><div class="rx-focus"><span>精力</span><i><b style="width:'+S.focus+'%"></b></i><em>'+S.focus+'</em></div>'+
      '<div class="muted small">开庭会消耗精力。精力在 70 以上时开庭，气势多一格。这里的小游戏没有输赢，玩一局能恢复精力（每天前三局恢复得最多）。</div></div>';
    ['const','sweep','paint'].forEach(function(id){const G=GAMES[id],r=S.games[id];
      b+='<button class="rx-item" data-rx="'+id+'"><span class="rx-ic">'+icon(id==='const'?'ic-star':id==='sweep'?'ic-broom':'ic-orbit')+'</span><span><b>'+G.title+'</b><small>'+G.sub+'</small></span><em>'+(r&&G.badge?G.badge(r):'')+'</em></button>';});
    shell('休憩舱',b);
    $$('#panel [data-rx]').forEach(function(x){x.onclick=function(){SFX.tap();byId('panel').classList.remove('on');cur='';Games.open(x.getAttribute('data-rx'));};});
  }
  return {
    open(name,t){stopQuizTimer();cur=name;if(t)tab=t;if(name==='bench'){benchCur=null;}if(name==='quiz')qz=null;SFX.page();render();},
    refresh(){if(cur)render();},close:close,history:history
  };
})();

/* ---------------- 形象设置 ---------------- */
const Avatar=(function(){
  let draft=null,firstRun=false,onDone=null;
  function render(){
    const m=byId('avatar');
    const prev=draft;
    m.innerHTML='<div class="av-in paper"><div class="av-k">星海仲裁院 · 工牌</div>'+
      '<div class="av-main"><div class="av-prev" id="avPrev"></div><div class="av-opts">'+
      '<label>名字</label><input id="avName" maxlength="6" value="'+esc(prev.name)+'">'+
      '<label>肤色</label><div class="av-row">'+PORTRAIT.SKINS.map(function(s,i){return '<button class="sw'+(i===prev.skin?' on':'')+'" data-skin="'+i+'" style="background:'+s.skin+'"></button>';}).join('')+'</div>'+
      '<label>发型</label><div class="av-row wrap">'+PLAYER_HAIRS.map(function(h){return '<button class="chip-btn'+(h.id===prev.hair?' on':'')+'" data-hair="'+h.id+'">'+h.name+'</button>';}).join('')+'</div>'+
      '<label>正装</label><div class="av-row">'+SUIT_COLORS.map(function(c,i){return '<button class="sw'+(i===prev.suit?' on':'')+'" data-suit="'+i+'" style="background:'+c.suit+'"></button>';}).join('')+'</div>'+
      '</div></div><div class="av-note">星海仲裁院的人来自世界各地。你是什么样子，就是什么样子。</div>'+
      '<button class="btn block" id="avOk">'+(firstRun?'报到':'保存')+'</button></div>';
    preview();
    $$('#avatar [data-skin]').forEach(function(b){b.onclick=function(){draft.skin=+b.getAttribute('data-skin');SFX.pop();render();};});
    $$('#avatar [data-hair]').forEach(function(b){b.onclick=function(){draft.hair=b.getAttribute('data-hair');SFX.pop();render();};});
    $$('#avatar [data-suit]').forEach(function(b){b.onclick=function(){draft.suit=+b.getAttribute('data-suit');SFX.pop();render();};});
    byId('avName').oninput=function(){draft.name=this.value.trim()||'简';};
    byId('avOk').onclick=function(){
      Object.assign(S.profile,{name:(draft.name||'简').slice(0,6),skin:draft.skin,hair:draft.hair,suit:draft.suit,created:true});save();
      registerPortraits(true);SFX.stamp();HUD.refresh();m.classList.remove('on');Panels.refresh();if(onDone){const f=onDone;onDone=null;f();}
    };
  }
  function preview(){
    const keep=S.profile;S.profile=Object.assign({},keep,draft);
    registerPortraits(true);S.profile=keep;
    byId('avPrev').innerHTML=portraitSVG('me-smile');
  }
  return {open(first,cb){firstRun=!!first;onDone=cb||null;draft={name:S.profile.name,skin:S.profile.skin,hair:S.profile.hair,suit:S.profile.suit||0};byId('avatar').classList.add('on');render();}};
})();
