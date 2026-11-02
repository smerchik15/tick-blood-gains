const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const prefix=fs.readFileSync(path.join(__dirname,'balance.cjs'),'utf8').split('code=code.replace')[0].replace("fs.readFileSync(require('path').join(__dirname,'../game.html'),'utf8')",'globalThis.inputHTML');
function boot({html=fs.readFileSync(path.join(__dirname,'../game.html'),'utf8'),api='',measure=false}={}){
 const counters={draw:0,geometry:0,dom:0},host={require,__dirname,console,Blob,URL,setImmediate,inputHTML:html,counters,measure};vm.createContext(host);
 const exposed=`globalThis.api={startRun,startSwarmRun,spawnEnemy,spawnBoss,killEnemy,pressShield,shieldSpec,update,render,loop,resize,fireSpit,findBounceTarget,blast,snapshotRun,validateRun,restore:r=>{resumeData=r;restoreRun();},save,CHEATS,setState,
 get:()=>({player,enemies,orbs,enemyProjectiles,playerProjectiles,boss:bossActive,elapsed,state,bloodThisRun,runStats,killCount,DPR}),
 setup:(mode='impossible',floor=0)=>{startRun(mode);CHEATS.noSpawn=true;CHEATS.godMode=true;runSeed=71;bossEncounters=floor;slimeThisRun=totalBossSlime(floor);slimeLedger={count:floor,total:slimeThisRun,legacyCount:floor,legacyTotal:slimeThisRun};enterJourneyFloor(floor);currentStageIdx=stageIndexForEncounter(floor);nextBossAt=1e9;for(const c of caches)c.opened=true;for(const e of mapEvents)e.done=true;player.attackTimer=1e9;},
 setTime:t=>{elapsed=t;},spawnAt:(n)=>{bossEncounters=n;spawnBoss();},${api}};})();`;
 const instrument=`if(measure){const getElement=document.getElementById;document.getElementById=id=>{counters.dom++;return getElement(id);};for(const key of ['fill','stroke','arc','ellipse','lineTo','bezierCurveTo','quadraticCurveTo','fillRect','strokeRect','drawImage','fillText','strokeText']){context[key]=()=>{counters.draw++;if(!['drawImage','fillText','strokeText'].includes(key))counters.geometry++;};}const descriptor=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');Object.defineProperty(Element.prototype,'innerHTML',{get:descriptor.get,set(v){counters.dom++;descriptor.set.call(this,v);}});}`;
 vm.runInContext(prefix+instrument+`code=code.replace(/\\}\\)\\(\\);\\s*$/,${JSON.stringify(exposed)});vm.createContext(sandbox);try{vm.runInContext(code,sandbox);}catch(e){throw Error(e.message);}globalThis.result={a:sandbox.api,sandbox,elements,storage,counters,windowListeners};`,host);
 return host.result;
}
module.exports={boot};
