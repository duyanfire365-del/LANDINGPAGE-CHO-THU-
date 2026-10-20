export const CONFIRMATION_DAYS=30;
export function inventorySnapshot(records,events=[],now=Date.now()){
 const latest={},hotEvents={},states={},hot={},hotSelected={},confirmedAt={};
 for(const e of events){if(e.kind.startsWith('inventory:')&&!latest[e.record_id])latest[e.record_id]=e;if(e.kind.startsWith('hot:')&&!hotEvents[e.record_id])hotEvents[e.record_id]=e}
 for(const p of records){const e=latest[p.slug];let state=e?.kind.slice(10)||p.availability||'available';const when=e?.created_at||p.publishedAt||p.publishedDate,stamp=Date.parse(when||'');if(state==='available'&&(!Number.isFinite(stamp)||now-stamp>CONFIRMATION_DAYS*86400000))state='awaiting';states[p.slug]=state;confirmedAt[p.slug]=Number.isFinite(stamp)?new Date(stamp).toISOString():null;hotSelected[p.slug]=hotEvents[p.slug]?hotEvents[p.slug].kind==='hot:on':p.hot===true;hot[p.slug]=hotSelected[p.slug]&&state==='available'}
 return {states,hot,hotSelected,confirmedAt};
}
