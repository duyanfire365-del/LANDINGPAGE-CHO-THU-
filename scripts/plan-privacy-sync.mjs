import {readFileSync,writeFileSync} from 'node:fs';
import {randomUUID,createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {protectPublishedCopy} from '../lib/listing-privacy-sync.mjs';
import {mergePriceNotes} from '../lib/source-price-notes.mjs';
const [snapshotPath,planPath]=process.argv.slice(2);if(!snapshotPath||!planPath)throw Error('Usage: node scripts/plan-privacy-sync.mjs PRIVATE_SNAPSHOT PRIVATE_PLAN');
const snapshot=JSON.parse(readFileSync(snapshotPath,'utf8')),base=JSON.parse(readFileSync(new URL('../public/listings.json',import.meta.url),'utf8'));
const stamp=new Date().toISOString(),batch='privacy-20261028',posts=[],sources=[],staticListings=[];
const stable=value=>JSON.stringify(value),digest=value=>createHash('sha256').update(stable(value)).digest('hex');
for(const row of snapshot.posts){
 const old=row.public_data,privateData=row.private_data||{},result=protectPublishedCopy(old,{sourceText:privateData.sourceText||privateData.originalText||'',sourceInfo:privateData.sourceInfo,privateAddress:privateData.address});
 const next={...result.publicData,contentRevision:randomUUID()},nextPrivate={...privateData,sourceInfo:{...privateData.sourceInfo,privateNotes:mergePriceNotes(privateData.sourceInfo?.privateNotes,result.privateNotes),sourcePublic:false,ownerPublic:[false,false,false],partnerPublic:[false,false,false]},priceTrackingNotes:mergePriceNotes(privateData.priceTrackingNotes,result.priceTrackingNotes),privacyCopyBackup:privateData.privacyCopyBackup||{batch,at:stamp,publicData:old},privacyCopyRevision:{batch,at:stamp}};
 for(const field of ['id','slug','code','price','pricePerM2','priceBasis','transferPrice','size','type','area','image','shareImage','media','availability','hot'])assert.deepEqual(next[field],old[field],row.id+': preserve '+field);
 posts.push({id:row.id,oldPublic:old,oldPrivate:privateData,publicData:next,privateData:nextPrivate});
 const previous=snapshot.sources.find(s=>s.slug===old.slug);if(previous)sources.push({...previous,oldData:previous.data,data:{...previous.data,privateNotes:mergePriceNotes(previous.data.privateNotes,result.privateNotes),sourcePublic:false,ownerPublic:[false,false,false],partnerPublic:[false,false,false],privacyCopyBackup:previous.data.privacyCopyBackup||{batch,at:stamp,publicData:old}}});
}
for(const old of base){
 const result=protectPublishedCopy(old),next=result.publicData;
 for(const field of ['id','slug','code','price','size','type','image','shareImage','transferPrice'])assert.deepEqual(next[field],old[field],old.slug+': preserve '+field);
 staticListings.push(next);
 const previous=snapshot.sources.find(s=>s.slug===old.slug),data={...previous?.data,privateNotes:mergePriceNotes(previous?.data?.privateNotes,result.privateNotes),sourcePublic:false,ownerPublic:[false,false,false],partnerPublic:[false,false,false],privacyCopyBackup:previous?.data?.privacyCopyBackup||{batch,at:stamp,publicData:old}};
 sources.push({slug:old.slug,owner_id:previous?.owner_id||null,oldData:previous?.data||null,data,shared_with:previous?.shared_with||[],map_shares:previous?.map_shares||[],updated_at:stamp});
}
const plan={batch,at:stamp,posts,sources,staticListings,summary:{dynamic:posts.length,static:base.length,total:posts.length+base.length,withPrivateNotes:posts.filter(r=>r.privateData.sourceInfo.privateNotes).length+sources.filter(r=>r.slug.startsWith('hn-')&&r.data.privateNotes).length,snapshotHash:digest(snapshot)}};
writeFileSync(planPath,JSON.stringify(plan),{mode:0o600});console.log(JSON.stringify(plan.summary));
