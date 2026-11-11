/* ---------- 界面 / 输入 / 主循环 ---------- */
const KEYS={};let mode='menu',shopOpen=false;
const SET={hero:0,diff:1,speed:1,auto:1};
function buildMenu(){
  const hs=$('heroes');hs.innerHTML='';
  HEROES.forEach((h,i)=>{
    const d=document.createElement('div');d.className='card'+(i===SET.hero?' sel':'');
    d.innerHTML='<div class="gl" style="background:'+h.color+';color:'+h.color+'"><span style="color:#10181a">'+h.glyph+'</span></div><h3>'+h.name+'</h3><div class="ty">'+h.title+'</div><p>'+h.desc+'</p>'+
      h.ab.map(a=>'<div class="ab"><b>'+a.key+'</b>'+a.n+'　<em>'+a.d.replace(/。$/,'')+'</em></div>').join('');
    d.onclick=()=>{SET.hero=i;auInit();sfx('click');[...hs.children].forEach((c,j)=>c.classList.toggle('sel',j===i))};
    hs.appendChild(d);
  });
  for(const [id,key] of [['segDiff','diff'],['segSpeed','speed'],['segAuto','auto']]){
    const seg=$(id);[...seg.children].forEach(s=>s.onclick=()=>{[...seg.children].forEach(x=>x.classList.remove('on'));s.classList.add('on');SET[key]=+s.dataset.v;auInit();sfx('click')});
  }
}
function showMenu(){mode='menu';$('menu').classList.remove('hide');$('result').classList.add('hide');$('pause').classList.add('hide');closeShop();if(G)G.paused=true}
function startGame(){
  auInit();if(AU.ctx&&AU.ctx.state==='suspended')AU.ctx.resume();
  newGame({hero:SET.hero,diff:SET.diff,speed:SET.speed,auto:!!SET.auto});
  mode='play';$('menu').classList.add('hide');$('result').classList.add('hide');$('pause').classList.add('hide');closeShop();
  banner('摧毁敌方龙脉晶，夺取胜利！','#f4e4b0');
  G.hint={t:0,txt:''};
  if(!G.auto)G.hint={t:0,txt:'点击技能上方的 + 学习技能'};
  sfx('levelup');
}
function togglePause(){
  if(mode!=='play'||!G||G.over)return;G.paused=!G.paused;$('pause').classList.toggle('hide',!G.paused);sfx('click');
}
function showResult(){
  G.resShown=true;const win=G.winner===0;
  const rows=G.heroes.map(h=>'<tr><td class="'+(h.team===0?'b':'r')+'">'+h.name+(h===G.player?'（你）':'')+'</td><td>'+h.level+'</td><td>'+h.k+' / '+h.d+' / '+h.a+'</td><td>'+h.cs+'</td><td>'+Math.round(h.dmgDealt)+'</td><td>'+Math.floor(h.gold)+'</td></tr>').join('');
  $('resBox').innerHTML='<h2 style="color:'+(win?'#ffd95a':'#9aa8b0')+'">'+(win?'胜 利':'败 北')+'</h2><div class="sub" style="letter-spacing:.15em">'+(win?'敌方龙脉晶已被摧毁':'我方龙脉晶已被摧毁')+' · 用时 '+fmtT(G.t)+'</div>'+
    '<table><tr><th>英雄</th><th>等级</th><th>击杀/死亡/助攻</th><th>补刀</th><th>对英雄伤害</th><th>金币</th></tr>'+rows+'</table>'+
    '<div class="sub" style="letter-spacing:.1em">击杀 '+G.kills[0]+' : '+G.kills[1]+'　·　摧毁防御塔 '+G.towerKills[0]+' : '+G.towerKills[1]+'</div>'+
    '<div class="credit" style="margin:12px 0 8px">浮士德工作室 出品<small>Faustus Studio</small></div>'+
    '<div><div class="btn sm" id="rAgain">再战一局</div><div class="btn sm" id="rMenu">返回选将</div></div>';
  $('result').classList.remove('hide');sfx(win?'victory':'defeat');
  $('rAgain').onclick=()=>startGame();$('rMenu').onclick=()=>showMenu();
}
/* 商店 */
function openShop(){if(!G||G.over)return;shopOpen=true;$('shop').classList.remove('hide');renderShop()}
function closeShop(){shopOpen=false;$('shop').classList.add('hide')}
function renderShop(){
  if(!shopOpen)return;const p=G.player;const can=inBase(p)||p.dead;
  let h='<h4><span>商店　<small style="color:#ffd95a">金币 '+Math.floor(p.gold)+'</small></span><span style="cursor:pointer" id="shX">✕</span></h4>';
  h+='<div class="tip">'+(can?'点击购买；点击已拥有的装备可按 70% 价格出售。':'<span style="color:#ff9a86">只能在基地（泉水）内或阵亡时购买。</span>')+'</div><div id="own">';
  for(let i=0;i<6;i++){const id=p.items[i];h+='<div class="it" data-s="'+i+'" title="'+(id?ITEMBYID[id].n+'（点击出售）':'空')+'"><i>'+(id?ITEMBYID[id].g:'')+'</i></div>'}
  h+='</div><div class="grid">';
  h+='<div class="it'+(p.gold<POTION.cost||p.potions>=POTION.max?' no':'')+'" data-p="1"><i style="background:#5ac07a">药</i><div><b>治疗药水</b> <span class="c">'+POTION.cost+'</span><small>6 秒内回复 '+POTION.heal+' 生命（按 1 使用，最多 '+POTION.max+' 瓶）</small></div></div>';
  for(const it of ITEMS)h+='<div class="it'+(p.gold<it.cost||p.items.length>=6?' no':'')+'" data-b="'+it.id+'"><i>'+it.g+'</i><div><b>'+it.n+'</b> <span class="c">'+it.cost+'</span><small>'+it.d+'</small></div></div>';
  h+='</div>';$('shop').innerHTML=h;
  $('shX').onclick=closeShop;
  $('shop').querySelectorAll('[data-b]').forEach(e=>e.onclick=()=>{if(!can){G.hint={t:G.t,txt:'只能在基地内购买'};sfx('warn');return}if(!buyItem(p,e.dataset.b))sfx('warn');renderShop()});
  $('shop').querySelectorAll('[data-s]').forEach(e=>e.onclick=()=>{if(!can){sfx('warn');return}sellItem(p,+e.dataset.s);renderShop()});
  $('shop').querySelector('[data-p]').onclick=()=>{if(!can){sfx('warn');return}if(!buyPotion(p))sfx('warn');renderShop()};
}
/* 指令 */
function issueOrder(wx,wy,amove,hold){
  const p=G.player;if(p.dead||G.over)return;
  if(p.dash||p.stun>0)return;
  cancelRecall(p);
  if(!amove){
    let best=null,bd=1e9;
    for(const u of G.units){if(u.team===p.team||u.dead||!targetable(u))continue;const d=Math.hypot(u.x-wx,u.y-wy);if(d<=u.r+14&&d<bd){bd=d;best=u}}
    if(best){p.order={type:'attack',target:best};if(!hold)G.marks.push({x:best.x,y:best.y,t:0,col:'#ff5a40'});return}
  }
  const w=walkPoint(wx,wy);
  p.order={type:amove?'amove':'move',x:w.x,y:w.y};
  if(!hold)G.marks.push({x:w.x,y:w.y,t:0,col:amove?'#ff7a50':'#a8ffb8'});
}
function miniToWorld(mx,my){const m=UIH.mini;return {x:(mx-m.x)/m.w*W,y:(my-m.y)/m.h*H}}
function inRect(r,x,y){return r&&x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h}
let miniDrag=false;
function castKey(i){
  if(!G||G.paused||G.over)return;const p=G.player;
  if(p.dead)return;
  if(!tryCast(p,i,MOUSE.wx,MOUSE.wy)&&p.ranks[i]>0&&p.cds[i]>0)G.hint={t:G.t,txt:'技能冷却中'};
}
cv.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('mousedown',e=>{
  if(mode!=='play'||!G||G.paused)return;auInit();
  const mx=e.clientX,my=e.clientY;MOUSE.x=mx;MOUSE.y=my;
  if(e.button===0){
    for(const b of UIH.plus){if(inRect(b,mx,my)){learn(G.player,b.i);return}}
    if(inRect(UIH.potion,mx,my)){usePotion(G.player);return}
    if(inRect(UIH.mini,mx,my)){miniDrag=true;const w=miniToWorld(mx,my);G.cam.ox=w.x-G.player.x;G.cam.oy=w.y-G.player.y;return}
    const wp=s2w(mx,my);
    if(G.amode){G.amode=false;issueOrder(wp.x,wp.y,true);return}
    issueOrder(wp.x,wp.y,false);
  }else if(e.button===2){
    G.amode=false;
    if(inRect(UIH.mini,mx,my)){const w=miniToWorld(mx,my);issueOrder(w.x,w.y,false);return}
    const wp=s2w(mx,my);issueOrder(wp.x,wp.y,false);MOUSE.rmb=true;
  }
});
window.addEventListener('mouseup',e=>{if(e.button===2)MOUSE.rmb=false;if(e.button===0)miniDrag=false});
window.addEventListener('mousemove',e=>{MOUSE.x=e.clientX;MOUSE.y=e.clientY;MOUSE.inside=true;
  if(miniDrag&&G&&inRect(UIH.mini,e.clientX,e.clientY)){const w=miniToWorld(e.clientX,e.clientY);G.cam.ox=w.x-G.player.x;G.cam.oy=w.y-G.player.y}});
document.addEventListener('mouseleave',()=>{MOUSE.inside=false});
window.addEventListener('keydown',e=>{
  const c=e.code;
  if(['Space','Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(c))e.preventDefault();
  if(mode==='menu'){if(c==='Enter')startGame();return}
  if(!G)return;
  if(c==='KeyM'){AU.mute=!AU.mute;if(AU.mute&&AU.ctx){}return}
  if(c==='Escape'){if(shopOpen){closeShop();return}if(G.amode){G.amode=false;return}togglePause();return}
  if(c==='KeyF'&&!e.repeat){G.speed=G.speed===1?1.5:G.speed===1.5?2:1;G.hint={t:G.t,txt:'游戏速度 ×'+G.speed};sfx('click');return}
  if(G.paused||e.repeat&&!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(c)){KEYS[c]=true;return}
  KEYS[c]=true;
  const p=G.player;
  const qi={KeyQ:0,KeyW:1,KeyE:2,KeyR:3}[c];
  if(qi!==undefined){e.preventDefault();if(e.ctrlKey||e.shiftKey||e.altKey){if(!learn(p,qi))sfx('warn')}else castKey(qi);return}
  if(c==='KeyB'){if(startRecall(p)){}return}
  if(c==='KeyP'){shopOpen?closeShop():openShop();sfx('click');return}
  if(c==='Digit1'){usePotion(p);return}
  if(c==='KeyA'){if(!p.dead)G.amode=true;return}
  if(c==='KeyS'){p.order=null;p.windup=null;return}
  if(c==='Space'){G.cam.ox=0;G.cam.oy=0;return}
});
window.addEventListener('keyup',e=>{KEYS[e.code]=false});
window.addEventListener('blur',()=>{for(const k in KEYS)KEYS[k]=false;MOUSE.rmb=false});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='play'&&G&&!G.over&&!G.paused)togglePause()});
$('btnStart').onclick=startGame;
$('bResume').onclick=togglePause;
$('bRestart').onclick=()=>{startGame()};
$('bMenu').onclick=()=>showMenu();
window.addEventListener('resize',resize);
/* 主循环 */
let lastT=performance.now(),acc=0,uiT=0;
function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min(.1,(now-lastT)/1000);lastT=now;
  if(G&&mode==='play'){
    if(!G.paused){
      acc+=dt*G.speed;let n=0;while(acc>=1/60&&n<8){stepGame(1/60);acc-=1/60;n++}if(n>=8)acc=0;
      const p=G.player;
      if(MOUSE.rmb&&!p.dead&&p.order&&p.order.type==='move'){const wp=s2w(MOUSE.x,MOUSE.y);const w=walkPoint(wp.x,wp.y);p.order.x=w.x;p.order.y=w.y}
      // 镜头：空格回正、方向键 / 边缘滚屏
      const cm=G.cam;
      if(KEYS.Space){cm.ox*=.7;cm.oy*=.7}
      let px=0,py=0;if(KEYS.ArrowLeft)px-=1;if(KEYS.ArrowRight)px+=1;if(KEYS.ArrowUp)py-=1;if(KEYS.ArrowDown)py+=1;
      if(MOUSE.inside&&!shopOpen&&!miniDrag){if(MOUSE.x<=4)px-=1;if(MOUSE.x>=VW-5)px+=1;if(MOUSE.y<=4)py-=1;if(MOUSE.y>=VH-5)py+=1}
      cm.ox=clamp(cm.ox+px*1000*dt,-1400,1400);cm.oy=clamp(cm.oy+py*1000*dt,-1000,1000);
      musicTick(dt);
      uiT-=dt;if(uiT<=0){uiT=.25;renderShop()}
      if(G.over&&G.endT>3&&!G.resShown)showResult();
    }
  }
  render(dt);
}
/* 初始化 */
resize();buildBG();buildMenu();
(function(){ // 菜单背景用一局空局面
  newGame({hero:0,diff:1,speed:1,auto:true});G.paused=true;
})();
requestAnimationFrame(frame);
// 测试钩子
window.__dbg={get G(){return G},step(n,dt){for(let i=0;i<n;i++){stepGame(dt||1/60);if(G.over&&G.endT>3.5)break}},start:startGame,SET,showResult,
  render:()=>render(.016)};
