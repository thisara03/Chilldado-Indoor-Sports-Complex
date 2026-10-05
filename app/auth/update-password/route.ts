import {sameOrigin,siteOrigin} from '../../../lib/origin';
import {getUser} from '../../../lib/auth';
import {authClient} from '../../../lib/supabase';
export async function POST(request:Request){if(!sameOrigin(request)||!await getUser())return Response.json({error:'Sign in required'},{status:403});try{const p=await request.json();if(typeof p.password!=='string'||p.password.length<8||p.password.length>128)return Response.json({error:'Use 8–128 characters.'},{status:400});const {error}=await (await authClient()).auth.updateUser({password:p.password});return Response.json(error?{error:'Password could not be updated. Request a new reset link and try again.'}:{ok:true},{status:error?400:200});}catch{return Response.json({error:'Please try again.'},{status:503});}}
