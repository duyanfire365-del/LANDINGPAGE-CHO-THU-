// Keep street/ward/district names; withhold house numbers and numbered alley paths.
export function publicLocation(value){
 return String(value||'').replace(/https?:\/\/\S+|#[\p{L}\p{N}_]+/giu,'')
 .replace(/^(?:địa chỉ(?: đầy đủ| riêng tư)?|vị trí)\s*[:：]\s*/iu,'')
 .replace(/^(?:số(?: nhà)?\s*)?\d+[a-z]?(?:\s*\/\s*\d+)*\s*[,;]?\s*/iu,'')
 .replace(/(?:ngõ|ngách|hẻm|ngo|ngach|hem)\s*\d+[a-z]?(?:\s*\/\s*\d+)*\s*[,;]?\s*/giu,'')
 .replace(/^(?:đường|phố)\s+/iu,'').replace(/\s*[,;]\s*/g,', ').replace(/^(?:,\s*)+|(?:,\s*)+$/g,'').trim();
}
export function sourceLocation(value,area=''){
 const lines=String(value||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 for(let i=0;i<lines.length;i++){
  const label=lines[i].match(/^(?:bổ sung\s*)?(?:địa chỉ(?: đầy đủ| cụ thể| riêng tư)?|vị trí(?: công khai)?|tên đường|đường)\s*[:：]\s*(.*)$/iu);
  if(label){const raw=label[1]||lines[i+1]||'';if(raw&&!/^(?:giá|diện tích|nguồn|phí|tin cần cập nhật)\s*:/iu.test(raw))return raw;}
 }
 for(const line of lines){
  const named=line.match(/^(?:[\p{P}\p{S}]\s*)?(?:cho thuê|sang nhượng|chuyển nhượng)[^\n]*?(?:mặt phố|mặt đường|ngõ\s*\d+[a-z]?(?:\/\d+)*|ngách\s*\d+[a-z]?(?:\/\d+)*|tại)\s+([^\n]+)/iu);
  if(named&&!/(?:m2|m²|triệu|\btr\b|phí|nguồn)/iu.test(named[1]))return named[0].match(/(?:mặt phố|mặt đường|tại)\s+(.+)$/iu)?.[1]||line.slice(line.search(/(?:ngõ|ngách)\s*\d/iu));
 }
 // A short Reply can consist solely of street, ward and district.
 if(lines.length===1&&area&&lines[0].split(',').length>=3&&!/[\d#:]|https?:|không|phù hợp|kinh doanh|cho thuê|hoa hồng|nguồn/iu.test(lines[0])&&lines[0].toLocaleLowerCase('vi').includes(area.toLocaleLowerCase('vi'))&&lines[0].length<180)return lines[0];
 return '';
}
