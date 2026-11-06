const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
const vm=require('node:vm')
const ts=require('typescript')
function fixture(){
	const parent={},window={parent},origin='https://example.test',scope={$mol_object:class{}}
	let calls=0,cancellations=0,active=null,listener
	const context=vm.createContext({$:scope,$mol_object:scope.$mol_object,$mol_mem:()=>{},$mol_action:()=>{},$mol_style_attach:()=>{},window,location:{origin},URL,Set,
		$mol_dom_listener:class{constructor(node,type,callback){listener=callback}},
		$mol_wire_async:host=>({receive:event=>{if(active)cancellations++;calls++;active=event.data.id;return new Promise(()=>{})}}),
	})
	vm.runInContext(ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'../fixture.web.ts'),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,experimentalDecorators:true}}).outputText,context)
	const instance=new context.$.$$.$rise_bench_fixture('goods',{})
	instance.active=()=>active
	instance.listener()
	const command={origin,source:parent,data:{type:'rise-bench-command',kind:'goods',id:'run-one',command:'run',data:{count:'100',schema:'compact'}}}
	return {instance,command,dispatch:event=>listener(event),state:()=>({calls,cancellations}),idle:()=>{active=null}}
}
test('Foreign messages are rejected before entering the cancelling async wrapper',()=>{
	const f=fixture();f.dispatch(f.command)
	for(const event of [
		{...f.command,source:{}},
		{...f.command,origin:'https://other.test'},
		{...f.command,data:{type:'unrelated'}},
		{...f.command,data:{...f.command.data,kind:'idb'}},
	])f.dispatch(event)
	assert.deepEqual(f.state(),{calls:1,cancellations:0})
})
test('Duplicate and concurrent commands cannot cancel the active run or replay a completed one',()=>{
	const f=fixture();f.dispatch(f.command);f.dispatch(f.command)
	f.dispatch({...f.command,data:{...f.command.data,id:'run-two'}})
	assert.deepEqual(f.state(),{calls:1,cancellations:0})
	f.idle();f.instance.completed.add('run-one');f.dispatch(f.command)
	assert.deepEqual(f.state(),{calls:1,cancellations:0})
	f.dispatch({...f.command,data:{...f.command.data,id:'run-two'}})
	assert.deepEqual(f.state(),{calls:2,cancellations:0})
})
