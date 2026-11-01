// Conservative deduplication: never infer equivalence, discard contradictory facts,
// or truncate unique content. Headed sections stay atomic to retain their context.
const normalize=value=>value.normalize('NFC').replace(/\r\n?/g,'\n').trim();
const key=line=>line.normalize('NFC').toLocaleLowerCase('vi').replace(/[\u200b-\u200d\ufeff]/g,'').replace(/^\s*[-*•▪◦]\s+/u,'').replace(/\s+/gu,' ').replace(/\s*[:：]\s*/gu,': ').replace(/[.;。]+$/u,'').trim();
const heading=line=>/^\s*(?:#{1,6}\s+.+|[^:：\n]{1,120}[:：])\s*$/u.test(line);
const selfContained=line=>line.includes(':')||line.includes('：')||line.trim().split(/\s+/u).length>=3||/^(?:phí|cọc|giá|nguồn|hoa hồng)\s+/iu.test(line);
export function compactPrivateNotes(...values){
 const blocks=new Set(),facts=new Set(),result=[];
 for(const value of values.flat(Infinity)){
  if(typeof value!=='string'||!value.trim())continue;
  for(const paragraph of normalize(value).split(/\n[\t ]*\n+/u)){
   const lines=paragraph.split('\n').map(line=>line.trim()).filter(Boolean);if(!lines.length)continue;
   const block=lines.map(key).join('\n');if(blocks.has(block))continue;blocks.add(block);
   if(lines.some(heading)){result.push({text:lines.join('\n'),atomic:true});continue}
   const unique=[];for(const line of lines){const fingerprint=key(line);if(selfContained(line)){if(facts.has(fingerprint))continue;facts.add(fingerprint)}unique.push(line)}
   if(unique.length)result.push({text:unique.join('\n'),atomic:false});
  }
 }
 return result.map((block,i)=>(i?(block.atomic||result[i-1].atomic?'\n\n':'\n'):'')+block.text).join('');
}
