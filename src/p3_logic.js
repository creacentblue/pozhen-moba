/* ---------- 游戏状态与规则 ---------- */
let G=null,UID=1;
const XPN=l=>140+65*l;
const MAXLV=15;
function newGame(o){
  UID=1;
  G={t:0,units:[],heroes:[],projs:[],zones:[],fx:[],texts:[],feed:[],banners:[],towers:[[],[]],nexus:[null,null],spawnQ:[],
     waveT:4,waveN:0,over:false,winner:-1,endT:0,speed:o.speed||1,diff:o.diff,auto:o.auto,paused:false,kills:[0,0],towerKills:[0,0],
     cam:{x:NEXUS_POS[0].x+200,y:NEXUS_POS[0].y,ox:0,oy:0,shake:0},order:null,marks:[],hint:0,resShown:false,player:null,heroSel:o.hero};
  for(let t=0;t<2;t++){
    const n=NEXUS_POS[t];const u={id:UID++,kind:'nexus',team:t,x:n.x,y:n.y,r:92,hp:NEXUS_HP,maxhp:NEXUS_HP,armor:30,mr:30,dead:false,name:'龙脉晶'};
    G.nexus[t]=u;G.units.push(u);
    for(let i=0;i<3;i++){
      const T=TOWERS[i];const s=t===0?TOWER_S[i]*PL:PL*(1-TOWER_S[i]);const p=posAt(s);
      const tw={id:UID++,kind:'tower',team:t,idx:i,x:p[0],y:p[1],r:T.r,hp:T.hp,maxhp:T.hp,ad:T.ad,armor:T.armor,mr:T.mr,range:T.range,atkCd:.5,force:null,forceT:0,stack:0,last:null,dead:false,name:['外塔','中塔','内塔'][i]};
      G.towers[t][i]=tw;G.units.push(tw);
    }
  }
  const ids=HEROES.map((h,i)=>i);const mine=o.hero;
  const others=ids.filter(i=>i!==mine).sort(()=>Math.random()-.5);
  const foes=ids.slice().sort(()=>Math.random()-.5).slice(0,2);
  const pick=[[mine,others[0]],foes];
  for(let t=0;t<2;t++)for(let i=0;i<2;i++)mkHero(HEROES[pick[t][i]],t,i,t===0&&i===0);
  G.player=G.heroes[0];G.player.ctrl='player';
  const c=G.player;G.cam.x=c.x;G.cam.y=c.y;
}
function mkHero(def,team,idx,isP){
  const h={id:UID++,kind:'hero',team,def,idx,name:def.name,x:0,y:0,r:def.r,level:1,xp:0,sp:1,ranks:[0,0,0,0],cds:[0,0,0,0],gold:500,items:[],potions:1,potT:0,
    k:0,d:0,a:0,cs:0,dmgDealt:0,dmgTaken:0,streak:0,dead:false,deadT:0,order:null,atkCd:0,windup:null,stun:0,slow:0,slowT:0,rootT:0,shield:0,shieldT:0,buffs:[],dash:null,recall:0,face:team===0?0:Math.PI,
    vx:0,vy:0,hp:1,maxhp:1,mana:1,maxmana:1,castAnim:0,dmgBy:{},swing:0,ctrl:'ai',buyIdx:0,z:0,hurtT:-9,
    ai:{think:0,state:'farm',lane:rnd(-110,110),retreat:false,mode:'',skill:[.5,.75,.95][G.diff]||.75,cast:0}};
  const sp=spawnPos(h);h.x=sp.x;h.y=sp.y;calcStats(h);h.hp=h.maxhp;h.mana=h.maxmana;
  autoLearn(h);
  G.heroes.push(h);G.units.push(h);return h;
}
function spawnPos(h){
  const n=NEXUS_POS[h.team];const d=h.team===0?1:-1;
  return {x:n.x+d*200,y:n.y+(h.idx===0?-70:70)};
}
function calcStats(h){
  const D=h.def,L=h.level-1;
  let ad=D.ad[0]+D.ad[1]*L,ap=0,armor=D.armor[0]+D.armor[1]*L,mr=D.mr[0]+D.mr[1]*L,hp=D.hp[0]+D.hp[1]*L,mana=D.mana[0]+D.mana[1]*L,
      hpr=D.hpr[0]+D.hpr[1]*L,mpr=D.mpr[0]+D.mpr[1]*L,ms=D.ms,asb=0,ls=0,cdr=0;
  for(const id of h.items){const it=ITEMBYID[id];ad+=it.ad||0;ap+=it.ap||0;armor+=it.armor||0;mr+=it.mr||0;hp+=it.hp||0;mana+=it.mana||0;hpr+=it.hpr||0;mpr+=it.mpr||0;ms+=it.ms||0;asb+=it.as||0;ls+=it.ls||0;cdr+=it.cdr||0}
  let bAs=0,bMs=0;for(const b of h.buffs){if(b.type==='as')bAs=Math.max(bAs,b.v);else if(b.type==='ms')bMs=Math.max(bMs,b.v)}
  h.ad=ad;h.ap=ap;h.armor=armor;h.mr=mr;h.hpr=hpr;h.mpr=mpr;h.ls=ls;h.cdr=Math.min(.4,cdr);
  h.as=Math.min(2.5,D.as[0]*(1+D.as[1]*L)*(1+asb+bAs));
  h.msBase=(ms)*(1+bMs);h.range=D.range;
  const dh=hp-h.maxhp;if(dh!==0){h.maxhp=hp;h.hp=dh>0?h.hp+dh:Math.min(h.hp,hp)}
  const dm=mana-h.maxmana;if(dm!==0){h.maxmana=mana;h.mana=dm>0?h.mana+dm:Math.min(h.mana,mana)}
}
function curMs(u){let m=u.kind==='hero'?u.msBase:u.ms;if(u.stun>0||u.rootT>0)return 0;return m*(1-(u.slowT>0?u.slow:0))}
function targetable(u){
  if(!u||u.dead)return false;
  if(u.kind==='tower'){for(let i=0;i<u.idx;i++)if(!G.towers[u.team][i].dead)return false;return true}
  if(u.kind==='nexus'){for(const t of G.towers[u.team])if(!t.dead)return false;return true}
  return true;
}
function enemiesIn(team,x,y,r,buildings){
  const out=[];for(const u of G.units){
    if(u.team===team||u.dead)continue;
    if(u.kind==='tower'||u.kind==='nexus'){if(!buildings||!targetable(u))continue}
    if(Math.hypot(u.x-x,u.y-y)-u.r*.6<=r)out.push(u)}
  return out;
}
function ang(h,tx,ty){const a=Math.atan2(ty-h.y,tx-h.x);h.face=a;return a}
function clampRange(h,tx,ty,R){const d=Math.hypot(tx-h.x,ty-h.y);if(d<=R)return {x:tx,y:ty};return {x:h.x+(tx-h.x)/d*R,y:h.y+(ty-h.y)/d*R}}
/* 状态 */
function stun(u,t){if(u.dead||(u.kind!=='hero'&&u.kind!=='minion'))return;u.stun=Math.max(u.stun,t);if(u.kind==='hero'){u.windup=null;cancelRecall(u)}sfx('stun',u.x,u.y);for(let i=0;i<5;i++)fxP(u.x,u.y-u.r,'#ffe27a',0,0,.5,3)}
function root(u,t){if(u.dead||(u.kind!=='hero'&&u.kind!=='minion'))return;u.rootT=Math.max(u.rootT,t);if(u.kind==='hero')cancelRecall(u)}
function slow(u,a,t){if(u.dead||(u.kind!=='hero'&&u.kind!=='minion'))return;if(a>=u.slow||u.slowT<=0)u.slow=a;u.slowT=Math.max(u.slowT,t)}
function addShield(h,a,t){h.shield=Math.max(h.shield,a);h.shieldT=Math.max(h.shieldT,t)}
function addBuff(h,type,v,t){h.buffs=h.buffs.filter(b=>!(b.type===type&&b.v<=v));h.buffs.push({type,v,t})}
function cancelRecall(h){if(h.recall>0){h.recall=0}}
/* 特效 */
function fxP(x,y,col,vx,vy,dur,r,g){if(G.fx.length>900)return;G.fx.push({k:'p',x,y,vx,vy,t:0,dur,col,r,g:g||0})}
function fxBurst(x,y,col,n,sp){for(let i=0;i<n;i++){const a=rnd(0,TAU),s=rnd(.3,1)*sp;fxP(x,y,col,Math.cos(a)*s,Math.sin(a)*s,rnd(.3,.7),rnd(2,5))}}
function fxRing(x,y,r,col,dur,lw){G.fx.push({k:'ring',x,y,r,t:0,dur,col,lw:lw||4})}
function fxSpin(h,r,col){G.fx.push({k:'spin',h,r,t:0,dur:.45,col})}
function fxSlash(x,y,a,len,col,dur){G.fx.push({k:'slash',x,y,a,len,t:0,dur:dur||.18,col})}
function addText(x,y,txt,col,size,dur){if(G.texts.length>60)G.texts.shift();G.texts.push({x:x+rnd(-8,8),y,txt,col,size:size||16,t:0,dur:dur||.9})}
function shake(a,x,y){if(x!==undefined&&Math.hypot(x-G.cam.x,y-G.cam.y)>1000)return;G.cam.shake=Math.max(G.cam.shake,a)}
function banner(txt,col){G.banners.push({txt,col:col||'#f4e4b0',t:0});if(G.banners.length>3)G.banners.shift()}
function feed(a,at,verb,b,bt){G.feed.push({a,at,verb,b,bt,t:G.t});if(G.feed.length>8)G.feed.shift()}
/* 伤害 */
function dmgUnit(src,tgt,raw,type,opt){
  if(!tgt||tgt.dead||!targetable(tgt))return 0;
  let d=raw;
  if(type==='p')d*=100/(100+Math.max(-60,tgt.armor||0));else if(type==='m')d*=100/(100+(tgt.mr||0));
  if(tgt.kind==='minion'&&src&&src.kind==='tower')d*=1.0;
  if(tgt.shield>0){const s=Math.min(tgt.shield,d);tgt.shield-=s;d-=s}
  tgt.hp-=d;tgt.hurtT=G.t;
  const sh=src&&src.kind==='hero';
  if(sh){if(tgt.kind==='hero')src.dmgDealt+=d;if(opt&&opt.basic&&src.ls>0)src.hp=Math.min(src.maxhp,src.hp+d*src.ls)}
  if(tgt.kind==='hero'){
    cancelRecall(tgt);tgt.dmgTaken+=d;tgt.windup&&0;
    if(sh){tgt.dmgBy[src.id]=G.t;
      for(const tw of G.towers[tgt.team]){if(!tw.dead&&Math.hypot(tw.x-tgt.x,tw.y-tgt.y)<=tw.range+tgt.r&&Math.hypot(tw.x-src.x,tw.y-src.y)<=tw.range+src.r){tw.force=src;tw.forceT=2.4}}}
  }
  if(G.player&&(src===G.player||tgt===G.player)&&d>=1&&(tgt.kind==='hero'||tgt.kind==='tower'||(opt&&!opt.basic)))addText(tgt.x,tgt.y-tgt.r-8,String(Math.round(d)),tgt===G.player?'#ff8a7a':(type==='m'?'#d9b0ff':'#ffffff'),tgt===G.player?16:(opt&&opt.basic?14:18),.8);
  if(tgt.hp<=0)die(tgt,src);
  return d;
}
function die(u,src){
  u.dead=true;u.hp=0;
  if(u.kind==='minion'){
    const kt=1-u.team;
    if(src&&src.kind==='hero'){const g=Math.round(u.gold*(1+.004*G.waveN));src.gold+=g;src.cs++;
      if(src===G.player){addText(u.x,u.y-24,'+'+g,'#ffd95a',17,1);sfx('coin')}}
    for(const h of G.heroes){if(h.team===kt&&!h.dead&&Math.hypot(h.x-u.x,h.y-u.y)<1150)addXp(h,u.xp)}
    fxBurst(u.x,u.y,TEAMS[u.team].col,8,150);
  }else if(u.kind==='hero'){heroDied(u,src)}
  else if(u.kind==='tower'){
    const kt=1-u.team;G.towerKills[kt]++;
    for(const h of G.heroes){if(h.team===kt){h.gold+=150+(src===h?100:0);if(!h.dead&&Math.hypot(h.x-u.x,h.y-u.y)<1400)addXp(h,120)}}
    fxRing(u.x,u.y,260,TEAMS[u.team].col,.8,10);fxBurst(u.x,u.y,'#d8c8a0',50,420);shake(16,u.x,u.y);sfx('boom',u.x,u.y);
    feed(TEAMS[kt].name,kt,'摧毁了',TEAMS[u.team].name+u.name,u.team);
    banner(u.team===0?'我方'+u.name+'被摧毁':'敌方'+u.name+'被摧毁',u.team===0?'#ff9a86':'#9be8ff');
  }else if(u.kind==='nexus'){
    G.over=true;G.winner=1-u.team;G.endT=0;
    fxRing(u.x,u.y,500,'#ffe9a0',1.2,14);fxBurst(u.x,u.y,'#ffcf7a',90,600);shake(30);sfx('nexus');
    G.cam.focus=u;
  }
}
function heroDied(h,src){
  h.d++;const st=h.streak;h.streak=0;h.dead=true;h.order=null;h.windup=null;h.dash=null;h.recall=0;h.stun=0;h.rootT=0;h.slowT=0;h.shield=0;h.buffs=[];
  h.deadT=clamp(5+h.level*2.6+G.t/60*1.2,6,50);
  const et=1-h.team;G.kills[et]++;
  let killer=src&&src.kind==='hero'?src:null;
  const ass=G.heroes.filter(x=>x.team===et&&x!==killer&&G.t-(h.dmgBy[x.id]||-99)<10);
  const gold=Math.round(260+h.level*14+st*45);
  if(killer){killer.k++;killer.streak++;killer.gold+=gold;if(killer===G.player)sfx('kill')}
  else for(const x of G.heroes)if(x.team===et&&!x.dead&&Math.hypot(x.x-h.x,x.y-h.y)<1000)x.gold+=Math.round(gold*.4);
  for(const a of ass){a.a++;a.gold+=Math.round(gold*.35)}
  for(const x of G.heroes)if(x.team===et&&!x.dead&&Math.hypot(x.x-h.x,x.y-h.y)<1500)addXp(x,100+h.level*26);
  const who=killer?killer.name:(src?(src.kind==='tower'?TEAMS[et].name+'防御塔':TEAMS[et].name+'小兵'):'？');
  feed(who,et,'击杀了',h.name,h.team);
  if(h===G.player){banner('你被击杀了','#ff8a7a');sfx('death');G.cam.deadX=h.x;G.cam.deadY=h.y}
  else if(killer===G.player)banner('你击杀了 '+h.name+(killer.streak>=3?'　'+killer.streak+' 连杀':''),'#ffe27a');
  else if(h.team===0)banner(h.name+' 阵亡','#ff9a86');
  else banner('击杀 '+h.name,'#9be8ff');
  fxBurst(h.x,h.y,TEAMS[h.team].col,26,300);fxRing(h.x,h.y,100,'#fff',.4,4);
}
function respawn(h){
  h.dead=false;const p=spawnPos(h);h.x=p.x;h.y=p.y;calcStats(h);h.hp=h.maxhp;h.mana=h.maxmana;h.order=null;h.atkCd=0;
  fxRing(h.x,h.y,90,TEAMS[h.team].light,.5,5);if(h===G.player){sfx('tpend');G.cam.ox=0;G.cam.oy=0}
}
function addXp(h,x){
  if(h.level>=MAXLV)return;h.xp+=x;
  while(h.level<MAXLV&&h.xp>=XPN(h.level)){h.xp-=XPN(h.level);h.level++;h.sp++;calcStats(h);h.hp=Math.min(h.maxhp,h.hp+60+h.level*10);
    if(h===G.player){sfx('levelup');addText(h.x,h.y-60,'升级！ Lv'+h.level,'#fff2a0',20,1.4);fxRing(h.x,h.y,80,'#fff2a0',.6,5)}
    if(h.ctrl==='ai'||G.auto)autoLearn(h);
  }
  if(h.level>=MAXLV)h.xp=0;
}
function canLearn(h,i){
  if(h.sp<=0)return false;const r=h.ranks[i];
  if(i===3)return r<3&&h.level>=[6,10,14][r];
  return r<5&&r<Math.ceil(h.level/2);
}
function learn(h,i){if(!canLearn(h,i))return false;h.ranks[i]++;h.sp--;if(h===G.player)sfx('click');return true}
function autoLearn(h){
  let guard=8;while(h.sp>0&&guard-->0){
    const order=[3].concat(h.def.prio);let done=false;
    for(const i of order){
      // 优先主升技能，其次平均
      if(canLearn(h,i)&&(i===3||h.ranks[i]<=Math.min(...h.def.prio.map(j=>h.ranks[j]))+(i===h.def.prio[0]?1:0))){learn(h,i);done=true;break}
    }
    if(!done){for(const i of order){if(canLearn(h,i)){learn(h,i);done=true;break}}}
    if(!done)break;
  }
}
/* 商店 */
function inBase(h){const n=NEXUS_POS[h.team];return Math.hypot(h.x-n.x,h.y-n.y)<BASE_R-60}
function buyItem(h,id){
  const it=ITEMBYID[id];if(!it)return false;
  if(h.items.length>=6)return false;if(h.gold<it.cost)return false;
  h.gold-=it.cost;h.items.push(id);calcStats(h);if(h===G.player)sfx('buy');return true;
}
function sellItem(h,i){const it=ITEMBYID[h.items[i]];if(!it)return;h.gold+=Math.floor(it.cost*.7);h.items.splice(i,1);calcStats(h);if(h===G.player)sfx('coin')}
function buyPotion(h){if(h.potions>=POTION.max||h.gold<POTION.cost)return false;h.gold-=POTION.cost;h.potions++;if(h===G.player)sfx('buy');return true}
function usePotion(h){if(h.dead||h.potions<=0||h.potT>0)return false;h.potions--;h.potT=POTION.dur;fxRing(h.x,h.y,50,'#9bff9b',.4,4);return true}
function aiBuy(h){
  let guard=8;while(guard-->0){
    if(h.potions<2&&h.gold>=POTION.cost+100)buyPotion(h);
    if(h.items.length>=6)return;
    const list=h.def.buy;let id=list[h.buyIdx];
    if(!id)id=h.def.id==='ji'?'tome':(h.def.id==='yue'?'ward':'edge');
    const it=ITEMBYID[id];if(h.gold>=it.cost){buyItem(h,id);h.buyIdx++}else return;
  }
}
/* 弹道 / 区域 */
function spawnProj(p){p.travel=0;p.hit=new Set();p.k='line';p.dx=Math.cos(p.a);p.dy=Math.sin(p.a);G.projs.push(p);return p}
function fireHoming(src,tgt,dmg,type,speed,style,opt){G.projs.push({k:'home',src,tgt,x:src.x,y:src.y,dmg,type,speed,style,team:src.team,opt:opt||{basic:true}})}
function spawnZone(z){z.age=0;z.det=false;z.nextTick=z.delay;G.zones.push(z);return z}
function startDash(h,o){
  h.dash={a:o.a,left:o.dist,total:o.dist,speed:o.speed,onUnit:o.onUnit,onEnd:o.onEnd,leap:o.leap,hit:new Set(),trail:o.trail};
  h.order=null;h.windup=null;cancelRecall(h);h.face=o.a;
}
function updateDash(h,dt){
  const d=h.dash;const step=Math.min(d.left,d.speed*dt);
  h.x+=Math.cos(d.a)*step;h.y+=Math.sin(d.a)*step;
  const bx=h.x,by=h.y;clampWalk(h);const blocked=Math.hypot(h.x-bx,h.y-by)>step*.6;
  d.left-=step;h.z=d.leap?Math.sin((1-d.left/d.total)*Math.PI)*70:0;
  if(d.trail&&Math.random()<.9)fxP(h.x,h.y,d.trail,0,0,.3,h.r*.6);
  if(!d.leap&&d.onUnit){for(const u of enemiesIn(h.team,h.x,h.y,h.r+6)){if(!d.hit.has(u.id)){d.hit.add(u.id);d.onUnit(u)}}}
  if(d.left<=.01||blocked){h.dash=null;h.z=0;d.onEnd&&d.onEnd()}
}
/* 施法 */
function tryCast(h,i,tx,ty){
  if(h.dead||h.stun>0||h.dash||G.over)return false;
  const ab=h.def.ab[i],r=h.ranks[i];if(r<=0)return false;
  if(h.cds[i]>0)return false;const cost=ab.mana[r-1];if(h.mana<cost){if(h===G.player)G.hint={t:G.t,txt:'法力不足'};return false}
  cancelRecall(h);h.windup=null;
  h.mana-=cost;h.cds[i]=ab.cd[r-1]*(1-h.cdr);h.castAnim=.3;
  ab.cast(h,tx,ty,r-1);return true;
}
/* ---------- 单位更新 ---------- */
function moveToward(u,tx,ty,dt){
  const dx=tx-u.x,dy=ty-u.y,d=Math.hypot(dx,dy);const sp=curMs(u);
  if(d<6){u.vx=u.vy=0;return true}
  u.face=Math.atan2(dy,dx);
  const st=Math.min(d,sp*dt);u.vx=dx/d*sp;u.vy=dy/d*sp;u.x+=dx/d*st;u.y+=dy/d*st;clampWalk(u);
  return d<=st+1;
}
function pushOutBuildings(u){
  for(const b of G.units){if(b.kind!=='tower'&&b.kind!=='nexus')continue;if(b.dead)continue;
    const d=Math.hypot(u.x-b.x,u.y-b.y),m=b.r+u.r*.8;if(d<m&&d>0.1){u.x=b.x+(u.x-b.x)/d*m;u.y=b.y+(u.y-b.y)/d*m}}
}
function tickStatus(u,dt){
  if(u.stun>0)u.stun-=dt;if(u.rootT>0)u.rootT-=dt;if(u.slowT>0){u.slowT-=dt;if(u.slowT<=0)u.slow=0}
  if(u.shieldT>0){u.shieldT-=dt;if(u.shieldT<=0)u.shield=0}
  if(u.buffs&&u.buffs.length){for(const b of u.buffs)b.t-=dt;u.buffs=u.buffs.filter(b=>b.t>0)}
}
function findAutoTarget(h,range){
  let best=null,bs=1e9;
  for(const u of G.units){
    if(u.team===h.team||u.dead||!targetable(u))continue;
    const d=Math.hypot(u.x-h.x,u.y-h.y)-u.r;if(d>range)continue;
    let s=d+(u.kind==='hero'?-60:u.kind==='minion'?0:300)+(u.kind==='minion'?u.hp*.03:0);
    if(s<bs){bs=s;best=u}
  }
  return best;
}
function startAttack(h,t){
  h.atkCd=1/h.as;h.windup={t:0,tgt:t,dur:Math.min(.2,.4/h.as)};h.face=Math.atan2(t.y-h.y,t.x-h.x);
}
function fireAttack(h,t){
  h.swing=.22;
  if(h.def.melee){dmgUnit(h,t,h.ad,'p',{basic:true});sfx(t.kind==='tower'||t.kind==='nexus'?'hit':'slash',h.x,h.y);fxSlash(h.x,h.y,h.face,h.range+30,TEAMS[h.team].light,.16);fxP(t.x,t.y,'#fff',rnd(-80,80),rnd(-80,80),.25,3)}
  else{fireHoming(h,t,h.ad,'p',1500,h.def.id==='ji'?'orbs':'arrowh');sfx(h.def.id==='ji'?'bolt':'shoot',h.x,h.y)}
}
function execOrder(h,dt){
  let o=h.order,tgt=null;
  if(o&&o.type==='attack'){tgt=o.target;if(!targetable(tgt)){h.order=null;o=null;tgt=null}}
  else if(o&&o.type==='amove'){tgt=findAutoTarget(h,h.range+60);if(!tgt){h.windup=null;if(moveToward(h,o.x,o.y,dt))h.order=null;return}}
  else if(!o){tgt=findAutoTarget(h,h.range)}
  if(tgt){
    const d=Math.hypot(tgt.x-h.x,tgt.y-h.y),reach=h.range+tgt.r;
    if(d<=reach){h.vx=h.vy=0;h.face=Math.atan2(tgt.y-h.y,tgt.x-h.x);if(!h.windup&&h.atkCd<=0)startAttack(h,tgt)}
    else if(o){if(!h.windup||h.windup.tgt!==tgt)h.windup=null;if(!h.windup)moveToward(h,tgt.x,tgt.y,dt)}
  }else if(o&&o.type==='move'){h.windup=null;if(moveToward(h,o.x,o.y,dt))h.order=null}
  else{h.vx=h.vy=0}
}
function updateHero(h,dt){
  if(h.dead){h.deadT-=dt;if(h.deadT<=0)respawn(h);return}
  tickStatus(h,dt);calcStats(h);
  for(let i=0;i<4;i++)if(h.cds[i]>0)h.cds[i]-=dt;
  if(h.atkCd>0)h.atkCd-=dt;if(h.castAnim>0)h.castAnim-=dt;if(h.swing>0)h.swing-=dt;
  h.gold+=(G.t>12?1.9:0)*dt*(h.team===1?[.8,1,1.15][G.diff]||1:1);
  let hr=h.hpr,mr=h.mpr;
  if(inBase(h)){hr+=h.maxhp*.12;mr+=h.maxmana*.1;if(Math.random()<.2)fxP(h.x+rnd(-20,20),h.y+rnd(-10,10),'#9bffb0',0,-40,.8,2)}
  h.hp=Math.min(h.maxhp,h.hp+hr*dt);h.mana=Math.min(h.maxmana,h.mana+mr*dt);
  if(h.potT>0){h.potT-=dt;h.hp=Math.min(h.maxhp,h.hp+POTION.heal/POTION.dur*dt)}
  if(h.dash){updateDash(h,dt);pushOutBuildings(h);return}
  if(h.stun>0){h.windup=null;h.vx=h.vy=0;return}
  if(h.recall>0){h.recall-=dt;if(Math.random()<.5)fxP(h.x+rnd(-24,24),h.y+rnd(10,24),'#a8e8ff',0,-90,.7,2.5);
    if(h.recall<=0){h.recall=0;fxBurst(h.x,h.y,'#a8e8ff',24,260);const p=spawnPos(h);h.x=p.x;h.y=p.y;h.order=null;h.windup=null;fxBurst(h.x,h.y,'#a8e8ff',24,260);fxRing(h.x,h.y,100,'#fff',.5,5);sfx('tpend',h.x,h.y);if(h===G.player){G.cam.ox=0;G.cam.oy=0}}}
  if(h.ctrl==='ai')aiHero(h,dt);
  if(h.windup){h.windup.t+=dt;const w=h.windup;
    if(!targetable(w.tgt))h.windup=null;
    else if(w.t>=w.dur){h.windup=null;if(Math.hypot(w.tgt.x-h.x,w.tgt.y-h.y)<=h.range+w.tgt.r+60)fireAttack(h,w.tgt)}
    else{h.vx=h.vy=0;pushOutBuildings(h);return}}
  execOrder(h,dt);pushOutBuildings(h);
}
/* 小兵 */
function mkMinion(team,type){
  const M=MINION[type],n=G.waveN-1;const late=Math.max(0,(G.t-600)/60);
  let sc=1+.04*n+.14*late,as=1+.03*n+.12*late;if(type==='brute'){sc=1+.1*late;as=1+.08*late}
  const p=posAt(team===0?PL*.075:PL*.925);
  const m={id:UID++,kind:'minion',team,type,x:p[0]+rnd(-28,28),y:p[1]+rnd(-28,28),r:M.r,hp:M.hp*sc,maxhp:M.hp*sc,ad:M.ad*as,range:M.range,ms:M.ms,as:M.as,armor:M.armor,mr:M.mr,
    gold:M.gold,xp:M.xp,dead:false,atkCd:rnd(0,.5),windup:null,stun:0,slow:0,slowT:0,rootT:0,face:team===0?0:Math.PI,tgt:null,scan:0,vx:0,vy:0,wind:M.wind,hurtT:-9,swing:0};
  G.units.push(m);return m;
}
function spawnWave(){
  G.waveN++;const n=G.waveN;const list=['melee','melee','melee','ranged','ranged'];
  if(n%3===0)list.push('siege');if(G.t>780&&n%2===0)list.push('siege');if(G.t>600)list.push("brute");if(G.t>900)list.push("brute");
  for(let t=0;t<2;t++)list.forEach((ty,i)=>G.spawnQ.push({t:G.t+i*.65,team:t,type:ty}));
}
function pickMinionTarget(m){
  let best=null,bs=1e9;const aggro=m.range>200?m.range+20:300;
  for(const u of G.units){
    if(u.team===m.team||u.dead||!targetable(u))continue;
    const d=Math.hypot(u.x-m.x,u.y-m.y)-u.r;
    if(u.kind==='minion'){if(d>aggro+50)continue}
    else if(u.kind==='hero'){if(d>Math.min(aggro,330))continue}
    else{if(d>Math.min(aggro,m.range>200?m.range:200)+60)continue}
    const s=d+(u.kind==='hero'?160:u.kind==='minion'?0:260);
    if(s<bs){bs=s;best=u}
  }
  return best;
}
function updateMinion(m,dt){
  tickStatus(m,dt);if(m.atkCd>0)m.atkCd-=dt;if(m.swing>0)m.swing-=dt;
  if(m.stun>0){m.windup=null;return}
  if(m.windup){m.windup.t+=dt;if(m.windup.t>=m.wind){const t=m.windup.tgt;m.windup=null;
      if(targetable(t)&&Math.hypot(t.x-m.x,t.y-m.y)<=m.range+t.r+50){m.swing=.2;
        if(m.range>200)fireHoming(m,t,m.ad,'p',m.type==='siege'?900:1100,m.type==='siege'?'ball':'arrowm',{basic:true});
        else{dmgUnit(m,t,m.ad,'p',{basic:true});sfx('hit',m.x,m.y)}}}
    return}
  m.scan-=dt;if(m.scan<=0||!targetable(m.tgt)){m.scan=.25+Math.random()*.15;m.tgt=pickMinionTarget(m)}
  const t=m.tgt;
  if(t){const d=Math.hypot(t.x-m.x,t.y-m.y);m.face=Math.atan2(t.y-m.y,t.x-m.x);
    if(d<=m.range+t.r){if(m.atkCd<=0){m.atkCd=m.as;m.windup={t:0,tgt:t}}}
    else moveToward(m,t.x,t.y,dt);
  }else{
    const p=nearPath(m.x,m.y);const s=p.s+fwd(m.team)*170;const q=posAt(s);
    // 回到兵线中心
    const k=p.d>40?.5:0;moveToward(m,lerp(q[0],p.x,k),lerp(q[1],p.y,k),dt);
  }
}
function separateMinions(){
  const ms=G.units.filter(u=>u.kind==='minion'&&!u.dead);
  for(let i=0;i<ms.length;i++){const a=ms[i];for(let j=i+1;j<ms.length;j++){const b=ms[j];
    const dx=b.x-a.x,dy=b.y-a.y;const m=(a.r+b.r)*.95;if(Math.abs(dx)>m||Math.abs(dy)>m)continue;
    const d=Math.hypot(dx,dy);if(d>=m)continue;const p=d<.01?m*.5:(m-d)*.5,nx=d<.01?1:dx/d,ny=d<.01?0:dy/d;
    const wa=a.windup?0:1,wb=b.windup?0:1,tw=wa+wb||1;
    a.x-=nx*p*2*wa/tw;a.y-=ny*p*2*wa/tw;b.x+=nx*p*2*wb/tw;b.y+=ny*p*2*wb/tw}}
  for(const a of ms){clampWalk(a);pushOutBuildings(a)}
}
/* 防御塔 */
function updateTower(t,dt){
  if(t.dead)return;if(t.atkCd>0)t.atkCd-=dt;if(t.forceT>0)t.forceT-=dt;
  let tgt=null;
  if(t.force&&t.forceT>0&&!t.force.dead&&Math.hypot(t.force.x-t.x,t.force.y-t.y)<=t.range+t.force.r)tgt=t.force;
  else{
    let bd=1e9;for(const u of G.units){if(u.team===t.team||u.dead||u.kind!=='minion')continue;const d=Math.hypot(u.x-t.x,u.y-t.y);if(d<=t.range+u.r&&d<bd){bd=d;tgt=u}}
    if(!tgt){for(const u of G.heroes){if(u.team===t.team||u.dead)continue;const d=Math.hypot(u.x-t.x,u.y-t.y);if(d<=t.range+u.r&&d<bd){bd=d;tgt=u}}}
  }
  t.tgt=tgt;
  if(tgt&&t.atkCd<=0){
    t.atkCd=1.05;if(t.last===tgt)t.stack=Math.min(t.stack+1,3);else t.stack=0;t.last=tgt;
    t.lastShot=G.t;fireHoming(t,tgt,t.ad*(1+.28*t.stack)*(tgt.kind==='minion'?1.3:1),'p',1700,'tbolt',{basic:true});sfx('tower',t.x,t.y);
  }else if(!tgt){t.stack=0;t.last=null}
}
/* 弹道、区域、特效更新 */
function updateProjs(dt){
  for(const p of G.projs){
    if(p.dead)continue;
    if(p.k==='home'){
      const t=p.tgt;if(!targetable(t)){p.dead=true;continue}
      const dx=t.x-p.x,dy=t.y-p.y,d=Math.hypot(dx,dy),st=p.speed*dt;p.a=Math.atan2(dy,dx);
      if(d<=st+t.r*.5){p.dead=true;dmgUnit(p.src,t,p.dmg,p.type,p.opt);
        if(p.style==='ball'){fxRing(t.x,t.y,60,'#ffb070',.25,4);fxBurst(t.x,t.y,'#ffb070',6,160)}}
      else{p.x+=dx/d*st;p.y+=dy/d*st}
    }else{
      const st=p.speed*dt;p.x+=p.dx*st;p.y+=p.dy*st;p.travel+=st;
      for(const u of G.units){
        if(u.dead||u.team===p.team||(u.kind!=='hero'&&u.kind!=='minion'))continue;
        if(p.heroOnly&&u.kind!=='hero')continue;
        if(p.hit.has(u.id))continue;
        if(Math.hypot(u.x-p.x,u.y-p.y)<=p.r+u.r*.8){p.hit.add(u.id);p.onHit&&p.onHit(u,p);if(!p.pierce){p.dead=true;p.done=true;break}}
      }
      if(!p.dead&&p.travel>=p.range){p.dead=true;p.onExpire&&p.onExpire(p)}
      if(!p.dead&&Math.random()<.6)fxP(p.x,p.y,p.color,rnd(-20,20),rnd(-20,20),.25,3);
    }
  }
  G.projs=G.projs.filter(p=>!p.dead);
}
function updateZones(dt){
  for(const z of G.zones){
    z.age+=dt;
    if(!z.det&&z.age>=z.delay){z.det=true;z.onDetonate&&z.onDetonate(z)}
    if(z.dur>0&&z.det){while(z.nextTick<=z.age&&z.nextTick<z.delay+z.dur){z.onTick&&z.onTick(z);z.nextTick+=z.tick}
      if(Math.random()<.7)fxP(z.x+rnd(-z.r,z.r)*.8,z.y+rnd(-z.r,z.r)*.8,z.color,0,-60,.6,rnd(3,6))}
  }
  G.zones=G.zones.filter(z=>z.age<z.delay+(z.dur||.3));
}
function updateFx(dt){
  for(const f of G.fx){f.t+=dt;if(f.k==='p'){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=.94;f.vy*=.94}}
  G.fx=G.fx.filter(f=>f.t<f.dur);
  for(const t of G.texts){t.t+=dt;t.y-=38*dt}
  G.texts=G.texts.filter(t=>t.t<t.dur);
  for(const b of G.banners)b.t+=dt;G.banners=G.banners.filter(b=>b.t<3.2);
  G.feed=G.feed.filter(f=>G.t-f.t<9);
}
/* 主更新 */
function stepGame(dt){
  if(!G||G.paused)return;
  if(G.over){G.endT+=dt;updateFx(dt);updateProjs(dt);G.cam.shake*=.92;return}
  G.t+=dt;
  G.waveT-=dt;if(G.waveT<=0){G.waveT=28;spawnWave()}
  for(let i=G.spawnQ.length-1;i>=0;i--){if(G.spawnQ[i].t<=G.t){const q=G.spawnQ[i];G.spawnQ.splice(i,1);mkMinion(q.team,q.type)}}
  for(const u of G.units){
    if(u.kind==='hero')updateHero(u,dt);else if(u.kind==='minion')updateMinion(u,dt);else if(u.kind==='tower')updateTower(u,dt);
  }
  separateMinions();
  updateProjs(dt);updateZones(dt);updateFx(dt);
  G.units=G.units.filter(u=>!u.dead||u.kind==='hero'||u.kind==='tower'||u.kind==='nexus');
  G.cam.shake*=.9;
}
