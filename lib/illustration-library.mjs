// Original coded illustrations: no external photo licensing or paid image service.
const groups=[['mb','Mặt bằng kinh doanh',[['shop',4,['retail']],['cafe',4,['cafe']],['restaurant',4,['restaurant']],['showroom',4,['wide-road']]]],['vp','Văn phòng',[['workspace',6,['office']],['meeting',4,['meeting']]]],['kx','Kho xưởng',[['warehouse',4,['warehouse']],['loading',4,['truck']]]],['nc','Nhà nguyên căn',[['townhouse',3,['street']],['house',3,['home']]]]];
groups.push(['chcc','Căn hộ chung cư',[['apartment',3,['home']]]],['chdv','Căn hộ dịch vụ',[['apartment',3,['home']]]],['pt','Phòng trọ',[['house',3,['home']]]],['bt','Biệt thự, nhà liền kề',[['house',3,['home']]]],['ko','Ki-ốt',[['shop',3,['retail']]]],['dat','Đất cho thuê',[['land',3,['land']]]],['bds','Bất động sản khác',[['house',3,[]]]]);
export const illustrationLibrary=groups.flatMap(([key,type,scenes])=>scenes.flatMap(([scene,count,tags])=>Array.from({length:count},(_,i)=>({id:key+'-'+scene+'-'+(i+1),type,scene,variant:i,tags,path:'/illustrations/'+key+'-'+scene+'-'+(i+1)+'.jpg'}))));
const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase();
export function publicIllustrationTags(post){
 // Only public editorial copy is used, never private source notes or contact data.
 const lines=fold([post.title,post.description,...(post.facts||[])].join('\n')).split(/[\n.!?;]/).filter(s=>!/(khong|chua|can xac nhan|cho xac nhan|chua ro)/.test(s));
 const text=lines.join(' '),rules={cafe:/ca phe|cafe|coffee/,restaurant:/nha hang|quan an|am thuc/,retail:/cua hang|ban le|kinh doanh/,office:/van phong/,meeting:/phong hop|hop nhom/,warehouse:/kho|xuong/,truck:/xe tai|container|boc do|logistics/,'wide-road':/duong rong|via he|o to tranh/,street:/mat pho|mat duong/,home:/nha nguyen can/};
 return Object.entries(rules).filter(([,re])=>re.test(text)).map(([tag])=>tag);
}
function stableHash(value){let h=2166136261;for(const c of String(value)){h^=c.codePointAt(0);h=Math.imul(h,16777619)}return h>>>0}
export function pickIllustration(post){
 const matched=illustrationLibrary.filter(x=>x.type===post.type),pool=matched.length?matched:illustrationLibrary.filter(x=>x.type==='Bất động sản khác');
 const tags=publicIllustrationTags(post),score=x=>x.tags.reduce((n,t)=>n+(tags.includes(t)?(['retail','office','warehouse','home'].includes(t)?1:3):0),0),best=Math.max(...pool.map(score));
 // Without supported detail use the generic scene, never infer roads, traffic or amenities.
 const preferred=pool.filter(x=>x.scene===post.illustrationScene);
 const candidates=preferred.length?preferred:best?pool.filter(x=>score(x)===best):pool.filter(x=>x.scene===pool[0].scene);
 const identity=post.slug||post.id||post.code||[post.type,post.title,post.address,post.size].join('|');
 const hash=stableHash(identity),chosen=candidates[hash%candidates.length];
 if(/^live-\d+$/.test(post.slug||''))return {...chosen,id:chosen.id+'-auto-'+hash,variant:hash%4096,noFood:/khong.*hang an|khong.*an uong/.test(fold(post.description)),generated:true,path:'/api/files?action=illustration&slug='+encodeURIComponent(post.slug)+'&v=sync-20261029-'+encodeURIComponent((post.code||'base')+'-'+(post.contentRevision||'initial'))};
 return chosen;
}
