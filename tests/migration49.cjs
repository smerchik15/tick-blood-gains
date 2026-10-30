const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),current=fs.readFileSync(path.join(root,'game.html'),'utf8');
const baseline=cp.execFileSync('git',['show','50c49ac:game.html'],{cwd:root,encoding:'utf8',maxBuffer:12000000});
const harness=fs.readFileSync(path.join(__dirname,'balance.cjs'),'utf8').split('code=code.replace')[0];
function boot(html,seed=[]){
 const prefix=harness.replace("fs.readFileSync(require('path').join(__dirname,'../game.html'),'utf8')",'globalThis.inputHTML');
 const host={require,__dirname,console,Blob,URL,setImmediate,inputHTML:html,seed};vm.createContext(host);
 vm.runInContext(prefix+`for(const [k,v]of seed)storage.set(k,v);code=code.replace(/\\}\\)\\(\\);\\s*$/, "globalThis.api={startRun,grantUpgrade,snapshotRun,validateRun,save,resume:r=>{resumeData=r;restoreRun();},get:()=>({state,player})};})();");vm.createContext(sandbox);vm.runInContext(code,sandbox);globalThis.result={a:sandbox.api,storage};`,host);return host.result;
}
(async()=>{
 const old=boot(baseline);await new Promise(r=>setImmediate(r));
 for(const mode of ['easy','normal','hard','impossible','vmode']){
  old.a.startRun(mode);old.a.grantUpgrade('piercing');old.a.grantUpgrade('explosive');const before=JSON.parse(JSON.stringify(old.a.snapshotRun()));before.player.hp=before.player.maxHp*.5;
  const profile=JSON.stringify(old.a.save),run=JSON.stringify(before),seed=[['tick_blood_gains_save_v1',profile],['tick_blood_gains_run_v2',run]];
  const next=boot(current,seed);await new Promise(r=>setImmediate(r));
  assert.equal(next.storage.get('tick_blood_gains_save_v1'),profile);assert.equal(next.storage.get('tick_blood_gains_run_v2'),run);
  assert(next.storage.has('tick_blood_gains_lab49_save_v1'));assert(next.storage.has('tick_blood_gains_lab49_run_v2'));
  const data=JSON.parse(next.storage.get('tick_blood_gains_lab49_run_v2'));next.a.validateRun(data);next.a.resume(data);
  assert.equal(next.a.get().state,'paused');assert.equal(next.a.get().player.hp/next.a.get().player.maxHp,mode==='vmode'?1:.5);assert.deepEqual(JSON.parse(JSON.stringify(next.a.get().player.upgradeCounts)),before.player.upgradeCounts);
  assert.equal(next.a.get().player.lab.spins,0);
  next.a.get().player.lab.spins=3;const active=JSON.stringify(next.a.snapshotRun());const existing=JSON.stringify({...old.a.save,bloodBank:123});
  const again=boot(current,[...seed,['tick_blood_gains_lab49_save_v1',existing],['tick_blood_gains_lab49_run_v2',active]]);await new Promise(r=>setImmediate(r));assert.equal(again.a.save.bloodBank,123);assert.equal(again.storage.get('tick_blood_gains_lab49_run_v2'),active);
 }
 console.log('PASS: 4.8 -> 4.9 on five difficulties; original progress retained, HP proportion and mutations preserved, existing 4.9 progress takes priority.');
})().catch(e=>{console.error(e);process.exit(1);});

