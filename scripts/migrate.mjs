import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {client} from './database-config.mjs';
const db=client();
try{
 await db.execute('CREATE TABLE IF NOT EXISTS chillado_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at INTEGER NOT NULL)');
 const dir=new URL('../drizzle/',import.meta.url);
 for(const name of (await readdir(dir)).filter(n=>n.endsWith('.sql')).sort()){
  const sql=await readFile(new URL(name,dir),'utf8');const checksum=createHash('sha256').update(sql).digest('hex');
  const old=(await db.execute({sql:'SELECT checksum FROM chillado_migrations WHERE name=?',args:[name]})).rows[0];
  if(old){if(old.checksum!==checksum)throw new Error('Applied migration was changed: '+name);continue;}
  const statements=sql.split('--> statement-breakpoint').map(sql=>sql.trim()).filter(Boolean);
  await db.batch([...statements,{sql:'INSERT INTO chillado_migrations VALUES (?,?,?)',args:[name,checksum,Date.now()]}],'write');
  console.log('Applied '+name);
 }
 console.log('Database schema is ready.');
}finally{db.close();}
