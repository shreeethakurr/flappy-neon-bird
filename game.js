(()=>{
"use strict";
const canvas=document.querySelector("#game"),ctx=canvas.getContext("2d");
const W=480,H=720,$=s=>document.querySelector(s);
let state="menu",last=0,score=0,best=+localStorage.getItem("flappyNeonBest")||0;
let bird,pipes,particles,stars,groundOffset=0,pipeTimer=0,shake=0,audio;
const gravity=1350,flapPower=-430,pipeSpeed=185,pipeGap=172;

function init(){
 bird={x:125,y:H/2,vy:0,r:16,rot:0};
 pipes=[];particles=[];pipeTimer=0;score=0;shake=0;
 stars=Array.from({length:70},()=>({x:Math.random()*W,y:Math.random()*(H-90),r:Math.random()*1.7+.3,s:Math.random()*18+5,a:Math.random()}));
 updateHud();
}
function start(){
 init();state="playing";$("#menu").classList.add("hidden");$("#gameover").classList.add("hidden");
 $("#pauseScreen").classList.add("hidden");$("#hud").classList.remove("hidden");last=performance.now();flap();
}
function gameOver(){
 if(state!=="playing")return;
 state="over";shake=12;burst(bird.x,bird.y,"#ff477e",35);sfx(90,.25,"sawtooth",.035);
 if(score>best){best=score;localStorage.setItem("flappyNeonBest",best);toast("NEW BEST SCORE");}
 $("#finalScore").textContent=score;$("#finalBest").textContent=best;
 $("#hud").classList.add("hidden");$("#gameover").classList.remove("hidden");
}
function pause(){if(state==="playing"){state="paused";$("#pauseScreen").classList.remove("hidden")}}
function resume(){if(state==="paused"){state="playing";$("#pauseScreen").classList.add("hidden");last=performance.now()}}
function flap(){
 if(state==="menu"){start();return}
 if(state!=="playing")return;
 bird.vy=flapPower;bird.rot=-.45;burst(bird.x-8,bird.y+5,"#42f5ff",5);sfx(620,.055,"square",.018);
}
function spawnPipe(){
 const margin=105;
 const top=rand(70,H-90-pipeGap);
 pipes.push({x:W+35,top,gap:pipeGap,passed:false});
}
function update(dt){
 if(state!=="playing")return;
 bird.vy+=gravity*dt;bird.y+=bird.vy*dt;
 bird.rot=Math.min(.9,bird.rot+2.6*dt);
 groundOffset=(groundOffset+pipeSpeed*dt)%32;
 pipeTimer-=dt;
 if(pipeTimer<=0){spawnPipe();pipeTimer=Math.max(.95,1.35-score*.012)}
 pipes.forEach(p=>p.x-=pipeSpeed*dt*(1+Math.min(.55,score*.006)));
 for(let i=pipes.length-1;i>=0;i--){
   const p=pipes[i];
   if(!p.passed&&p.x+58<bird.x){p.passed=true;score++;updateHud();burst(bird.x,H/2,"#ffe45c",8);sfx(850,.06,"sine",.018)}
   if(p.x<-80)pipes.splice(i,1);
 }
 if(bird.y-bird.r<0||bird.y+bird.r>H-55)return gameOver();
 for(const p of pipes){
   if(circleRect(bird.x,bird.y,bird.r,p.x,0,58,p.top)||circleRect(bird.x,bird.y,bird.r,p.x,p.top+p.gap,58,H-55-(p.top+p.gap)))return gameOver();
 }
 particles.forEach(x=>{x.x+=x.vx*dt;x.y+=x.vy*dt;x.vy+=400*dt;x.life-=dt});
 particles=particles.filter(x=>x.life>0);
 stars.forEach(s=>{s.x-=s.s*dt;if(s.x<0)s.x=W;s.a+=dt});
}
function circleRect(cx,cy,r,rx,ry,rw,rh){
 const x=Math.max(rx,Math.min(cx,rx+rw)),y=Math.max(ry,Math.min(cy,ry+rh));
 return (cx-x)**2+(cy-y)**2<r*r;
}
function draw(){
 ctx.save();
 if(shake>0){ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);shake*=.88}
 const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,"#05091b");bg.addColorStop(.55,"#07162a");bg.addColorStop(1,"#03101a");
 ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
 drawStars();drawCity();
 pipes.forEach(drawPipe);
 drawParticles();
 drawBird();
 drawGround();
 ctx.restore();
}
function drawStars(){
 stars.forEach(s=>{ctx.globalAlpha=.35+.35*Math.sin(s.a);ctx.fillStyle="#bcecff";ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill()});ctx.globalAlpha=1;
}
function drawCity(){
 for(let i=0;i<18;i++){
  const x=i*32-(groundOffset*.25),h=50+(i*37)%110;
  ctx.fillStyle="#06121f";ctx.fillRect(x,H-55-h,27,h);
  ctx.fillStyle="#0c2a3a";
  for(let y=H-45-h;y<H-62;y+=14)if((i+y)%3)ctx.fillRect(x+6,y,3,4);
 }
}
function drawPipe(p){
 const w=58;
 ctx.shadowBlur=18;ctx.shadowColor="#16e6ff";
 const grad=ctx.createLinearGradient(p.x,0,p.x+w,0);grad.addColorStop(0,"#0c5367");grad.addColorStop(.5,"#24dff1");grad.addColorStop(1,"#083e51");
 ctx.fillStyle=grad;
 ctx.fillRect(p.x,0,w,p.top-13);ctx.fillRect(p.x,p.top+p.gap+13,w,H-55-(p.top+p.gap+13));
 ctx.fillStyle="#62f6ff";ctx.fillRect(p.x-5,p.top-13,w+10,13);ctx.fillRect(p.x-5,p.top+p.gap,w+10,13);
 ctx.shadowBlur=0;
}
function drawBird(){
 ctx.save();ctx.translate(bird.x,bird.y);ctx.rotate(bird.rot);
 ctx.shadowBlur=22;ctx.shadowColor="#42f5ff";
 ctx.fillStyle="#42f5ff";ctx.beginPath();ctx.arc(0,0,bird.r,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#0a1825";ctx.beginPath();ctx.ellipse(-5,4,11,6,-.4,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(7,-6,5,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#07111a";ctx.beginPath();ctx.arc(8,-6,2,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#ffdd55";ctx.beginPath();ctx.moveTo(13,0);ctx.lineTo(25,4);ctx.lineTo(13,7);ctx.closePath();ctx.fill();
 ctx.restore();
}
function drawGround(){
 ctx.fillStyle="#031019";ctx.fillRect(0,H-55,W,55);
 ctx.strokeStyle="#42f5ff";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,H-55);ctx.lineTo(W,H-55);ctx.stroke();
 ctx.strokeStyle="#0b3948";ctx.lineWidth=1;
 for(let x=-32;x<W+32;x+=32){ctx.beginPath();ctx.moveTo(x-groundOffset,H-55);ctx.lineTo(x+12-groundOffset,H);ctx.stroke()}
}
function drawParticles(){
 particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life/.8);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill()});ctx.globalAlpha=1;
}
function burst(x,y,color,n){
 for(let i=0;i<n;i++){let a=Math.random()*Math.PI*2,s=40+Math.random()*170;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,r:1+Math.random()*3,life:.35+Math.random()*.45,color})}
}
function rand(a,b){return Math.random()*(b-a)+a}
function updateHud(){$("#score").textContent=score;$("#best").textContent="BEST "+best}
function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),1400)}
function sfx(f,d,t="square",v=.015){try{audio||=new(window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.type=t;o.frequency.value=f;g.gain.value=v;o.connect(g);g.connect(audio.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+d);o.stop(audio.currentTime+d)}catch{}}

function loop(t){const dt=Math.min(.033,(t-last)/1000);last=t;update(dt);draw();requestAnimationFrame(loop)}
window.addEventListener("keydown",e=>{
 if([" ","ArrowUp","ArrowDown"].includes(e.key))e.preventDefault();
 if(e.key===" "||e.key==="ArrowUp")flap();
 if(e.key.toLowerCase()==="p"||e.key==="Escape"){state==="playing"?pause():state==="paused"&&resume()}
});
canvas.addEventListener("mousedown",()=>flap());
canvas.addEventListener("touchstart",e=>{e.preventDefault();flap()},{passive:false});
$("#start").onclick=start;$("#again").onclick=start;$("#resume").onclick=resume;$("#restart").onclick=start;
$("#pause").onclick=pause;$("#home").onclick=()=>{state="menu";$("#gameover").classList.add("hidden");$("#hud").classList.add("hidden");$("#menu").classList.remove("hidden")};
init();last=performance.now();requestAnimationFrame(loop);
})();