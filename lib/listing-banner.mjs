const names={'Mặt bằng kinh doanh':'mb','Văn phòng':'vp','Kho xưởng':'kx','Nhà nguyên căn':'nc','Căn hộ chung cư':'chcc','Căn hộ dịch vụ':'chdv','Phòng trọ':'pt','Biệt thự, nhà liền kề':'bt','Ki-ốt':'ko','Đất cho thuê':'dat'};
export const categoryBanner=type=>'/banners/'+(names[type]||'bds')+'.png';
export function withCategoryBanner(post){
 const fallback=!post.image||post.image==='/banner.png'||post.image.startsWith('/banners/')||post.illustrationKind==='banner';
 if(!fallback||post.media?.some(m=>m.kind==='image'))return post;
 return {...post,image:categoryBanner(post.type),shareImage:categoryBanner(post.type),isIllustration:true,illustrationKind:'banner',imageAlt:'Banner minh họa '+post.type+' — không phải ảnh chụp thực tế.'};
}
