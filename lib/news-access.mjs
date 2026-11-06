import {authenticated} from '../api/admin.mjs';
import {member} from './platform.mjs';
// Reuse the server-verified posting role; public readers fail closed.
export async function canViewNewsDates(req){
 if(authenticated(req))return true;
 try{const profile=await member(req);return profile?.kind==='sales'&&profile.can_post===true;}catch{return false;}
}
