import {brandingQR} from '../lib/branding-settings.mjs';
import {inventoryStates} from '../lib/inventory.mjs';
import {canonicalRows} from '../lib/listing-catalog.mjs';
import {send} from '../lib/http.mjs';
import {configured,db} from '../lib/platform.mjs';
export default async function handler(req,res){
 if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
 if(!configured())return send(res,200,{posts:[],inventory:{}});
 try{const [rows,inventory,qr]=await Promise.all([canonicalRows(),inventoryStates(),brandingQR()]);return send(res,200,{qrRevision:qr.revision,customQR:qr.custom,inventory,posts:rows.filter(r=>r.status==='published').reverse().slice(0,500).map(r=>({...r.public_data,...(qr.custom&&r.public_data.image==='/banner.png'?{image:'/api/files?action=banner-view&v='+qr.revision,shareImage:'/api/files?action=banner-view&v='+qr.revision}:{}),availability:inventory[r.public_data.slug]||'available'}))})}catch{return send(res,503,{error:'Chưa tải được tin mới. Vui lòng thử lại.'})}
}
