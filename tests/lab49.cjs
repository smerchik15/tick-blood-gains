const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const harness=fs.readFileSync(path.join(__dirname,'balance.cjs'),'utf8').split('code=code.replace')[0];
const api=`globalThis.api={CHEATS,startRun,buildStats,damagePlayer,gearPower,dealDamage,spinGambino,gambinoOutcome,labCost,labBuy,openGambino,openLabPrep,closeLab,grantUpgrade,spawnEnemy,spawnBoss,update,save,META_CAPS,EQUIPMENT_DEFS,validateRun,snapshotRun,restoreRun,setState,showUpgradeChoices,replaceLabMutation,openMapEvent,effectiveMoveSpeed,render,updateEconomy,get:()=>({state,player,bloodThisRun,elapsed,runStats,mapEvents,mutationContext,enemies,challenge}),money:n=>bloodThisRun=n,resume:r=>{resumeData=r;restoreRun();}};})();`;
const host={require,__dirname,console,Blob,URL,setImmediate};vm.createContext(host);vm.runInContext(harness+`code=code.replace(/\\}\\)\\(\\);\\s*$/,${JSON.stringify(api)});vm.createContext(sandbox);vm.runInContext(code,sandbox);globalThis.result={a:sandbox.api,elements,sandbox,storage};`,host);
(async()=>{await new Promise(r=>setImmediate(r));const {a,elements,sandbox,storage}=host.result;
const plain=x=>JSON.parse(JSON.stringify(x));
a.startRun('impossible');const base=a.get().player.spitDamage/a.get().player.attackInterval;
for(const [k,v]of Object.entries(a.META_CAPS))a.save.upg[k]=v;
a.startRun('impossible');let p=a.get().player;const max=p.spitDamage/p.attackInterval;assert(max/base<=4/3);assert.equal(a.gearPower(p),.15);assert(p.maxHp<=40);assert(p.speed<=150);assert(p.regen<=.1);
for(const id of ['fangs2','quickbite','heavy','multishot'])for(let i=0;i<3;i++)a.grantUpgrade(id);assert.equal(a.gearPower(p),1);
const counts={};for(let i=0;i<1000000;i++){const k=a.gambinoOutcome((i+.5)/1000000);counts[k]=(counts[k]||0)+1;}assert.deepEqual(counts,{hint:100,gear:1000,guard:20000,damage:15000,speed:13900,half:130000,quarter:80000,jackpot:10000,loss:730000});
a.startRun();a.money(10000);a.openGambino();const random=sandbox.Math.random;
for(const [roll,result,mult]of [[.9,'loss',0],[.1,'half',.5],[.2,'quarter',.25],[.265,'jackpot',10]]){const before=a.get().bloodThisRun,cost=a.labCost('spin');sandbox.Math.random=()=>roll;assert.equal(a.spinGambino(),result);assert.equal(a.get().bloodThisRun,before-cost+Math.floor(cost*mult));}sandbox.Math.random=random;
const before=a.get().bloodThisRun;a.setState('playing');assert.equal(a.spinGambino(),false);assert.equal(a.get().bloodThisRun,before);
a.openGambino();sandbox.Math.random=()=>.0005;const owned=Object.values(a.save.equip).filter(Boolean).length;assert.equal(a.spinGambino(),'gear');assert.equal(Object.values(a.save.equip).filter(Boolean).length,owned+1);sandbox.Math.random=()=>.00005;assert.equal(a.spinGambino(),'hint');assert.equal(a.get().player.lab.receipt,String.fromCharCode(84,104,101,114,101,73,115,78,111,83,112,111,111,110));sandbox.Math.random=random;
a.closeLab();a.setState('paused');assert(a.labBuy('guard'));assert(!a.labBuy('guard'));a.setState('playing');p=a.get().player;p.invuln=0;const hp=p.hp;a.damagePlayer(20,'test');assert.equal(p.hp,hp);assert.equal(p.lab.guard,0);
a.setState('paused');assert(a.labBuy('damage'));assert(!a.labBuy('damage'));assert(a.labBuy('speed'));a.setState('playing');a.spawnEnemy('beetle',{x:p.x+200,y:p.y});let mob=a.get().enemies.at(-1);mob.hp=mob.maxHp=10000;assert.equal(a.dealDamage(mob,10,'spikes'),20);assert(a.effectiveMoveSpeed(p)>=p.speed*2);
const saved=plain(a.snapshotRun()),purchases=p.lab.purchases;a.validateRun(saved);a.resume(saved);assert.equal(a.get().player.lab.purchases,purchases);assert.equal(a.get().state,'paused');assert.equal(a.get().player.lab.damageUntil,p.lab.damageUntil);
a.CHEATS.godMode=true;for(const c of a.get().mapEvents)c.done=true;a.setState('playing');for(let i=0;i<1300;i++){a.update(1/60);if(a.get().state==='levelup')a.setState('playing');}p=a.get().player;assert(p.lab.damageUntil<=a.get().elapsed);assert(p.lab.speedUntil<=a.get().elapsed);
a.startRun();a.money(2000);a.setState('paused');assert(a.labBuy('nest'));a.setState('playing');const nest=a.get().mapEvents.find(c=>c.type===1);a.openMapEvent(nest);elements.get('event-options').children.at(-2).click();assert.equal(a.get().challenge.reward,180);assert(!a.get().player.lab.nest);
a.startRun();a.money(5000);a.showUpgradeChoices('test','test','playing');const context=a.get().mutationContext,old=context.picks[0];assert(a.replaceLabMutation(old,context));assert(!a.get().mutationContext.picks.includes(old));assert(!a.replaceLabMutation(old,context));
a.startRun();assert.equal(a.get().player.lab.purchases,0);assert.equal(a.get().player.lab.spins,0);assert(a.get().mapEvents.some(c=>c.type===4&&c.seen));assert([...storage.keys()].every(k=>!['tick_blood_gains_save_v1','tick_blood_gains_run_v2'].includes(k)));
console.log('PASS lab49: meta offense '+(100*(1-base/max)).toFixed(1)+'% of output; exact million-roll distribution; spending, payouts, equipment, hidden hint, guards, buffs, expiry, save/restore, nest, targeted replacement and separate storage.');
console.log(counts);
})().catch(e=>{console.error(e);process.exit(1);});



