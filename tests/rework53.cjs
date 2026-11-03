const {boot}=require('./runtime-harness.cjs'),assert=require('node:assert/strict');
const extra=`startMirrorArena,finishMirrorArena,leaveMirrorArena,hasAllStones,STONES,unlockSecretMode,weatherDamage,updateWorldEvents,startWorldEvent,normalizeSave,dealDamage,unlockAchievement,checkAchievements,grantUpgrade,castField,
 setBlood:n=>{bloodThisRun=n;rankedRun=true;},world:()=>worldEvent,progress:n=>{bossEncounters=n;},mirror:()=>mirrorSession,
 completeStones:()=>{for(const s of STONES)save.stones[s.id]=true;},checkpoint,
 prepareMirror:()=>{CHEATS.godMode=false;CHEATS.noSpawn=true;CHEATS.oneShot=false;CHEATS.turbo=false;bossActive.mirrorBrain.timer=0;player.attackTimer=1e9;},
 storeBuild:()=>{checkpoint();resumeData=snapshotRun();setState('menu');},`;
(async()=>{
 const {a,elements}=boot({api:extra});await new Promise(r=>setImmediate(r));
 a.setup();a.setState('menu');assert(!a.startMirrorArena());a.completeStones();a.setState('paused');assert(!a.startMirrorArena(),'entry only from menu tick');
 a.setup('normal');let p=a.get().player;p.hasRocket=true;p.hasDrone=true;p.hasZapper=true;p.hasFlamethrower=true;p.hasStaticField=true;p.hasAcidField=true;
 // Paid equipment and mutation ranks are the source of truth when a run is restored.
 for(const id of ['rocket','drone','zapper'])a.save.equip[id]=true;a.save.loadouts[0]=['rocket','drone','zapper'];
 for(const id of ['fangs2','quickbite','heavy','explosive','piercing','crit'])a.grantUpgrade(id);
 a.storeBuild();const original=JSON.stringify(a.snapshotRun());assert(a.startMirrorArena());a.prepareMirror();let e=a.get().boss;p=a.get().player;
 assert.equal(e.speed,p.speed);assert.equal(e.radius,p.radius);assert.equal(e.mirrorBuild.spitDamage,p.spitDamage);assert.equal(e.mirrorBuild.spitSpeed,p.spitSpeed);assert.equal(e.mirrorBuild.pierceCount,p.pierceCount);assert(e.maxHp>p.maxHp);assert(e.mirrorBuild.hasRocket&&e.mirrorBuild.hasDrone&&e.mirrorBuild.hasZapper);
 p.hp=p.maxHp=100000;p.invuln=0;e.x=p.x+120;e.y=p.y;e.mirrorBuild.attackTimer=0;
 const regularShots=a.get().playerProjectiles;for(let i=0;i<120;i++)a.update(1/60);
 assert.equal(a.get().playerProjectiles,regularShots,'hostile shots stay in their own simulation');assert.equal(a.get().player,p,'actor restored after mirrored combat');assert(p.hp<100000,'copied weapons hit the real player');assert(e.mirrorRockets.length||e.mirrorBuild.rocketTimer>0,'copied rocket fires');assert(e.mirrorBuild.attackTimer<=e.mirrorBuild.attackInterval);
 e.mirrorBuild.shieldActiveTimer=2;const hp=e.hp;assert.equal(a.dealDamage(e,100,'spikes'),0);assert.equal(e.hp,hp);
 const bank=a.save.bloodBank;a.finishMirrorArena(true);assert(a.save.bowSkin);assert.equal(a.save.skin,'bow');assert(a.save.achievements.mirror);assert.equal(a.save.bloodBank,bank);assert(a.normalizeSave(a.save).bowSkin);a.leaveMirrorArena();assert.equal(a.get().state,'paused');
 for(const mode of ['normal','hard','impossible']){let previous=0;for(const floor of [0,10,25,50]){a.setup(mode,floor);const d=a.weatherDamage('shampoo');assert(d>previous);previous=d;}}
 for(const kind of ['storm','shake','heat','shampoo','eye']){a.setup('impossible',20);a.save.equip.fireSuit=false;a.save.equip.assassinCloak=false;p=a.get().player;a.CHEATS.godMode=false;p.hp=p.maxHp=10000;p.invuln=0;a.startWorldEvent(kind);const w=a.world();w.warn=0;w.tick=0;w.phase=2.5;w.x=p.x-100;w.y=p.y;w.angle=0;w.zones=kind==='shampoo'?[{x:p.x,y:p.y,r:100}]:[];if(kind==='shake')p.x=(Math.PI/2+5)/.012-p.y;if(kind==='storm')p.x=(Math.PI/2+2.5-p.y*.008)/.012;a.updateWorldEvents(.001);assert(p.hp<10000,kind+' damages during a visible dangerous phase');}
 a.setup('impossible');a.CHEATS.godMode=false;a.setBlood(5000);a.progress(26);a.checkAchievements();assert(a.save.achievements.engorged&&a.save.achievements.impossible&&a.save.achievements.dog);
 const profile=a.normalizeSave({});assert.deepEqual(Object.keys(profile.achievements),[]);assert(!profile.bowSkin);assert.equal(profile.skin,'default');
 console.log('PASS 5.3: build-copy weapons, gear, defenses, damage isolation, mirror entry/reward, weather scaling and all event damage, milestone persistence and old-profile defaults.');
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
