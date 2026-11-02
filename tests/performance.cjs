const {boot}=require('./runtime-harness.cjs'),assert=require('node:assert/strict');
const extra=`WorldGrid,enemyField,orbField,projectileCandidates,nearestEnemyEntries,segmentDistance,updateOrbField,spawnOrb,updateInterface,suspendGame,PERF_STEP,
 backgroundTiles,bodySprites,resetFrame:()=>{lastTime=0;perfAccumulator=0;perfRenderClock=0;perfHudClock=0;perfDirty=false;},
 drops:()=>({bloodThisRun,xp:player.xp,charge:player.bloodCharge}),`;
let seed=71;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const near=(a,b)=>assert(Math.abs(a-b)<1e-7*Math.max(1,Math.abs(b)),`${a} != ${b}`);
(async()=>{
 const {a,sandbox,counters}=boot({api:extra,measure:true});await new Promise(r=>setImmediate(r));
 a.setup();const live=a.get().enemies;for(let i=0;i<260;i++)live.push({id:i+1000,type:'ant',x:random()*3600,y:random()*2600,radius:5+random()*100,hp:1,maxHp:1});a.enemyField.invalidate();
 for(let i=0;i<500;i++){
  const pr={x:random()*3600,y:random()*2600,radius:1+random()*15},x0=pr.x+(random()-.5)*500,y0=pr.y+(random()-.5)*500;
  const actual=a.projectileCandidates(pr,x0,y0).filter(e=>a.segmentDistance(e.x,e.y,x0,y0,pr.x,pr.y)<e.radius+pr.radius).map(e=>e.id).sort();
  const expected=live.filter(e=>!e.dead&&a.segmentDistance(e.x,e.y,x0,y0,pr.x,pr.y)<e.radius+pr.radius).map(e=>e.id).sort();assert.deepEqual(actual,expected);
 }
 for(let i=0;i<live.length;i++){const e=live[i];e.x=random()*3600;e.y=random()*2600;if(i%7===0){e.dead=true;a.enemyField.remove(e);}else a.enemyField.move(e);}
 assert.equal(a.enemyField.population(),live.filter(e=>!e.dead).length);
 for(let i=0;i<200;i++){
  const x=random()*3600,y=random()*2600,r=10+random()*500;
  const expected=live.filter(e=>!e.dead&&((e.x-x)**2+(e.y-y)**2)<=r*r).sort((a,b)=>(a.x-x)**2+(a.y-y)**2-((b.x-x)**2+(b.y-y)**2)||a.id-b.id).slice(0,5).map(e=>e.id);
  const actual=a.nearestEnemyEntries(x,y,r,5).map(o=>o.e.id);assert.deepEqual(actual,expected);
 }
 // Nearby broad-phase work stays local, not proportional to the full world population.
 a.enemyField.visits=0;for(let i=0;i<100;i++)a.projectileCandidates({x:1810,y:1310,radius:6},1800,1300);assert(a.enemyField.visits<live.length*100*.2);
 // Drops keep every unit of Blood, XP and charge. Far settled drops do not enter the pickup loop.
 a.setup();let total=0;for(let i=0;i<5000;i++){a.spawnOrb(50+i%90,50+i%80,2,'normal',1);const o=a.get().orbs.at(-1);o.vx=o.vy=0;o.chargeValue=1;total+=o.value;}
 a.spawnOrb(a.get().player.x,a.get().player.y,7,'normal',3);let o=a.get().orbs.at(-1);o.vx=o.vy=0;o.chargeValue=2;
 const before=a.drops();a.updateOrbField(1/60);const after=a.drops();assert.equal(after.bloodThisRun-before.bloodThisRun,7);assert.equal(after.xp-before.xp,3);assert.equal(after.charge-before.charge,2);assert.equal(a.get().orbs.length,5000);assert.equal(a.get().orbs.reduce((n,o)=>n+o.value,0),total);
 a.orbField.visits=0;for(let i=0;i<60;i++)a.updateOrbField(1/60);assert.equal(a.orbField.visits,0);
 // Two cameras/biomes populate bounded caches; warm frames reuse graphics.
 a.setup();for(let i=0;i<100;i++)a.spawnEnemy('ant',{x:1600+i%10*25,y:1200+Math.floor(i/10)*25});a.render();
 counters.geometry=0;a.render();const warmGeometry=counters.geometry;assert(warmGeometry<3000);assert(a.backgroundTiles.size<=20);assert(a.bodySprites.size<=128);
 // Fixed HUD cadence avoids rewriting DOM on every render frame.
 a.resetFrame();counters.dom=0;for(let i=0;i<60;i++)a.updateInterface(1/60);const throttled=counters.dom;
 counters.dom=0;for(let i=0;i<60;i++)a.updateInterface(1/60,true);assert(throttled<counters.dom/4);
 // Simulation is 60 Hz at both 30/60 render rates, and never runs while hidden.
 for(const [width,height,dprLimit]of [[1280,800,2],[390,844,1.25]]){
  sandbox.window.innerWidth=width;sandbox.window.innerHeight=height;a.resize();assert(a.get().DPR<=dprLimit);a.setup();a.resetFrame();const initial=a.get().elapsed;
  for(let frame=1;frame<=120;frame++)a.loop(frame*1000/120);near(a.get().elapsed-initial,1);
 }
 const time=a.get().elapsed;sandbox.document.hidden=true;a.suspendGame();assert.equal(a.get().state,'paused');for(let frame=121;frame<140;frame++)a.loop(frame*1000/120);near(a.get().elapsed,time);sandbox.document.hidden=false;
 console.log('PASS: 500 swept-collision oracles, 200 moved/dead nearest-target oracles, spatial visit reduction, 5,000 sleeping drops with exact rewards, warm/bounded graphics caches, DPR limits, fixed simulation across refresh rates and hidden-tab pause.');
})().catch(e=>{console.error(e.message,e.stack?.split('\n').filter(x=>x.startsWith('    at ')).slice(0,4).join('\n'));process.exit(1);});
