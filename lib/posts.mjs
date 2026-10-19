import {formPricing} from './source-pricing.mjs';
import {randomInt} from 'node:crypto';
import {clean,db,problem} from './platform.mjs';
export const categories=['Mặt bằng kinh doanh','Văn phòng','Kho xưởng','Nhà nguyên căn','Căn hộ chung cư','Căn hộ dịch vụ','Phòng trọ','Biệt thự, nhà liền kề','Ki-ốt','Đất cho thuê','Bất động sản khác'];
export const areas=['Ba Đình','Bắc Từ Liêm','Cầu Giấy','Đống Đa','Hà Đông','Hai Bà Trưng','Hoàn Kiếm','Hoàng Mai','Long Biên','Nam Từ Liêm','Tây Hồ','Thanh Xuân','Ba Vì','Chương Mỹ','Đan Phượng','Đông Anh','Gia Lâm','Hoài Đức','Mê Linh','Mỹ Đức','Phú Xuyên','Phúc Thọ','Quốc Oai','Sóc Sơn','Thạch Thất','Thanh Oai','Thanh Trì','Thường Tín','Ứng Hòa','Sơn Tây'];
export function safePublicText(value){
 return !/(?:\bsố|ngõ|ngách|hẻm)\s*\d|(?:^|\s)\d+[a-z]?\s+(?:phố|đường)|#|(?:https?:\/\/|www\.)/iu.test(value)&&!/(?:^|\s)\d+[a-z]?\s+(?!(?:m\b|mét\b|triệu\b|tr\b|đồng(?=\s*(?:\/|mỗi\b|một\b|[.,;]|$))|tầng\b|phòng\b|đến\b|tháng\b|năm\b|ngày\b|chỗ\b|người\b|ô\b|bàn\b|máy\b|giường\b|wc\b|toilet\b|mặt\b|lối\b|cửa\b))\p{L}/iu.test(value);
}
export async function draft(body,who,{allowGeneralLocation=false}={}){
 const title=clean(body.title,160),location=clean(body.location,160),description=clean(body.description,3000),area=clean(body.area),type=clean(body.type),{price,size,priceBasis,pricePerM2}=formPricing(body);
 if(!title||!location||!description||!(areas.includes(area)||(allowGeneralLocation&&who.admin&&area==='Hà Nội'))||!categories.includes(type)||!Number.isFinite(price)||price<=0||price>1000000||!Number.isFinite(size)||size<=0||size>10000000)throw problem(400,'Vui lòng kiểm tra tiêu đề, khu vực, danh mục, giá và diện tích.');
 if(!safePublicText([title,location,description].join(' ')))throw problem(400,'Phần công khai không được có số nhà, ngõ/ngách, hashtag hay liên kết. Chuyển thông tin này vào ô riêng tư.');
 const ids=Array.isArray(body.assetIds)?[...new Set(body.assetIds)].slice(0,12):[];
 if(ids.some(id=>!/^[-\da-f]{36}$/i.test(id)))throw problem(400,'Tệp không hợp lệ.');
 let assets=[];
 if(ids.length){assets=await db('assets',{query:'?id=in.('+ids.join(',')+')&select=*'});if(assets.length!==ids.length||assets.some(a=>!who.admin&&a.owner_id!==who.id)||assets.some(a=>a.kind==='document'))throw problem(403,'Chỉ được gắn ảnh/video của chính anh/chị.')}
 const id=Date.now()*1000+randomInt(1000),code='WEB-'+id,slug='live-'+id;
 const image=assets.find(a=>a.kind==='image');
 const media=assets.map(a=>({id:a.id,kind:a.kind,mime:a.mime,name:a.name}));
 const publicAddress=allowGeneralLocation?[...new Set([location==='Liên hệ để biết vị trí'?'':location,area,'Hà Nội'].filter(Boolean))].join(', ')+(location==='Liên hệ để biết vị trí'?' — liên hệ để biết vị trí':''):location+', '+area+', Hà Nội';
 const public_data={id,code,slug,href:'/tin?slug='+slug,title,address:publicAddress,area,type,categories:[type],price,priceBasis,pricePerM2,size,areaText:size+' m²',facts:[],notes:[],description,image:image?'/api/files?action=media&id='+image.id:'/banner.png',shareImage:image?'/api/files?action=media&id='+image.id:'/banner.png',isIllustration:!image,imageAlt:image?'Ảnh BĐS do người đăng cung cấp':'Banner minh họa loại hình BĐS',contactPhone:'0906215365',status:'Cần xác nhận tình trạng còn trống',media};
 if(pricePerM2)public_data.facts.push('Đơn giá: '+new Intl.NumberFormat('vi-VN').format(pricePerM2)+' đồng/m²/tháng.');
 public_data.shareText=`${title}\nKhu vực: ${public_data.address}\nDiện tích: ${size} m²\nGiá thuê: ${price} triệu đồng/tháng\n${description}\nLiên hệ: 0906215365`;
 if(pricePerM2)public_data.shareText+='\nĐơn giá: '+new Intl.NumberFormat('vi-VN').format(pricePerM2)+' đồng/m²/tháng.';
 const private_data={address:clean(body.privateAddress,500),hashtags:(clean(body.hashtags,1500).match(/#[\p{L}\p{N}_]+/gu)||[])};
 return {author_id:who.id,status:'pending',public_data,private_data};
}
