const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const harness=fs.readFileSync(path.join(__dirname,'balance.cjs'),'utf8').split('code=code.replace')[0];
function boot(html){
 const prefix=harness.replace("fs.readFileSync(require('path').join(__dirname,'../game.html'),'utf8')",'globalThis.inputHTML');
 const host={require,__dirname,console,Blob,URL,setImmediate,inputHTML:html};vm.createContext(host);
 vm.runInContext(prefix+`code=code.replace(/\\}\\)\\(\\);\\s*$/, "globalThis.api={startRun,spawnBoss,checkpoint,snapshotRun,validateRun,restoreRun,save,update,grantUpgrade,setState,get:()=>({state,player,bossActive}),resume:r=>{resumeData=r;restoreRun();},boss:n=>{bossEncounters=n;slimeThisRun=totalBossSlime(n);slimeLedger={count:n,total:slimeThisRun,legacyCount:n,legacyTotal:slimeThisRun};spawnBoss();}};})();");vm.createContext(sandbox);vm.runInContext(code,sandbox);globalThis.result=sandbox.api;`,host);
 return host.result;
}
(async()=>{
 const current=fs.readFileSync(path.join(root,'game.html'),'utf8'),original=(process.argv[2]?fs.readFileSync(process.argv[2],'utf8'):require('node:child_process').execFileSync('git',['show','7ab7328:game.html'],{cwd:root,encoding:'utf8',maxBuffer:12000000}));
 const old=boot(original),now=boot(current);await new Promise(r=>setImmediate(r));let count=0;
 for(const mode of ['easy','normal','hard','impossible','vmode'])for(const encounter of [null,0,2,8,9]){
  old.startRun(mode);old.grantUpgrade('piercing');old.grantUpgrade('explosive');if(encounter!==null)old.boss(encounter);
  const saved=JSON.parse(JSON.stringify(old.snapshotRun()));const hp=saved.player.hp,counts=JSON.stringify(saved.player.upgradeCounts);
  now.validateRun(saved);now.resume(saved);assert.equal(now.get().state,'paused');assert.equal(now.get().player.hp,hp);assert.equal(JSON.stringify(now.get().player.upgradeCounts),counts);
  now.setState('playing');for(let i=0;i<12;i++)now.update(1/60);now.validateRun(JSON.parse(JSON.stringify(now.snapshotRun())));count++;
 }
 console.log(`PASS: ${count} original 4.7 -> 4.8 checkpoint migrations, all five difficulties, active bosses, HP, mutations, resume and re-save.`);
 if(fs.existsSync(path.join(root,'live-audit.html'))){const live=fs.readFileSync(path.join(root,'live-audit.html'),'utf8');const clean=live.replace(/<script>\(function\(\)\{function c\(\)\{var b=a\.contentDocument[\s\S]*?<\/script>(?=<\/body>)/,'').replace(/\r\n/g,'\n');assert(clean===current.replace(/\r\n/g,'\n'),'Live game differs from source after removal of the hosting script');console.log('PASS: live game matches game.html after excluding the hosting script, SHA256 '+crypto.createHash('sha256').update(live).digest('hex'));}
})().catch(e=>{console.error(e);process.exit(1);});
