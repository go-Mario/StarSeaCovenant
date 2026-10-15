// 星图截图：全貌、缩放、降落各星球、返回
let PW;try{PW=require('playwright');}catch(e){PW=require('/opt/node-tools/node_modules/playwright');}
const {chromium}=PW;const OUT=process.argv[2]||__dirname+'/out/map';
(async()=>{
  require('fs').mkdirSync(OUT,{recursive:true});
  const b=await chromium.launch();
  for(const vp of [{n:'phone',w:390,h:844,m:true},{n:'desk',w:1280,h:760}]){
    const ctx=await b.newContext({viewport:{width:vp.w,height:vp.h},deviceScaleFactor:vp.m?2:1,isMobile:!!vp.m,hasTouch:!!vp.m});
    const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
    await p.goto((process.env.SS_URL||'http://127.0.0.1:8765/index.html')+'#hub');await p.waitForTimeout(1600);
    await p.screenshot({path:OUT+'/'+vp.n+'-1fit.png'});
    await p.waitForTimeout(1200);await p.screenshot({path:OUT+'/'+vp.n+'-1b-cue.png'});
    await p.evaluate(()=>StarMap.zoomBy(.35));await p.waitForTimeout(700);
    await p.screenshot({path:OUT+'/'+vp.n+'-2far.png'});
    await p.evaluate(()=>{StarMap.fit(false);StarMap.zoomBy(2.2);});await p.waitForTimeout(700);
    await p.screenshot({path:OUT+'/'+vp.n+'-3near.png'});
    for(const w of ['theater','leo','moon','relax','bench','archive']){
      await p.evaluate(()=>StarMap.fit(false));await p.waitForTimeout(200);
      await p.evaluate(id=>StarMap.land(id),w);await p.waitForTimeout(1700);
      await p.screenshot({path:OUT+'/'+vp.n+'-4-'+w+'.png'});
      await p.evaluate(()=>PlanetView.close());await p.waitForTimeout(900);
    }
    await p.screenshot({path:OUT+'/'+vp.n+'-5back.png'});
    console.log(vp.n,'errors',errs.length?errs:'none');
    await ctx.close();
  }
  await b.close();
})();
