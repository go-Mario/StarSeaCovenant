"use strict";
/* Explicit bilingual copy. Unknown legacy narrative stays in its source language. */
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
  function t(zh,en){return lang==='en'?en:zh;}
  function text(zh){return lang==='en'?(pairs[zh]||zh):zh;}
  function apply(root){
    root=root||document.body;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let n;
    while((n=walker.nextNode())){
      if(!n.parentElement||n.parentElement.closest('script,style,textarea,[data-no-localize]'))continue;
      let orig=originals.get(n);
      if(orig===undefined){if(!Object.prototype.hasOwnProperty.call(pairs,n.textContent.trim()))continue;orig=n.textContent;originals.set(n,orig);}
      n.textContent=orig.replace(orig.trim(),text(orig.trim()));
    }
    root.querySelectorAll('[aria-label],[title],[placeholder]').forEach(function(el){
      ['aria-label','title','placeholder'].forEach(function(attr){
        const value=el.getAttribute(attr);if(!value)return;
        const key='data-source-'+attr;let original=el.getAttribute(key);
        if(!original&&Object.prototype.hasOwnProperty.call(pairs,value)){original=value;el.setAttribute(key,value);}
        if(original)el.setAttribute(attr,text(original));
      });
    });
    document.querySelectorAll('.language-select').forEach(function(el){el.value=lang;});
    document.documentElement.lang=lang;
    document.title=t('星海公约','Stellar Covenant');
  }
  function selector(id){return '<label class="language-control" for="'+id+'">Language / 语言 <select class="language-select" id="'+id+'"><option value="zh-CN">简体中文</option><option value="en">English · preview</option></select></label>';}
  function coverage(){return t('中文：全部内容。英文：主要入口与「回信前夜」三条人物线；原有六章暂保留中文。','English covers key navigation and all three Night Shift stories. The original cases and some older activities remain in Chinese.');}
  function set(next){
    if(next!=='en'&&next!=='zh-CN')return;
    lang=next;S.language=next;save();apply();
    document.querySelectorAll('[data-language-coverage]').forEach(function(el){el.textContent=coverage();});
    document.dispatchEvent(new CustomEvent('languagechange'));
  }
  document.addEventListener('change',function(e){if(e.target.matches('.language-select'))set(e.target.value);});
  document.addEventListener('DOMContentLoaded',function(){apply();document.querySelectorAll('[data-language-coverage]').forEach(function(el){el.textContent=coverage();});});
  return {t,text,apply,set,selector,coverage,get language(){return lang;}};
})();
