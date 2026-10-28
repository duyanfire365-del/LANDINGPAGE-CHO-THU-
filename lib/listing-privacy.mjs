// Shared by intake, copy generation and final publication checks. Never invent facts.
export const foldPrivate=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase();
export function negotiationCopy(value){const text=foldPrivate(value);return /\b(?:\d+\s*thang dau|thang dau|nua nam dau|thoi gian dau|giai doan dau|trong \d+\s*thang|thang tiep theo)\b/.test(text)||/\b(?:ho tro|uu dai|mien tien thue|mien thue|gia tam thoi)\b/.test(text)||/\b(?:chot|bot|giam|ha)\s*[:=]?\s*\d|\bgia\s+(?:thue|sang nhuong|chuyen nhuong|nhuong)\s+(?:chot|net|san|cuoi)\b|\b(?:tl|ctl)\b/.test(text)||/\b(?:gia\s*(?:chot|net|san|day|goc|cuoi)|chot\s*(?:gia|duoc|o|con|xuong|la|tam|khoang|\d)|(?:thuong luong|thuong xuong|thuong luong gia)|(?:bot|giam|ha)\s*(?:gia|xuong|con|duoc|them|toi da|\d)|gia\s*(?:(?:co the|con)\s*)?(?:xuong|giam|bot)|bao khach|phi chenh|gia chu)\b/.test(text);}
export function sensitiveCopy(value){
 const text=foldPrivate(value);
 return /\b(?:chu nha|chinh chu|doi tac|nguoi cung cap|ten nguon|nguon hang|nguon doi tac)\b/.test(text)
  ||/\b(?:dang|hien (?:tai )?(?:dang )?|truoc (?:day )?|tung )\s*(?:kinh doanh|ban |lam quan|mo quan|la quan|la cua hang|cho thue lam)/.test(text)
  ||(/\b(?:quan|cua hang|tiem|spa|salon)\b/.test(text)&&(!/\b(?:phu hop|thich hop|co the (?:mo|lam)|de (?:mo|lam)|muon mo)\b/.test(text)||/\b(?:tiep quan|dang van hanh|dang hoat dong)\b/.test(text)))
  ||/\b(?:sang nhuong|chuyen nhuong)\s+(?:quan|cua hang|nha hang|spa|salon|tiem)\b/.test(text)
  ||/\b(?:hien trang|hien tai)\s*[:=]\s*(?:quan|cua hang|nha hang|spa|salon|tiem)\b/.test(text)
  ||/\b(?:lien he|sdt|dien thoai)\b.{0,40}\b(?:chu|nguon|doi tac)\b/.test(text)
  ||/\b(?:nganh hang|doanh thu|loi nhuan|ten quan|ten cua hang|bien hieu|thuong hieu|khach quen)\b/.test(text)
  ||/\b(?:phi khach|phi chu|phi nguon|phi doi tac|phi chenhlech|phi chenh lech|phi moi gioi|hoa hong)\b|\b(?:phi|hh)\b[^\n]*\d\s*%/.test(text)
  ||/\bchu\s+(?:nha\s+)?(?:se|cho|bao|noi|muon|tu|dang|co the|website)\b/.test(text)
  ||/\btin\s+(?:can\s+)?cap nhat\b|\blive-\d/.test(text)
  ||/\b(?:nguon|nguon cua|nguon tu)\s*[:=]/.test(text)
  ||/\b(?:mr|mrs|ms|hotline|call|zalo)\b/.test(text)
  ||/\b(?:gia\s+)?(?:sang nhuong|chuyen nhuong|gia nhuong)\s*(?:chao\s*)?[:=]?\s*\d/.test(text)
  ||/\btt\s*\d+\s*c\s*\d+\b|\bphi\s*[:=]?\s*\d/.test(text)
  ||negotiationCopy(value)
  ||/\b(?:thanh toan|dat coc|tien coc|coc|hop dong|thoi han thue|dieu kien ban giao)\b/.test(text)
  ||/\b(?:gan|canh|sat|doi dien|cach|phia sau|ngay sau|ben hong)\b/.test(text)
  ||/\b(?:tl sau|co loc|bot loc|gia cuoi cung)\b/.test(text)
  ||/\b(?:google maps|toa do|dinh vi|chi duong|so nha|so can|ma can|tang thuong hieu)\b/.test(text);
}
// Split semicolons, bullets and sentences, but never decimal prices or phone digits.
export function copyClauses(value){return String(value||'').replace(/\r\n?/g,'\n').split(/\n|[;；|]|[•●▪]|,\s*(?=(?:[Cc]ó thể (?:thương lượng|giảm|bớt)|[Gg]iá (?:chốt|hỗ trợ|ưu đãi)|[Hh]ỗ trợ|[Cc]hủ nhà|[Đđ]ối tác|[Hh]iện đang|[Đđ]ang kinh doanh))|(?<=[.!?])\s+(?=[\p{Lu}])/u);}
export function separateSensitiveCopy(value){
 const publicParts=[],privateParts=[];let internal=false;
 for(const raw of copyClauses(value)){
  const part=raw.trim();if(!part)continue;const folded=foldPrivate(part).replace(/^[^a-z0-9]+/,'');
  if(/^(?:noi dung|thong tin|phan)\s+cong khai\s*[:=]/.test(folded)){internal=false;continue;}
  if(/^(?:(?:ghi chu|thong tin|du lieu|phan|muc)\s+(?:kin|noi bo|rieng tu|rieng)|chi (?:quan tri|moi gioi)|khong cong khai)\b/.test(folded))internal=true;
  if(internal||sensitiveCopy(part))privateParts.push(part);else publicParts.push(part);
 }
 return {publicSource:publicParts.join('\n'),privateNotes:[...new Set(privateParts)].join('\n')};
}
