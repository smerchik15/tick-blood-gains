const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'game.html'),'utf8');
const baseline=cp.execFileSync('git',['show','44bfbbc:game.html'],{cwd:root,encoding:'utf8',maxBuffer:12000000});
const harness=fs.readFileSync(path.join(__dirname,'balance.cjs'),'utf8').split('code=code.replace')[0].replace("fs.readFileSync(require('path').join(__dirname,'../game.html'),'utf8')",'globalThis.inputHTML');
const common=`startRun,startSwarmRun,spawnEnemy,spawnBoss,killEnemy,bossKeyForEncounter,difficultyMult,snapshotRun,validateRun,render,update,resize,setMobilePreferences,applySlow,applyWeaponStatus,resolveEnemyTypedDamage,CHEATS,save,play:()=>setState('playing'),
 restore:r=>{resumeData=r;restoreRun();},
 progress:(n,seed=42)=>{bossEncounters=n;slimeThisRun=totalBossSlime(n);slimeLedger={count:n,total:slimeThisRun,legacyCount:n,legacyTotal:slimeThisRun};runSeed=seed;currentStageIdx=Math.min(n,STAGES.length-1);},
 get:()=>({player,enemies,boss:bossActive,shots:enemyProjectiles,state,pausedFrom,bossEncounters,currentStageIdx,STAGES}),`;
const extra=`ENEMY_TYPES,CAMPAIGN_STAGE_COUNT,ENDLESS_MOD_INTERVAL,AFFIX_DEFS,floorPower,ranksForFloor,effectsForFloor,stageIndexForEncounter,floorTitle,stampEnemyProjectile,enemyShot,emitBossShot,enterJourneyFloor,tickEnemyAffixes,uninterruptible,drawJourneyBackdrop,
 floor:(n)=>{enterJourneyFloor(n);currentStageIdx=stageIndexForEncounter(n);},
 forceRanks:r=>{journeyCache={key:runSeed+':'+(1+Math.floor((endlessDepth()-1)/ENDLESS_MOD_INTERVAL)),ranks:r};},
 resetCache:()=>{journeyCache=null;},
 mirror:on=>{mirrorSession=on?{}:null;},`;
function boot(source,newGame=true,seed=[]){
 const host={require,__dirname,console,Blob,URL,setImmediate,inputHTML:source,seed};vm.createContext(host);
 const api=`globalThis.api={${common}${newGame?extra:''}};})();`;
 vm.runInContext(harness+`for(const [k,v]of seed)storage.set(k,v);code=code.replace(/\\}\\)\\(\\);\\s*$/,${JSON.stringify(api)});vm.createContext(sandbox);try{vm.runInContext(code,sandbox);}catch(e){throw Error(e.message);}globalThis.result={a:sandbox.api,sandbox,elements,storage};`,host);
 return host.result;
}
const copy=x=>JSON.parse(JSON.stringify(x)),near=(a,b)=>assert(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
(async()=>{
 const {a,sandbox,elements}=boot(html);await new Promise(r=>setImmediate(r));
 const old=boot(baseline,false);await new Promise(r=>setImmediate(r));
 assert.equal(a.ENDLESS_MOD_INTERVAL,1);assert.equal(a.CAMPAIGN_STAGE_COUNT,26);assert.equal(a.get().STAGES.length,26);
 assert.equal(new Set(a.get().STAGES.slice(11).map(s=>s.name.ru)).size,15);
 for(const s of a.get().STAGES.slice(11)){assert(s.theme?.motif);assert(s.pool.length>=4);}
 for(let n=0;n<250;n++)assert.equal(a.bossKeyForEncounter(n),old.a.bossKeyForEncounter(n),'boss order must stay unchanged');
 // At a fixed elapsed time every next floor adds HP and damage on every difficulty.
 for(const mode of ['easy','normal','hard','impossible','vmode']){
  a.startRun(mode);old.a.startRun(mode);
  for(const boss of [false,true]){
   const base=old.a.difficultyMult(900,boss);let last=base;
   for(let floor=0;floor<36;floor++){
    a.floor(floor);const d=a.difficultyMult(900,boss),p=a.floorPower(floor,mode,boss);
    near(d.hp,base.hp*p.hp);near(d.dmg,base.dmg*p.dmg);
    if(floor){assert(d.hp>last.hp);assert(d.dmg>last.dmg);}last=d;
   }
  }
 }
 a.startRun();let previousHp=0,previousDamage=0;for(let floor=0;floor<26;floor++){a.floor(floor);a.spawnEnemy('ant',{x:100,y:100});const mob=a.get().enemies.at(-1);assert(mob.maxHp>previousHp&&mob.dmg>previousDamage,'even low-HP mobs grow on every floor');previousHp=mob.maxHp;previousDamage=mob.dmg;}
 assert.equal(Object.keys(a.ranksForFloor(25,7)).length,0);
 const count=n=>Object.values(a.ranksForFloor(n,7)).reduce((x,y)=>x+y,0);
 assert.equal(count(26),1);assert.equal(count(27),2);assert.equal(count(28),3);assert.equal(count(29),4);assert.equal(count(32),7);
 for(let floor=26;floor<80;floor++){
  const current=a.ranksForFloor(floor,7),next=a.ranksForFloor(floor+1,7);let added=0;
  for(const def of a.AFFIX_DEFS){const delta=(next[def.id]||0)-(current[def.id]||0);assert(delta===0||delta===1);added+=delta;}assert.equal(added,1);
 }
 const seeded=copy(a.ranksForFloor(83,123));a.resetCache();assert.deepEqual(copy(a.ranksForFloor(83,123)),seeded);
 assert.notDeepEqual(copy(a.ranksForFloor(83,124)),seeded);
 const long=a.ranksForFloor(3000,123);for(const d of a.AFFIX_DEFS)assert((long[d.id]||0)<=d.max);assert.equal(Object.values(long).reduce((x,y)=>x+y,0),2975);
 // Stats apply equally to spawns and survivors; elites retain their multiplier and HP fraction.
 a.startRun();a.progress(25);a.floor(25);a.spawnEnemy('ant',{x:100,y:100});
 let e=a.get().enemies.at(-1);e.maxHp*=3;e.hp=e.maxHp*.4;e.dmg*=1.3;e.speed*=1.07;
 const before={...e};a.floor(26);let m=a.effectsForFloor(26,42,false),p=a.floorPower(26),p0=a.floorPower(25);
 near(e.maxHp,before.maxHp*p.hp/p0.hp*m.hp);near(e.hp/e.maxHp,.4);near(e.dmg,before.dmg*p.dmg/p0.dmg*m.dmg);near(e.speed,before.speed*m.move);
 const hp=e.maxHp;a.floor(26);a.tickEnemyAffixes(e,.016);near(e.maxHp,hp);
 a.spawnBoss();let b=a.get().boss;assert.equal(b.affixFloor,26);
 // Exercise every modifier independently, including projectile ownership and once-only scaling.
 const originalBossMods=a.effectsForFloor(26,42,true),originalBossHp=b.maxHp;const forced={vital:2,brutal:2,fleet:2,ballistic:2,frenzy:2,unstoppable:1,armored:2,tenacious:2};a.forceRanks(forced);
 m=a.effectsForFloor(26,42,true);a.spawnBoss();near(a.get().boss.maxHp,originalBossHp/originalBossMods.hp*1.36);near(m.hp,1.36);near(m.dmg,1.24);near(m.move,1.08);near(m.haste,1.10);near(m.armor,.10);
 const shot={vx:100,vy:0,sourceBoss:false};a.stampEnemyProjectile(shot);near(shot.vx,116);a.stampEnemyProjectile(shot);near(shot.vx,116);
 const bossShot={vx:100,vy:0,sourceBoss:true};a.stampEnemyProjectile(bossShot);near(bossShot.vx,112);
 a.spawnEnemy('weaver',{x:500,y:500});e=a.get().enemies.at(-1);a.enemyShot(e,0,100);assert.equal(a.get().shots.at(-1).sourceBoss,false);
 near(e.maxHp,Math.round(a.ENEMY_TYPES.weaver.hp*a.difficultyMult(0).hp/a.floorPower(26).hp)*a.floorPower(26).hp*1.36);
 const idle={type:'ant',affixFloor:26,skillPhase:'idle',skillTimer:2,slowTimer:0,ccCooldown:0};a.tickEnemyAffixes(idle,1);near(idle.skillTimer,1.86);assert(a.applySlow(idle));near(idle.slowTimer,.35/1.4);
 const physical=a.resolveEnemyTypedDamage(idle,100,'spikes',{type:'physical'}).amount; a.forceRanks({});const unarmored=a.resolveEnemyTypedDamage(idle,100,'spikes',{type:'physical'}).amount;near(physical,unarmored*.88);a.forceRanks(forced);
 idle.skillPhase='warn';idle.skillTime=.9;idle.skillTimer=2;idle.slowTimer=1;assert(a.uninterruptible(idle));assert.equal(a.applySlow(idle),false);a.tickEnemyAffixes(idle,.2);near(idle.skillTime,.9);near(idle.skillTimer,2);near(idle.slowTimer,0);idle.skillTimer=0;a.applyWeaponStatus(idle,10,'electric');near(idle.skillTimer,0);idle.skillPhase='idle';a.applyWeaponStatus(idle,10,'electric');near(idle.skillTimer,1.1);
 const blink={type:'boss',affixFloor:26,blinkState:'windup',blinkTimer:.65,slowTimer:1};a.tickEnemyAffixes(blink,.5);near(blink.blinkTimer,.65);near(blink.slowTimer,0);assert(!blink.invulnerable);
 const brain={type:'boss',affixFloor:26,brain:{phase:'warn',timer:.9},slowTimer:0};a.tickEnemyAffixes(brain,.5);near(brain.brain.timer,.9);brain.brain.phase='approach';a.tickEnemyAffixes(brain,1);near(brain.brain.timer,.8);
 // Actual boss settlement and reload do not grant next-floor mods before Continue.
 a.startRun();a.progress(25);a.floor(25);a.spawnBoss();a.killEnemy(a.get().boss);assert.equal(a.get().state,'stageclear');
 let saved=copy(a.snapshotRun());assert.equal(saved.journey.floor,25);assert.equal(saved.bossEncounters,26);a.validateRun(saved);a.restore(saved);assert.equal(a.get().state,'stageclear');
 elements.get('btn-stageclear-continue').onclick();assert.equal(a.snapshotRun().journey.floor,26);assert.equal(a.get().currentStageIdx,11);
 a.spawnEnemy('ant',{x:100,y:100});saved=copy(a.snapshotRun());const stats=copy(saved.enemies);a.validateRun(saved);a.validateRun(saved);assert.deepEqual(copy(saved.enemies),stats);a.restore(saved);assert.equal(a.snapshotRun().journey.floor,26);
 // Legacy 4.9.2 saves retain enemy HP fraction and become stage-aware exactly once.
 for(const waiting of [false,true]){
  old.a.startRun();old.a.progress(28);old.a.spawnEnemy('ant',{x:100,y:100});let legacy=copy(old.a.snapshotRun());legacy.enemies[0].hp=legacy.enemies[0].maxHp*.3;
  if(waiting)legacy.activeState='stageclear';a.validateRun(legacy);assert.equal(legacy.journey.floor,waiting?27:28);near(legacy.enemies[0].hp/legacy.enemies[0].maxHp,.3);const max=legacy.enemies[0].maxHp;a.validateRun(legacy);near(legacy.enemies[0].maxHp,max);
 }
 // Automatic copy from 4.9.2 is isolated; an existing 5.0 profile always wins.
 old.a.startRun();old.a.progress(28);old.a.spawnEnemy('ant',{x:100,y:100});
 const oldProfile=JSON.stringify(old.a.save),oldRun=JSON.stringify(old.a.snapshotRun());
 const seed=[['tick_blood_gains_lab49_save_v1',oldProfile],['tick_blood_gains_lab49_run_v2',oldRun]];
 const migrated=boot(html,true,seed);await new Promise(r=>setImmediate(r));
 for(const [k,v]of seed)assert.equal(migrated.storage.get(k),v);
 const migratedRun=JSON.parse(migrated.storage.get('tick_blood_gains_journey50_run_v2'));migrated.a.validateRun(migratedRun);assert.equal(migratedRun.journey.floor,28);
 const existing=JSON.stringify({...old.a.save,bloodBank:987});const preferred=boot(html,true,[...seed,['tick_blood_gains_journey50_save_v1',existing],['tick_blood_gains_journey50_run_v2',JSON.stringify(migratedRun)]]);await new Promise(r=>setImmediate(r));assert.equal(preferred.a.save.bloodBank,987);
 const bad=copy(a.snapshotRun());bad.journey.floor=-1;assert.throws(()=>a.validateRun(bad));
 // First 5.0 build used one affix per three floors; migrate its living mobs/bosses once.
 const formerHTML=html.replace('ENDLESS_MOD_INTERVAL=1','ENDLESS_MOD_INTERVAL=3').replace('JOURNEY_POWER_REVISION=3','JOURNEY_POWER_REVISION=2').replace('journey:{v:3,floor:fieldEncounter,interval:ENDLESS_MOD_INTERVAL,powerRevision:JOURNEY_POWER_REVISION}','journey:{v:1,floor:fieldEncounter}');
 const former=boot(formerHTML);await new Promise(r=>setImmediate(r));former.a.startRun();former.a.progress(59);former.a.floor(59);former.a.spawnEnemy('ant',{x:100,y:100});former.a.spawnBoss();
 for(const mob of former.a.get().enemies)mob.hp=mob.maxHp*.4;
 const oldSchedule=copy(former.a.snapshotRun()),oldStats=copy(oldSchedule.enemies);assert.equal(oldSchedule.journey.v,1);
 a.validateRun(oldSchedule);assert.equal(oldSchedule.journey.v,3);assert.equal(oldSchedule.journey.interval,1);
 for(let i=0;i<oldStats.length;i++){
  const mob=oldSchedule.enemies[i],before=oldStats[i],boss=mob.type==='boss';
  const previous=former.a.effectsForFloor(59,42,boss),next=a.effectsForFloor(59,42,boss);
  near(mob.maxHp,before.maxHp*next.hp/previous.hp*a.floorPower(59,'normal',boss).hp/former.a.floorPower(59,'normal',boss).hp);near(mob.hp/mob.maxHp,.4);near(mob.dmg,before.dmg*next.dmg/previous.dmg);near(mob.speed,before.speed*next.move/previous.move);
 }
 const once=copy(oldSchedule);a.validateRun(oldSchedule);assert.deepEqual(copy(oldSchedule),once);
 const invalidInterval=copy(oldSchedule);invalidInterval.journey.interval=0;assert.throws(()=>a.validateRun(invalidInterval));
 // Real late-game dragonfly: affixes survive reload without shortening teleport windup.
 a.startRun('impossible');const lateSeed=Array.from({length:100},(_,i)=>i).find(seed=>{const m=a.effectsForFloor(59,seed,true);return m.haste>1&&m.projectile>1;});assert.notEqual(lateSeed,undefined);a.progress(59,lateSeed);a.floor(59);a.CHEATS.noSpawn=true;a.spawnBoss();b=a.get().boss;
 assert.equal(b.behavior,'boss_dragonfly');const late=a.effectsForFloor(59,lateSeed,true);assert(late.haste>1&&late.projectile>1);
 let player=a.get().player;player.attackTimer=1e9;b.blinkState='telegraph';b.blinkTimer=.001;b.blinkX=player.x+180;b.blinkY=player.y;a.update(.01);
 assert.equal(b.blinkState,'windup');near(b.blinkTimer,.65);
 for(let i=0;i<25;i++)a.update(.016);assert.equal(a.get().shots.length,0);
 saved=copy(a.snapshotRun());a.validateRun(saved);a.restore(saved);a.play();b=a.get().boss;
 near(b.blinkTimer,.25);for(let i=0;i<15;i++)a.update(.016);assert.equal(a.get().shots.length,0);a.update(.02);
 assert.equal(a.get().shots.length,3);for(const pr of a.get().shots)near(Math.hypot(pr.vx,pr.vy),230*late.projectile);
 // All 15 new backgrounds and repeated endless biomes draw at desktop and mobile zoom.
 for(const [width,height]of [[1280,800],[390,844],[844,390]]){
  sandbox.window.innerWidth=width;sandbox.window.innerHeight=height;a.resize();a.setMobilePreferences('left',.6);
  for(let n=11;n<57;n++){a.floor(n);a.render();assert(a.drawJourneyBackdrop());assert(a.get().currentStageIdx>=11&&a.get().currentStageIdx<26);}
 }
 a.startSwarmRun();old.a.startSwarmRun();a.floor(100);for(const boss of [false,true])assert.deepEqual(copy(a.difficultyMult(500,boss)),copy(old.a.difficultyMult(500,boss)));assert.equal(a.effectsForFloor(100,42,true,true).hp,1);
 a.mirror(true);assert.equal(a.uninterruptible({type:'boss',affixFloor:100,blinkState:'windup'}),false);a.mirror(false);
 console.log('PASS: 15 biomes/26 campaign stages, monotonic growth, unchanged 250-boss sequence, seeded cumulative affixes/caps, bosses and survivors, projectile ownership, safe telegraphs, settlement/reload and 4.9.2 migration, desktop/mobile drawing, swarm/arena exclusion.');
})().catch(e=>{console.error(e.message,e.stack?.split('\n').filter(x=>'    at '===x.slice(0,7)).slice(0,4).join('\n'));process.exit(1);});
