const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
const vm=require('node:vm')
const ts=require('typescript')
const root=path.resolve(__dirname,'../..')
function load(files,extra={}){
	const context=vm.createContext({$:{},URL,Date,Error,Map,...extra})
	for(const file of files)vm.runInContext(ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,context)
	return context
}
test('All All is exactly forty distinct cases, in stable engine and ascending size order',()=>{
	const c=load(['batch/batch.ts']);c.$rise_bench_engine={goods:{},idb:{},sqlite:{},pglite:{},duckdb:{}}
	const rows=c.$.$rise_bench_batch('all','all','compact')
	assert.equal(rows.length,40);assert.equal(new Set(rows.map(row=>JSON.stringify(row))).size,40)
	assert.ok(rows.every(row=>row.schema==='compact'))
	assert.deepEqual(Array.from(rows.slice(0,8),r=>Number(r.count)),[100,500,1000,2000,3000,4000,5000,10000])
	assert.equal(c.$.$rise_bench_batch('idb','all','full').length,8)
	assert.equal(c.$.$rise_bench_batch('all','100','compact').length,5)
	assert.equal(c.$.$rise_bench_batch('all','all','compact',true).length,5)
})
test('Operation deadline is 300 seconds, not 45; checks do not reset its start',()=>{
	let now=1000;const messages=[]
	const parent={postMessage:m=>messages.push(m)},c=load(['stage/stage.ts'],{Date:{now:()=>now},location:{href:'https://example.test/?rise_fixture=idb&rise_run=token',origin:'https://example.test'},window:{parent}})
	c.$rise_bench_archive={operations:()=>['Создание, с']}
	const run={id:'test',properties:4,bytes:()=>null,metric:()=>null}
	const stage=new c.$.$rise_bench_stage(run,'Создание, с')
	assert.equal(c.$.$rise_bench_stage.limit,300000)
	now+=299999;assert.doesNotThrow(()=>stage.check())
	now++;assert.throws(()=>stage.check(),/300 с/)
	assert.equal(messages.length,1);assert.equal(messages[0].token,'token');assert.equal(messages[0].started,1000)
	const next=new c.$.$rise_bench_stage(run,'Поиск, с');assert.doesNotThrow(()=>next.check())
	assert.equal(c.$.$rise_bench_stage.failure(new Error('database secret-dataset-name')), 'Поиск, с: ошибка выполнения')
	assert.equal(c.$.$rise_bench_stage.failure(new Error('превышен лимит 300 с')), 'Поиск, с: превышен лимит 300 с')
})
