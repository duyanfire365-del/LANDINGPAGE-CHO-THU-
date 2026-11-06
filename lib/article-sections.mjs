import {problem} from './platform.mjs';
export const articleSections={news:{label:'Tin tức Hot',path:'/tin-tuc-hot'},experience:{label:'Kinh nghiệm tìm MBKD',path:'/kinh-nghiem-tim-mbkd'},services:{label:'Dịch vụ hỗ trợ',path:'/dich-vu-ho-tro'},recruitment:{label:'Tuyển dụng',path:'/tuyen-dung'}};
export const articleIndustries={'':'Kinh nghiệm chung',cafe:'Cà phê / đồ uống',food:'Nhà hàng / ăn uống',spa:'Spa / thẩm mỹ',office:'Văn phòng',retail:'Bán lẻ / cửa hàng',warehouse:'Kho / xưởng',other:'Ngành khác',survey:'Dịch Vụ Đo Đạc',bank:'Dịch vụ hỗ trợ Ngân hàng','land-title':'Dịch vụ liên quan về Sổ đỏ',notary:'Dịch vụ Công chứng & Vi bằng',inheritance:'Dịch vụ Thừa kế','land-services':'Các dịch vụ liên quan về đất đai',collaborator:'Tuyển dụng CTV'};
export function articleSection(value='news'){if(!Object.hasOwn(articleSections,value))throw problem(400,'Mục bài viết không hợp lệ.');return value;}
export function articleIndustry(value=''){if(!Object.hasOwn(articleIndustries,value))throw problem(400,'Ngành hàng không hợp lệ.');return value;}
export const articleHref=a=>articleSections[a.section||'news'].path+'/'+a.slug;
