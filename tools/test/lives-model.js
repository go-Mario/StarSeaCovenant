const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'../..'),ctx=vm.createContext({console});
for(const f of ['content','cases','model'])vm.runInContext(fs.readFileSync(path.join(root,'js/lives/'+f+'.js'),'utf8'),ctx);
const out=vm.runInContext(`(()=>{
 let combinations=0;const settlements=new Set();for(const role of Object.keys(LIVES.roles))for(let mask=0;mask<64;mask++){
  const r=LIFE_MODEL.run(role);for(let a=0;a<6;a++){
   if(LIFE_MODEL.choose(r,0))throw Error('Choice allowed before investigation');
   LIFE_MODEL.read(r,0);LIFE_MODEL.read(r,1);if(a===0)r.clockAligned=true;LIFE_MODEL.solve(r);
   if(a%2===0){if(!LIFE_MODEL.rest(r)||LIFE_MODEL.rest(r))throw Error('Rest must be idempotent');}
   if(!LIFE_MODEL.choose(r,(mask>>a)&1)||LIFE_MODEL.choose(r,0))throw Error('Duplicate choice');
   LIFE_MODEL.validate({version:1,language:'en',active:role,runs:{[role]:r}});
   LIFE_MODEL.next(r);
  }
  if(r.act!==6||r.history.length!==6||LIFE_MODEL.choose(r,0))throw Error('Ending');
  settlements.add(LIFE_MODEL.world(r).settlement);const state={version:1,language:'zh',active:role,runs:{[role]:r}};
  LIFE_MODEL.decode(JSON.stringify({format:'StellarLives',state}));combinations++;
 }
 let bilingual=0;function walk(x){if(!x||typeof x!=='object')return;if('zh' in x||'en' in x){if(typeof x.zh!=='string'||typeof x.en!=='string'||!x.zh||!x.en||/[\\u3400-\\u9fff]/.test(x.en))throw Error('Incomplete translation');bilingual++;}else Object.values(x).forEach(walk);}
 walk(LIVES);walk(SCENES);walk(LIFE_CASES);walk(RIPPLE);walk(SETTLEMENTS);
 for(const role of Object.keys(LIVES.roles)){if(SCENES[role].length!==6||SCENES[role].some(x=>x.docs.length!==2))throw Error('Missing scenes');}
 let damaged=0;for(const mutate of [s=>s.version=9,s=>s.language='xx',s=>s.active='missing',s=>s.runs.lin.act=9,s=>s.runs.lin.read=[9],s=>s.runs.lin.history=[{choice:9,rested:false}],s=>s.runs.lin.cases={bad:0},s=>s.runs.lin.clockAligned='yes']){const s=LIFE_MODEL.fresh();s.runs.lin=LIFE_MODEL.run('lin');mutate(s);try{LIFE_MODEL.validate(s);throw Error('not rejected');}catch(e){if(e.message==='not rejected')throw e;damaged++;}}
 if(settlements.size!==3)throw Error('Missing world outcomes');return {combinations,bilingual,damaged,settlements:[...settlements]};})()`,ctx);
assert.equal(out.combinations,256);assert.equal(out.damaged,8);console.log(out);
