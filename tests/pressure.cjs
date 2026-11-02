const {boot}=require('./runtime-harness.cjs'),assert=require('node:assert/strict');
const clone=x=>JSON.parse(JSON.stringify(x));
const extra=`BOSS_PRESSURE,pressureWarning,pressureCooldown,updateBossPressure,acceptPressureBlock,drawPressureOverlay,damagePlayer,keys,dash,
 prepare:(key)=>{const n=Object.entries(BOSS_DEFS).find(([k])=>k===key);bossEncounters=key==='louse_baron'?2:key==='roach_tank'?7:key==='old_scratch'?3:4;slimeThisRun=totalBossSlime(bossEncounters);slimeLedger={count:bossEncounters,total:slimeThisRun,legacyCount:bossEncounters,legacyTotal:slimeThisRun};spawnBoss();bossActive.brain.phase='approach';bossActive.brain.timer=2;bossActive.pressureNextAt=0;bossActive.pressureLastAt=undefined;return bossActive;},
 risky:()=>{CHEATS.godMode=false;player.armor=100000;player.dmgReduction=.01;player.invuln=10;dashTimer=1;player.lab.guard=1;player.vGuardReady=true;},
 snapshotState:()=>({usedExtraLife,runEnded}),`;
(async()=>{
 const {a,elements}=boot({api:extra});await new Promise(r=>setImmediate(r));
 for(const mode of ['easy','normal','hard','impossible','vmode']){
  // A shield press at the beginning, middle or final moment registers for the whole cast.
  for(const when of [0,.5,.999]){
   a.setup(mode);const b=a.prepare('louse_baron');a.updateBossPressure(b,0);const duration=b.pressure.left,hp=a.get().player.hp;
   a.updateBossPressure(b,duration*when);a.pressShield();assert(b.pressure.blocked);a.get().player.shieldActiveTimer=0;
   a.updateBossPressure(b,duration*(1-when)+.00001);assert.equal(a.get().player.hp,hp);assert.equal(b.pressure.phase,'recover');
  }
  // Failure is exactly Max HP damage; armor, dash, invulnerability and consumable guards cannot bypass it.
  a.setup(mode);let b=a.prepare('roach_tank');a.updateBossPressure(b,0);a.risky();const max=a.get().player.maxHp;a.updateBossPressure(b,3.01);
  assert.equal(a.get().player.hp,0);assert.equal(a.get().runStats.damageTaken,max);assert.equal(a.get().state,'gameover');
  // Cooldown stays longer than the live shield cycle, even if normal attacks are hasted.
  a.setup(mode);b=a.prepare('louse_baron');a.updateBossPressure(b,0);a.pressShield();a.updateBossPressure(b,3.01);a.updateBossPressure(b,1);
  const next=b.pressureNextAt,shield=a.shieldSpec();assert(next-a.get().elapsed>=shield.duration+shield.gap);assert(a.pressureCooldown()>=shield.duration+shield.gap);
  a.setTime(next-.001);assert.equal(a.updateBossPressure(b,0),false);a.setTime(next);a.updateBossPressure(b,0);assert.equal(b.pressure.phase,'warn');
  // Blindness: warning is visible first, shield can prevent it or dispel it after blackout.
  for(const key of ['old_scratch','botfly_broodmother']){
   a.setup(mode);b=a.prepare(key);a.updateBossPressure(b,0);assert.equal(b.pressure.phase,'warn');a.drawPressureOverlay();
   a.pressShield();a.updateBossPressure(b,2);assert.equal(b.pressure.phase,'recover');
   a.setup(mode);b=a.prepare(key);a.updateBossPressure(b,0);a.updateBossPressure(b,2);assert.equal(b.pressure.phase,'black');a.render();a.pressShield();assert.equal(b.pressure.phase,'recover');
  }
  // Save/load keeps a registered block, remaining warning and cooldown without restarting the cast.
  a.setup(mode);b=a.prepare('louse_baron');a.updateBossPressure(b,0);a.updateBossPressure(b,.3);a.pressShield();const remaining=b.pressure.left;
  const saved=clone(a.snapshotRun());a.validateRun(saved);a.restore(saved);b=a.get().boss;assert(b.pressure.blocked);assert.equal(b.pressure.left,remaining);a.setState('playing');a.get().player.shieldActiveTimer=0;a.updateBossPressure(b,3);assert.equal(a.get().player.hp,a.get().player.maxHp);
  const bad=clone(a.snapshotRun());bad.enemies.find(e=>e.type==='boss').pressure={kind:'red',phase:'black',left:1,duration:2,blocked:false};assert.throws(()=>a.validateRun(bad));
 }
 a.setup();const b=a.prepare('louse_baron');b.brain.phase='charge';assert.equal(a.updateBossPressure(b,0),false,'map warning never overlaps an active boss attack');
 a.setup('impossible',75);const late=a.prepare('louse_baron');a.update(.01);assert.equal(late.pressure.phase,'warn');const initial=late.pressure.left;
 for(let i=0;i<60;i++)a.update(1/60);assert(Math.abs(late.pressure.left-(initial-1))<1e-8,'late-game speed mods do not accelerate the map warning');
 a.pressShield();a.CHEATS.godMode=false;const hp=a.get().player.hp;for(let i=0;i<80;i++)a.update(1/60);assert.equal(a.get().player.hp,hp);
 a.setup();a.spawnAt(8);assert.equal(a.get().boss.pressure,undefined,'dragonfly unchanged');
 console.log('PASS: red warning, early/middle/late shield latch, exact Max HP hit, all five shield cooldowns, blind prevention/cleanse, pressure save/load and invalid states, no overlap/dragonfly changes.');
})().catch(e=>{console.error(e.message,e.stack?.split('\n').filter(x=>x.startsWith('    at ')).slice(0,4).join('\n'));process.exit(1);});
