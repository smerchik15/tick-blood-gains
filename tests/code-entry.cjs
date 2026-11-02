const {boot}=require('./runtime-harness.cjs'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'../game.html'),'utf8');
const correct=html.match(/value\.trim\(\)!=='([^']+)'/)[1];
(async()=>{
 const {a,elements,storage}=boot({api:'openCodeEntry,closeCodeEntry,closeCheats,redeemEntryCode,STANDUP_TRAINING_URL,getFailures:()=>entryCodeFailures,'});await new Promise(r=>setImmediate(r));
 const submit=value=>{elements.get('entry-code').value=value;elements.get('entry-code-form').listeners.submit({preventDefault(){}});};
 const card=elements.get('entry-code-training'),link=elements.get('entry-code-training-link');
 assert(card.hidden);a.openCodeEntry();for(const value of ['', '   ',null])a.redeemEntryCode(value);assert.equal(a.getFailures(),0);
 for(let i=1;i<=4;i++){submit('wrong-code');assert.equal(a.getFailures(),i);assert(card.hidden);}
 a.closeCodeEntry();a.openCodeEntry();assert.equal(a.getFailures(),4);assert(card.hidden);
 submit('wrong-code');assert.equal(a.getFailures(),5);assert.equal(card.hidden,false);
 assert.equal(link.href,'https://voice-studio-vladi.noblebell32.chatgpt.site/#standup');assert(link.textContent.includes('стендапа'));
 elements.get('entry-code').listeners.input();assert.equal(card.hidden,false,'editing another attempt keeps the suggestion available');
 submit('wrong-code');assert.equal(a.getFailures(),5);assert.equal(card.hidden,false);
 a.closeCodeEntry();a.openCodeEntry();assert.equal(card.hidden,false);submit(correct);assert.equal(a.getFailures(),0);assert(card.hidden);
 a.closeCheats();a.openCodeEntry();for(let i=0;i<4;i++)submit('wrong-code');assert(card.hidden,'success breaks the previous failure streak');submit('wrong-code');assert.equal(card.hidden,false);
 assert([...storage.values()].every(value=>!value.includes('wrong-code')),'entered codes are never persisted');
 assert(/id="entry-code-training-link" target="_blank" rel="noopener noreferrer"/.test(html));
 const fresh=boot({api:'getFailures:()=>entryCodeFailures,'});await new Promise(r=>setImmediate(r));assert.equal(fresh.a.getFailures(),0);
 console.log('PASS: exactly five nonempty failures, close/reopen and input continuity, reset on success, fresh-page reset, safe stand-up deep link, no entered-code persistence.');
})().catch(e=>{console.error(e.message);process.exit(1);});
