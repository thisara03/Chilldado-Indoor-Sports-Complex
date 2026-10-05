// Reads a local SQLite snapshot. Never reads the hosted database or prints its records.
import {DatabaseSync} from 'node:sqlite';
import {writeFile} from 'node:fs/promises';
import {tables} from './database-config.mjs';
const [source,destination]=process.argv.slice(2);
if(!source||!destination)throw new Error('Usage: node scripts/export-data.mjs snapshot.sqlite records.json');
const db=new DatabaseSync(source,{readOnly:true});
try{const data={format:'chillado-records-v1',tables:{}};for(const [table,columns] of Object.entries(tables))data.tables[table]=db.prepare(`SELECT ${columns.join(',')} FROM ${table}`).all();await writeFile(destination,JSON.stringify(data),{mode:0o600});console.log('Export saved. Keep this file private.');}finally{db.close();}
