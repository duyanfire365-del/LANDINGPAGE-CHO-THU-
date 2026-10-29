import {websiteLogoMetadata} from '../lib/website-logo.mjs';
import {publicListing} from '../lib/post-history.mjs';
import {brandingQR} from '../lib/branding-settings.mjs';
import {inventoryData} from '../lib/inventory.mjs';
import {canonicalRows} from '../lib/listing-catalog.mjs';
import {send} from '../lib/http.mjs';
import {configured,db} from '../lib/platform.mjs';
export default async function handler(req,res){
 if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
 if(new URL(req.url,'http://localhost').searchParams.get('view')==='website-brand'){try{return send(res,200,await websiteLogoMetadata())}catch{return send(res,503,{error:'Chưa tải được logo website.'})}}
 if(!configured()){const data=await inventoryData();return send(res,200,{posts:[],inventory:data.states,hot:data.hot,hotSelected:data.hotSelected});}
 try{const [rows,inventory,qr]=await Promise.all([canonicalRows({includeStatic:true}),inventoryData(),brandingQR()]);return send(res,200,{qrRevision:qr.revision,customQR:qr.custom,inventory:inventory.states,hot:inventory.hot,hotSelected:inventory.hotSelected,posts:rows.filter(r=>r.status==='published').reverse().sort((a,b)=>Number(inventory.hot[b.public_data.slug])-Number(inventory.hot[a.public_data.slug])||String(b.reviewed_at||b.created_at||'').localeCompare(String(a.reviewed_at||a.created_at||''))).slice(0,500).map(r=>({...publicListing(r.public_data),...(qr.custom&&r.public_data.image==='/banner.png'?{image:'/api/files?action=banner-view&v='+qr.revision,shareImage:'/api/files?action=banner-view&v='+qr.revision}:{}),hot:inventory.hot[r.public_data.slug]===true,availability:inventory.states[r.public_data.slug]||'awaiting'}))})}catch{return send(res,503,{error:'Chưa tải được tin mới. Vui lòng thử lại.'})}
}
