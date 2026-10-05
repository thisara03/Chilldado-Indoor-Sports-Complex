import {redirect} from 'next/navigation';
import {authClient,authReady} from './supabase';
export function safeReturnPath(path:string){try{const u=new URL(path,'https://local.invalid');return path.startsWith('/')&&!path.startsWith('//')&&u.origin==='https://local.invalid'&&!u.pathname.startsWith('/auth/') ? u.pathname+u.search : '/account';}catch{return '/account';}}
export async function getUser(){
  if(!authReady())return null;
  try{const {data,error}=await (await authClient()).auth.getUser();const u=data.user;
    if(error||!u?.email||!u.email_confirmed_at)return null;
    return {userId:u.id,email:u.email,displayName:u.email};
  }catch{return null;}
}
export async function requireUser(returnTo:string){const u=await getUser();if(u)return u;redirect('/login?next='+encodeURIComponent(safeReturnPath(returnTo)));}
