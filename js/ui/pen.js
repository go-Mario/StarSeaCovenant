"use strict";
/* =====================================================================
   尾声 · 回信台（自由书写）。第六章结束后，在“开庭剧场”的最后一站开放。
   没有标准答案，不打分。三种写法：
   - 写给远音：第六章那个 41 光年外的信号。上一次你只替人类选了第一句，这一次整封信由你来写。
     发出时，信里的字会被编成一张阿雷西博式的点阵图，再射向星空。
   - 写给一百年后：封进时间胶囊，2177 年开启。
   - 起草一条公约：选一个题目，写一条你自己的“星海公约”。写完对照现实中的条文，
     再看看这一条写清了“谁、做什么、做不到怎么办”没有（只是提示，不是打分）。
   写下的东西只存在这台设备上（S.pen）。如果以后要做公开的“信件墙”，必须先接内容安全审核，见 DESIGN.md。
   ===================================================================== */
const PEN_MODES={
  far:{t:'写给远音',k:'回 信',to:'SX-4127「远音」· 约 41 光年外',send:'发出',
    sub:'第六章里，你替人类选了第一句话。这一次，整封信由你来写。',
    ph:'想对 41 光年外的那一方说什么？',
    seeds:['你好。','我们收到了你们的信号。','我们住在一颗有海洋的行星上。','我们还在学着彼此相处，','如果你们也在看星星，','先说说我们是谁：'],
    done:'已经发出。以光速走 41 年，2118 年前后到达。'},
  future:{t:'写给一百年后',k:'时间胶囊',to:'2177 年的地球人',send:'封存',
    sub:'写给还没有出生的人。胶囊封存一百年，2177 年开启。',
    ph:'想告诉一百年后的人什么？',
    seeds:['你们那时候，','月亮上有人住了吗？','我们这一代人努力做对的一件事，是','对不起，我们没来得及','请替我们去看看','今天的天上，'],
    done:'已经封存。2177 年开启。'}
};
/* 起草公约的题目，以及现实中对应的规定（法条是真实的，措辞按原意转述） */
const PEN_TOPICS=[
 {id:'fall',t:'天上掉下来的东西',law:'《责任公约》第二条',seed:'空间物体坠落造成地面损害的，',
  real:'发射国对其空间物体在地球表面、或对飞行中的飞机造成的损害，负赔偿的绝对责任，不问有没有过错。'},
 {id:'crash',t:'轨道上的碰撞',law:'《责任公约》第三条',seed:'两个航天器可能相撞时，',
  real:'在地球表面以外，一国的空间物体损害另一国的空间物体，只有在有过错时才负责任。'},
 {id:'debris',t:'太空垃圾',law:'《空间碎片减缓准则》（2007）',seed:'任务结束的卫星，',
  real:'联合国大会 2007 年认可的这份准则建议：正常运行时尽量不释放碎片，避免在轨解体，不要故意摧毁航天器，任务结束后把航天器移出拥挤的轨道。它不是条约，靠各国自愿遵守。'},
 {id:'own',t:'月球和资源',law:'《外空条约》第二条',seed:'在月球上开采资源的，',
  real:'月球和其他天体不得通过主权要求、使用、占领或其他任何方式据为己有。挖出来的资源归谁，各国看法不一：《月球协定》称之为“全人类的共同继承财产”，但主要航天国家都没有加入。'},
 {id:'peace',t:'和平与武器',law:'《外空条约》第四条',seed:'任何国家不得',
  real:'不得在绕地球轨道放置核武器或其他大规模毁灭性武器；月球和其他天体专用于和平目的，禁止建立军事基地、试验武器和举行军事演习。'},
 {id:'rescue',t:'救援与归还',law:'《营救协定》（1968）',seed:'航天员遇险时，',
  real:'航天员遇到意外、遇险或紧急降落时，缔约国应立即通知发射当局和联合国秘书长，尽力营救，并把航天员安全、迅速地送回。'},
 {id:'signal',t:'回应地外信号',law:'《后探测原则宣言》（1989）',seed:'收到来自地外的信号后，',
  real:'现实中没有关于这件事的条约。国际宇航科学院等机构 1989 年通过的这份宣言建议：在进行适当的国际协商之前，不要回应。'},
 {id:'future',t:'为后人着想',law:'《子孙后代问题宣言》（2024）',seed:'今天的太空活动，',
  real:'2024 年联合国大会通过的这份宣言里，各国承诺在今天作决定时，考虑子孙后代的需要和利益。'},
 {id:'free',t:'别的事',law:'',seed:'',
  real:'这件事现实中可能还没有专门的条文。很多太空规则，最早都是有人先写出来，再慢慢变成各国认可的约定。'}
];
const PEN_TOPIC_BY={};PEN_TOPICS.forEach(function(t){PEN_TOPIC_BY[t.id]=t;});

const Pen=(function(){
  const MAXL=140,MAXA=120,KEEP_L=50,KEEP_A=30;
  let view='home',mode='',topic='',cur=null,armed='',anim=0,drafts={};
  function P(){if(!S.pen)S.pen={letters:[],arts:[]};return S.pen;}
  function unlocked(){return SAVE.chDone('ch6');}
  function dateStr(t){const d=new Date(t||Date.now());return d.getFullYear()+' 年 '+(d.getMonth()+1)+' 月 '+d.getDate()+' 日';}
  /* 条文编号：一、十一、二十、二十一…… */
  function artNo(n){const D=['零','一','二','三','四','五','六','七','八','九'];if(n<=10)return cnNum(n);if(n<20)return '十'+(n%10?D[n%10]:'');return D[Math.floor(n/10)]+'十'+(n%10?D[n%10]:'');}
  function layer(){return byId('pen');}
  function set(h){
    cancelAnimationFrame(anim);
    const L=layer();L.innerHTML='<div class="pe-sky"></div><div class="pe-scroll"><div class="pe-wrap">'+h+'</div></div>';
    L.querySelector('.pe-scroll').scrollTop=0;
    const b=byId('peBack');if(b)b.onclick=function(){SFX.tap();back();};
  }
  function head(kicker,title,line){
    return '<div class="pe-head"><button class="pe-back" id="peBack" aria-label="返回">'+icon('ic-back')+'</button>'+
      '<div class="pe-t"><span>'+kicker+'</span><b>'+title+'</b>'+(line?'<em>'+line+'</em>':'')+'</div></div>';
  }
  /* 三种写法的小图标：信号波、时间胶囊、卷轴 */
  const EMB={
    far:'<svg viewBox="0 0 48 48"><circle cx="14" cy="34" r="3.2" fill="currentColor"/><path d="M14 34 L30 14" stroke="currentColor" stroke-width="2" fill="none"/><path d="M24 22a10 10 0 0 1 8 8M26 16a16 16 0 0 1 12 12M28 10a22 22 0 0 1 16 16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/><path d="M6 42h22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    future:'<svg viewBox="0 0 48 48"><rect x="15" y="6" width="18" height="36" rx="9" stroke="currentColor" stroke-width="2" fill="none"/><path d="M15 20h18M15 28h18" stroke="currentColor" stroke-width="2"/><circle cx="24" cy="24" r="2.4" fill="currentColor"/><path d="M8 42h32" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    law:'<svg viewBox="0 0 48 48"><path d="M12 8h22a4 4 0 0 1 4 4v28H16a4 4 0 0 1-4-4z" stroke="currentColor" stroke-width="2" fill="none"/><path d="M18 16h14M18 22h14M18 28h9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="33" cy="34" r="5" fill="currentColor" opacity=".85"/></svg>'
  };

  /* ---------------- 首页 ---------------- */
  function home(){
    view='home';
    const p=P(),n=p.letters.length,a=p.arts.length;
    let h=head('尾声 · 2077','回信台','主线结束了。这里没有标准答案，也没有人替你写。');
    h+='<div class="pe-modes">'+
      '<button class="pe-mode m-far" data-m="far"><i class="pe-em">'+EMB.far+'</i><b>写给远音</b><span>41 光年外的信号，回一封你自己写的信</span></button>'+
      '<button class="pe-mode m-future" data-m="future"><i class="pe-em">'+EMB.future+'</i><b>写给一百年后</b><span>封进时间胶囊，2177 年开启</span></button>'+
      '<button class="pe-mode m-law" data-m="law"><i class="pe-em">'+EMB.law+'</i><b>起草一条公约</b><span>写一条你自己的“星海公约”，再对照现实</span></button>'+
    '</div>';
    h+='<div class="pe-box"><h3>信匣<small>只存在这台设备上</small></h3>';
    if(a)h+='<button class="pe-row doc" data-open="doc"><span class="pr-k">公约</span><span class="pr-t">我的星海公约 · 共 '+a+' 条</span><span class="pr-d">'+icon('ic-law')+'</span></button>';
    p.letters.forEach(function(l){
      h+='<button class="pe-row" data-open="'+l.id+'"><span class="pr-k k-'+l.m+'">'+(l.m==='far'?'远音':'胶囊')+'</span><span class="pr-t">'+esc(l.text.replace(/\s+/g,' ').slice(0,22))+(l.text.length>22?'……':'')+'</span><span class="pr-d">'+esc(l.date.replace(/ 年 /,'.').replace(/ 月 /,'.').replace(/ 日/,''))+'</span></button>';
    });
    if(!n&&!a)h+='<div class="pe-empty">还没有。写好的信和条文都会收在这里。</div>';
    h+='</div>';
    set(h);
    $$('#pen [data-m]').forEach(function(b){b.onclick=function(){SFX.card();const m=b.getAttribute('data-m');if(m==='law')topics();else compose(m);};});
    $$('#pen [data-open]').forEach(function(b){b.onclick=function(){SFX.page();const id=b.getAttribute('data-open');if(id==='doc')doc();else letter(id);};});
  }

  /* ---------------- 写信 ---------------- */
  function compose(m){
    view='compose';mode=m;const M=PEN_MODES[m],d=drafts[m]||{text:'',sign:S.profile.name};
    let h=head(M.k,M.t,M.sub);
    h+='<div class="pe-sheet paper">'+
      '<div class="pe-to">致　<b>'+M.to+'</b></div>'+
      '<textarea id="peText" class="pe-ta" maxlength="'+MAXL+'" placeholder="'+M.ph+'">'+esc(d.text)+'</textarea>'+
      '<div class="pe-meta"><span class="pe-seedk">不知道怎么开头？点一句接着写：</span><span id="peCnt" class="pe-cnt"></span></div>'+
      '<div class="pe-seeds">'+M.seeds.map(function(s,i){return '<button class="pe-seed" data-s="'+i+'">'+esc(s)+'</button>';}).join('')+'</div>'+
      '<label class="pe-sign">署名<input id="peSign" maxlength="12" value="'+esc(d.sign)+'" autocomplete="off"></label>'+
    '</div>'+
    '<div class="btnrow pe-acts"><button class="btn" id="peSend">'+icon(m==='far'?'ic-bolt':'ic-archive')+M.send+'</button></div>';
    set(h);
    const ta=byId('peText'),cnt=byId('peCnt'),sg=byId('peSign');
    const upd=function(){cnt.textContent=ta.value.length+' / '+MAXL;drafts[m]={text:ta.value,sign:sg.value};};
    ta.oninput=upd;sg.oninput=upd;upd();
    $$('#pen .pe-seed').forEach(function(b){b.onclick=function(){
      SFX.tap();const s=M.seeds[+b.getAttribute('data-s')];
      const a=ta.selectionStart==null?ta.value.length:ta.selectionStart,z=ta.selectionEnd==null?a:ta.selectionEnd;
      ta.value=(ta.value.slice(0,a)+s+ta.value.slice(z)).slice(0,MAXL);
      const at=Math.min(MAXL,a+s.length);try{ta.setSelectionRange(at,at);}catch(e){}
      ta.focus();upd();
    };});
    byId('peSend').onclick=function(){
      const text=ta.value.trim();
      if(text.replace(/\s/g,'').length<4){SFX.error();toast('多写几个字吧。');ta.focus();return;}
      const L={id:'L'+Date.now().toString(36),m:m,to:M.to,text:text,sign:(sg.value.trim()||S.profile.name).slice(0,12),date:dateStr()};
      const p=P();p.letters.unshift(L);if(p.letters.length>KEEP_L)p.letters.length=KEEP_L;
      delete drafts[m];save();checkAchs();
      if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
      send(L);
    };
  }

  /* ---------------- 发出 / 封存 ---------------- */
  function send(L){
    view='send';cur=L;
    const M=PEN_MODES[L.m];
    let h='<div class="pe-send">';
    if(L.m==='far')h+='<canvas id="peCv" class="pe-cv"></canvas>';
    else h+='<div class="pe-env"><div class="pe-env-b"></div><div class="pe-mini paper">'+esc(L.text.slice(0,60))+(L.text.length>60?'……':'')+'<i>'+esc(L.sign)+'</i></div><div class="pe-env-f"></div><div class="pe-env-flap"></div><div class="pe-seal">2177</div></div>';
    h+='<div class="pe-sendtx" id="peSendTx"></div>'+
      '<div class="btnrow pe-after" id="peAfter"><button class="btn ghost" id="peImg">'+icon('ic-down')+'存成图片</button><button class="btn" id="peHome">回到回信台</button></div></div>';
    set(h);
    byId('peImg').onclick=function(){SFX.tap();saveImage(letterCard(L),'星海公约-'+(L.m==='far'?'写给远音':'写给一百年后')+'.png');};
    byId('peHome').onclick=function(){SFX.tap();home();};
    const fin=function(){const t=byId('peSendTx');if(!t)return;t.innerHTML='<b>'+M.done+'</b><span>收在信匣里了，随时可以再读。</span>';t.classList.add('on');byId('peAfter').classList.add('on');};
    if(L.m==='far'){SFX.radio();beam(byId('peCv'),L,fin);}
    else{
      const env=layer().querySelector('.pe-env');requestAnimationFrame(function(){env.classList.add('go');});
      setTimeout(function(){if(view==='send'&&cur===L){SFX.stamp();buzz(20);}},1500);
      setTimeout(function(){if(view==='send'&&cur===L)fin();},2100);
    }
  }
  /* 把信编成点阵：上面一排是 1 到 10 的二进制（向阿雷西博信息致意），中间是信的内容，
     最下面是太阳系（第三颗行星抬高一格，上面站着一个人）和一面天线 */
  const PAL={w:'#EEF2F8',p:'#B489FF',g:'#55D6A0',b:'#6DB3FF',r:'#FF7766',y:'#F6C35B',v:'#9D86FF'};
  function grid(text){
    const C=23,rows=[],blank=function(){return new Array(C).fill(0);};
    for(let r=0;r<4;r++){const row=blank();for(let n=1;n<=10;n++)row[1+(n-1)*2]=((n>>(3-r))&1)?'w':0;rows.push(row);}
    const mk=blank();for(let n=1;n<=10;n++)mk[1+(n-1)*2]='w';rows.push(mk);rows.push(blank());
    const bits=[];for(const ch of text){const c=ch.codePointAt(0),n=c>0xFFFF?21:16;for(let i=n-1;i>=0;i--)bits.push((c>>i)&1);}
    const band=['p','g','b'];
    for(let i=0;i<bits.length;i+=C){const row=blank(),col=band[Math.floor(i/C/3)%3];for(let k=0;k<C&&i+k<bits.length;k++)row[k]=bits[i+k]?col:0;rows.push(row);}
    rows.push(blank());
    const man=[[0,1,0],[1,1,1],[0,1,0],[1,0,1]];
    man.forEach(function(m){const row=blank();m.forEach(function(v,k){if(v)row[9+k]='r';});rows.push(row);});
    const up=blank(),sys=blank();
    const sun=[blank(),blank(),blank()];/* 太阳 3×3，第三颗行星（地球）抬高一格 */for(let r=0;r<3;r++)for(let k=0;k<3;k++)sun[r][k]='y';
    const PL=[5,7,10,12,14,16,18,20,22];
    PL.forEach(function(x,i){if(i===2)up[x]='b';else sys[x]='y';});
    sun[0]=sun[0].map(function(v,k){return v||up[k];});sun[1]=sun[1].map(function(v,k){return v||sys[k];});
    sun.forEach(function(r){rows.push(r);});
    rows.push(blank());
    /* 天线：上面悬着馈源，下面是一口朝上的锅 */
    const dish=[[11],[],[5,17],[6,16],[7,8,14,15],[9,10,11,12,13]];
    dish.forEach(function(d){const row=blank();d.forEach(function(c){row[c]='v';});rows.push(row);});
    return rows;
  }
  function beam(cv,L,fin){
    /* 画布留出下面一行字和两个按钮的位置，发完不用往下翻 */
    const box=cv.parentNode,D=Math.min(devicePixelRatio||1,2),W=box.clientWidth,H=Math.max(200,Math.min(560,innerHeight-290));
    cv.width=Math.round(W*D);cv.height=Math.round(H*D);cv.style.height=H+'px';
    const g=cv.getContext('2d');g.setTransform(D,0,0,D,0,0);
    const rows=grid(L.text),C=23,cell=Math.max(2,Math.min(Math.floor((W*.42)/C),Math.floor((H*.86)/rows.length))),gw=C*cell,gh=rows.length*cell,x0=(W-gw)/2,y0=(H-gh)/2+8;
    const R=rng(L.text.length*31+7),stars=[];for(let i=0;i<120;i++)stars.push([R()*W,R()*H,R()*1.2+.3,R()]);
    const t0=performance.now(),T1=2400,T2=3000,T3=4300;let said=false,whoosh=false;
    const step=function(now){
      if(!cv.isConnected)return;
      const t=now-t0;g.clearRect(0,0,W,H);
      stars.forEach(function(s){g.fillStyle='rgba(225,235,255,'+(.25+.5*Math.abs(Math.sin(t/900+s[3]*6))).toFixed(2)+')';g.fillRect(s[0],s[1],s[2],s[2]);});
      const shown=Math.min(rows.length,Math.floor(rows.length*Math.min(1,t/T1)));
      let k=1,dx=0,dy=0;
      if(t>T2){const q=Math.min(1,(t-T2)/(T3-T2)),e=q*q*(3-2*q);k=1-e*.94;dy=-(y0+gh/2-30)*e;}
      if(k>.08){
        g.save();g.translate(W/2+dx,y0+gh/2+dy);g.scale(k,k);g.translate(-gw/2,-gh/2);
        for(let r=0;r<shown;r++){const row=rows[r];for(let c=0;c<C;c++)if(row[c]){g.fillStyle=PAL[row[c]];g.fillRect(c*cell,r*cell,cell-(cell>3?1:0),cell-(cell>3?1:0));}}
        if(t<T1){g.fillStyle='rgba(120,190,255,.55)';g.fillRect(-6,shown*cell,gw+12,2);}
        g.restore();
      }
      if(t>T2){
        if(!whoosh){whoosh=true;SFX.whoosh();}
        const q=Math.min(1,(t-T2)/(T3-T2)),cy=y0+gh/2+dy;
        const gr=g.createLinearGradient(0,cy,0,0);gr.addColorStop(0,'rgba(120,190,255,'+(.5*q).toFixed(2)+')');gr.addColorStop(1,'rgba(120,190,255,0)');
        g.fillStyle=gr;g.fillRect(W/2-1.5,0,3,cy);
        g.fillStyle='rgba(235,245,255,'+(.4+.6*q).toFixed(2)+')';g.beginPath();g.arc(W/2,cy,2.5+3*(1-k),0,Math.PI*2);g.fill();
      }
      if(t>T3&&!said){said=true;fin();}
      anim=requestAnimationFrame(step);
    };
    anim=requestAnimationFrame(step);
  }

  /* ---------------- 读一封信 ---------------- */
  function letter(id){
    const L=P().letters.find(function(l){return l.id===id;});if(!L){home();return;}
    view='letter';cur=L;armed='';
    const M=PEN_MODES[L.m]||PEN_MODES.far;
    let h=head(M.k,M.t,'');
    h+='<div class="pe-sheet paper pe-read"><div class="pe-to">致　<b>'+esc(L.to)+'</b></div>'+
      '<div class="pe-body">'+esc(L.text).replace(/\n/g,'<br>')+'</div>'+
      '<div class="pe-foot"><span>'+esc(L.sign)+'</span><span>'+esc(L.date)+'</span></div>'+
      (L.m==='future'?'<div class="pe-stamp">2177 年开启</div>':'<div class="pe-stamp blue">已发出 · 2118 年前后到达</div>')+'</div>'+
      '<div class="btnrow pe-acts"><button class="btn ghost" id="peDel">删掉</button><button class="btn" id="peImg">'+icon('ic-down')+'存成图片</button></div>';
    set(h);
    byId('peImg').onclick=function(){SFX.tap();saveImage(letterCard(L),'星海公约-'+M.t+'.png');};
    byId('peDel').onclick=function(){
      if(armed!=='del'){armed='del';SFX.tap();byId('peDel').textContent='再点一次，确定删掉';return;}
      const p=P();p.letters=p.letters.filter(function(x){return x.id!==L.id;});save();SFX.page();toast('已删掉。');home();
    };
  }

  /* ---------------- 起草公约 ---------------- */
  function topics(){
    view='topics';
    const n=P().arts.length;
    if(n>=KEEP_A){toast('公约已经写满 '+KEEP_A+' 条了。可以先删掉几条再写。');doc();return;}
    let h=head('我的星海公约','起草第 '+artNo(n+1)+' 条','先选一个题目。用你自己的话写，不用像法条，但要让别人看得懂、照着做。');
    h+='<div class="pe-topics">'+PEN_TOPICS.map(function(t){return '<button class="pe-topic" data-t="'+t.id+'"><b>'+t.t+'</b>'+(t.law?'<span>现实中有规定</span>':'<span>自由命题</span>')+'</button>';}).join('')+'</div>';
    if(n)h+='<div class="btnrow pe-acts"><button class="btn ghost" id="peDoc">'+icon('ic-law')+'看看我的公约（'+n+' 条）</button></div>';
    set(h);
    $$('#pen .pe-topic').forEach(function(b){b.onclick=function(){SFX.tap();topic=b.getAttribute('data-t');write();};});
    if(n)byId('peDoc').onclick=function(){SFX.page();doc();};
  }
  function write(text){
    view='write';const T=PEN_TOPIC_BY[topic],n=P().arts.length+1,d=text!=null?text:(drafts['law:'+topic]||'');
    let h=head('起草第'+artNo(n)+'条',T.t,'可以想一想三件事：谁来做？做什么（应当 / 不得 / 可以）？做不到怎么办？');
    h+='<div class="pe-sheet paper"><div class="pe-artno">第 '+artNo(n)+' 条</div>'+
      '<textarea id="peText" class="pe-ta law" maxlength="'+MAXA+'" placeholder="例如：各国应当……">'+esc(d)+'</textarea>'+
      '<div class="pe-meta"><span class="pe-seedk">'+(T.seed?'从这里开头也行：':'这个题目由你来定。')+'</span><span id="peCnt" class="pe-cnt"></span></div>'+
      (T.seed?'<div class="pe-seeds"><button class="pe-seed" id="peSeed">'+esc(T.seed)+'</button></div>':'')+
    '</div>'+
    '<div class="btnrow pe-acts"><button class="btn ghost" id="peTopic">换个题目</button><button class="btn" id="peCheck">写好了，看看</button></div>';
    set(h);
    const ta=byId('peText'),cnt=byId('peCnt');
    const upd=function(){cnt.textContent=ta.value.length+' / '+MAXA;drafts['law:'+topic]=ta.value;};ta.oninput=upd;upd();
    if(T.seed)byId('peSeed').onclick=function(){SFX.tap();if(ta.value.indexOf(T.seed)!==0)ta.value=(T.seed+ta.value).slice(0,MAXA);ta.focus();try{ta.setSelectionRange(ta.value.length,ta.value.length);}catch(e){}upd();};
    byId('peTopic').onclick=function(){SFX.tap();topics();};
    byId('peCheck').onclick=function(){
      const t=ta.value.trim();
      if(t.replace(/\s/g,'').length<6){SFX.error();toast('一条公约，至少说清一件事。再多写几个字吧。');ta.focus();return;}
      if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
      SFX.page();check(t);
    };
  }
  /* 条文体检：只看写没写清“谁 / 做什么 / 做不到怎么办”，不评对错 */
  const CHK=[
    {k:'谁来做',re:/各国|国家|发射国|登记国|缔约|任何人|任何国家|任何一方|任何机构|所有人|每个人|人类|运营|公司|企业|机构|政府|航天员|操作者|开采|作业方|一方|双方|我们|大家|联合国/,
     ok:'点了名：这一条是对谁说的，一看就知道。',no:'还没看出是谁要做。条文最好点名：各国？发射国？运营公司？'},
    {k:'做什么',re:/应当|应该|应|不得|禁止|可以|有权|必须|须|不能|不可|不准|允许|不许|要/,
     ok:'用了“应当 / 不得 / 可以”这类词，要求说得很死，不容易各自理解。',no:'可以用“应当”“不得”“可以”把要求说清楚，免得各自理解。'},
    {k:'做不到怎么办',re:/赔|责任|补偿|撤销|处罚|制裁|承担|负责|归还|恢复|追究|否则|违反|除非|清除|移除|收回/,
     ok:'写了做不到的后果，这一条就有了牙齿。',no:'还可以补一句：做不到怎么办？谁来赔、怎么纠正？'}
  ];
  function check(text){
    view='check';const T=PEN_TOPIC_BY[topic],n=P().arts.length+1;
    let h=head('起草第'+artNo(n)+'条','对照一下','');
    h+='<div class="pe-sheet paper pe-read"><div class="pe-artno">第 '+artNo(n)+' 条<small>'+T.t+'</small></div><div class="pe-body law">'+esc(text)+'</div></div>';
    h+='<div class="pe-card"><h4>写清了吗</h4>'+CHK.map(function(c){const ok=c.re.test(text);return '<div class="pe-chk '+(ok?'ok':'no')+'"><i>'+(ok?'✓':'○')+'</i><div><b>'+c.k+'</b><span>'+(ok?c.ok:c.no)+'</span></div></div>';}).join('')+
      '<div class="pe-note">这不是打分。真实的条约里，也常常只写前两样，后果放在别的条文里。</div></div>';
    h+='<div class="pe-card real"><h4>现实中'+(T.law?'：'+T.law:'')+'</h4><p>'+T.real+'</p></div>';
    h+='<div class="btnrow pe-acts"><button class="btn ghost" id="peEdit">再改改</button><button class="btn" id="peAdd">'+icon('ic-pen')+'写进公约</button></div>';
    set(h);
    byId('peEdit').onclick=function(){SFX.tap();write(text);};
    byId('peAdd').onclick=function(){
      const p=P();p.arts.push({id:'A'+Date.now().toString(36),topic:topic,text:text,date:dateStr()});
      delete drafts['law:'+topic];save();checkAchs();SFX.stamp();buzz(18);
      doc(true);
    };
  }
  function doc(fresh){
    view='doc';armed='';
    const p=P(),n=p.arts.length;
    if(!n){topics();return;}
    let h=head('尾声 · 回信台','我的星海公约','');
    h+='<div class="pe-sheet paper pe-doc'+(fresh?' fresh':'')+'"><div class="pd-t">星 海 公 约</div><div class="pd-sub">'+esc(S.profile.name)+' 起草</div>'+
      '<div class="pd-pre">为了让星海对所有人开放，让后来的人也有路可走，我们约定如下：</div>'+
      p.arts.map(function(a,i){const T=PEN_TOPIC_BY[a.topic]||PEN_TOPIC_BY.free;return '<div class="pd-art'+(fresh&&i===n-1?' new':'')+'" data-a="'+a.id+'"><b>第 '+artNo(i+1)+' 条</b><span>'+esc(a.text)+'</span><em>'+T.t+'</em><button class="pd-x" data-x="'+a.id+'" aria-label="删掉这一条">×</button></div>';}).join('')+
      '<div class="pd-sign"><div class="pd-who"><span>立约人　'+esc(S.profile.name)+'</span><span>'+dateStr()+'</span></div><div class="pd-seal">星海<br>公约</div></div></div>';
    h+='<div class="btnrow pe-acts">'+(n<KEEP_A?'<button class="btn ghost" id="peMore">'+icon('ic-pen')+'再写一条</button>':'')+'<button class="btn" id="peImg">'+icon('ic-down')+'存成图片</button></div>';
    set(h);
    if(n<KEEP_A)byId('peMore').onclick=function(){SFX.tap();topics();};
    byId('peImg').onclick=function(){SFX.tap();saveImage(docCard(),'星海公约-我的公约.png');};
    $$('#pen .pd-x').forEach(function(b){b.onclick=function(){
      const id=b.getAttribute('data-x');
      if(armed!==id){armed=id;SFX.tap();$$('#pen .pd-x').forEach(function(x){x.classList.remove('armed');x.textContent='×';});b.classList.add('armed');b.textContent='删掉？';return;}
      p.arts=p.arts.filter(function(a){return a.id!==id;});save();SFX.page();doc();
    };});
  }

  /* ---------------- 存成图片 ---------------- */
  function wrap(g,text,maxW){
    const out=[];String(text).split('\n').forEach(function(par){
      let line='';for(const ch of par){if(g.measureText(line+ch).width>maxW&&line){out.push(line);line=ch;}else line+=ch;}
      out.push(line);
    });return out;
  }
  function paperBg(g,W,H){
    g.fillStyle='#0A0F1E';g.fillRect(0,0,W,H);
    const R=rng(W+H);for(let i=0;i<260;i++){g.fillStyle='rgba(230,236,255,'+(R()*.5+.15).toFixed(2)+')';const r=R()*1.6+.4;g.fillRect(R()*W,R()*H,r,r);}
    g.fillStyle='#F3EDE1';g.fillRect(60,60,W-120,H-120);
    g.strokeStyle='rgba(184,54,43,.55)';g.lineWidth=2;g.strokeRect(84,84,W-168,H-168);
    g.strokeStyle='rgba(184,54,43,.25)';g.lineWidth=1;g.strokeRect(94,94,W-188,H-188);
  }
  const SERIF='"Songti SC","Noto Serif SC","Source Han Serif SC","Noto Serif CJK SC",STSong,SimSun,serif';
  const SANS='"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif';
  function letterCard(L){
    const W=1080,cv=document.createElement('canvas'),g=cv.getContext('2d');
    g.font='44px '+SERIF;const lines=wrap(g,L.text,W-280);
    const rows=L.m==='far'?grid(L.text):null,cell=rows?Math.max(3,Math.min(8,Math.floor(560/rows.length))):0;
    const H=Math.max(1350,520+lines.length*76+(rows?rows.length*cell+120:200));
    cv.width=W;cv.height=H;paperBg(g,W,H);
    g.fillStyle='#B8362B';g.font='600 26px '+SANS;g.textAlign='center';g.fillText('星 海 公 约 · 回 信 台',W/2,160);
    g.fillStyle='#4B5263';g.font='30px '+SERIF;g.fillText('致　'+L.to,W/2,226);
    g.strokeStyle='rgba(29,34,48,.2)';g.beginPath();g.moveTo(160,262);g.lineTo(W-160,262);g.stroke();
    g.textAlign='left';g.fillStyle='#1D2230';g.font='44px '+SERIF;
    let y=340;lines.forEach(function(s){g.fillText(s,140,y);y+=76;});
    y+=30;g.textAlign='right';g.fillStyle='#4B5263';g.font='34px '+SERIF;g.fillText(L.sign,W-140,y);g.font='26px '+SANS;g.fillText(L.date,W-140,y+46);
    if(rows){
      const gw=23*cell,x0=(W-gw)/2,y0=y+110;
      g.fillStyle='#0E1424';g.fillRect(x0-24,y0-24,gw+48,rows.length*cell+48);
      rows.forEach(function(r,i){r.forEach(function(v,c){if(v){g.fillStyle=PAL[v];g.fillRect(x0+c*cell,y0+i*cell,cell-1,cell-1);}});});
      g.textAlign='center';g.fillStyle='#7C8293';g.font='24px '+SANS;g.fillText('这封信编成的点阵 · 以光速走 41 年',W/2,y0+rows.length*cell+70);
    }else{
      g.save();g.translate(W-250,H-250);g.rotate(-.12);g.strokeStyle='#B8362B';g.lineWidth=5;g.beginPath();g.arc(0,0,82,0,Math.PI*2);g.stroke();
      g.fillStyle='#B8362B';g.textAlign='center';g.font='700 40px '+SERIF;g.fillText('2177',0,4);g.font='24px '+SANS;g.fillText('年 开 启',0,42);g.restore();
    }
    g.textAlign='center';g.fillStyle='#9A927D';g.font='22px '+SANS;g.fillText('写于《星海公约》· 回信台',W/2,H-110);
    return cv;
  }
  function docCard(){
    const W=1080,cv=document.createElement('canvas'),g=cv.getContext('2d'),arts=P().arts;
    g.font='36px '+SERIF;
    const blocks=arts.map(function(a,i){return {no:'第 '+artNo(i+1)+' 条',lines:wrap(g,a.text,W-380)};});
    const H=Math.max(1350,560+blocks.reduce(function(s,b){return s+b.lines.length*60+40;},0)+260);
    cv.width=W;cv.height=H;paperBg(g,W,H);
    g.textAlign='center';g.fillStyle='#1D2230';g.font='700 64px '+SERIF;g.fillText('星 海 公 约',W/2,210);
    g.fillStyle='#7C8293';g.font='28px '+SANS;g.fillText(S.profile.name+' 起草',W/2,262);
    g.textAlign='left';g.fillStyle='#4B5263';g.font='32px '+SERIF;
    let y=350;wrap(g,'为了让星海对所有人开放，让后来的人也有路可走，我们约定如下：',W-280).forEach(function(s){g.fillText(s,140,y);y+=54;});
    y+=30;
    blocks.forEach(function(b){
      g.fillStyle='#B8362B';g.font='700 32px '+SERIF;g.fillText(b.no,140,y);
      g.fillStyle='#1D2230';g.font='36px '+SERIF;b.lines.forEach(function(s,i){g.fillText(s,300,y+i*60);});
      y+=b.lines.length*60+40;
    });
    y+=20;g.textAlign='right';g.fillStyle='#4B5263';g.font='30px '+SERIF;g.fillText('立约人　'+S.profile.name,W-140,y);g.font='26px '+SANS;g.fillText(dateStr(),W-140,y+44);
    g.save();g.translate(W-260,y+150);g.rotate(-.1);g.strokeStyle='#B8362B';g.lineWidth=5;g.strokeRect(-62,-62,124,124);
    g.fillStyle='#B8362B';g.textAlign='center';g.font='700 40px '+SERIF;g.fillText('星海',0,-6);g.fillText('公约',0,42);g.restore();
    return cv;
  }
  function saveImage(cv,name){
    try{const a=document.createElement('a');a.download=name;a.href=cv.toDataURL('image/png');document.body.appendChild(a);a.click();a.remove();
      SFX.ok();toast('已保存。手机上如果没反应，可以截屏保存。');}
    catch(e){toast('这个浏览器不支持直接保存，截屏也可以。');}
  }

  /* ---------------- 进出 ---------------- */
  function back(){
    if(view==='home'){close();return;}
    if(view==='write'){topics();return;}
    if(view==='check'){write();return;}
    home();
  }
  function open(){
    if(!unlocked()){SFX.error();toast('完成第六章后开放。');return;}
    P();layer().classList.add('on');MUSIC.setMode('intro');home();
  }
  function close(){cancelAnimationFrame(anim);layer().classList.remove('on');layer().innerHTML='';view='home';MUSIC.setMode(Hub.musicHere());Hub.refresh();}
  return {open:open,close:close,back:back,isOn:function(){return layer().classList.contains('on');},unlocked:unlocked,
    count:function(){const p=S.pen;return p?p.letters.length:0;}};
})();
