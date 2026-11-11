/* ---------- 渲染 ---------- */
const cv=$('c'),ctx=cv.getContext('2d');
let VW=0,VH=0,DPR=1,Z=1,UI=1;
const UIH={plus:[],mini:null,potion:null};
const MOUSE={x:640,y:360,wx:0,wy:0,inside:false,rmb:false};
function resize(){DPR=Math.min(window.devicePixelRatio||1,2);VW=innerWidth;VH=innerHeight;cv.width=Math.round(VW*DPR);cv.height=Math.round(VH*DPR);Z=VH/860;UI=clamp(VH/760,.8,1.4)}
function s2w(mx,my){return {x:(mx-VW/2)/Z+G.cam.x,y:(my-VH/2)/Z+G.cam.y}}
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function bar(x,y,w,h,k,col,bg){ctx.fillStyle=bg||'rgba(0,0,0,.65)';ctx.fillRect(x-1,y-1,w+2,h+2);ctx.fillStyle=col;ctx.fillRect(x,y,w*clamp(k,0,1),h)}
function txt(s,x,y,size,col,align,font,stroke){ctx.font=(font||'bold ')+size+'px '+FONT;ctx.textAlign=align||'left';ctx.textBaseline='middle';
  if(stroke!==false){ctx.lineWidth=Math.max(2,size/5);ctx.strokeStyle='rgba(0,0,0,.8)';ctx.lineJoin='round';ctx.strokeText(s,x,y)}ctx.fillStyle=col;ctx.fillText(s,x,y)}
function shadow(x,y,rx,ry){ctx.fillStyle='rgba(0,0,0,.32)';ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fill()}

function drawTower(t){
  const c=TEAMS[t.team];
  if(t.dead){shadow(t.x,t.y+6,t.r*1.1,t.r*.7);ctx.fillStyle='#3a3630';for(let i=0;i<7;i++){const a=i*1.1,d=t.r*.5;ctx.beginPath();ctx.ellipse(t.x+Math.cos(a)*d,t.y+Math.sin(a)*d*.6,10+i%3*4,7,a,0,TAU);ctx.fill()}
    ctx.fillStyle='rgba(255,120,40,.5)';ctx.beginPath();ctx.arc(t.x,t.y,6+Math.sin(G.t*6+t.id)*2,0,TAU);ctx.fill();return}
  shadow(t.x+6,t.y+t.r*.5,t.r*1.25,t.r*.75);
  ctx.fillStyle='#4a4a46';ctx.beginPath();ctx.arc(t.x,t.y,t.r+4,0,TAU);ctx.fill();ctx.fillStyle='#6b6a62';ctx.beginPath();ctx.arc(t.x,t.y,t.r-3,0,TAU);ctx.fill();
  ctx.strokeStyle=c.col;ctx.lineWidth=3;ctx.beginPath();ctx.arc(t.x,t.y,t.r-8,0,TAU);ctx.stroke();
  const tg=targetable(t);
  for(let k=0;k<3;k++){const w=t.r*(1.15-k*.26),y=t.y-8-k*17;
    ctx.fillStyle='#2c2420';ctx.fillRect(t.x-w*.5,y,w,16);
    ctx.fillStyle=k===2?c.col:c.dark;ctx.beginPath();ctx.moveTo(t.x-w*.95,y+4);ctx.quadraticCurveTo(t.x,y-20,t.x+w*.95,y+4);ctx.quadraticCurveTo(t.x,y-4,t.x-w*.95,y+4);ctx.fill();
    ctx.strokeStyle=c.light;ctx.globalAlpha=.55;ctx.lineWidth=1.5;ctx.stroke();ctx.globalAlpha=1}
  const fl=G.t-(t.lastShot||-9);
  const gl=ctx.createRadialGradient(t.x,t.y-62,0,t.x,t.y-62,34);gl.addColorStop(0,c.light);gl.addColorStop(.3,c.col);gl.addColorStop(1,'rgba(0,0,0,0)');
  ctx.globalAlpha=tg?(.65+.25*Math.sin(G.t*4+t.id)):.25;ctx.fillStyle=gl;ctx.beginPath();ctx.arc(t.x,t.y-62,34,0,TAU);ctx.fill();ctx.globalAlpha=1;
  if(!tg){ctx.fillStyle='rgba(20,30,40,.35)';ctx.beginPath();ctx.arc(t.x,t.y-6,t.r+4,0,TAU);ctx.fill()}
  const hy=t.y-t.r-84;bar(t.x-44,hy,88,8,t.hp/t.maxhp,t.team===0?'#4fd0ee':'#ee6a4c');
}
function drawNexus(n){
  const c=TEAMS[n.team];
  if(n.dead){shadow(n.x,n.y,n.r*1.4,n.r);ctx.fillStyle='#2e2a26';for(let i=0;i<12;i++){const a=i*.6;ctx.beginPath();ctx.ellipse(n.x+Math.cos(a)*n.r*.7,n.y+Math.sin(a)*n.r*.5,18,10,a,0,TAU);ctx.fill()}return}
  const tg=targetable(n),p=Math.sin(G.t*2.5+n.team)*.5+.5;
  shadow(n.x+8,n.y+30,n.r*1.35,n.r*.8);
  ctx.fillStyle='#4a4a46';ctx.beginPath();for(let i=0;i<8;i++){const a=i*TAU/8+.39;ctx.lineTo(n.x+Math.cos(a)*(n.r+16),n.y+Math.sin(a)*(n.r+16))}ctx.fill();
  ctx.fillStyle='#6f6e66';ctx.beginPath();for(let i=0;i<8;i++){const a=i*TAU/8+.39;ctx.lineTo(n.x+Math.cos(a)*(n.r+4),n.y+Math.sin(a)*(n.r+4))}ctx.fill();
  ctx.strokeStyle=c.col;ctx.lineWidth=3;ctx.setLineDash([14,10]);ctx.lineDashOffset=-G.t*20;ctx.beginPath();ctx.arc(n.x,n.y,n.r-6,0,TAU);ctx.stroke();ctx.setLineDash([]);
  const gl=ctx.createRadialGradient(n.x,n.y-40,0,n.x,n.y-40,n.r*1.8);gl.addColorStop(0,c.light);gl.addColorStop(.25,c.col);gl.addColorStop(1,'rgba(0,0,0,0)');
  ctx.globalAlpha=(tg?.5:.28)+.25*p;ctx.fillStyle=gl;ctx.beginPath();ctx.arc(n.x,n.y-40,n.r*1.8,0,TAU);ctx.fill();ctx.globalAlpha=1;
  const by=n.y-44-p*6;ctx.fillStyle=c.dark;ctx.beginPath();ctx.moveTo(n.x,by-72);ctx.lineTo(n.x+46,by);ctx.lineTo(n.x,by+52);ctx.lineTo(n.x-46,by);ctx.closePath();ctx.fill();
  ctx.fillStyle=c.col;ctx.beginPath();ctx.moveTo(n.x,by-72);ctx.lineTo(n.x+46,by);ctx.lineTo(n.x,by+52);ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.45)';ctx.beginPath();ctx.moveTo(n.x,by-72);ctx.lineTo(n.x-12,by-10);ctx.lineTo(n.x,by+52);ctx.lineTo(n.x+4,by-10);ctx.closePath();ctx.fill();
  if(!tg){ctx.strokeStyle='rgba(180,200,220,.6)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(n.x,n.y-14,n.r+8,0,TAU);ctx.stroke()}
  bar(n.x-60,n.y-n.r-96,120,10,n.hp/n.maxhp,n.team===0?'#4fd0ee':'#ee6a4c');
  txt('龙脉晶',n.x,n.y-n.r-110,14,c.light,'center');
}
function drawHero(h){
  if(h.dead)return;
  const c=TEAMS[h.team],D=h.def;const x=h.x,y=h.y-h.z;
  shadow(h.x,h.y+h.r*.6,h.r*1.0*(1-h.z/220),h.r*.55*(1-h.z/220));
  if(h.recall>0){ctx.strokeStyle='rgba(168,232,255,.8)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(h.x,h.y,h.r+8+Math.sin(G.t*10)*3,-Math.PI/2,-Math.PI/2+TAU*(1-h.recall/5));ctx.stroke();
    const g=ctx.createLinearGradient(h.x,h.y-120,h.x,h.y);g.addColorStop(0,'rgba(168,232,255,0)');g.addColorStop(1,'rgba(168,232,255,.35)');ctx.fillStyle=g;ctx.fillRect(h.x-h.r,h.y-120,h.r*2,120)}
  // 减速/加速光环
  if(h.slowT>0){ctx.strokeStyle='rgba(120,200,255,.7)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,h.r+5,0,TAU);ctx.stroke()}
  if(h.buffs.length){ctx.strokeStyle='rgba(255,230,140,.6)';ctx.lineWidth=2;ctx.setLineDash([5,5]);ctx.lineDashOffset=-G.t*30;ctx.beginPath();ctx.arc(x,y,h.r+7,0,TAU);ctx.stroke();ctx.setLineDash([])}
  // 武器
  const fa=h.face;ctx.save();ctx.translate(x,y);ctx.rotate(fa);
  const sw=h.swing>0?(1-h.swing/.22):0;
  if(D.id==='yue'){ctx.rotate(h.swing>0?-1.0+sw*2.0:.35);ctx.fillStyle='#d8dde0';ctx.fillRect(h.r*.4,-3,h.r*1.5,6);ctx.fillStyle='#8a6a2a';ctx.fillRect(h.r*.2,-4,h.r*.35,8);ctx.fillStyle='#f6fbff';ctx.beginPath();ctx.moveTo(h.r*1.9,-3);ctx.lineTo(h.r*2.25,0);ctx.lineTo(h.r*1.9,3);ctx.fill()}
  else if(D.id==='shuang'){ctx.strokeStyle='#e8f6ff';ctx.lineWidth=4;ctx.beginPath();ctx.arc(h.r*.55,0,h.r*1.0,-1.25,1.25);ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=1;ctx.beginPath();const bk=h.swing>0?-6:0;ctx.moveTo(h.r*.55+Math.cos(-1.25)*h.r,Math.sin(-1.25)*h.r);ctx.lineTo(h.r*.55-4+bk,0);ctx.lineTo(h.r*.55+Math.cos(1.25)*h.r,Math.sin(1.25)*h.r);ctx.stroke()}
  else{const t=G.t*3;ctx.fillStyle='#f4ecc4';ctx.save();ctx.translate(h.r*1.1,Math.sin(t)*6);ctx.rotate(Math.sin(t*.7)*.3);ctx.fillRect(-5,-9,10,18);ctx.fillStyle='#c0392b';ctx.fillRect(-1,-6,2,12);ctx.restore()}
  ctx.restore();
  // 身体
  const g=ctx.createRadialGradient(x-h.r*.3,y-h.r*.35,2,x,y,h.r);g.addColorStop(0,'#fffbe8');g.addColorStop(.35,D.color);g.addColorStop(1,'#26313a');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,h.r,0,TAU);ctx.fill();
  ctx.lineWidth=4;ctx.strokeStyle=c.col;ctx.stroke();
  if(G.t-h.hurtT<.09){ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.arc(x,y,h.r,0,TAU);ctx.fill()}
  ctx.font='900 '+(h.r*1.15)+'px '+SERIF;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#10181c';ctx.fillText(D.glyph,x,y+2);
  if(h.shield>0){ctx.strokeStyle='rgba(255,255,255,.85)';ctx.fillStyle='rgba(255,255,255,.16)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,h.r+9,0,TAU);ctx.fill();ctx.stroke()}
  if(h.stun>0){for(let i=0;i<3;i++){const a=G.t*6+i*TAU/3;txt('★',x+Math.cos(a)*18,y-h.r-18+Math.sin(a)*5,14,'#ffe27a','center')}}
  else if(h.rootT>0){ctx.strokeStyle='#a8f0b0';ctx.lineWidth=3;for(let i=0;i<6;i++){const a=i*TAU/6;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*h.r*.8,y+h.r*.5);ctx.lineTo(x+Math.cos(a)*(h.r+6),y+h.r*.5+Math.sin(a)*8+6);ctx.stroke()}}
  // 血条
  const bw=96,bx=x-bw/2,by=y-h.r-30;const ally=h.team===0;
  ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(bx-24,by-3,23,19);
  ctx.fillStyle=ally?'#1c5a6a':'#6a241a';ctx.fillRect(bx-23,by-2,21,17);txt(String(h.level),bx-12.5,by+7,13,'#fff','center');
  bar(bx,by,bw,11,h.hp/h.maxhp,h===G.player?'#7dff8a':ally?'#4ccf6a':'#e8503c');
  if(h.shield>0){ctx.fillStyle='rgba(255,255,255,.85)';ctx.fillRect(bx,by,bw*clamp(h.shield/h.maxhp,0,1),4)}
  ctx.fillStyle='rgba(0,0,0,.35)';for(let v=250;v<h.maxhp;v+=250){ctx.fillRect(bx+bw*v/h.maxhp,by,1,11)}
  bar(bx,by+12,bw,4,h.mana/h.maxmana,'#4a9cf0');
  if(h===G.player)txt('你',x,by-11,12,'#fff2a0','center');
}
function drawMinion(m){
  if(m.dead)return;const c=TEAMS[m.team];const r=m.r;
  shadow(m.x,m.y+r*.6,r,r*.5);
  const flash=G.t-m.hurtT<.08;
  ctx.save();ctx.translate(m.x,m.y);
  ctx.fillStyle=flash?'#fff':c.col;ctx.strokeStyle=c.dark;ctx.lineWidth=3;
  if(m.type==='melee'||m.type==='brute'){ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fill();ctx.stroke();if(m.type==='brute'){ctx.fillStyle=c.dark;ctx.beginPath();ctx.arc(0,0,r*.55,0,TAU);ctx.fill();ctx.fillStyle='#f0d890';ctx.beginPath();ctx.moveTo(-r*.7,-r*.7);ctx.lineTo(-r*.3,-r*1.3);ctx.lineTo(-r*.1,-r*.8);ctx.moveTo(r*.7,-r*.7);ctx.lineTo(r*.3,-r*1.3);ctx.lineTo(r*.1,-r*.8);ctx.fill();ctx.fillStyle=c.col}ctx.rotate(m.swing>0?m.face-.9+(1-m.swing/.2)*1.8:m.face);ctx.fillStyle='#e8e8e0';ctx.fillRect(r*.6,-2,r*1.1,4)}
  else if(m.type==='ranged'){ctx.beginPath();ctx.moveTo(r*1.1,0);ctx.lineTo(-r*.8,-r);ctx.lineTo(-r*.8,r);ctx.closePath();ctx.rotate(0);ctx.save();ctx.rotate(m.face);ctx.fill();ctx.stroke();ctx.restore();ctx.fillStyle=c.light;ctx.beginPath();ctx.arc(0,0,r*.35,0,TAU);ctx.fill()}
  else{rr(-r,-r*.8,r*2,r*1.6,6);ctx.fill();ctx.stroke();ctx.fillStyle=c.dark;ctx.beginPath();ctx.arc(0,0,r*.5,0,TAU);ctx.fill();ctx.strokeStyle='#ddd';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(m.face)*r*1.3,Math.sin(m.face)*r*1.3);ctx.stroke()}
  ctx.restore();
  if(m.hp<m.maxhp||m.stun>0){const w=m.type==='brute'?56:m.type==='siege'?46:36;bar(m.x-w/2,m.y-r-11,w,5,m.hp/m.maxhp,m.team===0?'#4fd0ee':'#ee6a4c')}
  if(m.stun>0)txt('★',m.x,m.y-r-18,12,'#ffe27a','center');
}
function drawProj(p){
  if(p.k==='home'){
    const s=p.style;
    if(s==='tbolt'){const c=TEAMS[p.team];const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,18);g.addColorStop(0,'#fff');g.addColorStop(.4,c.col);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,18,0,TAU);ctx.fill()}
    else if(s==='orbs'||s==='ball'){const col=s==='orbs'?'#d9b8ff':'#ffb070';const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,s==='ball'?16:12);g.addColorStop(0,'#fff');g.addColorStop(.5,col);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,s==='ball'?16:12,0,TAU);ctx.fill()}
    else{const L=s==='arrowh'?30:18;ctx.strokeStyle=s==='arrowh'?'#e8f8ff':TEAMS[p.team].light;ctx.lineWidth=s==='arrowh'?3:2;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-Math.cos(p.a)*L,p.y-Math.sin(p.a)*L);ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(p.x,p.y,3,0,TAU);ctx.fill()}
    return}
  const L=p.style==='beam'?260:p.style==='arrow'?90:0;
  if(p.style==='orb'){const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,34);g.addColorStop(0,'#fff');g.addColorStop(.35,p.color);g.addColorStop(1,'rgba(160,80,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,34,0,TAU);ctx.fill();return}
  const tx=p.x-p.dx*L,ty=p.y-p.dy*L;
  const g=ctx.createLinearGradient(tx,ty,p.x,p.y);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(1,p.color);
  ctx.strokeStyle=g;ctx.lineWidth=p.style==='beam'?p.r*1.1:6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(p.x,p.y);ctx.stroke();
  if(p.style==='beam'){ctx.strokeStyle='rgba(120,210,255,.55)';ctx.lineWidth=p.r*1.8;ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(p.x,p.y);ctx.stroke()}
  ctx.lineCap='butt';
  ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(p.x+p.dx*16,p.y+p.dy*16);ctx.lineTo(p.x-p.dy*7,p.y+p.dx*7);ctx.lineTo(p.x+p.dy*7,p.y-p.dx*7);ctx.fill();
}
function drawZone(z){
  const k=z.age<z.delay?z.age/z.delay:1;
  if(z.style==='rain'||z.style==='rune'){
    if(z.det){const f=1-(z.age-z.delay)/.3;ctx.fillStyle=z.color;ctx.globalAlpha=Math.max(0,f)*.5;ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,TAU);ctx.fill();ctx.globalAlpha=1;return}
    ctx.globalAlpha=.25+.3*k;ctx.fillStyle=z.color;ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,TAU);ctx.fill();ctx.globalAlpha=.9;ctx.strokeStyle=z.color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,TAU);ctx.stroke();
    ctx.lineWidth=2;ctx.beginPath();ctx.arc(z.x,z.y,z.r*k,0,TAU);ctx.stroke();
    if(z.style==='rune'){ctx.save();ctx.translate(z.x,z.y);ctx.rotate(G.t*1.5);ctx.beginPath();for(let i=0;i<6;i++){const a=i*TAU/6;ctx.lineTo(Math.cos(a)*z.r*.8,Math.sin(a)*z.r*.8)}ctx.closePath();ctx.stroke();ctx.rotate(.52);ctx.beginPath();for(let i=0;i<6;i++){const a=i*TAU/6;ctx.lineTo(Math.cos(a)*z.r*.8,Math.sin(a)*z.r*.8)}ctx.closePath();ctx.stroke();ctx.restore()}
    else{ctx.strokeStyle='#fff';ctx.lineWidth=2;for(let i=0;i<9;i++){const a=i*2.4+G.t,rr_=(i%3+1)*z.r/4;const px=z.x+Math.cos(a)*rr_,py=z.y+Math.sin(a)*rr_;const fy=((G.t*500+i*90)%260);ctx.beginPath();ctx.moveTo(px,py-fy);ctx.lineTo(px-3,py-fy+30);ctx.stroke()}}
    ctx.globalAlpha=1;return}
  if(z.style==='fire'){
    const life=z.age<z.delay?0:1;const fade=Math.min(1,(z.delay+z.dur-z.age)/.5);
    const g=ctx.createRadialGradient(z.x,z.y,0,z.x,z.y,z.r);g.addColorStop(0,'rgba(255,230,120,.55)');g.addColorStop(.6,'rgba(255,110,40,.4)');g.addColorStop(1,'rgba(200,40,20,.12)');
    ctx.globalAlpha=(z.det?1:k*.6)*fade;ctx.fillStyle=g;ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,TAU);ctx.fill();
    ctx.strokeStyle='#ff9a4a';ctx.lineWidth=4;ctx.setLineDash([20,12]);ctx.lineDashOffset=G.t*40;ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,TAU);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#ffd070';for(let i=0;i<14;i++){const a=i*1.9+G.t*.8,d=((i*37)%100)/100*z.r*.9;const fx=z.x+Math.cos(a)*d,fy=z.y+Math.sin(a)*d*.9;const hgt=18+10*Math.sin(G.t*9+i);ctx.beginPath();ctx.moveTo(fx-6,fy);ctx.quadraticCurveTo(fx,fy-hgt*1.6,fx+6,fy);ctx.fill()}
    ctx.globalAlpha=1}
}
function drawFx(f){
  const k=f.t/f.dur;
  if(f.k==='p'){ctx.globalAlpha=1-k;ctx.fillStyle=f.col;ctx.beginPath();ctx.arc(f.x,f.y,f.r*(1-k*.5),0,TAU);ctx.fill();ctx.globalAlpha=1}
  else if(f.k==='ring'){ctx.globalAlpha=1-k;ctx.strokeStyle=f.col;ctx.lineWidth=f.lw*(1-k*.6);ctx.beginPath();ctx.arc(f.x,f.y,f.r*(.25+.75*Math.sqrt(k)),0,TAU);ctx.stroke();ctx.globalAlpha=1}
  else if(f.k==='spin'){const h=f.h;ctx.globalAlpha=1-k*.7;ctx.strokeStyle=f.col;ctx.lineWidth=6;ctx.lineCap='round';for(let i=0;i<3;i++){const a=k*14+i*TAU/3;ctx.beginPath();ctx.arc(h.x,h.y,f.r*(.55+.45*k),a,a+1.4);ctx.stroke()}ctx.lineCap='butt';ctx.globalAlpha=.25*(1-k);ctx.fillStyle=f.col;ctx.beginPath();ctx.arc(h.x,h.y,f.r,0,TAU);ctx.fill();ctx.globalAlpha=1}
  else if(f.k==='slash'){ctx.globalAlpha=1-k;ctx.strokeStyle=f.col;ctx.lineWidth=9*(1-k);ctx.lineCap='round';ctx.beginPath();ctx.arc(f.x,f.y,f.len*.8,f.a-.9+k*.5,f.a+.9+k*.3);ctx.stroke();ctx.lineCap='butt';ctx.globalAlpha=1}
}
function drawWorld(){
  const p=G.player,c=G.cam;
  ctx.fillStyle='#050a0a';ctx.fillRect(0,0,VW,VH);
  ctx.save();
  const sx=(Math.random()-.5)*c.shake,sy=(Math.random()-.5)*c.shake;
  ctx.translate(VW/2-c.x*Z+sx,VH/2-c.y*Z+sy);ctx.scale(Z,Z);
  ctx.drawImage(BG,0,0,BG.width,BG.height,0,0,W,H);
  const vx0=c.x-VW/2/Z-150,vx1=c.x+VW/2/Z+150,vy0=c.y-VH/2/Z-250,vy1=c.y+VH/2/Z+150;
  const vis=u=>u.x>vx0&&u.x<vx1&&u.y>vy0&&u.y<vy1;
  for(const z of G.zones)drawZone(z);
  // 塔射程
  for(const u of G.units){if(u.kind!=='tower'||u.dead||!vis(u))continue;if(Math.hypot(u.x-p.x,u.y-p.y)<u.range+260){ctx.strokeStyle=TEAMS[u.team].col;ctx.globalAlpha=.3;ctx.lineWidth=3;ctx.setLineDash([16,14]);ctx.beginPath();ctx.arc(u.x,u.y,u.range,0,TAU);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1}}
  for(const m of G.marks){const k=m.t/.5;ctx.strokeStyle=m.col;ctx.globalAlpha=1-k;ctx.lineWidth=3;ctx.beginPath();ctx.arc(m.x,m.y,28*(1-k*.7),0,TAU);ctx.stroke();ctx.globalAlpha=1}
  const list=[];for(const u of G.units){if(vis(u))list.push(u)}
  list.sort((a,b)=>(a.kind==='hero'||a.kind==='minion'?a.y:a.y-(a.kind==='nexus'?30:10))-(b.kind==='hero'||b.kind==='minion'?b.y:b.y-(b.kind==='nexus'?30:10)));
  for(const u of list){if(u.kind==='tower')drawTower(u);else if(u.kind==='nexus')drawNexus(u)}
  for(const u of list){if(u.kind==='minion')drawMinion(u);else if(u.kind==='hero')drawHero(u)}
  // 被选为塔目标的提示
  for(const t of G.towers[1-p.team]){if(t.tgt===p&&!t.dead){ctx.strokeStyle='#ff4030';ctx.lineWidth=4;ctx.globalAlpha=.6+.4*Math.sin(G.t*20);ctx.beginPath();ctx.arc(p.x,p.y,p.r+14,0,TAU);ctx.stroke();ctx.globalAlpha=1}}
  for(const f of G.fx)drawFx(f);
  for(const pr of G.projs)drawProj(pr);
  if(G.amode){txt('攻击移动',MOUSE.wx,MOUSE.wy-26,15,'#ff9a86','center');ctx.strokeStyle='#ff6a50';ctx.lineWidth=3;ctx.beginPath();ctx.arc(MOUSE.wx,MOUSE.wy,16,0,TAU);ctx.stroke()}
  for(const t of G.texts){const k=t.t/t.dur;ctx.globalAlpha=1-k*k;txt(t.txt,t.x,t.y,t.size,t.col,'center');ctx.globalAlpha=1}
  ctx.restore();
}
/* ---------- HUD ---------- */
function drawMinimap(){
  const u=UI,mw=300*u,mh=mw*H/W,mx=VW-mw-12*u,my=VH-mh-12*u;UIH.mini={x:mx,y:my,w:mw,h:mh};
  ctx.save();ctx.fillStyle='rgba(6,14,14,.86)';rr(mx-4,my-4,mw+8,mh+8,6);ctx.fill();ctx.strokeStyle='#7a6a40';ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.rect(mx,my,mw,mh);ctx.clip();
  const sx=mw/W,sy=mh/H;ctx.translate(mx,my);ctx.scale(sx,sy);
  ctx.fillStyle='#0f1d18';ctx.fillRect(0,0,W,H);
  ctx.lineCap='round';ctx.lineJoin='round';
  const stroke=(w,col)=>{ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(PATH[0][0],PATH[0][1]);for(let i=1;i<PATH.length;i++)ctx.lineTo(PATH[i][0],PATH[i][1]);ctx.stroke()};
  stroke(WALK*2,'#1e3a2c');stroke(ROAD*2,'#6a6048');
  for(const n of NEXUS_POS){ctx.fillStyle='rgba(120,130,110,.35)';ctx.beginPath();ctx.arc(n.x,n.y,BASE_R,0,TAU);ctx.fill()}
  for(const t of G.towers[0].concat(G.towers[1])){ctx.fillStyle=t.dead?'#555':TEAMS[t.team].col;const s=t.dead?160:230;ctx.fillRect(t.x-s/2,t.y-s/2,s,s)}
  for(const n of G.nexus){ctx.fillStyle=n.dead?'#555':TEAMS[n.team].light;ctx.beginPath();ctx.arc(n.x,n.y,n.dead?120:200,0,TAU);ctx.fill();ctx.strokeStyle=TEAMS[n.team].col;ctx.lineWidth=60;ctx.stroke()}
  for(const m of G.units){if(m.kind!=='minion'||m.dead)continue;ctx.fillStyle=TEAMS[m.team].col;ctx.beginPath();ctx.arc(m.x,m.y,m.type==='siege'?60:42,0,TAU);ctx.fill()}
  for(const h of G.heroes){if(h.dead)continue;ctx.fillStyle=TEAMS[h.team].col;ctx.strokeStyle=h===G.player?'#fff':'#000';ctx.lineWidth=h===G.player?50:30;ctx.beginPath();ctx.arc(h.x,h.y,130,0,TAU);ctx.fill();ctx.stroke()}
  const cw=VW/Z,ch=VH/Z;ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=28;ctx.strokeRect(G.cam.x-cw/2,G.cam.y-ch/2,cw,ch);
  ctx.restore();
}
function iconBox(x,y,s,col,label,k){
  const g=ctx.createLinearGradient(x,y,x,y+s);g.addColorStop(0,col);g.addColorStop(1,'#1a242a');
  ctx.fillStyle=g;rr(x,y,s,s,7);ctx.fill();
}
function drawHUD(dt){
  const p=G.player,u=UI;UIH.plus=[];UIH.potion=null;
  // ---- 顶部计分板 ----
  const cx=VW/2;
  ctx.fillStyle='rgba(8,16,18,.82)';rr(cx-120*u,6*u,240*u,40*u,8);ctx.fill();ctx.strokeStyle='#6d5a34';ctx.lineWidth=1.5;ctx.stroke();
  txt(String(G.kills[0]),cx-82*u,26*u,22*u,TEAMS[0].col,'center');txt(String(G.kills[1]),cx+82*u,26*u,22*u,TEAMS[1].col,'center');
  txt(fmtT(G.t),cx,20*u,19*u,'#f6e8c0','center');
  txt('塔 '+G.towers[0].filter(t=>!t.dead).length+'　·　塔 '+G.towers[1].filter(t=>!t.dead).length,cx,38*u,11*u,'#9fb8ac','center','');
  txt('下一波 '+Math.max(0,Math.ceil(G.waveT))+'s',cx,58*u,12*u,'#c4d4c8','center','');
  // 英雄状态条
  G.heroes.forEach(h=>{
    const side=h.team===0?-1:1;const slot=h.team===0?(1-h.idx):h.idx; // 靠近中心的在内侧
    const bx=cx+side*(140*u+(h.idx)*62*u)+(side<0?-52*u:0),by=8*u;
    const col=TEAMS[h.team].col;
    ctx.globalAlpha=h.dead?.5:1;
    ctx.fillStyle='rgba(8,16,18,.82)';rr(bx,by,52*u,40*u,6);ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=2;ctx.stroke();
    ctx.font='900 '+22*u+'px '+SERIF;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=h.def.color;ctx.fillText(h.def.glyph,bx+19*u,by+17*u);
    txt('Lv'+h.level,bx+38*u,by+10*u,10*u,'#fff','center','');
    if(h.dead)txt(String(Math.ceil(h.deadT)),bx+26*u,by+22*u,16*u,'#ff8a7a','center');
    else bar(bx+4*u,by+33*u,44*u,4*u,h.hp/h.maxhp,col);
    ctx.globalAlpha=1;
  });
  // 左上提示
  txt('Esc 暂停 · P 商店 · 速度 ×'+G.speed+(AU.mute?' · 静音':''),12*u,16*u,12*u,'#9fb8ac','left','');
  // 击杀播报
  G.feed.forEach((f,i)=>{const y=(20+i*22)*u;const a=1-clamp((G.t-f.t-6)/3,0,1);ctx.globalAlpha=a;
    ctx.font='bold '+13*u+'px '+FONT;const s1=f.a,s2=' '+f.verb+' ',s3=f.b;
    const w1=ctx.measureText(s1).width,w2=ctx.measureText(s2).width,w3=ctx.measureText(s3).width;const tw=w1+w2+w3+14*u;let x=VW-tw-12*u;
    ctx.fillStyle='rgba(8,16,18,.7)';rr(x-4*u,y-10*u,tw,20*u,5);ctx.fill();x+=3*u;
    txt(s1,x,y,13*u,TEAMS[f.at].col,'left','bold ',false);txt(s2,x+w1,y,13*u,'#d8d0b0','left','bold ',false);txt(s3,x+w1+w2,y,13*u,TEAMS[f.bt].col,'left','bold ',false);ctx.globalAlpha=1});
  // ---- 底部面板 ----
  const pw=620*u,ph=112*u,px=VW/2-pw/2-70*u,py=VH-ph-8*u;
  ctx.fillStyle='rgba(8,16,18,.9)';rr(px,py,pw,ph,10);ctx.fill();ctx.strokeStyle='#7a6a40';ctx.lineWidth=2;ctx.stroke();
  // 头像
  const D=p.def;ctx.fillStyle=D.color;ctx.beginPath();ctx.arc(px+52*u,py+50*u,38*u,0,TAU);ctx.fill();ctx.strokeStyle=TEAMS[0].col;ctx.lineWidth=4;ctx.stroke();
  ctx.font='900 '+44*u+'px '+SERIF;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#10181c';ctx.fillText(D.glyph,px+52*u,py+53*u);
  ctx.fillStyle='rgba(0,0,0,.8)';rr(px+68*u,py+4*u,34*u,20*u,5);ctx.fill();txt('Lv'+p.level,px+85*u,py+14*u,13*u,'#ffe27a','center');
  // XP 条
  bar(px+14*u,py+96*u,76*u,5*u,p.level>=MAXLV?1:p.xp/XPN(p.level),'#b080ff');
  // 技能
  const isz=60*u,ix=px+112*u,iy=py+22*u;
  for(let i=0;i<4;i++){
    const ab=D.ab[i],x=ix+i*(isz+8*u),y=iy,r=p.ranks[i];
    iconBox(x,y,isz,r>0?D.color:'#4a4f52');
    ctx.font='900 '+30*u+'px '+SERIF;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=r>0?'#10181c':'#222';ctx.fillText(ab.n[0],x+isz/2,y+isz/2+2);
    if(r>0){const cdmax=ab.cd[r-1]*(1-p.cdr);if(p.cds[i]>0){ctx.fillStyle='rgba(0,0,0,.65)';const hh=isz*clamp(p.cds[i]/cdmax,0,1);ctx.fillRect(x,y,isz,hh);txt(p.cds[i]>=10?String(Math.ceil(p.cds[i])):p.cds[i].toFixed(1),x+isz/2,y+isz/2,18*u,'#fff','center')}
      else if(p.mana<ab.mana[r-1]){ctx.fillStyle='rgba(30,60,160,.55)';rr(x,y,isz,isz,7);ctx.fill()}}
    ctx.strokeStyle=(r>0&&p.cds[i]<=0&&p.mana>=ab.mana[Math.max(0,r-1)])?'#ffe9a0':'#555';ctx.lineWidth=2;rr(x,y,isz,isz,7);ctx.stroke();
    ctx.fillStyle='rgba(0,0,0,.8)';ctx.fillRect(x,y,17*u,16*u);txt(ab.key,x+8.5*u,y+8*u,12*u,'#fff','center');
    for(let k=0;k<(i===3?3:5);k++){ctx.fillStyle=k<r?'#ffe27a':'#333';ctx.fillRect(x+4*u+k*((isz-8*u)/(i===3?3:5)),y+isz+3*u,(isz-8*u)/(i===3?3:5)-3,4*u)}
    if(canLearn(p,i)){const bx=x+isz/2-12*u,by=y-26*u;ctx.fillStyle='#e8b040';rr(bx,by,24*u,22*u,5);ctx.fill();txt('+',bx+12*u,by+11*u,18*u,'#2a1a08','center',undefined,false);UIH.plus.push({x:bx,y:by,w:24*u,h:22*u,i})}
  }
  // 血蓝条
  const bx0=ix,bw=4*isz+24*u;
  bar(bx0,py+ph-20*u+0,bw,11*u,p.hp/p.maxhp,'#3fc15a');if(p.shield>0){ctx.fillStyle='rgba(255,255,255,.8)';ctx.fillRect(bx0,py+ph-20*u,bw*clamp(p.shield/p.maxhp,0,1),4*u)}
  txt(Math.ceil(p.hp)+' / '+Math.ceil(p.maxhp),bx0+bw/2,py+ph-14.5*u,10*u,'#fff','center','bold ',false);
  bar(bx0,py+ph-8*u,bw,6*u,p.mana/p.maxmana,'#3f8cf0');
  // 装备
  const sx0=ix+bw+14*u;
  for(let i=0;i<6;i++){const x=sx0+(i%3)*(40*u),y=py+18*u+((i/3)|0)*(40*u);ctx.fillStyle='rgba(40,56,58,.9)';rr(x,y,36*u,36*u,5);ctx.fill();ctx.strokeStyle='#5a5030';ctx.lineWidth=1;ctx.stroke();
    const id=p.items[i];if(id){const it=ITEMBYID[id];ctx.fillStyle='#c9a45a';rr(x+2,y+2,36*u-4,36*u-4,4);ctx.fill();txt(it.g,x+18*u,y+19*u,19*u,'#14201f','center','900 ',false)}}
  // 药水
  {const x=sx0+3*40*u+4*u,y=py+18*u,s=36*u;ctx.fillStyle='rgba(40,70,50,.9)';rr(x,y,s,s,5);ctx.fill();ctx.strokeStyle=p.potT>0?'#9bff9b':'#4a7a4a';ctx.lineWidth=1.5;ctx.stroke();txt('药',x+s/2,y+s/2-2*u,17*u,'#9bff9b','center','900 ',false);txt('×'+p.potions,x+s-3*u,y+s-5*u,11*u,'#fff','right');ctx.fillStyle='rgba(0,0,0,.8)';ctx.fillRect(x,y,12*u,13*u);txt('1',x+6*u,y+6.5*u,10*u,'#fff','center','bold ',false);UIH.potion={x,y,w:s,h:s}}
  txt('金 '+Math.floor(p.gold),sx0,py+ph-16*u,15*u,'#ffd95a','left');
  // 属性/战绩（左下角）
  const lx=12*u,ly=VH-98*u;ctx.fillStyle='rgba(8,16,18,.78)';rr(lx,ly-6*u,150*u,92*u,8);ctx.fill();
  const st=[['攻击',Math.round(p.ad)],['法强',Math.round(p.ap)],['护甲',Math.round(p.armor)],['魔抗',Math.round(p.mr)],['攻速',p.as.toFixed(2)],['移速',Math.round(curMs(p)||p.msBase)]];
  st.forEach((s,i)=>{const x=lx+8*u+(i%2)*72*u,y=ly+6*u+((i/2)|0)*15*u;txt(s[0],x,y,11*u,'#8fb0a4','left','',false);txt(String(s[1]),x+62*u,y,11*u,'#f0e8d0','right','bold ',false)});
  txt(p.k+' / '+p.d+' / '+p.a+'　补刀 '+p.cs,lx+8*u,ly+58*u,12*u,'#f4e4b0','left');
  txt(p.autoMsg||'',lx,ly-14*u,11*u,'#ffd0a0','left');
  // 回城条
  if(p.recall>0){const w=220*u,x=VW/2-w/2-70*u,y=py-34*u;bar(x,y,w,12*u,1-p.recall/5,'#a8e8ff');txt('回城中 '+p.recall.toFixed(1)+'s',x+w/2,y-12*u,13*u,'#e0f6ff','center')}
  // 提示
  if(G.hint&&G.t-G.hint.t<1.6){txt(G.hint.txt,VW/2-70*u,py-60*u,16*u,'#ffb090','center')}
  else if(inBase(p)&&!p.dead&&!shopOpen&&(p.gold>=300||p.items.length===0)&&Math.sin(G.t*5)>-.4)txt('按 P 打开商店',VW/2-70*u,py-24*u-(p.recall>0?20:0),16*u,'#ffe9a0','center');
  if(p.sp>0&&!G.auto&&!p.dead)txt('有可学习的技能：点击 + 或 Shift+QWER',VW/2-70*u,py-48*u,13*u,'#ffe27a','center');
  if(G.t<16&&!G.paused){const a=G.t<13?1:(16-G.t)/3;ctx.globalAlpha=a;const lines=['右键：移动 / 攻击　　Q W E R：朝鼠标方向施法　　A + 左键：攻击移动','B：回城　　P：商店（基地内购买）　　1：喝药　　空格：镜头回正　　Tab：战绩','提示：补刀（亲手击杀小兵）能拿到金币；防御塔会优先攻击小兵——带着小兵推塔！'];
    ctx.fillStyle='rgba(8,16,18,.7)';rr(VW/2-330*u,VH*.3,660*u,78*u,8);ctx.fill();lines.forEach((s,i)=>txt(s,VW/2,VH*.3+16*u+i*22*u,13*u,i===2?'#ffe9a0':'#d8e4d8','center','',false));ctx.globalAlpha=1}
  // 横幅
  G.banners.forEach((b,i)=>{const a=b.t<.2?b.t/.2:b.t>2.6?(3.2-b.t)/.6:1;ctx.globalAlpha=Math.max(0,a);txt(b.txt,VW/2,(VH*.2+i*34*u)+(1-Math.min(1,b.t*6))*-10,24*u,b.col,'center');ctx.globalAlpha=1});
  // 死亡
  if(p.dead){ctx.fillStyle='rgba(20,30,34,.45)';ctx.fillRect(0,0,VW,VH);txt('已阵亡',VW/2,VH*.38,34*u,'#ff9a86','center');txt('复活倒计时 '+Math.ceil(p.deadT)+' 秒　（可按 P 购买装备）',VW/2,VH*.38+44*u,18*u,'#f4e4b0','center')}
  drawMinimap();
  // Tab 战绩
  if(KEYS.Tab)drawScoreboard();
}
function drawScoreboard(){
  const u=UI,w=640*u,x=VW/2-w/2,y=VH*.2,hh=190*u;
  ctx.fillStyle='rgba(8,16,18,.92)';rr(x,y,w,hh,10);ctx.fill();ctx.strokeStyle='#7a6a40';ctx.lineWidth=2;ctx.stroke();
  const cols=['英雄','等级','击杀/死亡/助攻','补刀','金币','英雄伤害','装备'],cx=[16,150,200,330,390,460,540];
  cols.forEach((c,i)=>txt(c,x+cx[i]*u,y+20*u,12*u,'#9cb','left','',false));
  G.heroes.forEach((h,i)=>{const yy=y+(54+i*34)*u;txt(h.name+(h===G.player?'（你）':''),x+16*u,yy,14*u,TEAMS[h.team].col,'left');txt(String(h.level),x+150*u,yy,14*u,'#fff','left');txt(h.k+' / '+h.d+' / '+h.a,x+200*u,yy,14*u,'#fff','left');txt(String(h.cs),x+330*u,yy,14*u,'#fff','left');txt(String(Math.floor(h.gold)),x+390*u,yy,14*u,'#ffd95a','left');txt(String(Math.round(h.dmgDealt)),x+460*u,yy,14*u,'#fff','left');
    txt(h.items.map(id=>ITEMBYID[id].g).join(' '),x+540*u,yy,14*u,'#e8d9a0','left','',false)});
}
function render(dt){
  if(!G)return;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  if(mode==='menu'){ctx.fillStyle='#07100f';ctx.fillRect(0,0,VW,VH);return}
  const c=G.cam,p=G.player;
  // 摄像机
  if(G.over&&c.focus){c.x+=(c.focus.x-c.x)*Math.min(1,dt*3);c.y+=(c.focus.y-c.y)*Math.min(1,dt*3)}
  else{
    const tx=(p.dead&&c.deadX!==undefined?c.deadX:p.x)+c.ox,ty=(p.dead&&c.deadY!==undefined?c.deadY:p.y)+c.oy;
    const k=Math.min(1,dt*12);c.x+=(tx-c.x)*k;c.y+=(ty-c.y)*k;
  }
  {const hw=Math.min(W/2,VW/2/Z),hh=Math.min(H/2,VH/2/Z);c.x=clamp(c.x,hw,W-hw);c.y=clamp(c.y,hh,H-hh)}
  AU.camX=c.x;AU.camY=c.y;
  for(let i=G.marks.length-1;i>=0;i--){G.marks[i].t+=dt;if(G.marks[i].t>.5)G.marks.splice(i,1)}
  const wp=s2w(MOUSE.x,MOUSE.y);MOUSE.wx=wp.x;MOUSE.wy=wp.y;
  drawWorld();drawHUD(dt);
}
