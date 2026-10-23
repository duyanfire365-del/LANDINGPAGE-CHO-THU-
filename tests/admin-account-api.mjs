import assert from 'node:assert/strict';
import members from '../api/members.mjs';
import workspace from '../api/workspace.mjs';
process.env.SUPABASE_URL='https://auth.test';process.env.SUPABASE_ANON_KEY='sb_publishable_test';process.env.SUPABASE_SERVICE_ROLE_KEY='sb_secret_test';
let count=0,bodyReceived,fetches=0;const original=global.fetch;
global.fetch=async(url,options)=>{fetches++;assert.equal(new URL(url).pathname,'/auth/v1/token');bodyReceived=JSON.parse(options.body);return Response.json({access_token:'test-session',expires_in:3600})};
async function call(handler,body,origin){const req={method:'POST',url:'/api/members',headers:{host:'site.test','content-type':'application/json','x-forwarded-for':'192.0.2.'+(++count),...(origin?{origin}:{})},body};const res={setHeader(k,v){this[k]=v},writeHead(s){this.status=s},end(data){this.data=JSON.parse(data)}};await handler(req,res);return res}
try{
 const login=await call(members,{action:'login',email:'Duy_01',password:'abcdef'});assert.equal(login.status,200);assert.equal(bodyReceived.email,'duy_01@members.nguonchothue.invalid');assert(login['Set-Cookie'].includes('HttpOnly'));
 const denied=await call(workspace,{action:'member-create',nickname:'evil',name:'Evil',password:'abcdef',kind:'sales'});assert.equal(denied.status,401);assert.equal(fetches,1,'unauthorized account creation never reaches Supabase');
 const foreign=await call(members,{action:'login',email:'duy_01',password:'abcdef'},'https://other.test');assert.equal(foreign.status,403);
 console.log('PASS: nickname login uses Supabase password auth and HttpOnly cookie; anonymous account creation and cross-origin login are blocked.');
}finally{global.fetch=original}
