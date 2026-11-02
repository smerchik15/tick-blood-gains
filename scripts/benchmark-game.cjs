const {boot}=require('../tests/runtime-harness.cjs'),fs=require('node:fs'),path=require('node:path'),{performance}=require('node:perf_hooks');
const fixture=`fixture:(n,shots,drops,dense)=>{
 const p=player;p.attackTimer=1e9;p.explosive=true;p.splashMult=.3;p.splashRadius=70;
 for(let i=0;i<n;i++){const angle=i*2.399963,ring=Math.sqrt((i+1)/n);spawnEnemy(['ant','mosquito','flea','spider'][i%4],{x:dense?p.x+Math.cos(angle)*ring*520:200+i%26*120,y:dense?p.y+Math.sin(angle)*ring*300:200+Math.floor(i/26)*210});const e=enemies.at(-1);e.hp=e.maxHp=1e7;}
 for(let i=0;i<shots;i++){const angle=i*2.399963;playerProjectiles.push({x:p.x+Math.cos(angle)*150,y:p.y+Math.sin(angle)*100,vx:Math.cos(angle)*220,vy:Math.sin(angle)*220,radius:6,dmg:4,life:10,travelLeft:3000,hitIds:[],pierceLeft:999,bouncesLeft:0,damageType:'physical'});}
 for(let i=0;i<drops;i++){spawnOrb(30+i%100*3,30+Math.floor(i/100)*3,1,'normal',1);const o=orbs.at(-1);o.vx=o.vy=0;}
},`;
const percentile=(x,p)=>[...x].sort((a,b)=>a-b)[Math.floor((x.length-1)*p)];
async function measure(html,scenario){
 const {a,counters,sandbox}=boot({html,api:fixture,measure:true});await new Promise(r=>setImmediate(r));
 let seed=71;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};sandbox.Math=math;
 a.setup();a.fixture(...scenario);for(let i=0;i<15;i++){a.update(1/60);a.render();}
 const times=[],updates=[],renders=[];counters.draw=counters.geometry=0;
 for(let i=0;i<120;i++){const start=performance.now();a.update(1/60);const mid=performance.now();a.render();const end=performance.now();updates.push(mid-start);renders.push(end-mid);times.push(end-start);}
 return {median_ms:+percentile(times,.5).toFixed(3),p95_ms:+percentile(times,.95).toFixed(3),update_median_ms:+percentile(updates,.5).toFixed(3),render_median_ms:+percentile(renders,.5).toFixed(3),draw_calls_per_frame:Math.round(counters.draw/120),geometry_calls_per_frame:Math.round(counters.geometry/120),enemies:a.get().enemies.length};
}
(async()=>{
 const current=fs.readFileSync(path.join(__dirname,'../game.html'),'utf8'),baseline=process.argv[2]?fs.readFileSync(path.resolve(process.argv[2]),'utf8'):null;
 const report={note:'Deterministic Node VM CPU/draw-call benchmark; Canvas is stubbed. These are not browser FPS or phone temperature measurements.',scenarios:{}};
 for(const [name,args]of Object.entries({normal:[120,60,1000,false],dense:[260,160,5000,true],extreme:[260,420,5000,true]})){
  const entry={};if(baseline)entry.baseline=await measure(baseline,args);entry.current=await measure(current,args);report.scenarios[name]=entry;
 }
 console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e.message);process.exit(1);});
