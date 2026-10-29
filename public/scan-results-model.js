(function(root){
 const labels={new:'Mới',contacted:'Đã liên hệ',published:'Đã đăng nguồn',closed:'Đã đóng nguồn',unresponsive:'Chưa kết nối được'};
 const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'});
 function day(value){const d=new Date(value);if(!Number.isFinite(+d))return '';return formatter.format(d)}
 function before(key,n){return new Date(Date.parse(key+'T12:00:00+07:00')-n*86400000).toISOString().slice(0,10)}
 const fold=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
 function filter(items,f={},now=new Date()){
  const today=day(now),start=f.from||({today:today,week:before(today,6),month:before(today,29)})[f.range],end=f.to||today;
  const number=(v,min,max)=>(min===''||min==null||v!=null&&v>=Number(min))&&(max===''||max==null||v!=null&&v<=Number(max));
  const result=items.filter(r=>(!f.kind||r.kind===f.kind)&&(!start||day(r.collectedAt)>=start)&&(!end||day(r.collectedAt)<=end)&&(!f.status||r.status===f.status)&&(!f.verification||r.verified===(f.verification==='yes'))&&(!f.source||r.sources.some(s=>s.url===f.source))&&(!f.district||r.district===f.district)&&(!f.propertyType||r.propertyType===f.propertyType)&&(!f.industry||r.industries.includes(f.industry))&&(!f.q||fold([r.address,r.district,r.phone,r.authorName,r.code,r.content,r.requirements].join(' ')).includes(fold(f.q)))&&number(r.rent,f.rentMin,f.rentMax)&&number(r.size,f.sizeMin,f.sizeMax)&&number(r.frontage,f.frontageMin,null)&&(!f.hasPhone||!!r.phone)&&(!f.priceChanged||r.priceChanged)&&(!f.crossposted||new Set(r.sources.filter(s=>{try{const u=new URL(s.url);return /^(?:www\.|m\.)?facebook\.com$/.test(u.hostname)&&/^\/(?:groups\/|share\/g\/)/.test(u.pathname)}catch{return false}}).map(s=>s.url)).size>=2));
  return result.sort((a,b)=>f.sort==='old'?Date.parse(a.collectedAt)-Date.parse(b.collectedAt):f.sort==='rent-asc'?(a.rent??Infinity)-(b.rent??Infinity):f.sort==='rent-desc'?(b.rent??-Infinity)-(a.rent??-Infinity):Date.parse(b.collectedAt)-Date.parse(a.collectedAt));
 }
 function summary(items,now=new Date()){
  const today=day(now);return {ownersToday:items.filter(x=>x.kind==='owner'&&day(x.collectedAt)===today).length,tenantsToday:items.filter(x=>x.kind==='tenant'&&day(x.collectedAt)===today).length,unverified:items.filter(x=>!x.verified).length,verifiedPending:items.filter(x=>x.verified&&x.status!=='published'&&x.status!=='closed').length,published:items.filter(x=>x.status==='published').length,tenantsUncontacted:items.filter(x=>x.kind==='tenant'&&x.status==='new').length};
 }
 function chart(items,now=new Date()){const today=day(now),days=Array.from({length:14},(_,i)=>({date:before(today,13-i),owner:0,tenant:0})),byDate=new Map(days.map(d=>[d.date,d]));for(const item of items){const entry=byDate.get(day(item.collectedAt));if(entry&&(item.kind==='owner'||item.kind==='tenant'))entry[item.kind]++}return days}
 const api={labels,day,filter,summary,chart};if(typeof module==='object'&&module.exports)module.exports=api;else root.ScanResultsModel=api;
})(globalThis);
