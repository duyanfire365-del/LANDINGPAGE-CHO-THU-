import {industryGroups} from './business-suitability.mjs';
import {customerInputText,normalizeCustomerPhone,customerPhones,extractCustomerCriteria} from './customer-input.mjs';
import {clean,problem} from './platform.mjs';
import {foldVietnamese} from './source-pricing.mjs';
export function customerData(input={}){
 const data={};for(const [key,max]of Object.entries({name:120,phone:100,address:400,industry:100,area:300,type:100,budget:80,requirements:3000,notes:3000,birthYear:4,contactDate:10,nextContact:10,source:150,sourceText:16000,contactHint:100}))data[key]=clean(input[key],max);
 data.phone=normalizeCustomerPhone(data.phone);if(data.phone&&!/^(?:0|\+84)\d{9}$/.test(data.phone))throw problem(400,'Số điện thoại khách chưa đúng định dạng Việt Nam.');data.phone=data.phone.replace(/^\+84/,'0');if(!data.name&&!data.phone&&![data.requirements,data.notes,data.sourceText,data.area,data.industry,data.type,data.budget].some(v=>v.trim())&&!['maxBudget','minSize','maxSize','minFrontage'].some(k=>Number(input[k])>0))throw problem(400,'Cần nội dung nhu cầu khách để lưu hồ sơ.');
 for(const key of ['maxBudget','minSize','maxSize','minFrontage']){data[key]=input[key]===''||input[key]==null?null:Number(input[key]);if(data[key]!==null&&(!Number.isFinite(data[key])||data[key]<=0||data[key]>(['minSize','maxSize'].includes(key)?10000000:key==='minFrontage'?1000:1000000)))throw problem(400,'Ngân sách hoặc diện tích khách chưa hợp lệ.');}
 if(data.minSize&&data.maxSize&&data.minSize>data.maxSize)throw problem(400,'Khoảng diện tích chưa hợp lệ.');
 if(Object.hasOwn(input,'budgetApproximate'))data.budgetApproximate=input.budgetApproximate===true&&data.maxBudget===null;if(Array.isArray(input.parseWarnings))data.parseWarnings=input.parseWarnings.filter(x=>typeof x==='string').slice(0,10);
 if(data.birthYear&&(!/^\d{4}$/.test(data.birthYear)||+data.birthYear<1900||+data.birthYear>new Date().getFullYear()))throw problem(400,'Năm sinh chưa hợp lệ.');
 for(const key of ['contactDate','nextContact'])if(data[key]&&!/^\d{4}-\d{2}-\d{2}$/.test(data[key]))throw problem(400,'Ngày liên hệ dùng định dạng năm-tháng-ngày.');
 const fold=foldVietnamese;
 const types=[['Văn phòng',/^(?:van phong|vp)$/],['Kho xưởng',/^(?:kho|xuong|kho xuong|kx)$/],['Mặt bằng kinh doanh',/^(?:mat bang|mat bang kinh doanh|mb|mbkd)$/],['Nhà nguyên căn',/^(?:nha nguyen can|nnc)$/],['Căn hộ chung cư',/^(?:chung cu|can ho chung cu|chcc)$/],['Căn hộ dịch vụ',/^(?:can ho dich vu|chdv)$/]];data.type=types.find(([,re])=>re.test(fold(data.type)))?.[0]||data.type;
 const sectors=[['Văn phòng / Showroom',/van phong|showroom/],['Cà phê / Trà sữa',/ca phe|cafe|tra sua/],['Kho hàng / Sản xuất',/\b(?:kho|xuong)\b|san xuat/],['Nhà hàng / Quán ăn',/nha hang|quan an|(?:^|\s)oc(?:\s|$)|do oc/],['Spa / Nail / Tóc',/spa|nail|toc/]];if(data.industry&&industryGroups(data.industry).length<=1)data.industry=sectors.find(([,re])=>re.test(fold(data.industry)))?.[0]||data.industry;
 if(/^(?:chưa rõ|chưa có|không rõ|ẩn danh|unknown)$/iu.test(data.name))data.name='';data.name||='Khách chưa rõ tên';return data;
}
export function parseCustomers(text,{allowAnonymous=false}={}){
 const source=String(text||'').slice(0,60000),blocks=source.split(/\n\s*(?:---+|===+)\s*\n|\n(?=\s*(?:Họ và tên|Họ tên|Tên khách|Khách hàng|Tên)\s*[:：])/iu).filter(s=>s.trim());
 if(blocks.length>50)throw problem(413,'Mỗi lần nhập tối đa 50 khách. Hãy chia nhỏ tài liệu.');
 const items=[],unresolved=[];for(const originalBlock of blocks){const block=customerInputText(originalBlock),phones=customerPhones(block);if(phones.length>1){unresolved.push(block);continue}
 const fields={sourceText:originalBlock,requirements:originalBlock,phone:phones[0]||''},labels={name:['ho va ten','ho ten','ten khach','khach hang','ten','kh'],address:['dia chi','dia chi khach'],area:['khu vuc','khu vuc mong muon','quan','quanh kv','quanh khu vuc'],type:['loai bds','loai hinh'],industry:['nganh nghe','muc dich','nhu cau lam gi'],notes:['ghi chu'],birthYear:['nam sinh'],maxBudget:['ngan sach toi da'],minSize:['dien tich toi thieu']};
 for(const rawLine of block.split('\n')){const line=rawLine.replace(/^\s*[•●▪✓✔-]\s*/,''),m=line.match(/^\s*([^:：]{1,50})[:：]\s*(.*)$/);if(!m)continue;const label=foldVietnamese(m[1]).trim();for(const [key,aliases]of Object.entries(labels))if(aliases.includes(label))fields[key]=m[2].trim()}
 if(!fields.name&&!fields.phone&&!allowAnonymous){unresolved.push(block);continue}
 if(!/[\p{L}]/u.test(block)||/^\s*(?:[=＝]?[01]|#?bổ sung|#?sửa tin|#?thay thế|\/\w+)\s*$/iu.test(block)){unresolved.push(block);continue}
 if(fields.name)fields.name=fields.name.replace(/\s*(?:[-|;,]\s*)?(?:sđt|sdt|điện thoại|phone)\s*[:：].*$/iu,'').replace(/[ \-|;,]+$/,'').trim();
 const hint=block.match(/(?:sđt|sdt|điện thoại)\s*[:：]\s*([+0-9xX*? .()\-]{4,100})/iu)?.[1]?.replace(/[ .()\-]+$/,'');if(hint&&!fields.phone)fields.contactHint=hint.slice(0,100);
 const provider=block.match(/^\s*KH\s+của\s+([^:\n]+)[:：]?/imu)?.[1];if(provider)fields.source=provider.trim();
 if(!fields.industry)fields.industry=block.match(/^\s*Thuê làm\s+(.+)$/imu)?.[1]?.slice(0,100)||'';
 if(!fields.industry){const aliases=[['Văn phòng / Showroom',/van phong|showroom/],['Cà phê / Trà sữa',/ca phe|cafe|tra sua/],['Kho hàng / Sản xuất',/\b(?:kho|xuong)\b|san xuat/],['Nhà hàng / Quán ăn',/nha hang|quan an|(?:^|\s)oc(?:\s|$)|do oc/]];fields.industry=aliases.find(([,re])=>re.test(foldVietnamese(block)))?.[0]||'';}
 if(!fields.type){const f=foldVietnamese(block);fields.type=/\bmb\b|mat bang/.test(f)?'Mặt bằng kinh doanh':/van phong/.test(f)?'Văn phòng':/\b(?:kho|xuong)\b/.test(f)?'Kho xưởng':'';}
 Object.assign(fields,extractCustomerCriteria(block));
 for(const key of ['minSize','maxSize','minFrontage','maxBudget'])if(fields[key]!==undefined&&fields[key]!==null&&typeof fields[key]!=='number'){const m=String(fields[key]).match(/^\s*(\d+(?:[.,]\d+)?)(?:\s*(?:m²|m2|m|triệu|tr|mét))?\s*$/iu);fields[key]=m?Number(m[1].replace(',','.')):null;}
 try{items.push(customerData(fields))}catch(error){if(!allowAnonymous){unresolved.push(originalBlock);continue}const fallback={...fields,phone:phones[0]||'',birthYear:'',contactDate:'',nextContact:'',maxBudget:null,minSize:null,maxSize:null,minFrontage:null,parseWarnings:[...(fields.parseWarnings||[]),error.message]};items.push(customerData(fallback));}}return {items,unresolved};
}
