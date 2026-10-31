const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const prefix=fs.readFileSync(path.join(__dirname,'balance.cjs'),'utf8').split('code=code.replace')[0];
const api=`globalThis.api={startRun,update,render,CHEATS,keys,snapshotRun,validateRun,restore:r=>{resumeData=r;restoreRun();setState('playing');},get:()=>({player,boss:bossActive,shots:enemyProjectiles,state}),spawn:()=>{bossEncounters=8;slimeThisRun=totalBossSlime(8);slimeLedger={count:8,total:slimeThisRun,legacyCount:8,legacyTotal:slimeThisRun};spawnBoss();for(const c of mapEvents)c.done=true;for(const c of caches)c.opened=true;player.attackTimer=1e9;}};})();`;
const host={require,__dirname,console,Blob,URL,setImmediate};vm.createContext(host);vm.runInContext(prefix+`code=code.replace(/\\}\\)\\(\\);\\s*$/,${JSON.stringify(api)});vm.createContext(sandbox);vm.runInContext(code,sandbox);globalThis.api=sandbox.api;`,host);
(async()=>{await new Promise(r=>setImmediate(r));const a=host.api;
for(const mode of ['easy','normal','hard','impossible','vmode']){
 a.startRun(mode);a.CHEATS.noSpawn=true;a.spawn();let {player:p,boss:b}=a.get();assert.equal(b.bossKey,'dragonfly_interceptor');
 b.blinkState='telegraph';b.blinkTimer=.001;b.blinkX=p.x+180;b.blinkY=p.y;a.update(.01);
 assert.equal(b.blinkState,'windup');assert.equal(a.get().shots.length,0);assert.equal(b.x,b.blinkX);assert.equal(b.blinkTimer,.65);
 const aim=b.blinkAim,hp=p.hp,px=b.x,py=b.y;p.x=b.x;p.y=b.y;p.invuln=0;
 for(let i=0;i<20;i++){a.update(.016);a.render();}assert.equal(a.get().shots.length,0);assert.equal(p.hp,hp,'teleport windup contact must be harmless');assert.equal(b.x,px);assert.equal(b.y,py);assert.equal(b.blinkAim,aim);
 const saved=JSON.parse(JSON.stringify(a.snapshotRun()));a.validateRun(saved);a.restore(saved);b=a.get().boss;p=a.get().player;p.x=b.x;p.y=b.y+220;
 assert.equal(b.blinkState,'windup');assert.equal(b.blinkAim,aim);const remaining=b.blinkTimer;for(let i=0;i<Math.floor((remaining-.025)/.01);i++)a.update(.01);assert.equal(a.get().shots.length,0);a.update(.04);
 assert.equal(a.get().shots.length,3);assert.equal(b.blinkState,'idle');assert.equal(b.blinkTimer,4);
 assert(a.get().shots.some(s=>Math.abs(Math.atan2(s.vy,s.vx)-aim)<1e-8));assert(a.get().shots.every(s=>Math.abs(Math.hypot(s.vx,s.vy)-230)<1e-8&&s.dmg===b.dmg*.8));
 a.update(.016);assert.equal(a.get().shots.length,3,'one volley per teleport');
}
console.log('PASS: dragonfly 0.65s stationary windup, no early shots/contact damage, locked aim, three unchanged projectiles, one volley, checkpoint/resume on all five difficulties.');
})().catch(e=>{console.error(e);process.exit(1);});
