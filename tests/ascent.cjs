const {boot}=require('./runtime-harness.cjs'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const clone=x=>JSON.parse(JSON.stringify(x)),near=(a,b)=>assert(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const api=`floorPower,enterJourneyFloor,effectsForFloor,updateBossReinforcements,enemyField,BOSS_REINFORCEMENT_INTERVAL,viewWidth,viewHeight,
 progress:(n)=>{bossEncounters=n;slimeThisRun=totalBossSlime(n);slimeLedger={count:n,total:slimeThisRun,legacyCount:n,legacyTotal:slimeThisRun};enterJourneyFloor(n);currentStageIdx=stageIndexForEncounter(n);},
 prepareBoss:()=>{bossEncounters=2;slimeThisRun=totalBossSlime(2);slimeLedger={count:2,total:slimeThisRun,legacyCount:2,legacyTotal:slimeThisRun};spawnBoss();bossActive.brain.phase='approach';bossActive.pressureNextAt=1e9;CHEATS.noSpawn=false;return bossActive;},
 getCamera:()=>camera,mirror:on=>{mirrorSession=on?{}:null;},`;
(async()=>{
 const html=fs.readFileSync(path.join(__dirname,'../game.html'),'utf8');
 const {a,sandbox}=boot({api});await new Promise(r=>setImmediate(r));
 for(const mode of ['easy','normal','hard','impossible','vmode'])for(const boss of [false,true]){
  let lastStep=0;for(let n=0;n<150;n++){const step=a.floorPower(n+1,mode,boss).hp-a.floorPower(n,mode,boss).hp;assert(step>lastStep);lastStep=step;}
  near(a.floorPower(0,mode,boss).hp,1);near(a.floorPower(25,mode,boss).dmg,2);
 }
 near(a.floorPower(25,'normal').hp,3.75);near(a.floorPower(25,'impossible').hp,4.125);near(a.floorPower(25,'impossible',true).hp,3.28125);
 // Old 5.1 saves have linear growth; loading them into a differently selected mode must use the saved difficulty.
 const oldHTML=html.replace('JOURNEY_POWER_REVISION=3','JOURNEY_POWER_REVISION=2').replace('journey:{v:3,floor:fieldEncounter,interval:ENDLESS_MOD_INTERVAL,powerRevision:JOURNEY_POWER_REVISION}','journey:{v:2,floor:fieldEncounter,interval:ENDLESS_MOD_INTERVAL}');
 for(const mode of ['easy','normal','hard','impossible','vmode']){
  const old=boot({html:oldHTML,api});await new Promise(r=>setImmediate(r));old.a.setup(mode,25);old.a.spawnEnemy('ant',{x:100,y:100});old.a.spawnBoss();
  for(const e of old.a.get().enemies){e.hp=e.maxHp*.37;if(e.type!=='boss'){e.elite=true;e.hp*=3;e.maxHp*=3;}}
  const saved=clone(old.a.snapshotRun()),before=clone(saved.enemies);a.setup('normal');a.validateRun(saved);
  assert.equal(saved.journey.v,3);assert.equal(saved.journey.powerRevision,3);
  for(let i=0;i<before.length;i++){const boss=before[i].type==='boss';near(saved.enemies[i].maxHp,before[i].maxHp*a.floorPower(25,mode,boss).hp/3);near(saved.enemies[i].hp/saved.enemies[i].maxHp,.37);near(saved.enemies[i].dmg,before[i].dmg);}
  const once=clone(saved);a.validateRun(saved);assert.deepEqual(clone(saved),once);a.restore(saved);near(a.get().enemies[0].maxHp,saved.enemies[0].maxHp);
 }
 // Strong bosses and other difficulties do not gain these reinforcements.
 for(const mode of ['easy','normal','hard','vmode']){a.setup(mode);const b=a.prepareBoss(),before=a.get().enemies.length;a.updateBossReinforcements(b,20);assert.equal(a.get().enemies.length,before);}
 a.setup('impossible');let b=a.prepareBoss();a.render();let before=a.get().enemies.length;a.updateBossReinforcements(b,9.99);assert.equal(a.get().enemies.length,before);a.updateBossReinforcements(b,.02);assert.equal(a.get().enemies.length,before+2);
 const cam=a.getCamera();for(const e of a.get().enemies.slice(-2))assert(e.x<cam.x||e.x>cam.x+a.viewWidth()||e.y<cam.y||e.y>cam.y+a.viewHeight());
 before=a.get().enemies.length;b.pressure={kind:'red',phase:'warn'};b.reinforceLeft=0;a.updateBossReinforcements(b,1);assert.equal(a.get().enemies.length,before);b.pressure=null;b.brain.phase='charge';a.updateBossReinforcements(b,1);assert.equal(a.get().enemies.length,before);
 b.brain.phase='approach';a.mirror(true);a.updateBossReinforcements(b,1);assert.equal(a.get().enemies.length,before);a.mirror(false);
 b.reinforceLeft=3;const saved=clone(a.snapshotRun());a.validateRun(saved);a.restore(saved);assert.equal(a.get().boss.reinforceLeft,3);
 const bad=clone(saved);bad.enemies.find(e=>e.type==='boss').reinforceLeft=-1;assert.throws(()=>a.validateRun(bad));
 // Wave spawning respects population caps and touch zoom keeps spawn points outside the larger viewport.
 a.setup('impossible');b=a.prepareBoss();for(let i=0;i<259;i++)a.spawnEnemy('ant',{x:100,y:100});assert.equal(a.enemyField.population(),260);a.updateBossReinforcements(b,11);assert.equal(a.enemyField.population(),260);
 sandbox.window.innerWidth=390;sandbox.window.innerHeight=844;a.resize();a.setup('impossible');b=a.prepareBoss();a.render();a.updateBossReinforcements(b,11);const mobileCam=a.getCamera();for(const e of a.get().enemies.slice(-2))assert(e.x<mobileCam.x||e.x>mobileCam.x+a.viewWidth()||e.y<mobileCam.y||e.y>mobileCam.y+a.viewHeight());
 console.log('PASS: accelerating per-stage HP, gentler bosses, unchanged damage, 5.1 migration on all modes without double scaling, timed/offscreen Impossible reinforcements, cast safety, save/load, population caps and mobile viewport.');
})().catch(e=>{console.error(e.message,e.stack?.split('\n').filter(x=>x.startsWith('    at ')).slice(0,4).join('\n'));process.exit(1);});
