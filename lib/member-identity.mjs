import {clean,problem} from './platform.mjs';
export function identity(body){
 const mode=body.channel||body.method||'email';if(mode!=='email')throw problem(400,'Hiện website chỉ hỗ trợ đăng ký và đăng nhập bằng email.');
 const email=clean(body.email,254).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw problem(400,'Nhập email hợp lệ.');return {channel:'email',email};
}
export function identityFields(id){return {email:id.email}}
