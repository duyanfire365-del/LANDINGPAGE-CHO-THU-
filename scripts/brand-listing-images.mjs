import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {watermarkImage,brandingVersion} from '../lib/image-branding.mjs';
const manifestFile=new URL('../lib/image-branding-manifest.json',import.meta.url);let manifest={};try{manifest=JSON.parse(await readFile(manifestFile,'utf8'))}catch{}
const rows=JSON.parse(await readFile(new URL('../public/listings.json',import.meta.url),'utf8'));
const paths=[...new Set(rows.flatMap(r=>[r.image,r.shareImage]).concat(['/banner.png']).filter(path=>path.startsWith('/images/')||path==='/banner.png'))];
const codes=new Map(rows.flatMap(row=>[[row.image,row.code],[row.shareImage,row.code]]));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');let count=0;
await mkdir('/workspace/scratch/branding-originals',{recursive:true});
for(const path of paths){
 const file=new URL('../public'+path,import.meta.url),bytes=await readFile(file),entry=manifest[path],version=path==='/banner.png'?brandingVersion+'-banner-v4':brandingVersion;if(entry?.version===version&&entry.sha256===hash(bytes)&&entry.code===(codes.get(path)||''))continue;
 const backup='/workspace/scratch/branding-originals/'+path.replaceAll('/','_');try{await writeFile(backup,bytes,{flag:'wx'})}catch(error){if(error.code!=='EEXIST')throw error}
 const format=path.endsWith('.webp')?'webp':path.endsWith('.png')?'png':'jpeg';
 let original=bytes;if(entry?.sha256===hash(bytes)){try{original=await readFile(backup)}catch{throw Error('Original image is required to avoid stacking watermarks: '+path)}}
 const branded=await watermarkImage(original,{format,code:codes.get(path)||'',layout:path==='/banner.png'?'banner':'photo',phone:path!=='/banner.png',website:path!=='/banner.png'});await writeFile(file,branded);manifest[path]={version,code:codes.get(path)||'',sha256:hash(branded)};count++;
}
await writeFile(manifestFile,JSON.stringify(manifest,null,2)+'\n');console.log('Embedded hotline watermark into '+count+' images. Unchanged branded files skipped.');
