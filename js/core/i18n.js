"use strict";
/* Explicit bilingual copy. Unknown legacy narrative stays in its source language.
   Two mechanisms work together:
   1. DOM walker (apply) translates static and panel markup via the pairs table.
   2. Data localization (localizeAll) deep-walks the game's data objects
      (chapters, glossary, laws, history, cast, quiz, tips, shop, ...) and
      replaces every Chinese string that has a dictionary entry. Strings
      without a translation keep their source text, so the game never breaks
      while coverage grows. Switching language restores the pristine data
      snapshot first, then re-translates. */
const I18N=(function(){
  let lang=(new URLSearchParams(location.search).get('lang')||S.language)==='en'?'en':'zh-CN';
  const originals=new WeakMap();
  const pairs={
    '人物主线 · 共同事件':'Character stories · shared event','人物主线':'Character stories','星海公约':'Stellar Covenant','进入星图':'Enter the star map','真实的是法，虚构的是国':'The law is real. The nations are fictional.',
    '继续主线':'Continue the case files','档案馆':'Archive','档案':'Profile','法典':'Treaties','先例':'Precedents','史实':'History','成就':'Achievements','小卖部':'Supplies','设置':'Settings',
    '音效':'Sound effects','音乐':'Music','开':'On','关':'Off','文字速度':'Text speed','快':'Fast','标准':'Standard','开场影像':'Opening film','再看一遍':'Watch again','关于':'About',
    '存档与备份':'Progress and backups','导出备份':'Export backup','导入备份':'Import backup','清空存档':'Reset progress','修改形象':'Edit appearance','名字':'Name','肤色':'Skin tone','发型':'Hair','正装':'Suit','报到':'Report for duty','保存':'Save',
    '星海仲裁院 · 工牌':'Stellar Arbitration Court · ID card','星海仲裁院的人来自世界各地。你是什么样子，就是什么样子。':'People come here from all over the world. Come as you are.',
    '马尾':'Ponytail','短发':'Bob','蓬松卷':'Coils','脏辫':'Locs','编发':'Braids','盘发':'Bun','寸头':'Buzz cut','头巾':'Headscarf',
    '开庭剧场':'The Tribunal','星海仲裁院':'Stellar Arbitration Court','近地轨道':'Low Earth Orbit','月面与深空':'Moon & Beyond','休憩舱':'Rest Pod','见习裁判席':'Training Bench','秘书处':'Secretariat','秘书处 · 工时与调休':'Secretariat · Work and time off',
    '精力':'Energy','放大':'Zoom in','缩小':'Zoom out','看全貌':'Fit map','暂停':'Pause','跳过':'Skip','取消':'Cancel','返回':'Back','音效与音乐':'Sound and music',
    '结案记录':'Case record','你表过的态':'Positions you have taken','裁判偏向':'Judicial outlook','我的卫星':'My satellites','我的金唱片':'My golden record','术语表':'Glossary',
    '进度只保存在当前浏览器中；更换设备、浏览器或打开另一个本地文件，不会自动同步。清理浏览器数据前，请先导出备份。导入支持本版及旧版 JSON 存档。':'Progress is stored in this browser. Devices, browsers and local files do not automatically share saves. Export a backup before clearing browser data. Current and legacy JSON saves can be imported.'
  };
  /* Content translations live in a separate file so the UI table stays readable. */
  if(typeof I18N_CONTENT!=='undefined'&&I18N_CONTENT){for(const k in I18N_CONTENT){if(Object.prototype.hasOwnProperty.call(I18N_CONTENT,k)&&!Object.prototype.hasOwnProperty.call(pairs,k))pairs[k]=I18N_CONTENT[k];}}
  /* Glue fragments for runtime-composed labels ("第 ", " 句", "星尘 +", ...).
     A fragment only applies when it covers ALL Chinese in a short text node,
     so untranslated narrative is never mangled into mixed-language text. */
  const FRAGS=typeof I18N_FRAGS!=='undefined'&&I18N_FRAGS?I18N_FRAGS:{};
  const FRAG_KEYS=Object.keys(FRAGS).sort(function(a,b){return b.length-a.length;});
  function fragReplace(s){
    if(!hasCJK(s)||s.length>48)return null;
    let out='',i=0,used=false;
    while(i<s.length){
      let hit=false;
      for(let j=0;j<FRAG_KEYS.length;j++){
        const k=FRAG_KEYS[j];
        if(s.startsWith(k,i)){out+=FRAGS[k];i+=k.length;hit=true;used=true;break;}
      }
      if(!hit){out+=s[i];i++;}
    }
    return used&&!hasCJK(out)?out:null;
  }
  function t(zh,en){return lang==='en'?en:zh;}
  function text(zh){return lang==='en'?(pairs[zh]||zh):zh;}
  function translateText(raw){
    const key=raw.trim();
    if(Object.prototype.hasOwnProperty.call(pairs,key))return raw.replace(key,text(key));
    if(lang==='en'){const f=fragReplace(raw);if(f!==null)return f;}
    return null;
  }
  function apply(root){
    root=root||document.body;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let n;
    while((n=walker.nextNode())){
      if(!n.parentElement||n.parentElement.closest('script,style,textarea,[data-no-localize]'))continue;
      let orig=originals.get(n);
      if(orig===undefined){
        const out=translateText(n.textContent);
        if(out===null)continue;
        orig=n.textContent;originals.set(n,orig);
        n.textContent=out;
      }else{
        const out=translateText(orig);
        if(out!==null)n.textContent=out;
      }
    }
    root.querySelectorAll('[aria-label],[title],[placeholder]').forEach(function(el){
      ['aria-label','title','placeholder'].forEach(function(attr){
        const value=el.getAttribute(attr);if(!value)return;
        const key='data-source-'+attr;let original=el.getAttribute(key);
        if(!original){
          const out=translateText(value);
          if(out===null)return;
          original=value;el.setAttribute(key,value);el.setAttribute(attr,out);
        }else{
          const out=translateText(original);
          if(out!==null)el.setAttribute(attr,out);
        }
      });
    });
    document.querySelectorAll('.language-select').forEach(function(el){el.value=lang;});
    document.documentElement.lang=lang;
    document.title=t('星海公约','Stellar Covenant');
  }

  /* ---------------- data localization ---------------- */
  const PRISTINE={};
  const STATS={total:0,hit:0};
  let snapshotted=false;
  function clone(o){
    if(Array.isArray(o))return o.map(clone);
    if(o&&typeof o==='object'){
      if(typeof Node!=='undefined'&&o instanceof Node)return o;
      const c={};for(const k in o){if(Object.prototype.hasOwnProperty.call(o,k))c[k]=clone(o[k]);}
      return c;
    }
    return o;
  }
  function hasCJK(v){return /[\u3400-\u9fff]/.test(v);}
  function mapStr(v){
    if(typeof v!=='string'||!hasCJK(v))return v;
    STATS.total++;
    const en=pairs[v]!==undefined?pairs[v]:pairs[v.trim()];
    if(typeof en==='string'&&en!==v&&!hasCJK(en)){STATS.hit++;return en;}
    return v;
  }
  function walk(node){
    if(Array.isArray(node)){for(let i=0;i<node.length;i++)node[i]=walk(node[i]);return node;}
    if(node&&typeof node==='object'){
      if(typeof Node!=='undefined'&&node instanceof Node)return node;
      if(node instanceof Date)return node;
      for(const k in node){if(!Object.prototype.hasOwnProperty.call(node,k))continue;const v=node[k];if(typeof v==='function')continue;node[k]=walk(v);}
      return node;
    }
    return mapStr(node);
  }
  function collectRoots(){
    const out=[];
    if(typeof STATION!=='undefined')out.push(STATION);
    if(typeof WORLDS!=='undefined')out.push(WORLDS);
    if(typeof CHAPTERS!=='undefined')out.push(CHAPTERS);
    if(typeof GLOSSARY!=='undefined')out.push(GLOSSARY);
    if(typeof LAWS!=='undefined')out.push(LAWS);
    if(typeof PRECS!=='undefined')out.push(PRECS);
    if(typeof ERAS!=='undefined')out.push(ERAS);
    if(typeof HISTORY!=='undefined')out.push(HISTORY);
    if(typeof CAST_DEF!=='undefined')out.push(CAST_DEF);
    if(typeof ROLE_TAG!=='undefined')out.push(ROLE_TAG);
    if(typeof BENCH!=='undefined')out.push(BENCH);
    if(typeof QUIZ!=='undefined')out.push(QUIZ);
    if(typeof TIPS!=='undefined')out.push(TIPS);
    if(typeof POST_OPTS!=='undefined')out.push(POST_OPTS);
    if(typeof LEAN!=='undefined')out.push(LEAN);
    if(typeof LEAN_READ!=='undefined')out.push(LEAN_READ);
    if(typeof PEN_TOPICS!=='undefined')out.push(PEN_TOPICS);
    if(typeof INTRO_SHOTS!=='undefined')out.push(INTRO_SHOTS);
    if(typeof MONETIZE!=='undefined')out.push(MONETIZE);
    if(typeof ECON!=='undefined')out.push(ECON);
    if(typeof COSMETICS!=='undefined')out.push(COSMETICS);
    if(typeof SHOP_ITEMS!=='undefined')out.push(SHOP_ITEMS);
    if(typeof ACHS!=='undefined')out.push(ACHS);
    if(typeof GAMES!=='undefined')out.push(GAMES);
    if(typeof W_SPECIAL!=='undefined')out.push(W_SPECIAL);
    if(typeof WK!=='undefined')out.push(WK);
    if(typeof SONGS!=='undefined')out.push(SONGS);
    return out;
  }
  function snapshot(){
    if(snapshotted)return;
    const roots=collectRoots();
    for(let i=0;i<roots.length;i++)PRISTINE[i]=clone(roots[i]);
    snapshotted=true;
  }
  function restore(){
    const roots=collectRoots();
    for(let i=0;i<roots.length;i++){
      const live=roots[i],src=PRISTINE[i];
      if(!live||!src)continue;
      for(const k in live){if(Object.prototype.hasOwnProperty.call(live,k))delete live[k];}
      for(const k in src){live[k]=clone(src[k]);}
    }
  }
  /* English dialogue references terms as [[English term]]; alias the glossary
     so showTerm() still resolves them. */
  function aliasGlossary(){
    if(typeof GLOSSARY==='undefined')return;
    Object.keys(GLOSSARY).forEach(function(k){
      const en=pairs[k];
      if(en&&en!==k&&!GLOSSARY[en])GLOSSARY[en]=GLOSSARY[k];
    });
  }
  function localizeAll(){
    snapshot();
    if(lang!=='en')return;
    STATS.total=0;STATS.hit=0;
    const roots=collectRoots();
    for(let i=0;i<roots.length;i++)walk(roots[i]);
    aliasGlossary();
  }
  function coverage(){
    const pct=STATS.total?Math.round(STATS.hit*100/STATS.total):100;
    return t('中文：全部内容。英文：界面与系统全文，故事文本已译 '+pct+'%（'+STATS.hit+'/'+STATS.total+' 处）；未译处保留中文原文。',
             'Chinese: everything. English: full interface and systems, plus '+pct+'% of story text ('+STATS.hit+'/'+STATS.total+' strings); untranslated passages keep their source text.');
  }
  function selector(id){return '<label class="language-control" for="'+id+'">Language / 语言 <select class="language-select" id="'+id+'"><option value="zh-CN">简体中文</option><option value="en">English</option></select></label>';}
  function set(next){
    if(next!=='en'&&next!=='zh-CN')return;
    lang=next;S.language=next;save();
    restore();localizeAll();apply();
    document.querySelectorAll('[data-language-coverage]').forEach(function(el){el.textContent=coverage();});
    document.dispatchEvent(new CustomEvent('languagechange'));
  }
  document.addEventListener('change',function(e){if(e.target.matches('.language-select'))set(e.target.value);});
  document.addEventListener('DOMContentLoaded',function(){localizeAll();apply();document.querySelectorAll('[data-language-coverage]').forEach(function(el){el.textContent=coverage();});});
  return {t,text,apply,set,selector,coverage,localizeAll,get language(){return lang;}};
})();
