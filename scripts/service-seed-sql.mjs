// Emits only the initial, generated public content/cover; never loads credentials.
// Existing slugs are intentionally left untouched so admin edits are preserved.
import {readFile} from 'node:fs/promises';
import {serviceArticles} from '../lib/service-content.mjs';
const a=serviceArticles.find(a=>a.industry===process.argv[2]);if(!a)throw Error('Choose a known service key.');
const quote=v=>"'"+String(v).replaceAll("'","''")+"'";
const cover={mime:'image/webp',base64:(await readFile(new URL('../public/service-images/'+a.industry+'.webp',import.meta.url))).toString('base64')};
process.stdout.write('insert into public.news_articles(id,slug,section,industry,title,excerpt,content,status,featured,source_url,cover,has_cover,source_key,published_at) values(gen_random_uuid(),'+[a.slug,a.section,a.industry,a.title,a.excerpt,a.content,'published'].map(quote).join(',')+',false,'+quote(a.source_url)+','+quote(JSON.stringify(cover))+'::jsonb,true,'+quote('website:service-initial:'+a.industry)+',now()) on conflict do nothing returning slug,section,industry,status,has_cover;');
