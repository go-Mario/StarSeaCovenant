// 影院版开场：逐个镜头截图，并检查着色器是否都编译通过
let PW;try{PW=require('playwright');}catch(e){PW=require('/opt/node-tools/node_modules/playwright');}
const BASE=process.env.SS_URL||'http://127.0.0.1:8765/index.html';
const OUT=process.argv[2]||__dirname+'/out/cine';require('fs').mkdirSync(OUT,{recursive:true});
const AT=+(process.argv[3]||900);
(async()=>{const b=await PW.chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
for(const vp of [{n:'phone',w:390,h:844,m:true},{n:'desk',w:1280,h:720}]){
const ctx=await b.newContext({viewport:{width:vp.w,height:vp.h},deviceScaleFactor:vp.m?2:1,isMobile:!!vp.m});const p=await ctx.newPage();
const logs=[];p.on('pageerror',e=>logs.push('ERR '+e.message));p.on('console',m=>{if(m.type()==='warning'||m.type()==='error')logs.push(m.text().slice(0,400));});
await p.goto(BASE+'#hub');await p.waitForTimeout(800);
const ok=await p.evaluate(()=>{byId('intro').classList.add('on');return Cine.ok()&&Cine.start();});
console.log(vp.n,'webgl',ok);
const P=+(process.env.P||.55),SC=+(process.env.SC||.8);
for(let i=0;i<7;i++){const r=await p.evaluate(a=>Cine._still(a[0],a[1],a[2]),[i,P,SC]);await p.waitForTimeout(AT);await p.screenshot({path:OUT+'/'+vp.n+'-shot'+(i+1)+'.png'});if(!r)logs.push('shot '+i+' failed');}
console.log(vp.n,'scale',await p.evaluate(()=>Cine._scale()),logs.length?logs:'no warnings');await ctx.close();}
await b.close();})();
