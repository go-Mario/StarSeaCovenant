"use strict";
/* =====================================================================
   秘书处：工时与调休（初版的“职场”玩法，搬进新版）
   - 2077 年 1 月 4 日（周一）报到，在星海仲裁院的重演室受训。
     一天从 09:00 开始，18:00 之后算加班；周末、休庭期里做的事全部算加班。
     加班攒够 8 小时，可以换一天调休；另有 5 天年假。
   - 春节全院休庭：1 月 23 日（除夕）到 30 日，共八天；1 月 17 日、31 日（都是周日）补班。
   - 精力就是星图上那条精力：开庭、熬夜会掉；喝咖啡、休憩舱、下班睡觉会回来。
     精力 70 以上开庭，气势多一格；调休或年假回来的第一庭同样如此。精力再低也照样能开庭。
   - 打卡下班：睡多久看你几点走；周末和休庭期顺延。熬过早上六点，就直接算第二天。
   - 秘书处来信：校稿、凌晨电话、必修课、下午茶、报销、转正谈话……一天最多一封，选完记入工时。
   空间站按协调世界时（UTC）作息。
   ===================================================================== */
const WORK_EPOCH=Date.UTC(2077,0,4);              /* 第 0 天：2077 年 1 月 4 日，周一，报到 */
const WK=['周日','周一','周二','周三','周四','周五','周六'];
const W_SPECIAL=(function(){
  const o={'2077-1-17':['补班','work'],'2077-1-31':['补班','work']};
  for(let d=23;d<=30;d++)o['2077-1-'+d]=[d===23?'除夕':'春节休庭','rest'];
  return o;
})();
const Work=(function(){
  const DAY=1440,START=540,END=1080,DAWN=360;
  function D(day){return new Date(WORK_EPOCH+day*86400000);}
  function dayType(day){
    const d=D(day),k=d.getUTCFullYear()+'-'+(d.getUTCMonth()+1)+'-'+d.getUTCDate(),wd=d.getUTCDay();
    if(W_SPECIAL[k])return {label:W_SPECIAL[k][0],work:W_SPECIAL[k][1]==='work',wd:wd,rest:W_SPECIAL[k][1]==='rest'};
    if(wd===0||wd===6)return {label:'周末',work:false,wd:wd};
    return {label:'工作日',work:true,wd:wd};
  }
  function dateStr(day){const d=D(day);return (d.getUTCMonth()+1)+'月'+d.getUTCDate()+'日';}
  function clock(min){const nd=min>=DAY;const m=((min%DAY)+DAY)%DAY;return (nd?'次日 ':'')+String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');}
  function hours(m){const h=m/60;return (Math.round(h*10)/10).toString().replace(/\.0$/,'')+' 小时';}
  function energyWord(e){return e>=75?'精神饱满':e>=50?'状态尚可':e>=25?'有些疲惫':'已经透支';}
  function init(){
    const def={day:0,min:START,ot:0,otAll:0,leave:5,year:2077,coffee:0,coffeeBlock:-1,week:[],lastWeek:null,seen:[],inbox:[],mail:null,
      rested:false,regular:false,hearings:0,worked:0,notes:[],compUsed:0,leaveUsed:0,makeupHearing:false,allNighter:0};
    if(!S.work||typeof S.work!=='object')S.work=def;
    Object.keys(def).forEach(function(k){if(S.work[k]===undefined)S.work[k]=def[k];});
    return S.work;
  }
  function setFocus(v){S.focus=clamp(Math.round(v),0,100);}

  /* 记一笔工时。18:00 以后、或者在非工作日做的，都算加班 */
  function spend(mins,cost,label,kind){
    const W=init(),t=dayType(W.day),a=W.min,b=W.min+mins;
    let reg=0;
    if(t.work)reg=Math.max(0,Math.min(b,END)-Math.max(a,START));
    const ot=Math.max(0,mins-reg);
    W.min=b;W.ot+=ot;W.otAll+=ot;W.worked+=mins;
    let drain=cost||0;
    if(b>22*60)drain+=Math.round(Math.min(mins,b-22*60)/30);/* 深夜干活更伤神 */
    if(drain)setFocus(S.focus-drain);
    W.week.push({d:W.day,k:kind||'',l:label||'',m:mins,ot:ot});
    if(W.week.length>60)W.week.shift();
    /* 熬过了早上六点：这一夜就算通宵，直接进入新的一天，不补觉 */
    while(W.min>=DAY+DAWN){
      const wk=Math.floor(W.day/7);
      W.day++;W.min-=DAY;W.coffee=0;W.allNighter++;
      if(Math.floor(W.day/7)!==wk)closeWeek();
      W.notes.push('舷窗外的地球又转到了日出这一面。你一夜没合眼，'+dateStr(W.day)+'，新的一天已经开始。');
    }
    save();hud();
    return {ot:ot,reg:reg};
  }
  /* 开庭前的状态：只给助力，不设门槛 */
  function hearingState(){
    const W=init();
    if(W.rested)return 'rested';
    if(S.focus>=70)return 'fresh';
    if(S.focus<25)return 'tired';
    return '';
  }
  function useRest(){const W=init();if(W.rested){W.rested=false;save();}}
  const STATE_LINE={
    rested:'陈岚：“调休回来，脸色都不一样了。今天这一庭，气势多一格。”',
    fresh:'陈岚：“看你今天精神不错。状态在线，气势多一格，别浪费了。”',
    tired:'陈岚：“昨晚又没睡吧？眼睛都是红的。撑过这一庭，回去好好歇一天，攒的调休该用了。”',
    '':'精力不足 70，本章没有额外气势。喝杯咖啡、去休憩舱坐坐，或者早点下班睡一觉。'
  };
  /* 庭审计入工时：三小时，不因下班而中止 */
  function afterHearing(C){
    const W=init();W.hearings++;
    if(dayType(W.day).label==='补班')W.makeupHearing=true;
    const r=spend(180,0,'开庭 · '+(C&&C.title?C.title:''),'hearing');
    W.notes.push(r.ot>0?('庭审三小时，其中 '+hours(r.ot)+'在下班之后，已存入调休。'):'庭审三小时，已记入本周工时。');
    save();
  }
  function flushNotes(){
    const W=init();if(!W.notes.length)return;
    const n=W.notes.shift();save();setTimeout(function(){toast(n,2600);},400);
    if(W.notes.length)setTimeout(tick,2900);/* 下一条也等回到星图再说，不在开庭时冒出来 */
  }
  function coffee(){
    const W=init();
    if(W.coffeeBlock===W.day){toast('咖啡机还在报修。今天喝茶。');SFX.tap();return false;}
    if(W.coffee>=3){toast('第四杯就算了，手已经在抖了。');SFX.tap();return false;}
    W.coffee++;
    spend(10,0,'茶水间','break');
    setFocus(S.focus+(W.coffee===3?5:10));save();hud();
    SFX.pop();
    toast(['一杯美式。舷窗外，地球刚转到日出。','第二杯。茶水间里有人在聊频轨协调会。','第三杯了。精力回来一点，心跳也快了一点。'][W.coffee-1]);
    return true;
  }
  /* 下班：睡多久看你几点走；周末与休庭期顺延 */
  function clockOut(opt){
    const W=init();opt=opt||{};
    const late=W.min,free=1920-late;/* 到次日 08:00 还有多少分钟 */
    const sleep=Math.max(240,Math.min(480,free-120));
    setFocus(S.focus+sleep/60*6.2);
    const fromWeek=Math.floor(W.day/7);
    W.day++;W.min=START;W.coffee=0;
    let restDays=0;
    if(!opt.weekendWork){while(!dayType(W.day).work){W.day++;restDays++;setFocus(S.focus+28);}}
    if(opt.skipOne){W.day++;restDays++;while(!dayType(W.day).work){W.day++;restDays++;}setFocus(100);W.rested=true;}
    if(Math.floor(W.day/7)!==fromWeek)closeWeek();
    const y=D(W.day).getUTCFullYear();if(y!==W.year){W.year=y;W.leave=5;W.notes.push('新的一年，年假重新算：5 天。');}
    pickMail();
    save();hud();
    return {late:late,rest:restDays};
  }
  function closeWeek(){
    const W=S.work;
    const tot=W.week.reduce(function(a,x){return a+x.m;},0),ot=W.week.reduce(function(a,x){return a+x.ot;},0);
    const hear=W.week.filter(function(x){return x.k==='hearing';}).length;
    W.lastWeek={tot:tot,ot:ot,hear:hear,end:W.day-1};
    W.week=[];
    if(tot)W.notes.push('上周工时 '+hours(tot)+'，加班 '+hours(ot)+'。工时单已归档到秘书处。');
  }
  function afterRest(){SFX.whoosh();checkAchs();refreshViews();}
  function askClockOut(){
    const W=init(),t=dayType(W.day),tm=dayType(W.day+1);
    const lateTxt=W.min>=1320?'已经 '+clock(W.min)+' 了。保安刚来过一次，说灯他帮你关。':(W.min<END&&t.work?'现在是 '+clock(W.min)+'，还没到下班时间。早走也行，今天的事做完了就好。':'现在是 '+clock(W.min)+'。');
    const opts=[{t:'打卡下班',d:tm.work?'明天 09:00 照常上班。':'明天'+(tm.rest?'休庭':tm.label)+'，好好歇着。',k:'out'}];
    if(!tm.work)opts.push({t:'明天来加班',d:'非工作日的工时全部计入调休。',k:'wk'});
    if(W.ot>=480&&tm.work)opts.push({t:'明天调休',d:'用掉 8 小时调休额度，明天不来。',k:'comp'});
    if(W.leave>0&&tm.work)opts.push({t:'明天请一天年假',d:'今年还剩 '+W.leave+' 天。',k:'leave'});
    opts.push({t:'再待一会儿',d:'',k:'stay'});
    memo({from:'考勤机',title:dateStr(W.day)+' '+WK[t.wd]+' · '+t.label,body:lateTxt,opts:opts},function(o){
      if(o.k==='stay')return '';
      if(o.k==='comp'){W.ot-=480;W.compUsed++;clockOut({skipOne:true});afterRest();return '陈岚批了你的调休单，只写了一句：<em>“去晒晒太阳。”</em>';}
      if(o.k==='leave'){W.leave--;W.leaveUsed++;clockOut({skipOne:true});afterRest();return '年假批下来了。你在站上的观景舱坐了一整天，什么卷宗都没碰。';}
      const r=clockOut({weekendWork:o.k==='wk'});SFX.whoosh();refreshViews();
      if(o.k==='wk')return '你定了个闹钟。明天的工时，全部算加班。';
      return r.rest?('下班。接下来 '+r.rest+' 天不用来，'+dateStr(W.day)+'再见。'):(r.late>=1320?'你走出秘书处的时候，走廊的灯已经只剩一半。':'打卡，下班。');
    });
  }
  function takeComp(){
    const W=init();
    if(W.ot<480){toast('调休额度还不到 8 小时。');SFX.tap();return;}
    memo({from:'人事处',title:'调休申请',body:'调休一天，从额度中扣除 8 小时。今天的工作到此为止，明天休息。',opts:[{t:'提交申请',k:'y'},{t:'再想想',k:'n'}]},function(o){
      if(o.k!=='y')return '';
      W.ot-=480;W.compUsed++;clockOut({skipOne:true});afterRest();
      return '陈岚批了你的调休单，只写了一句：<em>“去晒晒太阳。”</em>';
    });
  }
  function takeLeave(){
    const W=init();
    if(W.leave<=0){toast('今年的年假已经用完了。');SFX.tap();return;}
    memo({from:'人事处',title:'年假申请',body:'今年剩余年假 '+W.leave+' 天。年假不占用调休额度。',opts:[{t:'请一天',k:'y'},{t:'再想想',k:'n'}]},function(o){
      if(o.k!=='y')return '';
      W.leave--;W.leaveUsed++;clockOut({skipOne:true});afterRest();
      return '年假批下来了。你在站上的观景舱坐了一整天，看地球转了一圈。';
    });
  }

  /* ---------------- 秘书处来信 ---------------- */
  const MAIL=[
   {id:'recess',from:'秘书长办公室',title:'关于春节休庭的调休安排',when:function(W){return W.day>=1;},force:true,
    body:'经院务会研究决定：春节期间，<b>1 月 23 日（除夕）至 30 日全院休庭</b>，共八天。<b>1 月 17 日（周日）、31 日（周日）照常上班</b>。请各庭秘书据此调整开庭排期。',
    opts:[{t:'收到',res:'你在日历上把那两个周日圈了出来，又在旁边画了一个很小的哭脸。'}]},
   {id:'proofread',from:'第三庭 · 书记员 林晓',title:'能帮我校一份裁决书吗',when:function(W){return W.day>=2;},
    body:'三百一十二页，明早九点前要送达双方。我知道你手上也有案子……',
    opts:[{t:'帮。先把它看完',eff:{min:150,e:-12,rep:1},res:'你把手上的事放了放，花了两个半小时看完最后一页，揪出两处把“发射国”写成“登记国”的笔误。林晓说欠你一顿饭。'},
          {t:'婉拒，手上的卷宗要紧',res:'林晓说没关系。下午你在茶水间碰见她，她顶着黑眼圈冲你点了点头。'}]},
   {id:'lunar',from:'当事人热线 · 月面基地',title:'凌晨两点的电话',when:function(W){return W.day>=3;},
    body:'协调世界时 02:10。月面基地那边是早上，当事人想确认管辖权异议的提出期限。',
    opts:[{t:'接。把期限讲清楚',eff:{min:40,e:-8,rep:1},res:'你翻出仲裁规则，一条条念给对方听。挂断时，舷窗外的地球刚好转到日出。'},
          {t:'不接。工作时间再回',res:'第二天上午你回了邮件。对方说：“理解，你们那边是夜里。”'}]},
   {id:'coffee',from:'行政处',title:'茶水间咖啡机报修',when:function(W){return W.day>=2;},
    body:'咖啡机今日报修，预计明天恢复。茶包管够。',
    opts:[{t:'已阅',eff:{coffeeBlock:1},res:'今天只能喝茶了。'}]},
   {id:'training',from:'培训中心',title:'必修课：空间碎片减缓指南（2 学时）',when:function(W){return W.day>=4;},
    body:'本年度必修学时尚差 2 学时。课程可在工作时间完成，计入工时。',
    opts:[{t:'现在就去听',eff:{min:120,e:-6,rep:1},res:'讲师放了一段反卫星试验后的碎片云动画，全场安静了几秒。你在笔记本上写下：“任务结束，移出拥挤的轨道。”'},
          {t:'挂在后台，边听边干活',eff:{min:30,e:-2},res:'进度条走完了。你只记住讲师一共说了七次“审慎”。'}]},
   {id:'teatime',from:'秘书处',title:'周五下午茶',when:function(W){const t=dayType(W.day);return t.wd===5&&t.work;},
    body:'秘书处订了一盒绿豆糕，在三号会议室，先到先得。',
    opts:[{t:'去拿一块',eff:{min:15,e:8},res:'绿豆糕有点噎。你就着林晓泡的茶吃完了。'},
          {t:'不去了，手上有活',res:'等你忙完，会议室只剩一个空盒子，上面贴着便签：“给加班的人留了一块”，压在盒子底下。'}]},
   {id:'mentor',from:'陈岚',title:'一张便签',when:function(){return SAVE.chDone('ch1');},
    body:'“下一庭的卷宗我看过了。你主谈，我坐你旁边。别熬夜。”',
    opts:[{t:'好',eff:{e:5},res:'便签被你贴在了显示器边上。'}]},
   {id:'expense',from:'财务处',title:'差旅报销被退回',when:function(){return SAVE.chDone('ch1');},
    body:'冻土荒原现场取证的出租车票缺少单位抬头，请补正后重新提交。金额：一百二十星元。',
    opts:[{t:'补材料重交',eff:{min:30,e:-3},res:'你打了三个电话，终于拿到盖章的说明。财务说下周到账。'},
          {t:'算了，就当纪念',res:'你把那张车票夹进了笔记本。'}]},
   {id:'itu',from:'国际电联联络处',title:'频轨协调会议纪要待归档',when:function(W){return W.day>=6;},
    body:'附件为上周频轨协调会议纪要，共一百四十页，请于周五前归档。',
    opts:[{t:'今天就整理',eff:{min:90,e:-6,rep:1},res:'你给每一页编了索引。下次有人问“谁先申报”，三秒就能翻到。'},
          {t:'周五再说',res:'纪要躺在收件箱里，像一块没化的冰。'}]},
   {id:'spring',from:'行政处',title:'年货与值班',when:function(W){return W.day>=15&&W.day<19;},
    body:'休庭期间空间站照常运转，每个庭留一人值班一天，计加班。另：茶水间到了一箱春联，自取。',
    opts:[{t:'报名值班一天',eff:{duty:480,e:-4,rep:1},res:'你在排班表上写了自己的名字。值班那天，站里只剩下风扇的声音和一桌饺子。'},
          {t:'拿一副春联就走',res:'上联“星河万里皆有法”，下联“天涯此时共一春”。你把它贴在了宿舱门口。'}]},
   {id:'probation',from:'人事处',title:'试用期满 · 转正谈话',when:function(W){return W.day>=14&&!W.regular;},force:true,
    body:'陈岚在你的考核表上写了三行字，推过来让你签名。',
    opts:[{t:'签字',eff:{regular:1},res:'第一行：“卷宗读得细。”第二行：“开庭敢说话。”第三行：“下班之前，记得关灯。”你转正了。'}]},
   {id:'recessback',from:'秘书长办公室',title:'休庭结束 · 复工提醒',when:function(W){return W.day>=27;},force:true,
    body:'春节休庭已结束。今日（周日）为补班日，请按时到岗。积压的开庭排期请于本周内报送。',
    opts:[{t:'收到',res:'周日的空间站格外安静。你泡了杯咖啡，把八天的邮件一封一封点开。'}]},
   {id:'lantern',from:'食堂',title:'元宵节 · 今晚有汤圆',when:function(W){return W.day>=34;},
    body:'今晚食堂供应汤圆，芝麻、花生两种馅，六点开始，先到先得。',
    opts:[{t:'留下来吃一碗',eff:{min:30,e:6},res:'你挑了芝麻馅。窗外的地球上，有一大片灯火正亮着。'},
          {t:'早点回去',res:'回宿舱的路上，你闻到走廊里飘着一股桂花的甜味。'}]}
  ];
  function pickMail(){
    const W=S.work;
    if(W.mail)return;
    const pool=MAIL.filter(function(m){return W.seen.indexOf(m.id)<0&&m.when(W);});
    if(!pool.length)return;
    const forced=pool.filter(function(m){return m.force;});
    let pick=forced[0];
    if(!pick){const r=((W.day*2654435761)>>>0)%100;if(r<58)pick=pool[r%pool.length];}
    if(pick)W.mail=pick.id;
  }
  function popMail(){
    const W=init();
    if(!W.mail||memoOn())return false;
    const m=MAIL.find(function(x){return x.id===W.mail;});
    W.mail=null;
    if(!m){save();return false;}
    save();SFX.page();
    memo({from:m.from,title:m.title,body:m.body,opts:m.opts.map(function(o,i){return {t:o.t,k:i};})},function(o){
      const op=m.opts[o.k],ef=op.eff||{};
      if(W.seen.indexOf(m.id)<0)W.seen.push(m.id);
      if(ef.min)spend(ef.min,0,m.title,'mail');
      if(ef.duty){/* 休庭期值班一天：整天算加班 */W.ot+=ef.duty;W.otAll+=ef.duty;W.worked+=ef.duty;W.week.push({d:W.day,k:'duty',l:'春节值班（休庭期）',m:ef.duty,ot:ef.duty});}
      if(ef.e)setFocus(S.focus+ef.e);
      if(ef.rep)S.rep+=ef.rep;
      if(ef.coffeeBlock)W.coffeeBlock=W.day;
      if(ef.regular)W.regular=true;
      W.inbox.unshift({id:m.id,day:W.day,title:m.title,from:m.from,pick:op.t,res:op.res});
      if(W.inbox.length>20)W.inbox.pop();
      save();hud();checkAchs();refreshViews();
      return op.res+(ef.rep?'<span class="memo-gain">声望 +'+ef.rep+'</span>':'');
    });
    return true;
  }

  /* ---------------- 便笺：选完之后在同一张纸上写下结果 ---------------- */
  const Q=[];
  function memoOn(){const b=byId('memo');return !!(b&&b.classList.contains('on'));}
  function memo(m,onPick){
    const box=byId('memo'),card=byId('memoCard');
    if(memoOn()){Q.push([m,onPick]);return;}/* 一次只摊开一张便笺 */
    card.innerHTML='<div class="mm-from">'+m.from+'</div><div class="mm-title">'+m.title+'</div><div class="mm-body">'+m.body+'</div><div class="mm-opts"></div>';
    const ops=card.querySelector('.mm-opts');
    m.opts.forEach(function(o,i){
      const b=document.createElement('button');b.className='mm-opt';
      b.innerHTML='<kbd>'+(i+1)+'</kbd><span><b>'+o.t+'</b>'+(o.d?'<small>'+o.d+'</small>':'')+'</span>';
      b.onclick=function(){
        SFX.tap();
        const res=onPick?onPick(o):'';
        if(!res){closeMemo();return;}
        ops.innerHTML='<div class="mm-res">'+res+'</div><button class="mm-ok" id="memoOk">好</button>';
        byId('memoOk').onclick=function(){SFX.tap();closeMemo();};
      };
      ops.appendChild(b);
    });
    box.classList.add('on');
  }
  function closeMemo(){
    byId('memo').classList.remove('on');
    if(Q.length){const nx=Q.shift();setTimeout(function(){memo(nx[0],nx[1]);},250);return;}
    hud();refreshViews();
    setTimeout(tick,350);
  }
  /* 回到星图或秘书处时：有信先看信，没有就把攒下的提示一条条说完 */
  function blocked(){
    return memoOn()||(typeof TH!=='undefined'&&TH.running)||['game','pen','chapterCard','verdict','ending','intro','avatar','histCard'].some(function(id){const e=byId(id);return e&&e.classList.contains('on');})||
      !byId('hub').classList.contains('on')||!byId('boot').classList.contains('off');
  }
  function tick(){if(blocked())return;if(!popMail())flushNotes();}
  function refreshViews(){if(typeof Panels!=='undefined')Panels.refresh();if(typeof HUD!=='undefined')HUD.refresh();}

  /* ---------------- 星图上的工牌 ---------------- */
  function hud(){
    const W=init(),t=dayType(W.day);
    const c=byId('hudClock');
    if(c)c.innerHTML='<span class="hw-d">'+dateStr(W.day)+' </span>'+WK[t.wd]+(t.label!=='工作日'?'<em>'+(t.rest?'休庭':t.label)+'</em>':'')+' <b>'+clock(W.min)+'</b>'+
      (W.ot>=480?'<span class="hw-ot">可调休</span>':'');
  }

  /* ---------------- 秘书处页（在档案馆的面板里显示） ---------------- */
  function officeHTML(){
    const W=init(),t=dayType(W.day),e=S.focus,eCls=e>=50?'':(e>=25?' lo':' crit');
    let h='<div class="wk-today"><div class="wk-h"><b>今日</b><span>'+(W.regular?'正式仲裁秘书':'试用期')+' · 第 '+(W.day+1)+' 天</span></div>'+
      '<div class="wk-row"><div class="wk-date">'+dateStr(W.day)+'<small>'+WK[t.wd]+' · '+t.label+'</small></div>'+
      '<div class="wk-clock">'+clock(W.min)+'<small>协调世界时</small></div></div>'+
      '<div class="wk-energy"><span>精力</span><span class="wk-e'+eCls+'"><i style="width:'+e+'%"></i></span><b>'+e+'</b><em>'+energyWord(e)+'</em></div>'+
      '<div class="small muted">精力 70 以上开庭，气势多一格；调休或年假回来的第一庭同样如此。精力再低也照样能开庭，只是没人替你多撑一格。</div>'+
      '<div class="btnrow"><button class="btn wk-btn" data-w="coffee"><span>冲杯咖啡</span><small>茶水间 · '+(W.coffeeBlock===W.day?'咖啡机报修中':('今日 '+W.coffee+'/3'))+'</small></button><button class="btn ghost wk-btn" data-w="out"><span>打卡下班</span><small>'+(W.min>=END||!t.work?'今天辛苦了':'还没到 18:00')+'</small></button></div></div>';
    h+='<h3>调休与假期<small>人事处</small></h3>'+
      '<div class="stat-row wk-stats"><div><b'+(W.ot>=480?' class="ok"':'')+'>'+(Math.round(W.ot/6)/10)+'<small>时</small></b><span>调休额度</span></div><div><b>'+W.leave+'<small>天</small></b><span>剩余年假</span></div>'+
      '<div><b>'+(Math.round(W.otAll/6)/10)+'<small>时</small></b><span>累计加班</span></div><div><b>'+W.hearings+'<small>次</small></b><span>出庭</span></div></div>'+
      '<div class="small muted wk-note">18:00 之后、周末与休庭期里做的事，全部算加班；攒满 8 小时可以换一天调休。庭审不会因为下班而停下，超过 18:00 的那部分照样算。</div>'+
      '<div class="btnrow"><button class="btn ghost" data-w="comp"'+(W.ot<480?' disabled':'')+'>申请调休一天</button><button class="btn ghost" data-w="leave"'+(W.leave<=0?' disabled':'')+'>请一天年假</button></div>';
    /* 值班表：本周七天，周一开头 */
    const ws=W.day-((t.wd+6)%7);
    h+='<h3>值班表<small>本周</small></h3><div class="roster">';
    for(let i=0;i<7;i++){const d=ws+i,tt=dayType(d);
      h+='<div class="rd'+(d===W.day?' now':'')+(tt.work?'':' off')+(tt.label==='补班'?' make':'')+(tt.rest?' rest':'')+'"><b>'+WK[tt.wd].slice(1)+'</b><span>'+D(d).getUTCDate()+'</span><em>'+(tt.label==='工作日'?'班':tt.label==='周末'?'休':tt.label==='补班'?'补班':tt.label==='除夕'?'除夕':'休庭')+'</em></div>';}
    h+='</div>';
    /* 工时单 */
    const tot=W.week.reduce(function(a,x){return a+x.m;},0);
    h+='<h3>本周工时单<small>'+hours(tot)+'</small></h3>';
    if(!W.week.length)h+='<div class="small muted">本周还没有记录。开一庭、裁一个小案子、校一份裁决书，都会记在这里。</div>';
    else h+='<table class="wk-tab"><tr><th>日期</th><th>事项</th><th>用时</th><th>加班</th></tr>'+W.week.slice(-12).map(function(x){return '<tr><td>'+dateStr(x.d)+'</td><td>'+esc(x.l)+'</td><td>'+hours(x.m)+'</td><td>'+(x.ot?hours(x.ot):'—')+'</td></tr>';}).join('')+'</table>';
    if(W.lastWeek)h+='<div class="small muted" style="margin-top:8px">上周：共 '+hours(W.lastWeek.tot)+'，其中加班 '+hours(W.lastWeek.ot)+'，出庭 '+W.lastWeek.hear+' 次。</div>';
    if(W.inbox.length){
      h+='<h3>收件箱<small>已处理 '+W.inbox.length+' 封</small></h3>';
      h+=W.inbox.slice(0,6).map(function(x){return '<div class="mail-item"><div class="mi-h"><b>'+x.title+'</b><span>'+x.from+' · '+dateStr(x.day)+'</span></div><div class="mi-r">你的处理：'+x.pick+'</div></div>';}).join('');
    }
    return h;
  }
  function bindOffice(root){
    $$('[data-w]',root).forEach(function(b){b.onclick=function(){
      const k=b.getAttribute('data-w');
      if(k==='coffee'){if(coffee())refreshViews();}
      else if(k==='out'){SFX.tap();askClockOut();}
      else if(k==='comp')takeComp();
      else if(k==='leave')takeLeave();
    };});
  }
  return {init:init,spend:spend,hearingState:hearingState,useRest:useRest,stateLine:function(k){return STATE_LINE[k||''];},
    afterHearing:afterHearing,coffee:coffee,clockOut:clockOut,askClockOut:askClockOut,takeComp:takeComp,takeLeave:takeLeave,
    tick:tick,hud:hud,memoOn:memoOn,closeMemo:closeMemo,officeHTML:officeHTML,bindOffice:bindOffice,
    dayType:dayType,dateStr:dateStr,clock:clock,hours:hours,today:function(){return init().day;},MAIL:MAIL};
})();
