// Public wording for compressed agency messages. Original Telegram text is kept
// in the private archive by intake; payment, fee and ambiguous terms stay private.
const fold=v=>String(v||'').normalize('NFD').replace(/\p{M}/gu,'').replace(/[đĐ]/g,'d').toLowerCase();
const n='\\d+(?:[.,]\\d+)?';
const bareTerm=new RegExp('(?:duoi|tren)\\s*'+n+'(?!\\d|[.,]\\d)(?!(?:\\s*)(?:trieu|tr|ty|m2|m²|m\\b|nghin|ngan|k\\b|dong|d\\b|tuoi))','iu');
export const privateBriefTerm=value=>bareTerm.test(fold(value));
export const privateBriefCode=value=>/\b(?:tt\s*[:=]?\s*\d|hh\s*[:=]?\s*\d|hd\s*[:=]?\s*\d+(?:\s*(?:thang|nam|t)\b|(?=$|[.,;\s])))/.test(fold(value));
export function agencyShorthand(value){const s=fold(value);return privateBriefCode(s)||/\b(?:tt\s*\d+\s*c\s*\d+|mt\s*[:=]?\s*\d+|dt\s*[:=]?\s*\d+)/.test(s)||privateBriefTerm(s)||(/\d\s*(?:m2\b|m²(?!\p{L})|m\b)/u.test(s)&&/\d\s*tr(?:\d{1,3}k?)?\b/.test(s)&&/,/.test(s))}
function clauses(line){const parts=line.split(/,(?!\d)/u),out=[];for(const part of parts){const s=fold(part).trim(),previous=fold(out.at(-1)||'');const negative=/\b(?:khong|ko|chua)\b/.test(previous),explicit=/^(?:co\b|khong\b|ko\b|tt\s*\d|mt\s*\d|dt\s*\d|phi\b|nguon\b|gia\b|dien tich\b|mat tien\b)/.test(s),access=/^loi(?: di)? (?:rieng|chung)\b/.test(s),business=/hang an|an uong|nha hang|quan an|mo hinh sach/.test(previous);const permission=/\b(?:phu hop|cho phep|kinh doanh duoc|nhan|lam)\b/.test(previous),businessItem=/^(?:spa|van phong|showroom|cafe|ca phe|quan an|nha hang|my pham|thoi trang|sieu thi|cua hang|ban hang online)(?:\s*\.{0,3})?$/.test(s);if(negative&&!explicit&&!(access&&business)||permission&&businessItem&&!explicit)out[out.length-1]+=', '+part;else out.push(part)}return out;}
const clean=v=>v.replace(/^[\s.,;()]+|[\s,;()]+$/gu,'').replace(/[ \t]{2,}/g,' ').trim();
export function publicShorthandText(value,item={}){
 const output=[];
 for(const raw of String(value||'').split(/\r?\n/u)){
  if(!agencyShorthand(raw)){output.push(raw);continue}
  for(const part of clauses(raw)){
   let line=clean(part),s=fold(line);if(!line)continue;
   if(/^(?:tt\s*[:=]?\s*\d|hd\s*[:=]?\s*\d|phi\b|hh(?=\s|\d|:)|hoa hong\b|nguon\b|chu nha\b|doi tac\b)/.test(s))continue;
   const normalized=fold(line).replace(/[.]/g,'').trim();if([item.location,item.area,item.privateAddress].filter(Boolean).some(v=>fold(v).trim()===normalized))continue;
   if(/^\d+[a-z]?(?:\/\d+)*\s+\p{L}/u.test(line)&&!/^\d+\s*(?:m²|m2|m\b|tr\b|triệu|k\b)/iu.test(line))continue;
   // Remove compact scalar fragments: verified values are rendered by sourceNarrative.
   line=line.replace(new RegExp('^(?:(?:dt|diện tích|dien tich|mt|mặt tiền|mat tien|ngang|giá(?: thuê)?|gia(?: thue)?)\\s*[:=]?\\s*)?'+n+'\\s*(?:m²|m2|m\\b|tr(?:iệu)?(?:\\d{1,3}(?:k)?)?\\b|triệu(?: đồng)?|nghìn|ngan|k\\b)(?:\\s*/\\s*(?:1\\s*)?(?:sàn|san|tầng|tang|tháng|thang))?(?:\\s*[x×*]\\s*\\d+(?:[.,]5)?\\s*(?:tầng|tang|t\\b))?','iu'),'');
   if(privateBriefTerm(line))line=line.replace(/(?:dưới|duoi|trên|tren)\s*\d+(?:[.,]\d+)?(?!\d|[.,]\d)(?:\s*(?:tháng|thang|năm|nam))?/iu,'');
   line=clean(line);s=fold(line).replace(/[().]/g,'').trim();if(!s)continue;
   if([item.location,item.area].filter(Boolean).some(v=>fold(v).trim()===s))continue;
   if(/^(?:mô hình sạch|mo hinh sach)\s*\(?\s*(?:(?:không|khong|ko)\s*(?:nhận\s*|nhan\s*)?(?:hàng ăn|hang an))?\s*\)?[.!]?$/iu.test(line)){output.push('Ưu tiên các mô hình kinh doanh sạch.');if(/khong|không|ko/iu.test(line))output.push('Không nhận mô hình kinh doanh hàng ăn.');continue}
   if(/^(?:không|khong|ko)\s*(?:nhận\s*|nhan\s*)?(?:hàng ăn|hang an)[.!]?$/iu.test(line)){output.push('Không nhận mô hình kinh doanh hàng ăn.');continue}
   if(/^loi(?: di)? rieng$/.test(s)){output.push('Có lối đi riêng.');continue}
   if(/^loi(?: di)? chung$/.test(s)){output.push('Có lối đi chung.');continue}
   if(/^(?:cho thue\s+)?tang\s*\d+(?:\s*(?:va|&|,)\s*(?:tang\s*)?\d+)*$/.test(s)&&item.floors)continue;
   if(!privateBriefTerm(line)&&!agencyShorthand(line))output.push(line);
  }
 }
 return output.join('\n');
}

export function expandPublicUnits(value){return String(value||'').replace(/\/\s*m2\b/giu,'/m²').replace(/\b(\d+(?:[.,]\d+)?)\s*k\b(?:\s*đồng)?/giu,(_,n)=>new Intl.NumberFormat('vi-VN').format(Number(n.replace(',','.'))*1000)+' đồng').replace(/(\d+(?:[.,]\d+)?)\s*tr(?:iệu)?(\d{1,3}(?:k)?)?\b(?:\s*đồng)?/giu,(_,whole,fraction)=>{let amount=Number(whole.replace(',','.'));if(fraction){const raw=fraction.replace(/k$/i,'');amount+=Number(raw)/(/k$/i.test(fraction)?1000:10**raw.length)}return new Intl.NumberFormat('vi-VN',{maximumFractionDigits:3}).format(amount)+' triệu đồng'})}
