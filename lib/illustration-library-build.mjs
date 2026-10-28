import sharp from 'sharp';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {create} from 'fontkit';
import {stockIllustrations,stockForIllustration} from './stock-illustrations.mjs';
import {illustrationLibrary} from './illustration-library.mjs';
import {watermarkImage,zaloQR} from './image-branding.mjs';
const font=create(await readFile(new URL('./fonts/DejaVuSans.ttf',import.meta.url)));
function label(text,x,y,size,color){const run=font.layout(text);let a=0;return `<g transform="translate(${x},${y}) scale(${size/font.unitsPerEm},${-size/font.unitsPerEm})" fill="${color}">${run.glyphs.map((g,i)=>{const p=run.positions[i],s=`<path d="${g.path.toSVG()}" transform="translate(${a+p.xOffset},${p.yOffset})"/>`;a+=p.xAdvance;return s}).join('')}</g>`}
const palettes=[['#476a75','#eef3ef','#c98b5f'],['#7c685d','#faf1e4','#89976e'],['#53678a','#eff1f7','#d7ab69'],['#54796f','#eef5ed','#b58771'],['#766583','#f5eff6','#88aaa5'],['#80694b','#f7f0e5','#6b8e9a']];
function sceneDrawing(item,color,accent){
 const v=item.variant,scene=item.scene;let s='';
 const rect=(x,y,w,h,c,r=0)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${c}"/>`;
 const table=(x,y)=>`<ellipse cx="${x}" cy="${y}" rx="64" ry="20" fill="${accent}"/><path d="M${x-45} ${y}v65m90-65v65" stroke="${color}" stroke-width="9"/>`;
 if(scene==='land'){
  s=`<path d="m180 490 430-240 430 240-430 150Z" fill="#a6c38c" stroke="#fcf0ca" stroke-width="16"/><path d="M610 250v390m-215-260 430 180m0-180-430 180" stroke="#dfe7c9" stroke-width="8"/>`;
 }else if(scene==='apartment'){
  s=rect(230,210,740,390,'#e9e4d9')+rect(300,260,300,220,'#c4dce2',8)+rect(650,440,250,105,accent,18)+rect(675,405,200,70,color,16)+table(510,530);
 }else if(['workspace','meeting'].includes(scene)){
  s=rect(180,205,840,360,'#e4e9e6')+`<path d="m180 565 840 0 95 80H85Z" fill="#c6c7ba"/>`;
  for(let i=0;i<4;i++)s+=rect(225+i*185,240,140,195,'#c1dce3',6)+`<path d="M${295+i*185} 240v195" stroke="white" stroke-width="7"/>`;
  if(scene==='meeting'){s+=table(490,500)+table(620,500)+table(750,500);for(let i=0;i<5;i++)s+=rect(360+i*100,550,50,60,color,12)}
  else for(let i=0;i<3;i++)s+=table(330+i*260,495)+rect(307+i*260,429,46,35,color,4)+rect(300+i*260,552,60,50,color,12);
 }else if(['warehouse','loading'].includes(scene)){
  s=`<path d="M170 340 570 190 1030 340V610H170Z" fill="#cdd8d3"/><path d="m140 345 430-175 490 175" fill="none" stroke="${color}" stroke-width="24"/>`;
  for(let i=0;i<3;i++)s+=rect(220+i*250,370,190,240,color)+rect(237+i*250,388,156,215,'#94aaa8');
  if(scene==='loading')s+=rect(660,485,270,110,'#eceddd',12)+rect(925,520,95,75,accent,10)+`<circle cx="720" cy="607" r="24" fill="#35484e"/><circle cx="969" cy="607" r="24" fill="#35484e"/>`;
  else for(let i=0;i<4;i++)s+=rect(215+i*105,540-(i%2)*40,90,65,accent,4);
 }else if(['house','townhouse'].includes(scene)){
  const floors=scene==='townhouse'?3:2;
  s=rect(350,200,490,410,'#eee4d2')+rect(320,185,550,28,color,4);
  for(let row=0;row<floors;row++)for(let col=0;col<3;col++)s+=rect(395+col*140,235+row*105,90,78,color,3)+rect(405+col*140,244+row*105,70,58,'#bdd5d6');
  s+=rect(527,505,130,105,accent,4);
  if(scene==='house')s+=`<path d="m300 185 295-88 295 88Z" fill="${accent}"/>`;
 }else{
  s=rect(230,225,740,380,'#f5ebda')+rect(220,208,760,32,color,6);
  for(let i=0;i<3;i++)s+=rect(260+i*230,310,205,295,'#bdd5d8',3);
  s+=`<path d="M210 300h780l-35-55H245Z" fill="${accent}"/>`;
  if(scene==='cafe'){s+=table(380,505)+table(640,505)+`<path d="M755 433h75v62h-75zm75 10q45-5 35 30h-35" fill="${color}"/>`;}
  else if(scene==='restaurant'){s+=table(380,505)+table(780,505)+rect(545,450,110,155,color,5);}
  else if(scene==='showroom'){for(let i=0;i<3;i++)s+=rect(310+i*220,450,130,70,accent,16)+rect(325+i*220,425,100,40,color,10);}
  else for(let i=0;i<3;i++)s+=rect(305+i*230,380,105,160,color,5)+rect(315+i*230,395,85,120,'#f3d5a0');
 }
 // Decorative foliage, not a representation of a real property's frontage.
 s+=rect(110,535,50,80,accent,8)+`<ellipse cx="135" cy="503" rx="40" ry="62" fill="${color}"/>`;
 return `<g transform="translate(${(v%9-4)*5},${v%5-2})">${s}</g>`;
}
export async function buildIllustrationLibrary(){
 const stockDir=new URL('../public/stock/',import.meta.url);await mkdir(stockDir,{recursive:true});
 for(const asset of stockIllustrations){if(asset.localSource){await writeFile(new URL(asset.id+'.jpg',stockDir),await readFile(new URL(asset.localSource,import.meta.url)));continue;}const response=await fetch('https://images.unsplash.com/photo-'+asset.photo+'?auto=format&fit=crop&w=1800&q=88',{signal:AbortSignal.timeout(45000)});if(!response.ok)throw Error('Stock download failed: '+asset.id);const bytes=Buffer.from(await response.arrayBuffer());await writeFile(new URL(asset.id+'.jpg',stockDir),await sharp(bytes).rotate().resize(1800,1200,{fit:'cover'}).toColourspace('srgb').jpeg({quality:90}).toBuffer());}
 await writeFile(new URL('credits.json',stockDir),JSON.stringify({license:'Per-asset license; generated illustration or Unsplash License',licenseUrl:'https://unsplash.com/license',usage:'Reference interiors, not photos of the listed properties',assets:stockIllustrations.map(a=>({...a,license:a.license||'Unsplash License'}))},null,2));
 const dir=new URL('../public/illustrations/',import.meta.url);await mkdir(dir,{recursive:true});
 for(const [index,item] of illustrationLibrary.entries()){
  await writeFile(new URL(item.id+'.jpg',dir),await renderLibraryIllustration(item,index));
 }
 await writeFile(new URL('catalog.json',dir),JSON.stringify({version:1,license:'Original procedural artwork for Nguonchothue.vn',disclosure:'Ảnh minh họa, không phải ảnh thực tế',items:illustrationLibrary},null,2));
 console.log('Built '+illustrationLibrary.length+' reusable free illustrations.');
}
export async function renderLibraryIllustration(item,index=0,qrBytes=zaloQR()){
  const stock=stockForIllustration(item);
  if(stock){
   const raw=await readFile(new URL('../public/stock/'+stock.id+'.jpg',import.meta.url));
   const photo=await sharp(raw).resize(1200,800,{fit:'cover',position:'attention'}).toBuffer();
   const footer=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect y="705" width="1200" height="95" fill="#211d18" fill-opacity=".78"/>${label('KHÔNG GIAN THAM KHẢO · KHÔNG PHẢI ẢNH BĐS ĐANG ĐĂNG',28,743,22,'#ffffff')}${label('0906 215 365  ·  Nguonchothue.vn',28,780,22,'#ffffff')}</svg>`);
   const base=await sharp(photo).composite([{input:footer}]).png().toBuffer();
   const branded=await watermarkImage(base,{qr:false,phone:false,website:false,format:'png'}),qr=await sharp(qrBytes).resize(132,132,{kernel:'nearest'}).png().toBuffer();
   return sharp(branded).composite([{input:qr,left:1048,top:555}]).jpeg({quality:88}).toBuffer();
  }
  const [color,bg,accent]=palettes[(index+item.variant)%palettes.length];
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="${bg}"/><stop offset="1" stop-color="#dce7e7"/></linearGradient></defs><rect width="1200" height="800" fill="url(#sky)"/><circle cx="980" cy="230" r="115" fill="#fff5d3" opacity=".65"/><path d="M0 610H1200V800H0Z" fill="#c7c9c2"/><path d="M0 655H1200" stroke="white" stroke-width="4" opacity=".6"/>${sceneDrawing(item,color,accent)}<rect x="0" y="0" width="1200" height="135" fill="${bg}" opacity=".94"/>${label('NGUỒN CHO THUÊ',45,48,21,color)}${label(item.type,45,99,34,'#293e41')}<rect y="687" width="1200" height="113" fill="${bg}"/>${label('0906 215 365  ·  Nguonchothue.vn',40,730,23,color)}${label('ẢNH MINH HỌA · KHÔNG PHẢI ẢNH THỰC TẾ',40,772,22,'#405257')}</svg>`;
  const base=await sharp(Buffer.from(svg)).png().toBuffer();const branded=await watermarkImage(base,{qr:false,format:'png'}),qr=await sharp(qrBytes).resize(140,140,{kernel:'nearest'}).png().toBuffer();
  return sharp(branded).composite([{input:qr,left:1040,top:635}]).flatten({background:'#fff'}).toColourspace('srgb').jpeg({quality:86}).toBuffer();
}
