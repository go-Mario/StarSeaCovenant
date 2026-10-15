"use strict";
/* =====================================================================
   登月着陆（1969）：转向 + 推力，在燃料用完前平稳落到平台上。
   三关：静海（1969）· 月球背面（2019）· 南极（2023 以后）
   ===================================================================== */
GAMES.lander=(function(){
  const LV=[
    {name:'静海',year:1969,fuel:100,pad:84,rough:.5,vx:18,dark:false,
     note:'1969 年 7 月，阿波罗 11 号的登月舱“鹰”号降落在静海。着陆时燃料只剩下几十秒的余量。月面留下的铭牌写着：“我们为全人类的和平而来。”'},
    {name:'月球背面',year:2019,fuel:85,pad:60,rough:.85,vx:-34,dark:false,
     note:'2019 年 1 月，嫦娥四号在月球背面的冯·卡门撞击坑着陆。月球背面看不到地球，通信要靠一颗停在远处的中继卫星转发。'},
    {name:'南极',year:2023,fuel:75,pad:50,rough:1.1,vx:28,dark:true,
     note:'2023 年 8 月，月船 3 号在月球南极附近着陆。南极太阳总是贴着地平线，影子很长，地形看不清，这也是第五章那场官司发生的地方。'}];
  let stopF=null,keys={},btn={};
  function terrain(W,H,L,R){
    const pts=[],n=36,padI=8+Math.floor(R()*(n-18)),padW=Math.ceil(L.pad/(W/n));
    let y=H*.78;
    for(let i=0;i<=n;i++){
      if(i>padI&&i<=padI+padW){pts.push({x:i*W/n,y:pts[pts.length-1].y,pad:true});continue;}
      y+=(R()-.5)*H*.09*L.rough;y=clamp(y,H*.58,H*.9);pts.push({x:i*W/n,y:y});
    }
    return {pts:pts,padX0:(padI)*W/n,padX1:(padI+padW)*W/n,padY:pts[padI+1].y};
  }
  function groundY(T,x){const p=T.pts;for(let i=0;i<p.length-1;i++){if(x>=p[i].x&&x<=p[i+1].x){const k=(x-p[i].x)/(p[i+1].x-p[i].x);return p[i].y+(p[i+1].y-p[i].y)*k;}}return p[p.length-1].y;}
  function start(host,api,lvArg){
    const rec=SAVE.game('lander');const lvI=clamp(lvArg==null?0:lvArg,0,LV.length-1),L=LV[lvI];
    host.innerHTML='<div class="ld-hud"><span>高度 <b id="ldAlt">0</b> 米</span><span>下降 <b id="ldVy">0</b> 米/秒</span><span>横移 <b id="ldVx">0</b></span><span class="ld-fuel"><i id="ldFuel"></i></span></div>'+
      '<div class="ld-ctl"><button class="ld-b" data-k="l">◀</button><button class="ld-b big" data-k="t">推 力</button><button class="ld-b" data-k="r">▶</button></div>';
    const C=stageCanvas(host),ctx=C.ctx,W=C.w(),H=C.h();
    const R=rng(7+lvI*13+((rec.plays||0)%5));
    const T=terrain(W,H,L,R);
    const bg=starfield(W,H,11+lvI,260,['#010208','#05070F']);
    /* 物理量按屏幕高度换算，手机竖屏、电脑横屏手感一致；开局朝着平台方向漂 */
    const sc=clamp(H/700,.55,1.4),pc=(T.padX0+T.padX1)/2;
    const s={x:clamp(pc-Math.sign(L.vx)*Math.min(W*.3,260*sc),30,W-30),y:H*.12,vx:L.vx*sc,vy:0,a:0,fuel:L.fuel,done:false,parts:[],t:0};
    keys={};btn={};
    $$('.ld-b',host).forEach(function(b){
      const k=b.getAttribute('data-k');
      const on=function(e){e.preventDefault();btn[k]=true;b.classList.add('on');},off=function(){btn[k]=false;b.classList.remove('on');};
      b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointerleave',off);b.addEventListener('pointercancel',off);
    });
    const kd=function(e){keys[e.key]=true;if([' ','ArrowUp','ArrowLeft','ArrowRight'].indexOf(e.key)>=0)e.preventDefault();};
    const ku=function(e){keys[e.key]=false;};
    addEventListener('keydown',kd);addEventListener('keyup',ku);
    const G=24*sc,TH=60*sc,ROT=2.4,VY=44*sc,VX=26*sc;
    stopF=loop(function(dt){
      s.t+=dt;
      const left=btn.l||keys.ArrowLeft||keys.a,right=btn.r||keys.ArrowRight||keys.d,thrust=(btn.t||keys.ArrowUp||keys[' ']||keys.w)&&s.fuel>0&&!s.done;
      if(!s.done){
        if(left)s.a-=ROT*dt;if(right)s.a+=ROT*dt;s.a=clamp(s.a,-1.4,1.4);
        s.vy+=G*dt;
        if(thrust){s.vx+=Math.sin(s.a)*TH*dt;s.vy-=Math.cos(s.a)*TH*dt;s.fuel=Math.max(0,s.fuel-14*dt);Thruster.on(.9);
          for(let i=0;i<2;i++)s.parts.push({x:s.x-Math.sin(s.a)*16,y:s.y+Math.cos(s.a)*16,vx:-Math.sin(s.a)*90+(Math.random()-.5)*40,vy:Math.cos(s.a)*90+(Math.random()-.5)*20,life:.5,c:'#FFB45E'});}
        else Thruster.off();
        s.x+=s.vx*dt;s.y+=s.vy*dt;
        if(s.x<10){s.x=10;s.vx=Math.abs(s.vx)*.3;}if(s.x>W-10){s.x=W-10;s.vx=-Math.abs(s.vx)*.3;}
        const gy=groundY(T,s.x);
        if(thrust&&gy-s.y<90){for(let i=0;i<2;i++)s.parts.push({x:s.x+(Math.random()-.5)*30,y:gy,vx:(Math.random()-.5)*160,vy:-Math.random()*40,life:.8,c:'#C9C6BD'});}
        if(s.y+16>=gy){
          s.y=gy-16;s.done=true;Thruster.off();
          const onPad=s.x-10>=T.padX0&&s.x+10<=T.padX1,ok=onPad&&s.vy<VY&&Math.abs(s.vx)<VX&&Math.abs(s.a)<.22;
          if(ok){SFX.dock();SFX.ok();buzz(30);FX.sparkle(vw()/2,vh()/2,'#F6C35B',20);setTimeout(function(){result(true);},900);}
          else{SFX.lose();buzz([60,40,60]);for(let i=0;i<40;i++)s.parts.push({x:s.x,y:s.y,vx:(Math.random()-.5)*260,vy:-Math.random()*200,life:1.2,c:i%2?'#F6C35B':'#E8775A',g:true});s.crash=true;
            setTimeout(function(){result(false,!onPad?'没落在平台上。':s.vy>=VY?'下降太快了。':Math.abs(s.vx)>=VX?'横向速度太大，侧翻了。':'着陆时机身太斜。');},1100);}
        }
      }
      /* 画 */
      ctx.drawImage(bg,0,0,W,H);
      if(!L.dark){const ex=W*.82,ey=H*.16,er=Math.min(W,H)*.06;const g=ctx.createRadialGradient(ex-er*.3,ey-er*.3,1,ex,ey,er);g.addColorStop(0,'#9FD3FF');g.addColorStop(1,'#1E4FA8');ctx.fillStyle=g;ctx.beginPath();ctx.arc(ex,ey,er,0,7);ctx.fill();}
      else{ctx.fillStyle='rgba(255,236,190,.9)';ctx.beginPath();ctx.arc(W*.05,H*.6,18,0,7);ctx.fill();}
      [['#3A3A40',.52,.6],['#5A5A60',.6,.75]].forEach(function(lay,i){ctx.fillStyle=lay[0];ctx.beginPath();ctx.moveTo(0,H);for(let x=0;x<=W;x+=W/12){ctx.lineTo(x,H*lay[1]+Math.sin(x*.012+i*2)*H*.04*lay[2]);}ctx.lineTo(W,H);ctx.fill();});
      ctx.fillStyle=L.dark?'#8E8B84':'#C9C6BD';ctx.beginPath();ctx.moveTo(0,H);T.pts.forEach(function(p){ctx.lineTo(p.x,p.y);});ctx.lineTo(W,H);ctx.closePath();ctx.fill();
      if(L.dark){ctx.fillStyle='rgba(10,10,14,.55)';ctx.beginPath();ctx.moveTo(0,H);T.pts.forEach(function(p,i){ctx.lineTo(p.x+40,p.y+8);});ctx.lineTo(W,H);ctx.fill();}
      ctx.fillStyle='#E9C46A';ctx.fillRect(T.padX0,T.padY-3,T.padX1-T.padX0,4);
      const bl=Math.floor(s.t*2)%2;[T.padX0,T.padX1].forEach(function(x){ctx.fillStyle=bl?'#FF6A52':'#7A2A22';ctx.beginPath();ctx.arc(x,T.padY-6,3,0,7);ctx.fill();});
      s.parts=s.parts.filter(function(p){p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.g)p.vy+=G*3*dt;p.life-=dt;return p.life>0;});
      s.parts.forEach(function(p){ctx.globalAlpha=clamp(p.life*1.6,0,1);ctx.fillStyle=p.c;ctx.fillRect(p.x-2,p.y-2,4,4);});ctx.globalAlpha=1;
      if(!s.crash){
        ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.a);
        if(thrust){ctx.fillStyle='#FFB45E';ctx.beginPath();ctx.moveTo(-6,14);ctx.lineTo(0,24+Math.random()*16);ctx.lineTo(6,14);ctx.fill();}
        ctx.strokeStyle='#141824';ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(-10,8);ctx.lineTo(-17,16);ctx.moveTo(10,8);ctx.lineTo(17,16);ctx.stroke();
        ctx.fillStyle='#E9B949';ctx.fillRect(-11,0,22,10);ctx.strokeRect(-11,0,22,10);
        ctx.fillStyle='#D9DDE6';ctx.beginPath();ctx.moveTo(-9,0);ctx.lineTo(-7,-12);ctx.lineTo(7,-12);ctx.lineTo(9,0);ctx.closePath();ctx.fill();ctx.stroke();
        ctx.fillStyle='#2F6FE4';ctx.fillRect(-3,-9,6,4);
        ctx.restore();
      }
      const alt=Math.max(0,(groundY(T,s.x)-s.y-16)/4/sc);
      const set=function(id,v){const e=byId(id);if(e)e.textContent=v;};
      set('ldAlt',alt.toFixed(0));set('ldVy',(s.vy/20/sc).toFixed(1));set('ldVx',(s.vx/20/sc).toFixed(1));
      const fb=byId('ldFuel');if(fb){fb.style.width=(s.fuel/L.fuel*100)+'%';fb.parentNode.classList.toggle('low',s.fuel<L.fuel*.25);}
      const vyEl=byId('ldVy');if(vyEl)vyEl.parentNode.classList.toggle('warn',s.vy>=VY);
    });
    function result(ok,why){
      cleanup();
      const r=SAVE.game('lander');
      if(ok){
        const score=Math.round(s.fuel*10+(lvI+1)*100);
        const first=!r.landed||(r.level||0)<lvI+1;
        r.landed=true;r.level=Math.max(r.level||0,lvI+1);
        api.end({score:score,big:L.name+'　着陆成功',dust:first?25+lvI*10:6,note:L.note,lv:lvI,
          againLabel:lvI<LV.length-1?'下一关：'+LV[lvI+1].name:'再来一次',again:lvI<LV.length-1?function(){Games.start(lvI+1);}:null});
      }else api.end({ok:false,big:'着陆失败',dust:0,note:why+'<br>诀窍：离地面越近，越要提前点推力把速度降下来；落地前把机身摆正。',lv:lvI,againLabel:'再试一次'});
    }
    function cleanup(){removeEventListener('keydown',kd);removeEventListener('keyup',ku);Thruster.off();}
    GAMES.lander._cleanup=function(){cleanup();if(stopF)stopF();};
  }
  return {
    kind:'side',title:'登月着陆',sub:'1969 · 鹰已着陆',year:'1969',music:'retro',
    how:'按住“推力”减速，用左右键把着陆器摆正。<br>落在黄色平台上，下降速度小于 2 米/秒、机身基本竖直，就算成功。<br>键盘：方向键 ← → 转向，↑ 或空格推力。',
    fact:'月球的重力只有地球的六分之一，但没有空气，降落伞没用，只能靠发动机一点点减速。',
    levels:function(){const r=S.games.lander||{};return LV.map(function(l,i){const open=i<=(r.level||0);return '<button class="btn sm '+(open?'ghost':'')+'" data-lv="'+i+'"'+(open?'':' disabled')+'>'+(i+1)+'. '+l.name+' · '+l.year+'</button>';}).join('');},
    badge:function(r){return r.level?('第 '+r.level+'/3 关'):'';},
    start:start,
    stop:function(){if(GAMES.lander._cleanup)GAMES.lander._cleanup();}
  };
})();
