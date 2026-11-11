'use strict';
window.__err=[];
window.addEventListener('error',e=>{window.__err.push(String(e.message)+' @'+e.lineno)});
const TAU=Math.PI*2;
const $=id=>document.getElementById(id);
const rnd=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const rint=(a,b)=>Math.floor(rnd(a,b+1));
const FONT='"Microsoft YaHei","PingFang SC","Noto Sans CJK SC","Source Han Sans SC",sans-serif';
const SERIF='"Noto Serif CJK SC","Songti SC","STKaiti","KaiTi",serif';
function fmtT(t){t=Math.max(0,t|0);return String((t/60)|0).padStart(2,'0')+':'+String(t%60).padStart(2,'0')}

/* ---------- 音频（全部合成） ---------- */
const AU={ctx:null,master:null,mute:false,camX:0,camY:0,lastPlay:{},musicT:0};
function auInit(){
  if(AU.ctx)return;
  try{AU.ctx=new (window.AudioContext||window.webkitAudioContext)();AU.master=AU.ctx.createGain();AU.master.gain.value=.55;
  const comp=AU.ctx.createDynamicsCompressor();AU.master.connect(comp);comp.connect(AU.ctx.destination);
  const len=AU.ctx.sampleRate*1;AU.nbuf=AU.ctx.createBuffer(1,len,AU.ctx.sampleRate);const d=AU.nbuf.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;}catch(e){AU.ctx=null}
}
function tone(f,dur,type,vol,slide,delay){
  if(!AU.ctx||AU.mute)return;const c=AU.ctx,t=c.currentTime+(delay||0);
  const o=c.createOscillator(),g=c.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);
  if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,f*slide),t+dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g);g.connect(AU.master);o.start(t);o.stop(t+dur+.02);
}
function noise(dur,vol,fq,q,type,delay,slide){
  if(!AU.ctx||AU.mute)return;const c=AU.ctx,t=c.currentTime+(delay||0);
  const s=c.createBufferSource();s.buffer=AU.nbuf;const f=c.createBiquadFilter();f.type=type||'bandpass';f.frequency.setValueAtTime(fq,t);
  if(slide)f.frequency.exponentialRampToValueAtTime(Math.max(40,fq*slide),t+dur);f.Q.value=q||1;
  const g=c.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  s.connect(f);f.connect(g);g.connect(AU.master);s.start(t,Math.random()*.5);s.stop(t+dur+.02);
}
const SFX={
  hit:v=>{noise(.09,.28*v,1400,1.2);tone(180,.08,'triangle',.18*v,.5)},
  slash:v=>{noise(.14,.22*v,2600,.8,'bandpass',0,.3);tone(300,.1,'triangle',.08*v,.5)},
  shoot:v=>{tone(900,.1,'triangle',.12*v,.4);noise(.07,.1*v,3500,1)},
  bolt:v=>{tone(520,.16,'sawtooth',.12*v,.35);noise(.1,.1*v,1800,2)},
  tower:v=>{tone(220,.22,'square',.14*v,.4);tone(660,.1,'sine',.1*v,.5);noise(.15,.12*v,900,1)},
  coin:v=>{tone(1320,.09,'square',.1*v);tone(1760,.2,'square',.1*v,1,.07)},
  levelup:v=>{[523,659,784,1047].forEach((f,i)=>tone(f,.35,'triangle',.18,1,i*.08))},
  castQ:v=>{tone(420,.2,'sawtooth',.14*v,2.2);noise(.15,.12*v,1500,1.5,'bandpass',0,2)},
  castW:v=>{tone(300,.35,'sine',.2*v,2.5);tone(450,.35,'sine',.12*v,2.5)},
  castE:v=>{noise(.3,.2*v,700,1.5,'bandpass',0,3);tone(200,.3,'triangle',.15*v,1.8)},
  castR:v=>{tone(110,.7,'sawtooth',.2*v,3);noise(.5,.2*v,500,1,'bandpass',0,4);tone(880,.5,'sine',.1*v,.5,.1)},
  boom:v=>{noise(.5,.5*v,260,.6,'lowpass',0,.3);tone(70,.45,'sine',.4*v,.4)},
  kill:v=>{tone(392,.15,'square',.12);tone(523,.15,'square',.12,1,.09);tone(784,.3,'square',.13,1,.18)},
  death:v=>{tone(300,.5,'sawtooth',.18,.35);tone(150,.6,'sine',.2,.4)},
  buy:v=>{tone(880,.08,'square',.1);tone(1175,.12,'square',.1,1,.06)},
  click:v=>{tone(700,.05,'square',.07)},
  recall:v=>{tone(500,.8,'sine',.1,2);tone(750,.8,'sine',.07,2)},
  tpend:v=>{tone(1200,.3,'sine',.15,.4);noise(.3,.15,3000,1)},
  nexus:v=>{noise(1.4,.7,300,.5,'lowpass',0,.15);tone(60,1.2,'sine',.5,.3)},
  victory:v=>{[523,659,784,1047,1319,1568].forEach((f,i)=>tone(f,.6,'triangle',.2,1,i*.14))},
  defeat:v=>{[392,349,311,262].forEach((f,i)=>tone(f,.8,'triangle',.2,.97,i*.3))},
  warn:v=>{tone(260,.2,'square',.1);tone(200,.25,'square',.1,1,.15)},
  stun:v=>{tone(1400,.12,'square',.08*v,.6)},
};
function sfx(n,x,y){
  if(!AU.ctx||AU.mute)return;let v=1;
  if(x!==undefined){const d=Math.hypot(x-AU.camX,y-AU.camY);v=clamp(1.15-d/1500,0,1);if(v<.06)return}
  const now=AU.ctx.currentTime;if(AU.lastPlay[n]&&now-AU.lastPlay[n]<.035)return;AU.lastPlay[n]=now;
  SFX[n]&&SFX[n](v);
}
const PENTA=[0,2,4,7,9,12,14,16];
function musicTick(dt){ // 极轻的五声音阶古筝音色
  if(!AU.ctx||AU.mute)return;AU.musicT-=dt;if(AU.musicT>0)return;AU.musicT=rnd(.45,1.1);
  if(Math.random()<.25)return;const f=220*Math.pow(2,PENTA[rint(0,7)]/12);
  tone(f,1.6,'triangle',.035,.995);tone(f*2,.8,'sine',.012);
}

/* ---------- 地图 ---------- */
const W=6400,H=2800,WALK=370,ROAD=135,BASE_R=540;
const PATH=[[620,2200],[1500,2200],[2350,1850],[3200,1400],[4050,950],[4900,600],[5780,600]];
const SEGL=[],CUM=[0];let PL=0;
for(let i=0;i<PATH.length-1;i++){const l=Math.hypot(PATH[i+1][0]-PATH[i][0],PATH[i+1][1]-PATH[i][1]);SEGL.push(l);PL+=l;CUM.push(PL)}
function posAt(s){
  s=clamp(s,0,PL);let i=0;while(i<SEGL.length-1&&s>CUM[i+1])i++;
  const t=(s-CUM[i])/SEGL[i];return [lerp(PATH[i][0],PATH[i+1][0],t),lerp(PATH[i][1],PATH[i+1][1],t)];
}
function nearPath(x,y){
  let bd=1e9,bs=0,bx=0,by=0;
  for(let i=0;i<SEGL.length;i++){
    const ax=PATH[i][0],ay=PATH[i][1],dx=PATH[i+1][0]-ax,dy=PATH[i+1][1]-ay;
    const t=clamp(((x-ax)*dx+(y-ay)*dy)/(SEGL[i]*SEGL[i]),0,1);const px=ax+dx*t,py=ay+dy*t;
    const d=Math.hypot(x-px,y-py);if(d<bd){bd=d;bs=CUM[i]+t*SEGL[i];bx=px;by=py}
  }
  return {s:bs,d:bd,x:bx,y:by};
}
const NEXUS_POS=[{x:PATH[0][0],y:PATH[0][1]},{x:PATH[PATH.length-1][0],y:PATH[PATH.length-1][1]}];
function clampWalk(u){
  const n0=NEXUS_POS[0],n1=NEXUS_POS[1];
  if(Math.hypot(u.x-n0.x,u.y-n0.y)<BASE_R-10||Math.hypot(u.x-n1.x,u.y-n1.y)<BASE_R-10)return;
  const p=nearPath(u.x,u.y);
  if(p.d>WALK){const k=WALK/p.d;u.x=p.x+(u.x-p.x)*k;u.y=p.y+(u.y-p.y)*k}
}
function walkPoint(x,y){const u={x,y};clampWalk(u);return u}
const fwd=t=>t===0?1:-1;
/* 地形预渲染 */
let BG=null;const BGS=.55;
function srng(seed){let s=seed;return()=>{s=(s*16807)%2147483647;return s/2147483647}}
function buildBG(){
  const cv=document.createElement('canvas');cv.width=W*BGS;cv.height=H*BGS;const g=cv.getContext('2d');g.scale(BGS,BGS);
  const R=srng(7);
  g.fillStyle='#0b1514';g.fillRect(0,0,W,H);
  // 远处雾状色块
  for(let i=0;i<60;i++){const x=R()*W,y=R()*H,r=200+R()*400;const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(30,60,56,.28)');gr.addColorStop(1,'rgba(30,60,56,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2)}
  // 外围树林
  for(let i=0;i<5200;i++){
    const x=R()*W,y=R()*H;const p=nearPath(x,y);
    if(p.d<WALK+30||Math.hypot(x-NEXUS_POS[0].x,y-NEXUS_POS[0].y)<BASE_R+30||Math.hypot(x-NEXUS_POS[1].x,y-NEXUS_POS[1].y)<BASE_R+30)continue;
    const r=18+R()*34;const c=R();
    g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.arc(x+6,y+8,r,0,TAU);g.fill();
    g.fillStyle=c<.5?'#12261d':c<.8?'#17301f':'#1d3a26';g.beginPath();g.arc(x,y,r,0,TAU);g.fill();
    g.fillStyle='rgba(120,190,120,.10)';g.beginPath();g.arc(x-r*.25,y-r*.3,r*.55,0,TAU);g.fill();
  }
  // 可走区域：草地渐变边缘
  g.lineCap='round';g.lineJoin='round';
  function strokePath(w,col){g.strokeStyle=col;g.lineWidth=w;g.beginPath();g.moveTo(PATH[0][0],PATH[0][1]);for(let i=1;i<PATH.length;i++)g.lineTo(PATH[i][0],PATH[i][1]);g.stroke()}
  strokePath(WALK*2+50,'rgba(20,44,32,.55)');strokePath(WALK*2+20,'rgba(30,58,40,.8)');strokePath(WALK*2-6,'#28463a');
  strokePath(WALK*1.5,'#2d4d3c');strokePath(WALK*1.0,'#33563f');
  // 草丛纹理
  for(let i=0;i<9000;i++){
    const x=R()*W,y=R()*H;const p=nearPath(x,y);if(p.d>WALK-8)continue;
    g.strokeStyle=R()<.5?'rgba(120,180,110,.20)':'rgba(10,30,20,.25)';g.lineWidth=2;g.beginPath();g.moveTo(x,y);g.lineTo(x+rnd2(R,-5,5),y-5-R()*9);g.stroke();
  }
  // 野花
  for(let i=0;i<500;i++){const x=R()*W,y=R()*H;const p=nearPath(x,y);if(p.d>WALK-20||p.d<ROAD+30)continue;g.fillStyle=['#e7c8d6','#f1e3a0','#c9d9f2'][(R()*3)|0];g.globalAlpha=.7;g.beginPath();g.arc(x,y,3,0,TAU);g.fill();g.globalAlpha=1}
  // 基地庭院
  for(const [k,n] of NEXUS_POS.entries()){
    const tint=k===0?'60,150,170':'180,80,60';
    let gr=g.createRadialGradient(n.x,n.y,0,n.x,n.y,BASE_R);gr.addColorStop(0,'#5f6a5e');gr.addColorStop(.75,'#4b5a4d');gr.addColorStop(.95,'#33463a');gr.addColorStop(1,'rgba(40,70,52,0)');
    g.fillStyle=gr;g.beginPath();g.arc(n.x,n.y,BASE_R,0,TAU);g.fill();
    gr=g.createRadialGradient(n.x,n.y,40,n.x,n.y,BASE_R*.8);gr.addColorStop(0,'rgba('+tint+',.35)');gr.addColorStop(1,'rgba('+tint+',0)');g.fillStyle=gr;g.beginPath();g.arc(n.x,n.y,BASE_R,0,TAU);g.fill();
    g.strokeStyle='rgba('+tint+',.5)';g.lineWidth=5;g.beginPath();g.arc(n.x,n.y,BASE_R*.55,0,TAU);g.stroke();g.lineWidth=2;g.beginPath();g.arc(n.x,n.y,BASE_R*.42,0,TAU);g.stroke();
    for(let i=0;i<8;i++){const a=i*TAU/8;g.beginPath();g.moveTo(n.x+Math.cos(a)*BASE_R*.42,n.y+Math.sin(a)*BASE_R*.42);g.lineTo(n.x+Math.cos(a)*BASE_R*.55,n.y+Math.sin(a)*BASE_R*.55);g.stroke()}
    // 石砖
    for(let i=0;i<260;i++){const a=R()*TAU,r=Math.sqrt(R())*BASE_R*.92;g.fillStyle='rgba(0,0,0,.10)';g.fillRect(n.x+Math.cos(a)*r,n.y+Math.sin(a)*r,10+R()*14,6+R()*8)}
  }
  // 兵道
  strokePath(ROAD*2+36,'rgba(10,20,14,.35)');strokePath(ROAD*2+10,'#4e4838');strokePath(ROAD*2-8,'#7a7058');strokePath(ROAD*2-50,'#85795f');
  for(let i=0;i<5200;i++){
    const s=R()*PL;const q=posAt(s);const x=q[0]+rnd2(R,-ROAD,ROAD)*.95,y=q[1]+rnd2(R,-ROAD,ROAD)*.95;const p=nearPath(x,y);if(p.d>ROAD-12)continue;
    g.fillStyle=R()<.5?'rgba(0,0,0,.10)':'rgba(255,240,200,.07)';g.fillRect(x,y,8+R()*16,5+R()*8);
  }
  // 中线标记
  {const m=posAt(PL/2);g.strokeStyle='rgba(240,210,140,.35)';g.lineWidth=3;g.beginPath();g.arc(m[0],m[1],64,0,TAU);g.stroke();g.beginPath();g.arc(m[0],m[1],36,0,TAU);g.stroke()}
  // 灯笼
  for(let s=260,i=0;s<PL-200;s+=210,i++){
    const q=posAt(s),q2=posAt(s+20);const a=Math.atan2(q2[1]-q[1],q2[0]-q[0])+Math.PI/2*(i%2?1:-1);
    const x=q[0]+Math.cos(a)*(ROAD+55),y=q[1]+Math.sin(a)*(ROAD+55);
    const gr=g.createRadialGradient(x,y,0,x,y,95);gr.addColorStop(0,'rgba(255,170,70,.55)');gr.addColorStop(1,'rgba(255,170,70,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,95,0,TAU);g.fill();
    g.fillStyle='#3a2418';g.fillRect(x-3,y-3,6,14);g.fillStyle='#ee6a3a';g.beginPath();g.ellipse(x,y-4,9,11,0,0,TAU);g.fill();g.fillStyle='#ffd27a';g.beginPath();g.ellipse(x,y-4,4,6,0,0,TAU);g.fill();
  }
  // 竹子装饰 / 岩石在走廊边缘
  for(let i=0;i<260;i++){
    const x=R()*W,y=R()*H;const p=nearPath(x,y);if(p.d<WALK-70||p.d>WALK-10)continue;
    g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(x+4,y+6,18,10,0,0,TAU);g.fill();g.fillStyle=R()<.5?'#556560':'#4a5853';g.beginPath();g.ellipse(x,y,16,11,R()*3,0,TAU);g.fill();g.fillStyle='rgba(255,255,255,.12)';g.beginPath();g.ellipse(x-4,y-3,8,4,0,0,TAU);g.fill();
  }
  BG=cv;
}
function rnd2(R,a,b){return a+R()*(b-a)}
