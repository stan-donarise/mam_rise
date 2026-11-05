const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
const vm=require('node:vm')
const ts=require('typescript')
function environment(){
	const scope={$mol_object:class{},$mol_memo:{method:()=>{}},$mol_action:()=>{},$mol_mem:()=>{},$mol_mem_key:()=>{},$giper_baza_rank_post:()=>0,$rise_bench_run_baza_version:'2e6100b225c8d4fb3a5b5d14e8568223e8a8c785',$rise_bench_product_name:index=>`Notebook ${String(index).padStart(5,'0')}`,$mol_error_fence:(task,failure)=>{try{return task()}catch(error){return failure(error)}}}
	const context=vm.createContext({$:scope,...scope,console,URL,Map,Promise,Error,Number,JSON,setTimeout,clearTimeout})
	for(const relative of ['../product/product.ts','../idb/storage/storage.ts','storage/storage.ts','../archive/archive.ts','engine/engine.ts']){
		const file=relative==='engine/engine.ts'?path.resolve(__dirname,'../../engine/engine.ts'):path.resolve(__dirname,'..',relative)
		const source=fs.readFileSync(file,'utf8')
		vm.runInContext(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,experimentalDecorators:true}}).outputText,context)
		Object.assign(context,context.$)
	}
	return context.$
}
test('SQL literals preserve quotes, Unicode, JSON, null and reject non-finite numbers',()=>{
	const $=environment(),storage=new $.$rise_bench_sql_storage('fixture','sqlite',true)
	assert.equal(storage.literal("O'Reilly — текст"),"'O''Reilly — текст'")
	assert.equal(storage.literal(['one',"two's"]),"'[\"one\",\"two''s\"]'")
	assert.equal(storage.literal(false),'0');assert.equal(storage.literal(null),'NULL')
	assert.throws(()=>storage.literal(Infinity),/число/)
})
test('All SQL engines use one batch insert, real columns and safe field updates',async()=>{
	for(const engine of ['sqlite','pglite','duckdb'])for(const compact of [true,false]){
		const $=environment(),storage=new $.$rise_bench_sql_storage('fixture',engine,compact),queries=[]
		storage.query=async sql=>{queries.push(sql);return []}
		await storage.create(100,compact)
		assert.equal(queries.filter(sql=>sql.startsWith('INSERT INTO products VALUES')).length,1)
		assert.equal(queries.filter(sql=>sql==='CHECKPOINT').length,engine==='duckdb'?1:0)
		assert.equal(Object.keys(storage.product(0,compact)).length,compact?4:10)
		await storage.change(0,'color',"red'blue")
		assert.ok(queries.some(sql=>sql==="UPDATE products SET color='red''blue' WHERE id='00000'"))
		await assert.rejects(()=>storage.change(0,'id; DROP TABLE products','bad'),/поле/)
	}
})
test('Archive accepts old results and preserves explicit SQL engine versions, never workload fields',()=>{
	const $=environment(),operations=$.$rise_bench_archive.operations('goods')
	const legacy={id:'12345678-1234-1234-1234-123456789012',count:100,properties:4,stamp:'05.11.2026 20:00:00',state:'Готово',baza_version:'—',benchmark_version:'0.3.0',metrics:Object.fromEntries(operations.filter(name=>name!=='Запуск БД, с').map(name=>[name,0.1]))}
	assert.equal($.$rise_bench_archive.validate(legacy,operations).metrics['Запуск БД, с'],null)
	for(const engine of ['sqlite','pglite','duckdb']){
		const source={...legacy,engine,engine_version:$.$rise_bench_engine[engine].version,database:'must-not-escape',rows:[{title:'must-not-escape'}]}
		const row=$.$rise_bench_archive.validate(source,operations)
		assert.equal(row.engine,engine);assert.equal(row.engine_version,source.engine_version)
		assert.equal(row.database,undefined);assert.equal(row.rows,undefined)
	}
	assert.equal($.$rise_bench_archive.validate({...legacy,engine:'unknown'},operations),null)
	assert.equal($.$rise_bench_archive.validate({...legacy,engine_version:'x'.repeat(81)},operations),null)
})
test('SQLite keeps its database lock until close, the next owner waits without polling',async()=>{
	const locks=new Map(),installations=[]
	const sqlite={installOpfsSAHPoolVfs:async options=>{
		installations.push(options)
		return {OpfsSAHPoolDb:class{exec(){return []}close(){}},pauseVfs:async()=>{}}
	}}
	const context=vm.createContext({Promise,navigator:{locks:{request:(name,task)=>{
		const next=(locks.get(name)||Promise.resolve()).then(task);locks.set(name,next);return next
	}}},Function:class{constructor(){return async()=>({default:async()=>sqlite})}}})
	const source=fs.readFileSync(path.resolve(__dirname,'../sqlite/sqlite.ts'),'utf8')
	vm.runInContext(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,context)
	const first=await context.$.$rise_bench_sql_sqlite('same-database')
	let acquired=false
	const waiting=context.$.$rise_bench_sql_sqlite('same-database').then(driver=>{acquired=true;return driver})
	await new Promise(setImmediate)
	assert.equal(acquired,false);assert.equal(installations.length,1)
	assert.equal(installations[0].preserveOnInitFailure,true)
	await first.close()
	const second=await waiting
	assert.equal(acquired,true);assert.equal(installations.length,2)
	await second.close()
})
