// Preserve the source agreement verbatim; H50% does not establish 50% of which amount.
const label='(?:hoa\\s*hồng|hoa\\s*hong|phí\\s*môi\\s*giới|phi\\s*moi\\s*gioi|phí\\s*(?:khách|chủ|đối tác)|phi\\s*(?:khach|chu|doi tac))';
const pattern=new RegExp('(^|[^\\p{L}\\p{N}_])('+label+'\\s*[:：=]\\s*[^\\n;|]+|(?:'+label+'|hh)\\s*[:：=]?\\s*(?=\\d|thỏa\\s*thuận|thoa\\s*thuan|thương\\s*lượng|thuong\\s*luong)[^\\n;|]+|h\\s*\\d+(?:[.,]\\d+)?\\s*%[^\\n;|]*)','gimu');
export function extractCommission(source){const values=[];for(const match of String(source||'').matchAll(new RegExp(pattern.source,pattern.flags))){const value=match[2].replace(/\s+(?:chủ(?: nhà)?|đối tác|nguồn|map|giá thuê|diện tích|liên hệ|hotline)\s*[:：=].*$/iu,'').replace(/\s+#[\p{L}\p{N}_].*$/u,'').trim();if(value&&!values.includes(value))values.push(value)}return values.join('\n').slice(0,1000)}
export const hasCommission=value=>Boolean(extractCommission(value));
export function stripCommission(value){return String(value||'').replace(new RegExp(pattern.source,pattern.flags),'$1').replace(/\s+#\s*(?=\n|$)/g,'').trim()}
