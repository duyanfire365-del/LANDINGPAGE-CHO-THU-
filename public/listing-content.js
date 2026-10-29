(function(root){
 const categories=['Mặt bằng kinh doanh','Văn phòng','Kho xưởng','Nhà nguyên căn','Căn hộ chung cư','Căn hộ dịch vụ','Phòng trọ','Biệt thự, nhà liền kề','Ki-ốt','Đất cho thuê','Bất động sản khác'];
 const fold=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase();
 function houseBusinessCategories(value){
  const text=fold(value).replace(/#[^\s]+/g,'');
  const house=/\b(?:nha nguyen can|nha rieng(?: biet)?|nguyen can|nguyen nha|thue ca nha|nnc)\b/.test(text);
  // Nearby shops are not evidence that the property itself is commercial.
  const nearbyRemoved=text.replace(/\b(?:gan|canh|doi dien|cach)\s+(?:quan an|nha hang|cafe|ca phe|spa|shop|showroom)\b/g,'');
  const business=/\b(?:mat bang(?: kinh doanh)?|mbkd|sang nhuong (?:quan|cua hang|nha hang|spa)|chuyen nhuong (?:quan|cua hang)|cho thue (?:quan|cua hang|nha hang)|thuan tien (?:to chuc )?kinh doanh|phu hop (?:de |lam )?kinh doanh|kinh doanh duoc|vi tri kinh doanh)\b/.test(nearbyRemoved);
  return house&&business?['Mặt bằng kinh doanh','Nhà nguyên căn']:null;
 }
 function inferCategory(value){
  const text=fold(value).replace(/#[^\s]+/g,'');
  const dual=houseBusinessCategories(value);if(dual)return dual[0];
  // Explicit building types win over incidental suggested business uses.
  const types=[['Kho xưởng',/\b(?:kho xuong|nha xuong|xuong san xuat|cho thue kho|kho hang)\b/],['Căn hộ dịch vụ',/\b(?:can ho dich vu|chdv)\b/],['Căn hộ chung cư',/\b(?:chung cu|can ho|chcc)\b/],['Phòng trọ',/\bphong tro\b/],['Biệt thự, nhà liền kề',/\b(?:biet thu|lien ke)\b/],['Nhà nguyên căn',/\b(?:nha nguyen can|nha rieng|nguyen can|nguyen nha|nnc|\bnc\b)\b/],['Đất cho thuê',/\b(?:dat cho thue|cho thue dat)\b/],['Ki-ốt',/\bki.?ot\b/],['Văn phòng',/\b(?:cho thue van phong|toa van phong|vp cho thue)\b/],['Mặt bằng kinh doanh',/\b(?:mat bang|mat bag|mbkd|mo hinh sach|kinh doanh sach|kh hang an|khong nhan hang an|khong o qua dem|cua hang|sang nhuong quan|chuyen nhuong quan|nhuong quan|quan bia|quan nhau|bia hoi|moi mo hinh|quan an|nha hang|ca phe|cafe|coffee|tra sua|spa|nail|salon|shop|showroom)\b/]];
  return types.find(([,pattern])=>pattern.test(text))?.[0]||null;
 }
 function formatDescription(value){
  return String(value||'').replace(/\r\n?/g,'\n').replace(/[\t ]+\n/g,'\n').replace(/\n[\t ]+/g,'\n').replace(/[\t ]+(?=[•●▪])/g,'\n').replace(/([;；])[\t ]*(?:\n)?/g,'$1\n').replace(/([^\n•●▪\p{S}])[\t ]+(?=(?:Diện tích|Mặt tiền|Đường rộng|Vỉa hè|Giá thuê|Giá sang nhượng|Vị trí|Địa chỉ|Tiện ích|Liên hệ)\s*[:：])/giu,'$1\n').split('\n').map(line=>line.length>180?line.replace(/([.!?])[\t ]+(?=[A-ZÀ-Ỹ])/gu,'$1\n\n'):line).join('\n').replace(/\n{3,}/g,'\n\n').trim();
 }
 const api={categories,inferCategory,houseBusinessCategories,formatDescription};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RentalContent=api;
})(typeof globalThis!=='undefined'?globalThis:this);
