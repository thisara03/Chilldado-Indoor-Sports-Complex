// Set this separately for local, preview, and production environments.
export function siteOrigin(){
 const configured=process.env.SITE_URL||(process.env.VERCEL_URL?'https://'+process.env.VERCEL_URL:'http://localhost:3000');
 const url=new URL(configured);
 if(process.env.VERCEL&&url.protocol!=='https:')throw new Error('Hosted SITE_URL must use HTTPS');
 return url.origin;
}
export function sameOrigin(request:Request){try{return request.headers.get('origin')===siteOrigin();}catch{return false;}}
