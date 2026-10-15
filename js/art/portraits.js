"use strict";
/* =====================================================================
   立绘：120×170 画幅，同一副骨架，不同肤色、发型、衣着与神情。
   全部运行时用矢量拼出来，没有外部图片。
   肤色从最浅到最深共 8 档；发型覆盖直发、卷发、螺旋卷、脏辫、
   编发、盘发、头巾、光头等，衣着加了法袍、羽绒服、工装。
   ===================================================================== */
const PORTRAIT=(function(){
  const INK='#141824';
  const mx=function(x){return (120-x).toFixed(2);};
  function mirror(d){return d.replace(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g,function(_,x,y){return mx(+x)+' '+y;});}
  const SKINS=[
    {skin:'#F6DCC8',skinS:'#D9B39A',lip:'#C9867A'},
    {skin:'#EFCBAE',skinS:'#CDA285',lip:'#C27C6C'},
    {skin:'#E4B690',skinS:'#C08C69',lip:'#B4705E'},
    {skin:'#D19C74',skinS:'#A97452',lip:'#9E5E4A'},
    {skin:'#B97D55',skinS:'#8F5A3B',lip:'#874A38'},
    {skin:'#9B6343',skinS:'#74442D',lip:'#6E3B2C'},
    {skin:'#7B4B31',skinS:'#57311F',lip:'#56301F'},
    {skin:'#5B3626',skinS:'#3E2217',lip:'#45261A'}];
  const FACE={
    normal:'M42.5 56 C42.5 43 50 35.5 60 35.5 C70 35.5 77.5 43 77.5 56 L77.5 64 C77.5 74.5 70 84 60 86 C50 84 42.5 74.5 42.5 64 Z',
    wide:'M41.5 56 C41.5 43 49.5 35.5 60 35.5 C70.5 35.5 78.5 43 78.5 56 L78.5 66 C78.5 77 70 85.5 60 87 C50 85.5 41.5 77 41.5 66 Z',
    narrow:'M43.5 55 C43.5 42 50.5 35 60 35 C69.5 35 76.5 42 76.5 55 L76 64 C75 75 68.5 84.5 60 87.5 C51.5 84.5 45 75 44 64 Z',
    soft:'M43 56 C43 43 50.5 36 60 36 C69.5 36 77 43 77 56 L77 63 C77 73 70 82.5 60 85 C50 82.5 43 73 43 63 Z',
    round:'M42 57 C42 44 50 36.5 60 36.5 C70 36.5 78 44 78 57 L78 64 C78 76 70 85 60 86 C50 85 42 76 42 64 Z'
  };
  const BROW={neutral:'M47.8 57.4 Q52 55.6 56.6 56.8',angry:'M47.6 55.2 Q52.4 55.6 57.2 58.6',worried:'M47.8 57.9 Q52 56.6 56.8 54.6',
    raised:'M47.8 56 Q52 53.4 56.6 55.2',stern:'M47.8 56.4 L57 57.4',soft:'M48 57.8 Q52 56.4 56.4 57.2'};
  function mouth(kind,lip){
    const L=lip||'#7a3f36';
    return {
      neutral:'<path d="M56.2 77.2 Q60 78 63.8 77.1" stroke="'+L+'" stroke-width="1.3" fill="none" stroke-linecap="round"/>',
      smile:'<path d="M55.4 76.4 Q60 80.2 64.6 76.2" stroke="'+L+'" stroke-width="1.3" fill="none" stroke-linecap="round"/>',
      grin:'<path d="M55 76 Q60 81.6 65 76 Q60 78 55 76 Z" fill="#fff" stroke="'+L+'" stroke-width="1"/>',
      smirk:'<path d="M56 77.6 Q60 78.2 64.8 75.8" stroke="'+L+'" stroke-width="1.3" fill="none" stroke-linecap="round"/>',
      frown:'<path d="M56 78.4 Q60 76.4 64 78.4" stroke="'+L+'" stroke-width="1.3" fill="none" stroke-linecap="round"/>',
      grim:'<path d="M55.8 77.5 L64.2 77.3" stroke="'+L+'" stroke-width="1.5" fill="none" stroke-linecap="round"/>',
      open:'<path d="M56 76.4 Q60 75.6 64 76.4 Q63.2 81.6 60 81.8 Q56.8 81.6 56 76.4 Z" fill="#3a1618"/>',
      shout:'<path d="M55 75.6 L65 75.6 Q64.2 82.4 60 82.8 Q55.8 82.4 55 75.6 Z" fill="#3a1618"/><path d="M56.2 76.5 L63.8 76.5" stroke="#ece4d6" stroke-width="1.3"/>'
    }[kind||'neutral'];
  }
  const TALK='<path d="M56.6 76.6 Q60 75.9 63.4 76.6 Q62.6 80 60 80.2 Q57.4 80 56.6 76.6 Z" fill="#3a1618"/>';
  function eyes(kind,iris){
    let L='';const ic=iris||'#2b2420';
    if(kind==='wide'){L+='<path d="M48.3 62 Q52.5 58.2 56.7 62 Q52.5 65.6 48.3 62 Z" fill="#f4efe8"/><circle cx="52.5" cy="62" r="1.35" fill="'+ic+'"/><circle cx="52.5" cy="62" r=".6" fill="#0a0a0a"/><path d="M48 61.8 Q52.5 57.6 57 61.6" stroke="'+INK+'" stroke-width="1.15" fill="none" stroke-linecap="round"/>';}
    else if(kind==='narrow'){L+='<path d="M48.6 62.4 Q52.5 60.6 56.4 62.1 Q52.6 63.6 48.6 62.4 Z" fill="#efe9e0"/><circle cx="52.9" cy="62.3" r="1.45" fill="'+ic+'"/><path d="M48.2 62.3 Q52.5 60 56.8 61.9" stroke="'+INK+'" stroke-width="1.35" fill="none" stroke-linecap="round"/>';}
    else if(kind==='down'){L+='<path d="M48.6 62.6 Q52.5 61 56.4 62.4 Q52.6 64.4 48.6 62.6 Z" fill="#efe9e0"/><circle cx="52.6" cy="63.1" r="1.5" fill="'+ic+'"/><path d="M48.2 62.5 Q52.5 60.4 56.8 62.2" stroke="'+INK+'" stroke-width="1.3" fill="none" stroke-linecap="round"/>';}
    else if(kind==='closed'){L+='<path d="M48.4 62.6 Q52.5 64.6 56.6 62.4" stroke="'+INK+'" stroke-width="1.3" fill="none" stroke-linecap="round"/>';}
    else{L+='<path d="M48.6 62.2 Q52.5 59.6 56.4 62 Q52.6 64.2 48.6 62.2 Z" fill="#f3eee6"/><circle cx="52.7" cy="62.1" r="1.75" fill="'+ic+'"/><circle cx="52.7" cy="62.1" r=".8" fill="#0a0a0a"/><path d="M48.3 62.1 Q52.5 59.2 56.7 61.8" stroke="'+INK+'" stroke-width="1.2" fill="none" stroke-linecap="round"/>';}
    if(kind!=='closed')L+='<circle cx="53.3" cy="61.4" r=".45" fill="#fff" opacity=".9"/>';
    return '<g class="eye">'+L+'</g><g class="eye" transform="matrix(-1 0 0 1 120 0)">'+L+'</g>';
  }
  /* 发型：back 画在脸后，front 画在脸前 */
  const HAIR={
    tied:function(c){return {back:'<path d="M73 70 C80 76 81 90 75 99 C72.5 90 72 81 70.5 74 Z" fill="'+c.h+'"/>',
      front:'<path d="M42.2 58 C40.4 42 49 32 60.5 32 C72 32 80.2 41 78 58 C76.6 50 73 45.5 67 43 C62 46.5 53 48.6 45 49.6 C43.6 52 42.8 55 42.2 58 Z" fill="'+c.h+'"/><path d="M49 37.5 C54 34.2 60 33.6 64.5 34.2" stroke="'+c.hh+'" stroke-width="1.6" fill="none" opacity=".45" stroke-linecap="round"/>'};},
    bob:function(c){return {back:'<path d="M39.5 60 C37 40 47 30 60 30 C73 30 83 40 80.5 60 L81.4 81 C77 85 72.5 84.5 70 82 L70 66 L50 66 L50 82 C47.5 84.5 43 85 38.6 81 Z" fill="'+c.h+'"/>',
      front:'<path d="M41.4 61 C39.8 41 49 31.4 60 31.4 C71 31.4 80.2 41 78.6 61 C77 52 74 46.2 69 43.6 C64 47 56 46.8 50 45.2 C46 49.4 43 54.6 41.4 61 Z" fill="'+c.h+'"/><path d="M52.5 33.4 C47.6 40 45.6 48 44.6 60" stroke="'+c.hh+'" stroke-width="2.4" fill="none" opacity=".6" stroke-linecap="round"/>'};},
    swept:function(c){return {back:'',front:'<path d="M43 56 C40.8 40 49 29.6 61 29.6 C72.4 29.6 79.4 38 77.6 55 C76.6 47 73 42 66.4 40.6 C61 39.8 57.6 41.6 55 43.6 C52 42 49.4 42.6 46.6 44.6 C45 48 43.8 52 43 56 Z" fill="'+c.h+'"/><path d="M53 41.6 C57 35.6 64 33.2 71.4 35.6" stroke="'+c.hh+'" stroke-width="1.2" fill="none" opacity=".7"/>'};},
    curly:function(c){let b='',f='';
      [[40,52,9],[39,64,9],[41,76,8.5],[44,86,7],[80,52,9],[81,64,9],[79,76,8.5],[76,86,7],[46,40,9],[60,34,10],[74,40,9],[52,34,8],[68,34,8]].forEach(function(p){b+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+p[2]+'" fill="'+c.h+'"/><circle cx="'+(p[0]-1.6)+'" cy="'+(p[1]-1.8)+'" r="'+(p[2]*.42).toFixed(1)+'" fill="'+c.hh+'" opacity=".3"/>';});
      [[46,46,5.6],[52,42.6,5.8],[59,41.4,6],[66,42.4,5.8],[73,45.6,5.6],[44.4,52,4.2],[75.6,52,4.2]].forEach(function(p){f+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+p[2]+'" fill="'+c.h+'"/>';});
      return {back:b,front:f};},
    /* 螺旋卷（爆炸头）：大而圆的轮廓 */
    coily:function(c){let b='<path d="M60 18 C82 18 94 32 94 52 C94 70 88 80 80 84 L40 84 C32 80 26 70 26 52 C26 32 38 18 60 18 Z" fill="'+c.h+'"/>';
      const r=rng(7);for(let i=0;i<70;i++){const a=r()*6.283,rr=r()*30;b+='<circle cx="'+(60+Math.cos(a)*rr).toFixed(1)+'" cy="'+(50+Math.sin(a)*rr*.9).toFixed(1)+'" r="'+(r()*1.6+.6).toFixed(1)+'" fill="'+c.hh+'" opacity=".22"/>';}
      return {back:b,front:'<path d="M42.4 54 C42 44 49 37.4 60 37.4 C71 37.4 78 44 77.6 54 C75 47 69 43.6 60 43.6 C51 43.6 45 47 42.4 54 Z" fill="'+c.h+'"/>'};},
    /* 短螺旋卷，贴头 */
    crop:function(c){let f='<path d="M41.8 56 C40.6 41 49 32.6 60 32.6 C71 32.6 79.4 41 78.2 56 C76 48 70 44 60 44 C50 44 44 48 41.8 56 Z" fill="'+c.h+'"/>';
      const r=rng(3);for(let i=0;i<34;i++){f+='<circle cx="'+(44+r()*32).toFixed(1)+'" cy="'+(35+r()*12).toFixed(1)+'" r=".8" fill="'+c.hh+'" opacity=".3"/>';}
      return {back:'',front:f};},
    /* 脏辫：两侧垂到肩 */
    locs:function(c){let b='';
      [36,40,44,76,80,84].forEach(function(x,i){const len=34+((i*7)%9);b+='<rect x="'+(x-3)+'" y="48" width="6.4" height="'+len+'" rx="3.2" fill="'+c.h+'"/><path d="M'+x+' 54 L'+x+' '+(46+len)+'" stroke="'+c.hh+'" stroke-width=".8" stroke-dasharray="2 3" opacity=".5"/>';});
      return {back:b,front:'<path d="M41 58 C39.6 40 49 31 60 31 C71 31 80.4 40 79 58 C77 49 72 45 66 44 L64 49 L62 44 L58 44 L56 49 L54 44 C48 45 43 49 41 58 Z" fill="'+c.h+'"/>'};},
    /* 编发：贴头脏辫纹 + 两条长辫 */
    braids:function(c){let b='',f='<path d="M42 57 C40.6 41 49 32 60 32 C71 32 79.4 41 78 57 C76 49 71 44.6 60 44.6 C49 44.6 44 49 42 57 Z" fill="'+c.h+'"/>';
      [48,54,60,66,72].forEach(function(x){f+='<path d="M'+x+' 33.6 Q'+(x+(x<60?-3:x>60?3:0))+' 39 '+(x+(x<60?-5:x>60?5:0))+' 44.4" stroke="'+c.hh+'" stroke-width=".9" fill="none" opacity=".55"/>';});
      [[38,1],[82,-1]].forEach(function(p){for(let k=0;k<7;k++){b+='<ellipse cx="'+(p[0]+p[1]*k*.2)+'" cy="'+(58+k*6.4)+'" rx="3.4" ry="3.9" fill="'+c.h+'"/>';}b+='<circle cx="'+p[0]+'" cy="104" r="2" fill="'+(c.bead||'#D8B23C')+'"/>';});
      return {back:b,front:f};},
    bun:function(c){return {back:'<circle cx="60" cy="26" r="9" fill="'+c.h+'"/><path d="M53 26 Q60 22 67 26" stroke="'+c.hh+'" stroke-width="1" fill="none" opacity=".5"/>',
      front:'<path d="M42 59 C40.8 42 49 32.4 60 32.4 C71 32.4 79.2 42 78 59 C76 50.4 70.4 44 60.4 42 C51 44 44.4 50.4 42 59 Z" fill="'+c.h+'"/><path d="M52 35.4 C48 39.4 45 45.6 43.6 53" stroke="'+c.hh+'" stroke-width="1.4" fill="none" opacity=".4" stroke-linecap="round"/>'};},
    long:function(c){return {back:'<path d="M38 60 C36 38 47 29 60 29 C73 29 84 38 82 60 L86 118 C80 122 72 122 70 118 L70 70 L50 70 L50 118 C48 122 40 122 34 118 Z" fill="'+c.h+'"/>',
      front:'<path d="M41.6 60 C40.4 41 49 31.6 60 31.6 C71 31.6 79.6 41 78.4 60 C76.4 50 70.4 43.4 60.6 41.6 C59 46 50 49 41.6 60 Z" fill="'+c.h+'"/><path d="M60.4 32 L60.6 41.6" stroke="'+c.hs+'" stroke-width=".9"/>'};},
    sleek:function(c){return {back:'<path d="M40 60 C37 40 47 31 60 31 C73 31 83 40 80 60 L83.6 100 C78 104.4 72.6 103.4 70 100 L70 72 L50 72 L50 100 C47.4 103.4 42 104.4 36.4 100 Z" fill="'+c.h+'"/>',
      front:'<path d="M42 59 C40.8 42 49 32.4 60 32.4 C71 32.4 79.2 42 78 59 C76 50.4 70.4 44 60.4 42 C51 44 44.4 50.4 42 59 Z" fill="'+c.h+'"/>'};},
    short:function(c){return {back:'',front:'<path d="M42.4 57 C41.2 41.6 49.4 33 60 33 C70.6 33 78.8 41.6 77.6 57 C76.2 49.6 73 45.2 66.6 43.6 C60 42.6 53 43 47 45.6 C45 48.6 43.4 52.6 42.4 57 Z" fill="'+c.h+'"/><path d="M50 37 C55 34.4 62 34 68 36" stroke="'+c.hh+'" stroke-width="1.2" fill="none" opacity=".4"/>'};},
    side:function(c){return {back:'',front:'<path d="M43 55.6 C41.8 42 50 34 60.5 34 C71 34 78.6 42 77.6 55.6 C76.2 49 72.6 44.6 66 43.2 C59 42.2 52 43.6 47.4 46.2 C45.4 48.8 44 52 43 55.6 Z" fill="'+c.h+'"/><path d="M55 37.2 C61 35.2 68 36 73 40" stroke="'+c.hh+'" stroke-width="1.2" fill="none" opacity=".6"/>'};},
    buzz:function(c){return {back:'',front:'<path d="M42.6 55 C42 42 50 34.4 60 34.4 C70 34.4 78 42 77.4 55 C75 48 69 45.6 60 45.6 C51 45.6 45 48 42.6 55 Z" fill="'+c.h+'" opacity=".85"/>'};},
    bald:function(c){return {back:'',front:'<path d="M44 46 C48 39 54 36.4 60 36.4" stroke="#fff" stroke-width="2" fill="none" opacity=".18" stroke-linecap="round"/>',scalp:true};},
    /* 头巾：外轮廓盖住耳朵和脖子，正面开一个脸形的口 */
    hijab:function(c){return {back:'<path d="M32 70 C30 40 44 25 60 25 C76 25 90 40 88 70 L94 112 C80 120 40 120 26 112 Z" fill="'+c.h+'"/>',
      front:'<path fill-rule="evenodd" d="M36 62 C34 38 46 27 60 27 C74 27 86 38 84 62 L84 92 C78 102 70 106 60 106 C50 106 42 102 36 92 Z M44.6 55 C44.6 43 51.4 38.4 60 38.4 C68.6 38.4 75.4 43 75.4 55 L75.4 64 C75.4 74 68.6 82.6 60 84.6 C51.4 82.6 44.6 74 44.6 64 Z" fill="'+c.h+'"/><path d="M44.6 55 C44.6 43 51.4 38.4 60 38.4 C68.6 38.4 75.4 43 75.4 55" stroke="'+c.hh+'" stroke-width="1.6" fill="none" opacity=".5"/><path d="M40 92 C48 100 72 100 80 92" stroke="'+c.hs+'" stroke-width="1.2" fill="none" opacity=".5"/>',noEars:true};}
  };
  function torso(c){
    let s='';const coat=c.coat||'suit';
    s+='<path d="M5 170 L7 148 C8 129 15 118 29 113 C37 110 43 107 47 103.5 L60 108 L73 103.5 C77 107 83 110 91 113 C105 118 112 129 113 148 L115 170 Z" fill="'+c.suit+'"/>';
    s+='<path d="M60 108 L73 103.5 C77 107 83 110 91 113 C105 118 112 129 113 148 L115 170 L70 170 C70 150 66 128 60 108 Z" fill="'+c.suitS+'" opacity=".55"/>';
    if(coat==='suit'){
      s+='<path d="M48 103 L60 128 L72 103 L66 100 L60 106 L54 100 Z" fill="'+c.shirt+'"/>';
      if(c.tie)s+='<path d="M58 107 L62 107 L63.6 113 L62 136 L60 139 L58 136 L56.4 113 Z" fill="'+c.tie+'"/>';
      s+='<path d="M46 104 L39.6 112 L49 141 L58 118 L51.6 104 Z" fill="'+c.suit+'"/><path d="M74 104 L80.4 112 L71 141 L62 118 L68.4 104 Z" fill="'+c.suitS+'"/>';
      s+='<path d="M46 104 L39.6 112 L49 141" stroke="'+INK+'" stroke-width=".7" fill="none" opacity=".4"/><path d="M74 104 L80.4 112 L71 141" stroke="'+INK+'" stroke-width=".7" fill="none" opacity=".4"/>';
    }else if(coat==='knit'){
      s+='<path d="M50 102 L60 124 L70 102 L66 100 L60 108 L54 100 Z" fill="'+c.shirt+'"/><path d="M46 104 L60 132 L74 104" stroke="'+c.suitS+'" stroke-width="2.4" fill="none"/>';
      for(let i=0;i<4;i++)s+='<circle cx="62.4" cy="'+(140+i*8)+'" r="1.2" fill="'+c.suitS+'"/>';
    }else if(coat==='uniform'){
      s+='<path d="M50 101 L60 112 L70 101 L66 99 L60 104 L54 99 Z" fill="'+c.shirt+'"/><path d="M60 112 L60 170" stroke="'+INK+'" stroke-width=".8" opacity=".5"/>';
      s+='<path d="M28 116 L46 108 L47 112 L29 120 Z M92 116 L74 108 L73 112 L91 120 Z" fill="'+c.suitS+'"/><path d="M35 117.4 L41 114.8 M37 119.4 L43 116.8" stroke="#D8B23C" stroke-width="1"/>';
      s+='<circle cx="46.5" cy="125" r="3.2" fill="#2c4a6e" stroke="#D8B23C" stroke-width=".7"/>';
    }else if(coat==='robe'){
      /* 法袍：深色长袍 + 一条彩色披带 */
      s+='<path d="M50 101 L60 114 L70 101" fill="'+c.shirt+'"/><path d="M47 104 L56 170 L44 170 L38 112 Z" fill="'+(c.stole||'#B8362B')+'"/><path d="M73 104 L64 170 L76 170 L82 112 Z" fill="'+(c.stole||'#B8362B')+'"/>';
      s+='<path d="M47 104 L56 170 M73 104 L64 170" stroke="'+(c.stoleT||'#D8A84E')+'" stroke-width="1.4" opacity=".8"/>';
      s+='<path d="M20 140 C26 130 30 124 36 120 M100 140 C94 130 90 124 84 120" stroke="'+INK+'" stroke-width=".8" fill="none" opacity=".3"/>';
    }else if(coat==='parka'){
      s+='<path d="M38 106 C44 98 52 96 60 96 C68 96 76 98 82 106 C78 112 70 114 60 114 C50 114 42 112 38 106 Z" fill="'+(c.fur||'#E9E2D2')+'"/>';
      for(let i=0;i<9;i++)s+='<circle cx="'+(40+i*5)+'" cy="'+(106+Math.abs(i-4)*-.6)+'" r="3" fill="'+(c.fur||'#E9E2D2')+'"/>';
      s+='<path d="M60 114 L60 170" stroke="'+c.suitS+'" stroke-width="2.4"/><path d="M14 140 L106 140" stroke="'+c.suitS+'" stroke-width="1.6" opacity=".6"/><rect x="66" y="128" width="12" height="8" rx="2" fill="'+(c.patch||'#E8775A')+'"/>';
    }else if(coat==='jumpsuit'){
      s+='<path d="M50 102 L60 112 L70 102" fill="'+c.shirt+'"/><path d="M60 112 L60 170" stroke="'+INK+'" stroke-width=".9" opacity=".45"/>';
      s+='<circle cx="44" cy="126" r="5" fill="'+(c.patch||'#F6C35B')+'"/><circle cx="44" cy="126" r="2.6" fill="'+c.suitS+'"/><rect x="70" y="122" width="14" height="5" rx="1" fill="#fff" opacity=".7"/>';
    }else if(coat==='work'){
      s+='<path d="M44 104 C48 112 54 116 60 116 C66 116 72 112 76 104" stroke="'+c.suitS+'" stroke-width="3" fill="none"/><path d="M20 138 L100 138" stroke="#E9C46A" stroke-width="2.4" opacity=".7"/>';
    }else if(coat==='casual'){
      s+='<path d="M48 102 C52 110 68 110 72 102" stroke="'+c.shirt+'" stroke-width="5" fill="none"/>';
    }
    /* 轮廓光 */
    const rim=c.rim||'#9ec2ff';
    s+='<path d="M7.5 168 L8.6 148 C9.6 130 16 119.6 30 114.6 C37 112 42 109 46 105.6" stroke="'+rim+'" stroke-width="1.3" fill="none" opacity=".35"/>';
    s+='<path d="M112.5 168 L111.4 148 C110.4 130 104 119.6 90 114.6 C83 112 78 109 74 105.6" stroke="'+rim+'" stroke-width="1.3" fill="none" opacity=".35"/>';
    return s;
  }
  function head(c,ex,key,hb){
    const F=FACE[c.face||'normal'];let s='';
    s+='<path d="M52.6 82 L52.6 99 Q60 104.4 67.4 99 L67.4 82 Z" fill="'+c.skin+'"/><path d="M52.6 82 L67.4 82 L67.4 93 Q60 97.6 52.6 93 Z" fill="'+c.skinS+'" opacity=".7"/>';
    if(!hb.noEars){s+='<ellipse cx="42.8" cy="62.4" rx="2.7" ry="5.2" fill="'+c.skin+'"/><ellipse cx="77.2" cy="62.4" rx="2.7" ry="5.2" fill="'+c.skinS+'"/>';
      if(c.earring)s+='<circle cx="42.6" cy="68.6" r="1.5" fill="'+c.earring+'"/><circle cx="77.4" cy="68.6" r="1.5" fill="'+c.earring+'"/>';}
    if(hb.scalp)s+='<path d="M42.5 58 C41 38 50 30 60 30 C70 30 79 38 77.5 58 Z" fill="'+c.skin+'"/><path d="M66 31.6 C74 35 78 44 77.5 58 L70 58 C71 46 69 38 66 31.6 Z" fill="'+c.skinS+'" opacity=".5"/>';
    s+='<clipPath id="cf-'+key+'"><path d="'+F+'"/></clipPath><path d="'+F+'" fill="'+c.skin+'"/>';
    s+='<g clip-path="url(#cf-'+key+')"><path d="M63.4 28 C71 44 71.6 66 62.6 92 L92 92 L92 28 Z" fill="'+c.skinS+'" opacity=".5"/>'+
       '<ellipse cx="51" cy="71" rx="5" ry="3.4" fill="#E0786A" opacity="'+(ex.blush?'.3':'.1')+'"/><ellipse cx="69" cy="71" rx="5" ry="3.4" fill="#C4665C" opacity="'+(ex.blush?'.26':'.07')+'"/></g>';
    s+='<path d="'+F+'" fill="none" stroke="'+INK+'" stroke-width=".6" opacity=".55"/>';
    if(c.lines){s+='<path d="M55.2 71.6 Q54.2 74.8 55.2 77.8 M64.8 71.6 Q65.8 74.8 64.8 77.8" stroke="'+c.skinS+'" stroke-width=".9" fill="none"/><path d="M51 50.4 Q60 48.8 69 50.4" stroke="'+c.skinS+'" stroke-width=".7" fill="none" opacity=".7"/>';}
    s+='<path d="M60.8 63.4 Q62.2 68.6 61.8 70.6 Q60.8 71.8 58.8 71.1" stroke="'+c.skinS+'" stroke-width="1.1" fill="none" stroke-linecap="round"/>';
    if(c.beard){s+='<path d="M44 66 C45 78 52 88.4 60 89.4 C68 88.4 75 78 76 66 C74 73.4 70 80 64.4 81.6 C61.4 80.4 58.6 80.4 55.6 81.6 C50 80 46 73.4 44 66 Z" fill="'+c.beard+'"/><path d="M54.2 74.8 Q60 72.2 65.8 74.8 Q60 76 54.2 74.8 Z" fill="'+c.beard+'"/>';}
    else if(c.mustache){s+='<path d="M54 75 Q57 73 60 74.4 Q63 73 66 75 Q63 76.6 60 75.6 Q57 76.6 54 75 Z" fill="'+c.mustache+'"/>';}
    s+='<g class="eyes">'+eyes(ex.eyes||'normal',c.iris)+'</g>';
    const bd=BROW[ex.brow||'neutral'],bc=c.brow||c.h;
    s+='<path d="'+bd+'" stroke="'+bc+'" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="'+mirror(bd)+'" stroke="'+bc+'" stroke-width="1.8" fill="none" stroke-linecap="round"/>';
    s+='<g class="m-c">'+mouth(ex.mouth,c.lip)+'</g><g class="m-o">'+(ex.mouth==='open'||ex.mouth==='shout'?mouth(ex.mouth,c.lip):TALK)+'</g>';
    if(c.glasses==='round'){s+='<g fill="rgba(220,235,255,.1)" stroke="'+(c.frame||'#2a2a2a')+'" stroke-width="1.1"><circle cx="52.5" cy="62" r="4.8"/><circle cx="67.5" cy="62" r="4.8"/></g><path d="M57.3 61.4 Q60 60.2 62.7 61.4 M47.7 61.2 L43 60.2 M72.3 61.2 L77 60.2" stroke="'+(c.frame||'#2a2a2a')+'" stroke-width="1" fill="none"/>';}
    else if(c.glasses==='rect'){s+='<g fill="rgba(220,235,255,.08)" stroke="'+(c.frame||'#1d1d1f')+'" stroke-width="1.15"><rect x="47.2" y="58.6" width="10.4" height="6.6" rx="2"/><rect x="62.4" y="58.6" width="10.4" height="6.6" rx="2"/></g><path d="M57.6 60.6 Q60 59.6 62.4 60.6 M47.2 60.4 L43 59.6 M72.8 60.4 L77 59.6" stroke="'+(c.frame||'#1d1d1f')+'" stroke-width="1" fill="none"/>';}
    if(ex.sweat){s+='<path d="M80.4 50 C82.4 53.4 83.4 55.4 83.4 56.8 A3 3 0 0 1 77.4 56.8 C77.4 55.4 78.4 53.4 80.4 50 Z" fill="#cfe3f6" stroke="'+INK+'" stroke-width=".5"/>';}
    return s;
  }
  function extras(c){
    let s='';
    if(c.pin)s+='<circle cx="44.6" cy="120" r="2" fill="#D8A84E"/>';
    if(c.pocket)s+='<path d="M77 126 L84 124.6 L82.4 129 Z" fill="'+c.pocket+'"/>';
    if(c.scarf)s+='<path d="M50 99 C54 104 66 104 70 99 L71 104 C66 109 54 109 49 104 Z" fill="'+c.scarf+'"/><path d="M62 106 L66 122 L60 118 Z" fill="'+c.scarf+'"/>';
    if(c.badge)s+='<path d="M54 100 L50 128 M66 100 L70 128" stroke="#3b5f8a" stroke-width="1.2" fill="none"/><rect x="45" y="127" width="11" height="14" rx="1" fill="#e9e4d8"/><rect x="47" y="130" width="7" height="3" fill="#3b5f8a"/>';
    if(c.turtle)s+='<path d="M51.6 92 C54 99 66 99 68.4 92 L69 102 C66 106 54 106 51 102 Z" fill="'+c.turtle+'"/>';
    if(c.necklace)s+='<path d="M50 100 Q60 112 70 100" stroke="'+c.necklace+'" stroke-width="1.4" fill="none"/><circle cx="60" cy="109" r="2.2" fill="'+c.necklace+'"/>';
    return s;
  }
  function bust(c,ex,key){
    ex=ex||{};
    const hb=HAIR[c.hair]?HAIR[c.hair]({h:c.h,hs:c.hs||c.h,hh:c.hh||'#fff',bead:c.bead}):{back:'',front:''};
    let s='<g class="breath">'+hb.back+torso(c)+extras(c);
    s+='<g class="headg">'+head(c,ex,key,hb)+hb.front;
    if(c.headset)s+='<path d="M42 58 C40 37 80 37 78 58" stroke="#26282d" stroke-width="2.2" fill="none"/><rect x="38.4" y="57" width="5.6" height="9.6" rx="2.4" fill="#2b2e35"/><path d="M41.4 66 C42 74 48 78.6 54.6 78" stroke="#2b2e35" stroke-width="1.3" fill="none"/>';
    s+='</g></g>';
    return s;
  }
  /* 背光剪影：两侧的边裁 */
  function silhouette(alpha,rimC){
    const rc=rimC||'#e8d6ad';
    let s='<g opacity="'+(alpha==null?1:alpha)+'"><path d="M10 170 C12 132 26 110 46 103 L60 107 L74 103 C94 110 108 132 110 170 Z" fill="#0c1018"/>';
    s+='<path d="M52.6 82 L52.6 99 Q60 104 67.4 99 L67.4 82 Z" fill="#0e121a"/><path d="'+FACE.narrow+'" fill="#141923"/>';
    s+='<path d="M43 55 C41.6 40 49.6 30.6 60.6 30.6 C71.6 30.6 78.6 39 77 55 C75.8 47.4 71.4 42.6 64.4 41.6 C58 41 51.4 42.4 46.4 45.6 C44.6 48.4 43.6 51.6 43 55 Z" fill="#0c0f16"/>';
    s+='<path d="M10 168 C12 134 26 111 46 104 M110 168 C108 134 94 111 74 104 M43.6 64 C42.6 50 46 40 55 34 M76.4 64 C77.4 50 74 40 65 34" stroke="'+rc+'" stroke-width="1.4" fill="none" opacity=".5"/></g>';
    return s;
  }
  return {SKINS:SKINS,HAIR_TYPES:Object.keys(HAIR),bust:bust,silhouette:silhouette};
})();
