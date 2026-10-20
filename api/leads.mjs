import {intentLabels,isConsignment} from '../lib/inquiries.mjs';
import {configured,db,member,notify} from '../lib/platform.mjs';
import {readJson,send,sameOrigin,limited} from '../lib/http.mjs';
export default async function handler(req,res){
 if(req.method!=='POST'){res.setHeader('Allow','POST');return send(res,405,{error:'Method not allowed'})}
 if(!sameOrigin(req))return send(res,403,{error:'Origin not allowed'});
 if(limited(req,8))return send(res,429,{error:'Anh/chị vui lòng chờ một phút rồi gửi lại.'});
 if(!process.env.LEAD_WEBHOOK_URL&&!configured())return send(res,503,{error:'Chưa có nơi nhận yêu cầu. Vui lòng sao chép thông tin và gửi qua Zalo.'});
 try{
  const body=await readJson(req,10000);const text=(v,n=300)=>typeof v==='string'?v.trim().slice(0,n):'';
  const name=text(body.name,100),phone=text(body.phone,20),intent=body.intent;
  if(!name||! /^(0|\+84)[0-9]{9}$/.test(phone)||!Object.hasOwn(intentLabels,intent)||body.contactConsent!==true)return send(res,400,{error:'Vui lòng kiểm tra họ tên, số điện thoại và đồng ý liên hệ.'});
  const record={intent,name,phone,area:text(body.area),type:text(body.type),budget:intent==='tenant'?text(body.budget,80):'',property:intent==='tenant'?text(body.property):'',date:intent==='tenant'?text(body.date,20):'',createdAt:new Date().toISOString()};
  if(intent==='tenant'){
   const maxBudget=body.maxBudget==null||body.maxBudget===''?null:Number(body.maxBudget),minSize=body.minSize==null||body.minSize===''?null:Number(body.minSize);
   if(maxBudget!==null&&(!Number.isFinite(maxBudget)||maxBudget<=0||maxBudget>1000000)||minSize!==null&&(!Number.isFinite(minSize)||minSize<1||minSize>10000000))return send(res,400,{error:'Kiểm tra ngân sách tối đa và diện tích tối thiểu.'});
   record.industry=text(body.industry,100);record.maxBudget=maxBudget;record.minSize=minSize;record.requirements=text(body.requirements,1000);
   record.ownerNotes=['Ngành nghề: '+(record.industry||'Chưa chọn'),'Ngân sách tối đa: '+(maxBudget===null?'Chưa chọn':maxBudget+' triệu/tháng'),'Diện tích tối thiểu: '+(minSize===null?'Chưa chọn':minSize+' m²'),'Yêu cầu thêm: '+record.requirements].join('\n');
  }
  if(isConsignment(intent)){
   const ownerAddress=text(body.ownerAddress),ownerSize=Number(body.ownerSize),ownerPrice=(body.ownerPrice??body.ownerRent)===''||(body.ownerPrice??body.ownerRent)==null?null:Number(body.ownerPrice??body.ownerRent),transferMonthlyRent=body.transferMonthlyRent===''||body.transferMonthlyRent==null?null:Number(body.transferMonthlyRent);
   if(!ownerAddress||!Number.isFinite(ownerSize)||ownerSize<1||ownerSize>10000000||body.ownerAuthority!==true||(ownerPrice!==null&&(!Number.isFinite(ownerPrice)||ownerPrice<0||ownerPrice>1000000))||(intent==='owner_transfer'&&transferMonthlyRent!==null&&(!Number.isFinite(transferMonthlyRent)||transferMonthlyRent<0||transferMonthlyRent>1000000)))return send(res,400,{error:'Vui lòng kiểm tra địa chỉ, diện tích, giá dự kiến và quyền ký gửi.'});
   Object.assign(record,{ownerAddress,ownerSize,ownerPrice,ownerRent:intent==='owner'?ownerPrice:null,transferMonthlyRent:intent==='owner_transfer'?transferMonthlyRent:null,ownerNotes:text(body.ownerNotes,1500),ownerAuthority:true});
  }
  if(configured()){
   const profile=await member(req);
   const rows=await db('inquiries',{method:'POST',body:{member_id:profile?.id||null,intent,name,phone,area:record.area,type:record.type,budget:record.budget,property:record.property,date:record.date,owner_address:record.ownerAddress||null,owner_size:record.ownerSize||null,owner_rent:record.ownerRent??null,owner_price:record.ownerPrice??null,transfer_monthly_rent:record.transferMonthlyRent??null,owner_notes:record.ownerNotes||null,contact_consent:true}});
   const notice=await notify('Có đăng ký mới: '+intentLabels[intent],{...record,id:rows[0].id});
   await db('notification_log',{method:'POST',body:{kind:'inquiry',record_id:rows[0].id,sent:notice.sent}}).catch(()=>{});
   return send(res,200,{received:true});
  }
  const url=new URL(process.env.LEAD_WEBHOOK_URL);if(url.protocol!=='https:')throw Error('HTTPS webhook required');
  const headers={'Content-Type':'application/json'};if(process.env.LEAD_WEBHOOK_TOKEN)headers.Authorization=`Bearer ${process.env.LEAD_WEBHOOK_TOKEN}`;
  const response=await fetch(url,{method:'POST',headers,body:JSON.stringify(record),signal:AbortSignal.timeout(10000),redirect:'error'});
  if(!response.ok)return send(res,502,{error:'Nơi nhận chưa xác nhận. Vui lòng gửi thông tin qua Zalo hoặc gọi hotline.'});
  return send(res,200,{received:true});
 }catch(error){return send(res,error.status||502,{error:error.status?'Thông tin gửi không hợp lệ.':'Chưa gửi được yêu cầu. Anh/chị có thể sao chép thông tin để gửi qua Zalo.'})}
}
