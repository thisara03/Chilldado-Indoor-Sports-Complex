import {sameOrigin,siteOrigin} from '../../../lib/origin';
import {authClient} from '../../../lib/supabase';
export async function POST(request:Request){const origin=siteOrigin();if(!sameOrigin(request))return new Response('Invalid request',{status:403});try{await (await authClient()).auth.signOut();}catch{return new Response('Sign out unavailable',{status:503});}return Response.redirect(new URL('/login',origin),303);}
