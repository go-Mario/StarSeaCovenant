// 秘书处 · 工时与调休：顶栏时钟、咖啡、打卡下班、来信便笺、加班攒调休、调休回来开庭多一格气势、
// 周末顺延、春节休庭与补班、熬过六点直接进入新的一天。手机竖屏与桌面各一遍。
// 用法：node tools/test/work.js [输出目录]；需要先在仓库根目录起一个静态服务器，见 docs/DESIGN.md
let PW;try{PW=require('playwright');}catch(e){PW=require('/opt/node-tools/node_modules/playwright');}
const {chromium}=PW;
const BASE=process.env.SS_URL||'http://127.0.0.1:8765/index.html';
const OUT=process.argv[2]||__dirname+'/out/work';require('fs').mkdirSync(OUT,{recursive:true});
const SAVE=JSON.stringify({v:4,profile:{name:'简',skin:3,hair:'tied',suit:0,created:true,introSeen:true,hubSeen:true},ch:{},laws:[],precs:[],moralLog:[],leanLog:[],standing:3,judge:{},daily:{last:'',streak:0},rep:0,dust:30,hints:1,focus:60,
  owned:{seal:['zhu'],paper:['xuan']},equip:{seal:'zhu',paper:'xuan'},games:{},hist:[],terms:[],achs:[],tips:['cross','invest','standing'],sound:false,bgm:false,lastPlay:''});
(async()=>{
  const br=await chromium.launch();let fails=0;
  const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fails++;};
  for(const [vp,w,h,mob] of [['phone',390,844,true],['desk',1280,800,false]]){
    const ctx=await br.newContext({viewport:{width:w,height:h},deviceScaleFactor:2,isMobile:mob,hasTouch:mob});
    const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
    const tap=async sel=>{if(mob)await pg.tap(sel);else await pg.click(sel);};
    const shot=async n=>pg.screenshot({path:OUT+'/'+vp+'-'+n+'.png'});
    const W=()=>pg.evaluate(()=>({day:S.work.day,min:S.work.min,ot:S.work.ot,focus:S.focus,rested:S.work.rested,coffee:S.work.coffee,mail:S.work.mail,inbox:S.work.inbox.length,date:Work.dateStr(S.work.day),type:Work.dayType(S.work.day).label}));
    // 选便笺上的某一项，然后点“好”
    const pick=async label=>{await pg.waitForSelector('#memo.on .mm-opt');const i=await pg.evaluate(l=>$$('#memoCard .mm-opt').findIndex(b=>b.textContent.includes(l)),label);
      await tap('#memoCard .mm-opt >> nth='+i);await pg.waitForTimeout(150);if(await pg.$('#memoOk'))await tap('#memoOk');await pg.waitForTimeout(450);};
    await pg.addInitScript(s=>{if(!sessionStorage.getItem('w-seeded')){localStorage.setItem('SSv4',s);sessionStorage.setItem('w-seeded','1');}},SAVE);
    await pg.goto(BASE+'?w='+vp+'#hub');await pg.waitForTimeout(1200);
    const clk=await pg.evaluate(()=>byId('hudClock').textContent);
    ok(/周一/.test(clk)&&/09:00/.test(clk),vp+' hud clock ('+clk+')');
    await shot('0-hub');
    // 秘书处
    await tap('#hudWork');await pg.waitForTimeout(400);
    ok(await pg.evaluate(()=>byId('panel').classList.contains('on')&&/秘书处/.test(byId('panel').textContent)),vp+' office opens from hud');
    await shot('1-office');
    const f0=(await W()).focus;
    for(let i=0;i<4;i++){await tap('#panel [data-w="coffee"]');await pg.waitForTimeout(120);}
    let s=await W();ok(s.coffee===3&&s.focus===f0+25&&s.min===540+30,vp+' coffee x3 then blocked '+JSON.stringify(s));
    // 打卡下班 → 第二天，秘书长办公室的春节通知（强制来信）
    await tap('#panel [data-w="out"]');await pick('打卡下班');
    s=await W();ok(s.day===1&&s.min===540,vp+' clock out → next day '+JSON.stringify(s));
    await pg.waitForTimeout(800);
    ok(await pg.evaluate(()=>Work.memoOn()&&/春节/.test(byId('memoCard').textContent)),vp+' recess notice pops');
    await shot('2-memo');
    await pick('收到');
    s=await W();ok(s.inbox===1,vp+' mail filed in inbox');
    // 加班：17:00 开一庭，三小时里两小时算加班
    await pg.evaluate(()=>{S.work.min=17*60;Work.afterHearing({title:'测试'});});
    s=await W();ok(s.ot===120&&s.min===20*60,vp+' hearing overtime '+JSON.stringify(s));
    // 攒满 8 小时，申请调休
    await pg.evaluate(()=>{S.work.ot=480;save();Panels.open('office');});await pg.waitForTimeout(300);
    ok(await pg.evaluate(()=>!byId('panel').querySelector('[data-w="comp"]').disabled),vp+' comp button enabled at 8h');
    const d0=(await W()).day;
    await tap('#panel [data-w="comp"]');await pick('提交申请');
    s=await W();ok(s.ot===0&&s.rested&&s.focus===100&&s.day===d0+2,vp+' comp day taken '+JSON.stringify(s));
    await pg.evaluate(()=>{while(Work.memoOn())Work.closeMemo();});await pg.waitForTimeout(400);
    // 调休回来的第一庭：卷宗上写着气势多一格
    await pg.evaluate(()=>{Panels.close();S.focus=40;save();startChapter('ch1');});await pg.waitForTimeout(900);
    const card=await pg.evaluate(()=>({t:byId('chapterCard').textContent,m:TH.morale}));
    ok(/调休回来/.test(card.t)&&/气势 \+1/.test(card.t)&&card.m===6,vp+' rested buff on case file (morale '+card.m+')');
    await shot('3-card');
    await tap('#ccGo');await pg.waitForTimeout(300);
    ok(!(await W()).rested,vp+' rest buff used once');
    await pg.evaluate(()=>endTheater(false));await pg.waitForTimeout(500);
    // 周五下班 → 周日补班（1 月 17 日）
    await pg.evaluate(()=>{while(Work.memoOn())Work.closeMemo();S.work.day=11;S.work.min=18*60;S.work.mail=null;save();});
    let r=await pg.evaluate(()=>{const x=Work.clockOut();return {x,d:Work.dateStr(S.work.day),t:Work.dayType(S.work.day).label};});
    ok(r.d==='1月17日'&&r.t==='补班',vp+' Friday → Sunday make-up day '+JSON.stringify(r));
    // 1 月 22 日（周五）下班 → 春节休庭八天 → 1 月 31 日补班
    r=await pg.evaluate(()=>{S.work.day=18;const x=Work.clockOut();return {x,d:Work.dateStr(S.work.day),t:Work.dayType(S.work.day).label};});
    ok(r.d==='1月31日'&&r.t==='补班'&&r.x.rest===8,vp+' recess skipped '+JSON.stringify(r));
    // 值班表：这一周有补班
    await pg.evaluate(()=>{while(Work.memoOn())Work.closeMemo();Panels.open('office');});await pg.waitForTimeout(300);
    const ros=await pg.evaluate(()=>$$('#panel .rd').map(e=>e.className.replace('rd','').trim()+':'+e.textContent));
    ok(ros.length===7&&ros.some(x=>/make/.test(x))&&ros.some(x=>/rest/.test(x)),vp+' roster marks recess/make-up '+ros.join(' '));
    await shot('4-roster');
    // 熬过早上六点：直接进入新的一天
    r=await pg.evaluate(()=>{const d=S.work.day;S.work.min=23*60;Work.spend(480,0,'通宵','x');return {d0:d,d1:S.work.day,min:S.work.min};});
    ok(r.d1===r.d0+1&&r.min===420,vp+' all-nighter rolls the day '+JSON.stringify(r));
    // 星球页上的秘书处节点
    await pg.evaluate(()=>{while(Work.memoOn())Work.closeMemo();Panels.close();StarMap.land('station','office');});await pg.waitForTimeout(1800);
    ok(await pg.evaluate(()=>!!document.querySelector('#pvNodes .pn[data-id="office"]')),vp+' office node on central station');
    await shot('5-station');
    ok(!errs.length,vp+' errors: '+(errs.join(' | ')||'none'));
    await ctx.close();
  }
  await br.close();console.log(fails?'FAIL '+fails:'all ok');process.exit(fails?1:0);
})();
