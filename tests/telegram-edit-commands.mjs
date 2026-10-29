import assert from 'node:assert/strict';
import {processSource} from '../lib/source-automation.mjs';
import {editCommands,inferUpdateTarget} from '../lib/telegram-edit-commands.mjs';
import {applySourceUpdate,isUpdateCommand} from '../lib/source-updates.mjs';
import {standardizeRows} from '../lib/listing-identity.mjs';
import {changeDeletion} from '../lib/post-deletion.mjs';
import {inventorySnapshot} from '../lib/listing-availability.mjs';
import {reserveManualCode} from '../lib/manual-listing-code.mjs';
process.env.SUPABASE_URL='https://db.test';process.env.SUPABASE_ANON_KEY='sb_publishable_test';process.env.SUPABASE_SERVICE_ROLE_KEY='sb_secret_test';
assert(isUpdateCommand('Nội dung mới #SuaTin'));assert(isUpdateCommand('#HOT'));assert(isUpdateCommand('#dachothue'));
assert.throws(()=>editCommands('#tamdung #conhang'),{status:422});
assert.deepEqual(editCommands('#conhang #hot'),{edit:false,availability:'available',hot:true,active:true});
const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',slug='live-1234567890123456';
const original='Kho xưởng\nĐịa chỉ: Số 12 Hoàng Văn Thái, Thanh Xuân\nDiện tích: 105m2\nGiá thuê: 12 triệu/tháng';
const row={id,status:'published',created_at:'2026-01-01',public_data:{slug,href:'/tin?slug='+slug,code:'KX - 7777',listingSequence:7777,type:'Kho xưởng',categories:['Kho xưởng'],categoryMode:'manual',title:'Cho thuê kho xưởng 105 m² — Hoàng Văn Thái, Thanh Xuân',size:105,price:12,address:'Hoàng Văn Thái, Thanh Xuân, Hà Nội',area:'Thanh Xuân',description:'Diện tích: 105 m². Giá thuê: 12 triệu đồng/tháng.',notes:[],facts:[],media:[]},private_data:{sourceText:original,address:'Số 12 Hoàng Văn Thái, Thanh Xuân',sourceInfo:{},telegramUpdates:[]}};
const inbox=[{id:'prior',message_id:10,processing_status:'published',result_url:'/tin?slug='+slug}];
const records=[row],events=new Map();let fetchCount=0;const native=global.fetch;
global.fetch=async(raw,options={})=>{fetchCount++;const url=new URL(raw),body=options.body?JSON.parse(options.body):null;
 if(url.pathname==='/rest/v1/posts'){
  if(options.method==='PATCH'){const item=records.find(r=>'eq.'+r.id===url.searchParams.get('id'));if(item)Object.assign(item,structuredClone(body));return Response.json(item?[item]:[]);}
  return Response.json(structuredClone(url.searchParams.get('id')?records.filter(r=>'eq.'+r.id===url.searchParams.get('id')):records));
 }
 if(url.pathname==='/rest/v1/property_sources')return Response.json(options.method==='POST'?[body]:[]);
 if(url.hostname==='api.telegram.org')return Response.json({ok:true,result:{}});
 if(url.pathname==='/rest/v1/source_inbox'){const found=url.searchParams.get('id')?inbox.filter(r=>'eq.'+r.id===url.searchParams.get('id')):inbox;if(options.method==='PATCH')for(const job of found)Object.assign(job,structuredClone(body));return Response.json(structuredClone(found));}
 if(url.pathname==='/rest/v1/notification_log'){if(body){const key=body.id||String(events.size);if(!events.has(key))events.set(key,body);}return Response.json([]);}
 throw Error('Unexpected request '+url.pathname);
};
try{
 const src=(id,content)=>({id,content,media:[],chat_id:'123',message_id:20});
 await applySourceUpdate(src('edit-1','#suatin KX - 7777\nGiá thuê: 15 triệu/tháng'));
 assert.equal(row.public_data.price,15);assert.equal(records.length,1);assert.equal(row.public_data.slug,slug);
 await applySourceUpdate(src('edit-2','#dachothue KX - 7777'));assert.equal(row.public_data.availability,'rented');
 await applySourceUpdate(src('edit-3','#conhang #hot KX - 7777'));assert.equal(row.public_data.availability,'available');assert.equal(row.public_data.hot,true);
 const before=events.size;await applySourceUpdate(src('edit-3','#conhang #hot KX - 7777'));assert.equal(events.size,before,'retry cannot create duplicate state events');
 await applySourceUpdate(src('edit-4','#suatin KX - 7777\nGiá thuê: 18 triệu/tháng'));assert.equal(row.public_data.price,18);
 await applySourceUpdate(src('edit-1','#suatin KX - 7777\nGiá thuê: 15 triệu/tháng'));assert.equal(row.public_data.price,18,'old retry cannot restore an obsolete price');
 await applySourceUpdate(src('edit-5','#tamdung'));assert.equal(row.public_data.availability,'paused');
 assert.equal(await inferUpdateTarget(src('x',original+'\n#suatin'),records),slug);
 await assert.rejects(inferUpdateTarget(src('x',original+'\n#suatin'),[row,{...row,id:'another'}]),{status:422});
 await applySourceUpdate(src('status-old-copy',original+'\n#hot'));assert.equal(row.public_data.price,18,'status-only repost must not revert the latest price');
 const full=original.replace('12 triệu','19 triệu')+'\nKho sạch, có điện ba pha, xe tải tiếp cận thuận tiện.\n#suatin';
 await applySourceUpdate(src('edit-6',full));assert.equal(row.public_data.price,19);assert(row.public_data.description.includes('điện ba pha'));assert(!row.public_data.description.includes('Số 12'));
 await applySourceUpdate(src('edit-7','#suatin KX - 7777\nMô tả: Kho có điện ba pha, mới sửa sạch đẹp.'));assert(row.public_data.description.includes('mới sửa sạch đẹp'));
 row.private_data.sourceInfo={ownerPhones:['0966666666','',''],partnerPhones:['0977777777','','']};
 await applySourceUpdate(src('private-edit','Sửa tin KX - 7777\nMô tả: Kho mới sửa, có điện ba pha.\nChủ nhà anh Nam: 0987654321\nĐối tác chị Lan: 0912345678\nHoa hồng: 1 tháng tiền thuê\nGhi chú kín: hẹn chủ trước 30 phút\nMã cổng riêng 4321'));
 assert(row.private_data.sourceInfo.ownerPhones.includes('0987654321'));assert(row.private_data.sourceInfo.partnerPhones.includes('0912345678'));
 assert(row.private_data.sourceInfo.ownerPhones.includes('0966666666'),'adding owner keeps the previous owner number');
 assert(row.private_data.sourceInfo.commission.includes('1 tháng'));assert(row.private_data.sourceInfo.privateNotes.includes('Mã cổng riêng 4321'));
 assert(row.public_data.description.includes('Kho mới sửa'));assert(!/0987654321|0912345678|Mã cổng|Hoa hồng|hẹn chủ/.test(JSON.stringify(row.public_data)));
 await applySourceUpdate(src('explicit-slot','Sửa tin KX - 7777\nChủ nhà 1: 0955555555'));
 assert.equal(row.private_data.sourceInfo.ownerPhones[0],'0955555555');
 const deleted={id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',status:'rejected',public_data:{...row.public_data,code:'KX - 0088',listingSequence:88,codeMode:'manual'},private_data:{deletion:{state:'approved',previousStatus:'published'}}};
 records.push(deleted);assert.equal((await reserveManualCode('KX - 0088','Kho xưởng',id)).code,'KX - 0088');
 const canonical=standardizeRows([{...deleted,public_data:{...deleted.public_data,codeReleased:true}},{...row,public_data:{...row.public_data,code:'KX - 0088',listingSequence:88,codeMode:'manual'}}]);assert.equal(canonical[1].public_data.code,'KX - 0088');
 const liveCode=canonical[1].public_data;Object.assign(row.public_data,liveCode);
 await changeDeletion({admin:true},{action:'restore-post',id:deleted.id});assert.equal(deleted.public_data.codeReleased,false);assert.equal(deleted.public_data.codeMode,'auto');
 const restored=standardizeRows(records);assert.notEqual(restored[0].public_data.code,restored[1].public_data.code);
 const snap=inventorySnapshot([row.public_data],[...events.values()].reverse());assert.equal(snap.states[slug],'paused');
const queued={id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',content:'#bohot KX - 0088',processing_status:'received',attempts:0,chat_id:'123',message_id:30,media:[]};inbox.push(queued);
 process.env.TELEGRAM_AUTO_PUBLISH='true';process.env.TELEGRAM_SOURCE_MODE='ai';delete process.env.OPENAI_API_KEY;
 await processSource(queued.id);assert.equal(queued.processing_status,'updated',queued.processing_error);assert.equal(row.public_data.hot,false);
 assert.equal(records.length,2);
 const codeBefore=row.public_data.code;await applySourceUpdate(src('reply-complete-basic','#st '+codeBefore+' #kx\n12 Phố Mẫu, Thanh Xuân, 100m2 x 2t,5m, 27tr, nguồn Người Mẫu phí 1/2'));assert.equal(row.public_data.slug,slug);assert.equal(row.public_data.code,codeBefore);assert.equal(row.public_data.price,27);assert.equal(row.public_data.floors,2);assert.equal(row.public_data.frontage,5);assert.equal(row.private_data.sourceInfo.sourceName,'Người Mẫu');assert(row.private_data.sourceInfo.commission.includes('1/2'));assert(!JSON.stringify(row.public_data).includes('Người Mẫu'));
 deleted.public_data.slug='live-9999999999999999';
 const cauAm='#suatin:\nđổi mã tin NC sang MB\nCho thuê mặt bằng kinh doanh mặt phố Cầu Am, Vạn Phúc, Hà Đông\nĐường ô tô tránh vỉa hè\nDiện tích 82m2, cấp 4 gác xép, mặt tiền 3m5\nPhù hợp quán ăn.\nGiá thuê 9tr\nSang nhượng 230tr, bao gồm 2 tháng tiền nhà + tiền cọc với đồ đạc vận hành quán ăn.\nPhí 4tr5\nNguồn: #Chiến Thắng Land #mbkd\nTin cần cập nhật: '+slug;
 await applySourceUpdate(src('cau-am-fix',cauAm));
 assert.equal(row.public_data.type,'Mặt bằng kinh doanh');assert.match(row.public_data.code,/^MB - /);assert.equal(row.public_data.frontage,3.5);assert.equal(row.public_data.price,9);assert.equal(row.public_data.size,82);assert(row.public_data.address.includes('Cầu Am'));assert(row.public_data.description.includes('gác xép'));assert(row.public_data.description.includes('ô tô tránh'));assert(!row.public_data.description.includes('bố trí sinh hoạt'));assert(!JSON.stringify(row.public_data).includes('230'));assert.equal(row.private_data.privateTransferPrice,230);assert(row.private_data.sourceInfo.commission.includes('4tr5'));assert(row.private_data.sourceText.includes('#Chiến'));assert(!row.private_data.sourceText.includes('đổi mã tin'));assert(!row.private_data.sourcePhones.some(v=>v.endsWith('7890123456')));
 const changedCode=row.public_data.code;await applySourceUpdate(src('only-arrow','#suatin MB -> VP\nTin cần cập nhật: '+slug));assert.equal(row.public_data.type,'Văn phòng');assert.match(row.public_data.code,/^VP - /);assert.equal(row.public_data.price,9);assert.equal(row.public_data.size,82);assert(row.public_data.legacyCodes.includes(changedCode));
 await applySourceUpdate(src('correct-title-only','#suatin\nCho thuê mặt bằng kinh doanh mặt phố Cầu Am, Vạn Phúc, Hà Đông\nDiện tích 82m2\nGiá thuê 9tr\nTin cần cập nhật: '+slug));assert.equal(row.public_data.type,'Mặt bằng kinh doanh');
 for(const [n,content] of ['Bổ sung: Nguyễn Khuyến, Văn Quán, Hà Đông','Bổ sung địa chỉ:\nNguyễn Khuyến, Văn Quán, Hà Đông','Bổ sung địa chỉ: Số 12 ngách 3/5 ngõ 68 Nguyễn Khuyến, Văn Quán, Hà Đông'].entries()){
  await applySourceUpdate(src('address-'+n,content+'\nTin cần cập nhật: '+slug));assert(row.public_data.address.includes('Nguyễn Khuyến, Văn Quán'));assert(row.public_data.title.includes('Nguyễn Khuyến'));assert(!row.public_data.address.includes('68'));assert(!row.public_data.shareText.includes('ngách'));assert.equal(row.public_data.price,9);
 }
 console.log('PASS: edit/status hashtags update existing posts, prices/full copy change privately, latest-post targeting, ambiguous matches rejected, replay-safe state events, and deleted codes reusable.');
}finally{global.fetch=native}
