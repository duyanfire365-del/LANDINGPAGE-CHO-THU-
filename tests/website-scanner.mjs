import assert from 'node:assert/strict';
import {publicIP,robotsAllowed,pageListings,discoveryLinks,scanWebsite,startScan,executeScan,latestScanRun} from '../lib/website-scanner.mjs';
for(const ip of ['127.0.0.1','10.0.0.1','169.254.169.254','172.16.1.1','192.168.1.1','100.100.100.200','::1','::ffff:127.0.0.1','fc00::1'])assert.equal(publicIP(ip),false,ip);
assert.equal(publicIP('8.8.8.8'),true);assert.equal(publicIP('2606:4700::1111'),true);
assert.equal(robotsAllowed('User-agent: *\nDisallow: /private\nAllow: /private/open','/private/a'),false);
assert.equal(robotsAllowed('User-agent: *\nDisallow: /private\nAllow: /private/open','/private/open'),true);
assert.equal(robotsAllowed('User-agent: *\nDisallow: /\nUser-agent: NguonChoThueScanner\nAllow: /','/rent'),true);
const url='https://example.org/rent/123',listing={'@type':'RealEstateListing',name:'Cho thuê mặt bằng Hà Đông',description:'Diện tích: 60m2. Mặt tiền 4m. Giá thuê: 15 triệu/tháng. Không nhận hàng ăn.',url};
const html='<script type="application/ld+json">'+JSON.stringify(listing)+'</script>';
assert.equal(pageListings(html,url)[0].rent,15);assert.equal(pageListings(html,url)[0].size,60);assert.equal(pageListings(html,url)[0].district,'Hà Đông');
assert.equal(pageListings(html.replace('Cho thuê','Bán'),url).length,0);
assert.deepEqual(discoveryLinks('<a href="/rent/1">Cho thuê nhà</a><a href="https://evil.org/rent">Cho thuê</a>',url),['https://example.org/rent/1']);
let calls=[];const read=async u=>{calls.push(u);return {url:u,text:u.endsWith('robots.txt')?'User-agent: *\nAllow: /':html}};
const out=await scanWebsite({url},{read});assert.equal(out.items.length,1);assert.equal(calls[0],'https://example.org/robots.txt');
assert.equal((await scanWebsite({url},{read:async u=>({url:u,text:'User-agent: *\nDisallow: /'})})).status,'robots-blocked');
await assert.rejects(scanWebsite({url},{read:async()=>{throw Error('HTTP 403')}}),/robots/);
process.env.SUPABASE_URL='https://db.example';process.env.SUPABASE_ANON_KEY='test';process.env.SUPABASE_SERVICE_ROLE_KEY='test';
const original=global.fetch;const rows=new Map();const config={items:[{id:'11111111-1111-4111-a111-111111111111',url:'https://example.org/',platform:'website',status:'pending-adapter',enabled:true},{id:'22222222-2222-4222-a222-222222222222',url:'https://www.facebook.com/groups/123/',platform:'facebook',status:'requires-access',enabled:true}],schedule:{timezone:'Asia/Ho_Chi_Minh',times:['10:30'],enabled:true},revision:'33333333-3333-4333-a333-333333333333'};
rows.set('b8f705a1-9b62-41cd-85a9-60d736244155',{id:'b8f705a1-9b62-41cd-85a9-60d736244155',kind:'scan-sources:v1',record_id:JSON.stringify(config)});
global.fetch=async(raw,opts={})=>{const u=new URL(raw),id=u.searchParams.get('id')?.slice(3),body=opts.body?JSON.parse(opts.body):null;let result=[];
 if(opts.method==='POST'){for(const row of [].concat(body)){const key=row.id||crypto.randomUUID();if(!rows.has(key)){rows.set(key,{...row,id:key});result.push(rows.get(key))}}}
 else if(opts.method==='PATCH'){const row=rows.get(id);if(row&&(!u.searchParams.get('created_at')||u.searchParams.get('created_at').slice(3)===row.created_at)){Object.assign(row,body);result=[row]}}
 else if(id)result=rows.has(id)?[rows.get(id)]:[];
 return new Response(JSON.stringify(result),{status:200});};
try{
 const first=await startScan();assert.equal(first.started,true);assert.equal((await startScan()).started,false,'second click must not start concurrent run');
 const run=await executeScan(first.run,first.sources,{scan:async()=>out});assert.equal(run.status,'completed');assert.equal(run.added,1);assert.equal(run.results[1].status,'requires-access');assert.equal((await latestScanRun()).added,1);
 const next=await startScan();await executeScan(next.run,next.sources,{scan:async()=>out});assert.equal((await latestScanRun()).added,0,'repeat run must not insert duplicate');
}finally{global.fetch=original}
console.log('PASS scanner: SSRF IP ranges, robots rules, JSON-LD extraction, same-host discovery, source failures, lock, progress, Facebook skip and duplicate-safe rerun.');
