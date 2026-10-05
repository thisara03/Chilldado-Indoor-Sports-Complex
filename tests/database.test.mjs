import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
const dir=mkdtempSync(join(tmpdir(),'chillado-test-'));
process.env.TURSO_DATABASE_URL='file:'+join(dir,'test.db');
execFileSync(process.execPath,['scripts/migrate.mjs'],{env:process.env});
const {database,databaseClient}=await import('../lib/database.ts');
const d=database();
const reserve=(id,key,now=100)=>d.batch([
 d.prepare('INSERT INTO slots (key,booking_id,expires_at,confirmed) VALUES (?,?,?,0) ON CONFLICT(key) DO UPDATE SET booking_id=excluded.booking_id,expires_at=excluded.expires_at,confirmed=0 WHERE slots.confirmed=0 AND slots.expires_at<=?').bind(key,id,now+1000,now),
 d.prepare('INSERT INTO bookings (id,token,date,hour,amount,status,created_at,expires_at,user_id) SELECT ?,?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM slots WHERE key=? AND booking_id=?)').bind(id,id,'2026-11-01',0,7000,'pending',now,now+1000,'verified-user',key,id)
]);
test('migration can be rerun without changing data',async()=>{execFileSync(process.execPath,['scripts/migrate.mjs'],{env:process.env});assert.equal((await d.prepare('SELECT COUNT(*) AS n FROM chillado_migrations').first()).n,5);});
test('competing bookings produce one owner and one booking',async()=>{const results=await Promise.all([reserve('a','same'),reserve('b','same')]);assert.equal(results.filter(r=>r[1].meta.changes===1).length,1);assert.equal((await d.prepare('SELECT COUNT(*) AS n FROM bookings').first()).n,1);});
test('expired holds can be replaced, confirmed slots cannot',async()=>{await reserve('old','expired');assert.equal((await reserve('new','expired',1200))[1].meta.changes,1);await d.prepare('UPDATE slots SET confirmed=1 WHERE key=?').bind('expired').run();assert.equal((await reserve('blocked','expired',3000))[1].meta.changes,0);});
test('failed batch rolls back its slot mutation',async()=>{await assert.rejects(()=>d.batch([d.prepare("INSERT INTO slots VALUES ('rollback','x',100,0)"),d.prepare('INSERT INTO no_such_table VALUES (1)')]));assert.equal(await d.prepare("SELECT * FROM slots WHERE key='rollback'").first(),null);});
test('late successful payment requires review instead of stealing another hold',async()=>{await d.batch([d.prepare('UPDATE slots SET confirmed=1 WHERE key=? AND booking_id=?').bind('expired','old'),d.prepare("UPDATE bookings SET status=CASE WHEN EXISTS(SELECT 1 FROM slots WHERE key=? AND booking_id=? AND confirmed=1) THEN 'confirmed' ELSE 'payment_review' END WHERE id=?").bind('expired','old','old')]);assert.equal((await d.prepare("SELECT status FROM bookings WHERE id='old'").first()).status,'payment_review');assert.equal((await d.prepare("SELECT booking_id FROM slots WHERE key='expired'").first()).booking_id,'new');});
test('data export/import preserves records and remaps verified users',async()=>{
 const records=join(dir,'records.json'),mapping=join(dir,'mapping.json');
 execFileSync(process.execPath,['scripts/export-data.mjs',join(dir,'test.db'),records],{env:process.env});
 const targetEnv={...process.env,TURSO_DATABASE_URL:'file:'+join(dir,'import.db')};
 execFileSync(process.execPath,['scripts/migrate.mjs'],{env:targetEnv});
 assert.throws(()=>execFileSync(process.execPath,['scripts/import-data.mjs',records],{env:targetEnv,stdio:'pipe'}));
 writeFileSync(mapping,JSON.stringify({'verified-user':'new-supabase-user'}));
 execFileSync(process.execPath,['scripts/import-data.mjs',records,mapping],{env:targetEnv});
 const {createClient}=await import('@libsql/client');const target=createClient({url:targetEnv.TURSO_DATABASE_URL});
 const rows=(await target.execute('SELECT user_id FROM bookings')).rows;assert.ok(rows.length);assert.ok(rows.every(r=>r.user_id==='new-supabase-user'));
 assert.throws(()=>execFileSync(process.execPath,['scripts/import-data.mjs',records,mapping],{env:targetEnv,stdio:'pipe'}));
 assert.equal((await target.execute('SELECT COUNT(*) AS n FROM bookings')).rows[0].n,rows.length);target.close();
});
test.after(()=>{databaseClient().close();rmSync(dir,{recursive:true,force:true});});
