export const VALUES={guard:12,bombardier:20,weaver:16,rhino:24,firefly:12,spore:14,ant:3,mosquito:5,flea:9,beetle:16,spider:14,wasp:18,drone:4,maggot:3,flea_king:400,mite_queen:650,louse_baron:800,old_scratch:1000,botfly_broodmother:900,mantis_blade:1200,hornet_turret:1300,roach_tank:1500,dragonfly_interceptor:1400,danys_mom:3000};
const MODES=['expedition','swarm'],MULT={easy:.75,normal:1,hard:1.5,impossible:2.2};
export function validateSubmission(b){
 if(!b||b.v!==4||b.ranked!==true||typeof b.id!=='string'||!/^[a-zA-Z0-9-]{8,80}$/.test(b.id)||!Object.hasOwn(MULT,b.difficulty)||!MODES.includes(b.mode)||!Number.isInteger(b.elapsed)||b.elapsed<10||b.elapsed>43200||!b.kills||typeof b.kills!=='object'||Array.isArray(b.kills)||!Number.isInteger(b.eliteKills)||b.eliteKills<0)throw Error('Некорректный результат');
 let kills=0,points=0,bosses=0,normal=0;
 for(const [key,n]of Object.entries(b.kills)){
  if(!Object.hasOwn(VALUES,key)||!Number.isInteger(n)||n<0||n>500000)throw Error('Некорректные убийства');
  kills+=n;points+=VALUES[key]*n;if(VALUES[key]>=400)bosses+=n;else normal+=n;
 }
 if(kills>b.elapsed*30+300||bosses>Math.floor(b.elapsed/55)+1||b.eliteKills>normal||bosses>0&&b.mode==='swarm')throw Error('Результат не прошёл проверку');
 const time=Math.floor(Math.min(b.elapsed,(bosses+1)*180)*2),score=Math.floor((points+b.eliteKills*10+time)*MULT[b.difficulty]);
 const nickname=typeof b.nickname==='string'?b.nickname.normalize('NFC').replace(/[\p{C}<>]/gu,'').trim().slice(0,20):'';
 return {id:b.id,nickname:nickname||'Клещ',difficulty:b.difficulty,mode:b.mode,elapsed:b.elapsed,kills,bosses,score,counts:JSON.stringify(b.kills)};
}
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function leaderboard(request,env){
 const url=new URL(request.url);
 if(!env.DB)return json({error:'Рейтинг временно недоступен'},503);
 try{
  if(request.method==='GET'){
   const difficulty=url.searchParams.get('difficulty')||'normal',mode=url.searchParams.get('mode')||'expedition';
   if(!Object.hasOwn(MULT,difficulty)||!MODES.includes(mode))return json({error:'Некорректный фильтр'},400);
   const data=await env.DB.prepare('SELECT nickname, score, elapsed, kills, bosses FROM scores WHERE season = 4 AND difficulty = ? AND mode = ? ORDER BY score DESC, kills DESC, created_at ASC LIMIT 50').bind(difficulty,mode).all();return json({rows:data.results||[]});
  }
  if(request.method!=='POST')return json({error:'Метод не поддерживается'},405);
  if(request.headers.get('Origin')!==url.origin)return json({error:'Публикуй результат на сайте игры'},403);
  if(Number(request.headers.get('Content-Length')||0)>16384)return json({error:'Слишком большой запрос'},413);
  const text=await request.text();if(text.length>16384)return json({error:'Слишком большой запрос'},413);
  let row;try{row=validateSubmission(JSON.parse(text));}catch(e){return json({error:e.message},400);}
  const existing=await env.DB.prepare('SELECT score FROM scores WHERE id = ?').bind(row.id).first();if(existing)return json({score:existing.score,duplicate:true});
  const ip=request.headers.get('CF-Connecting-IP'),now=Date.now();let ipKey='';
  if(ip){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip+':'+Math.floor(now/86400000)));ipKey=Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');const count=await env.DB.prepare('SELECT COUNT(*) AS count FROM scores WHERE ip_key = ? AND created_at > ?').bind(ipKey,now-3600000).first();if(count?.count>=12)return json({error:'Лимит: 12 результатов в час'},429);}
  await env.DB.prepare('INSERT OR IGNORE INTO scores (id, nickname, score, difficulty, mode, elapsed, kills, bosses, counts_json, ip_key, created_at, season) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 4)').bind(row.id,row.nickname,row.score,row.difficulty,row.mode,row.elapsed,row.kills,row.bosses,row.counts,ipKey,now).run();return json({score:row.score});
 }catch(e){console.error('leaderboard unavailable',e.message);return json({error:'Рейтинг временно недоступен. Личный рекорд сохранён.'},503);}
}
export default {async fetch(request,env){const url=new URL(request.url);if(url.pathname==='/api/leaderboard')return leaderboard(request,env);if(url.pathname==='/'||url.pathname==='/index.html')return new Response(HTML,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'}});return new Response('Not found',{status:404});}};
