"use strict";
/* =====================================================================
   通用小工具。所有脚本都是普通 <script>，共享全局作用域，
   这样直接双击 index.html（file://）也能跑，不依赖构建工具。
   ===================================================================== */
function showFatal(m){const b=document.getElementById('fatalbox');if(b){b.style.display='block';b.textContent='游戏引擎报错（其余功能仍可使用）\n'+m;}}
window.addEventListener('error',function(e){showFatal((e.message||'未知错误')+'  @'+(e.filename||'').split('/').pop()+':'+(e.lineno||'?'));});
window.addEventListener('unhandledrejection',function(e){showFatal('Promise: '+((e.reason&&e.reason.message)||e.reason||'未知'));});

const $=function(sel,root){return (root||document).querySelector(sel);};
const $$=function(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel));};
const byId=function(id){return document.getElementById(id);};
function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function lerp(a,b,t){return a+(b-a)*t;}
function rng(seed){let s=(seed>>>0)||1;return function(){s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function stripTags(t){return String(t||'').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();}
function cnNum(n){return ['零','一','二','三','四','五','六','七','八','九','十'][n]||String(n);}
function todayKey(){const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}
function todayStr(){const d=new Date();return (d.getMonth()+1)+'月'+d.getDate()+'日';}
function dayHash(){const d=new Date();let h=d.getFullYear()*372+(d.getMonth()+1)*31+d.getDate();return (h*2654435761>>>0)%997;}
function el(tag,cls,html){const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e;}
function icon(id,cls){return '<svg class="ic '+(cls||'')+'"><use href="#'+id+'"/></svg>';}
function buzz(p){if(navigator.vibrate)try{navigator.vibrate(p||12);}catch(e){}}
function vw(){return window.innerWidth;}
function vh(){return window.innerHeight;}
const DPR=function(){return Math.min(window.devicePixelRatio||1,2);};

/* 提示条 */
let _toastT=null;
function toast(msg,ms){const t=byId('toast');if(!t)return;t.innerHTML=msg;t.classList.add('on');clearTimeout(_toastT);_toastT=setTimeout(function(){t.classList.remove('on');},ms||1900);}

/* 一次性转场：黑幕落下，换场，黑幕抬起 */
function irisTo(fn){
  const ir=byId('iris');ir.classList.add('on');
  return new Promise(function(res){setTimeout(async function(){try{await fn();}catch(e){showFatal(e.message);}setTimeout(function(){ir.classList.remove('on');res();},60);},460);});
}

/* 术语解释气泡：文本里写成 [[绝对责任]]，渲染时变成可点的术语 */
function termify(html){
  return String(html).replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,function(_,key,label){
    return '<span class="term" data-term="'+esc(key)+'">'+(label||key)+'</span>';
  });
}
function showTerm(key,x,y){
  const g=(typeof GLOSSARY!=='undefined')&&GLOSSARY[key];
  if(!g)return;
  const tip=byId('termTip');
  tip.innerHTML='<b>'+esc(key)+'</b>'+g.t+(g.src?'<span class="src">'+g.src+'</span>':'');
  tip.classList.add('on');
  const w=Math.min(vw()*.88,340);
  tip.style.left=clamp(x-w/2,10,vw()-w-10)+'px';
  const below=y+24, h=tip.offsetHeight||120;
  tip.style.top=(below+h>vh()-10?Math.max(10,y-h-16):below)+'px';
  if(typeof SAVE!=='undefined'){SAVE.seeTerm(key);}
  if(typeof SFX!=='undefined')SFX.page();
}
function hideTerm(){const t=byId('termTip');if(t)t.classList.remove('on');}
document.addEventListener('click',function(e){
  const t=e.target&&e.target.closest&&e.target.closest('.term');
  if(t){e.stopPropagation();e.preventDefault();const r=t.getBoundingClientRect();showTerm(t.getAttribute('data-term'),r.left+r.width/2,r.bottom);return;}
  if(!(e.target.closest&&e.target.closest('#termTip')))hideTerm();
},true);

/* 文本模板：{我} 换成玩家名字 */
function fill(t){
  const name=(typeof S!=='undefined'&&S.profile&&S.profile.name)||'简';
  return termify(String(t==null?'':t).replace(/\{我\}/g,function(){return esc(name);}));
}
