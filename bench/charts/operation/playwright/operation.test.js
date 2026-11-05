const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
const vm=require('node:vm')
const ts=require('typescript')

function chart(runs){
	const scope={$rise_bench_charts_operation:class{}}
	const context=vm.createContext({$:scope,$mol_mem:()=>{},$rise_bench_run_benchmark_version:'0.5.0',$rise_bench_engine:{idb:{title:'IDB'}},Map})
	const source=fs.readFileSync(path.resolve(__dirname,'../operation.view.ts'),'utf8')
	vm.runInContext(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,experimentalDecorators:true}}).outputText,context)
	const view=new context.$.$$.$rise_bench_charts_operation()
	view.runs=()=>runs;view.operation=()=>'Создание, с'
	return view
}
function run(version,time,count=100,state='Готово'){
	return {benchmark_version:version,engine:'idb',engine_version:'browser',properties:4,computer:'Test PC',browser:'Test browser',count,state:()=>state,metric:()=>time}
}
test('Historical measurements render even without any current-version run',()=>{
	const groups=chart([run('0.3.0',2),run('0.3.0',4),run('0.3.0',8,500)]).groups()
	assert.equal(groups.length,1)
	assert.match(groups[0].title,/v0\.3\.0/)
	assert.equal(JSON.stringify(groups[0].points),'[[100,3],[500,8]]')
})
test('Benchmark versions remain separate; failed and missing measurements stay excluded',()=>{
	const groups=chart([run('0.3.0',2),run('0.5.0',10),run('0.5.0',0,500),run('0.5.0',99,100,'Ошибка'),run('0.3.0',null,500)]).groups()
	assert.equal(groups.length,2)
	assert.equal(JSON.stringify(groups[0].points),'[[100,2]]')
	assert.equal(JSON.stringify(groups[1].points),'[[100,10],[500,0]]')
})
