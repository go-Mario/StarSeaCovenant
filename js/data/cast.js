"use strict";
/* =====================================================================
   角色表。星海仲裁院的人来自世界各地：
   名字、肤色、发型都按各自的出身设计，没有谁是“默认款”。
   sk = 肤色档（0 最浅 · 7 最深），见 PORTRAIT.SKINS
   ===================================================================== */
const SUIT_COLORS=[
  {suit:'#22304A',suitS:'#141D2E',name:'藏青'},
  {suit:'#1F6F78',suitS:'#134A50',name:'松石'},
  {suit:'#6E2433',suitS:'#4A1622',name:'酒红'},
  {suit:'#8A6A2E',suitS:'#5F481D',name:'赭石'}];
const PLAYER_HAIRS=[
  {id:'tied',name:'马尾'},{id:'bob',name:'短发'},{id:'coily',name:'蓬松卷'},{id:'locs',name:'脏辫'},
  {id:'braids',name:'编发'},{id:'bun',name:'盘发'},{id:'buzz',name:'寸头'},{id:'hijab',name:'头巾'}];
const PLAYER_HAIR_COLOR={tied:'#1C1A1F',bob:'#2A2420',coily:'#1E1814',locs:'#221A15',braids:'#1A1512',bun:'#3A2A1E',buzz:'#1C1A1F',hijab:'#2E5E8C'};

function sk(i){return PORTRAIT.SKINS[clamp(i,0,7)];}
function spec(o){const s=sk(o.sk==null?3:o.sk);return Object.assign({skin:s.skin,skinS:s.skinS,lip:s.lip},o);}

const CAST_DEF={
 /* ---- 带教 ---- */
 chen:{n:'陈岚',tag:'带教律师',side:'left',col:'#D8A84E',v:[430,'triangle'],
   s:spec({sk:2,hair:'bob',h:'#3A3634',hh:'#C9C4BC',suit:'#2B2B30',suitS:'#18181C',shirt:'#3A3A40',turtle:'#33333A',glasses:'rect',lines:true,iris:'#3B2C22'})},
 /* ---- 1978 ---- */
 menon:{n:'拉胡尔·梅农',tag:'首席仲裁员',side:'mid',col:'#E9D3A0',v:[210,'triangle'],
   s:spec({sk:4,hair:'side',h:'#E8E4DC',hh:'#fff',brow:'#E0DCD4',mustache:'#E8E4DC',face:'wide',coat:'robe',suit:'#1B1E26',suitS:'#101218',shirt:'#EDEBE4',stole:'#7A2430',stoleT:'#D8A84E',glasses:'round',frame:'#7A6A4A',lines:true})},
 corvinY:{n:'科尔文',tag:'北方联盟代理人',side:'right',col:'#A183C9',v:[300,'square'],
   s:spec({sk:1,hair:'swept',h:'#3A2C22',hh:'#7A6450',face:'narrow',suit:'#4A3A2A',suitS:'#2E2318',shirt:'#E8DFC8',tie:'#8A3A2A',pocket:'#C9962E',iris:'#4A5560'})},
 bella:{n:'贝拉',tag:'北方联盟气象站站长',side:'right',col:'#D1955A',v:[620,'sine'],
   s:spec({sk:0,hair:'curly',h:'#8A4A2A',hh:'#C27A4A',coat:'knit',suit:'#7B5A34',suitS:'#5A4024',shirt:'#E9E0CF',glasses:'round',frame:'#3D3226',badge:true,face:'soft',iris:'#4A3020'})},
 nuna:{n:'努娜',tag:'荒原巡护员',side:'right',col:'#E8775A',v:[560,'triangle'],
   s:spec({sk:3,hair:'braids',h:'#1D1A1A',hh:'#5A5050',bead:'#D4574A',coat:'parka',suit:'#2F6B8F',suitS:'#1E4A66',shirt:'#E9E2D2',fur:'#EFE8DA',patch:'#E8775A',face:'round',iris:'#2A1E18'})},
 /* ---- 2009 ---- */
 nkomo:{n:'阿玛拉·恩科莫',tag:'首席仲裁员',side:'mid',col:'#7FD1C1',v:[240,'triangle'],
   s:spec({sk:6,hair:'crop',h:'#4A4642',hh:'#D8D2C8',coat:'robe',suit:'#161A22',suitS:'#0E1118',shirt:'#F0EDE6',stole:'#1F6F78',stoleT:'#D8A84E',glasses:'round',frame:'#C9962E',earring:'#D8A84E',lines:true,face:'soft',iris:'#24180F'})},
 corvin:{n:'科尔文',tag:'北方联盟代理人',side:'right',col:'#A183C9',v:[290,'square'],
   s:spec({sk:1,hair:'swept',h:'#C9CED8',hh:'#F2F4F8',brow:'#8A909C',face:'narrow',suit:'#2A2236',suitS:'#17121F',shirt:'#D9DDE6',tie:'#6B1F2A',pocket:'#7D2633',lines:true,iris:'#4A5560'})},
 sokol:{n:'索科尔',tag:'北方联盟轨道管制主任',side:'right',col:'#8FA9C7',v:[280,'triangle'],
   s:spec({sk:1,hair:'short',h:'#5A5048',hh:'#9A9088',coat:'uniform',suit:'#3D4A5A',suitS:'#2A3442',shirt:'#C9D2DC',headset:true,face:'wide',lines:true,iris:'#2C2A26'})},
 priya:{n:'普丽娅·拉奥',tag:'晨星航运飞控工程师',side:'left',col:'#E9A23B',v:[600,'sine'],
   s:spec({sk:4,hair:'long',h:'#151012',hh:'#4A3A3A',coat:'jumpsuit',suit:'#1F6F78',suitS:'#134A50',shirt:'#E9E2D2',patch:'#F6C35B',earring:'#D8A84E',iris:'#24160E'})},
 /* ---- 2031 ---- */
 leila:{n:'莱拉·哈达德',tag:'蓝洲联合体代理人',side:'right',col:'#D46A7E',v:[520,'triangle'],
   s:spec({sk:2,hair:'long',h:'#2A1C16',hh:'#6A4A3A',suit:'#5E2130',suitS:'#3E1520',shirt:'#EFE6DA',earring:'#D8A84E',face:'narrow',iris:'#3A2418'})},
 wendy:{n:'温黛·莫拉莱斯',tag:'蓝洲外空事务发言人',side:'right',col:'#6FB2AD',v:[580,'sine'],
   s:spec({sk:3,hair:'sleek',h:'#141416',hh:'#4A4A52',suit:'#E6E2DA',suitS:'#B9B3A8',shirt:'#E6E2DA',scarf:'#2F6F73',face:'narrow',iris:'#2A2420'})},
 haya:{n:'早川诚',tag:'星尘清除公司任务总监',side:'left',col:'#5FA9FF',v:[360,'triangle'],
   s:spec({sk:1,hair:'buzz',h:'#1C1A1F',coat:'jumpsuit',suit:'#22304A',suitS:'#141D2E',shirt:'#C9D2DC',patch:'#5FA9FF',headset:true,iris:'#1E1814'})},
 /* ---- 2043 ---- */
 mag:{n:'麦格林',tag:'晨星矿业首席执行官',side:'right',col:'#86B494',v:[250,'square'],
   s:spec({sk:0,hair:'side',h:'#CFC4A8',hh:'#EFE8D2',brow:'#A39D90',beard:'#C4BCA4',face:'wide',suit:'#1F3329',suitS:'#13211A',shirt:'#E6E4DC',tie:'#B08A3C',lines:true,iris:'#3A3A30'})},
 tamaY:{n:'塔玛·卡哈努',tag:'拾星合作社负责人',side:'left',col:'#F0A06A',v:[500,'triangle'],
   s:spec({sk:5,hair:'curly',h:'#1A1412',hh:'#4A3A30',coat:'work',suit:'#D96C4A',suitS:'#A84E33',shirt:'#F3EDE1',necklace:'#F3EDE1',face:'round',iris:'#1E140E'})},
 /* ---- 2052 ---- */
 rocha:{n:'伊莎贝尔·罗沙',tag:'南极光开发联合体代理人',side:'left',col:'#E9C46A',v:[540,'triangle'],
   s:spec({sk:6,hair:'braids',h:'#141010',hh:'#4A3A30',bead:'#E9C46A',suit:'#9A7428',suitS:'#6E521A',shirt:'#F3EDE1',earring:'#E9C46A',face:'soft',iris:'#1E140E'})},
 nurlan:{n:'阿斯兰·努尔兰',tag:'环月科研共同体代理人',side:'right',col:'#8EC5E8',v:[320,'triangle'],
   s:spec({sk:2,hair:'short',h:'#141214',hh:'#4A4650',suit:'#33465E',suitS:'#223040',shirt:'#E2E8EE',tie:'#2F6FE4',glasses:'rect',face:'wide',iris:'#1E1814'})},
 adeyemi:{n:'奥莫·阿德耶米',tag:'南极光现场总工程师',side:'left',col:'#F0884A',v:[270,'triangle'],
   s:spec({sk:7,hair:'locs',h:'#151110',hh:'#6A5A4A',coat:'jumpsuit',suit:'#D96C2C',suitS:'#A84E1C',shirt:'#F3EDE1',patch:'#22304A',face:'wide',iris:'#1A100A'})},
 kim:{n:'金素妍',tag:'共同体月震学家',side:'right',col:'#B9A6E8',v:[640,'sine'],
   s:spec({sk:1,hair:'bob',h:'#121014',hh:'#4A4652',coat:'knit',suit:'#7A6AA8',suitS:'#55497A',shirt:'#EEE8F4',glasses:'round',frame:'#2A2A2A',iris:'#1E1814'})},
 /* ---- 2077 ---- */
 tama:{n:'塔玛·卡哈努',tag:'星海仲裁院院长',side:'mid',col:'#F0A06A',v:[470,'triangle'],
   s:spec({sk:5,hair:'curly',h:'#B8B2AA',hh:'#EFEAE2',coat:'robe',suit:'#161A22',suitS:'#0E1118',shirt:'#F0EDE6',stole:'#D96C4A',stoleT:'#F3EDE1',necklace:'#F3EDE1',lines:true,face:'round',iris:'#1E140E'})},
 bankole:{n:'奥卢·班科勒',tag:'仲裁员',side:'mid',col:'#C9B386',v:[230,'triangle'],
   s:spec({sk:6,hair:'bald',h:'#2A2420',beard:'#8A847C',coat:'robe',suit:'#161A22',suitS:'#0E1118',shirt:'#F0EDE6',stole:'#2F6FE4',stoleT:'#D8A84E',lines:true,face:'wide',iris:'#1A100A'})},
 marquez:{n:'埃琳娜·马尔克斯',tag:'回声基金会代理人',side:'left',col:'#F28C6B',v:[560,'triangle'],
   s:spec({sk:3,hair:'bun',h:'#3A2418',hh:'#7A5A44',suit:'#B8503A',suitS:'#86382A',shirt:'#F3EDE1',earring:'#E9C46A',face:'soft',iris:'#2A1A10'})},
 hassan:{n:'努尔·哈桑',tag:'外空协调理事会代理人',side:'right',col:'#7FB2E5',v:[500,'triangle'],
   s:spec({sk:4,hair:'hijab',h:'#2E5E8C',hh:'#6E9CC8',hs:'#1E3E60',suit:'#1D2A44',suitS:'#121B2E',shirt:'#E6ECF4',face:'soft',iris:'#24160E'})},
 li:{n:'李星澜',tag:'射电天文学家',side:'right',col:'#5FD3E6',v:[610,'sine'],
   s:spec({sk:2,hair:'tied',h:'#141214',hh:'#4A4650',coat:'casual',suit:'#2F6FE4',suitS:'#1F4FAA',shirt:'#F3EDE1',iris:'#1E1814'})}
};
/* 表情变体：同一个人，不同神情 */
const EXPR={
  'chen':{brow:'soft',mouth:'neutral',eyes:'narrow'},'chen-smile':{brow:'soft',mouth:'smile'},'chen-worry':{brow:'worried',mouth:'frown'},
  'menon':{brow:'stern',mouth:'neutral'},
  'corvinY':{brow:'raised',eyes:'narrow',mouth:'smirk'},'corvinY-angry':{brow:'angry',eyes:'narrow',mouth:'shout',blush:true},
  'bella':{brow:'neutral',mouth:'neutral'},'bella-shock':{brow:'worried',eyes:'wide',mouth:'open',sweat:true},
  'nuna':{brow:'neutral',mouth:'neutral'},'nuna-smile':{brow:'soft',mouth:'smile'},
  'nkomo':{brow:'stern',mouth:'neutral'},'nkomo-smile':{brow:'soft',mouth:'smile'},
  'corvin':{brow:'raised',eyes:'narrow',mouth:'smirk'},'corvin-angry':{brow:'angry',eyes:'narrow',mouth:'shout',blush:true},
  'sokol':{brow:'stern',mouth:'grim'},'sokol-shock':{brow:'raised',eyes:'wide',mouth:'open',sweat:true},
  'priya':{brow:'neutral',mouth:'neutral'},
  'leila':{brow:'raised',mouth:'smirk',eyes:'narrow'},'leila-angry':{brow:'angry',mouth:'shout'},
  'wendy':{brow:'neutral',mouth:'neutral',eyes:'narrow'},'wendy-shock':{brow:'worried',eyes:'wide',mouth:'frown',blush:true},
  'haya':{brow:'neutral',mouth:'neutral'},
  'mag':{brow:'stern',mouth:'smile'},'mag-sweat':{brow:'worried',eyes:'down',mouth:'grim',sweat:true},'mag-angry':{brow:'angry',mouth:'shout'},
  'tamaY':{brow:'neutral',mouth:'neutral'},'tamaY-smile':{brow:'soft',mouth:'grin'},
  'rocha':{brow:'neutral',mouth:'smirk'},'rocha-worry':{brow:'worried',mouth:'frown'},
  'nurlan':{brow:'stern',mouth:'neutral'},'nurlan-angry':{brow:'angry',mouth:'shout'},
  'adeyemi':{brow:'neutral',mouth:'neutral'},'adeyemi-worry':{brow:'worried',eyes:'down',mouth:'grim',sweat:true},
  'kim':{brow:'neutral',mouth:'neutral'},'kim-worry':{brow:'worried',mouth:'frown'},
  'tama':{brow:'soft',mouth:'smile'},'tama-stern':{brow:'stern',mouth:'neutral'},
  'bankole':{brow:'stern',mouth:'neutral'},
  'marquez':{brow:'raised',mouth:'smile'},'marquez-worry':{brow:'worried',mouth:'frown'},
  'hassan':{brow:'stern',mouth:'neutral'},'hassan-worry':{brow:'worried',mouth:'frown'},
  'li':{brow:'neutral',mouth:'neutral'},'li-smile':{brow:'soft',mouth:'smile'},
  'me':{brow:'neutral',mouth:'smirk'},'me-serious':{brow:'stern',mouth:'neutral'},'me-smile':{brow:'soft',mouth:'smile'}
};
function baseOf(key){return key.split('-')[0];}
function playerSpec(){
  const p=S.profile,c=SUIT_COLORS[p.suit||0]||SUIT_COLORS[0];
  return spec({sk:p.skin,hair:p.hair,h:PLAYER_HAIR_COLOR[p.hair]||'#1C1A1F',hh:p.hair==='hijab'?'#6E9CC8':'#5A5866',hs:p.hair==='hijab'?'#1E3E60':null,
    suit:c.suit,suitS:c.suitS,shirt:'#E8E6E0',pin:true,iris:'#2A1E18',face:'normal'});
}
/* 说话人信息：名字、名牌颜色、站位、声音 */
const ROLE_TAG={me:'本方代理人'};
function who(key){
  const b=baseOf(key);
  if(b==='me')return {n:S.profile.name||'简',tag:ROLE_TAG.me,side:ROLE_TAG.meSide||'left',col:'#5FA9FF',svg:'pt-'+key};
  if(b==='narr')return {n:'',tag:'',side:'none',col:'#A8B4CC'};
  if(b==='clerk')return {n:'书记员',tag:'',side:'none',col:'#A8B4CC'};
  const d=CAST_DEF[b];if(!d)return {n:key,tag:'',side:'right',col:'#ccc'};
  return {n:d.n,tag:d.tag,side:d.side,col:d.col,svg:'pt-'+key};
}
function voiceOf(key){const b=baseOf(key);if(b==='me')return [520,'triangle'];const d=CAST_DEF[b];return d?d.v:[440,'triangle'];}

/* 把所有立绘注册成 <symbol>，之后用 <use href="#pt-xxx"> 引用 */
function registerPortraits(onlyPlayer){
  const host=byId('artDefs');if(!host)return;
  function add(id,inner){
    const old=byId(id);if(old)old.parentNode.removeChild(old);
    const sym=document.createElementNS('http://www.w3.org/2000/svg','symbol');
    sym.setAttribute('id',id);sym.setAttribute('viewBox','0 0 120 170');sym.innerHTML=inner;host.appendChild(sym);
  }
  Object.keys(EXPR).forEach(function(k){
    const b=baseOf(k);
    if(onlyPlayer&&b!=='me')return;
    const sp=b==='me'?playerSpec():(CAST_DEF[b]&&CAST_DEF[b].s);
    if(!sp)return;
    add('pt-'+k,PORTRAIT.bust(sp,EXPR[k],'k'+k.replace(/[^a-z0-9]/gi,'')));
  });
  if(!onlyPlayer)add('pt-silhouette',PORTRAIT.silhouette(1,'#d6c49a'));
}
/* 独立渲染一张立绘（头像设置预览、档案页用） */
function portraitSVG(key,cls){return '<svg class="'+(cls||'')+'" viewBox="0 0 120 170"><use href="#pt-'+key+'"/></svg>';}
function avatarSVG(key){return '<svg viewBox="36 30 48 48"><use href="#pt-'+key+'" width="120" height="170"/></svg>';}
