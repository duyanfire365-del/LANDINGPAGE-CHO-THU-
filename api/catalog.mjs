import {send} from '../lib/http.mjs';
import {configured,db} from '../lib/platform.mjs';
export default async function handler(req,res){
 if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
 if(!configured())return send(res,200,{posts:[]});
 try{const rows=await db('posts',{query:'?status=eq.published&select=public_data&order=created_at.desc&limit=500'});return send(res,200,{posts:rows.map(r=>r.public_data)})}catch{return send(res,503,{error:'Chưa tải được tin mới. Vui lòng thử lại.'})}
}
