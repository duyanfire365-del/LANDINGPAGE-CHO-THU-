// Normalize presentation, never invent or pad a missing contact digit.
export function customerInputText(value){return String(value??'').normalize('NFKC').replace(/[\u200b-\u200f\u202a-\u202e\u2060-\u2069\ufeff]/g,'').replace(/[\u2010-\u2015\u2212]/g,'-').replace(/\r\n?/g,'\n').replace(/[\u00a0\u2000-\u200a\u202f]/g,' ')}
export function normalizeCustomerPhone(value){return customerInputText(value).replace(/[\s.·•()-]/g,'').replace(/^\+84/,'0')}
export function customerPhones(value){const matches=customerInputText(value).match(/(?<![\d.,])(?:\+84|0)(?:[ .()·-]*\d){9}(?!\d)/g)||[];return [...new Set(matches.map(normalizeCustomerPhone))]}
export function customerMessageInput(message){const text=typeof message.text==='string'?message.text:typeof message.caption==='string'?message.caption:'';return {text:customerInputText(text),originalText:text,telegramMessage:{message_id:message.message_id,text:typeof message.text==='string'?message.text:undefined,caption:typeof message.caption==='string'?message.caption:undefined,entities:message.entities,caption_entities:message.caption_entities}}}
export function extractCustomerCriteria(value){const s=customerInputText(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').replace(/²/g,'2').toLowerCase(),out={},number='(\\d+(?:[.,]\\d+)?)',n=x=>Number(x.replace(',','.'));
 const range=s.match(new RegExp('dien tich(?: mong muon)?\\s*[:：]?\\s*(?:tu\\s*)?'+number+'\\s*(?:-|den)\\s*'+number+'\\s*(?:m2|m\\^2|met vuong)'));
 if(range){if(n(range[1])<=n(range[2])){out.minSize=n(range[1]);out.maxSize=n(range[2])}else out.parseWarnings=['Khoảng diện tích đảo ngược; giữ nguyên văn để xác nhận.'];}
 else{const size=s.match(new RegExp('(?:dien tich(?: toi thieu)?|\\btu|\\bcan)\\s*[:：]?\\s*'+number+'\\s*(?:m2|m\\^2|met vuong)'));if(size)out.minSize=n(size[1]);}
 const frontage=s.match(new RegExp('(?:mat tien(?: toi thieu)?|\\bmt)\\s*[:：]?\\s*(?:tu\\s*)?'+number+'\\s*(?:m(?![a-z0-9])|met\\b)'));if(frontage)out.minFrontage=n(frontage[1]);
 const area=String(value).match(/(?:^|\n)\s*[•●▪-]?\s*(?:Địa bàn(?: các quận)?|Khu vực(?: mong muốn)?|Quận(?: huyện)?)\s*[:：]\s*([^\n]+)/iu)?.[1];if(area)out.area=area.trim().replace(/[.;]+$/,'');
 const approximate=s.match(new RegExp('(?:budget|ngan sach|tai chinh)\\s*[:：]?\\s*(?:tren duoi|khoang|tam|xap xi|quanh)\\s*'+number+'\\s*(?:trieu|tr\\b)'));
 if(approximate){out.budget='Khoảng '+approximate[1]+' triệu/tháng — cần xác nhận mức tối đa';out.maxBudget=null;out.budgetApproximate=true;}
 else{const money=s.match(new RegExp('(?:ngan sach(?: toi da)?|tai chinh|budget|toi da|duoi|khong qua)\\s*[:：]?\\s*'+number+'\\s*(?:trieu|tr\\b)'));if(money){out.maxBudget=n(money[1]);out.budgetApproximate=false;}}
 if(/sieu thi|cua hang tien loi/.test(s))out.industry='Siêu thị / Cửa hàng tiện lợi';return out;
}
