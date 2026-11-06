import '../public/location-fields.js';
import {displayAddress} from './location-display.mjs';
import {privateBriefTerm,privateBriefCode} from './shorthand-copy.mjs';
import {negotiationCopy} from './listing-privacy.mjs';
import {problem} from './platform.mjs';
export function postLocationFields(body,previous={}){
 const existing=globalThis.RentalLocations.parts(previous);let street=String(body.street??body.location??existing.street??'').trim(),ward=String(body.ward??existing.ward??'').trim(),area=String(body.area??previous.area??'').trim();
 if(street.length>160||ward.length>120||[street,ward].some(v=>privateBriefTerm(v)||privateBriefCode(v)||negotiationCopy(v)||globalThis.RentalLocations.privateQuery(v)||/^(?:gan|canh|sat|doi dien|cach|phia sau|ngay sau|ben hong)\s/.test(globalThis.RentalLocations.fold(v))||/[@#<>:\\=%]/u.test(v)||/\b(?:mr|mrs|ms|zalo|sdt|hotline|dien thoai|gia chot|gia net|hoa hong|phi moi gioi|thuong luong|chu nha|nguon doi tac)\b/.test(globalThis.RentalLocations.fold(v))))throw problem(400,'Tên đường và phường/xã công khai không chứa số nhà, ngõ/ngách, SĐT hoặc liên kết. Điền địa chỉ chi tiết vào mục riêng tư.');
 const inferred=globalThis.RentalLocations.parts({address:street,area});if(!ward&&inferred.ward){ward=inferred.ward;street=inferred.street;}
 return {street,ward,area,address:displayAddress([street,ward].filter(Boolean).join(', '),area)};
}
