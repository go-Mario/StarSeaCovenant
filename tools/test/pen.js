// 尾声 · 回信台：没通关第六章时上锁；通关后写一封给远音的信（发出动画）、一封时间胶囊、起草两条公约、删一条、存图。
// 用法：node tools/test/pen.js [输出目录]；需要先在仓库根目录起一个静态服务器，见 docs/DESIGN.md
let PW;try{PW=require('playwright');}catch(e){PW=require('/opt/node-tools/node_modules/playwright');}
const {chromium}=PW;
const BASE=process.env.SS_URL||'http://127.0.0.1:8765/index.html';
const OUT=process.argv[2]||__dirname+'/out/pen';require('fs').mkdirSync(OUT,{recursive:true});
const SAVE=function(done6){
  const ch={};['ch1','ch2','ch3','ch4','ch5','ch6'].forEach(function(id){if(id!=='ch6'||done6)ch[id]={done:true,grade:'干净利落',best:'干净利落',picks:[]};});
  return JSON.stringify({v:4,profile:{name:'简',skin:3,hair:'tied',suit:0,created:true,introSeen:true,hubSeen:true},ch:ch,laws:[],precs:[],moralLog:[],leanLog:[],standing:3,judge:{},daily:{last:'',streak:0},rep:40,dust:100,hints:1,focus:80,
    owned:{seal:['zhu'],paper:['xuan']},equip:{seal:'zhu',paper:'xuan'},games:{},hist:[],terms:[],achs:[],tips:[],sound:false,bgm:false,lastPlay:'',reply:'你好。'});
};
const VPS=[['phone',390,844,true],['land',844,390,true],['desk',1280,800,false]];
(async()=>{
  const br=await chromium.launch();let fails=0;
  const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fails++;};
  for(const [vp,w,h,mob] of VPS){
    const ctx=await br.newContext({viewport:{width:w,height:h},deviceScaleFactor:2,isMobile:mob,hasTouch:mob,acceptDownloads:true});
    const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
    const tap=async sel=>{if(mob)await pg.tap(sel);else await pg.click(sel);};
    const shot=async n=>pg.screenshot({path:OUT+'/'+vp+'-'+n+'.png'});
    // 1) 第六章没过：节点上锁
    await pg.addInitScript(s=>{if(!sessionStorage.getItem('pen-seeded')){localStorage.setItem('SSv4',s);sessionStorage.setItem('pen-seeded','1');}},SAVE(false));
    await pg.goto(BASE+'?p='+vp+'#hub');await pg.waitForTimeout(900);
    await pg.evaluate(()=>StarMap.land('theater','pen'));await pg.waitForTimeout(1600);
    const locked=await pg.evaluate(()=>{const b=document.querySelector('#pvNodes .pn[data-id="pen"]');return b?b.className:'none';});
    ok(/st-locked/.test(locked),vp+' locked before ch6 ('+locked+')');
    await pg.evaluate(()=>document.querySelector('#pvNodes .pn[data-id="pen"]').click());await pg.waitForTimeout(300);
    ok(!(await pg.evaluate(()=>byId('pen').classList.contains('on'))),vp+' locked node does not open');
    // 2) 通关存档
    await pg.evaluate(s=>{localStorage.setItem('SSv4',s);},SAVE(true));
    await pg.goto(BASE+'?p2='+vp+'#hub');await pg.waitForTimeout(900);
    await pg.evaluate(()=>StarMap.land('theater','pen'));await pg.waitForTimeout(1600);
    const st=await pg.evaluate(()=>{const b=document.querySelector('#pvNodes .pn[data-id="pen"]');const r=b.getBoundingClientRect();return {c:b.className,inView:r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth};});
    ok(/st-open/.test(st.c)&&/next/.test(st.c),vp+' pen node open + next ('+st.c+')');ok(st.inView,vp+' pen node in view');
    await shot('0-planet');
    await tap('#pvNodes .pn[data-id="pen"]');await pg.waitForTimeout(500);
    ok(await pg.evaluate(()=>byId('pen').classList.contains('on')),vp+' desk opens');
    await shot('1-home');
    // 3) 写给远音
    await tap('#pen [data-m="far"]');await pg.waitForTimeout(300);
    await tap('#pen .pe-seed[data-s="0"]');
    await pg.focus('#peText');await pg.keyboard.type('我们收到了。这里有海，有山，也有很多还没解决的争吵。');
    await tap('#pen .pe-seed[data-s="4"]');
    const txt=await pg.inputValue('#peText');ok(txt.startsWith('你好。')&&txt.includes('如果你们也在看星星'),vp+' seeds insert ('+txt.length+')');
    await pg.fill('#peSign','简 · 青年席');
    await shot('2-compose');
    await tap('#peSend');await pg.waitForTimeout(800);await shot('3-sending');
    await pg.waitForFunction(()=>byId('peAfter')&&byId('peAfter').classList.contains('on'),null,{timeout:8000}).then(()=>ok(true,vp+' far letter sent'),()=>ok(false,vp+' far letter sent'));
    await shot('4-sent');
    const dl=pg.waitForEvent('download',{timeout:5000}).catch(()=>null);
    await tap('#peImg');const d=await dl;
    if(d){const p=OUT+'/'+vp+'-letter.png';await d.saveAs(p);ok(require('fs').statSync(p).size>20000,vp+' letter image saved');}else ok(false,vp+' letter image download');
    await tap('#peHome');await pg.waitForTimeout(300);
    // 4) 太短不让发
    await tap('#pen [data-m="future"]');await pg.waitForTimeout(300);
    await pg.fill('#peText','嗯');await tap('#peSend');await pg.waitForTimeout(300);
    ok(await pg.evaluate(()=>!!byId('peText')),vp+' too-short letter blocked');
    await pg.fill('#peText','你们那时候，月亮上有人住了吗？我们这一代人努力做对的一件事，是没有把天上弄得更乱。');
    await tap('#peSend');await pg.waitForTimeout(1600);await shot('5-capsule');
    await pg.waitForFunction(()=>byId('peAfter')&&byId('peAfter').classList.contains('on'),null,{timeout:6000}).then(()=>ok(true,vp+' capsule sealed'),()=>ok(false,vp+' capsule sealed'));
    await tap('#peHome');await pg.waitForTimeout(300);
    // 5) 起草公约
    await tap('#pen [data-m="law"]');await pg.waitForTimeout(300);await shot('6-topics');
    await tap('#pen .pe-topic[data-t="debris"]');await pg.waitForTimeout(300);
    await tap('#peSeed');await pg.focus('#peText');await pg.keyboard.press('End');await pg.keyboard.type('运营者应当在五年内让它离开拥挤的轨道；做不到的，承担清理费用。');
    await shot('7-write');
    await tap('#peCheck');await pg.waitForTimeout(300);
    const chk=await pg.evaluate(()=>$$('#pen .pe-chk').map(e=>e.classList.contains('ok')));
    ok(chk.length===3&&chk.every(Boolean),vp+' drafting check all three ('+chk+')');
    await shot('8-check');
    await tap('#peAdd');await pg.waitForTimeout(500);await shot('9-doc');
    await tap('#peMore');await tap('#pen .pe-topic[data-t="free"]');await pg.waitForTimeout(200);
    await pg.fill('#peText','每个人都可以抬头看星星。');await tap('#peCheck');await pg.waitForTimeout(200);
    const chk2=await pg.evaluate(()=>$$('#pen .pe-chk').map(e=>e.classList.contains('ok')));
    ok(chk2.filter(Boolean).length<3,vp+' check notices missing parts ('+chk2+')');
    await tap('#peAdd');await pg.waitForTimeout(300);
    let arts=await pg.evaluate(()=>S.pen.arts.length);ok(arts===2,vp+' two articles');
    const dl2=pg.waitForEvent('download',{timeout:5000}).catch(()=>null);await tap('#peImg');const d2=await dl2;
    if(d2){const p=OUT+'/'+vp+'-doc.png';await d2.saveAs(p);ok(true,vp+' doc image saved');}else ok(false,vp+' doc image download');
    // 删一条：第一次点只是确认
    await tap('#pen .pd-x >> nth=1');await pg.waitForTimeout(150);
    ok((await pg.evaluate(()=>S.pen.arts.length))===2,vp+' first tap only arms delete');
    await tap('#pen .pd-x.armed');await pg.waitForTimeout(200);
    ok((await pg.evaluate(()=>S.pen.arts.length))===1,vp+' second tap deletes');
    // 6) 回首页、信匣、重读
    await tap('#peBack');await pg.waitForTimeout(300);
    const rows=await pg.evaluate(()=>$$('#pen .pe-row').length);ok(rows===3,vp+' letter box rows ('+rows+')');
    await shot('10-box');
    await tap('#pen .pe-row:not(.doc) >> nth=0');await pg.waitForTimeout(300);await shot('11-read');
    ok(await pg.evaluate(()=>/2177/.test(byId('pen').textContent)),vp+' capsule reread');
    const sv=await pg.evaluate(()=>{const o=JSON.parse(localStorage.getItem('SSv4'));return {l:o.pen.letters.length,a:o.pen.arts.length,ach:o.achs};});
    ok(sv.l===2&&sv.a===1&&sv.ach.indexOf('pen')>=0,vp+' saved + achievement '+JSON.stringify(sv));
    // 7) Escape 一层层退出
    if(!mob){await pg.keyboard.press('Escape');await pg.waitForTimeout(150);await pg.keyboard.press('Escape');await pg.waitForTimeout(250);
      ok(!(await pg.evaluate(()=>byId('pen').classList.contains('on'))),vp+' escape closes');}
    else{await tap('#peBack');await tap('#peBack');await pg.waitForTimeout(250);ok(!(await pg.evaluate(()=>byId('pen').classList.contains('on'))),vp+' back closes');}
    const tag=await pg.evaluate(()=>document.querySelector('#pvNodes .pn[data-id="pen"]').className+' | '+document.querySelector('#pvNodes .pn[data-id="pen"] .pn-tag').textContent);
    ok(/st-done/.test(tag),vp+' node marked done ('+tag+')');
    ok(!errs.length,vp+' errors: '+(errs.join(' | ')||'none'));
    await ctx.close();
  }
  await br.close();console.log(fails?'FAIL '+fails:'all ok');process.exit(fails?1:0);
})();
