import {splitPriceNotes} from './source-price-notes.mjs';
import {parseSourceNumber,foldVietnamese} from './source-pricing.mjs';
import {problem} from './platform.mjs';
export function propertyDimensions(body={}){
 const values={};for(const key of ['frontage','roadWidth']){const raw=body[key];if(raw===null||raw===undefined||raw===''){values[key]=null;continue}const value=parseSourceNumber(raw);if(!Number.isFinite(value)||value<=0||value>1000)throw problem(400,'Mặt tiền và đường rộng cần lớn hơn 0, tối đa 1.000 m.');values[key]=value}
 for(const key of ['floors','bedrooms','bathrooms']){const raw=body[key];if(raw===null||raw===undefined||String(raw).trim()===''){values[key]=null;continue}const n=parseSourceNumber(raw),valid=key==='floors'?n>=0.5&&n<=200&&Number.isInteger(n*2):n>=0&&n<=1000&&Number.isInteger(n);if(!Number.isFinite(n)||!valid)throw problem(400,key==='floors'?'Số tầng từ 0,5 đến 200; có thể nhập nửa tầng.':'Số phòng ngủ / WC phải là số nguyên từ 0 đến 1.000.');values[key]=n;}
 const value=typeof body.sidewalk==='string'?foldVietnamese(body.sidewalk).trim():body.sidewalk;values.sidewalk=value===true||['yes','có','co','true'].includes(value)?true:value===false||['no','không','khong','false'].includes(value)?false:null;return values;
}
function roomCount(text,label,unit,{half=false,min=0,max=1000}={}){
 const number='(\\d+(?:[.,]\\d+)?)',labelPattern=new RegExp('(?:'+label+')\\s*[:：=]?\\s*'+number,'g'),unitPattern=new RegExp(number+'[ \t]*(?:'+unit+')\\b','g');
 const values=[];for(const pattern of [labelPattern,unitPattern])for(const match of text.matchAll(pattern)){const before=text.slice(Math.max(0,match.index-25),match.index),after=text.slice(match.index+match[0].length);if(/\d\s*[-–—~]\s*$/.test(before)||/(?:khoang|tu|den|hon|tren|duoi|tam|hoac)\s*[:：]?\s*$/.test(before)||/^\s*[-–—~]\s*\d/.test(after)||/^\s*(?:tro len|tro xuong|hoac|den)\b/.test(after)||pattern===unitPattern&&/tang\s*[:：]?\s*$/.test(before)||/[-–—]$/.test(before))return null;const value=parseSourceNumber(match[1]);if(value<min||value>max||!(half?Number.isInteger(value*2):Number.isInteger(value)))return null;values.push(value)}
 return new Set(values).size===1?values[0]:null;
}
export function extractDimensions(source){const text=foldVietnamese(splitPriceNotes(source).publicSource),number='(\\d+(?:[.,]\\d+)?)',frontage=text.match(new RegExp('(?:mat tien|\\bmt(?=\\s|:|\\d)|chieu ngang)\\s*[:：=]?\\s*'+number+'\\s*m(?:et)?\\b')),road=text.match(new RegExp('(?:duong(?:\\s+(?:truoc nha|truoc cua|vao))?|ngo)\\s*(?:rong\\s*)?[:：=]?\\s*'+number+'\\s*m(?:et)?\\b'));
 const no=/(?:khong|ko|k)\s+(?:co\s+)?via he|via he\s*[:：=]?\s*(?:khong|ko|k)(?:\b|$)/.test(text),yes=/co\s+via he|via he\s*[:：=]?\s*(?:co\b|rong\b|\d)/.test(text);
 return {floors:roomCount(text,'\\bso tang','tang',{half:true,min:0.5,max:200}),bedrooms:roomCount(text,'\\b(?:so\\s+)?phong ngu|\\bpn(?=[:：=\\s\\d])','phong ngu|pn'),bathrooms:roomCount(text,'\\b(?:so\\s+)?(?:phong\\s+)?(?:wc|ve sinh)|\\bso nha ve sinh','phong wc|phong ve sinh|nha ve sinh|ve sinh|wc'),frontage:frontage?parseSourceNumber(frontage[1]):null,roadWidth:road?parseSourceNumber(road[1]):null,sidewalk:no?false:yes?true:null};
}
export const dimensionFacts=p=>[p.floors!=null?'Số tầng: '+p.floors+'.':'',p.bedrooms!=null?'Phòng ngủ: '+p.bedrooms+'.':'',p.bathrooms!=null?'Phòng WC: '+p.bathrooms+'.':'',p.frontage?'Mặt tiền: '+p.frontage+' m.':'',p.roadWidth?'Đường rộng: '+p.roadWidth+' m.':'',p.sidewalk===true?'Vỉa hè: Có.':p.sidewalk===false?'Vỉa hè: Không.':''].filter(Boolean);

export function syncRoomDescription(description,before,after){
 let text=String(description||''),inferred=extractDimensions(text);
 for(const [key,label,unit]of [['floors','số tầng','tầng'],['bedrooms','(?:số )?phòng ngủ','(?:phòng ngủ|PN)'],['bathrooms','(?:số )?(?:phòng )?(?:WC|vệ sinh)','(?:phòng WC|phòng vệ sinh|nhà vệ sinh|WC)']]){
  const old=before[key]??inferred[key],value=after[key];if(value==null||old==null||old===value)continue;
  const n=String(old).replace('.', '[.,]');
  text=text.replace(new RegExp('('+label+'\\s*[:：=]?\\s*)'+n+'(?![\\d.,])','giu'),'$1'+value).replace(new RegExp('(?<![\\d.,])'+n+'(\\s*'+unit+')(?![\\p{L}\\p{N}])','giu'),String(value)+'$1');
 }
 return text;
}
