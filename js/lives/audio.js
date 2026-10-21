'use strict';
const LIFE_AUDIO=(()=>{
 const KEY='SS_LIVES_SOUND';let enabled=false,ctx=null,bus=null,ambient=[];
 try{enabled=localStorage.getItem(KEY)==='on';}catch(e){}
 function start(){
  if(!enabled)return false;
  try{
   if(!ctx)ctx=new(window.AudioContext||window.webkitAudioContext)();
   if(ctx.state==='suspended')ctx.resume().catch(()=>{});
   if(!bus){bus=ctx.createGain();bus.gain.value=.22;bus.connect(ctx.destination);}else bus.gain.setTargetAtTime(.22,ctx.currentTime,.12)
   if(!ambient.length){for(const [hz,volume] of [[55,.018],[82.4,.009]]){const osc=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();osc.type='sine';osc.frequency.value=hz;filter.type='lowpass';filter.frequency.value=170;gain.gain.value=volume;osc.connect(filter);filter.connect(gain);gain.connect(bus);osc.start();ambient.push(osc);}}
   return true;
  }catch(e){enabled=false;try{localStorage.setItem(KEY,'off');}catch(_){}return false;}
 }
 function tone(frequency,duration=.14,volume=.08,delay=0,type='sine'){
  if(!enabled||!start())return;
  const t=ctx.currentTime+delay,osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(frequency,t);gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(volume,t+.018);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);osc.connect(gain);gain.connect(bus);osc.start(t);osc.stop(t+duration+.025);
 }
 function stop(){if(!ctx)return;const old=ambient.splice(0);for(const osc of old){try{osc.stop();}catch(e){}}try{bus.gain.setTargetAtTime(.0001,ctx.currentTime,.08);}catch(e){}setTimeout(()=>{if(!enabled&&bus){try{bus.disconnect();}catch(e){}bus=null;}},550);}
 function toggle(){enabled=!enabled;try{localStorage.setItem(KEY,enabled?'on':'off');}catch(e){}if(enabled){if(!start())enabled=false;}else stop();return enabled;}
 document.addEventListener('visibilitychange',()=>{if(!ctx)return;try{if(document.hidden)ctx.suspend();else if(enabled)ctx.resume();}catch(e){}});
 return {toggle,get enabled(){return enabled;},tap(){tone(880,.055,.04);tone(1175,.08,.026,.04);},read(){tone(523,.12,.035);tone(784,.16,.025,.08);},solve(){tone(523,.24,.07);tone(659,.24,.05,.09);tone(784,.3,.05,.18);},choose(n){tone(n?392:587,.2,.055);tone(n?494:740,.26,.04,.07);},wrong(){tone(196,.22,.022,0,'triangle');},rest(){tone(440,.32,.035);tone(587,.42,.025,.12);}};
})();
