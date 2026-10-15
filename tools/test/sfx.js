// 音效响度体检：用离线音频上下文渲染每个音效，统计峰值与 RMS（dBFS）
let PW;try{PW=require('playwright');}catch(e){PW=require('/opt/node-tools/node_modules/playwright');}
(async()=>{const b=await PW.chromium.launch();const p=await (await b.newContext()).newPage();
await p.goto((process.env.SS_URL||'http://127.0.0.1:8765/index.html')+'#hub');await p.waitForTimeout(800);
const names=['tap','card','page','voice','objection','win','lose','gavel','stamp','ach','reveal','coin','whoosh','chime','pluck','error','ok','dock','launch','burn','pop','drop','radio'];
const res=await p.evaluate(async(names)=>{
  const out={};S.sound=true;
  for(const n of names){
    AC=new OfflineAudioContext(2,44100*3,44100);BUS=null;NB=null;
    try{lastVoiceT=-9;if(n==='voice')SFX.voice('chen');else if(n==='chime'||n==='pluck')SFX[n](3);else SFX[n]();}catch(e){out[n]='ERR '+e.message;continue;}
    const buf=await AC.startRendering();let pk=0,sum=0,cnt=0;
    for(let ch=0;ch<2;ch++){const d=buf.getChannelData(ch);for(let i=0;i<d.length;i++){const v=Math.abs(d[i]);if(v>pk)pk=v;}}
    const d=buf.getChannelData(0),win=2205;let best=0;for(let i=0;i+win<d.length;i+=win){let s=0;for(let k=0;k<win;k++)s+=d[i+k]*d[i+k];best=Math.max(best,Math.sqrt(s/win));}
    out[n]={peak:(20*Math.log10(pk+1e-9)).toFixed(1),rms50ms:(20*Math.log10(best+1e-9)).toFixed(1)};
  }
  return out;},names);
for(const k of Object.keys(res))console.log(k.padEnd(10),JSON.stringify(res[k]));
await b.close();})();
