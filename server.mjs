import http from 'node:http';
import chatHandler from './api/chat.mjs';
import leadsHandler from './api/leads.mjs';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const files={'/chatbot.js':'chatbot.js','/chatbot.css':'chatbot.css','/':'index.html','/styles.css':'styles.css','/app.js':'app.js','/logo.png':'logo.png','/banner.png':'banner.png'};
for(let i=0;i<6;i++)files['/room-'+i+'.svg']='room-'+i+'.svg';
const types={png:'image/png',svg:'image/svg+xml',html:'text/html; charset=utf-8',css:'text/css',js:'text/javascript'};
http.createServer(async(req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;if(pathname==='/api/chat')return chatHandler(req,res);if(pathname==='/api/leads')return leadsHandler(req,res);const file=files[new URL(req.url,'http://localhost').pathname];if(!file){res.writeHead(404);return res.end('Not found');}try{const data=await readFile(fileURLToPath(new URL('./public/'+file,import.meta.url)));res.writeHead(200,{'Content-Type':types[file.split('.').pop()],'X-Content-Type-Options':'nosniff'});res.end(data);}catch{res.writeHead(500);res.end('Unable to load page');}}).listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('AN CU server listening'));
