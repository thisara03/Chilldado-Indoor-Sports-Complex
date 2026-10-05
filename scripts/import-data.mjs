import {readFile} from 'node:fs/promises';
import {client,tables} from './database-config.mjs';
const [source,mappingPath]=process.argv.slice(2);
if(!source)throw new Error('Usage: npm run db:import -- records.json [user-map.json]');
const data=JSON.parse(await readFile(source,'utf8'));if(data.format!=='chillado-records-v1'||!data.tables)throw new Error('Invalid export format');
const mapping=mappingPath?JSON.parse(await readFile(mappingPath,'utf8')):{};
const statements=[];
for(const [table,columns] of Object.entries(tables)){
 const rows=data.tables[table];if(!Array.isArray(rows))throw new Error('Missing table '+table);
 for(const sourceRow of rows){const row={...sourceRow};if(table==='bookings'&&row.user_id){if(!mapping[row.user_id])throw new Error('Provide a verified Supabase user ID mapping for every old booking user ID.');row.user_id=mapping[row.user_id];}
  if(!columns.every(c=>Object.hasOwn(row,c)))throw new Error('Missing columns for '+table);
  statements.push({sql:`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(()=>'?').join(',')})`,args:columns.map(c=>row[c])});
 }
}
const db=client();const tx=await db.transaction('write');
try{for(const table of Object.keys(tables)){if(Number((await tx.execute(`SELECT COUNT(*) AS count FROM ${table}`)).rows[0].count))throw new Error('Import requires an empty target. Existing '+table+' records were left untouched.');}
 for(let i=0;i<statements.length;i+=100)await tx.batch(statements.slice(i,i+100));
 await tx.commit();console.log('Imported '+statements.length+' records atomically.');
}catch(e){await tx.rollback();throw e;}finally{tx.close();db.close();}
