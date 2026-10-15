"use strict";
/* =====================================================================
   引力弹弓（1977）：拖动探测器向后拉，松手发射；借行星的引力拐弯。
   四关：火星 · 木星借力 · 旅行者路线 · 金唱片（通关后为唱片选问候语）
   ===================================================================== */
GAMES.sling=(function(){
  const LV=[
    {name:'去火星',start:[110,330],target:[860,250,46],pl:[{x:480,y:470,r:16,m:.35,look:'moon',n:'月球'}],pred:1.2},
    {name:'木星借力',start:[100,520],target:[880,150,52],pl:[{x:520,y:330,r:34,m:2.4,look:'amber',n:'木星'}],wall:[[640,60,40,210]],pred:.75},
    {name:'旅行者路线',start:[90,540],target:[950,80,40],pl:[{x:360,y:330,r:30,m:2.0,look:'amber',n:'木星'},{x:690,y:220,r:24,m:1.5,look:'gold',n:'土星'}],wall:[[520,0,30,190],[520,420,30,200]],pred:.5},
    {name:'金唱片',start:[80,560],target:[960,60,36],pl:[{x:300,y:380,r:30,m:2.1,look:'amber',n:'木星'},{x:560,y:200,r:22,m:1.4,look:'gold',n:'土星'},{x:800,y:400,r:18,m:.9,look:'teal',n:'天王星'}],pred:.45}];
  const GREET=['你好','Hello','Jambo','नमस्ते','Hola','مرحبا','Kia ora','こんにちは','Здравствуйте','Olá','雨声','心跳','笑声','鸟鸣','海浪'];
  let stopF=null;
  function start(host,api,lvArg){
    const rec=SAVE.game('sling'),lvI=clamp(lvArg==null?Math.min(rec.level||0,LV.length-1):lvArg,0,LV.length-1),L=LV[lvI];
    const C=stageCanvas(host),ctx=C.ctx,W=C.w(),H=C.h();
    /* 竖屏时把棋盘转过来铺满：起点在左下，目标在右上（物理不变，只换画法和触点换算） */
    const PORT=H>W*1.15,k=PORT?Math.min(H/1000,W/620):Math.min(W/1000,H/620),ox=PORT?(W-620*k)/2:(W-1000*k)/2,oy=PORT?(H-1000*k)/2:(H-620*k)/2;
    const P=PORT?function(x,y){return [ox+(620-y)*k,oy+(1000-x)*k];}:function(x,y){return [ox+x*k,oy+y*k];};
    const VEC=PORT?function(x,y){return [-y,-x];}:function(x,y){return [x,y];};
    const bg=GameArt.sky(W,H,{seed:31+lvI,tint:['#02030A','#0A0F22'],band:{x:.55,y:.5,a:-.42+lvI*.15,w:.14,al:.12},neb:[[.85,.2,.5,['120,70,170','60,120,180','150,80,120','70,90,190'][lvI],.12],[.3,.85,.45,'60,90,170',.08]]});
    /* 小行星带：按墙的范围预先撒好石头 */
    const rocks=(L.wall||[]).map(function(w){const R=rng(w[0]*7+w[1]),list=[];const n=Math.round(w[2]*w[3]/140);
      for(let i=0;i<n;i++){const r=(2.5+Math.pow(R(),2)*8)*k,pts=[];for(let j=0;j<7;j++){const a=j/7*6.283;pts.push([Math.cos(a)*r*(.7+R()*.45),Math.sin(a)*r*(.7+R()*.45)]);}const q=P(w[0]+4+R()*(w[2]-8),w[1]+4+R()*(w[3]-8));list.push({x:q[0],y:q[1],r:r,pts:pts,rot:R()*6,vr:(R()-.5)*.6});}
      return list;});
    const trailCol='150,205,255';
    /* 不动的东西（星空、太阳的光、小行星带、行星、引力圈、地球、名字）在开局时画一次 */
    const stat=document.createElement('canvas');stat.width=C.c.width;stat.height=C.c.height;(function(){
      const g=stat.getContext('2d');g.scale(stat.width/W,stat.height/H);g.drawImage(bg,0,0,W,H);
      g.globalCompositeOperation='lighter';GameArt.soft(g,...P(-90,310),420*k,'255,190,120',.28);GameArt.soft(g,...P(-90,310),180*k,'255,220,160',.3);g.globalCompositeOperation='source-over';
      (L.wall||[]).forEach(function(w,i){
        GameArt.soft(g,...P(w[0]+w[2]/2,w[1]+w[3]/2),Math.max(w[2],w[3])*k*.75,'200,170,140',.08);
        rocks[i].forEach(function(r){g.save();g.translate(r.x,r.y);g.rotate(r.rot);
          const q=g.createLinearGradient(-r.r,-r.r,r.r,r.r);q.addColorStop(0,'#B8AFA2');q.addColorStop(.6,'#6E6760');q.addColorStop(1,'#2E2A27');g.fillStyle=q;
          g.beginPath();r.pts.forEach(function(p,j){j?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]);});g.closePath();g.fill();g.restore();});
      });
      const tg=L.target,tq=P(tg[0],tg[1]),tx=tq[0],ty=tq[1],tr=tg[2]*k;
      GameArt.soft(g,tx,ty,tr*1.6,'246,195,91',.18);
      if(lvI===0)GameArt.drawPlanet(g,'mars',tx,ty,tr*.42,4);
      g.strokeStyle='rgba(246,195,91,.3)';g.lineWidth=6;g.beginPath();g.arc(tx,ty,tr,0,Math.PI*2);g.stroke();
      GameArt.caption(g,lvI===0?'火星':lvI===3?'星际空间':'目标',tx,ty-tr-14,{size:12,color:'#F6D58E',bg:.45});
      L.pl.forEach(function(pl){
        const pq=P(pl.x,pl.y),px=pq[0],py=pq[1],pr=pl.r*k;
        g.strokeStyle='rgba(150,190,255,.10)';g.lineWidth=1;g.setLineDash([2,5]);[2.2,3.4,4.8].forEach(function(f){g.beginPath();g.arc(px,py,pr*f*Math.sqrt(pl.m),0,Math.PI*2);g.stroke();});g.setLineDash([]);
        GameArt.drawPlanet(g,pl.look,px,py,pr,pl.x);
        GameArt.caption(g,pl.n,px,py+pr*(pl.look==='gold'?1.6:1)+16,{size:11,bg:.4,line:.12});
      });
      GameArt.drawPlanet(g,'earth',...P(L.start[0],L.start[1]),12*k,3);
    })();
    const st={p:null,v:null,flying:false,trail:[],tries:0,aim:null,t:0,done:false,boom:0,anim:0};
    function reset(){st.p={x:L.start[0],y:L.start[1]};st.v={x:0,y:0};st.flying=false;st.trail=[];st.t=0;st.assist={};}
    reset();
    api.setScore(L.name+' · 第 <b>'+(st.tries+1)+'</b> 次');
    function accel(p){let ax=0,ay=0;L.pl.forEach(function(pl){const dx=pl.x-p.x,dy=pl.y-p.y,d2=dx*dx+dy*dy+400,d=Math.sqrt(d2),f=pl.m*42000/d2;ax+=f*dx/d;ay+=f*dy/d;});return {x:ax,y:ay};}
    function hitWall(p){return (L.wall||[]).some(function(w){return p.x>w[0]&&p.x<w[0]+w[2]&&p.y>w[1]&&p.y<w[1]+w[3];});}
    function step(p,v,dt){const a=accel(p);v.x+=a.x*dt;v.y+=a.y*dt;p.x+=v.x*dt;p.y+=v.y*dt;}
    function toWorld(e){const r=C.c.getBoundingClientRect(),sx=e.clientX-r.left,sy=e.clientY-r.top;return PORT?{x:1000-(sy-oy)/k,y:620-(sx-ox)/k}:{x:(sx-ox)/k,y:(sy-oy)/k};}
    C.c.addEventListener('pointerdown',function(e){if(st.flying||st.done)return;st.aim={s:toWorld(e),c:toWorld(e)};C.c.setPointerCapture(e.pointerId);});
    C.c.addEventListener('pointermove',function(e){if(st.aim)st.aim.c=toWorld(e);});
    C.c.addEventListener('pointerup',function(){
      if(!st.aim)return;const v=launchV();st.aim=null;
      if(Math.hypot(v.x,v.y)<20)return;
      st.v=v;st.flying=true;st.tries++;SFX.whoosh();api.setScore(L.name+' · 第 <b>'+st.tries+'</b> 次');
    });
    function launchV(){const a=st.aim;let dx=a.s.x-a.c.x,dy=a.s.y-a.c.y;const len=Math.hypot(dx,dy),mx=160;if(len>mx){dx*=mx/len;dy*=mx/len;}return {x:dx*2.6,y:dy*2.6};}
    stopF=loop(function(dt){
      st.anim+=dt;
      if(st.flying){
        for(let i=0;i<4;i++){step(st.p,st.v,dt/4);}
        st.t+=dt;st.trail.push({x:st.p.x,y:st.p.y});if(st.trail.length>400)st.trail.shift();
        /* 擦着行星飞过：亮一圈，提示这就是“借力” */
        L.pl.forEach(function(pl,i){if(st.assist[i]==null&&Math.hypot(st.p.x-pl.x,st.p.y-pl.y)<pl.r*2.6){st.assist[i]=0;SFX.whoosh();buzz(8);}});
        const tg=L.target;
        if(Math.hypot(st.p.x-tg[0],st.p.y-tg[1])<tg[2]){st.flying=false;st.done=true;SFX.ok();FX.sparkle(...P(tg[0],tg[1]),'#F6C35B',30);setTimeout(win,700);}
        else if(L.pl.some(function(pl){return Math.hypot(st.p.x-pl.x,st.p.y-pl.y)<pl.r;})||hitWall(st.p)){st.flying=false;st.boom=.6;SFX.drop();buzz(30);setTimeout(reset,700);}
        else if(st.p.x<-60||st.p.x>1060||st.p.y<-60||st.p.y>680||st.t>14){st.flying=false;SFX.drop();setTimeout(reset,300);}
      }
      ctx.drawImage(stat,0,0,W,H);
      /* 目标：虚线环在转 */
      const tg=L.target,tq=P(tg[0],tg[1]),tx=tq[0],ty=tq[1],tr=tg[2]*k;
      if(lvI===3){ctx.strokeStyle='rgba(140,200,255,.35)';ctx.lineWidth=1.2;for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(tx+tr*2.2,ty-tr*.6,tr*(2.2+i*.35)+Math.sin(st.anim*1.5+i)*2,Math.PI*.55,Math.PI*1.05);ctx.stroke();}}
      ctx.strokeStyle='rgba(246,195,91,.9)';ctx.lineWidth=1.6;ctx.setLineDash([5,7]);ctx.lineDashOffset=-st.anim*12;ctx.beginPath();ctx.arc(tx,ty,tr,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
      /* 借力时那颗行星亮一圈 */
      L.pl.forEach(function(pl,ai){
        const at=st.assist[ai];if(at==null||at>=1.2)return;
        const pq=P(pl.x,pl.y),px=pq[0],py=pq[1],pr=pl.r*k;st.assist[ai]=at+dt;const f=at/1.2;
        ctx.strokeStyle='rgba(150,205,255,'+(1-f).toFixed(2)+')';ctx.lineWidth=2;ctx.beginPath();ctx.arc(px,py,pr*(1.3+f*1.6),0,Math.PI*2);ctx.stroke();
        ctx.globalAlpha=1-f;GameArt.glowText(ctx,'借力',px,py-pr*(1.4+f)-12,14,'#9FD3FF',10);ctx.globalAlpha=1;
      });
      /* 轨迹：越早的越淡 */
      if(st.trail.length>1){ctx.lineCap='round';const n=st.trail.length;
        for(let i=1;i<n;i+=3){const a=st.trail[i-1],b=st.trail[Math.min(n-1,i+2)],f=i/n;ctx.strokeStyle='rgba('+trailCol+','+(.15+f*.7).toFixed(2)+')';ctx.lineWidth=1+f*1.8;ctx.beginPath();ctx.moveTo(...P(a.x,a.y));ctx.lineTo(...P(b.x,b.y));ctx.stroke();}}
      /* 瞄准与预测 */
      if(st.aim){const v=launchV(),p={x:st.p.x,y:st.p.y},vv={x:v.x,y:v.y},N=Math.round(40*L.pred);
        for(let i=0;i<N;i++){for(let j=0;j<3;j++)step(p,vv,1/120);if(i%2===0)GameArt.soft(ctx,...P(p.x,p.y),4,'246,195,91',1-i/N*.8);}
        const pw=Math.min(1,Math.hypot(st.aim.s.x-st.aim.c.x,st.aim.s.y-st.aim.c.y)/160);
        ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=1.5;ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(...P(st.p.x,st.p.y));ctx.lineTo(...P(st.aim.c.x,st.aim.c.y));ctx.stroke();ctx.setLineDash([]);
        ctx.strokeStyle='rgba(246,195,91,.9)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(...P(st.p.x,st.p.y),18,-1.5708,-1.5708+6.283*pw);ctx.stroke();}
      /* 探测器：碟形天线朝后，顺着速度方向 */
      if(st.boom>0){st.boom-=dt;ctx.globalCompositeOperation='lighter';GameArt.soft(ctx,...P(st.p.x,st.p.y),(1-st.boom)*50+10,'255,180,94',st.boom*1.4);ctx.globalCompositeOperation='source-over';}
      else{
        const dv=st.flying?VEC(st.v.x,st.v.y):st.aim?VEC(st.aim.s.x-st.aim.c.x,st.aim.s.y-st.aim.c.y):VEC(1,-.3),ang=Math.atan2(dv[1],dv[0]);
        if(st.flying)GameArt.soft(ctx,...P(st.p.x,st.p.y),12,trailCol,.7);
        ctx.save();ctx.translate(...P(st.p.x,st.p.y));ctx.rotate(ang);const ps=Math.max(.8,k*1.1);ctx.scale(ps,ps);
        ctx.strokeStyle='rgba(220,225,235,.8)';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(-2,0);ctx.lineTo(-2,-11);ctx.moveTo(2,2);ctx.lineTo(9,7);ctx.stroke();
        ctx.fillStyle='#C99A48';ctx.beginPath();for(let i=0;i<6;i++){const a=i/6*6.283;i?ctx.lineTo(Math.cos(a)*3.6,Math.sin(a)*3.6):ctx.moveTo(Math.cos(a)*3.6,Math.sin(a)*3.6);}ctx.closePath();ctx.fill();
        const q=ctx.createLinearGradient(-9,-7,-5,7);q.addColorStop(0,'#FFFFFF');q.addColorStop(1,'#8E96A6');ctx.fillStyle=q;ctx.beginPath();ctx.ellipse(-6,0,2.4,7.5,0,0,7);ctx.fill();
        ctx.restore();
      }
      if(!st.flying&&!st.aim&&!st.done)GameArt.caption(ctx,'从探测器往后拖，松手发射',W/2,H-28,{size:12.5});
    });
    function win(){
      if(stopF)stopF();
      const r=SAVE.game('sling'),first=(r.level||0)<lvI+1;r.level=Math.max(r.level||0,lvI+1);
      const stars=st.tries<=1?3:st.tries<=3?2:1;
      const notes=['探测器没有足够的燃料一路开到火星，大部分路程是“滑过去”的。发射时机和角度决定了一切。',
        '飞过大行星身边，借它的引力“甩”一下，能免费拐弯、加速。这叫引力助推。',
        '1977 年，旅行者 2 号赶上了一次一百多年一遇的行星排列，一口气飞掠了木星、土星、天王星和海王星。',
        '两艘旅行者号各带着一张金唱片，录有 55 种语言的问候。它们已经飞出了太阳风的边界，还在往外走。'];
      if(lvI===3){record(stars,first);return;}
      api.end({score:stars,big:'★'.repeat(stars)+'☆'.repeat(3-stars),dust:first?20+lvI*5:5,note:notes[lvI],lv:lvI,
        againLabel:'下一关：'+LV[lvI+1].name,again:function(){Games.start(lvI+1);}});
    }
    function record(stars,first){
      host.innerHTML='<div class="rec-wrap"><div class="paper rec-card"><div class="gm-k">金唱片</div><h3>选三样东西放进你的唱片</h3><div class="rec-disc"><span id="recPick"></span></div><div class="rec-opts">'+GREET.map(function(g,i){return '<button data-i="'+i+'">'+g+'</button>';}).join('')+'</div><button class="btn amber block" id="recGo" disabled>封存唱片</button></div></div>';
      const picked=[];
      $$('.rec-opts button',host).forEach(function(b){b.onclick=function(){const i=+b.getAttribute('data-i');const k=picked.indexOf(i);
        if(k>=0){picked.splice(k,1);b.classList.remove('on');}else if(picked.length<3){picked.push(i);b.classList.add('on');SFX.chime(picked.length+2);}
        byId('recPick').textContent=picked.map(function(x){return GREET[x];}).join(' · ');byId('recGo').disabled=picked.length<3;};});
      byId('recGo').onclick=function(){
        SFX.stamp();const r=SAVE.game('sling');r.record=picked.map(function(x){return GREET[x];});save();
        api.end({score:stars,big:'★'.repeat(stars)+'☆'.repeat(3-stars),dust:first?40:5,lv:3,
          note:'你的唱片里有：<b>'+r.record.join('、')+'</b>。<br>1977 年的金唱片里有 55 种语言的问候、雨声、心跳和各地的音乐。没人知道会不会有人听到，但人们还是认真挑了要放什么。'});
      };
    }
  }
  return {
    kind:'side',title:'引力弹弓',sub:'1977 · 旅行者号出发',year:'1977',music:'frontier',
    how:'从探测器往后拖，像拉弹弓一样，松手发射。<br>经过行星身边会被它的引力拉弯。飞进金色圆圈就算到达。',
    fact:'飞向外行星的探测器燃料有限，常常要绕着行星“借力”加速。这叫引力助推。',
    levels:function(){const r=S.games.sling||{};return LV.map(function(l,i){const open=i<=(r.level||0);return '<button class="btn sm '+(open?'ghost':'')+'" data-lv="'+i+'"'+(open?'':' disabled')+'>'+(i+1)+'. '+l.name+'</button>';}).join('');},
    badge:function(r){return r.level?('第 '+r.level+'/4 关'):'';},
    start:start,stop:function(){if(stopF)stopF();}
  };
})();
