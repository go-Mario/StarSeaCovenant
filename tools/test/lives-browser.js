const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const BASE=process.env.SS_URL||'http://127.0.0.1:8766/lives.html',OUT=process.argv[2]||path.join(__dirname,'out/lives');
(async()=>{await fs.mkdir(OUT,{recursive:true});const browser=await chromium.launch();try{
 for(const [language,width,height] of [['zh',1365,900],['en',390,844]]){
  const ctx=await browser.newContext({viewport:{width,height}}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE);await page.selectOption('#language',language);assert.match(await page.locator('[data-act=\"sound\"]').textContent(),/Sound|音效/);await page.click('[data-act=\"sound\"]');assert.equal(await page.evaluate(()=>LIFE_AUDIO.enabled),true);await page.click('[data-act=\"sound\"]');
  await page.screenshot({path:path.join(OUT,language+'-home.png'),fullPage:true});
  for(const role of ['lin','su','xu','jian']){
   await page.click('[data-act="select"][data-id="'+role+'"]');await page.click('[data-act="start"]');
   for(let act=0;act<6;act++){
    await page.click('.hotspot[data-id="0"]');await page.click('.hotspot[data-id="1"]');
    if(act===0){await page.click('.hotspot[data-id="2"]');await page.locator('#clockShift').fill('84');assert.equal(await page.locator('#adjustedTime').textContent(),'03:17:20');await page.click('[data-act="alignClock"]');assert.equal(await page.evaluate(id=>LIFE.state.runs[id].clockAligned,role),true);await page.screenshot({path:path.join(OUT,language+'-'+role+'-scene.png'),fullPage:true});}
    const correct=(3-((act+['lin','su','xu','jian'].indexOf(role))%3))%3;
    await page.click('[data-act="deduce"][data-id="'+((correct+1)%3)+'"]');
    assert.equal(await page.locator('.hint').isVisible(),true);
    await page.click('[data-act="deduce"][data-id="'+correct+'"]');
    if(act===0){await page.click('[data-act="rest"]');await page.click('[data-act="takeRest"]');await page.click('[data-act="resume"]');}
    await page.click('[data-act="choose"][data-id="'+(act%2)+'"]');
    await page.reload();await page.click('[data-act="resume"]'); // Completed scene survives restart.
    assert.equal(await page.locator('[data-act="next"]').isVisible(),true);
    if(language==='en'){
     const text=await page.locator('#app').evaluate(el=>{const clone=el.cloneNode(true);clone.querySelectorAll('option').forEach(n=>n.remove());return clone.textContent;});
     assert.equal(/[\u3400-\u9fff]/.test(text),false,'English UI contains Chinese');
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'page overflows');
    await page.click('[data-act="next"]');
   }
   assert.equal(await page.evaluate(id=>LIFE.state.runs[id].act,role),6);
   await page.screenshot({path:path.join(OUT,language+'-'+role+'-ending.png'),fullPage:true});
   if(role==='jian'){
    // Legal cases remain available after finishing a life.
    await page.click('[data-act="cases"]');
    for(let i=0;i<6;i++){await page.click('[data-act="case"][data-id="'+i+'"]');await page.click('[data-act="caseChoice"][data-id="'+i%2+'"]');await page.click('[data-act="cases"]');}
    assert.equal(await page.evaluate(()=>Object.keys(LIFE.state.runs.jian.cases).length),6);
   }
   await page.click('[data-act="home"]');
  }
  await page.click('[data-act="settings"]');
  const download=page.waitForEvent('download');await page.click('[data-act="export"]');const file=path.join(OUT,language+'-save.json');await(await download).saveAs(file);
  await page.setInputFiles('#saveFile',file);await page.click('[data-act="confirm"]');assert.equal(await page.evaluate(()=>LIFE.state.runs.lin.act),6);
  await page.click('[data-act="settings"]');
  await page.setInputFiles('#saveFile',{name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"version":9}')});
  await page.waitForFunction(()=>document.getElementById('notice').textContent.length>0);assert.equal(await page.evaluate(()=>LIFE.state.runs.lin.act),6);
  // Rest games are optional and can be entered without resetting a finished life.
  await page.click('[data-act="resume"]');await page.click('[data-act="rest"]');
  await page.click('[data-act="restGame"][data-id="dock"]');
  for(let i=0;i<9;i++){await page.click('[data-act="dockMove"][data-id="up"]');await page.click('[data-act="dockMove"][data-id="right"]');}
  assert.match(await page.locator('.rest-center [role="status"]').textContent(),/对接完成|Docking complete/);
  await page.click('[data-act="rest"]');await page.click('[data-act="restGame"][data-id="tune"]');
  for(const [i,v] of [24,68,41].entries()){const slider=page.locator('[data-dial="'+i+'"]');await slider.focus();await slider.press('Home');for(let j=0;j<v;j++)await slider.press('ArrowRight');}
  assert.equal(await page.locator('#tuneStatus').textContent().then(Boolean),true);
  await page.click('[data-act="rest"]');await page.click('[data-act="restGame"][data-id="memory"]');
  for(let round=0;round<8;round++){const known={};for(let i=0;i<8;i++){if(await page.locator('[data-act="flip"][data-id="'+i+'"]').getAttribute('class').then(x=>x.includes('matched')))continue;await page.click('[data-act="flip"][data-id="'+i+'"]');const val=await page.locator('[data-act="flip"][data-id="'+i+'"]').textContent();if(known[val]!==undefined){await page.click('[data-act="flip"][data-id="'+known[val]+'"]');await page.click('[data-act="flip"][data-id="'+i+'"]');}else known[val]=i;}}
  assert.equal(await page.locator('.memory .matched').count(),8);
  assert.deepEqual(errors,[]);console.log('ok '+language+': four lives, six cases, English coverage, optional games, saves and layout');await ctx.close();
 }
 const ctx=await browser.newContext(),page=await ctx.newPage();await page.goto(BASE);
 await page.evaluate(()=>{localStorage.setItem('SS_LIVES_v1','broken');localStorage.removeItem('SS_LIVES_v1.backup');});await page.reload();
 assert.equal(await page.evaluate(()=>LIFE.blocked),true);await page.click('[data-act="select"][data-id="su"]');await page.click('[data-act="start"]');
 assert.equal(await page.evaluate(()=>localStorage.getItem('SS_LIVES_v1')),'broken');
 const network=[];page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
 await page.goto(require('node:url').pathToFileURL(path.join(__dirname,'../../dist/lives.html')).href);
 await page.click('[data-act="select"][data-id="lin"]');await page.click('[data-act="start"]');await page.click('.hotspot[data-id="0"]');
 assert.deepEqual(network,[]);console.log('ok corrupt-save protection and offline file without network');await ctx.close();
 const recovery=await browser.newContext(),rp=await recovery.newPage();await rp.goto(BASE);
 await rp.evaluate(()=>{const s=LIFE_MODEL.fresh();s.active='lin';s.runs.lin=LIFE_MODEL.run('lin');s.runs.lin.read=[0];localStorage.setItem('SS_LIVES_v1.backup',JSON.stringify(s));localStorage.setItem('SS_LIVES_v1','broken');localStorage.setItem('SLv3BOX','legacy-test');});
 await rp.reload();assert.equal(await rp.evaluate(()=>LIFE.blocked),false);assert.deepEqual(await rp.evaluate(()=>LIFE.state.runs.lin.read),[0]);
 await rp.click('[data-act="resume"]');await rp.click('.hotspot[data-id="1"]');
 await rp.selectOption('#language','en');assert.deepEqual(await rp.evaluate(()=>LIFE.state.runs.lin.read),[0,1]);assert.equal(await rp.evaluate(()=>LIFE.state.language),'en');
 await rp.evaluate(()=>localStorage.removeItem('SS_LIVES_v1'));await rp.reload();assert.equal(await rp.evaluate(()=>LIFE.state.active),'lin');assert.equal(await rp.evaluate(()=>LIFE.blocked),false);
 // Quota failure keeps in-memory progress and refuses to replace it on import.
 await rp.click('[data-act="resume"]');await rp.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Full','QuotaExceededError');};});
 await rp.click('.hotspot[data-id="2"]');assert.equal(await rp.evaluate(()=>LIFE.state.runs.lin.read.includes(2)),true);assert.equal(await rp.locator('.warning').isVisible(),true);
 const before=await rp.evaluate(()=>JSON.stringify(LIFE.state));await rp.click('[data-act="settings"]');
 const replacement={version:1,language:'zh',active:null,runs:{}};
 await rp.setInputFiles('#saveFile',{name:'valid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(replacement))});await rp.click('[data-act="confirm"]');
 assert.equal(await rp.evaluate(()=>JSON.stringify(LIFE.state)),before);assert.equal(await rp.evaluate(()=>localStorage.getItem('SLv3BOX')),'legacy-test');
 console.log('ok backup recovery, missing primary, mid-scene language switch, quota failure, import safety and legacy preservation');await recovery.close();
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
