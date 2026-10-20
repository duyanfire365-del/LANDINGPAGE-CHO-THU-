import {readdir,readFile} from 'node:fs/promises';
import {matchesGlob} from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
for(const folder of ['api','lib','public','scripts'])for(const file of await readdir(folder)){
 if(!/\.(m?js)$/.test(file))continue;
 const result=spawnSync(process.execPath,['--check',`${folder}/${file}`],{stdio:'inherit'});
 if(result.status)process.exit(result.status||1);
}
const server=spawnSync(process.execPath,['--check','server.mjs'],{stdio:'inherit'});if(server.status)process.exit(server.status);

// Vercel consumes the first matching function rule; overlapping entries can leave
// a later rule unmatched and fail the deployment before any code is built.
const config=JSON.parse(await readFile('vercel.json','utf8'));
const handlers=(await readdir('api')).filter(name=>/\.(?:m?js|ts)$/.test(name)).map(name=>'api/'+name);
const patterns=Object.keys(config.functions||{});
for(const file of handlers)assert.equal(patterns.filter(pattern=>matchesGlob(file,pattern)).length,1,'Each API handler must match exactly one Vercel function rule: '+file);
for(const pattern of patterns)assert.ok(handlers.some(file=>matchesGlob(file,pattern)),'Vercel function pattern has no handler: '+pattern);
console.log('Vercel function configuration: '+handlers.length+' handlers, no overlapping or unused rules.');
