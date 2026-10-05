import {requireUser} from '../../lib/auth';
import {SiteHeader,SiteFooter} from '../components';
import ResetForm from './reset-form';
export const dynamic='force-dynamic';
export default async function Reset(){await requireUser('/reset-password');return <><SiteHeader/><main className="section account-page"><h1 className="page-title">New <em>password.</em></h1><div className="login-card"><ResetForm/></div></main><SiteFooter/></>}
