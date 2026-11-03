const assert=require('node:assert/strict')
const {chromium,resultScenario,resultStep,resultBenchmarkValue,screenshot,closeTestContext}=require('../../playwright/harness')
const {openBenchmark}=require('../../playwright/offline')
resultScenario({title:'IDB: 10 000 карточек, F5 и раздельные наборы',group:'entities'})
async function main(){
	const browser=await chromium.launch({headless:true,channel:'chrome'}),deadline=setTimeout(()=>browser.close().catch(()=>{}),60000)
	let context
	try{
		context=await browser.newContext({viewport:{width:1600,height:1000}});const page=await context.newPage();page.setDefaultTimeout(15000)
		const errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(/Different (host|args|task) on restart/.test(message.text()))errors.push(message.text())})
		const url=new URL(process.env.RISE_ARCHIVE_URL||'http://localhost:9080/rise/app/-/test.html');url.hash='!=bench/bench=%24rise_bench_baza_goods/engine=idb/count=10000'
		await openBenchmark(page,url.href)
		resultStep('Запустить настоящий прогон на 10 000 записей',['$rise_bench_idb.benchmark','$rise_bench_baza_goods_rows.sub_visible'])
		const run=page.getByRole('button',{name:'Запустить бенчмарк',exact:true});await run.click()
		await page.waitForFunction(()=>{try{return $.$rise_bench_archive.rows('idb').some(row=>row.count===10000&&row.state()==='Готово')}catch(error){if(error?.then)return false;throw error}})
		let child=await page.locator('iframe').elementHandle().then(node=>node.contentFrame())
		const snapshot=async()=>child.evaluate(()=>$.$mol_wire_async(()=>({total:$.$rise_app.Root(0).Bench().Idb().Table().rows().length,dom:document.querySelectorAll('[rise_bench_baza_goods_table_row]').length}))())
		let state=await snapshot();assert.equal(state.total,10001);assert.ok(state.dom>0&&state.dom<30,JSON.stringify(state))
		await screenshot(page,'idb-large.png')
		resultStep('Найти первую запись полного набора',['$rise_bench_baza_goods_table.rows'])
		await child.getByRole('textbox',{name:'Название товара',exact:true}).fill('Notebook 00000')
		await child.getByText('Aurora Wireless Notebook 00000',{exact:true}).waitFor()
		await child.locator('[mol_search_clear]').click()
		const title=await child.evaluate(()=>$.$rise_bench_product_name(10000));await child.getByText(title,{exact:true}).waitFor()
		resultStep('Открыть сохранённые 10 000 после F5',['$rise_bench_idb.dataset_name'])
		const started=Date.now();await page.reload({waitUntil:'domcontentloaded'})
		await page.locator('iframe').waitFor();child=await page.locator('iframe').elementHandle().then(node=>node.contentFrame())
		await child.getByText(title,{exact:true}).waitFor();const reopened=Date.now()-started
		state=await snapshot();assert.equal(state.total,10001);assert.ok(state.dom<30)
		resultBenchmarkValue('Открытие сохранённого набора после F5',reopened,'ms')
		resultStep('Сменить количество без подстановки старых 10 000',['$rise_bench_idb.dataset_name'])
		await page.getByRole('checkbox',{name:'100',exact:true}).click()
		await child.waitForFunction(()=>{try{const app=$.$rise_app.Root(0).Bench().Idb();return app.count_mode()==='100'&&app.products().length===0}catch(error){if(error?.then)return false;throw error}})
		await page.getByRole('checkbox',{name:'10000',exact:true}).click()
		await child.getByText(title,{exact:true}).waitFor()
		assert.deepEqual(errors,[]);console.log('LARGE_PASS',JSON.stringify({reopen_ms:reopened,...state}))
	}finally{clearTimeout(deadline);try{if(context)await closeTestContext(context)}finally{await browser.close()}}
}
main().catch(error=>{console.error(error);process.exitCode=1})
