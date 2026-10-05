import {sameOrigin,siteOrigin} from '../../../lib/origin';
import {authClient} from '../../../lib/supabase';
import {safeReturnPath} from '../../../lib/auth';
export async function POST(request:Request){
 const origin=siteOrigin();if(!sameOrigin(request))return Response.json({error:'Invalid request'},{status:403});
 try{const p=await request.json();const email=typeof p.email==='string'?p.email.trim().toLowerCase():'';
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return Response.json({error:'Enter a valid email.'},{status:400});
 const auth=(await authClient()).auth;
 if(p.mode==='reset'){await auth.resetPasswordForEmail(email,{redirectTo:origin+'/auth/callback?next=/reset-password'});return Response.json({message:'If this account exists, check your email for a password reset link.'});}
 if(typeof p.password!=='string'||p.password.length<8||p.password.length>128)return Response.json({error:'Use a password between 8 and 128 characters.'},{status:400});
 if(p.mode==='signup'){const {error}=await auth.signUp({email,password:p.password,options:{emailRedirectTo:origin+'/auth/callback'}});return Response.json(error?{error:'Unable to create the account. Please try again later.'}:{message:'Check your email to confirm your account, then sign in.'},{status:error?400:200});}
 if(p.mode!=='login')return Response.json({error:'Invalid action'},{status:400});
 const {data,error}=await auth.signInWithPassword({email,password:p.password});
 if(error||!data.user?.email_confirmed_at)return Response.json({error:'Check your email, password and email confirmation.'},{status:401});
 return Response.json({redirect:safeReturnPath(typeof p.next==='string'?p.next:'/account')},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Login service unavailable. Please try again.'},{status:503});}
}
