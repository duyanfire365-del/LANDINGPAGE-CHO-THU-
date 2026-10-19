import {canonicalRows} from '../lib/listing-catalog.mjs';
import {send} from '../lib/http.mjs';
import {configured,db} from '../lib/platform.mjs';
export default async function handler(req,res){
 if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
 if(!configured())return send(res,200,{posts:[]});
 try{const rows=await canonicalRows();return send(res,200,{posts:rows.filter(r=>r.status==='published').reverse().slice(0,500).map(r=>r.public_data)})}catch{return send(res,503,{error:'Chưa tải được tin mới. Vui lòng thử lại.'})}
}
