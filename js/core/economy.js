"use strict";
/* =====================================================================
   经济与成长：星尘（软货币）、提示卡、精力、外观、成就
   设计原则：
   · 主线永远免费、永远走得通，精力不足也能开庭，只是少一格气势；
   · 星尘只买「方便」（提示卡）和「好看」（印章、裁决书纸样），不卖胜负；
   · 激励视频广告只作为自愿选项（换提示卡/补精力），默认位置见 MONETIZE。
   ===================================================================== */
const MONETIZE={
  adsDemo:true,          /* 开发期用占位弹窗演示流程；接入小程序时换成 wx.createRewardedVideoAd */
  adDailyCap:5           /* 每天最多看几次，避免变成刷广告 */
};
const ECON={
  dust(n,from){
    if(!n)return;S.dust=Math.max(0,S.dust+n);save();
    const tgt=byId('hudDust');
    if(n>0&&from&&tgt&&tgt.offsetParent){const r=tgt.getBoundingClientRect();
      FX.flyTo(from.x,from.y,r.left+r.width/2,r.top+r.height/2,Math.min(12,4+Math.round(n/10)),'#F6C35B',function(){SFX.coin();HUD.refresh();});}
    else{if(n>0)SFX.coin();HUD.refresh();}
  },
  spend(n){if(S.dust<n){toast('星尘不够。去「休憩舱」或支线小游戏里攒一点吧。');SFX.error();return false;}S.dust-=n;save();HUD.refresh();return true;},
  focus(n){S.focus=clamp((S.focus||0)+n,0,100);save();HUD.refresh();},
  hint(){if(S.hints>0){S.hints--;save();HUD.refresh();return true;}return false;},
  rep(n){S.rep+=n;save();HUD.refresh();},
  /* 激励视频（占位）。返回 Promise<boolean> */
  rewarded(reason){
    return new Promise(function(res){
      const k='ad-'+todayKey();S.adCount=S.adCount||{};
      if((S.adCount[k]||0)>=MONETIZE.adDailyCap){toast('今天的次数用完了，明天再来。');res(false);return;}
      if(!MONETIZE.adsDemo){res(false);return;}
      const m=byId('adModal');let left=3;
      m.querySelector('.ad-why').textContent=reason||'';
      const cnt=m.querySelector('.ad-cnt');cnt.textContent=left;
      m.classList.add('on');
      const iv=setInterval(function(){left--;cnt.textContent=Math.max(0,left);
        if(left<=0){clearInterval(iv);m.classList.remove('on');S.adCount[k]=(S.adCount[k]||0)+1;save();res(true);}},1000);
      m.querySelector('.ad-close').onclick=function(){clearInterval(iv);m.classList.remove('on');res(false);};
    });
  }
};

/* 外观：印章与裁决书纸样。只影响裁决书的样子 */
const COSMETICS={
  seal:[
    {id:'zhu',name:'朱砂方印',cost:0,css:'seal-zhu',d:'仲裁院的老式印泥，红得发暗。'},
    {id:'bronze',name:'青铜圆印',cost:120,css:'seal-bronze',d:'像博物馆里出土的铜印，边缘带锈。'},
    {id:'star',name:'星图钢印',cost:180,css:'seal-star',d:'压出凸纹，没有颜色，只有光。'}],
  paper:[
    {id:'xuan',name:'米色宣纸',cost:0,css:'pp-xuan',d:'默认样式。'},
    {id:'kraft',name:'牛皮卷宗',cost:100,css:'pp-kraft',d:'档案室里那种发黄的牛皮纸。'},
    {id:'holo',name:'全息薄片',cost:200,css:'pp-holo',d:'2070 年代的电子文书，会随角度泛光。'}]
};
const SHOP_ITEMS=[
  {id:'hint1',name:'提示卡',sub:'庭上点一下，告诉你哪句证词有破绽',cost:40,give:{hints:1}},
  {id:'hint3',name:'提示卡 × 3',sub:'多买省一点',cost:100,give:{hints:3}},
  {id:'focus',name:'一杯热可可',sub:'精力 +30',cost:30,give:{focus:30}}
];
function buyItem(id){
  const it=SHOP_ITEMS.find(function(x){return x.id===id;});if(!it)return;
  if(!ECON.spend(it.cost))return;
  if(it.give.hints){S.hints+=it.give.hints;}
  if(it.give.focus){S.focus=clamp(S.focus+it.give.focus,0,100);}
  save();HUD.refresh();SFX.coin();toast('已购买：'+it.name);if(typeof Panels!=='undefined')Panels.refresh();
}
function buyCos(kind,id){
  const it=COSMETICS[kind].find(function(x){return x.id===id;});if(!it)return;
  if(S.owned[kind].indexOf(id)<0){if(!ECON.spend(it.cost))return;S.owned[kind].push(id);SFX.coin();}
  S.equip[kind]=id;save();toast('已换上：'+it.name);if(typeof Panels!=='undefined')Panels.refresh();
}

/* ---------------- 成就 ---------------- */
const ACHS=[
 {id:'first',name:'第一次开庭',desc:'完成第一章',cond:function(){return SAVE.chDone('ch1');}},
 {id:'half',name:'走过半个世纪',desc:'完成前三章',cond:function(){return SAVE.chDone('ch3');}},
 {id:'chair',name:'坐上那把椅子',desc:'第一次以仲裁员身份作出裁决',cond:function(){return SAVE.chDone('ch5');}},
 {id:'reply',name:'替人类回信',desc:'完成第六章',cond:function(){return SAVE.chDone('ch6');}},
 {id:'clean',name:'一步不错',desc:'某一章没有任何失着',cond:function(){return Object.keys(S.ch).some(function(k){return S.ch[k].flawless;});}},
 {id:'settle',name:'各退一步',desc:'用和解结束一个案子',cond:function(){return Object.keys(S.ch).some(function(k){return S.ch[k].ending==='settle';});}},
 {id:'sat',name:'第一颗卫星',desc:'在卫星工坊发射并登记一颗卫星',cond:function(){return !!(S.games.sat&&S.games.sat.launched);}},
 {id:'moon',name:'鹰已着陆',desc:'在登月着陆里平稳落地',cond:function(){return !!(S.games.lander&&S.games.lander.landed);}},
 {id:'dock',name:'对接成功',desc:'空间站对接一局接上 8 个舱段',cond:function(){return (S.games.station&&S.games.station.best||0)>=8;}},
 {id:'orbit',name:'先申报，后发射',desc:'轨位争夺一局占满 8 个',cond:function(){return (S.games.orbit&&S.games.orbit.best||0)>=8;}},
 {id:'voyager',name:'旅行者',desc:'引力弹弓通过第 3 关',cond:function(){return (S.games.sling&&S.games.sling.level||0)>=3;}},
 {id:'sky',name:'同一片天',desc:'连完五个文化的星座',cond:function(){return (S.games.const&&S.games.const.done||[]).length>=5;}},
 {id:'sweep',name:'轨道清道夫',desc:'碎片清扫一局清掉 60 块',cond:function(){return (S.games.sweep&&S.games.sweep.best||0)>=60;}},
 {id:'paint',name:'引力画家',desc:'在引力画板保存一幅画',cond:function(){return !!(S.games.paint&&S.games.paint.saved);}},
 {id:'hist',name:'读史的人',desc:'翻开 20 张史实卡',cond:function(){return S.hist.length>=20;}},
 {id:'terms',name:'法言法语',desc:'点开 12 个术语解释',cond:function(){return S.terms.length>=12;}},
 {id:'bench',name:'五案连裁',desc:'裁判练习裁完 5 案',cond:function(){return Object.keys(S.judge||{}).length>=5;}},
 {id:'daily',name:'连续三天',desc:'连续 3 天完成每日速判',cond:function(){return (S.daily&&S.daily.streak||0)>=3;}}
];
function checkAchs(){
  ACHS.forEach(function(a){
    if(S.achs.indexOf(a.id)<0){let ok=false;try{ok=a.cond();}catch(e){}
      if(ok){S.achs.push(a.id);S.dust+=20;save();setTimeout(function(){showAch(a);},500);}}
  });
}
function showAch(a){
  SFX.ach();buzz([20,40,20]);
  byId('acht').textContent='成就 · '+a.name;byId('achd').textContent=a.desc+'　星尘 +20';
  const p=byId('achpop');p.classList.add('on');HUD.refresh();
  setTimeout(function(){p.classList.remove('on');},2800);
}
