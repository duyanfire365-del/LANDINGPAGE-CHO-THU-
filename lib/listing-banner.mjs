import {pickIllustration} from './illustration-library.mjs';
const names={'Mặt bằng kinh doanh':'mb','Văn phòng':'vp','Kho xưởng':'kx','Nhà nguyên căn':'nc','Căn hộ chung cư':'chcc','Căn hộ dịch vụ':'chdv','Phòng trọ':'pt','Biệt thự, nhà liền kề':'bt','Ki-ốt':'ko','Đất cho thuê':'dat'};
export const categoryBanner=type=>'/banners/'+(names[type]||'bds')+'.png';
export const hasPublicListingPhoto=post=>post.media?.some(m=>m.kind==='image'&&(!m.visibility||m.visibility==='public'))===true;
export function withCategoryBanner(post){
 const fallback=!post.image||post.image==='/banner.png'||post.image.startsWith('/banners/')||post.image.startsWith('/illustrations/')||post.image.startsWith('/api/files?action=illustration&')||post.illustrationKind==='banner'||post.media?.some(m=>m.kind==='image')&&!hasPublicListingPhoto(post);
 if(!fallback||hasPublicListingPhoto(post))return post;
 const chosen=pickIllustration(post),image=chosen?.path||categoryBanner(post.type);
 return {...post,image,shareImage:image,isIllustration:true,illustrationKind:'banner',illustrationLibraryId:chosen?.id||null,imageAlt:'Ảnh minh họa '+(chosen?.scene==='open_yard'?'sân bãi kinh doanh / thể thao':post.type)+' — không phải ảnh chụp thực tế, không xác nhận hiện trạng.'};
}
