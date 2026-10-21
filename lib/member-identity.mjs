import {clean,problem} from './platform.mjs';
export function identity(body){
 const mode=body.channel||body.method||'email';if(!['email','phone'].includes(mode))throw problem(400,'Chọn email hoặc số điện thoại.');
 if(mode==='email'){const email=clean(body.email,254).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw problem(400,'Nhập email hợp lệ.');return {channel:'email',email}}
 let phone=clean(body.phone,30).replace(/[\s.()-]/g,'');if(/^0\d{9}$/.test(phone))phone='+84'+phone.slice(1);else if(/^84\d{9}$/.test(phone))phone='+'+phone;if(!/^\+84[35789]\d{8}$/.test(phone))throw problem(400,'Nhập số điện thoại di động Việt Nam hợp lệ.');return {channel:'phone',phone};
}
export function identityFields(id){return id.channel==='phone'?{phone:id.phone}:{email:id.email}}
