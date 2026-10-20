import {randomUUID} from 'node:crypto';
import {db,problem} from './platform.mjs';

// Resolve IDs on the server and keep the user's order (the first image is the cover).
export async function editedMedia(body,post,who){
 if(body.assetIds===undefined)return {};
 if(!Array.isArray(body.assetIds)||body.assetIds.length>12||body.assetIds.some(id=>typeof id!=='string'||!/^[-\da-f]{36}$/i.test(id))||new Set(body.assetIds).size!==body.assetIds.length)throw problem(400,'Mỗi tin tối đa 12 ảnh/video, không được trùng tệp.');
 if(body.keepCurrentImage!==undefined&&typeof body.keepCurrentImage!=='boolean')throw problem(400,'Lựa chọn giữ ảnh hiện tại không hợp lệ.');
 const ids=body.assetIds,rows=ids.length?await db('assets',{query:'?id=in.('+ids.join(',')+')&select=*'}):[];
 if(rows.length!==ids.length||rows.some(a=>!['image','video'].includes(a.kind)||!who.admin&&a.owner_id!==who.id))throw problem(403,'Ảnh/video không tồn tại hoặc anh/chị không được phép sử dụng.');
 const assets=ids.map(id=>rows.find(a=>a.id===id));
 const media=assets.map(a=>({id:a.id,kind:a.kind,mime:a.mime,name:a.name,...(a.path?.startsWith('editor-ai/')?{isIllustration:true}:{})}));
 const image=assets.find(a=>a.kind==='image'),keep=!image&&body.keepCurrentImage===true&&!(post.media||[]).some(a=>a.kind==='image');
 const imageUrl=image?'/api/files?action=media&id='+image.id:keep?post.image:'/banner.png',ai=image?.path?.startsWith('editor-ai/')===true;
 return {media,image:imageUrl,shareImage:keep?post.shareImage||post.image:imageUrl,imageAlt:image?(ai?'Ảnh minh họa bằng AI; không phải ảnh chụp thực tế.':'Ảnh BĐS do người đăng cập nhật'):keep?post.imageAlt:'Banner minh họa loại hình BĐS',isIllustration:image?ai:keep?post.isIllustration:true,illustrationKind:ai?'ai':keep?post.illustrationKind||null:null,mediaRevision:randomUUID(),notes:keep?(post.notes||[]):[...(post.notes||[]).filter(n=>n!=='Có ảnh minh họa bằng AI, không phải ảnh chụp thực tế BĐS.'),...(media.some(m=>m.isIllustration)?['Có ảnh minh họa bằng AI, không phải ảnh chụp thực tế BĐS.']:[])]};
}
