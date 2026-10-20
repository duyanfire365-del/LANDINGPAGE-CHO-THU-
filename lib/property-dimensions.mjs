import {parseSourceNumber,foldVietnamese} from './source-pricing.mjs';
import {problem} from './platform.mjs';
export function propertyDimensions(body={}){
 const values={};for(const key of ['frontage','roadWidth']){const raw=body[key];if(raw===null||raw===undefined||raw===''){values[key]=null;continue}const value=parseSourceNumber(raw);if(!Number.isFinite(value)||value<=0||value>1000)throw problem(400,'Mặt tiền và đường rộng cần lớn hơn 0, tối đa 1.000 m.');values[key]=value}
 const value=typeof body.sidewalk==='string'?foldVietnamese(body.sidewalk).trim():body.sidewalk;values.sidewalk=value===true||['yes','có','co','true'].includes(value)?true:value===false||['no','không','khong','false'].includes(value)?false:null;return values;
}
export function extractDimensions(source){const text=foldVietnamese(source),number='(\\d+(?:[.,]\\d+)?)',frontage=text.match(new RegExp('(?:mat tien|\\bmt(?=\\s|:|\\d)|chieu ngang)\\s*[:：=]?\\s*'+number+'\\s*m(?:et)?\\b')),road=text.match(new RegExp('(?:duong(?:\\s+(?:truoc nha|truoc cua|vao))?|ngo)\\s*(?:rong\\s*)?[:：=]?\\s*'+number+'\\s*m(?:et)?\\b'));
 const no=/(?:khong|ko|k)\s+(?:co\s+)?via he|via he\s*[:：=]?\s*(?:khong|ko|k)(?:\b|$)/.test(text),yes=/co\s+via he|via he\s*[:：=]?\s*(?:co\b|rong\b|\d)/.test(text);
 return {frontage:frontage?parseSourceNumber(frontage[1]):null,roadWidth:road?parseSourceNumber(road[1]):null,sidewalk:no?false:yes?true:null};
}
export const dimensionFacts=p=>[p.frontage?'Mặt tiền: '+p.frontage+' m.':'',p.roadWidth?'Đường rộng: '+p.roadWidth+' m.':'',p.sidewalk===true?'Vỉa hè: Có.':p.sidewalk===false?'Vỉa hè: Không.':''].filter(Boolean);
