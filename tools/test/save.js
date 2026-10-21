// node tools/test/save.js — persistent progress regression tests; no browser required.
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../../js/core/save.js'),'utf8');
function game(initial={},failWrite=false){
  const data=new Map(Object.entries(initial)),messages=[];
  const ctx=vm.createContext({
    localStorage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>{if(failWrite)throw Error('quota');data.set(k,v);},removeItem:k=>data.delete(k)},
    document:{addEventListener(){},getElementById(){return null;}},
    toast:m=>messages.push(m),setTimeout,console
  });
  vm.runInContext(source,ctx);
  return {run:s=>vm.runInContext(s,ctx),data,messages};
}
let checks=0;
function test(name,fn){fn();checks++;console.log('ok '+name);}
const base=JSON.stringify({v:4,profile:{name:'简'},rep:19});
test('missing nested fields migrate without losing progress',()=>{
  const g=game({SSv4:base});assert.equal(g.run('S.rep'),19);assert.equal(g.run('S.profile.hair'),'tied');
  assert.equal(g.run('S.owned.seal[0]'),'zhu');
});
test('corrupt primary recovers valid automatic backup',()=>{
  const g=game({SSv4:'{broken','SSv4.backup':base});assert.equal(g.run('S.rep'),19);
  assert.match(g.run('SAVE_STATUS.message'),/自动备份/);
  assert.equal(g.run('save()'),true);assert.equal(g.data.get('SSv4.backup'),base);
});
test('corrupt primary without backup is never overwritten by gameplay',()=>{
  const g=game({SSv4:'{broken'});assert.equal(g.run('SAVE_STATUS.blocked'),true);
  assert.equal(g.run('S.rep=99;save()'),false);assert.equal(g.data.get('SSv4'),'{broken');
});
test('nested type corruption is detected',()=>{
  for(const bad of [{profile:null},{laws:null},{owned:{seal:null}},{ch:{ch1:null}},{pen:{letters:[null],arts:[]}},{work:{week:null}}]){
    const raw=JSON.stringify({v:4,...bad}),g=game({SSv4:raw});
    assert.equal(g.run('SAVE_STATUS.blocked'),true);assert.equal(g.data.get('SSv4'),raw);
  }
});
test('write failures are visible and retain live progress',()=>{
  const g=game({SSv4:base},true);assert.equal(g.run('S.rep=24;save()'),false);
  assert.equal(g.run('S.rep'),24);assert.equal(g.data.get('SSv4'),base);
  assert.match(g.run('SAVE_STATUS.message'),/保存未成功/);assert.equal(g.messages.length,1);
});
test('last valid version is backed up on each successful save',()=>{
  const g=game({SSv4:base});g.run('S.rep=20;save()');
  assert.equal(JSON.parse(g.data.get('SSv4.backup')).rep,19);
  assert.equal(JSON.parse(g.data.get('SSv4')).rep,20);
});
test('legacy migration preserves chapters and secretary progress',()=>{
  const old={theater:{ch1:true,ch4:true},rep:8,work:{day:6,min:600,energy:42,ot:480},reviews:{ch4:{grade:'胜诉'}},laws:['a']};
  const g=game({SLv3BOX:JSON.stringify(old)});
  assert.equal(g.run('S.ch.ch4.done'),true);assert.equal(g.run('S.work.ot'),480);
  assert.equal(g.run('S.focus'),42);assert.equal(g.run('S.rep'),8);
});
test('export envelope can round-trip and restore progress',()=>{
  const g=game({SSv4:base});
  assert.equal(g.run('SAVE.import(JSON.stringify({format:"StarSeaCovenant",version:1,state:{v:4,profile:{name:"林"},rep:31}}))'),true);
  assert.equal(g.run('S.profile.name'),'林');assert.equal(g.run('S.rep'),31);
  const reload=game(Object.fromEntries(g.data));assert.equal(reload.run('S.rep'),31);
});
test('unrecognized, future and prototype payloads are rejected without mutation',()=>{
  const g=game({SSv4:base});
  for(const text of ['null','{}','[]','{"v":99,"profile":{}}','{"v":4,"profile":{},"__proto__":{}}','{"format":"StarSeaCovenant","version":99}']){
    assert.throws(()=>g.run('SAVE.import('+JSON.stringify(text)+')'));assert.equal(g.data.get('SSv4'),base);
  }
});
test('import quota failure preserves current in-memory progress',()=>{
  const g=game({SSv4:base},true);
  assert.equal(g.run('SAVE.import(\'{"v":4,"profile":{},"rep":40}\')'),false);
  assert.equal(g.run('S.rep'),19);
});
test('reset failure does not report success or discard live progress',()=>{
  const g=game({SSv4:base},true);assert.equal(g.run('SAVE.reset()'),false);assert.equal(g.run('S.rep'),19);
});
test('explicit reset clears fallback copies and legacy resurrection',()=>{
  const g=game({SSv4:'{broken','SSv4.backup':base,SLv3BOX:'{"theater":{"ch1":true},"rep":5}'});
  assert.equal(g.run('SAVE.reset()'),true);assert.equal(g.run('S.rep'),0);
  assert.equal(g.data.has('SLv3BOX'),false);assert.equal(g.data.has('SSv4.backup'),false);
  assert.equal(game(Object.fromEntries(g.data)).run('S.rep'),0);
});
test('valid import lifts corrupt-save lock',()=>{
  const g=game({SSv4:'broken'});assert.equal(g.run('SAVE.import('+JSON.stringify(base)+')'),true);
  assert.equal(g.run('SAVE_STATUS.blocked'),false);assert.equal(g.run('save()'),true);
});
console.log(checks+' save regression groups passed.');
