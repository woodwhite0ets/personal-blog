require('dotenv').config();
const jwt=require('jsonwebtoken');const fs=require('fs');
const pool=require('./src/config/db');
(async()=>{const[rows]=await pool.query("SELECT id,username,role FROM users WHERE id=1");if(!rows.length){console.log('NO USER id=1');process.exit(1);}
const user=rows[0];
const key=process.env.JWT_PRIVATE_KEY||fs.readFileSync('./keys/jwt_private.pem','utf8');
const t=jwt.sign({id:user.id,username:user.username,role:user.role},key,{algorithm:'RS256',expiresIn:'5m'});
const m=await fetch('https://blog.woodwhite.top/api/auth/me',{headers:{authorization:'Bearer '+t}});
console.log('BLOG_ME',m.status,JSON.stringify(await m.json().catch(()=>({}))));
})().catch(e=>{console.error('ERR',e.message);process.exit(1);});
