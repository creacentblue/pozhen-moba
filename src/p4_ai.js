/* ---------- AI 英雄 ---------- */
function startRecall(h){
  if(h.dead||h.recall>0||inBase(h)||h.stun>0||h.dash)return false;
  h.recall=5;h.order=null;h.windup=null;sfx('recall',h.x,h.y);return true;
}
function enemyTowersAlive(team){return G.towers[1-team].filter(t=>!t.dead)}
function tankedAt(team,tw){ // 友方小兵是否足以吸引防御塔火力
  let n=0;for(const u of G.units)if(u.kind==='minion'&&u.team===team&&!u.dead&&Math.hypot(u.x-tw.x,u.y-tw.y)<tw.range+30)n++;return n>=2;
}
function unsafeSpot(h,x,y){ // 位于未被吸引火力的敌塔射程内
  for(const t of enemyTowersAlive(h.team)){
    if(Math.hypot(t.x-x,t.y-y)<t.range+40&&!tankedAt(h.team,t))return t;
  }
  return null;
}
function homePoint(h,back){const p=nearPath(h.x,h.y);const q=posAt(p.s-fwd(h.team)*back);return {x:q[0],y:q[1]}}
function aiAim(h,ab,foe,fd){
  const sk=h.ai.skill;const lead=ab.speed?fd/ab.speed:.5;
  let tx=foe.x+(foe.vx||0)*lead*(.4+.6*sk),ty=foe.y+(foe.vy||0)*lead*(.4+.6*sk);
  const err=(1-sk)*90;return {x:tx+rnd(-err,err),y:ty+rnd(-err,err)};
}
function aiCastAt(h,foe,fd,asHero){
  const A=h.ai;
  for(const i of [3,0,2,1]){
    const ab=h.def.ab[i],r=h.ranks[i];
    if(!r||h.cds[i]>0||h.mana<ab.mana[r-1])continue;
    if(Math.random()>.4+.55*A.skill)continue;
    const hpr=foe.hp/foe.maxhp;
    if(ab.ult&&!(hpr<.65||Math.random()<.3))continue;
    let ok=false,aim=null;
    if(ab.use==='buff'){ok=fd<=ab.range;aim={x:h.x,y:h.y}}
    else if(ab.use==='gap'){ok=fd>h.range+120&&fd<=ab.range+h.range&&h.hp/h.maxhp>.4;aim={x:foe.x,y:foe.y}}
    else if(ab.use==='escape'){ok=false}
    else{ // dmg / cc
      if(ab.aim==='self'){ok=fd<=ab.range*.95;aim={x:h.x,y:h.y}}
      else if(ab.aim==='ground'){ok=fd<=ab.range;aim=aiAim(h,ab,foe,fd)}
      else if(ab.aim==='dir'||ab.aim==='dash'){ok=fd<=ab.range*.95;aim=aiAim(h,ab,foe,fd)}
    }
    if(ok&&tryCast(h,i,aim.x,aim.y))return true;
  }
  return false;
}
function aiHero(h,dt){
  const A=h.ai;A.think-=dt;if(A.think>0)return;A.think=.1+(1-A.skill)*.2+Math.random()*.05;
  const sk=A.skill,team=h.team;
  if(h.dash||h.stun>0)return;
  if(h.potT<=0&&h.potions>0&&h.hp<h.maxhp*.45)usePotion(h);
  // 基地内：购物、回复
  if(inBase(h)){
    aiBuy(h);A.retreat=false;
    if((h.hp<h.maxhp*.92||h.mana<h.maxmana*.7)&&G.t>20){h.order=null;h.recall=0;return}
  }
  // 敌方英雄
  let foe=null,fd=1e9,foesAlive=0;
  for(const x of G.heroes){if(x.team===team||x.dead)continue;foesAlive++;const d=Math.hypot(x.x-h.x,x.y-h.y);if(d<fd){fd=d;foe=x}}
  const hpr=h.hp/h.maxhp;
  // 回城中
  if(h.recall>0){
    if(foe&&fd<700){h.recall=0}else return;
  }
  // 躲避技能
  if(A.dodgeT>0)A.dodgeT-=.15;
  if(sk>.55&&A.dodgeT<=0&&Math.random()<sk*.6){
    for(const p of G.projs){if(p.k!=='line'||p.team===team)continue;
      const rx=h.x-p.x,ry=h.y-p.y,t=rx*p.dx+ry*p.dy;if(t<0||t>650)continue;
      const per=rx*-p.dy+ry*p.dx;if(Math.abs(per)>p.r+h.r+8)continue;
      const side=per>=0?1:-1;const nx=-p.dy*side,ny=p.dx*side;
      h.order={type:'move',x:h.x+nx*230,y:h.y+ny*230};A.dodgeT=.4;return}
  }
  if(A.dodgeT>0)return;
  // 撤退判定
  const lowMana=h.mana<h.maxmana*.12&&hpr<.65;
  if(!A.retreat&&(hpr<.27+.08*sk||lowMana))A.retreat=true;
  if(A.retreat&&hpr>.8&&!lowMana)A.retreat=false;
  const un=unsafeSpot(h,h.x,h.y);
  if(A.retreat){
    if(foe&&fd<650){
      for(const i of [1,0,2]){const ab=h.def.ab[i];if(h.ranks[i]&&h.cds[i]<=0&&h.mana>=ab.mana[h.ranks[i]-1]&&(ab.use==='escape'||(ab.use==='buff'&&ab.aim==='self'&&h.def.id!=='yue'))){const hp=homePoint(h,600);if(tryCast(h,i,hp.x,hp.y))break}}
      if(h.def.id==='yue'&&h.cds[1]<=0&&h.ranks[1]&&fd<500)tryCast(h,1,h.x,h.y);
    }
    if(!(foe&&fd<900)&&!un&&!inBase(h)&&G.t-(A.lastRecall||-99)>8){if(startRecall(h)){A.lastRecall=G.t;return}}
    const hp=inBase(h)?{x:h.x,y:h.y}:homePoint(h,700);
    h.order={type:'move',x:hp.x,y:hp.y};return;
  }
  // 经济回城
  if(!foe||fd>1300){
    const nxt=ITEMBYID[h.def.buy[h.buyIdx]||'edge'];
    if(!un&&!inBase(h)&&h.items.length<6&&h.gold>=Math.max(nxt.cost+150,850)&&G.t-(A.lastRecall||-99)>45&&hpr<.95||(h.gold>=1500&&G.t-(A.lastRecall||-99)>60&&h.items.length<6)){
      if(startRecall(h)){A.lastRecall=G.t;return}
    }
  }
  // 战斗
  if(foe&&fd<Math.max(h.range+260,820)){
    const foeUnder=(()=>{for(const t of G.towers[foe.team]){if(!t.dead&&targetable(t)&&Math.hypot(t.x-foe.x,t.y-foe.y)<t.range+30)return t}return null})();
    const allyNear=G.heroes.some(x=>x!==h&&x.team===team&&!x.dead&&Math.hypot(x.x-foe.x,x.y-foe.y)<900);
    const foeAlly=G.heroes.some(x=>x!==foe&&x.team!==team&&!x.dead&&Math.hypot(x.x-foe.x,x.y-foe.y)<800);
    const myP=hpr+(h.level-foe.level)*.05+(allyNear?.2:0)-(foeAlly?.2:0);
    const fhp=foe.hp/foe.maxhp;
    const engage=(myP+.12>=fhp||fhp<.33)&&hpr>.38;
    const dangerous=foeUnder&&!tankedAt(team,foeUnder)&&!(fhp<.2&&hpr>.6);
    if(engage&&!dangerous){
      aiCastAt(h,foe,fd);
      if(!h.def.melee&&fd<h.range*.42&&fhp>.25&&h.cds[1]>0){const hp=homePoint(h,260);h.order={type:'move',x:hp.x,y:hp.y}}
      else h.order={type:'attack',target:foe};
      return;
    }else if(fd<h.range+120&&!engage){const hp=homePoint(h,500);h.order={type:'move',x:hp.x,y:hp.y};return}
  }
  // 补刀 / 推线
  const allyM=[],enM=[];
  for(const u of G.units){if(u.kind!=='minion'||u.dead)continue;(u.team===team?allyM:enM).push(u)}
  const me=nearPath(h.x,h.y),dir=fwd(team);
  let front=null,fs=-1e9;for(const m of allyM){const s=nearPath(m.x,m.y).s*dir;if(s>fs){fs=s;front=m}}
  // 防御塔进攻
  const et=(()=>{for(const t of G.towers[1-team])if(!t.dead&&targetable(t))return t;const n=G.nexus[1-team];return targetable(n)?n:null})();
  if(et){
    const ed=Math.hypot(et.x-h.x,et.y-h.y);
    const tank=et.kind==='nexus'?true:tankedAt(team,et);
    const foeNear=foe&&Math.hypot(foe.x-et.x,foe.y-et.y)<1000;
    if(ed<1800&&hpr>.45&&(tank||foesAlive===0||(foe&&foe.hp<foe.maxhp*.3))){
      // 先清理塔下的敌方小兵（不然塔会被吸引不到）
      h.order={type:'attack',target:et};return;
    }
  }
  // 补刀
  const dmgEff=h.ad*100/(100+8);
  let best=null,bd=1e9;
  for(const m of enM){const d=Math.hypot(m.x-h.x,m.y-h.y);if(d>h.range+330)continue;
    if(unsafeSpot(h,m.x,m.y))continue;
    if(m.hp<=dmgEff*(1+.1*sk)&&d<bd){bd=d;best=m}}
  if(best){h.order={type:'attack',target:best};return}
  // 小兵技能清线
  if(h.mana>h.maxmana*.65&&Math.random()<.45*sk){
    let c=null,cd=1e9;for(const m of enM){const d=Math.hypot(m.x-h.x,m.y-h.y);if(d<cd){cd=d;c=m}}
    if(c){let n=0;for(const m of enM)if(Math.hypot(m.x-c.x,m.y-c.y)<260)n++;
      if(n>=3){for(const i of [0,2]){const ab=h.def.ab[i];if(h.ranks[i]&&h.cds[i]<=0&&(ab.use==='dmg'||ab.use==='cc')&&Math.hypot(c.x-h.x,c.y-h.y)<ab.range*.9&&tryCast(h,i,c.x,c.y))break}}}
  }
  // 压线攻击
  let near=null;bd=1e9;for(const m of enM){const d=Math.hypot(m.x-h.x,m.y-h.y)-m.r;if(d<=h.range&&d<bd&&!unsafeSpot(h,m.x,m.y)){bd=d;near=m}}
  if(near&&(Math.random()<.35+.4*sk)){
    // 不要抢在低血量小兵之前乱打：留给友军小兵
    h.order={type:'attack',target:near};return}
  // 站位
  let ps;
  if(front)ps=front.x===undefined?me.s:nearPath(front.x,front.y).s-dir*(h.def.melee?40:190);
  else{const tw=G.towers[team].find(t=>!t.dead);ps=tw?nearPath(tw.x,tw.y).s-dir*80:(dir>0?300:PL-300)}
  let q=posAt(ps),spot=null;
  for(let i=0;i<10;i++){const t=unsafeSpot(h,q[0],q[1]);if(!t)break;ps-=dir*110;q=posAt(ps)}
  const off=A.lane*(h.idx===0?1:-1);
  const tx=q[0]+off*.6,ty=q[1]+off*.6;
  const w=walkPoint(tx,ty);
  if(Math.hypot(w.x-h.x,w.y-h.y)>60)h.order={type:'move',x:w.x,y:w.y};
  else if(!h.order||h.order.type==='move')h.order=null;
}
