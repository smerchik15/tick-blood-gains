const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(require('path').join(__dirname,'../game.html'),'utf8');let code=html.split('<script>')[1].split('</script>')[0];
const elements=new Map(),storage=new Map();
const gradient={addColorStop(){}};
const context=new Proxy({createRadialGradient:()=>gradient,createLinearGradient:()=>gradient,createPattern:()=>({})},{get:(o,k)=>k in o?o[k]:(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
class Element{
 constructor(id=''){this.id=id;this.style={};this.dataset={};this.textContent='';this.disabled=false;this.children=[];this.classList={add(){},remove(){},toggle(){}};this.listeners={};}
 set innerHTML(v){this.html=v;for(const m of v.matchAll(/id="([^"]+)"/g))if(!elements.has(m[1]))elements.set(m[1],new Element(m[1]));}
 get innerHTML(){return this.html||'';}
 insertAdjacentHTML(_,v){this.innerHTML=v;}
 focus(){} get parentElement(){return new Element();}
 setAttribute(){} getAttribute(){return '';} addEventListener(k,fn){this.listeners[k]=fn;}
 querySelector(){return new Element();} querySelectorAll(){return [];}
 appendChild(x){this.children.push(x);} getContext(){return context;} getBoundingClientRect(){return {left:0,top:0};}
 click(){this.onclick?.();}
}
const document={getElementById:id=>{if(!elements.has(id))elements.set(id,new Element(id));return elements.get(id);},querySelector:()=>document.getElementById('menu-panel'),querySelectorAll:()=>[],createElement:()=>new Element(),body:new Element(),documentElement:{lang:'ru'},addEventListener(){}};
const sandbox={document,console,performance:{now:()=>1000},Math,Date,JSON,Set,Map,Blob,URL,Error,Number,String,Object,Array,Promise,confirm:()=>true,setTimeout:()=>0,clearTimeout(){},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}};
const windowListeners=new Map();sandbox.window={innerWidth:1280,innerHeight:800,devicePixelRatio:2,addEventListener(k,fn){if(!windowListeners.has(k))windowListeners.set(k,[]);windowListeners.get(k).push(fn);}};sandbox.requestAnimationFrame=()=>{};
code=code.replace(/\}\)\(\);\s*$/,`globalThis.api={openCodeEntry,closeCodeEntry,redeemEntryCode,openCheats,closeCheats,cheatGiveBank,cheatGiveRunBlood,cheatToggle,selectLoadout,changeGearSelection,applySelectedLoadout,healingSourcesText,projectileCanCleave,createSoundGate,gameAudio,EQUIPMENT_DEFS,drawChickenProjectile,AUDIO_CLIPS,resize,updateWildEnemy,drawWildEnemy,drawLandmark,drawCacheModel,drawMapGlyph,availableMutations,NEW_ENEMY_IDS,KILL_VALUES,ENEMY_TYPES,STAGES,swarmPoolFor,fireSpit,findBounceTarget,grantUpgrade,buildStats,upgradeEffectPreview,effectiveMoveSpeed,totalBossSlime,healFromDamage,blast,RUN_CAPS,META_CAPS,payoutFor,bloodMultiplier,bossRewards,rewardFor,castField,bulkMetaQuote,xpToNext,MARKET_OFFERS,META_UPGRADES,weightedIndex,modIcon,MAX_RUN_LEVEL,EVOLUTIONS,RUN_UPGRADES,applyPlayerHit,applySlow,triggerBloodBurst,evolutionReady,scoreBreakdown,dealDamage,normalizeLoadouts,renderLoadouts,renderAtlas,openMapEvent,updateMajor,DIFFICULTIES,difficultyMult,spawnIntervalFor,snapshotRun,openDifficulty,importProgress,startRun,startSwarmRun,update,render,setState,spawnBoss,killEnemy,spawnEnemy,damagePlayer,pressShield,dash,gainXP,flushLevels,checkpoint,validateRun,restoreRun,endRun,normalizeSave,renderBuild,drawEnemy,drawTick,showUpgradeChoices,updateWildHUD,keys,CHEATS,ctx,save,
get:()=>({cheatsUnlocked,cheatsOpen,codeEntryOpen,dashClouds,hazards,slimeThisRun,slimeLedger,bossEncounters,enemyProjectiles,fieldZones,economyMigration,playerProjectiles,runStats,mapEvents,challenge,rankedRun,lastRecord,runDifficulty,selectedDifficulty,joyPointerId,joyActive,joyMag,state,player,enemies,orbs,caches,elapsed,bloodThisRun,slimeThisRun,bossActive,pendingLevels,rerolls,resumeData,dashCooldown,discoveries,elitesKilled}),
set:(data)=>{if(data.bossEncounters!==undefined)bossEncounters=data.bossEncounters;if(data.blood!==undefined)bloodThisRun=data.blood;if(data.slime!==undefined){slimeThisRun=data.slime;slimeLedger={count:bossEncounters,total:data.slime,legacyCount:bossEncounters,legacyTotal:data.slime};}if(data.resumeData!==undefined)resumeData=data.resumeData;},
choose:()=>document.getElementById('levelup-choices').children.at(-1)?.click(),openLevelUp,openBonusMutation,renderBloodMarket,loadSave};})();`);
vm.createContext(sandbox);vm.runInContext(code,sandbox);
(async()=>{await new Promise(r=>setImmediate(r));const a=sandbox.api;
assert.equal(a.get().state,'menu');
// Default UI and legacy shortcuts cannot open or execute test actions.
assert.equal(a.get().cheatsUnlocked,false);assert.equal(a.get().cheatsOpen,false);
assert(/class="btn secondary hidden" id="btn-cheats"/.test(html));assert(/class="nav-btn hidden" id="nav-cheats"/.test(html));
a.openCheats();assert.equal(a.get().cheatsOpen,false);const lockedBank=a.save.bloodBank;a.cheatGiveBank(1000);a.cheatToggle('godMode');assert.equal(a.save.bloodBank,lockedBank);assert.equal(a.CHEATS.godMode,false);
const secretKey=(code)=>{for(const fn of windowListeners.get('keydown')||[])fn({code,key:code==='Escape'?'Escape':code,target:{tagName:'BODY'},preventDefault(){}});};
secretKey('F2');assert(!a.get().cheatsOpen);a.openCodeEntry();assert(a.get().codeEntryOpen);elements.get('entry-code').value='nocowlevel';elements.get('entry-code-form').listeners.submit({preventDefault(){}});assert(!a.get().cheatsUnlocked);assert(elements.get('entry-code-error').textContent.length>0);secretKey('F2');assert(!a.get().cheatsOpen);secretKey('Escape');assert(!a.get().codeEntryOpen);assert.equal(a.get().state,'menu');
assert(!a.redeemEntryCode('NoCowLevelx'));assert(!a.redeemEntryCode(null));assert(a.redeemEntryCode('NoCowLevel'));assert(a.get().cheatsUnlocked);assert(a.get().cheatsOpen);a.closeCheats();secretKey('F2');assert(a.get().cheatsOpen);secretKey('Escape');assert(!a.get().cheatsOpen);
// Unlocking alone keeps a clean run ranked; applying and immediately toggling off a cheat does not.
a.startRun();assert(a.get().rankedRun);a.openCheats();a.closeCheats();assert(a.get().rankedRun);a.cheatToggle('godMode');a.cheatToggle('godMode');assert.equal(a.CHEATS.godMode,false);assert(!a.get().rankedRun);a.checkpoint();assert(!JSON.parse(JSON.stringify(a.snapshotRun())).major.ranked);assert(!Object.hasOwn(a.snapshotRun(),'cheatsUnlocked'));assert(!Object.hasOwn(a.save,'cheatsUnlocked'));
a.startRun();assert(a.get().rankedRun);a.cheatGiveRunBlood(2000);assert(!a.get().rankedRun);a.setState('menu');
console.log('PASS 4.3.1: hidden default entry, guarded actions and F2, exact secret phrase, invalid-code feedback, Escape cancel, session-only unlock and sticky unranked cheat use.');

a.startRun();a.CHEATS.noSpawn=true;
const cn=elements.get('game-canvas');
const pointer=(id,x,y)=>({pointerId:id,clientX:x,clientY:y,pointerType:'touch',preventDefault(){}});
cn.listeners.pointerdown(pointer(11,50,100));
cn.listeners.pointermove(pointer(11,100,100));
assert.equal(a.get().joyPointerId,11);assert(a.get().joyMag>.5);
cn.listeners.pointerdown(pointer(12,160,140));assert.equal(a.get().joyPointerId,11);
cn.listeners.lostpointercapture(pointer(12,160,140));assert(a.get().joyActive);
cn.listeners.lostpointercapture(pointer(11,100,100));assert(!a.get().joyActive);

for(let i=0;i<10;i++){a.update(.016);a.render();a.updateWildHUD();}
const px=a.get().player.x;a.keys.add('KeyD');for(let i=0;i<60;i++)a.update(1/60);a.keys.clear();assert(a.get().player.x>px+125);
a.dash();const hp=a.get().player.hp;a.damagePlayer(100,'test');assert.equal(a.get().player.hp,hp);assert(a.get().dashCooldown>0);
// Multi-level XP is queued and cannot overwrite a boss clear.
a.gainXP(150);assert(a.get().pendingLevels>2);a.flushLevels();assert.equal(a.get().state,'levelup');
while(a.get().state==='levelup')a.choose();assert.equal(a.get().pendingLevels,0);
a.checkpoint();const saved=JSON.parse(storage.get('tick_blood_gains_run_v2'));a.validateRun(saved);const xSaved=saved.player.x;
a.get().player.x=15;a.restoreRun();assert.equal(a.get().state,'paused');assert.equal(a.get().player.x,xSaved);
// Every legacy boss keeps its behavior and drawable model.
for(let encounter=0;encounter<12;encounter++){
 a.startRun();a.CHEATS.noSpawn=true;a.CHEATS.godMode=true;a.set({bossEncounters:encounter});a.spawnBoss();const b=a.get().bossActive;
 for(let i=0;i<540;i++){if(a.get().state==='levelup')a.choose();if(a.get().state==='playing')a.update(1/60);a.render();}
 if(a.get().bossActive){const before=a.get().bloodThisRun;a.killEnemy(b);const earned=a.get().bloodThisRun;assert(earned>before);assert.equal(a.get().state,'stageclear');a.killEnemy(b);assert.equal(a.get().bloodThisRun,earned);}
}
// Enemy family rendering includes all ordinary species and all life stages.
a.startRun();a.CHEATS.noSpawn=true;for(const type of ['ant','beetle','spider','wasp','mosquito','flea','drone','maggot'])a.spawnEnemy(type,{x:1850,y:1300});a.get().enemies.forEach(a.drawEnemy);
for(const level of [1,4,8,13,25]){a.get().player.level=level;a.drawTick(a.get().player);}
// Discoverable rewards, elite drops, and save validation.
let c=a.get().caches[0];a.get().player.x=c.x;a.get().player.y=c.y;a.update(.016);assert.equal(a.get().discoveries,1);
a.setState('playing');a.get().player.x=1800;a.get().player.y=1300;
const e=a.get().enemies[0];e.elite=true;a.killEnemy(e);assert.equal(a.get().elitesKilled,1);assert(a.get().orbs.some(o=>o.type==='heal'));
a.checkpoint();a.validateRun(JSON.parse(storage.get('tick_blood_gains_run_v2')));
assert.throws(()=>a.normalizeSave({bloodBank:-2}));
const bad=JSON.parse(storage.get('tick_blood_gains_run_v2'));bad.player.hp=NaN;assert.throws(()=>a.validateRun(bad));
// End-of-run rewards can be banked once only.
a.set({blood:123});const bank=a.save.bloodBank;a.endRun('test');a.endRun('again');assert.equal(a.save.bloodBank,bank+24);assert(!storage.has('tick_blood_gains_run_v2'));
// Old exports and in-browser checkpoints have no difficulty: migrate to Normal.
a.startRun('hard');a.get().player.hp=17;a.checkpoint();
const legacy=JSON.parse(storage.get('tick_blood_gains_run_v2'));delete legacy.difficulty;
assert.equal(a.validateRun(legacy).difficulty,'normal');
a.set({resumeData:legacy});a.restoreRun();assert.equal(a.get().runDifficulty,'normal');assert(a.get().player.hp>0);
assert.equal(a.normalizeSave({bloodBank:42,upg:{fangs:2}}).preferredDifficulty,'normal');
assert.equal(a.normalizeSave({preferredDifficulty:'impossible'}).preferredDifficulty,'impossible');
const invalid=JSON.parse(JSON.stringify(legacy));invalid.difficulty='__proto__';assert.throws(()=>a.validateRun(invalid));
const results=[];
for(const mode of ['easy','normal','hard','impossible']){
 a.startRun(mode);a.CHEATS.noSpawn=false;a.CHEATS.godMode=true;
 a.spawnEnemy('beetle',{x:100,y:100});const initial=a.get().enemies[0];
 const hp=initial.hp,dmg=initial.dmg,interval=a.spawnIntervalFor(0);
 a.spawnBoss();const bossHp=a.get().bossActive.hp;
 a.checkpoint();const roundTrip=JSON.parse(storage.get('tick_blood_gains_run_v2'));
 a.validateRun(roundTrip);assert.equal(roundTrip.difficulty,mode);const bossId=roundTrip.bossId;
 a.set({resumeData:roundTrip});a.restoreRun();assert.equal(a.get().runDifficulty,mode);assert.equal(a.get().bossActive.hp,bossHp);assert.equal(a.get().bossActive.id,bossId);
 a.updateWildHUD();assert(elements.get('hud-difficulty').textContent.length>0);
 // Collect a controlled spawn sample without killing or letting bugs approach.
 a.startRun(mode);a.CHEATS.noSpawn=false;
 for(let i=0;i<600;i++){a.update(.05);for(const e of a.get().enemies){e.x=30;e.y=30;}if(a.get().state==='levelup')a.choose();}
 results.push({mode,hp,dmg,interval,bossHp,count:a.get().enemies.length});
}
for(let i=1;i<results.length;i++){
 assert(results[i].hp>results[i-1].hp);assert(results[i].dmg>results[i-1].dmg);assert(results[i].interval<results[i-1].interval);assert(results[i].bossHp>results[i-1].bossHp);
}
assert.equal(results[1].hp,34);assert.equal(results[1].dmg,6);assert.equal(results[1].bossHp,150);assert.equal(results[1].interval,1.3);
a.startSwarmRun('impossible');assert.equal(a.get().runDifficulty,'impossible');a.openDifficulty(false);assert.equal(a.get().state,'difficulty');
// Slow no longer refreshes and never locks an enemy.
a.startRun();a.CHEATS.noSpawn=true;a.CHEATS.godMode=false;a.spawnEnemy('beetle',{x:2050,y:1300});let enemy=a.get().enemies[0];
assert(a.applySlow(enemy));assert(!a.applySlow(enemy));assert.equal(enemy.slowTimer,.35);assert.equal(enemy.ccCooldown,2.35);
for(let i=0;i<20;i++)a.update(.05);assert(!a.applySlow(enemy));assert(enemy.slowTimer<=0);
for(let i=0;i<30;i++)a.update(.05);assert(a.applySlow(enemy));
// Blood pulse reaches the target at 300px, not just the area around the tick.
a.startRun();a.grantUpgrade('range');a.grantUpgrade('range');a.get().player.bloodCharge=a.get().player.bloodChargeMax;a.spawnEnemy('beetle',{x:a.get().player.x+300,y:a.get().player.y});enemy=a.get().enemies[0];const beforeHP=enemy.hp;assert(a.triggerBloodBurst());assert(enemy.hp<beforeHP);
// Every evolution is unlockable with its visible recipe and has a bounded effect.
for(const evolution of a.EVOLUTIONS){a.startRun();for(const [id,n]of Object.entries(evolution.needs)){const u=a.RUN_UPGRADES.find(x=>x.id===id);for(let k=0;k<n;k++){u.apply(a.get().player);a.get().player.upgradeCounts[id]=(a.get().player.upgradeCounts[id]||0)+1;}}assert(a.evolutionReady(evolution));a.get().player.evolutions=[evolution.id];a.spawnEnemy('beetle',{x:a.get().player.x+50,y:a.get().player.y});enemy=a.get().enemies[0];enemy.hp=enemy.maxHp=500;a.applyPlayerHit(enemy,4);a.updateMajor(.05);a.render();a.renderAtlas();}
assert.equal(a.EVOLUTIONS.length,10);
// Score math and atomic ranking history, including no reward duplication.
a.save.records=[];a.startRun('hard');a.spawnEnemy('ant',{x:1900,y:1300});a.dealDamage(a.get().enemies[0],999,'spikes');assert.equal(a.scoreBreakdown().kills,3);assert.equal(a.get().runStats.damage.spikes,5);
a.endRun('test');assert.equal(a.get().lastRecord.score,4);assert(a.save.records.length>0);a.endRun('again');assert.equal(a.save.records.length,1);
// Legacy stats are not invented or allowed onto the community leaderboard.
a.startRun();a.checkpoint();let preMajor=JSON.parse(storage.get('tick_blood_gains_run_v2'));delete preMajor.major;for(const key of ['evolutions','equippedGear','shotScale','splashRadius','splashMult','execution','armor','lifeOnKill','lucky','evoTimer'])delete preMajor.player[key];a.validateRun(preMajor);assert(preMajor.major.stats.legacy);assert.equal(preMajor.major.ranked,false);
// An old owned inventory is retained, with only three active slots.
const legacyGear={magnetCollar:true,chitinPlate:true,vampiric:true,flamethrower:true};const loadouts=a.normalizeLoadouts(undefined,legacyGear);assert.equal(loadouts[0].length,3);assert(legacyGear.flamethrower);
// Fast piercing shots hit both enemies crossed between frames.
a.startRun();a.CHEATS.noSpawn=true;
a.spawnEnemy('beetle',{x:150,y:100});a.spawnEnemy('beetle',{x:220,y:100});
a.get().playerProjectiles.push({x:100,y:100,vx:3000,vy:0,radius:6,dmg:4,life:1,slow:false,pierceLeft:1,bouncesLeft:0,hitIds:[]});
a.update(.05);assert(a.get().enemies.every(e=>e.hp<e.maxHp));
// Saved loadouts actually determine next run equipment, not ownership alone.
for(const id of ['drone','rocket','zapper','flamethrower'])a.save.equip[id]=true;
a.save.loadouts=[['drone','rocket','zapper'],[],[]];a.save.activeLoadout=0;a.startRun();assert(a.get().player.hasDrone&&a.get().player.hasRocket&&a.get().player.hasZapper);assert(!a.get().player.hasFlamethrower);
a.renderLoadouts();
// Events suspend combat, commit their cost once, and preserve mutation choices.
a.startRun();a.set({blood:100});const altar=a.get().mapEvents[0];a.openMapEvent(altar);assert.equal(a.get().state,'event');const option=elements.get('event-options').children.at(-2); // altar has accept + walk away
option.click();assert.equal(a.get().bloodThisRun,70);assert.equal(a.get().state,'levelup');option.click();assert.equal(a.get().bloodThisRun,70);a.checkpoint();a.validateRun(JSON.parse(storage.get('tick_blood_gains_run_v2')));
// Economy regression: reproduce the 452M screenshot without carrying the exploit forward.
a.startRun();a.checkpoint();const inflated=JSON.parse(storage.get('tick_blood_gains_run_v2'));delete inflated.economyVersion;delete inflated.economy;inflated.bloodThisRun=452920185;inflated.killCount=1000;inflated.bossEncounters=8;inflated.player.upgradeCounts.greed=1000;inflated.player.upgradeCounts.fangs2=1000;inflated.player.bloodMult=1e40;inflated.player.spitDamage=1e35;inflated.player.level=500;inflated.major.stats.damage.spikes=1e40;
const migrated=a.validateRun(inflated);assert.equal(migrated.player.upgradeCounts.greed,3);assert.equal(migrated.player.bloodMult,1.6);assert(migrated.bloodThisRun<=25000);assert(migrated.player.spitDamage<100);assert.equal(migrated.player.level,50);assert.equal(migrated.major.ranked,false);
const once=JSON.stringify(migrated);a.validateRun(migrated);assert.equal(JSON.stringify(migrated),once);
// Rates cannot grow exponentially; rare selection genuinely has lower weight.
a.startRun();a.get().player.upgradeCounts.greed=999;assert.equal(a.bloodMultiplier(a.get().player),1.6);
let earned=0;for(let i=0;i<5000;i++)earned+=a.rewardFor({type:'wasp',elite:false}).blood;assert(earned>=30000&&earned<=35000);
a.get().player.upgradeCounts.greed=3;assert.equal(a.rewardFor({type:'wasp',elite:true}).xp,4);
const pool=a.RUN_UPGRADES;let rare=0;for(let i=0;i<10000;i++)if(pool[a.weightedIndex(pool)].id==='greed')rare++;assert(rare<200);
for(const u of pool)assert(Number.isInteger(u.maxStacks)&&u.maxStacks>0);
assert(a.xpToNext(30)>a.xpToNext(15)*2);assert(a.xpToNext(50)>a.xpToNext(30));
a.startRun();for(let i=0;i<200;i++)a.gainXP(100);assert.equal(a.get().player.level,50);assert.equal(a.get().player.xp,0);
// New boss economy is monotonic, capped, and independent of HP scaling.
assert.deepEqual(JSON.parse(JSON.stringify(a.bossRewards(0))),{blood:40,slime:8,xp:8});assert.equal(a.bossRewards(9).slime,30);assert(a.bossRewards(1000).blood<=280);assert(a.bossRewards(1000).slime<=40);
// Early exit/death: 20% Blood + 100% Slime; finale: 100% of both.
a.startRun();a.set({blood:1001,slime:17});const bank0=a.save.bloodBank,slime0=a.save.slimeBank;a.checkpoint();const stale=JSON.parse(storage.get('tick_blood_gains_run_v2'));a.endRun('exit');assert.equal(a.save.bloodBank,bank0+200);assert.equal(a.save.slimeBank,slime0+17);assert(a.save.settlements.includes(stale.major.runId));assert(!storage.has('tick_blood_gains_run_v2'));a.endRun('twice');assert.equal(a.save.bloodBank,bank0+200);
a.set({resumeData:stale});a.restoreRun();assert.equal(a.get().state,'menu');
a.startRun();a.set({bossEncounters:10,blood:1001,slime:30});const wonBank=a.save.bloodBank;a.endRun('victory');assert.equal(a.save.bloodBank,wonBank+1001);
// Bulk purchase quote spends precisely the affordable amount and respects the cap.
a.save.bloodBank=100000;const u=a.META_UPGRADES.find(x=>x.id==='fangs'),quote=a.bulkMetaQuote(u);assert.equal(quote.count,u.cap-(a.save.upg.fangs||0));assert(quote.cost<100000);
// Active fields have real damage, time limits and cooldowns; no second cast on cooldown.
a.startRun();a.CHEATS.noSpawn=true;const p=a.get().player;p.hasStaticField=true;p.hasAcidField=true;a.spawnEnemy('beetle',{x:p.x+50,y:p.y});const victim=a.get().enemies[0],hp0=victim.hp;assert(a.castField('static'));assert(victim.hp<hp0);assert(!a.castField('static'));assert.equal(p.staticCooldown,18);assert(a.castField('acid'));assert(!a.castField('acid'));assert.equal(a.get().fieldZones.length,1);for(let i=0;i<81;i++){if(a.get().state==='playing')a.update(.05);else if(a.get().state==='levelup')a.choose();}assert.equal(a.get().fieldZones.length,0);
a.checkpoint();a.validateRun(JSON.parse(storage.get('tick_blood_gains_run_v2')));
for(const u of a.RUN_UPGRADES)assert(a.modIcon(u.id).includes('<svg'));

// All 23 mods: each paid rank changes its intended stat on both fresh and max-meta profiles.
const plain=v=>JSON.parse(JSON.stringify(v));
const tracked={fangs2:'spitDamage',quickbite:'attackInterval',scuttle:'speed',carapace:'maxHp',magnet:'magnetRadius',regen:'regen',range:'spitRange',multishot:'shotCount',piercing:'pierceCount',ricochet:'ricochetCount',explosive:'explosive',crit:'critChance',numb:'numbingBite',greed:'bloodMult',burstUp:'burstDamageMult',velocity:'spitSpeed',area:'splashRadius',heavy:'shotScale',execution:'execution',armor:'armor',lifeOnKill:'lifeOnKill',reserve:'rerolls'};
const freshProfile=plain(a.save.upg),gearProfile=plain(a.save.equip),sets=plain(a.save.loadouts);
for(const maxMeta of [false,true]){
 for(const id of Object.keys(a.save.upg))a.save.upg[id]=maxMeta?a.META_CAPS[id]:0;
 for(const mod of a.RUN_UPGRADES){
  a.startRun();const p=a.get().player;
  for(let rank=1;rank<=mod.maxStacks;rank++){
   const key=tracked[mod.id],before=key==='rerolls'?a.get().rerolls:p[key];
   assert(a.upgradeEffectPreview(mod).length>0,mod.id+' preview');
   assert(a.grantUpgrade(mod.id),mod.id+' rank '+rank);
   const after=key==='rerolls'?a.get().rerolls:p[key];assert.notEqual(after,before,mod.id+' has a wasted rank');
   for(const value of Object.values(p))if(typeof value==='number')assert(Number.isFinite(value));
  }
  const before=JSON.stringify(p);assert(!a.grantUpgrade(mod.id));assert.equal(JSON.stringify(p),before);
  a.checkpoint();a.validateRun(plain(a.snapshotRun()));
 }
 a.startRun();for(const mod of a.RUN_UPGRADES)for(let n=0;n<mod.maxStacks;n++)assert(a.grantUpgrade(mod.id));
 const p=a.get().player;assert.equal(p.spitRange,500);assert.equal(p.spitSpeed,680);assert(p.speed<=311);assert(p.attackInterval>.17);assert.equal(p.bloodMult,1.6);
 const values=Object.fromEntries(Object.values(tracked).filter(x=>x!=='rerolls').map(k=>[k,p[k]]));
 a.startRun();for(const mod of [...a.RUN_UPGRADES].reverse())for(let n=0;n<mod.maxStacks;n++)a.grantUpgrade(mod.id);
 for(const [k,v]of Object.entries(values))assert.equal(a.get().player[k],v,'order-dependent '+k);
}
Object.assign(a.save.upg,freshProfile);Object.assign(a.save.equip,gearProfile);a.save.loadouts=sets;
a.save.loadouts=[[],[],[]];
// Range and velocity: real hits at every upgraded range; travel cannot overshoot its budget.
for(let rank=0;rank<=6;rank++)for(const velocity of [0,4]){
 a.startRun();a.CHEATS.noSpawn=true;a.CHEATS.godMode=true;const p=a.get().player;
 for(let i=0;i<rank;i++)a.grantUpgrade('range');for(let i=0;i<velocity;i++)a.grantUpgrade('velocity');
 a.spawnEnemy('beetle',{x:p.x+p.spitRange-4,y:p.y});const target=a.get().enemies[0];target.speed=0;target.hp=target.maxHp=10000;
 p.attackTimer=100;a.fireSpit();const shot=a.get().playerProjectiles[0];assert(shot);const x0=shot.x;
 for(let i=0;i<90;i++)a.update(1/60);
 assert(target.hp<10000,'range rank '+rank+' speed '+velocity+' failed to hit');assert(shot.x-x0<=p.spitRange+.001);
 a.startRun();const p2=a.get().player;for(let i=0;i<rank;i++)a.grantUpgrade('range');
 a.spawnEnemy('beetle',{x:p2.x+p2.spitRange+50,y:p2.y});a.fireSpit();assert.equal(a.get().playerProjectiles.length,0);
}
// Piercing shares travel range; ricochet alone grants a bounded new 200px leg.
a.startRun();a.CHEATS.noSpawn=true;let pp=a.get().player;pp.attackTimer=100;a.grantUpgrade('piercing');
a.spawnEnemy('beetle',{x:pp.x+60,y:pp.y});a.spawnEnemy('beetle',{x:pp.x+pp.spitRange+70,y:pp.y});
const near=a.get().enemies[0],far=a.get().enemies[1];near.speed=far.speed=0;near.hp=near.maxHp=1000;far.hp=far.maxHp=1000;a.fireSpit();for(let i=0;i<90;i++)a.update(1/60);assert(near.hp<1000);assert.equal(far.hp,1000);
a.startRun();pp=a.get().player;pp.attackTimer=100;a.grantUpgrade('ricochet');a.spawnEnemy('ant',{x:pp.x+90,y:pp.y});a.spawnEnemy('beetle',{x:pp.x+270,y:pp.y});let chainVictim=a.get().enemies[1];chainVictim.speed=0;chainVictim.hp=chainVictim.maxHp=1000;a.get().enemies[0].speed=0;a.fireSpit();for(let i=0;i<120;i++){if(a.get().state==='playing')a.update(1/60);}assert(chainVictim.hp<1000,JSON.stringify({chain:chainVictim,player:pp,projectiles:a.get().playerProjectiles,state:a.get().state,enemies:a.get().enemies.map(e=>({id:e.id,hp:e.hp,x:e.x,dead:e.dead}))}));
// Movement is normalized on diagonals, respects the web debuff, and has a bounded dash.
for(const maxMeta of [false,true])for(const diagonal of [false,true]){
 a.save.upg.swiftness=maxMeta?10:0;a.startRun();pp=a.get().player;for(let i=0;i<4;i++)a.grantUpgrade('scuttle');
 for(const c of a.get().caches)c.opened=true;for(const c of a.get().mapEvents)c.done=true;const x=pp.x,y=pp.y;a.keys.add('KeyD');if(diagonal)a.keys.add('KeyS');for(let i=0;i<60;i++)a.update(1/60);a.keys.clear();
 assert(Math.abs(Math.hypot(pp.x-x,pp.y-y)-pp.speed)<.001);
 pp.speedMult=.5;pp.speedMultTimer=5;assert.equal(a.effectiveMoveSpeed(pp),pp.speed*.5);
 const x2=pp.x,y2=pp.y;a.keys.add('KeyD');a.dash();for(let i=0;i<14;i++)a.update(1/60);a.keys.clear();assert(Math.hypot(pp.x-x2,pp.y-y2)<160);
}
Object.assign(a.save.upg,freshProfile);
// Boss pulse abuse: max upgrades, huge wallet, full charge and every difficulty.
for(const mode of Object.keys(a.DIFFICULTIES)){
 a.startRun(mode);a.CHEATS.noSpawn=true;pp=a.get().player;
 for(const mod of a.RUN_UPGRADES)for(let i=0;i<mod.maxStacks;i++)a.grantUpgrade(mod.id);
 pp.level=50;pp.attackTimer=100;a.set({blood:1e9});a.spawnBoss();let b=a.get().bossActive;b.x=pp.x+100;b.y=pp.y;
 const hp=b.hp;assert(!a.triggerBloodBurst());pp.bloodCharge=1e9;assert(a.triggerBloodBurst());assert(b.hp>=hp*.98-1e-8);assert(!b.dead);assert.equal(pp.bloodCharge,0);assert.equal(pp.pulseCooldown,4);
 pp.bloodCharge=1e9;assert(!a.triggerBloodBurst());
 for(let i=0;i<200;i++)a.blast(b.x,b.y,100,1e9,i%2?'splash':'rocket');assert(b.hp>=hp*.97-1e-8,'overlapping explosions bypassed cap');
 b.hp=1;b.explosionSpent=0;pp.pulseCooldown=0;assert(a.triggerBloodBurst());assert.equal(b.hp,1,'pulse finished a boss');
 pp.bloodCharge=0;a.killEnemy(b);assert.equal(pp.bloodCharge,0,'boss cash charged pulse');
}
// Actual splash is based on the original spike, not critical or execution multipliers.
a.startRun();pp=a.get().player;pp.critChance=1;pp.execution=.4;pp.evolutions=['hunter','sniper'];pp.explosive=true;
a.spawnEnemy('beetle',{x:pp.x+200,y:pp.y});a.spawnEnemy('beetle',{x:pp.x+210,y:pp.y});const direct=a.get().enemies[0],splash=a.get().enemies[1];direct.hp=100;direct.maxHp=1000;splash.hp=splash.maxHp=1000;a.applyPlayerHit(direct,10);assert(Math.abs(splash.hp-997)<1e-8);
// Lifesteal has one shared budget, including combined gear + evolution and overkill.
a.startRun();pp=a.get().player;pp.equippedGear=['vampiric'];pp.vampiric=true;pp.evolutions=['leech'];pp.hp=1;a.spawnEnemy('beetle',{x:pp.x+60,y:pp.y});let dummy=a.get().enemies[0];dummy.hp=dummy.maxHp=10000;const h=pp.hp;
for(let i=0;i<100;i++)a.applyPlayerHit(dummy,10);assert(pp.hp-h<=pp.maxHp*.02+1e-8);
// Slime accumulates across all ten bosses, survives each resume, and banks exactly once.
a.startRun();a.CHEATS.noSpawn=true;const bankBefore=a.save.slimeBank;let cumulative=0;
for(let i=0;i<10;i++){
 a.setState('playing');a.spawnBoss();const b=a.get().bossActive;a.killEnemy(b);cumulative+=a.bossRewards(i).slime;
 assert.equal(a.get().slimeThisRun,cumulative);assert.equal(a.get().slimeLedger.total,cumulative);assert.equal(a.save.slimeBank,bankBefore);assert.equal(Number(elements.get('stageclear-slime').textContent),a.bossRewards(i).slime);
 a.checkpoint();const resume=plain(a.snapshotRun());a.validateRun(resume);a.set({resumeData:resume});a.restoreRun();assert.equal(a.get().slimeThisRun,cumulative);assert.equal(a.get().state,'stageclear');
}
assert.equal(cumulative,174);a.endRun('death test');assert.equal(a.save.slimeBank,bankBefore+174);a.endRun('duplicate');assert.equal(a.save.slimeBank,bankBefore+174);
// Reproduce an unfinished old save with only 15 Slime after three bosses: repair missing rewards once.
a.startRun();a.set({bossEncounters:3,slime:15});let oldSlime=plain(a.snapshotRun());delete oldSlime.economy.slimeLedger;delete oldSlime.balanceRevision;delete oldSlime.player.baseUpgrades;oldSlime.player.speed=1e7;oldSlime.player.burstDamageMult=1e9;
a.validateRun(oldSlime);assert.equal(oldSlime.slimeThisRun,30);assert(oldSlime.player.speed<400);assert.equal(oldSlime.player.burstDamageMult,1);let repaired=JSON.stringify(oldSlime);a.validateRun(oldSlime);assert.equal(JSON.stringify(oldSlime),repaired);
a.set({resumeData:oldSlime});a.restoreRun();a.setState('playing');a.spawnBoss();a.killEnemy(a.get().bossActive);assert.equal(a.get().slimeThisRun,44);
// Changing the shop profile during a saved run cannot alter that run's paid base stats.
a.startRun();a.grantUpgrade('scuttle');a.checkpoint();const savedSpeed=a.get().player.speed;a.save.upg.swiftness=10;let stable=plain(a.snapshotRun());a.validateRun(stable);assert.equal(stable.player.speed,savedSpeed);Object.assign(a.save.upg,freshProfile);

// A death stops the same frame before pending player shots can create unbanked boss loot.
a.startRun();a.CHEATS.godMode=false;a.CHEATS.noSpawn=true;pp=a.get().player;pp.hp=.1;pp.attackTimer=100;a.spawnEnemy('beetle',{x:pp.x,y:pp.y});a.spawnBoss();let doomed=a.get().bossActive;doomed.x=pp.x+100;doomed.y=pp.y;doomed.hp=1;
a.get().playerProjectiles.push({x:pp.x+90,y:pp.y,vx:340,vy:0,radius:6,dmg:100,travelLeft:200,life:1,slow:false,pierceLeft:0,bouncesLeft:0,hitIds:[]});
const bankAtDeath=a.save.slimeBank;a.update(.05);assert.equal(a.get().state,'gameover');assert.equal(a.get().slimeThisRun,0);assert.equal(a.save.slimeBank,bankAtDeath);assert(!doomed.dead);
// An active field that kills a boss also stops movement and combat on that frame.
a.startRun();a.CHEATS.godMode=true;pp=a.get().player;pp.hasAcidField=true;a.spawnBoss();doomed=a.get().bossActive;doomed.x=pp.x+60;doomed.y=pp.y;doomed.hp=.001;a.castField('acid');const beforeClearX=pp.x;a.keys.add('KeyD');a.update(.05);a.keys.clear();assert.equal(a.get().state,'stageclear');assert.equal(pp.x,beforeClearX);assert.equal(a.get().slimeThisRun,8);


// Second Chance, like every meta upgrade, is locked to the run's starting profile.
a.save.upg.extraLife=0;a.startRun();a.CHEATS.godMode=false;a.save.upg.extraLife=1;a.damagePlayer(9999,'late shop purchase');assert.equal(a.get().state,'gameover');
a.startRun();a.save.upg.extraLife=0;a.damagePlayer(9999,'first lethal hit');assert.equal(a.get().state,'playing');assert(a.get().player.hp>0);a.get().player.invuln=0;a.damagePlayer(9999,'second lethal hit');assert.equal(a.get().state,'gameover');
// Declining an unaffordable altar must preserve it, avoid popup loops, and survive reloads.
a.save.loadouts=[[],[],[]];for(const k of Object.keys(a.save.upg))a.save.upg[k]=0;a.startRun();a.CHEATS.noSpawn=true;a.CHEATS.godMode=true;
let landmark=a.get().mapEvents[0];for(const c of a.get().mapEvents)if(c!==landmark)c.done=true;landmark.x=a.get().player.x;landmark.y=a.get().player.y;
a.openMapEvent(landmark);let buttons=elements.get('event-options').children.slice(-2);assert(buttons[0].disabled);buttons[0].click();assert(!landmark.done);assert.equal(a.get().bloodThisRun,0);
buttons[1].click();assert(!landmark.done);assert(landmark.deferUntilExit);assert.equal(a.get().runStats.events,0);a.updateMajor(.01);assert.equal(a.get().state,'playing');
a.checkpoint();let persisted=plain(a.snapshotRun());a.validateRun(persisted);assert(!persisted.major.events[0].done);assert(persisted.major.events[0].deferUntilExit);
a.get().player.x+=100;a.updateMajor(.01);assert(!landmark.deferUntilExit);a.get().player.x-=100;a.set({blood:40});a.updateMajor(.01);assert.equal(a.get().state,'event');
buttons=elements.get('event-options').children.slice(-2);buttons[0].click();assert(landmark.done);assert.equal(a.get().bloodThisRun,10);assert.equal(a.get().runStats.events,1);buttons[0].click();assert.equal(a.get().bloodThisRun,10);
// An altar with no useful remaining mutation also stays available rather than consuming itself.
a.startRun();for(const u of a.RUN_UPGRADES)for(let i=0;i<u.maxStacks;i++)a.grantUpgrade(u.id);a.set({blood:100});landmark=a.get().mapEvents[0];a.openMapEvent(landmark);buttons=elements.get('event-options').children.slice(-2);assert(buttons[0].disabled);buttons[1].click();assert(!landmark.done);assert.equal(a.get().bloodThisRun,100);
// Trial and bargain transactions consume a landmark only on a successful selection.
a.startRun();landmark=a.get().mapEvents[1];a.openMapEvent(landmark);buttons=elements.get('event-options').children.slice(-2);buttons[0].click();assert(landmark.done);assert.equal(a.get().challenge.ids.length,4);for(const id of a.get().challenge.ids)a.killEnemy(a.get().enemies.find(e=>e.id===id));const prior=a.get().bloodThisRun;a.updateMajor(.01);assert.equal(a.get().bloodThisRun,prior+90);assert.equal(a.get().runStats.events,1);
a.startRun();landmark=a.get().mapEvents[3];a.openMapEvent(landmark);elements.get('event-options').children.at(-2).click();let bp=a.get().player;assert.equal(bp.bargains,1);assert.equal(bp.maxHp,27);assert(Math.abs(bp.spitDamage-4.8)<1e-8);a.grantUpgrade('fangs2');assert(Math.abs(bp.spitDamage-8.4)<1e-8);let bargainSave=plain(a.snapshotRun());a.validateRun(bargainSave);assert.equal(bargainSave.player.bargains,1);assert(Math.abs(bargainSave.player.spitDamage-8.4)<1e-8);
bp.marketBuys.vitality=1;a.MARKET_OFFERS.find(o=>o.id==='vitality').apply();assert.equal(bp.maxHp,32);
// No splash/cleave may originate from a piercing or ricochet projectile, including its first hit.
for(const traits of [[],['piercing'],['ricochet'],['piercing','ricochet']]){
 a.startRun();a.CHEATS.noSpawn=true;a.CHEATS.godMode=true;let p=a.get().player;p.attackTimer=999;a.grantUpgrade('explosive');for(const id of traits)a.grantUpgrade(id);
 a.spawnEnemy('beetle',{x:p.x+80,y:p.y});a.spawnEnemy('beetle',{x:p.x+90,y:p.y+50});let primary=a.get().enemies[0],secondary=a.get().enemies[1];primary.speed=secondary.speed=0;primary.hp=primary.maxHp=10000;secondary.hp=secondary.maxHp=10000;a.fireSpit();const projectile=a.get().playerProjectiles[0];assert.equal(projectile.canCleave,traits.length===0);for(let i=0;i<30;i++)a.update(1/60);
 assert(primary.hp<10000);if(traits.length)assert.equal(secondary.hp,10000);else assert(secondary.hp<10000);
 a.checkpoint();let snap=plain(a.snapshotRun());a.validateRun(snap);assert.equal(snap.playerProjectiles.every(p=>typeof p.canCleave==='boolean'),true);
}
// All six roles render, preserve combat state and rewards, and announce their dangerous attacks.
const {VALUES:serverValues}=await import('../worker/handler.mjs');for(const [id,value]of Object.entries(a.KILL_VALUES))assert.equal(serverValues[id],value,'client/server score mismatch: '+id);
for(const mode of Object.keys(a.DIFFICULTIES))for(const type of a.NEW_ENEMY_IDS){
 a.startRun(mode);a.CHEATS.noSpawn=true;a.CHEATS.godMode=true;let p=a.get().player;p.attackTimer=999;for(const c of a.get().mapEvents)c.done=true;for(const c of a.get().caches)c.opened=true;
 a.spawnEnemy(type,{x:p.x+190,y:p.y});const mob=a.get().enemies[0];mob.skillTimer=0;
 if(type==='firefly'){a.spawnEnemy('beetle',{x:mob.x+30,y:mob.y});a.get().enemies[1].speed=0;a.get().enemies[1].hp=1;}
 let warned=false,attacked=false;const initialX=mob.x;
 for(let i=0;i<150;i++){a.update(1/60);if(mob.skillPhase==='warn')warned=true;if(mob.skillPhase==='dash'||a.get().hazards.length||a.get().enemyProjectiles.length||type==='firefly'&&a.get().enemies[1].hp>1)attacked=true;a.drawEnemy(mob);}
 if(!['guard','spore'].includes(type)){assert(warned,type+' has no telegraph');assert(attacked,type+' attack failed');}
 if(['guard','rhino','spore'].includes(type))assert(mob.x!==initialX,type+' did not move');assert(a.rewardFor(mob).blood>0);assert(a.rewardFor(mob).xp>0);
 a.checkpoint();const resumed=plain(a.snapshotRun());a.validateRun(resumed);assert.equal(resumed.enemies[0].skillPhase,mob.skillPhase);
}
// Frontal shield protection is directional, and healing cannot restore boss health.
a.startRun();let p42=a.get().player;a.spawnEnemy('guard',{x:p42.x+100,y:p42.y});let guard=a.get().enemies[0];guard.shieldAngle=Math.PI;const guardHP=guard.hp;a.applyPlayerHit(guard,10);assert(Math.abs(guard.hp-(guardHP-6.5))<1e-8);guard.shieldAngle=0;a.applyPlayerHit(guard,10);assert(Math.abs(guard.hp-(guardHP-16.5))<1e-8);
a.startRun();p42=a.get().player;a.spawnEnemy('firefly',{x:p42.x+200,y:p42.y});const healer=a.get().enemies[0];a.spawnBoss();const boss42=a.get().bossActive;boss42.x=healer.x+20;boss42.y=healer.y;boss42.hp=1;healer.skillPhase='warn';healer.skillTime=0;a.updateWildEnemy(healer,.01,-200,0,200,1);assert.equal(boss42.hp,1);
a.startRun();for(let i=0;i<10;i++)a.spawnEnemy('firefly',{x:100+i*10,y:100});assert.equal(a.get().enemies.length,2);
// Spores warn before damage, expire, and are not confused with harmless dash puffs.
a.startRun();a.CHEATS.godMode=false;p42=a.get().player;p42.attackTimer=999;a.spawnEnemy('spore',{x:p42.x,y:p42.y});a.killEnemy(a.get().enemies[0]);const beforeSpores=p42.hp;for(let i=0;i<30;i++)a.update(1/60);assert.equal(p42.hp,beforeSpores);for(let i=0;i<50;i++)a.update(1/60);assert(p42.hp<beforeSpores);for(let i=0;i<160;i++)a.update(1/60);assert.equal(a.get().hazards.length,0);
a.startRun();a.CHEATS.godMode=true;p42=a.get().player;p42.facing=0;a.dash();assert(a.get().dashClouds.length>0);assert.equal(a.get().hazards.length,0);assert(a.get().dashClouds[0].x<p42.x);for(let i=0;i<100;i++)a.update(1/60);assert.equal(a.get().dashClouds.length,0);assert.equal(a.get().hazards.length,0);
// World models cover every cache/landmark category, including an opened chest.
for(let kind=0;kind<3;kind++)for(const opened of [false,true])a.drawCacheModel({x:100,y:100,kind,opened});for(let type=0;type<4;type++)a.drawLandmark({x:100,y:100,type});for(const type of ['chest','spire','arena','tent','stall'])a.drawMapGlyph(0,0,type,'#ffffff');
assert(a.STAGES.slice(1).every(s=>s.pool.some(k=>a.NEW_ENEMY_IDS.includes(k))));for(const type of a.NEW_ENEMY_IDS)assert(a.swarmPoolFor(350).includes(type));

// Saved projectile traits and new attack timers are supplied to older checkpoints.
a.startRun();a.grantUpgrade('piercing');a.spawnEnemy('beetle',{x:a.get().player.x+100,y:a.get().player.y});a.fireSpit();const before42=plain(a.snapshotRun());for(const e of before42.enemies)for(const k of ['skillPhase','skillTimer','skillTime','aimX','aimY','aimAngle','shieldAngle','healFlash'])delete e[k];for(const pr of before42.playerProjectiles)delete pr.canCleave;a.validateRun(before42);assert.equal(before42.enemies[0].skillPhase,'idle');assert.equal(before42.playerProjectiles[0].canCleave,false);
// Chain shots approaching from behind bypass the front shield, regardless of player position.
a.startRun();const frontPlayer=a.get().player;a.spawnEnemy('guard',{x:frontPlayer.x+100,y:frontPlayer.y});const shieldGuard=a.get().enemies[0];shieldGuard.shieldAngle=Math.PI;const fullGuardHP=shieldGuard.hp;a.applyPlayerHit(shieldGuard,10,'spikes',false,{x:shieldGuard.x+50,y:shieldGuard.y});assert.equal(shieldGuard.hp,fullGuardHP-10);


// Cleave stays off after the pierce/bounce counter has been consumed on an earlier target.
for(const trait of ['piercing','ricochet']){a.startRun();a.CHEATS.noSpawn=true;a.CHEATS.godMode=true;const p=a.get().player;p.attackTimer=999;a.grantUpgrade('explosive');a.grantUpgrade(trait);a.spawnEnemy('ant',{x:p.x+80,y:p.y});a.spawnEnemy('beetle',{x:p.x+140,y:p.y});a.spawnEnemy('beetle',{x:p.x+140,y:p.y+50});for(const e of a.get().enemies)e.speed=0;const first=a.get().enemies[0],next=a.get().enemies[1],bystander=a.get().enemies[2];first.hp=1;next.hp=next.maxHp=10000;bystander.hp=bystander.maxHp=10000;a.fireSpit();for(let i=0;i<60;i++)a.update(1/60);assert(first.dead);assert(next.hp<10000);assert.equal(bystander.hp,10000,trait+' enabled cleave after consuming its counter');}
// Equipped items, not stale boolean flags, determine every gear effect immediately.
for(const id of ['vampiric','chitinPlate','magnetCollar','acidField','staticField','rocket','chickenCannon','drone'])a.save.equip[id]=true;
a.save.loadouts=[['vampiric','chitinPlate','magnetCollar'],[],[]];a.save.activeLoadout=0;a.startRun();let p43=a.get().player;p43.hp=1;p43.staticCooldown=8;p43.acidCooldown=9;a.spawnEnemy('beetle',{x:p43.x+60,y:p43.y});let dummy43=a.get().enemies[0];dummy43.hp=dummy43.maxHp=10000;
a.dealDamage(dummy43,10);assert(Math.abs(p43.hp-1.2)<1e-8);const gearHP=p43.hp;const gearMax=p43.maxHp;a.selectLoadout(1);assert(!p43.vampiric);assert.equal(p43.dmgReduction,1);assert.equal(p43.magnetRadius,46);assert.equal(p43.hp,gearHP);assert.equal(p43.maxHp,gearMax);assert.equal(p43.staticCooldown,8);assert.equal(p43.acidCooldown,9);a.dealDamage(dummy43,10);assert.equal(p43.hp,gearHP);
p43.vampiric=true;a.dealDamage(dummy43,10);assert.equal(p43.hp,gearHP,'a stale flag granted healing');p43.evolutions=['leech'];a.applyPlayerHit(dummy43,10);assert(p43.hp>gearHP);assert(a.healingSourcesText().includes('клык 0%'));assert(a.healingSourcesText().includes('Кровопийца» 2%'));
// Gear changes in the menu must update the dormant checkpoint too, without reopening combat.
a.checkpoint();a.setState('menu');a.selectLoadout(0);assert.equal(a.get().state,'menu');assert(a.get().resumeData.player.vampiric);a.restoreRun();assert(a.get().player.vampiric);a.selectLoadout(1);a.checkpoint();let stale43=plain(a.snapshotRun());stale43.player.vampiric=true;stale43.player.hasDrone=true;stale43.player.hasChickenCannon=true;stale43.player.dmgReduction=.01;a.validateRun(stale43);assert(!stale43.player.vampiric);assert(!stale43.player.hasDrone);assert(!stale43.player.hasChickenCannon);assert.equal(stale43.player.dmgReduction,1);
// Removing field gear clears ongoing gear attacks; a paid field rental survives preset switching.
a.save.loadouts[0]=['acidField','staticField','rocket'];a.selectLoadout(0);p43=a.get().player;a.setState('playing');p43.acidCooldown=0;assert(a.castField('acid'));assert(a.get().fieldZones.length);a.selectLoadout(1);assert.equal(a.get().fieldZones.length,0);assert(!p43.hasAcidField);p43.marketBuys.acidRental=1;a.selectLoadout(0);a.selectLoadout(1);assert(p43.hasAcidField);assert(!p43.hasStaticField);
// Chain and pierce add hit capacity: chain needs kills, pierce works on surviving bugs.
for(const [pierce,chain]of [[1,1],[2,2],[3,2]]){
 a.save.loadouts=[[],[],[]];a.startRun();a.CHEATS.noSpawn=true;a.CHEATS.godMode=true;p43=a.get().player;p43.attackTimer=999;for(const ev of a.get().mapEvents)ev.done=true;for(const c of a.get().caches)c.opened=true;
 a.grantUpgrade('explosive');for(let n=0;n<pierce;n++)a.grantUpgrade('piercing');for(let n=0;n<chain;n++)a.grantUpgrade('ricochet');
 // Early kills spend chain; the remaining nonlethal line spends pierce, then stops.
 for(let n=0;n<1+pierce+chain+1;n++){a.spawnEnemy('beetle',{x:p43.x+60+n*42,y:p43.y});const mob=a.get().enemies.at(-1);mob.speed=0;mob.hp=n<chain?1:10000;mob.maxHp=10000;}
 a.spawnEnemy('beetle',{x:p43.x+60,y:p43.y+52});const bystander43=a.get().enemies.at(-1);bystander43.speed=0;bystander43.hp=bystander43.maxHp=10000;a.fireSpit();const shot43=a.get().playerProjectiles[0];for(let n=0;n<180;n++)a.update(1/60);
 const victims43=a.get().enemies.filter(e=>e!==bystander43&&(e.dead||e.hp<10000));assert.equal(victims43.length+chain,1+pierce+chain,'stack hit count');assert.equal(shot43.hitIds.length,1+pierce+chain);assert.equal(new Set(shot43.hitIds).size,shot43.hitIds.length);assert.equal(bystander43.hp,10000);assert(!a.projectileCanCleave(shot43));
}
// Drone copies cannot sneak splash back into a pierce/chain build.
a.save.activeLoadout=0;a.save.loadouts[0]=['drone'];a.startRun();a.grantUpgrade('piercing');a.grantUpgrade('ricochet');a.grantUpgrade('explosive');p43=a.get().player;a.spawnEnemy('beetle',{x:p43.x+100,y:p43.y});a.fireSpit();assert(a.get().playerProjectiles.some(p=>p.fromDrone));for(const pr of a.get().playerProjectiles){assert(pr.specialShot);assert(!a.projectileCanCleave(pr));pr.pierceLeft=pr.bouncesLeft=0;pr.canCleave=true;assert(!a.projectileCanCleave(pr));}let specialSave43=plain(a.snapshotRun());a.validateRun(specialSave43);assert(specialSave43.playerProjectiles.every(p=>p.canCleave===false));
// Secret purchase is exactly 10,000 Slime; owning alone never equips it or charges twice.
a.save.loadouts=[[],[],[]];a.save.equip.chickenCannon=false;a.save.slimeBank=9999;a.startRun();assert.equal(a.changeGearSelection('chickenCannon'),false);assert.equal(a.save.slimeBank,9999);a.save.slimeBank=10000;a.renderLoadouts();const cannonCard43=elements.get('equip-tags').children.at(-1);assert(cannonCard43.innerHTML.includes('Куромёт'));assert(cannonCard43.innerHTML.includes('10000'));assert(!cannonCard43.innerHTML.includes('<p>'));assert.equal(a.EQUIPMENT_DEFS.find(e=>e.id==='chickenCannon').desc,undefined);cannonCard43.children[0].click();cannonCard43.children[0].click();assert.equal(a.save.slimeBank,0);assert(a.save.equip.chickenCannon);assert(!a.get().player.hasChickenCannon);a.changeGearSelection('chickenCannon');assert(a.get().player.hasChickenCannon);
const sound43=[];const originalPlay43=a.gameAudio.play;a.gameAudio.play=kind=>sound43.push(kind);a.fireSpit();assert.equal(a.get().player.chickenShots,0,'empty volleys are not shots');p43=a.get().player;a.spawnEnemy('beetle',{x:p43.x+100,y:p43.y});for(let n=0;n<9;n++)a.fireSpit();assert.equal(sound43.filter(k=>k==='cluck').length,0);a.fireSpit();assert.equal(sound43.filter(k=>k==='cluck').length,1);assert(a.get().playerProjectiles.every(p=>p.chicken));a.drawChickenProjectile(a.get().playerProjectiles[0]);a.checkpoint();a.restoreRun();assert.equal(a.get().player.chickenShots,10);a.setState('playing');for(let n=0;n<10;n++)a.fireSpit();assert.equal(sound43.filter(k=>k==='cluck').length,2);a.changeGearSelection('chickenCannon');a.fireSpit();assert.equal(a.get().playerProjectiles.at(-1).chicken,false);
// Multishot counts actual primary shots; drone shots do not count as chickens.
a.save.loadouts[0]=['chickenCannon','drone'];a.startRun();a.grantUpgrade('multishot');p43=a.get().player;a.spawnEnemy('beetle',{x:p43.x+100,y:p43.y});a.spawnEnemy('beetle',{x:p43.x+120,y:p43.y+30});a.fireSpit();assert.equal(p43.chickenShots,2);assert.equal(a.get().playerProjectiles.filter(p=>p.chicken).length,2);assert.equal(a.get().playerProjectiles.filter(p=>p.fromDrone&&!p.chicken).length,1);
// Original attached clips are embedded byte-for-byte. Death is distinct from manual settlement.
for(const [kind,hash]of [['boss', '09c0b4b40c1f28e916776265a2cdc4d3d79e44bc0cedd12fec5e83e098e69c56'], ['death', '7edf853350af9ed53574aeac166af526086dbab0d32bc5bdc866494cc71cab42']])assert.equal(require('crypto').createHash('sha256').update(Buffer.from(a.AUDIO_CLIPS[kind].split(',')[1],'base64')).digest('hex'),hash);
sound43.length=0;a.startRun();a.endRun('exit');assert(!sound43.includes('death'));a.startRun();a.CHEATS.godMode=false;a.get().player.invuln=0;a.get().player.baseUpgrades.extraLife=0;a.damagePlayer(99999,'test death');assert.equal(sound43.filter(k=>k==='death').length,1);a.gameAudio.play=originalPlay43;
// Browser autoplay lock, mute, volume clamp, throttling and terminal-cue priority.
let clock43=0,settings43={enabled:true,volume:.35},emits43=[];const gate43=a.createSoundGate({settings:()=>settings43,now:()=>clock43,emit:(...args)=>emits43.push(args)});assert(!gate43.play('shot'));gate43.unlock();assert(gate43.play('shot'));assert(!gate43.play('shot'));clock43=.13;assert(gate43.play('shot'));settings43.enabled=false;clock43=1;assert(!gate43.play('death'));settings43.enabled=true;settings43.volume=0;assert(!gate43.play('shot'));settings43.volume=2;assert(gate43.play('boss'));assert.equal(emits43.at(-1)[1],1);clock43=1.1;assert(!gate43.play('shot'));clock43=2;assert(gate43.play('cluck'));clock43=2.01;assert(gate43.play('cluck'));assert(gate43.play('death'));clock43=3;assert(!gate43.play('shot'));clock43=5;assert(gate43.play('shot'));
assert.deepEqual(plain(a.normalizeSave({}).audio),{enabled:true,volume:.35});assert.deepEqual(plain(a.normalizeSave({audio:{enabled:false,volume:-3}}).audio),{enabled:false,volume:0});assert.equal(a.normalizeSave({audio:{volume:3}}).audio.volume,1);
console.log('PASS 4.3: immediate gear removal and dormant checkpoint migration, independent healing sources, cooldown/HP preservation, rental fields, additive chain+pierce and no duplicate/splash hits, drone isolation, exact secret purchase, chicken model/count/resume, original audio bytes, death vs extraction, autoplay/mute/throttle/priority controls.');

console.log('PASS 4.2: persistent unaffordable/declined shrines and re-entry, capped altar choices, one-time arena payment, persistent bargains, no cleave on first or later piercing/chain hits, six telegraphed roles on four difficulties, directional guard armor, no boss healing, role caps, delayed spores, harmless dash clouds, all landmark/cache models and server score parity.');

console.log('PASS 4.1: every rank of all 23 mods at both meta extremes, order independence, exact range/velocity travel and hits, piercing/ricochet, diagonal movement/webs/dash, maxed pulse on every difficulty, shared boss explosion budget, splash/crit isolation, bounded lifesteal, ten-boss 174 Slime settlement with reloads, 15→30 legacy Slime repair and stable run base stats.');

console.log('PASS: 452M legacy windfall migration and idempotency, additive Greed cap, weighted rarity, XP curve and level cap, bounded boss rewards, once-only payouts, stale checkpoint rejection, bulk costs, field damage/cooldowns and mutation icons.');
console.log('Economy sample:',JSON.stringify({bloodPer5000Wasps:earned,greedDrawsPer10000:rare,xpAt10:a.xpToNext(10),xpAt30:a.xpToNext(30),xpAt50:a.xpToNext(50),legacyBlood:migrated.bloodThisRun}));
console.log('PASS: swept piercing collisions, equipped vs owned gear, event pause, one-time cost and event checkpoint.');
console.log('PASS: slow immunity, long-range targeted pulse, 10 evolution recipes and effects, actual-HP damage accounting, score formula, run result idempotency, legacy field migration and loadout preservation.');
console.log('Difficulty checks:',JSON.stringify(results));
console.log('PASS: four difficulties, Normal baseline, separate boss scaling, spawn pressure, both game modes, old save migration, round-trip difficulty and unchanged restored HP.');
console.log('PASS: movement, dash invulnerability, queued levels, checkpoint/restore, 12 boss encounters, 8 enemy models, 5 evolution renders, cache reward, elite drop, invalid save rejection, single reward banking.');
})().catch(e=>{console.error(e);process.exit(1);});
