import {getUser} from '../../lib/auth';
import {authReady} from '../../lib/supabase';
import {SiteHeader,SiteFooter} from '../components';
import LoginForm from './login-form';
export const dynamic='force-dynamic';
export default async function Login(){const user=await getUser();return <><SiteHeader/><main className="section account-page"><p className="eyebrow">YOUR CHILLADO ACCOUNT</p><h1 className="page-title">Welcome <em>back.</em></h1><p className="muted">Sign in to view your bookings or access the admin panel.</p><div className="login-card">{user?<><h2>You’re signed in</h2><p>{user.displayName}</p><a className="button" href="/account">My bookings</a><form action="/auth/signout" method="post"><button className="text-link">Sign out</button></form></>:authReady()?<LoginForm/>:<p>Login is being configured. Please check back soon.</p>}<p className="muted">Venue staff can <a className="text-link" href="/admin">access the admin panel</a> with an authorised account.</p></div></main><SiteFooter/></>}
