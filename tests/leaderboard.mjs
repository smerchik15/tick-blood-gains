import {validateSubmission,leaderboard,VALUES} from '../worker/handler.mjs';
import assert from 'node:assert/strict';
const sample={v:4,id:'valid-run-123456',nickname:'Test',ranked:true,difficulty:'hard',mode:'expedition',elapsed:120,kills:{ant:10,wasp:5,flea_king:1},eliteKills:2};
assert.equal(validateSubmission(sample).score,1170);assert.equal(validateSubmission(sample).bosses,1);
for(const change of [{v:3},{ranked:false},{difficulty:'toString'},{elapsed:-1},{eliteKills:90},{kills:{ant:-2}},{kills:{madeup:10}},{kills:{danys_mom:500}},{mode:'swarm'}])assert.throws(()=>validateSubmission({...sample,...change}));
assert.equal(validateSubmission({...sample,nickname:'<b>Joe</b>'}).nickname,'bJoe/b');
let inserts=0;const db={prepare(sql){return {bind(...args){return {async all(){return {results:[]};},async first(){return sql.includes('COUNT')?{count:0}:null;},async run(){inserts++;return {success:true};}};}};}};
const env={DB:db},url='https://game.example/api/leaderboard';
let response=await leaderboard(new Request(url,{method:'POST',headers:{Origin:'https://game.example'},body:JSON.stringify(sample)}),env);assert.equal(response.status,200);assert.equal((await response.json()).score,1170);assert.equal(inserts,1);
response=await leaderboard(new Request(url,{method:'POST',headers:{Origin:'https://evil.example'},body:JSON.stringify(sample)}),env);assert.equal(response.status,403);
response=await leaderboard(new Request(url+'?difficulty=normal&mode=swarm'),env);assert.deepEqual(await response.json(),{rows:[]});
console.log('PASS: server score recomputation, invalid submissions, cheat flag, rate/schema bounds, same-origin writes and GET filters.');

for(const key of ['guard','bombardier','weaver','rhino','firefly','spore']){const r=validateSubmission({...sample,difficulty:'normal',kills:{[key]:2},eliteKills:0});assert.equal(r.score,VALUES[key]*2+240);}
console.log('PASS: all six new enemy types are accepted and scored by the server.');

for(const key of ["colorado","slider","dog_bliss"]){const r=validateSubmission({...sample,difficulty:"vmode",kills:{[key]:1},eliteKills:0});assert.equal(r.score,(VALUES[key]+240)*3);}
