import assert from 'node:assert/strict';
import {getSource,publicSource} from '../lib/property-source.mjs';
process.env.SUPABASE_URL='https://db.test';process.env.SUPABASE_ANON_KEY='sb_publishable_test';process.env.SUPABASE_SERVICE_ROLE_KEY='sb_secret_test';delete process.env.ADMIN_SECRET;
const slug='live-1234567890123456',source={ownerPhones:['0987654321'],partnerPhones:['0912345678'],ownerPublic:[false],partnerPublic:[false],commission:'Hoa hồng: 1 tháng',privateNotes:'Mã cổng nội bộ 4321'};
const native=global.fetch;
global.fetch=async(raw,options={})=>{const url=new URL(raw);if(url.pathname==='/auth/v1/user')return Response.json({id:options.headers.Authorization==='Bearer owner-token'?'owner':'shared'});if(url.pathname==='/rest/v1/profiles')return Response.json([{id:url.searchParams.get('id')?.slice(3),kind:'sales',can_post:true}]);if(url.pathname==='/rest/v1/posts')return Response.json([{author_id:'owner',status:'published',public_data:{slug,code:'KX - 0001'},private_data:{sourceInfo:source}}]);if(url.pathname==='/rest/v1/property_sources')return Response.json([{data:source,shared_with:['shared']}]);throw Error('Unexpected '+url.pathname)};
try{
 const shared=await getSource({headers:{cookie:'rental_member=shared-token'}},slug);assert(!Object.hasOwn(shared.data,'commission'));assert(!Object.hasOwn(shared.data,'privateNotes'));
 const owner=await getSource({headers:{cookie:'rental_member=owner-token'}},slug);assert.equal(owner.data.privateNotes,source.privateNotes);assert.equal(owner.data.commission,source.commission);
 const publicData=await publicSource(slug);assert.deepEqual(publicData.ownerPhones,[]);assert.deepEqual(publicData.partnerPhones,[]);assert(!/4321|Hoa hồng/.test(JSON.stringify(publicData)));
 console.log('PASS: generic private notes and commission are visible to the owner, withheld from shared members, and excluded from public source data.');
}finally{global.fetch=native}
