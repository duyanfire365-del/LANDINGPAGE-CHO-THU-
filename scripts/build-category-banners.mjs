import sharp from 'sharp';
import {watermarkImage,zaloQR,qrPlacement} from '../lib/image-branding.mjs';
import {mkdir} from 'node:fs/promises';
const categories=[['mb','Mặt bằng kinh doanh','#a34532','shop'],['vp','Văn phòng','#385d84','office'],['kx','Kho xưởng','#3d6867','warehouse'],['nc','Nhà nguyên căn','#a77339','house'],['chcc','Căn hộ chung cư','#536a94','office'],['chdv','Căn hộ dịch vụ','#79648e','office'],['pt','Phòng trọ','#6b805d','house'],['bt','Biệt thự, nhà liền kề','#727944','villa'],['ko','Ki-ốt','#aa5a4b','shop'],['dat','Đất cho thuê','#567b4b','land'],['bds','Bất động sản cho thuê','#826b5c','house']];
await mkdir(new URL('../public/banners/',import.meta.url),{recursive:true});
for(const [key,title,color,kind] of categories){
 let drawing='';
 if(kind==='warehouse')drawing='<path d="M690 375 875 270 1060 375V600H690Z" fill="#dce7e5"/><path d="m665 380 210-125 210 125" fill="none" stroke="#fff" stroke-width="24"/><path d="M790 430H965V600H790Z" fill="'+color+'"/><path d="M810 460H945M810 495H945M810 530H945M810 565H945" stroke="#b9cecb" stroke-width="10"/>';
 else if(kind==='shop')drawing='<rect x="700" y="365" width="355" height="235" rx="8" fill="#fff3dc"/><path d="M680 365h395l-30-80H710Z" fill="#fff"/><path d="M720 285v80m65-80v80m65-80v80m65-80v80m65-80v80m65-80v80" stroke="#e1a58d" stroke-width="32"/><path d="M740 420h120v180H740zm160 0h115v110H900z" fill="'+color+'"/>';
 else if(kind==='office'){drawing='<rect x="755" y="245" width="260" height="355" rx="10" fill="#e6edf6"/><rect x="690" y="405" width="90" height="195" fill="#becfe0"/>';for(let x=785;x<990;x+=65)for(let y=280;y<555;y+=65)drawing+=`<rect x="${x}" y="${y}" width="38" height="38" rx="3" fill="${color}"/>`;}
 else if(kind==='land')drawing='<path d="m680 515 210-160 210 160-210 120Z" fill="#c4d9a2"/><path d="m680 515 210-160 210 160-210 120Z" fill="none" stroke="#fff4d6" stroke-width="12"/><path d="M890 355v280M770 445l210 120M990 435 785 565" stroke="#e9efc9" stroke-width="6"/><path d="M1040 445V300" stroke="#fff" stroke-width="9"/><path d="m1045 300 60 25-60 25" fill="#f8dfac"/>';
 else drawing='<path d="M730 385h305v215H730Z" fill="#fff0d7"/><path d="m700 385 180-135 185 135Z" fill="#e4be8c"/><path d="M850 460h75v140h-75zM760 435h55v65h-55zm195 0h55v65h-55z" fill="'+color+'"/>'+(kind==='villa'?'<path d="M650 600V410m440 190V410" stroke="#d6e3bc" stroke-width="22"/><circle cx="650" cy="390" r="55" fill="#b1c694"/><circle cx="1090" cy="390" r="55" fill="#b1c694"/>':'');
 const lines=title.length>20?title.split(/, /):[title];
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#faf3e9"/><rect x="620" width="580" height="800" fill="${color}"/><circle cx="930" cy="390" r="270" fill="#ffffff" opacity=".07"/><path d="M660 610h480" stroke="#fff" stroke-width="5" opacity=".5"/>${drawing}<text x="65" y="125" font-family="DejaVu Sans" font-size="24" letter-spacing="3" fill="${color}">NGUỒN CHO THUÊ</text><rect x="65" y="190" width="80" height="6" fill="${color}"/>${lines.map((line,i)=>`<text x="65" y="${310+i*65}" font-family="DejaVu Sans" font-weight="bold" font-size="${title.length>20?35:40}" fill="#342d27">${line}</text>`).join('')}<text x="65" y="500" font-family="DejaVu Sans" font-size="24" fill="#6e6255">Liên hệ để xem và xác nhận hiện trạng</text><text x="65" y="565" font-family="DejaVu Sans" font-weight="bold" font-size="34" fill="${color}">0906 215 365</text><rect y="695" width="1200" height="105" fill="#eee3d5"/><text x="65" y="755" font-family="DejaVu Sans" font-size="23" fill="#65584b">ẢNH MINH HỌA THEO DANH MỤC · KHÔNG PHẢI ẢNH THỰC TẾ</text></svg>`;
 const base=await sharp(Buffer.from(svg)).png().toBuffer();
 const branded=await watermarkImage(base,{format:'png',qr:false});
 const {left,top,size}=qrPlacement(1200,800,{layout:'banner'});
 const qr=await sharp(zaloQR()).resize(size,size,{kernel:'nearest'}).png().toBuffer();
 await sharp(branded).composite([{input:qr,left,top}]).png().toFile(new URL('../public/banners/'+key+'.png',import.meta.url).pathname);
}
console.log('Built '+categories.length+' category illustration banners.');
