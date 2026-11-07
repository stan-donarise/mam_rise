const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
const vm=require('node:vm')
const ts=require('typescript')
const root=path.resolve(__dirname,'../..')
function load(files,extra={}){
	const context=vm.createContext({$:{},URL,Date,Error,Map,...extra})
	for(const file of files){vm.runInContext(ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,context);Object.assign(context,context.$)}
	return context
}
test('All All is exactly forty distinct cases, in stable engine and ascending size order',()=>{
	const c=load(['selection/selection.ts','batch/batch.ts']);c.$rise_bench_engine={goods:{},idb:{},sqlite:{},pglite:{},duckdb:{}}
	const rows=c.$.$rise_bench_batch('all','all','compact')
	assert.equal(rows.length,40);assert.equal(new Set(rows.map(row=>JSON.stringify(row))).size,40)
	assert.ok(rows.every(row=>row.schema==='compact'))
	assert.deepEqual(Array.from(rows.slice(0,8),r=>Number(r.count)),[100,500,1000,2000,3000,4000,5000,10000])
	assert.equal(c.$.$rise_bench_batch('idb','all','full').length,8)
	assert.equal(c.$.$rise_bench_batch('all','100','compact').length,5)
	assert.equal(c.$.$rise_bench_batch('all','all','compact',true).length,5)
})
test('Phases report their timestamps without any automatic operation deadline',()=>{
	let now=1000;const messages=[]
	const parent={postMessage:m=>messages.push(m)},c=load(['stage/stage.ts'],{Date:{now:()=>now},location:{href:'https://example.test/?rise_fixture=idb&rise_run=token',origin:'https://example.test'},window:{parent}})
	c.$rise_bench_archive={operations:()=>['Создание, с']}
	const run={id:'test',properties:4,bytes:()=>null,metric:()=>null}
	const stage=new c.$.$rise_bench_stage(run,'Создание, с')
	assert.equal(c.$.$rise_bench_stage.limit,undefined)
	assert.equal(stage.check,undefined)
	now+=3600000
	assert.equal(stage.started,1000)
	assert.equal(messages.length,1);assert.equal(messages[0].token,'token');assert.equal(messages[0].started,1000)
	const next=new c.$.$rise_bench_stage(run,'Поиск, с');assert.equal(next.started,now)
	assert.equal(c.$.$rise_bench_stage.failure(new Error('database secret-dataset-name')), 'Поиск, с: ошибка выполнения')
	assert.equal(c.$.$rise_bench_stage.failure(new Error('превышен лимит 300 с')), 'Поиск, с: ошибка выполнения')
})
test('Multiple schemas and partial selections produce exactly their Cartesian product',()=>{
	const c=load(['selection/selection.ts','batch/batch.ts']);c.$rise_bench_engine={goods:{},idb:{},sqlite:{},pglite:{},duckdb:{}}
	const rows=c.$.$rise_bench_batch('idb,goods,idb','500,100','full,compact')
	assert.equal(rows.length,8);assert.equal(new Set(rows.map(row=>JSON.stringify(row))).size,8)
	assert.equal(rows[0].engine,'goods');assert.equal(rows[0].count,'100');assert.equal(rows[0].schema,'compact')
	assert.equal(c.$.$rise_bench_batch('all','all','all').length,80)
	assert.equal(c.$.$rise_bench_batch('','100','compact').length,0)
	assert.equal(c.$.$rise_bench_batch('goods','','compact').length,0)
	assert.equal(c.$.$rise_bench_batch('goods','100','').length,0)
})
