import assert from 'node:assert/strict';
import {identity} from '../lib/member-identity.mjs';
import handler from '../api/members.mjs';
assert.deepEqual(identity({channel:'phone',phone:'0912 345 678'}),{channel:'phone',phone:'+84912345678'});
assert.equal(identity({email:'  Anh@Example.COM '}).email,'anh@example.com');
for(const body of [{channel:'sms',phone:'0912345678'},{channel:'phone',phone:'+18001234567'},{email:'bad'},{channel:'phone',phone:'0000000000'}])assert.throws(()=>identity(body),{status:400});
process.env.SUPABASE_URL='https://auth.test';process.env.SUPABASE_ANON_KEY='test-anon';process.env.SUPABASE_SERVICE_ROLE_KEY='test-service';
const original=global.fetch;let counter=0,settings={external:{phone:true,email:true},mailer_autoconfirm:false,sms_autoconfirm:false},calls=[],fail=false;
global.fetch=async(raw,options={})=>{const url=new URL(raw),body=options.body?JSON.parse(options.body):undefined;calls.push({path:url.pathname,body});assert.equal(url.origin,'https://auth.test');if(url.pathname.endsWith('/settings'))return Response.json(settings);if(fail)return Response.json({code:'provider_failure'},{status:503});if(url.pathname.endsWith('/verify'))return body.token==='123456'?Response.json({access_token:'verified-session',expires_in:3600}):Response.json({error:'bad code'},{status:400});if(url.pathname.endsWith('/token'))return Response.json({access_token:'password-session',expires_in:3600});return Response.json({})};
async function request(body,origin){const headers={},req={method:'POST',url:'/api/members',headers:{host:'site.test','content-type':'application/json','x-forwarded-for':'192.0.2.'+(++counter),...(origin?{origin}:{})},body};const res={setHeader(k,v){headers[k]=v},writeHead(status,more){this.status=status;Object.assign(headers,more)},end(text){this.data=JSON.parse(text)}};await handler(req,res);return {...res,headers}}
try{
 const registration={action:'register',channel:'email',email:'anh@example.test',password:'long-password-for-test',name:'Anh',kind:'sales',consent:true,can_post:true,auto_publish:true};
 let r=await request(registration);assert.equal(r.status,200);assert.equal(r.data.otpRequired,true);assert.equal(r.headers['Set-Cookie'],undefined);const signup=calls.find(c=>c.path.endsWith('/signup')).body;assert.deepEqual(Object.keys(signup.data).sort(),['full_name','kind','phone']);assert.equal(signup.email,registration.email);assert.equal(signup.data.phone,'');
 calls=[];settings.mailer_autoconfirm=true;r=await request(registration);assert.equal(r.status,503);assert(!calls.some(c=>c.path.endsWith('/signup')));settings.mailer_autoconfirm=false;settings.sms_autoconfirm=true;r=await request({...registration,channel:'phone',phone:'0912345678'});assert.equal(r.status,503);settings.sms_autoconfirm=false;
 settings.external.phone=false;r=await request({...registration,channel:'phone',phone:'0912345678'});assert.equal(r.status,503);settings.external.phone=true;
 calls=[];r=await request({...registration,channel:'phone',phone:'0912345678'});assert.equal(r.status,200);const phoneSignup=calls.find(c=>c.path.endsWith('/signup')).body;assert.equal(phoneSignup.phone,'+84912345678');assert.equal(phoneSignup.email,undefined);assert.equal(phoneSignup.channel,'sms');
 fail=true;r=await request({action:'send-login-otp',channel:'phone',phone:'0912345678'});assert.equal(r.status,503);assert(!r.data.otpRequired);fail=false;
 r=await request({action:'verify-otp',email:registration.email,purpose:'signup',token:'000000'});assert.equal(r.status,400);assert.equal(r.headers['Set-Cookie'],undefined);
 r=await request({action:'verify-otp',channel:'phone',phone:'0912345678',purpose:'signup',token:'123456'});assert.equal(r.status,200);assert(r.headers['Set-Cookie'].includes('HttpOnly'));assert.equal(calls.at(-1).body.type,'sms');
 r=await request({action:'verify-otp',email:registration.email,purpose:'signup',token:'123456'});assert.equal(r.status,200);assert.equal(calls.at(-1).body.type,'signup');
 r=await request({action:'verify-otp',email:registration.email,purpose:'login',token:'123456'});assert.equal(r.status,200);assert.equal(calls.at(-1).body.type,'email');
 r=await request({action:'send-login-otp',email:registration.email,can_post:true});assert.equal(r.status,200);assert.deepEqual(calls.at(-1).body,{email:registration.email,create_user:false});
 r=await request({action:'resend-otp',channel:'phone',phone:'0912345678'});assert.equal(r.status,200);assert.equal(calls.at(-1).body.type,'sms');
 r=await request(registration,'https://other.test');assert.equal(r.status,403);
 console.log('PASS: identity normalization, provider readiness, no self grants, explicit OTP types, no session on failed/unverified registration, real provider failure messages and cross-origin rejection');
}finally{global.fetch=original}
