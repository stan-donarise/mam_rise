const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
const vm=require('node:vm')
const ts=require('typescript')
const root=path.resolve(__dirname,'../../..'),context=vm.createContext({$:{}})
for(const file of [path.join(root,'../mol/csv/serial/serial.ts'),path.join(root,'bench/csv/csv.ts')]){
	vm.runInContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,context);Object.assign(context,context.$)
}
test('CSV keeps full precision, Unicode, semicolons, quotes and multiline computer information',()=>{
	const csv=context.$.$rise_bench_csv([{time:0.123456789,computer:'CPU "One"; RAM\nWindows',missing:null}],['time','computer','missing'])
	assert.equal(csv,'\uFEFF"time";"computer";"missing"\n"0.123456789";"CPU ""One""; RAM\nWindows";""')
})
test('CSV protects spreadsheet formulas and emits headers even for an empty archive',()=>{
	assert.equal(context.$.$rise_bench_csv([{computer:'=HYPERLINK("bad")'}],['computer']),'\uFEFF"computer"\n"\'=HYPERLINK(""bad"")"')
	assert.equal(context.$.$rise_bench_csv([],['Компьютер','Браузер']),'\uFEFF"Компьютер";"Браузер"')
})
