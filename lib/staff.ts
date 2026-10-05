import {getUser} from './auth';
export async function staffUser(){const u=await getUser();const emails=String(process.env.STAFF_EMAILS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);return u&&emails.includes(u.email.toLowerCase())?u:null;}
