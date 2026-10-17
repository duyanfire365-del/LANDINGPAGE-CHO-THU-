import {readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
for(const folder of ['api','lib','public','scripts'])for(const file of await readdir(folder)){
 if(!/\.(m?js)$/.test(file))continue;
 const result=spawnSync(process.execPath,['--check',`${folder}/${file}`],{stdio:'inherit'});
 if(result.status)process.exit(result.status||1);
}
const server=spawnSync(process.execPath,['--check','server.mjs'],{stdio:'inherit'});process.exit(server.status||0);
