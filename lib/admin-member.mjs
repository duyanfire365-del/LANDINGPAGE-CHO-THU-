import {supa,clean,problem} from './platform.mjs';
export function nicknameEmail(value){const nickname=clean(value,1000).toLowerCase();if(!/^[a-z0-9][a-z0-9._-]{2,39}$/.test(nickname))throw problem(400,'Biệt danh gồm 3–40 chữ không dấu, số, dấu chấm, gạch ngang hoặc gạch dưới.');return {nickname,email:nickname+'@members.nguonchothue.invalid'}}
export async function createAdminMember(body){
 const {nickname,email}=nicknameEmail(body.nickname),full_name=clean(body.name,100),password=typeof body.password==='string'?body.password:'',kind=body.kind||'sales';
 if(!full_name||!['sales','customer'].includes(kind)||password.length<6||password.length>128)throw problem(400,'Nhập họ tên, nhóm thành viên và mật khẩu từ 6–128 ký tự.');
 // The admin endpoint creates a confirmed account without sending email.
 try{const user=await supa('/auth/v1/admin/users',{method:'POST',body:{email,password,email_confirm:true,user_metadata:{full_name,nickname,phone:'',kind,created_by_admin:true}}});return {created:true,id:user.id,nickname};}catch{throw problem(409,'Chưa tạo được tài khoản. Biệt danh có thể đã tồn tại hoặc mật khẩu chưa đáp ứng cấu hình Supabase.');}
}
