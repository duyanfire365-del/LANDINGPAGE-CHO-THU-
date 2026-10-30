import {createHash} from 'node:crypto';
import {db,problem} from './platform.mjs';
import {qualifyScan} from './scan-qualification.mjs';
import {resultInput,ingestResults} from './scan-results.mjs';
export function reviewRecord(item,quality=qualifyScan(item),now=new Date()){
 const h=createHash('sha256').update('scan-review:v1:'+item.originalUrl).digest('hex');const id=h.slice(0,8)+'-'+h.slice(8,12)+'-4'+h.slice(13,16)+'-a'+h.slice(17,20)+'-'+h.slice(20,32);
 return {id,kind:'scan-review:v1',record_id:JSON.stringify({item,quality,at:now.toISOString()}),sent:true,created_at:now.toISOString()};
}
export async function qualifiedScanIngest(body){
 if(!Array.isArray(body.items)||body.items.length>100)throw problem(400,'Tối đa 100 tin mỗi lượt.');
 const accepted=[],review=[];for(const item of body.items){const quality=qualifyScan(item);const next={...item,kind:quality.kind,district:quality.district,phone:quality.phone,evidence:[item.evidence,quality.ownerEvidence,quality.locationEvidence].filter(Boolean).join(' ')};resultInput(next);if(quality.accepted)accepted.push(next);else review.push(reviewRecord(item,quality))}
 if(review.length)await db('notification_log',{method:'POST',query:'?on_conflict=id',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:[...new Map(review.map(r=>[r.id,r])).values()]});
 const result=await ingestResults({items:accepted});return {...result,review:review.length,examined:body.items.length};
}
export async function scanReview(){const rows=await db('notification_log',{query:'?kind=eq.scan-review:v1&order=created_at.desc&limit=101'});return {items:rows.slice(0,100).map(r=>({id:r.id,...JSON.parse(r.record_id)})),hasMore:rows.length>100}}
