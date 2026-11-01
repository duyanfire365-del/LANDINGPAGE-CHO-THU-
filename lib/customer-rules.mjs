import {clean,problem} from './platform.mjs';
import {foldVietnamese} from './source-pricing.mjs';
export function customerData(input={}){
 const data={};for(const [key,max]of Object.entries({name:120,phone:25,address:400,industry:100,area:300,type:100,budget:80,requirements:3000,notes:3000,birthYear:4,contactDate:10,nextContact:10,source:150,sourceText:16000,contactHint:100}))data[key]=clean(input[key],max);
 data.phone=data.phone.replace(/[ .()-]/g,'');if(data.phone&&!/^(?:0|\+84)\d{9}$/.test(data.phone))throw problem(400,'Số điện thoại khách chưa đúng định dạng Việt Nam.');data.phone=data.phone.replace(/^\+84/,'0');if(!data.name&&!data.phone&&![data.requirements,data.notes,data.sourceText].some(v=>v.trim()))throw problem(400,'Cần nội dung nhu cầu khách để lưu hồ sơ.');
 for(const key of ['maxBudget','minSize']){data[key]=input[key]===''||input[key]==null?null:Number(input[key]);if(data[key]!==null&&(!Number.isFinite(data[key])||data[key]<=0||data[key]>(key==='minSize'?10000000:1000000)))throw problem(400,'Ngân sách hoặc diện tích khách chưa hợp lệ.');}
 if(data.birthYear&&(!/^\d{4}$/.test(data.birthYear)||+data.birthYear<1900||+data.birthYear>new Date().getFullYear()))throw problem(400,'Năm sinh chưa hợp lệ.');
 for(const key of ['contactDate','nextContact'])if(data[key]&&!/^\d{4}-\d{2}-\d{2}$/.test(data[key]))throw problem(400,'Ngày liên hệ dùng định dạng năm-tháng-ngày.');
 const fold=foldVietnamese;
 const types=[['Văn phòng',/^(?:van phong|vp)$/],['Kho xưởng',/^(?:kho|xuong|kho xuong|kx)$/],['Mặt bằng kinh doanh',/^(?:mat bang|mat bang kinh doanh|mb|mbkd)$/],['Nhà nguyên căn',/^(?:nha nguyen can|nnc)$/],['Căn hộ chung cư',/^(?:chung cu|can ho chung cu|chcc)$/],['Căn hộ dịch vụ',/^(?:can ho dich vu|chdv)$/]];data.type=types.find(([,re])=>re.test(fold(data.type)))?.[0]||data.type;
 const sectors=[['Văn phòng / Showroom',/van phong|showroom/],['Cà phê / Trà sữa',/ca phe|cafe|tra sua/],['Kho hàng / Sản xuất',/kho|xuong|san xuat/],['Nhà hàng / Quán ăn',/nha hang|quan an|(?:^|\s)oc(?:\s|$)|do oc/],['Spa / Nail / Tóc',/spa|nail|toc/]];if(data.industry)data.industry=sectors.find(([,re])=>re.test(fold(data.industry)))?.[0]||data.industry;
 if(/^(?:chưa rõ|chưa có|không rõ|ẩn danh|unknown)$/iu.test(data.name))data.name='';data.name||='Khách chưa rõ tên';return data;
}
export function parseCustomers(text,{allowAnonymous=false}={}){
 const source=String(text||'').slice(0,60000),blocks=source.split(/\n\s*(?:---+|===+)\s*\n|\n(?=\s*(?:Họ và tên|Họ tên|Tên khách|Khách hàng|Tên)\s*[:：])/iu).filter(s=>s.trim());
 if(blocks.length>50)throw problem(413,'Mỗi lần nhập tối đa 50 khách. Hãy chia nhỏ tài liệu.');
 const items=[],unresolved=[];for(const block of blocks){const phones=[...new Set((block.match(/(?<![\d.,])(?:\+84|0)(?:[ .()-]*\d){9}(?!\d)/g)||[]).map(s=>s.replace(/[ .()-]/g,'')))];if(phones.length>1){unresolved.push(block);continue}
 const fields={sourceText:block,requirements:block,phone:phones[0]||''},labels={name:['ho va ten','ho ten','ten khach','khach hang','ten','kh'],address:['dia chi','dia chi khach'],area:['khu vuc','khu vuc mong muon','quan','quanh kv','quanh khu vuc'],type:['loai bds','loai hinh'],industry:['nganh nghe','muc dich','nhu cau lam gi'],notes:['ghi chu'],birthYear:['nam sinh'],maxBudget:['ngan sach toi da'],minSize:['dien tich toi thieu']};
 for(const line of block.split('\n')){const m=line.match(/^\s*([^:：]{1,50})[:：]\s*(.*)$/);if(!m)continue;const label=foldVietnamese(m[1]).trim();for(const [key,aliases]of Object.entries(labels))if(aliases.includes(label))fields[key]=m[2].trim()}
 if(!fields.name&&!fields.phone&&!allowAnonymous){unresolved.push(block);continue}
 if(!/[\p{L}]/u.test(block)||/^\s*(?:[=＝]?[01]|#?bổ sung|#?sửa tin|#?thay thế|\/\w+)\s*$/iu.test(block)){unresolved.push(block);continue}
 const hint=block.match(/(?:sđt|sdt|điện thoại)\s*[:：]\s*([^\n]+)/iu)?.[1];if(hint&&!fields.phone)fields.contactHint=hint.slice(0,100);
 const provider=block.match(/^\s*KH\s+của\s+([^:\n]+)[:：]?/imu)?.[1];if(provider)fields.source=provider.trim();
 if(!fields.industry)fields.industry=block.match(/^\s*Thuê làm\s+(.+)$/imu)?.[1]?.slice(0,100)||'';
 if(!fields.industry){const aliases=[['Văn phòng / Showroom',/van phong|showroom/],['Cà phê / Trà sữa',/ca phe|cafe|tra sua/],['Kho hàng / Sản xuất',/kho|xuong|san xuat/],['Nhà hàng / Quán ăn',/nha hang|quan an|(?:^|\s)oc(?:\s|$)|do oc/]];fields.industry=aliases.find(([,re])=>re.test(foldVietnamese(block)))?.[0]||'';}
 if(!fields.type){const f=foldVietnamese(block);fields.type=/\bmb\b|mat bang/.test(f)?'Mặt bằng kinh doanh':/van phong/.test(f)?'Văn phòng':/kho|xuong/.test(f)?'Kho xưởng':'';}
 const folded=foldVietnamese(block),size=folded.match(/(?:dien tich(?: toi thieu)?|tu|can)\s*[:：]?\s*(\d+(?:[.,]\d+)?)\s*m2/),money=folded.match(/(?:ngan sach(?: toi da)?|tai chinh|toi da|duoi|khong qua)\s*[:：]?\s*(\d+(?:[.,]\d+)?)\s*(?:trieu|tr\b)/);fields.minSize=size?Number(size[1].replace(',','.')):fields.minSize?Number(fields.minSize):null;fields.maxBudget=money?Number(money[1].replace(',','.')):fields.maxBudget?Number(fields.maxBudget):null;
 try{items.push(customerData(fields))}catch{unresolved.push(block)}}return {items,unresolved};
}
