const {boot}=require('./runtime-harness.cjs'),assert=require('node:assert/strict');
(async()=>{
 const {a,elements,storage}=boot({api:'startSecretMode,nextSecretWave,updateSecretMode,leaveSecretMode,STONES,checkpoint,gambinoOutcome,getSecret:()=>secretSession,BOSS_DEFS,normalizeSave,resumeRun,emitDashCloud,updateHUD,'});await new Promise(r=>setImmediate(r));
 assert(!a.startSecretMode());a.setup('normal');a.CHEATS.godMode=false;a.CHEATS.noSpawn=false;for(const stone of a.STONES)a.save.stones[stone.id]=true;a.save.secretMode=true;a.setState('paused');
 const original=JSON.stringify(a.snapshotRun()),bank=a.save.bloodBank,slime=a.save.slimeBank;assert(a.startSecretMode());assert.equal(a.get().enemies.length,3);a.spawnBoss('danys_mom');assert.equal(a.get().enemies.length,3,'bosses can only spawn during wave construction');
 a.updateSecretMode(10);assert(a.get().enemies.some(e=>e.type!=='boss'));assert(a.get().enemies.filter(e=>e.type==='boss').every(e=>e.secretSpawner));
 const stored=storage.get('tick_blood_gains_journey50_run_v2');a.checkpoint();assert.equal(storage.get('tick_blood_gains_journey50_run_v2'),stored);
 for(let wave=1;wave<=15;wave++){
  assert.equal(a.get().enemies.filter(e=>e.secretSpawner&&!e.dead).length,wave*3);
  const distribution={};for(const e of a.get().enemies)if(e.secretSpawner)distribution[e.bossKey]=(distribution[e.bossKey]||0)+1;for(const count of Object.values(distribution))assert(count<=Math.ceil(wave*3/(Object.keys(a.BOSS_DEFS).length-1)),'balanced random boss bag');
  if(wave===15){a.CHEATS.godMode=true;for(let i=0;i<1200;i++)a.update(1/60);a.render();assert.equal(a.get().enemies.filter(e=>e.secretSpawner&&!e.dead).length,45);assert(a.get().enemies.length<=180,'normal-difficulty population cap');for(const boss of a.get().enemies.filter(e=>e.secretSpawner))assert(a.get().enemies.filter(e=>e.summonerId===boss.id&&!e.dead).length<=12);}
  for(const e of [...a.get().enemies])a.killEnemy(e);a.setState('playing');a.updateSecretMode(.01);
  if(wave<15){assert.equal(a.get().state,'secretStage');assert(a.nextSecretWave());assert(!a.nextSecretWave());}
 }
 assert.equal(a.get().state,'secretResult');assert(a.save.secretCosmetics,'cosmetic granted even with testing toggles');assert(a.normalizeSave(a.save).secretCosmetics);a.CHEATS.godMode=false;assert.equal(elements.get('secret-result-title').textContent,'Вы получили доступ ко всему!');assert.equal(a.save.bloodBank,bank);assert.equal(a.save.slimeBank,slime);assert.equal(JSON.stringify(a.getSecret().original),original);a.leaveSecretMode();assert.equal(a.get().state,'paused');assert.equal(a.get().player.hp,JSON.parse(original).player.hp);
 const ctx=elements.get('game-canvas').getContext('2d'),fills=[];Object.defineProperty(ctx,'fillStyle',{configurable:true,set:v=>fills.push(v),get:()=>fills.at(-1)});a.resumeRun();a.get().player.shieldCooldown=0;a.pressShield();a.emitDashCloud();a.render();assert(fills.includes('#070709'),'active shield has a black fill');assert(fills.includes('#ffd75a')&&fills.includes('#fff1a0'),'golden dash trail and core');
 assert.equal(a.gambinoOutcome(.00005),'hint');for(const roll of [.2701,.2721,.2741,.2761,.2781])assert.equal(a.gambinoOutcome(roll),'decoy');assert.equal(a.gambinoOutcome(.28),'loss');
 console.log('PASS: secret unlock, 15 waves/3–45 bosses, mixed summons, wave guards, 45-boss runtime/render, isolated expedition and wallet, cosmetic reward, decoy boundaries');
})().catch(e=>{console.error(e);process.exit(1)});
