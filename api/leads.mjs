import {readJson,send,sameOrigin,limited} from '../lib/http.mjs';
export default async function handler(req,res){
 if(req.method!=='POST'){res.setHeader('Allow','POST');return send(res,405,{error:'Method not allowed'})}
 if(!sameOrigin(req))return send(res,403,{error:'Origin not allowed'});
 if(limited(req,8))return send(res,429,{error:'Anh/chị vui lòng chờ một phút rồi gửi lại.'});
 if(!process.env.LEAD_WEBHOOK_URL)return send(res,503,{error:'Chưa có nơi nhận yêu cầu. Vui lòng sao chép thông tin và gửi qua Zalo.'});
 try{
  const body=await readJson(req,10000);const text=(v,n=300)=>typeof v==='string'?v.trim().slice(0,n):'';
  const name=text(body.name,100),phone=text(body.phone,20),intent=body.intent;
  if(!name||! /^(0|\+84)[0-9]{9}$/.test(phone)||!['tenant','owner'].includes(intent)||body.contactConsent!==true)return send(res,400,{error:'Vui lòng kiểm tra họ tên, số điện thoại và đồng ý liên hệ.'});
  const record={intent,name,phone,area:text(body.area),type:text(body.type),budget:text(body.budget,80),property:text(body.property),date:text(body.date,20),createdAt:new Date().toISOString()};
  if(intent==='owner'){
   const ownerAddress=text(body.ownerAddress),ownerSize=Number(body.ownerSize),ownerRent=body.ownerRent===''?null:Number(body.ownerRent);
   if(!ownerAddress||!Number.isFinite(ownerSize)||ownerSize<1||ownerSize>10000000||body.ownerAuthority!==true||(ownerRent!==null&&(!Number.isFinite(ownerRent)||ownerRent<0||ownerRent>1000000)))return send(res,400,{error:'Vui lòng kiểm tra địa chỉ, diện tích, giá thuê và quyền ký gửi.'});
   Object.assign(record,{ownerAddress,ownerSize,ownerRent,ownerNotes:text(body.ownerNotes,1500),ownerAuthority:true});
  }
  const url=new URL(process.env.LEAD_WEBHOOK_URL);if(url.protocol!=='https:')throw Error('HTTPS webhook required');
  const headers={'Content-Type':'application/json'};if(process.env.LEAD_WEBHOOK_TOKEN)headers.Authorization=`Bearer ${process.env.LEAD_WEBHOOK_TOKEN}`;
  const response=await fetch(url,{method:'POST',headers,body:JSON.stringify(record),signal:AbortSignal.timeout(10000),redirect:'error'});
  if(!response.ok)return send(res,502,{error:'Nơi nhận chưa xác nhận. Vui lòng gửi thông tin qua Zalo hoặc gọi hotline.'});
  return send(res,200,{received:true});
 }catch(error){return send(res,error.status||502,{error:error.status?'Thông tin gửi không hợp lệ.':'Chưa gửi được yêu cầu. Anh/chị có thể sao chép thông tin để gửi qua Zalo.'})}
}
