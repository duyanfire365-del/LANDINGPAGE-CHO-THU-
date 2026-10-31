import {sourceShorthand} from './source-shorthand.mjs';
const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase();
export function classifyPhotoSetting(text='',address=''){
 let s=fold(text).split('\n').map(l=>l.replace(/^[^a-z0-9#]+/,'')).filter(l=>!/^#(?:suatin|st|sua|bosung|them)\s*$/.test(l)).filter(l=>!/^(?:nguon|lien he|doi tac|chu nha|hoa hong|hh|phi)\s*[:： ]/.test(l)).join('\n');
 if(/\b(?:khong|ko|k)(?: phai)?\s+(?:nha\s+)?(?:mat pho|mat duong|mp)\b/.test(s))return /\b(?:ngo|ngach|hem|kiet)\b/.test(s+' '+fold(address))?'alley':'interior';
 s=s.replace(/(?:^|[,;])\s*(?:nguon|lien he|doi tac|chu nha)\s*[:：]?[^\n]*/gm,'');
 const direct=s.split('\n')[0]||'',alley=/\b(?:ngo|ngach|hem|kiet)\b/;
 const clean=v=>v.replace(/\b(?:gan|cach|sat|khong xa|thong ra|di bo ra|ra)\s+(?:mat pho|mat duong|mp)\b/g,'near-street').replace(/\b(?:mat pho|mat duong)\s*\?/g,'unknown-street');
 const street=/(?:\b(?:mat pho|mat duong|mat tien (?:duong|pho))\b|\bmp(?=\s|[:：\d]))/;
 if(street.test(clean(direct)))return 'street';
 if(alley.test(fold(address))||/^\s*\d+[a-z]?\s*\/\s*\d/iu.test(address))return 'alley';
 if(street.test(clean(s)))return 'street';
 if(alley.test(s)||/^\s*\d+[a-z]?\s*\/\s*\d/iu.test(sourceShorthand(text).privateAddress))return 'alley';
 const numbered=address||sourceShorthand(text).privateAddress||String(text).match(/(?:địa chỉ|dia chi)\s*[:：]\s*([^\n]+)/iu)?.[1]||'';
 if(/^\s*(?:số\s*)?\d+[a-z]?\s+(?:(?:đường|phố)\s+)?\p{L}/iu.test(numbered)&&!alley.test(fold(numbered))&&!/\d\s*\//.test(numbered)&&!/(?:\d\s*(?:m2|m²|tầng|tang|trieu)|(?:toa|can ho|chung cu)\b)/.test(fold(numbered)))return 'street';
 return 'unknown';
}
export function propertyPhotoContext(privateData={},post={}){
 for(const supplement of [...(privateData.supplements||[])].reverse()){const context=classifyPhotoSetting(supplement.text||'');if(context!=='unknown')return context;}
 return classifyPhotoSetting(privateData.sourceText||privateData.originalText||[post.title,post.description].join('\n'),privateData.address||'');
}
