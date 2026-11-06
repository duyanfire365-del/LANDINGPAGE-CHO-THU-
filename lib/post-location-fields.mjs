import '../public/location-fields.js';
import {displayAddress} from './location-display.mjs';
import {privateBriefTerm,privateBriefCode} from './shorthand-copy.mjs';
import {negotiationCopy} from './listing-privacy.mjs';
import {problem} from './platform.mjs';
export function postLocationFields(body,previous={},{adminAuthored=false}={}){
 const inferredExisting=globalThis.RentalLocations.parts(previous),existing=previous.adminAuthoredCopy===true?{street:previous.street??inferredExisting.street,ward:previous.ward??inferredExisting.ward}:inferredExisting;let street=String(body.street??body.location??existing.street??'').trim(),ward=String(body.ward??existing.ward??'').trim(),area=String(body.area??previous.area??'').trim();
 if(street.length>160||ward.length>120)throw problem(400,'Tên đường tối đa 160 ký tự, phường/xã tối đa 120 ký tự.');
 if(!adminAuthored&&[street,ward].some(v=>privateBriefTerm(v)||privateBriefCode(v)||negotiationCopy(v)||globalThis.RentalLocations.privateQuery(v)||/^(?:gan|canh|sat|doi dien|cach|phia sau|ngay sau|ben hong)\s/.test(globalThis.RentalLocations.fold(v))||/[@#<>:\\=%]/u.test(v)||/\b(?:mr|mrs|ms|zalo|sdt|hotline|dien thoai|gia chot|gia net|hoa hong|phi moi gioi|thuong luong|chu nha|nguon doi tac)\b/.test(globalThis.RentalLocations.fold(v))))throw problem(400,'Tên đường và phường/xã công khai không chứa số nhà, ngõ/ngách, SĐT hoặc liên kết. Điền địa chỉ chi tiết vào mục riêng tư.');
 if(adminAuthored&&previous.address&&street===existing.street&&ward===existing.ward&&area===String(previous.area||''))return {street,ward,area,address:previous.address};
 const inferred=globalThis.RentalLocations.parts({address:street,area});if(!ward&&inferred.ward){ward=inferred.ward;street=inferred.street;}
 return {street,ward,area,address:displayAddress([street,ward].filter(Boolean).join(', '),area)};
}
