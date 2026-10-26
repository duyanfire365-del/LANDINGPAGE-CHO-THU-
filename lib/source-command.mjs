// Control messages must never become property listings, including retries.
export function sourceControl(value){
 const text=String(value||'').trim();
 const known=text.match(/^\/?(status|start|help)(?:@\w+)?(?:\s|$)/iu);
 if(known)return known[1].toLowerCase();
 const slash=text.match(/^\/([a-z][a-z0-9_]*)(?:@\w+)?(?:\s|$)/iu);
 return slash&&!['dang','danglai','retry'].includes(slash[1].toLowerCase())?'unknown':null;
}
