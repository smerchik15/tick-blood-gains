const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const prefix=fs.readFileSync(path.join(__dirname,'balance.cjs'),'utf8').split('code=code.replace')[0];
const api=`globalThis.api={startRun,startSwarmRun,openWeaponChoice,resize,render,normalizeSave,setMobilePreferences,changeMobileZoom,isMobileUI,gameZoom,viewWidth,viewHeight,edgeSpawnPoint,save,keys,update,get:()=>({W,H,camera,player,joyActive,joyPointerId,joyDirX,joyDirY,joyMag,state,dashCooldown})};})();`;
const host={require,__dirname,console,Blob,URL,setImmediate};vm.createContext(host);vm.runInContext(prefix+`code=code.replace(/\\}\\)\\(\\);\\s*$/,${JSON.stringify(api)});vm.createContext(sandbox);vm.runInContext(code,sandbox);globalThis.result={a:sandbox.api,sandbox,elements,storage};`,host);
(async()=>{await new Promise(r=>setImmediate(r));const {a,sandbox,elements,storage}=host.result;
assert.equal(a.gameZoom(),1);a.setMobilePreferences('left',.6);assert.equal(a.gameZoom(),1,'desktop scale stays unchanged');
sandbox.window.innerWidth=390;sandbox.window.innerHeight=844;a.resize();assert(a.isMobileUI());assert.equal(a.gameZoom(),.6);assert.equal(a.viewWidth(),650);assert(Math.abs(a.viewHeight()-844/.6)<1e-8);
for(const input of [{side:'bad',zoom:-1},{side:'left',zoom:100},{side:'right',zoom:NaN},null]){const p=a.normalizeSave({...a.save,mobile:input});assert(['left','right'].includes(p.mobile.side));assert(p.mobile.zoom>=.6&&p.mobile.zoom<=1);}
a.openWeaponChoice();elements.get('mobile-left-start').onclick();assert.equal(a.save.mobile.side,'left');elements.get('mobile-right-start').onclick();assert.equal(a.save.mobile.side,'right');
a.startRun();a.render();let p=a.get().player;assert.equal(a.get().camera.x,p.x-a.viewWidth()/2);assert.equal(a.get().camera.y,p.y-a.viewHeight()/2);
for(let i=0;i<100;i++){const spawn=a.edgeSpawnPoint(),c=a.get().camera;assert(spawn.x<c.x||spawn.x>c.x+a.viewWidth()||spawn.y<c.y||spawn.y>c.y+a.viewHeight(),'spawn must remain beyond zoomed viewport');}
p.x=1;p.y=1;a.render();assert.equal(a.get().camera.x,0);assert.equal(a.get().camera.y,0);p.x=3599;p.y=2599;a.render();assert(Math.abs(a.get().camera.x+a.viewWidth()-3600)<1e-8);assert(Math.abs(a.get().camera.y+a.viewHeight()-2600)<1e-8);
a.startRun();const canvas=elements.get('game-canvas'),event=(id,x,y)=>({pointerId:id,clientX:x,clientY:y,pointerType:'touch',preventDefault(){},stopPropagation(){}});canvas.listeners.pointerdown(event(49,50,300));canvas.listeners.pointermove(event(49,100,300));const joy=a.get();assert(joy.joyActive);assert(joy.joyMag>.5);
a.setMobilePreferences('left',1);assert.equal(a.get().joyPointerId,49);assert.equal(a.get().joyDirX,joy.joyDirX);assert.equal(a.get().joyMag,joy.joyMag);a.setMobilePreferences('left',.6);assert.equal(a.get().joyPointerId,49);
elements.get('shield-btn').listeners.pointerdown(event(50,15,600));assert(a.get().player.shieldActiveTimer>0);elements.get('dash-btn').listeners.pointerdown(event(51,15,700));assert(a.get().dashCooldown>0);
for(let i=0;i<10;i++)a.changeMobileZoom(.1);assert.equal(a.save.mobile.zoom,1);for(let i=0;i<10;i++)a.changeMobileZoom(-.1);assert.equal(a.save.mobile.zoom,.6);
const stored=JSON.parse(storage.get('tick_blood_gains_journey50_save_v1'));assert.equal(stored.mobile.side,'left');assert.equal(stored.mobile.zoom,.6);assert.equal(a.normalizeSave(stored).mobile.zoom,.6);
sandbox.window.navigator={maxTouchPoints:5};sandbox.window.innerWidth=844;sandbox.window.innerHeight=390;a.resize();assert(a.isMobileUI());assert.equal(a.gameZoom(),.6);a.render();
elements.get('mobile-right-pause').onclick();assert.equal(a.save.mobile.side,'right');a.startSwarmRun();assert.equal(a.save.mobile.zoom,.6);a.render();
console.log('PASS: 60–100% zoom, desktop baseline, viewport/camera bounds, offscreen spawns, portrait/landscape, pre-run and pause side selectors, saved preferences, joystick continuity and shield/dash input.');
})().catch(e=>{console.error(e);process.exit(1);});
