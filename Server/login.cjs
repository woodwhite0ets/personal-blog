require('dotenv').config();
const jwt=require('jsonwebtoken');const fs=require('fs');
const t=jwt.sign({id:1,username:'WoodWhite',role:'admin'},process.env.JWT_PRIVATE_KEY||fs.readFileSync('./keys/jwt_private.pem','utf8'),{algorithm:'RS256',expiresIn:'5m'});
(async()=>{
const r=await fetch('https://blog.woodwhite.top/api/gateway/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token:t})});
console.log('LOGIN',r.status);
const setc=r.headers.get('set-cookie');const ck=setc?setc.split(';')[0]:'';
console.log('COOKIE_SET',!!setc);
const pr=await fetch('https://blog.woodwhite.top/api/gateway/projects',{headers:{cookie:ck}});
const jobs=await pr.json();
console.log('PROJ',pr.status,Array.isArray(jobs)?jobs.length:'n/a');
if(Array.isArray(jobs)){console.log('IDS',jobs.map(p=>p.id).join(','));console.log('KEYS',JSON.stringify(Object.keys(jobs[0]||{})));
if(jobs.length){const dr=await fetch('https://blog.woodwhite.top/api/gateway/projects/'+encodeURIComponent(jobs[0].id)+'/documents',{headers:{cookie:ck}});const docs=await dr.json();console.log('DOCS',dr.status,Array.isArray(docs)?docs.length:'n/a');if(Array.isArray(docs))console.log('SAMPLE',JSON.stringify(docs.slice(0,2)));}}
else console.log('RESP',JSON.stringify(jobs));
})().catch(e=>console.error('ERR',e.message));
