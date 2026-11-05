import {problem} from './platform.mjs';
const fold=v=>String(v||'').normalize('NFD').replace(/\p{M}/gu,'').replace(/[đĐ]/g,'d').toLowerCase();
export const transactionType=p=>p?.transactionType==='sale'||p?.transaction==='sale'||p?.isSale===true?'sale':'rent';
export function listingIntent(source){
 const s=fold(source),sale=/(?:^|\n)\s*ban(?=\s|[:：])|(?:^|\s)#muaban\b|\b(?:can ban|chinh chu ban|gia ban|rao ban|ban nha|ban dat|ban can ho|ban chung cu|ban kho|ban xuong|ban biet thu|ban lien ke|ban mat bang|ban ki.?ot|ban van phong|ban phong tro)\b/.test(s),rent=/(?:^|\s)#chothue\b|\bcho thue\b/.test(s),buyer=/\b(?:can mua|tim mua|khach mua)\b/.test(s);
 if(buyer)throw problem(422,'Đây là nhu cầu tìm mua của khách; lưu riêng để tư vấn, không đăng thành nguồn bán.');
 if(sale&&(rent||/sang nhuong|chuyen nhuong|\/\s*(?:thang|th|thg)\b/.test(s)))throw problem(422,'Bài có cả bán và cho thuê/sang nhượng. Tách riêng từng giao dịch để tránh đăng nhầm giá.');
 if(!sale&&!rent&&!/sang nhuong|chuyen nhuong/.test(s)&&/\d\s*ty\b/.test(s)&&!/\/\s*(?:thang|th|thg)\b/.test(s))throw problem(422,'Nguồn có giá theo tỷ nhưng chưa rõ giao dịch. Thêm Bán hoặc #muaban để xác nhận trước khi đăng.');
 return sale?'sale':'rent';
}
export function saleCopy(value){return String(value||'').replace(/Cho thuê/gu,'Bán').replace(/cho thuê/gu,'bán').replace(/Giá thuê/gu,'Giá bán').replace(/giá thuê/gu,'giá bán').replace(/tiền thuê/giu,'giá bán').replace(/điều kiện thuê/giu,'điều kiện giao dịch').replace(/đất (?:cho thuê|bán)/giu,'đất').replace(/đồng\/m²\/tháng/giu,'đồng/m²').replace(/triệu(?: đồng)?\/tháng/giu,'triệu đồng').replace(/\/tháng/giu,'').replace(/không gian ở/giu,'bất động sản');}
export const salePrice=value=>Number(value)>0?new Intl.NumberFormat('vi-VN',{maximumFractionDigits:3}).format(value>=1000?value/1000:value)+(value>=1000?' tỷ đồng':' triệu đồng'):'Giá liên hệ';
