// Inline agency shorthand. Preserve agreements verbatim; never infer a fee base.
export const foldBrief=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase();
const trim=v=>v.replace(/^[\s,:：=–—.-]+|[\s,;|–—.-]+$/g,'').trim();
export function inlineSourceDetails(value){
 const text=String(value||'');let sourceName='',commission='';const notes=[];
 const source=text.match(/(?:^|[\s,;|.])(?:thông tin nguồn|thong tin nguon|nguồn(?:\s+(?:hàng|của|từ))?|nguon(?:\s+(?:hang|cua|tu))?|người cung cấp|nguoi cung cap)\s*[:：=]?\s*([^\n;|]+)/iu);
 if(source){sourceName=trim(source[1].split(/(?:\s|[,.;])+(?=(?:phí|phi|hoa hồng|hoa hong|hh|tt\s*\d|map|giá|gia|sđt|sdt|điện thoại|dien thoai)(?=\s|[:：=\d]))/iu)[0]).replace(/https?:\/\/\S+/gi,'').replace(/(?:\+?84|0)(?:[ .()–—-]*\d){9}(?!\d)/g,'').trim();if(/chưa cung cấp|chua cung cap|chưa rõ|chua ro|đang cập nhật/iu.test(sourceName))sourceName='';if(sourceName.length>150||!/^\p{L}/u.test(sourceName))sourceName='';}
 const fee=text.match(/(?:^|[\s,;|.])((?:hoa\s*hồng|hoa\s*hong|phí\s*môi\s*giới|phi\s*moi\s*gioi|phí|phi|hh)\s*(?:(?:khách|khach|chủ|chu|đối tác|doi tac)\s*)?[:：=]?\s*(?:\d+(?:\s*\/\s*\d+|[.,]\d+)?\s*(?:%|tr(?:iệu)?|triệu|tháng|thang|k|nghìn)?|thỏa thuận|thoa thuan|khách trả|khach tra)[^\n;|]*)/iu);
 if(fee)commission=trim(fee[1].split(/[,;](?!\d)|\s+(?=(?:nguồn|nguon|chủ nhà|chu nha|đối tác|doi tac|map|giá thuê|gia thue|tt\s*\d)\b)/iu)[0]);
 if(!commission){const payer=text.match(/\b(?:kh(?:ách|ach)?\s*(?:trả\s*)?(?:phí|phi)|(?:phí|phi)\s*kh(?:ách|ach)?)(?=$|[\s,.;])/iu);if(payer)commission='Khách trả phí; nguồn ghi: '+trim(payer[0])+' (chưa có mức phí cụ thể).';}
 if(sourceName)notes.push('Nguồn: '+sourceName+'.');if(commission)notes.push('Hoa hồng / phí theo nguồn: '+commission+'.');
 return {sourceName,commission,privateNotes:notes.join('\n')};
}
export function isCustomerDemand(value){const s=foldBrief(value);return /(?:^|\n)\s*(?:kh|khach hang|khach|nhu cau)\s*[:：]/.test(s)&&/thue lam|can thue|tim thue|tim mat bang|tai chinh|ngan sach/.test(s)||/\b(?:can tim|dang tim|tim thue|can thue)\b/.test(s)&&!/\b(?:cho thue|sang nhuong)\b/.test(s);}
export function briefDimensions(value){
 const s=foldBrief(value);let floors=null,frontage=null;const floorMatch=s.match(/(?:m2|m²)\s*(?:\/\s*san)?\s*[x×*]\s*(\d+(?:[.,]5)?)\s*(?:tang|t)(?=$|[\s,;.:])/u);
 if(floorMatch&&!/^\s*[,;]\s*\d+(?:[.,]\d+)?\s*t\b/.test(s.slice(floorMatch.index+floorMatch[0].length)))floors=Number(floorMatch[1].replace(',','.'));
 const mt=s.match(/(?:m[²2](?:\s*\/\s*san)?\s*[x×*]\s*\d+(?:[.,]5)?\s*t(?:ang)?\s*[,;]\s*)(\d+(?:[.,]\d+)?)\s*m\b/u);if(mt)frontage=Number(mt[1].replace(',','.'));
 const numbered=[...s.matchAll(/(?:^|[\s,.;])t(?:ang)?\s*(\d+)\s*[:：]/g)].map(m=>Number(m[1]));
 const perFloor=!!floorMatch||/(?:m2|m²)\s*\/\s*san/.test(s);
 return {floors,frontage,perFloor,numberedFloors:numbered};
}
export function operatingRestrictions(value){const s=foldBrief(value),out=[];
 if(/\b(?:khong|kh|ko)\s+(?:nhan\s+|lam\s+|cho\s+)?(?:hang an|nha hang|quan an)\b/.test(s))out.push('Không nhận mô hình kinh doanh hàng ăn.');
 if(/\b(?:khong|kh|ko)\s+(?:duoc\s+)?o qua dem\b/.test(s))out.push('Không sử dụng để ở qua đêm.');
 if(/\b(?:mo hinh sach|kinh doanh sach)\b/.test(s))out.push('Ưu tiên các mô hình kinh doanh sạch.');
 return out;
}
export function sourceIllustrationScene(value){const text=foldBrief(value);if(operatingRestrictions(value).some(s=>s.includes('hàng ăn')))return 'shop';if(/ca phe|cafe|coffee/.test(text))return 'cafe';if(/quan an|nha hang|banh cuon|quan lau|quan nhau/.test(text))return 'restaurant';if(/showroom/.test(text))return 'showroom';return 'shop';}
