import {database} from './database';
import {createHash,timingSafeEqual} from 'node:crypto';
export const db=database;
export function config(){const e=process.env;return {merchant:e.PAYHERE_MERCHANT_ID||'',secret:e.PAYHERE_MERCHANT_SECRET||'',live:e.PAYHERE_MODE==='live',origin:e.PAYHERE_PUBLIC_ORIGIN||''};}
export function md5(s:string){return createHash('md5').update(s).digest('hex').toUpperCase();}
export function equal(a:string,b:string){return a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));}
export function ready(){const c=config();return !!(c.merchant&&c.secret&&c.origin);}
export function validSlot(date:string,hour:number){if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isInteger(hour)||hour<0||hour>22||hour%2)return false;const t=Date.parse(`${date}T${String(hour).padStart(2,'0')}:00:00+05:30`);return Number.isFinite(t)&&new Date(t+19800000).toISOString().slice(0,10)===date&&t>Date.now()&&t<Date.now()+366*86400000;}
export function error(message:string,status=503){return Response.json({error:message},{status,headers:{'Cache-Control':'no-store'}});}
