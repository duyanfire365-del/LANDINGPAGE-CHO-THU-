import {foldVietnamese} from './source-pricing.mjs';
import {sourceTags} from './source-tags.mjs';
// Treat routing and category-change instructions as metadata, never as property facts.
export function telegramEditContent(value){
 let category;const lines=[];
 for(let line of String(value||'').split(/\r?\n/)){
  if(/^\s*Tin cần cập nhật\s*:/iu.test(line))continue;
  line=line.replace(/^\s*(?:#|\/)(?:suatin|st|sua|bosung|them)\b\s*[:：]?\s*/iu,'').replace(/^\s*(?:sửa tin|sửa bài|sửa lại tin|bổ sung|thêm thông tin|chỉnh sửa)\s*[:：]?\s*/iu,'');
  const folded=foldVietnamese(line).trim();
  const change=folded.match(/^(?:(?:doi|thay|chuyen)(?:\s+(?:ma|tin|loai|bds|danh muc|tu))*\s+)?(?:chdv|chcc|bds|mbkd|mb|vp|kx|nc|bt|ko|dt|pt)\s*(?:sang|thanh|->|=>|→)\s*(chdv|chcc|bds|mbkd|mb|vp|kx|nc|bt|ko|dt|pt)\s*[.!]?$/);
  if(change){category=sourceTags[change[1].toUpperCase()];continue;}
  line=line.replace(/\blive-\d{10,20}\b/g,'').replace(/\b(?:CHDV|CHCC|BDS|MB|VP|KX|NC|BT|KO|DT|PT)\s*[-–—]\s*\d{1,6}\b/gi,'');
  if(line.trim())lines.push(line.trim());
 }
 return {text:lines.join('\n').trim(),category};
}
