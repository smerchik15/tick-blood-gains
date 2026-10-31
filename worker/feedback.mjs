import {feedbackPage} from './feedback-page.mjs';
const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export function feedbackOwner(request,env){
 const email=request.headers.get('oai-authenticated-user-email');
 return !!env.FEEDBACK_OWNER_EMAIL&&!!request.headers.get('oai-authenticated-user-id')&&email?.trim().toLowerCase()===env.FEEDBACK_OWNER_EMAIL.trim().toLowerCase();
}
export function validateFeedback(data){
 if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Некорректное обращение');
 if(typeof data.website==='string'&&data.website)return null;
 if(typeof data.message!=='string'||data.message.trim().length<10||data.message.length>4000)throw Error('Напиши от 10 до 4000 символов');
 if(!['bug','idea','balance','other'].includes(data.category))throw Error('Выбери тип обращения');
 if(typeof data.id!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(data.id))throw Error('Некорректный номер обращения');
 for(const [key,max]of [['nickname',40],['version',40]])if(data[key]!==undefined&&(typeof data[key]!=='string'||data[key].length>max))throw Error('Слишком длинное поле');
 const clean=s=>s.normalize('NFC').replace(/[\p{C}]/gu,'').trim();
 const message=clean(data.message);if(message.length<10)throw Error('Напиши от 10 до 4000 символов');
 return {id:data.id,category:data.category,message,nickname:clean(data.nickname||''),version:clean(data.version||'')};
}
async function readJSON(request){
 if(!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json'))throw Error('Нужен JSON');
 const reader=request.body?.getReader();if(!reader)throw Error('Пустой запрос');let size=0,parts=[];
 for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>16384){await reader.cancel();throw Error('Слишком большой запрос');}parts.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.byteLength;}return JSON.parse(new TextDecoder().decode(bytes));
}
export async function feedbackRoute(request,env){
 const url=new URL(request.url),owner=feedbackOwner(request,env);
 if(url.pathname==='/feedback'||url.pathname==='/feedback/inbox'){
  const inbox=url.pathname.endsWith('/inbox');
  if(inbox&&!request.headers.get('oai-authenticated-user-id'))return Response.redirect(url.origin+'/signin-with-chatgpt?return_to=%2Ffeedback%2Finbox',303);
  if(inbox&&!owner)return new Response('Этот раздел доступен только владельцу сайта.',{status:403,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
  return new Response(feedbackPage(inbox),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Content-Security-Policy':"default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'self'"}});
 }
 if(url.pathname==='/api/feedback/session')return reply({owner});
 if(url.pathname!=='/api/feedback')return new Response('Not found',{status:404});
 if(request.method==='GET'&&!owner||request.method==='PATCH'&&!owner)return reply({error:'Нет доступа'},403);
 if(!['GET','POST','PATCH'].includes(request.method))return reply({error:'Метод не поддерживается'},405);
 if(request.method!=='GET'&&request.headers.get('Origin')!==url.origin)return reply({error:'Отправь обращение с сайта игры'},403);
 if(!env.DB)return reply({error:'Обратная связь временно недоступна. Текст остался в форме.'},503);
 try{
  if(request.method==='GET'){
   const status=url.searchParams.get('status')||'all',before=url.searchParams.get('before')||'9007199254740991';
   if(!['all','new','read','done'].includes(status)||!/^\d{1,16}$/.test(before)||!Number.isSafeInteger(Number(before)))return reply({error:'Некорректный фильтр'},400);
   const data=await env.DB.prepare('SELECT seq,id,category,message,nickname,game_version,status,created_at FROM feedback WHERE seq < ? AND (? = \'all\' OR status = ?) ORDER BY seq DESC LIMIT 51').bind(Number(before),status,status).all();
   const rows=data.results||[],more=rows.length>50,items=rows.slice(0,50);return reply({items,next:more?items.at(-1).seq:null});
  }
  let data;try{data=await readJSON(request);}catch{return reply({error:'Некорректный или слишком большой запрос'},400);}
  if(request.method==='PATCH'){
   if(typeof data.id!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(data.id)||!['new','read','done'].includes(data.status))return reply({error:'Некорректный статус'},400);
   const result=await env.DB.prepare('UPDATE feedback SET status = ?, updated_at = ? WHERE id = ?').bind(data.status,Date.now(),data.id).run();return result.meta?.changes?reply({ok:true}):reply({error:'Обращение не найдено'},404);
  }
  let row;try{row=validateFeedback(data);}catch(e){return reply({error:e.message},400);}if(!row)return reply({ok:true});
  const now=Date.now(),ip=request.headers.get('CF-Connecting-IP')||'unknown';
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip+':'+Math.floor(now/86400000)+':feedback'));
  const ipKey=Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');
  const result=await env.DB.prepare("INSERT OR IGNORE INTO feedback (id,category,message,nickname,game_version,status,ip_key,created_at,updated_at) SELECT ?,?,?,?,?,'new',?,?,? WHERE (SELECT COUNT(*) FROM feedback WHERE ip_key = ? AND created_at > ?) < 5").bind(row.id,row.category,row.message,row.nickname,row.version,ipKey,now,now,ipKey,now-600000).run();
  if(!result.meta?.changes){const duplicate=await env.DB.prepare('SELECT id FROM feedback WHERE id = ? AND ip_key = ?').bind(row.id,ipKey).first();return duplicate?reply({ok:true,id:row.id}):reply({error:'Слишком часто: до 5 обращений за 10 минут. Попробуй позже.'},429);}
  return reply({ok:true,id:row.id},201);
 }catch{return reply({error:'Не удалось сохранить обращение. Попробуй позже; текст остался в форме.'},503);}
}
