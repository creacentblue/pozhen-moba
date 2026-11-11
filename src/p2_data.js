/* ---------- 数据：英雄 / 道具 / 小兵 ---------- */
const RANKS=[0,1,2,3,4];
const HEROES=[
 {id:'yue',name:'霍破岳',title:'玄甲战士 · 近战坦克斗士',glyph:'岳',color:'#e0a548',melee:true,range:135,r:30,
  hp:[680,98],mana:[300,40],ad:[66,4.8],armor:[40,4.2],mr:[32,1.6],ms:345,as:[.70,.025],hpr:[9,.65],mpr:[5,.4],
  desc:'身披玄铁重甲的前线斗士。能冲能扛，用控制把对手钉在原地，适合新手，也是推塔的好手。',
  prio:[0,2,1],buy:['boots','heart','armor','sword','blade','cloak','heart','armor'],
  ab:[
   {n:'断岳冲',key:'Q',cd:[9,8.5,8,7.5,7],mana:[50,55,60,65,70],aim:'dash',range:420,use:'gap',
    d:'向鼠标方向突进，沿途造成物理伤害，并击晕撞到的第一名英雄 0.6 秒。',
    cast(h,tx,ty,k){const a=ang(h,tx,ty);let hit=false;
      startDash(h,{a,dist:420,speed:1500,trail:'#f0c870',onUnit(u){if(u.kind==='hero'||u.kind==='minion'){dmgUnit(h,u,[70,110,150,190,230][k]+.8*h.ad,'p');if(u.kind==='hero'&&!hit){hit=true;stun(u,.6+.05*k)}}}});
      sfx('castQ',h.x,h.y)}},
   {n:'磐石护体',key:'W',cd:[16,15,14,13,12],mana:[60,65,70,75,80],aim:'self',range:600,use:'buff',
    d:'凝聚护盾 3.5 秒（吸收量随生命上限提升），并获得 2 秒加速。',
    cast(h,tx,ty,k){addShield(h,[100,150,200,250,300][k]+.15*h.maxhp,3.5);addBuff(h,'ms',.2,2);fxRing(h.x,h.y,90,'#ffe9a0',.5,6);sfx('castW',h.x,h.y)}},
   {n:'裂地旋风',key:'E',cd:[8,7.5,7,6.5,6],mana:[55,58,61,64,67],aim:'self',range:270,use:'dmg',
    d:'挥舞战刃旋转一周，对周围敌人造成物理伤害并减速 40%。',
    cast(h,tx,ty,k){fxSpin(h,270,'#f2c870');for(const u of enemiesIn(h.team,h.x,h.y,270)){dmgUnit(h,u,[60,95,130,165,200][k]+.55*h.ad,'p');slow(u,.4,1.8)}sfx('castE',h.x,h.y)}},
   {n:'天崩地裂',key:'R',ult:true,cd:[80,65,50],mana:[100,100,100],aim:'ground',range:680,use:'cc',aoe:330,
    d:'腾空跃向目标区域，落地造成大量物理伤害并击晕范围内敌人 1.2 秒。',
    cast(h,tx,ty,k){let d=Math.min(680,Math.hypot(tx-h.x,ty-h.y));const a=ang(h,tx,ty);
      startDash(h,{a,dist:Math.max(120,d),speed:Math.max(120,d)/.5,leap:true,onEnd(){
        fxRing(h.x,h.y,330,'#ffd88a',.55,10);fxBurst(h.x,h.y,'#e8b868',34,380);shake(14,h.x,h.y);sfx('boom',h.x,h.y);
        for(const u of enemiesIn(h.team,h.x,h.y,330)){dmgUnit(h,u,[220,320,420][k]+1.0*h.ad,'p');stun(u,1.2)}}});
      sfx('castR',h.x,h.y)}},
  ]},
 {id:'shuang',name:'柳听霜',title:'寒羽射手 · 远程持续输出',glyph:'霜',color:'#79d4ee',melee:false,range:540,r:26,
  hp:[540,82],mana:[340,45],ad:[60,3.9],armor:[26,3.3],mr:[30,1.2],ms:335,as:[.70,.03],hpr:[6,.5],mpr:[6,.5],
  desc:'手持寒羽长弓，射程远、爆发高。站在后排持续输出，一发长矢可以隔着半张地图终结残血敌人。',
  prio:[0,2,1],buy:['bow','boots','sword','blade','bow','sword','armor','heart'],
  ab:[
   {n:'穿云箭',key:'Q',cd:[6.5,6,5.5,5,4.5],mana:[55,60,65,70,75],aim:'dir',range:980,speed:1800,r:40,use:'dmg',
    d:'射出一支穿透所有敌人的利箭，造成物理伤害。',
    cast(h,tx,ty,k){const a=ang(h,tx,ty);spawnProj({team:h.team,owner:h,x:h.x,y:h.y,a,speed:1800,range:980,r:40,pierce:true,color:'#bfeeff',style:'arrow',
      onHit(u){dmgUnit(h,u,[60,105,150,195,240][k]+1.05*h.ad,'p')}});sfx('shoot',h.x,h.y)}},
   {n:'疾风诀',key:'W',cd:[14,13,12,11,10],mana:[40,40,40,40,40],aim:'self',range:700,use:'buff',
    d:'4 秒内攻击速度大幅提升，并获得 20% 移速。',
    cast(h,tx,ty,k){addBuff(h,'as',[.4,.5,.6,.7,.8][k],4);addBuff(h,'ms',.2,4);fxRing(h.x,h.y,80,'#bff6ff',.5,5);sfx('castW',h.x,h.y)}},
   {n:'寒霜箭雨',key:'E',cd:[11,10.5,10,9.5,9],mana:[65,68,71,74,77],aim:'ground',range:720,r:230,use:'cc',
    d:'指定区域落下箭雨，造成物理伤害并使敌人减速 50%，持续 2.2 秒。',
    cast(h,tx,ty,k){const p=clampRange(h,tx,ty,720);spawnZone({team:h.team,owner:h,x:p.x,y:p.y,r:230,delay:.4,dur:0,color:'#8fdcff',style:'rain',
      onDetonate(z){for(const u of enemiesIn(h.team,z.x,z.y,230)){dmgUnit(h,u,[50,85,120,155,190][k]+.5*h.ad,'p');slow(u,.5,2.2)}fxBurst(z.x,z.y,'#cdf3ff',22,260);sfx('castE',z.x,z.y)}});sfx('castE',h.x,h.y)}},
   {n:'破晓长矢',key:'R',ult:true,cd:[100,85,70],mana:[100,100,100],aim:'dir',range:2100,speed:2200,r:55,use:'cc',
    d:'射出超远程的巨型光矢，命中的第一名敌方英雄受到重创并被击晕 0.9 秒，周围敌人受到溅射。',
    cast(h,tx,ty,k){const a=ang(h,tx,ty);spawnProj({team:h.team,owner:h,x:h.x,y:h.y,a,speed:2200,range:2100,r:55,heroOnly:true,color:'#ffffff',style:'beam',
      onHit(u,p){dmgUnit(h,u,[260,420,580][k]+1.4*h.ad,'p');stun(u,.9);for(const v of enemiesIn(h.team,u.x,u.y,200)){if(v!==u)dmgUnit(h,v,.6*([260,420,580][k]+1.4*h.ad),'p')}fxRing(u.x,u.y,200,'#e6fbff',.4,6);fxBurst(u.x,u.y,'#ffffff',24,320);shake(8,u.x,u.y);sfx('boom',u.x,u.y)}});
      sfx('castR',h.x,h.y)}},
  ]},
 {id:'ji',name:'苏玄机',title:'天象法师 · 远程范围爆发',glyph:'机',color:'#c79bff',melee:false,range:500,r:26,
  hp:[520,78],mana:[420,58],ad:[54,3.2],armor:[22,3.0],mr:[30,1.2],ms:335,as:[.65,.02],hpr:[6,.5],mpr:[8,.7],
  desc:'精通符箓与天象之术。技能决定一切——预判走位命中惊雷，再用缚灵阵与焚天烈焰收割残局。',
  prio:[0,2,1],buy:['staff','boots','orb','tome','staff','cloak','heart','armor'],
  ab:[
   {n:'惊雷符',key:'Q',cd:[6,5.7,5.4,5.1,4.8],mana:[60,65,70,75,80],aim:'dir',range:880,speed:1350,r:42,use:'dmg',
    d:'掷出雷符，命中第一个敌人后爆炸，对范围内敌人造成魔法伤害。',
    cast(h,tx,ty,k){const a=ang(h,tx,ty);spawnProj({team:h.team,owner:h,x:h.x,y:h.y,a,speed:1350,range:880,r:42,stopAny:true,color:'#d9b8ff',style:'orb',
      onHit(u,p){boomAt(p.x,p.y)},onExpire(p){boomAt(p.x,p.y)}});
      function boomAt(x,y){fxRing(x,y,150,'#e1c6ff',.35,6);fxBurst(x,y,'#cfa6ff',16,260);sfx('hit',x,y);for(const u of enemiesIn(h.team,x,y,150))dmgUnit(h,u,[70,115,160,205,250][k]+.7*h.ap,'m')}
      sfx('castQ',h.x,h.y)}},
   {n:'瞬影步',key:'W',cd:[15,13.5,12,10.5,9],mana:[60,60,60,60,60],aim:'dash',range:460,use:'escape',
    d:'向鼠标方向瞬间位移，随后 1.5 秒内移速提升 30%。',
    cast(h,tx,ty,k){const a=ang(h,tx,ty);fxBurst(h.x,h.y,'#caa0ff',18,240);fxRing(h.x,h.y,60,'#e8d4ff',.35,4);
      h.x+=Math.cos(a)*460;h.y+=Math.sin(a)*460;clampWalk(h);fxBurst(h.x,h.y,'#caa0ff',18,240);fxRing(h.x,h.y,60,'#e8d4ff',.35,4);addBuff(h,'ms',.3,1.5);h.order=null;sfx('castW',h.x,h.y)}},
   {n:'缚灵阵',key:'E',cd:[12,11.5,11,10.5,10],mana:[70,74,78,82,86],aim:'ground',range:760,r:215,use:'cc',
    d:'在目标区域布下法阵，0.75 秒后爆发：造成魔法伤害并禁锢敌人 1.3 秒（无法移动）。',
    cast(h,tx,ty,k){const p=clampRange(h,tx,ty,760);spawnZone({team:h.team,owner:h,x:p.x,y:p.y,r:215,delay:.75,dur:0,color:'#c79bff',style:'rune',
      onDetonate(z){for(const u of enemiesIn(h.team,z.x,z.y,215)){dmgUnit(h,u,[60,100,140,180,220][k]+.6*h.ap,'m');root(u,1.3)}fxBurst(z.x,z.y,'#e0c8ff',24,240);sfx('boom',z.x,z.y)}});sfx('castE',h.x,h.y)}},
   {n:'焚天烈焰',key:'R',ult:true,cd:[90,75,60],mana:[120,120,120],aim:'ground',range:820,r:340,use:'cc',
    d:'召唤烈焰领域，持续 3.6 秒，每 0.4 秒灼烧范围内敌人并减速 35%。',
    cast(h,tx,ty,k){const p=clampRange(h,tx,ty,820);spawnZone({team:h.team,owner:h,x:p.x,y:p.y,r:340,delay:.3,dur:3.6,tick:.4,color:'#ff7a3a',style:'fire',
      onTick(z){for(const u of enemiesIn(h.team,z.x,z.y,340)){dmgUnit(h,u,[40,62,84][k]+.18*h.ap,'m');slow(u,.35,.6)}}});sfx('castR',h.x,h.y)}},
  ]},
];
const ITEMS=[
 {id:'boots',n:'疾行靴',g:'靴',cost:300,ms:40,d:'移速 +40'},
 {id:'sword',n:'精铁长剑',g:'剑',cost:350,ad:25,d:'攻击 +25'},
 {id:'bow',n:'迅捷弓弦',g:'弦',cost:400,as:.3,d:'攻速 +30%'},
 {id:'blade',n:'嗜血刃',g:'血',cost:650,ad:20,ls:.12,d:'攻击 +20，吸血 12%'},
 {id:'edge',n:'破军长刃',g:'破',cost:1050,ad:55,as:.1,d:'攻击 +55，攻速 +10%'},
 {id:'staff',n:'奥术法杖',g:'杖',cost:450,ap:45,d:'法强 +45'},
 {id:'tome',n:'玄机古卷',g:'卷',cost:800,ap:70,cdr:.1,mana:150,d:'法强 +70，冷却缩减 10%，法力 +150'},
 {id:'orb',n:'凝神宝珠',g:'珠',cost:400,mana:300,mpr:3,d:'法力 +300，回蓝 +3/秒'},
 {id:'armor',n:'玄铁甲',g:'甲',cost:400,armor:30,d:'护甲 +30'},
 {id:'cloak',n:'明光袍',g:'袍',cost:400,mr:30,d:'魔抗 +30'},
 {id:'heart',n:'磐石之心',g:'心',cost:450,hp:300,hpr:4,d:'生命 +300，回血 +4/秒'},
 {id:'ward',n:'天罡战甲',g:'罡',cost:900,armor:45,mr:25,hp:200,d:'护甲 +45，魔抗 +25，生命 +200'},
];
const ITEMBYID={};ITEMS.forEach(i=>ITEMBYID[i.id]=i);
const POTION={cost:50,heal:200,dur:6,max:4};
const MINION={
 melee:{hp:480,ad:21,r:17,range:82,ms:178,as:1.0,gold:21,xp:58,armor:8,mr:0,wind:.18},
 ranged:{hp:320,ad:30,r:15,range:430,ms:178,as:1.15,gold:17,xp:34,armor:0,mr:0,wind:.2},
 brute:{hp:1700,ad:75,r:27,range:105,ms:172,as:1.1,gold:70,xp:90,armor:45,mr:30,wind:.2},
 siege:{hp:880,ad:50,r:22,range:470,ms:165,as:1.5,gold:44,xp:72,armor:25,mr:10,wind:.25},
};
const TOWERS=[ // 外塔、中塔、内塔
 {hp:2500,ad:175,armor:40,mr:40,range:720,r:46},
 {hp:2800,ad:190,armor:45,mr:45,range:720,r:48},
 {hp:3100,ad:205,armor:50,mr:50,range:720,r:50},
];
const TOWER_S=[.34,.23,.12];
const NEXUS_HP=3600;
const TEAMS=[{name:'青岚营',col:'#4fc4e0',dark:'#1c6a82',light:'#a8ecff'},{name:'赤焰营',col:'#ee6a4c',dark:'#8a2c1c',light:'#ffc0a8'}];
