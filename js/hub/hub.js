"use strict";
/* =====================================================================
   星海长卷：主界面。横向滚动，从 1957 一路走到未来。
   主线章节、支线小游戏、史实标记都按年份摆在时间轴上。
   ===================================================================== */
const HUB_NODES=[
 {t:'game',id:'sat',era:'e1',x:.27,row:'hi',name:'卫星工坊',sub:'造一颗卫星，记得登记',ic:'ic-sat',year:1957},
 {t:'game',id:'lander',era:'e1',x:.74,row:'lo',name:'登月着陆',sub:'油门轻一点',ic:'ic-moon',year:1969},
 {t:'game',id:'orbit',era:'e2',x:.28,row:'hi',name:'轨位争夺',sub:'先申报，后发射',ic:'ic-orbit',year:1976},
 {t:'ch',id:'ch1',era:'e2',x:.45,row:'mid'},
 {t:'game',id:'sling',era:'e2',x:.68,row:'lo',name:'引力弹弓',sub:'借行星的力飞出去',ic:'ic-sling',year:1977},
 {t:'game',id:'station',era:'e2',x:.9,row:'hi',name:'空间站对接',sub:'法律跟着舱段走',ic:'ic-station',year:1998},
 {t:'ch',id:'ch2',era:'e3',x:.32,row:'mid'},
 {t:'bench',id:'bench',era:'e3',x:.74,row:'lo',name:'裁判练习',sub:'五个小案子，没有标准答案',ic:'ic-gavel',year:2020},
 {t:'ch',id:'ch3',era:'e4',x:.26,row:'mid'},
 {t:'ch',id:'ch4',era:'e4',x:.72,row:'mid'},
 {t:'ch',id:'ch5',era:'e5',x:.26,row:'mid'},
 {t:'ch',id:'ch6',era:'e5',x:.74,row:'mid'}
];
const ERA_W={e1:1.35,e2:2.1,e3:1.5,e4:1.7,e5:1.7};

const HUD={
  refresh(){
    const p=S.profile;
    const nm=byId('hudName');if(nm)nm.textContent=p.name;
    const rk=byId('hudRank');if(rk)rk.textContent=rankOf(S.rep)+' · 声望 '+S.rep;
    const dd=byId('hudDust');if(dd)dd.textContent=S.dust;
    const hh=byId('hudHints');if(hh)hh.textContent=S.hints;
    const ff=byId('hudFocusBar');if(ff){ff.style.width=clamp(S.focus,0,100)+'%';ff.parentNode.classList.toggle('low',S.focus<70);}
    const fv=byId('hudFocusV');if(fv)fv.textContent=S.focus;
    const av=byId('hudAv');if(av)av.innerHTML=avatarSVG('me');
  },
  hideHub(){byId('hub').classList.remove('on');DeepSky.stop();},
  showHub(){byId('hub').classList.add('on');HUD.refresh();Hub.onScroll(true);}
};

const Hub=(function(){
  let view,world,sections={},eraNow='',musicT=null,built=false,drag=null,suppressClick=false;
  function chState(id){
    if(SAVE.chDone(id))return 'done';
    if(chapterUnlocked(id))return 'open';
    return 'locked';
  }
  function nextCh(){return CH_ORDER.find(function(id){return !SAVE.chDone(id);});}
  function nodeHTML(n){
    if(n.t==='ch'){
      const C=CHAPTERS[n.id],st=chState(n.id),rec=S.ch[n.id];
      const nx=nextCh()===n.id;
      return '<button class="node ch-node st-'+st+(nx?' next':'')+'" data-ch="'+n.id+'">'+
        '<div class="cn-year">'+C.year+'</div><div class="cn-num">'+C.num+(C.arbiter?' · 仲裁员':'')+'</div>'+
        '<div class="cn-title">'+C.title+'</div><div class="cn-sub">'+C.sub+'</div>'+
        (st==='done'?'<div class="cn-stamp">'+esc(rec.grade)+'</div>':'')+
        (st==='locked'?'<div class="cn-lock">'+icon('ic-lock')+' 完成上一章后开启</div>':'<div class="cn-go">'+(st==='done'?'再开一次':'开庭')+' ›</div>')+
        (nx&&!Object.keys(S.ch).length?'<div class="cn-hint">从这里开始</div>':'')+
        '</button>';
    }
    const best=(n.t==='game'&&S.games[n.id])?GAMES[n.id]&&GAMES[n.id].badge&&GAMES[n.id].badge(S.games[n.id]):'';
    const done=n.t==='bench'?Object.keys(S.judge).length+'/5':best;
    return '<button class="node g-node" data-g="'+n.id+'" data-t="'+n.t+'"><span class="g-ic">'+icon(n.ic)+'</span>'+
      '<span class="g-name">'+n.name+'</span><span class="g-sub">'+n.sub+'</span>'+(done?'<span class="g-best">'+done+'</span>':'')+'<span class="g-year">'+n.year+'</span></button>';
  }
  /* 每段背景按它在屏幕上的实际宽高比生成（.lay 两侧各多出 6% 供视差） */
  function eraVW(id){
    const secW=Math.max(ERA_W[id]*innerWidth,ERA_W[id]*520),h=Math.max(320,view.clientHeight||innerHeight);
    return Math.max(600,Math.round(secW*1.12/h*900));
  }
  function paintBg(){
    ERAS.forEach(function(E){
      const bg=sections[E.id].querySelector('.era-bg');
      if(E.id==='e5'){
        if(!bg.firstChild){bg.innerHTML=ERA_ART.e5();DeepSky.attach(bg.firstChild);}else DeepSky.resize();
        return;
      }
      const VW=eraVW(E.id),old=+bg.getAttribute('data-vw')||0;
      if(old&&Math.abs(old-VW)/old<.04)return;
      bg.innerHTML=ERA_ART[E.id](VW);bg.setAttribute('data-vw',VW);
    });
  }
  function enName(E){return E.style==='retro'?E.en.charAt(0)+E.en.slice(1).toLowerCase():E.en;}
  function build(){
    view=byId('hubView');world=byId('hubWorld');
    let h='';
    ERAS.forEach(function(E,i){
      h+='<section class="era era-'+E.style+'" data-era="'+E.id+'" style="--w:'+ERA_W[E.id]+'">'+
        '<div class="era-bg"></div>'+
        '<div class="era-head"><div class="eh-years">'+E.from+' — '+(i===ERAS.length-1?'':E.to)+'</div><div class="eh-name">'+E.name+'</div><div class="eh-en">'+enName(E)+'</div><div class="eh-line">'+E.line+'</div></div>'+
        '<div class="era-nodes"></div><div class="era-rail"></div></section>';
    });
    world.innerHTML=h;
    $$('#hubWorld .era').forEach(function(sec){sections[sec.getAttribute('data-era')]=sec;});
    paintBg();
    renderNodes();renderRail();
    view.addEventListener('scroll',function(){onScroll();},{passive:true});
    view.addEventListener('wheel',function(e){if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){view.scrollLeft+=e.deltaY;e.preventDefault();}},{passive:false});
    view.addEventListener('pointerdown',function(e){if(e.pointerType!=='mouse')return;drag={x:e.clientX,s:view.scrollLeft,moved:false};});
    addEventListener('pointermove',function(e){if(!drag)return;const dx=e.clientX-drag.x;if(Math.abs(dx)>6)drag.moved=true;if(drag.moved){view.scrollLeft=drag.s-dx;view.classList.add('dragging');}});
    addEventListener('pointerup',function(){if(drag){suppressClick=drag.moved;drag=null;view.classList.remove('dragging');setTimeout(function(){suppressClick=false;},30);}});
    world.addEventListener('click',onClick);
    let rz=0;
    addEventListener('resize',function(){clearTimeout(rz);rz=setTimeout(function(){paintBg();renderRail();onScroll(true);},220);});
    built=true;
  }
  function renderNodes(){
    ERAS.forEach(function(E){
      const box=sections[E.id].querySelector('.era-nodes');
      box.innerHTML=HUB_NODES.filter(function(n){return n.era===E.id;}).map(function(n){
        return '<div class="node-pin row-'+n.row+'" style="left:'+(n.x*100)+'%">'+nodeHTML(n)+'</div>';}).join('');
    });
  }
  /* 史实标记：按像素排车道，放不下的只留圆点 */
  function labelW(it){
    const t=String(it.y)+' '+it.t;let w=0;
    for(const ch of t)w+=/[\u2E80-\uFFFF]/.test(ch)?11:6.4;
    return Math.min(120,w)+14+15;
  }
  function renderRail(){
    const portrait=innerHeight>innerWidth,maxLane=innerHeight<=520?1:(portrait?4:3);
    ERAS.forEach(function(E){
      const rail=sections[E.id].querySelector('.era-rail');
      const span=E.to-E.from+1,px=Math.max(ERA_W[E.id]*innerWidth,ERA_W[E.id]*520)/100;
      let h='<div class="rail-line"></div>';
      for(let y=Math.ceil(E.from/10)*10;y<=E.to;y+=10){h+='<span class="rail-dec" style="left:'+(((y-E.from)/span)*100)+'%">'+y+'</span>';}
      const evs=HISTORY.filter(function(it){return it.y>=E.from&&it.y<=E.to;}).sort(function(a,b){return a.y-b.y||((a.m||6)-(b.m||6));});
      const lanes=[];
      evs.forEach(function(it){
        const xp=((it.y-E.from+(it.m?(it.m-.5)/12:.5))/span)*100,x=xp*px,w=labelW(it);
        let lane=-1;
        for(let k=0;k<maxLane;k++){if(lanes[k]===undefined||x-lanes[k]>6){lane=k;break;}}
        const nolab=lane<0;if(nolab)lane=0;else lanes[lane]=x+w;
        const seen=S.hist.indexOf(it.id)>=0;
        h+='<button class="hmark k-'+it.kind+(seen?' seen':'')+(nolab?' nolab':'')+'" data-h="'+it.id+'" style="left:'+xp.toFixed(2)+'%;--lane:'+lane+'" title="'+it.y+' '+esc(it.t)+'"><i></i><span>'+it.y+' '+esc(it.t)+'</span></button>';
      });
      rail.innerHTML=h;
    });
  }
  function onClick(e){
    if(suppressClick)return;
    const c=e.target.closest('[data-ch]');if(c){SFX.tap();startChapter(c.getAttribute('data-ch'));return;}
    const g=e.target.closest('[data-g]');if(g){SFX.tap();const id=g.getAttribute('data-g');if(g.getAttribute('data-t')==='bench')Panels.open('bench');else Games.open(id);return;}
    const m=e.target.closest('[data-h]');if(m){SFX.page();Panels.history(m.getAttribute('data-h'));m.classList.add('seen');return;}
  }
  let raf=0;
  function onScroll(force){
    if(raf&&!force)return;
    raf=requestAnimationFrame(function(){
      raf=0;if(!view)return;
      const sl=view.scrollLeft,W=view.clientWidth,mid=sl+W/2;
      let best=null,bd=1e9;const ov=innerWidth*.07,keys=Object.keys(sections);
      keys.forEach(function(k,i){
        const sec=sections[k],L=sec.offsetLeft,SW=sec.offsetWidth,c=L+SW/2;
        /* 相邻两段重叠 14vw，各分一半 */
        const a=L+(i?ov:0),b=L+SW-(i<keys.length-1?ov:0),d=mid<a?a-mid:(mid>b?mid-b:0);
        if(d<bd){bd=d;best=k;}
        if(L+SW<sl-W||L>sl+W*2)return;
        const rel=(mid-c);
        sec.querySelectorAll('.lay').forEach(function(l){const dd=+l.getAttribute('data-d');l.style.transform='translate3d('+(rel*(1-dd)*.35).toFixed(1)+'px,0,0)';});
      });
      if(best!==eraNow){eraNow=best;
        $$('#hubBar .era-chip').forEach(function(ch){ch.classList.toggle('on',ch.getAttribute('data-era')===best);});
        byId('hub').setAttribute('data-era',best);
        clearTimeout(musicT);musicT=setTimeout(function(){if(byId('hub').classList.contains('on'))MUSIC.setMode(musicHere());},500);
      }
      const e5=sections.e5;if(e5&&byId('hub').classList.contains('on')){if(e5.offsetLeft<sl+W&&e5.offsetLeft+e5.offsetWidth>sl)DeepSky.start();else DeepSky.stop();}
      if(force)HUD.refresh();
    });
  }
  function musicHere(){const E=ERAS.find(function(x){return x.id===eraNow;});return E?E.music:'retro';}
  function scrollToEl(el,smooth){
    if(!el||!view)return;
    const r=el.getBoundingClientRect(),vr=view.getBoundingClientRect();
    view.scrollTo({left:view.scrollLeft+(r.left-vr.left)-(vr.width-r.width)/2,behavior:smooth?'smooth':'auto'});
  }
  return {
    init(){if(!built)build();HUD.refresh();},
    refresh(justDone){
      if(!built)return;renderNodes();renderRail();HUD.refresh();
      if(justDone){const nx=nextCh();if(nx)setTimeout(function(){scrollToEl($('[data-ch="'+nx+'"]'),true);},300);}
    },
    focusNext(smooth){
      const nx=nextCh()||'ch6';
      /* 第一次进来：从 1957 年的起点慢慢推到第一章 */
      if(!Object.keys(S.ch).length&&!S.profile.hubSeen){
        S.profile.hubSeen=true;save();view.scrollLeft=0;onScroll(true);
        let cancel=false;const stop=function(){cancel=true;};
        ['pointerdown','wheel','touchstart','keydown'].forEach(function(ev){addEventListener(ev,stop,{once:true,passive:true});});
        setTimeout(function(){if(!cancel&&byId('hub').classList.contains('on'))scrollToEl($('[data-ch="'+nx+'"]'),true);},1600);return;
      }
      scrollToEl($('[data-ch="'+nx+'"]'),smooth);onScroll(true);
    },
    scrollToEra(id){const sec=sections[id];if(sec)view.scrollTo({left:sec.offsetLeft-(id==='e1'?0:40),behavior:'smooth'});SFX.whoosh();},
    onScroll:onScroll,musicHere:musicHere,
    current(){return eraNow;}
  };
})();
