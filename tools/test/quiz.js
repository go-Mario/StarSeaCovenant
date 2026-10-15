// 每日速判：从见习裁判席进入，答题、看依据、中途退出再进来接着答、等一题超时、看结果、再练一组
// 用法：node tools/test/quiz.js（需要先起本地服务器，见上）
let PW;try{PW=require('playwright');}catch(e){PW=require('/opt/node-tools/node_modules/playwright');}
const {chromium}=PW;
const BASE=process.env.SS_URL||'http://127.0.0.1:8765/index.html';
const OUT=process.argv[2]||__dirname+'/out/quiz';require('fs').mkdirSync(OUT,{recursive:true});
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await p.goto(BASE+'#hub');await p.waitForTimeout(900);
await p.evaluate(()=>StarMap.land('bench'));await p.waitForTimeout(1800);await p.screenshot({path:OUT+'/0-bench.png'});
await p.click('#pvNodes .pn >> nth=0');await p.waitForTimeout(600);await p.screenshot({path:OUT+'/1-intro.png'});
await p.click('#qzGo');await p.waitForTimeout(500);await p.screenshot({path:OUT+'/2-q1.png'});
await p.click('[data-qa="1"]');await p.waitForTimeout(600);await p.screenshot({path:OUT+'/3-v1.png'});
await p.click('#qzNext');await p.waitForTimeout(300);await p.click('[data-qa="0"]');await p.waitForTimeout(300);
// 中途退出再进来
await p.click('#pnBack');await p.waitForTimeout(400);
await p.click('#pvNodes .pn >> nth=0');await p.waitForTimeout(500);
const resume=await p.textContent('#qzGo');
await p.click('#qzGo');await p.waitForTimeout(300);
const idx=await p.textContent('.qz-no');
// 第三句等超时
await p.waitForTimeout(20800);await p.screenshot({path:OUT+'/4-timeout.png'});
const to=await p.textContent('.qz-verdict .stamp');
for(let i=0;i<2;i++){await p.click('#qzNext');await p.waitForTimeout(250);await p.keyboard.press(i?'ArrowRight':'ArrowLeft');await p.waitForTimeout(300);}
await p.click('#qzNext');await p.waitForTimeout(700);await p.screenshot({path:OUT+'/5-result.png'});
const st=await p.evaluate(()=>JSON.stringify({d:S.daily,dust:S.dust}));
await p.click('#qzClose');await p.waitForTimeout(500);await p.screenshot({path:OUT+'/6-bench-after.png'});
await p.click('#pvNodes .pn >> nth=0');await p.waitForTimeout(500);await p.screenshot({path:OUT+'/7-done.png'});
await p.click('#qzPrac');await p.waitForTimeout(400);await p.screenshot({path:OUT+'/8-practice.png'});
const d=JSON.parse(st).d,ok=resume.indexOf('第 3 句')>=0&&idx.indexOf('第 3 句')>=0&&to==='超时'&&d.last&&d.ids&&d.ids.length===5&&d.res.length===5&&!errs.length;
console.log(JSON.stringify({resume,idx,to,score:d.score,streak:d.streak}));console.log(ok?'ok':'FAIL','errors',errs.length?errs:'none');await b.close();process.exit(ok?0:1);})();
