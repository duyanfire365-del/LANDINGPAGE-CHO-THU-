import sharp from 'sharp';
import QRCode from 'qrcode';
import {readFileSync} from 'node:fs';
import {create} from 'fontkit';
const typeface=create(readFileSync(new URL('./fonts/DejaVuSans.ttf',import.meta.url)));
function textPaths(text){const run=typeface.layout(text);let advance=0;const paths=run.glyphs.map((glyph,i)=>{const p=run.positions[i],path=`<path d="${glyph.path.toSVG()}" transform="translate(${advance+p.xOffset},${p.yOffset})"/>`;advance+=p.xAdvance;return path}).join('');return {paths,advance}}
function vectorText(text,x,y,size,{align='end',opacity=.42,dark=false}={}){const {paths,advance}=textPaths(text),scale=size/typeface.unitsPerEm;return `<g transform="translate(${x-(align==='end'?advance*scale:align==='center'?advance*scale/2:0)},${y}) scale(${scale},${-scale})" fill="${dark?'#30221d':'white'}" fill-opacity="${opacity}" stroke="${dark?'white':'#181818'}" stroke-opacity="0.20" stroke-width="${Math.max(1,size*.03)/scale}" paint-order="stroke">${paths}</g>`}
export const brandingVersion='qr-web-v3-center';
const defaultQR=await QRCode.toBuffer('https://zalo.me/0906215365',{type:'png',errorCorrectionLevel:'M',margin:4,width:400});
export const zaloQR=()=>defaultQR;
// Banner has editorial text at upper-left and benefits at the bottom. Reserve its top-right art corner.
export function qrPlacement(width,height,{code='',layout='photo'}={}){
 if(layout==='banner'){const margin=Math.round(width*.012),size=Math.min(160,Math.round(width*.095));return {left:width-margin-size,top:margin,size}}
 const margin=Math.max(8,Math.round(width*.022)),codeFont=Math.max(12,Math.round(width*.024)),codeHeight=code?Math.round(codeFont*1.6):0,size=Math.max(48,Math.min(200,Math.round(width*.14),Math.floor(height*.3)));
 return {left:margin,top:margin+codeHeight+(code?Math.round(width*.008):0),size};
}
export async function watermarkImage(input,{format='jpeg',code='',qr=true,phone=true,website=true,qrImage=null,layout='photo',center=true}={}){
 const source=sharp(input,{limitInputPixels:40000000,animated:false});const sourceMeta=await source.metadata();if(!['jpeg','png','webp'].includes(sourceMeta.format))throw Error('Unsupported listing image format');
 const raw=await source.rotate().resize({width:2000,height:2000,fit:'inside',withoutEnlargement:true}).toBuffer(),meta=await sharp(raw).metadata(),width=meta.width,height=meta.height;
 const banner=layout==='banner',margin=Math.max(8,Math.round(width*(banner ? .012 : .022))),font=Math.max(16,Math.round(width*(banner ? .020 : .047))),x=width-margin;
 let elements='';
 if(center&&!banner){const middleFont=Math.max(18,Math.round(width*.065)),y=height*.5;elements+=vectorText('0906215365',width/2,y-middleFont*.12,middleFont,{align:'center',opacity:.23})+vectorText('Nguonchothue.vn',width/2,y+middleFont*.66,middleFont*.58,{align:'center',opacity:.20});}
 if(phone&&!banner)elements+=vectorText('0906215365',x,height-margin-font*.64,font,banner?{opacity:.30,dark:true}:{});
 if(website&&!banner)elements+=vectorText('Nguonchothue.vn',x,height-margin,Math.max(12,font*.57),{opacity:banner ? .27 : .38,dark:banner});
 const codeFont=Math.max(12,Math.round(width*.024)),codeHeight=code?Math.round(codeFont*1.6):0;
 if(code){const boxWidth=Math.min(width-margin*2,Math.round(code.length*codeFont*.7+codeFont));elements+=`<rect x="${margin}" y="${margin}" width="${boxWidth}" height="${codeHeight}" rx="${Math.round(codeFont*.2)}" fill="#fffaf4" fill-opacity=".86"/>`+vectorText(code,margin+codeFont*.4,margin+codeFont*1.13,codeFont,{align:'start',opacity:.93,dark:true})}
 const overlays=[{input:Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${elements}</svg>`)}];
 if(qr){const {size,left,top}=qrPlacement(width,height,{code,layout}),qrBytes=await sharp(qrImage||defaultQR).resize(size,size,{kernel:'nearest'}).png().toBuffer();overlays.push({input:qrBytes,left,top})}
 const image=sharp(raw).composite(overlays);return format==='webp'?image.webp({quality:87}).toBuffer():format==='png'?image.png().toBuffer():image.flatten({background:'#fff'}).jpeg({quality:88,mozjpeg:true}).toBuffer();
}
