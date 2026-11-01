import assert from 'node:assert/strict';
import handler from '../api/workspace.mjs';
import {changeDeletion,isDeleted} from '../lib/post-deletion.mjs';
process.env.SUPABASE_URL='https://delete-db.test';process.env.SUPABASE_SERVICE_ROLE_KEY='test';process.env.SUPABASE_ANON_KEY='test';
const original={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',status:'rejected',public_data:{slug:'live-1234567890123456',code:'MB - 0070',title:'Cho thuê mặt bằng',address:'Hà Đông',description:'Mặt bằng kinh doanh.',media:[{id:'photo',kind:'image'}]},private_data:{address:'Số 18 Nguyễn Khuyến',sourceInfo:{sourceName:'Nguồn riêng'},deletion:{state:'approved',previousStatus:'published',requestedAt:'2026-01-01',requestedName:'Admin'}}};
let row=structuredClone(original),writes=0,conflict=false;const native=global.fetch;
global.fetch=async(raw,options={})=>{const u=new URL(raw);assert.equal(u.hostname,'delete-db.test');if(u.pathname.endsWith('/notification_log'))return Response.json([]);assert(u.pathname.endsWith('/posts'));if(options.method==='PATCH'){writes++;if(conflict)return Response.json([]);Object.assign(row,JSON.parse(options.body));return Response.json([structuredClone(row)])}return Response.json([structuredClone(row)])};
try{
 await assert.rejects(changeDeletion({admin:false,id:'member'},{action:'archive-deletion',id:row.id}),e=>e.status===403);assert.equal(writes,0);
 await changeDeletion({admin:true},{action:'archive-deletion',id:row.id});assert(row.private_data.deletion.archivedAt);assert.equal(row.status,'rejected');assert(isDeleted(row));assert.deepEqual(row.public_data.media,original.public_data.media);assert.deepEqual(row.private_data.sourceInfo,original.private_data.sourceInfo);
 assert.equal((await changeDeletion({admin:true},{action:'archive-deletion',id:row.id})).unchanged,true);assert.equal(writes,1);
 await changeDeletion({admin:true},{action:'restore-post',id:row.id});assert.equal(row.status,'published');assert.equal(row.private_data.deletion.state,'restored');assert.equal(row.private_data.deletion.archivedAt,null);assert(!isDeleted(row));
 await changeDeletion({admin:true},{action:'delete-post',id:row.id});assert.equal(row.private_data.deletion.archivedAt,undefined);assert.equal(row.private_data.deletion.state,'pending');
 conflict=true;await assert.rejects(changeDeletion({admin:true},{action:'archive-deletion',id:row.id}),e=>e.status===409);assert.equal(row.private_data.deletion.state,'pending');
 const before=writes;for(const method of ['GET','POST']){let code;await handler({method,url:'/api/workspace'+(method==='GET'?'?view=deleted-posts':''),headers:{host:'delete-api.test','content-type':'application/json'},body:{action:'archive-deletion',id:row.id},socket:{remoteAddress:'127.0.0.1'}},{writeHead(s){code=s},end(){},setHeader(){}});assert.equal(code,401)}assert.equal(writes,before);
 console.log('Deletion: admin-only archive, idempotency, media/private preservation, restoration, re-delete and revision conflict passed');
}finally{global.fetch=native}
