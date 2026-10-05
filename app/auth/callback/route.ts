import {sameOrigin,siteOrigin} from '../../../lib/origin';
import {authClient} from '../../../lib/supabase';
import {safeReturnPath} from '../../../lib/auth';
export async function GET(request:Request){
 const u=new URL(request.url),code=u.searchParams.get('code'),hash=u.searchParams.get('token_hash'),type=u.searchParams.get('type');
 try{const auth=(await authClient()).auth;
 const result=code?await auth.exchangeCodeForSession(code):hash&&(type==='email'||type==='recovery')?await auth.verifyOtp({token_hash:hash,type}):null;
 if(result&&!result.error)return Response.redirect(new URL(safeReturnPath(type==='recovery'?'/reset-password':u.searchParams.get('next')||'/account'),siteOrigin()),303);
 }catch{}
 return Response.redirect(new URL('/login?error=confirmation',siteOrigin()),303);
}
