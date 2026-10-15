"use strict";
/* =====================================================================
   存档。新键 SSv4；首次运行时把旧版（SLv3BOX）的进度搬过来。
   ===================================================================== */
const SAVE_KEY='SSv4';
const OLD_KEY='SLv3BOX';
function DEF_S(){return {
  v:4,
  profile:{name:'简',skin:3,hair:'tied',suit:0,created:false,introSeen:false,hubSeen:false},
  ch:{},              /* ch1..ch6：{done,grade,ending,flawless,picks,evs,morale,mcap,date,first} */
  laws:[],precs:[],moralLog:[],leanLog:[],standing:3,
  judge:{},daily:{last:'',streak:0},
  rep:0,dust:30,hints:1,focus:80,
  owned:{seal:['zhu'],paper:['xuan']},equip:{seal:'zhu',paper:'xuan'},
  games:{},           /* 各小游戏的最好成绩 */
  hist:[],            /* 读过的史实卡 */
  terms:[],           /* 点开过的术语 */
  achs:[],tips:[],    /* 已看过的新机制说明 */
  sound:true,bgm:true,
  lastPlay:''
};}
let S=(function(){
  try{
    const raw=localStorage.getItem(SAVE_KEY);
    if(raw){const o=JSON.parse(raw);const d=DEF_S();
      Object.keys(d).forEach(function(k){if(o[k]===undefined)o[k]=d[k];});
      Object.keys(d.profile).forEach(function(k){if(o.profile[k]===undefined)o.profile[k]=d.profile[k];});
      return o;}
    const old=localStorage.getItem(OLD_KEY);
    if(old){return migrateOld(JSON.parse(old));}
  }catch(e){}
  return DEF_S();
})();
function migrateOld(o){
  const s=DEF_S();
  try{
    const th=o.theater||{};
    ['ch1','ch2','ch3','ch4'].forEach(function(k){
      if(th[k]){const r=(o.reviews&&o.reviews[k])||{};s.ch[k]={done:true,grade:r.grade||'胜诉',ending:(o.endings&&o.endings[k])||'verdict',picks:r.picks||[],first:Date.now()};}
    });
    s.laws=(o.laws||[]).slice();s.precs=(o.precs||[]).slice();
    s.moralLog=(o.moralLog||[]).slice();s.leanLog=(o.leanLog||[]).slice();
    s.judge=o.judge||{};s.rep=o.rep||0;s.sound=o.sound!==false;s.bgm=o.bgm!==false;
    if(typeof o.standing==='number')s.standing=o.standing;
    if(o.orbitBest)s.games.orbit={best:o.orbitBest};
    s.dust+=Math.min(200,(o.rep||0)*5);   /* 老玩家的声望折一点星尘，作为搬家礼 */
    s.migrated=true;
  }catch(e){}
  return s;
}
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(S));}catch(e){}}

const SAVE={
  seeTerm(k){if(S.terms.indexOf(k)<0){S.terms.push(k);save();}},
  seeHist(k){if(S.hist.indexOf(k)<0){S.hist.push(k);save();return true;}return false;},
  chDone(id){return !!(S.ch[id]&&S.ch[id].done);},
  game(id){if(!S.games[id])S.games[id]={};return S.games[id];},
  reset(){try{localStorage.removeItem(SAVE_KEY);}catch(e){}S=DEF_S();save();}
};

/* 星尘、提示卡、精力 —— 详见 economy.js */
function rankOf(rep){return rep>=40?'首席仲裁员':rep>=26?'资深仲裁员':rep>=14?'仲裁员':rep>=6?'助理仲裁员':'见习仲裁员';}
function rankNext(rep){return [6,14,26,40].find(function(x){return x>rep;})||40;}
function rankFloor(rep){return rep>=40?40:rep>=26?26:rep>=14?14:rep>=6?6:0;}
