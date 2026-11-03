const {boot}=require('./runtime-harness.cjs'),assert=require('node:assert/strict');
(async()=>{
 const {a,elements,storage}=boot({api:'startSecretMode,nextSecretWave,updateSecretMode,leaveSecretMode,STONES,checkpoint,gambinoOutcome,getSecret:()=>secretSession,'});await new Promise(r=>setImmediate(r));
 assert(!a.startSecretMode());a.setup('normal');a.CHEATS.godMode=false;a.CHEATS.noSpawn=false;for(const stone of a.STONES)a.save.stones[stone.id]=true;a.save.secretMode=true;a.setState('paused');
 const original=JSON.stringify(a.snapshotRun()),bank=a.save.bloodBank,slime=a.save.slimeBank;assert(a.startSecretMode());assert.equal(a.get().enemies.length,3);
 a.updateSecretMode(10);assert(a.get().enemies.some(e=>e.type!=='boss'));assert(a.get().enemies.filter(e=>e.type==='boss').every(e=>e.secretSpawner));
 const stored=storage.get('tick_blood_gains_journey50_run_v2');a.checkpoint();assert.equal(storage.get('tick_blood_gains_journey50_run_v2'),stored);
 for(let wave=1;wave<=15;wave++){
  assert.equal(a.get().enemies.filter(e=>e.secretSpawner&&!e.dead).length,wave*3);
  if(wave===15){a.CHEATS.godMode=true;for(let i=0;i<120;i++)a.update(1/60);a.render();a.CHEATS.godMode=false;}
  for(const e of [...a.get().enemies])a.killEnemy(e);a.setState('playing');a.updateSecretMode(.01);
  if(wave<15){assert.equal(a.get().state,'secretStage');assert(a.nextSecretWave());assert(!a.nextSecretWave());}
 }
 assert.equal(a.get().state,'secretResult');assert(a.save.secretCosmetics);assert.equal(elements.get('secret-result-title').textContent,'Вы получили доступ ко всему!');assert.equal(a.save.bloodBank,bank);assert.equal(a.save.slimeBank,slime);assert.equal(JSON.stringify(a.getSecret().original),original);a.leaveSecretMode();assert.equal(a.get().state,'paused');assert.equal(a.get().player.hp,JSON.parse(original).player.hp);
 assert.equal(a.gambinoOutcome(.00005),'hint');for(const roll of [.2701,.2721,.2741,.2761,.2781])assert.equal(a.gambinoOutcome(roll),'decoy');assert.equal(a.gambinoOutcome(.28),'loss');
 console.log('PASS: secret unlock, 15 waves/3–45 bosses, mixed summons, wave guards, 45-boss runtime/render, isolated expedition and wallet, cosmetic reward, decoy boundaries');
})().catch(e=>{console.error(e);process.exit(1)});
