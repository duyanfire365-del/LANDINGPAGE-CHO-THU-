export async function readJson(req, limit = 16000) {
  if (!String(req.headers['content-type'] || '').includes('application/json')) throw Object.assign(new Error('JSON required'),{status:415});
  let text='';
  if (req.body !== undefined) text=typeof req.body==='string'?req.body:JSON.stringify(req.body);
  else for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>limit)throw Object.assign(new Error('Too large'),{status:413});}
  if(Buffer.byteLength(text)>limit)throw Object.assign(new Error('Too large'),{status:413});
  try{return JSON.parse(text)}catch{throw Object.assign(new Error('Invalid JSON'),{status:400})}
}
export function send(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data))}
export function sameOrigin(req){const origin=req.headers.origin;if(!origin)return true;try{return new URL(origin).host===req.headers.host}catch{return false}}
const requests=new Map();
export function limited(req,limit=15){const now=Date.now();if(requests.size>2000)for(const [k,v]of requests)if(v.until<now)requests.delete(k);const key=String(req.url||'').split('?')[0]+':'+String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0];let value=requests.get(key);if(!value||value.until<now)value={until:now+60000,count:0};value.count++;requests.set(key,value);return value.count>limit}
