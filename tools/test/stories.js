// Functional coverage of shared-event state, languages, reloads and responsive UI.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const BASE=process.env.SS_URL||'http://127.0.0.1:8766/index.html';
const OUT=process.argv[2]||path.join(__dirname,'out/stories');
(async()=>{
  await fs.mkdir(OUT,{recursive:true});
  const browser=await chromium.launch();
  try{
    for(const [lang,width,height] of [['zh-CN',1280,850],['en',390,844]]){
      const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage(),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.goto(BASE+'?lang='+lang+'#stories');
      await page.locator('[data-role="lin"]').waitFor();
      await page.waitForFunction(()=>getComputedStyle(document.getElementById('boot')).opacity==='0');
      await page.screenshot({path:path.join(OUT,lang+'-lobby.png')});
      assert.equal(await page.evaluate(()=>document.documentElement.lang),lang);
      for(const [id,answer,choice] of [['lin',[1,2,0],'handover'],['li',[1],'open'],['chen',[0],'limited']]){
        await page.click('[data-role="'+id+'"]');
        assert.equal(await page.locator('#nsProceed').isDisabled(),true);
        const docs=await page.locator('[data-doc]').evaluateAll(es=>es.map(e=>e.dataset.doc));
        await page.fill('#nsSearch','xyz-no-such-record');
        assert.equal(await page.locator('#nsSearchEmpty').isVisible(),true);
        await page.fill('#nsSearch','');
        for(const doc of docs.slice(0,2))await page.click('[data-doc="'+doc+'"]');
        await page.click('#nsProceed');
        await page.click('[data-answer="'+(id==='lin'?0:id==='li'?0:1)+'"]');
        assert.equal(await page.locator('#nsStatus').textContent().then(Boolean),true);
        for(const a of answer)await page.click('[data-answer="'+a+'"]');
        await page.click('#nsProceed');
        if(id==='li')assert.match(await page.locator('#nsCross').textContent(),/林渡|Lin Du/);
        if(id==='chen')assert.match(await page.locator('#nsCross').textContent(),/开放|opened/);
        await page.screenshot({path:path.join(OUT,lang+'-'+id+'.png')});
        await page.click('[data-choice="'+choice+'"]');
        assert.equal(await page.evaluate(c=>Stories.complete(c),choice),false);
        const overflow=await page.evaluate(()=>{const h=document.getElementById('stories');return h.scrollWidth>h.clientWidth+1;});
        assert.equal(overflow,false,'mobile story must not overflow');
        await page.click('#nsOthers');
      }
      assert.equal(await page.evaluate(()=>S.stories.nightshift.log.length),3);
      assert.equal(await page.evaluate(()=>S.rep),0);
      assert.equal(await page.evaluate(()=>S.stories.nightshift.routes.lin.ot),480);
      await page.selectOption('#storyLanguage',lang==='en'?'zh-CN':'en');
      await page.reload();await page.locator('[data-role="lin"]').waitFor();
      assert.equal(await page.evaluate(()=>S.stories.nightshift.log.length),3);
      // Explicit URL language takes precedence; the saved preference remains available.
      await page.goto(BASE+'#stories');await page.locator('[data-role="lin"]').waitFor();
      assert.equal(await page.evaluate(()=>I18N.language),lang==='en'?'zh-CN':'en');
      assert.deepEqual(errors,[]);
      console.log('ok '+lang+': all three UI routes, wrong answers, search, handovers, language and reload');
      await context.close();
    }
    const page=await browser.newPage();await page.goto(BASE+'#stories');await page.locator('[data-role="lin"]').waitFor();
    const result=await page.evaluate(()=>{
      const orders=[['lin','li','chen'],['lin','chen','li'],['li','lin','chen'],['li','chen','lin'],['chen','lin','li'],['chen','li','lin']];
      let count=0;
      for(const order of orders)for(let mask=0;mask<8;mask++){
        delete S.stories.nightshift;
        for(const id of order){
          Stories.chooseRole(id);const r=NIGHT_SHIFT.roles[id];
          r.docs.slice(0,2).forEach(d=>Stories.readDoc(d.id));Stories.advance();
          (Array.isArray(r.task.answer)?r.task.answer:[r.task.answer]).forEach(n=>Stories.answer(n));Stories.advance();
          const choice=r.choices[(mask>>['lin','li','chen'].indexOf(id))&1].id;
          if(!Stories.complete(choice)||Stories.complete(choice))throw Error('completion not atomic');
        }
        const restored=SAVE.decode(JSON.stringify({format:'StarSeaCovenant',version:1,state:S}));
        if(restored.stories.nightshift.log.length!==3)throw Error('missing ending');count++;
      }
      const good=JSON.stringify(S);let rejected=0;
      for(const mutate of [s=>s.stories.nightshift.routes.lin.phase=9,s=>s.stories.nightshift.log.push({role:'bad',choice:'bad'}),s=>s.stories.nightshift.routes.lin.choice='bad',s=>s.stories.nightshift.routes.li.seen.push('bad'),s=>s.stories.nightshift.routes.chen.received.push('bad')]){
        const s=JSON.parse(good);mutate(s);try{SAVE.decode(JSON.stringify(s));}catch(e){rejected++;}
      }
      return {count,rejected};
    });
    assert.deepEqual(result,{count:48,rejected:5});
    console.log('ok 48 role-order/ending combinations and 5 damaged-story save cases');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
