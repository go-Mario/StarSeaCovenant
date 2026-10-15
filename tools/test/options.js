// 选项长度检查：有对错之分的每一组选项，正确答案不能明显比错误答案长（玩家会凭字数猜答案）
// 规则：最长的一项不超过其余平均长度的 1.25 倍；任意两项相差不超过 1.8 倍
// 用法：node tools/test/options.js（需要先起本地服务器）
let PW;try{PW=require('playwright');}catch(e){PW=require('/opt/node-tools/node_modules/playwright');}
const {chromium}=PW;
const BASE=process.env.SS_URL||'http://127.0.0.1:8765/index.html';
(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.goto(BASE+'?opts=1#hub');await p.waitForTimeout(900);
const res=await p.evaluate(()=>{
  const out=[];const strip=s=>String(s||'').replace(/<[^>]+>/g,'').replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,(_,a,b)=>b||a).replace(/\{我\}/g,'简');
  const txt=o=>typeof o==='string'?o:(o.x||o.t||o.text||o.n||o.name||o.s||'');
  function isCorrect(o){if(typeof o!=='object')return null;if('ok' in o)return !!o.ok;if('legal' in o)return o.legal==='ok';if('good' in o)return !!o.good;return null;}
  function walk(v,path){
    if(Array.isArray(v)){
      const objs=v.filter(x=>x&&typeof x==='object'&&!Array.isArray(x));
      if(objs.length>=2&&objs.length===v.length&&objs.some(o=>isCorrect(o)!==null)&&objs.every(o=>txt(o))){
        out.push({path,opts:objs.map(o=>({c:isCorrect(o),n:strip(txt(o)).length,t:strip(txt(o)).slice(0,40)}))});
      }
      v.forEach((x,i)=>walk(x,path+'['+i+']'));
    }else if(v&&typeof v==='object'){for(const k in v)walk(v[k],path+'.'+k);}
  }
  for(const id in CHAPTERS)walk(CHAPTERS[id].script||CHAPTERS[id],id);
  if(typeof LEAN_READ!=='undefined')for(const k in LEAN_READ)walk(LEAN_READ[k].opts,'lean.'+k);/* 第四章的“翻旧账”选项写在机制代码里 */
  BENCH.forEach(bp=>out.push({path:'bench.'+bp.id,opts:bp.opts.map((o,i)=>({c:i===bp.ans,n:strip(o).length,t:strip(o).slice(0,40)}))}));
  return out;});
let flagged=0;
res.forEach(r=>{const ns=r.opts.map(o=>o.n),cor=r.opts.filter(o=>o.c).map(o=>o.n),inc=r.opts.filter(o=>o.c===false).map(o=>o.n);
  if(!cor.length||!inc.length)return;
  const cmax=Math.max(...cor),imax=Math.max(...inc),imin=Math.min(...inc),avgI=inc.reduce((a,b)=>a+b,0)/inc.length;
  const ratio=cmax/avgI,longest=cmax>imax;
  const bad=longest&&ratio>1.25||Math.max(...ns)/Math.min(...ns)>1.8;
  if(bad)flagged++;
  console.log((bad?'!! ':'   ')+r.path.padEnd(40),'correct',cor.join('/'),'| wrong',inc.join('/'),'| ratio',ratio.toFixed(2));
});
console.log('sets',res.length,'flagged',flagged);console.log(flagged?'FAIL':'ok');
await b.close();process.exit(flagged?1:0);})();
