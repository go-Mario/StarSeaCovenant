"use strict";
/* =====================================================================
   存档。新键 SSv4；首次运行时把旧版（SLv3BOX）的进度搬过来。
   ===================================================================== */
const SAVE_KEY='SSv4';
const OLD_KEY='SLv3BOX';
const BACKUP_KEY=SAVE_KEY+'.backup';
const SAVE_STATUS={message:'',blocked:false,warned:false};
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
function saveObject(x){return x!==null&&typeof x==='object'&&!Array.isArray(x);}
/* 缺失字段可以迁移；类型损坏不能悄悄当作新游戏并覆盖原件。 */
function saveDefaults(o,d,path){
  if(!saveObject(o))throw Error('存档结构不正确：'+path);
  Object.keys(d).forEach(function(k){
    const p=path+'.'+k,v=o[k],def=d[k];
    if(v===undefined){o[k]=def;return;}
    if(Array.isArray(def)){if(!Array.isArray(v))throw Error('存档结构不正确：'+p);}
    else if(saveObject(def))saveDefaults(v,def,p);
    else if(def!==null&&(typeof v!==typeof def||(typeof v==='number'&&!Number.isFinite(v))))throw Error('存档结构不正确：'+p);
  });
  return o;
}
function parseSaveJSON(raw){
  return JSON.parse(raw,function(k,v){
    if(k==='__proto__'||k==='constructor'||k==='prototype')throw Error('存档包含不支持的字段');
    return v;
  });
}
function normalizeSave(o){
  if(!saveObject(o)||(o.v!==undefined&&o.v!==4))throw Error('不支持的存档版本');
  const s=saveDefaults(o,DEF_S(),'存档');
  ['laws','precs','leanLog','hist','terms','achs','tips'].forEach(function(k){
    if(s[k].some(function(v){return typeof v!=='string';}))throw Error('存档列表不正确：'+k);
  });
  ['ch','judge','games'].forEach(function(k){
    Object.keys(s[k]).forEach(function(id){if(!saveObject(s[k][id]))throw Error('存档记录不正确：'+k);});
  });
  Object.keys(s.ch).forEach(function(id){saveDefaults(s.ch[id],{done:false,grade:'',ending:'',picks:[],evs:[],facts:[]},'章节');});
  if(s.moralLog.some(function(v){return !saveObject(v);}))throw Error('立场记录不正确');
  if(s.language!==undefined&&!['zh-CN','en'].includes(s.language))throw Error('不支持的界面语言');
  if(s.stories!==undefined){
    if(!saveObject(s.stories))throw Error('人物记录不正确');
    const w=s.stories.nightshift;
    if(w!==undefined){
      saveDefaults(w,{routes:{},shared:[],log:[]},'回信前夜');
      const schema={lin:{docs:['raw','repair','roster'],choices:{handover:['logs','relief'],stay:['logs','doublecheck']}},li:{docs:['clock','spectrum','protocol'],choices:{note:['timing','summary'],open:['timing','openData']}},chen:{docs:['agenda','mandate','stationrule'],choices:{limited:['hearing','noTransmission'],postpone:['notice','noTransmission']}}};
      const facts=Object.values(schema).flatMap(function(r){return Object.values(r.choices).flat();});
      Object.keys(w.routes).forEach(function(id){
        const r=w.routes[id],def=schema[id];
        if(!def||!saveObject(r))throw Error('未知人物记录');
        saveDefaults(r,{phase:0,seen:[],sequence:[],choice:null,energy:50,ot:0,minutes:0,solved:false,received:[]},'人物进度');
        if(!Number.isInteger(r.phase)||r.phase<0||r.phase>3||r.seen.some(function(k){return !def.docs.includes(k);})||new Set(r.seen).size!==r.seen.length)throw Error('人物阶段不正确');
        if(r.sequence.some(function(n){return !Number.isInteger(n)||n<0||n>2;})||new Set(r.sequence).size!==r.sequence.length||r.received.some(function(k){return !facts.includes(k);}))throw Error('人物线索不正确');
        if(r.energy<0||r.energy>100||r.ot<0||r.ot>100000||r.minutes<0)throw Error('人物状态超出范围');
        if((r.phase===3&&(!Object.prototype.hasOwnProperty.call(def.choices,r.choice)||!r.solved))||(r.phase!==3&&r.choice!==null)||(r.phase===2&&!r.solved))throw Error('人物结局不正确');
      });
      const logged=new Set(),shared=[];
      w.log.forEach(function(x){
        if(!saveObject(x)||!schema[x.role]||!w.routes[x.role]||w.routes[x.role].phase!==3||w.routes[x.role].choice!==x.choice||logged.has(x.role))throw Error('交接记录不正确');
        logged.add(x.role);schema[x.role].choices[x.choice].forEach(function(k){if(!shared.includes(k))shared.push(k);});
      });
      if(Object.keys(w.routes).some(function(id){return w.routes[id].phase===3&&!logged.has(id);}))throw Error('交接记录不完整');
      w.shared=shared; // Public facts come only from completed, recorded actions.
    }
  }
  if(s.pen!==undefined){
    saveDefaults(s.pen,{letters:[],arts:[]},'亲笔');
    s.pen.letters.forEach(function(v){saveDefaults(v,{id:'',m:'far',to:'',text:'',sign:'',date:''},'信件');});
    s.pen.arts.forEach(function(v){saveDefaults(v,{id:'',topic:'free',text:'',date:''},'公约');});
  }
  if(s.daily.prog!==undefined)saveDefaults(s.daily.prog,{d:'',ids:[],res:[]},'每日练习');
  ['ids','res'].forEach(function(k){if(s.daily[k]!==undefined&&!Array.isArray(s.daily[k]))throw Error('每日练习列表不正确');});
  if(s.work!==undefined){
    saveDefaults(s.work,{day:0,min:540,ot:0,otAll:0,leave:5,coffee:0,coffeeBlock:-1,week:[],seen:[],inbox:[],notes:[]},'秘书处');
    if(s.work.week.concat(s.work.inbox).some(function(v){return !saveObject(v);}))throw Error('工时记录不正确');
    if(s.work.day<0||s.work.day>365000||s.work.min<0||s.work.min>10080)throw Error('存档时间超出范围');
  }
  if(s.pen&&s.pen.letters.concat(s.pen.arts).some(function(v){return !saveObject(v);}))throw Error('亲笔记录不正确');
  if(s.games.sat&&s.games.sat.list!==undefined&&(!Array.isArray(s.games.sat.list)||s.games.sat.list.some(function(v){return !saveObject(v);})))throw Error('卫星记录不正确');
  if(s.games.sling&&s.games.sling.record!==undefined&&!Array.isArray(s.games.sling.record))throw Error('唱片记录不正确');
  if(s.games.const&&s.games.const.done!==undefined&&!Array.isArray(s.games.const.done))throw Error('星座记录不正确');
  ['seal','paper'].forEach(function(k){if(s.owned[k].some(function(v){return typeof v!=='string';}))throw Error('外观记录不正确');});
  s.rep=Math.max(0,s.rep);s.dust=Math.max(0,s.dust);s.hints=Math.max(0,s.hints);
  s.focus=Math.max(0,Math.min(100,s.focus));s.standing=Math.max(0,Math.min(5,s.standing));
  s.profile.name=s.profile.name.slice(0,6)||'简';
  return s;
}
let S=(function(){
  let raw,backup,old;
  try{raw=localStorage.getItem(SAVE_KEY);backup=localStorage.getItem(BACKUP_KEY);old=localStorage.getItem(OLD_KEY);}
  catch(e){SAVE_STATUS.message='浏览器未开放存储权限。当前进度仅在本次打开期间保留，请到档案馆导出备份。';return DEF_S();}
  if(raw){try{return normalizeSave(parseSaveJSON(raw));}catch(e){SAVE_STATUS.message='主存档无法读取。';}}
  if(backup){try{
    const s=normalizeSave(parseSaveJSON(backup));SAVE_STATUS.message='已从自动备份恢复进度，可能缺少最后一步操作。建议导出一份备份。';return s;
  }catch(e){}}
  if(!raw&&!backup&&old){try{return normalizeSave(migrateOld(parseSaveJSON(old)));}catch(e){SAVE_STATUS.message='旧版存档无法读取。';}}
  if(raw||backup||SAVE_STATUS.message){SAVE_STATUS.blocked=true;SAVE_STATUS.message+=' 原始数据已保留，自动保存已暂停。请在档案馆导入备份，或明确清空后重新开始。';}
  return DEF_S();
})();
function migrateOld(o){
  const s=DEF_S();
  if(!saveObject(o)||!saveObject(o.theater))throw Error('不是可识别的旧版存档');
    const th=o.theater||{};
    ['ch1','ch2','ch3','ch4'].forEach(function(k){
      if(th[k]){const r=(o.reviews&&o.reviews[k])||{};s.ch[k]={done:true,grade:r.grade||'胜诉',ending:(o.endings&&o.endings[k])||'verdict',picks:r.picks||[],first:Date.now()};}
    });
    s.laws=(o.laws||[]).slice();s.precs=(o.precs||[]).slice();
    s.moralLog=(o.moralLog||[]).slice();s.leanLog=(o.leanLog||[]).slice();
    s.judge=o.judge||{};s.rep=o.rep||0;s.sound=o.sound!==false;s.bgm=o.bgm!==false;
    if(typeof o.standing==='number')s.standing=o.standing;
    if(o.orbitBest)s.games.orbit={best:o.orbitBest};
    /* 保留初版秘书处的工时、调休与精力，而不只搬章节进度。 */
    if(saveObject(o.work)){s.work=o.work;if(typeof o.work.energy==='number')s.focus=o.work.energy;}
    s.dust+=Math.min(200,(o.rep||0)*5);   /* 老玩家的声望折一点星尘，作为搬家礼 */
    s.migrated=true;
  return s;
}
function storageNotice(){
  const el=document.getElementById('saveNotice');
  if(el){el.hidden=!SAVE_STATUS.message;el.textContent=SAVE_STATUS.message;}
  if(SAVE_STATUS.message&&!SAVE_STATUS.warned&&typeof toast==='function'){
    SAVE_STATUS.warned=true;toast('存档需要注意：请打开「档案馆 → 设置」查看。',4500);
  }
}
function writeSave(next){
  try{
    const text=JSON.stringify(next),previous=localStorage.getItem(SAVE_KEY);
    /* 只轮换验证过的旧值，绝不让损坏的主存档污染可用备份。 */
    if(previous){try{normalizeSave(parseSaveJSON(previous));localStorage.setItem(BACKUP_KEY,previous);}catch(e){}}
    localStorage.setItem(SAVE_KEY,text);
    SAVE_STATUS.message='';SAVE_STATUS.warned=false;storageNotice();return true;
  }catch(e){
    SAVE_STATUS.message='保存未成功：浏览器空间不足或不允许存储。当前进度仍在，请立即导出备份。';
    storageNotice();return false;
  }
}
function save(){if(SAVE_STATUS.blocked){storageNotice();return false;}return writeSave(S);}
function downloadSave(text,name){
  const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(function(){URL.revokeObjectURL(url);},30000);
}

const SAVE={
  seeTerm(k){if(S.terms.indexOf(k)<0){S.terms.push(k);save();}},
  seeHist(k){if(S.hist.indexOf(k)<0){S.hist.push(k);save();return true;}return false;},
  chDone(id){return !!(S.ch[id]&&S.ch[id].done);},
  game(id){if(!S.games[id])S.games[id]={};return S.games[id];},
  export(){
    downloadSave(JSON.stringify({format:'StarSeaCovenant',version:1,exportedAt:new Date().toISOString(),state:S},null,2),
      '星海公约-存档-'+new Date().toISOString().slice(0,10)+'.json');
  },
  decode(text){
    if(text.length>2*1024*1024)throw Error('存档超过 2 MB，请选择游戏导出的 JSON 文件');
    const data=parseSaveJSON(text);
    if(!saveObject(data))throw Error('不是星海公约存档');
    if(data.format==='StarSeaCovenant'){
      if(data.version!==1)throw Error('存档导出版本较新，请先更新游戏');
      return normalizeSave(data.state);
    }
    if(data.v===4&&saveObject(data.profile))return normalizeSave(data);
    if(saveObject(data.theater)&&typeof data.rep==='number')return normalizeSave(migrateOld(data));
    throw Error('不是可识别的星海公约存档');
  },
  import(text){
    const next=this.decode(text);
    if(!writeSave(next))return false;
    S=next;SAVE_STATUS.blocked=false;return true;
  },
  reset(){
    const next=DEF_S();
    /* 写入成功才切换界面，避免“清空成功”后刷新却复活旧进度。 */
    if(!writeSave(next))return false;
    S=next;SAVE_STATUS.blocked=false;
    try{localStorage.removeItem(BACKUP_KEY);localStorage.removeItem(OLD_KEY);}catch(e){}
    return true;
  }
};
document.addEventListener('DOMContentLoaded',storageNotice);

/* 星尘、提示卡、精力 —— 详见 economy.js */
function rankOf(rep){return I18N.t(rep>=40?'首席仲裁员':rep>=26?'资深仲裁员':rep>=14?'仲裁员':rep>=6?'助理仲裁员':'见习仲裁员',rep>=40?'Chief Arbitrator':rep>=26?'Senior Arbitrator':rep>=14?'Arbitrator':rep>=6?'Assistant Arbitrator':'Probationary Arbitrator');}
function rankNext(rep){return [6,14,26,40].find(function(x){return x>rep;})||40;}
function rankFloor(rep){return rep>=40?40:rep>=26?26:rep>=14?14:rep>=6?6:0;}
