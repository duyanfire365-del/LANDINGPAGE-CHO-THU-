import sharp from 'sharp';
import {readFileSync} from 'node:fs';
import {create} from 'fontkit';
const typeface=create(readFileSync(new URL('./fonts/DejaVuSans.ttf',import.meta.url)));
const run=typeface.layout('0906215365');
let advance=0;const paths=run.glyphs.map((glyph,i)=>{const position=run.positions[i],path=`<path d="${glyph.path.toSVG()}" transform="translate(${advance+position.xOffset},${position.yOffset})"/>`;advance+=position.xAdvance;return path}).join('');
export const brandingVersion='phone-v1';
export async function watermarkImage(input,{format='jpeg'}={}){
 const source=sharp(input,{limitInputPixels:40000000,animated:false});const sourceMeta=await source.metadata();if(!['jpeg','png','webp'].includes(sourceMeta.format))throw Error('Unsupported listing image format');
 const base=source.rotate().resize({width:2000,height:2000,fit:'inside',withoutEnlargement:true});
 const raw=await base.toBuffer(),meta=await sharp(raw).metadata(),width=meta.width,height=meta.height;
 const font=Math.max(18,Math.round(width*.054)),x=Math.round(width*.965),y=Math.round(height*.91);
 const scale=font/typeface.unitsPerEm;
 const svg=Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><g transform="translate(${x-advance*scale},${y}) scale(${scale},${-scale})" fill="white" fill-opacity="0.42" stroke="#181818" stroke-opacity="0.23" stroke-width="${Math.max(1,font*.035)/scale}" paint-order="stroke">${paths}</g></svg>`);
 const image=sharp(raw).composite([{input:svg}]);return format==='webp'?image.webp({quality:87}).toBuffer():format==='png'?image.png().toBuffer():image.jpeg({quality:88,mozjpeg:true}).toBuffer();
}
