import sharp from 'sharp';
import QRCode from 'qrcode';
import {readFileSync} from 'node:fs';
import {create} from 'fontkit';
const typeface=create(readFileSync(new URL('./fonts/DejaVuSans.ttf',import.meta.url)));
function textPaths(text){const run=typeface.layout(text);let advance=0;const paths=run.glyphs.map((glyph,i)=>{const p=run.positions[i],path=`<path d="${glyph.path.toSVG()}" transform="translate(${advance+p.xOffset},${p.yOffset})"/>`;advance+=p.xAdvance;return path}).join('');return {paths,advance}}
function vectorText(text,x,y,size,{align='end',opacity=.42,dark=false}={}){const {paths,advance}=textPaths(text),scale=size/typeface.unitsPerEm;return `<g transform="translate(${x-(align==='end'?advance*scale:0)},${y}) scale(${scale},${-scale})" fill="${dark?'#30221d':'white'}" fill-opacity="${opacity}" stroke="${dark?'white':'#181818'}" stroke-opacity="0.20" stroke-width="${Math.max(1,size*.03)/scale}" paint-order="stroke">${paths}</g>`}
export const brandingVersion='qr-web-v2';
const defaultQR=await QRCode.toBuffer('https://zalo.me/0906215365',{type:'png',errorCorrectionLevel:'M',margin:4,width:400});
export const zaloQR=()=>defaultQR;
export async function watermarkImage(input,{format='jpeg',code='',qr=true,phone=true,website=true,qrImage=null}={}){
 const source=sharp(input,{limitInputPixels:40000000,animated:false});const sourceMeta=await source.metadata();if(!['jpeg','png','webp'].includes(sourceMeta.format))throw Error('Unsupported listing image format');
 const raw=await source.rotate().resize({width:2000,height:2000,fit:'inside',withoutEnlargement:true}).toBuffer(),meta=await sharp(raw).metadata(),width=meta.width,height=meta.height;
 const margin=Math.max(8,Math.round(width*.022)),font=Math.max(16,Math.round(width*.047)),x=width-margin;
 let elements='';
 if(phone)elements+=vectorText('0906215365',x,height-margin-font*.64,font);
 if(website)elements+=vectorText('Nguonchothue.vn',x,height-margin,Math.max(12,font*.57),{opacity:.38});
 const codeFont=Math.max(12,Math.round(width*.024)),codeHeight=code?Math.round(codeFont*1.6):0;
 if(code){const boxWidth=Math.min(width-margin*2,Math.round(code.length*codeFont*.7+codeFont));elements+=`<rect x="${margin}" y="${margin}" width="${boxWidth}" height="${codeHeight}" rx="${Math.round(codeFont*.2)}" fill="#fffaf4" fill-opacity=".86"/>`+vectorText(code,margin+codeFont*.4,margin+codeFont*1.13,codeFont,{align:'start',opacity:.93,dark:true})}
 const overlays=[{input:Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${elements}</svg>`)}];
 if(qr){const size=Math.max(48,Math.min(200,Math.round(width*.14),Math.floor(height*.3))),qrBytes=await sharp(qrImage||defaultQR).resize(size,size,{kernel:'nearest'}).png().toBuffer();overlays.push({input:qrBytes,left:margin,top:margin+codeHeight+(code?Math.round(width*.008):0)})}
 const image=sharp(raw).composite(overlays);return format==='webp'?image.webp({quality:87}).toBuffer():format==='png'?image.png().toBuffer():image.flatten({background:'#fff'}).jpeg({quality:88,mozjpeg:true}).toBuffer();
}
