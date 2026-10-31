import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {feedbackRoute,feedbackOwner,validateFeedback} from '../worker/feedback.mjs';
import {feedbackPage} from '../worker/feedback-page.mjs';
const sqlite=new DatabaseSync(':memory:');for(const file of ['0000_scores.sql','0001_economy_season.sql','0002_feedback.sql'])sqlite.exec(readFileSync('drizzle/'+file,'utf8'));
const DB={prepare(sql){return {bind(...args){const p=sqlite.prepare(sql);return {async all(){return {results:p.all(...args)};},async first(){return p.get(...args)||null;},async run(){return {meta:{changes:Number(p.run(...args).changes)}};}};}};}};
const env={DB,FEEDBACK_OWNER_EMAIL:'owner@example.test'},origin='https://tick.example';let seq=0;
const body=()=>({id:'feedback-test-'+String(++seq).padStart(8,'0'),category:'bug',message:'Сообщение об ошибке без email',nickname:'',version:'4.9.1-test'});
const owner={'oai-authenticated-user-id':'owner-user','oai-authenticated-user-email':'owner@example.test'};
function request(path,method='GET',data,headers={}){return new Request(origin+path,{method,headers:{...(method==='GET'?{}:{Origin:origin,'Content-Type':'application/json'}),...headers},...(data===undefined?{}:{body:typeof data==='string'?data:JSON.stringify(data)})});}
assert(!feedbackOwner(request('/'),env));assert(!feedbackOwner(request('/','GET',undefined,{'oai-authenticated-user-email':'owner@example.test'}),env));assert(!feedbackOwner(request('/','GET',undefined,{...owner,'oai-authenticated-user-email':'other@example.test'}),env));assert(feedbackOwner(request('/','GET',undefined,owner),env));
assert.throws(()=>validateFeedback({...body(),message:'\0'.repeat(20)}));assert.throws(()=>validateFeedback({...body(),message:'tiny'}));assert.throws(()=>validateFeedback({...body(),message:'x'.repeat(4001)}));assert.throws(()=>validateFeedback({...body(),category:'other; DROP TABLE feedback'}));
let response=await feedbackRoute(request('/feedback'),env);assert.equal(response.status,200);const page=await response.text();assert(!/type="email"|name="email"/.test(page));assert(page.includes('Email и вход не нужны'));
response=await feedbackRoute(request('/feedback/inbox'),env);assert.equal(response.status,303);assert(response.headers.get('Location').includes('signin-with-chatgpt'));
response=await feedbackRoute(request('/feedback/inbox','GET',undefined,{...owner,'oai-authenticated-user-email':'stranger@example.test'}),env);assert.equal(response.status,403);
assert.equal((await feedbackRoute(request('/api/feedback'),env)).status,403);
assert.equal((await feedbackRoute(request('/api/feedback','POST',body(),{Origin:'https://evil.test'}),env)).status,403);
assert.equal((await feedbackRoute(request('/api/feedback','POST','bad json'),env)).status,400);
assert.equal((await feedbackRoute(request('/api/feedback','POST',body(),{'Content-Type':'text/plain'}),env)).status,400);
assert.equal((await feedbackRoute(request('/api/feedback','POST','x'.repeat(17000)),env)).status,400);
const first=body();first.message='<img src=x onerror=alert(1)> текст об ошибке';response=await feedbackRoute(request('/api/feedback','POST',first),env);assert.equal(response.status,201);assert.equal((await response.json()).id,first.id);
assert.equal((await feedbackRoute(request('/api/feedback','POST',first),env)).status,200);assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM feedback').get().n,1);
for(let i=0;i<4;i++)assert.equal((await feedbackRoute(request('/api/feedback','POST',body()),env)).status,201);
assert.equal((await feedbackRoute(request('/api/feedback','POST',body()),env)).status,429);
response=await feedbackRoute(request('/api/feedback','GET',undefined,owner),env);let data=await response.json();assert.equal(data.items.length,5);assert(data.items.every(r=>!Object.hasOwn(r,'ip_key')));assert.equal(response.headers.get('Cache-Control'),'no-store');
assert.equal((await feedbackRoute(request('/api/feedback','PATCH',{id:first.id,status:'done'}),env)).status,403);
assert.equal((await feedbackRoute(request('/api/feedback','PATCH',{id:first.id,status:'done'},owner),env)).status,200);
response=await feedbackRoute(request('/api/feedback?status=done','GET',undefined,owner),env);assert.equal((await response.json()).items.length,1);
assert.equal((await feedbackRoute(request('/api/feedback?status=invalid','GET',undefined,owner),env)).status,400);
assert.equal((await feedbackRoute(request('/api/feedback','POST',body()),{})).status,503);
for(let i=0;i<52;i++){const row=body();sqlite.prepare("INSERT INTO feedback(id,category,message,ip_key,created_at,updated_at) VALUES(?, 'idea','test message','test',1,1)").run(row.id);}
response=await feedbackRoute(request('/api/feedback','GET',undefined,owner),env);data=await response.json();assert.equal(data.items.length,50);assert(data.next);response=await feedbackRoute(request('/api/feedback?before='+data.next,'GET',undefined,owner),env);assert.equal((await response.json()).items.length,7);
for(const admin of [false,true]){const html=feedbackPage(admin);const script=html.split('<script>')[1].split('</script>')[0];new Function(script);assert(!script.includes('innerHTML'));}
assert(!Object.keys(sqlite.prepare('SELECT * FROM feedback LIMIT 1').get()).some(k=>/email|user_id/.test(k)));
console.log('PASS: anonymous feedback without email, real SQLite migration/persistence, validation, idempotent retries, rate limit, owner-only inbox/statuses, pagination, no raw IP in inbox, safe text rendering.');
