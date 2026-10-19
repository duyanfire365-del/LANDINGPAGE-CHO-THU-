import {foldVietnamese} from './source-pricing.mjs';
// Preserve useful source facts through an allowlist; never republish raw contact/address lines.
export function sourceFeatures(source){
 const lines=foldVietnamese(source).split(/[\n\r]+/).filter(line=>!/(?:khong|chua)\s+(?:co\s+)?|dia chi|hotline|lien he|hoa hong|phi moi gioi|https?:|#/iu.test(line));
 const present=pattern=>lines.some(line=>new RegExp(foldVietnamese(pattern.source),pattern.flags).test(line));
 const features=[];
 for(const [pattern,text] of [
  [/điện\s*3\s*(?:pha|fa|p\b)/iu,'Có điện ba pha.'],
  [/(?:đất\s+)?(?:full\s+)?thổ cư/iu,'Theo nguồn cung cấp: đất thổ cư.'],
  [/khung xưởng\s+chắc chắn/iu,'Khung xưởng chắc chắn.'],
  [/cốt nền\s+chắc chắn/iu,'Cốt nền chắc chắn.'],
  [/(?:wc|vệ sinh)\s+khép kín/iu,'Có WC khép kín.'],
  [/đường vào\s+rộng/iu,'Đường vào rộng.'],
  [/thuận tiện\s+(?:vận chuyển|bốc dỡ)/iu,'Thuận tiện vận chuyển, bốc dỡ hàng hóa.'],
  [/kho\s+chứa hàng/iu,'Phù hợp làm kho chứa hàng.'],
  [/kho\s+phân phối/iu,'Phù hợp làm kho phân phối.'],
  [/xưởng\s+sản xuất/iu,'Phù hợp làm xưởng sản xuất.'],
  [/xưởng\s+gia công/iu,'Phù hợp làm xưởng gia công.'],
  [/tập kết\s+hàng hóa/iu,'Phù hợp tập kết hàng hóa.'],
  [/mai che/iu,'Có mái che theo nguồn cung cấp.'],
  [/logistics/iu,'Phù hợp hoạt động logistics.'],
  [/thang máy/iu,'Có thang máy.'],
  [/điều hòa/iu,'Có điều hòa.'],
  [/lối đi riêng/iu,'Có lối đi riêng.'],
  [/vệ sinh riêng/iu,'Có khu vệ sinh riêng.'],
  [/chỗ\s+(?:để|đỗ)\s*xe/iu,'Có chỗ để xe.'],
  [/(?:full|đầy đủ)\s+nội thất/iu,'Có nội thất theo nguồn cung cấp.']
 ])if(present(pattern))features.push(text);
 const height=lines.join('\n').match(/chieu cao(?:\s+khoang)?\s*[:：]?\s*(\d+(?:[.,]\d+)?)(?:\s*[-–—]\s*(\d+(?:[.,]\d+)?))?\s*m\b/iu);
 if(height)features.push('Chiều cao khoảng '+height[1]+(height[2]?'–'+height[2]:'')+' m.');
 return features;
}
