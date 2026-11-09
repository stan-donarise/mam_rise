const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
const vm=require('node:vm')
const ts=require('typescript')
function editor(type,pending){
	const context=vm.createContext({$:{$rise_bench_baza_crdttext:class{}},$giper_baza_rank_read:1,$mol_mem:()=>{},$mol_mem_key:()=>{},$mol_action:()=>{},performance:{getEntriesByType:()=>[{type}]}})
	const source=fs.readFileSync(path.resolve(__dirname,'../crdttext.view.ts'),'utf8')
	vm.runInContext(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,experimentalDecorators:true}}).outputText,context)
	const view=new context.$.$$.$rise_bench_baza_crdttext()
	view.reload_store=()=>({snapshot:{pending}})
	return view
}
test('Text link survives only the measured reload, not fresh navigation or completed F5',()=>{
	assert.equal(editor('navigate',{link:'old-land'}).text_link(),'')
	assert.equal(editor('back_forward',{link:'old-land'}).text_link(),'')
	assert.equal(editor('reload',null).text_link(),'')
	assert.equal(editor('reload',{link:'measured-land'}).text_link(),'measured-land')
	const fresh=editor('navigate',null)
	fresh.text_link('current-land');assert.equal(fresh.text_link(),'current-land')
	fresh.text_link('');assert.equal(fresh.text_link(),'')
})
