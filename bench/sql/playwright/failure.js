const assert=require('node:assert/strict')
const {chromium,resultScenario,resultStep}=require('../../playwright/harness')
resultScenario({title:'Ошибка загрузки SQL движка и восстановление запуска',group:'entities'})
async function main(){
	console.log('OWNER',JSON.stringify({pid:process.pid,deadline:60000}))
	const browser=await chromium.launch({headless:true,channel:'chrome'}),deadline=setTimeout(()=>browser.close().catch(()=>{}),60000)
	try{
		const context=await browser.newContext({serviceWorkers:'block',viewport:{width:1600,height:1000}})
		await context.route('https://cdn.jsdelivr.net/npm/@sqlite.org/sqlite-wasm@*/**',route=>route.abort())
		const page=await context.newPage();page.setDefaultTimeout(20000)
		const url=new URL(process.env.RISE_TEST_URL||'http://localhost:9080/rise/app/-/test.html')
		url.searchParams.set('rise_fixture','sqltests');url.hash='!=bench/bench=%24rise_bench_baza_goods/engine=sqlite'
		resultStep('Отказать в загрузке WASM, не превращая прогон в успешный',['$rise_bench_sql_storage.open','$rise_bench_host.accept'])
		await page.goto(url.href,{waitUntil:'domcontentloaded'})
		const run=page.getByRole('button',{name:'Запустить бенчмарк',exact:true});await run.click()
		await page.waitForFunction(()=>{try{return $.$rise_bench_archive.rows('sqlite').some(row=>row.state()==='Ошибка')}catch(e){if(e?.then)return false;throw e}})
		await page.waitForFunction(()=>/ошибк/i.test(document.querySelector('[rise_bench_host_controls_status]').textContent))
		assert.equal(await page.evaluate(()=>$.$rise_app.Root(0).Bench().Goods_host().busy()),false)
		resultStep('Переключиться на IDB и выполнить здоровый прогон',['$rise_bench_host.engine','$rise_bench_idb.benchmark'])
		await page.getByRole('checkbox',{name:'IDB',exact:true}).click()
		await run.click()
		await page.waitForFunction(()=>{try{return $.$rise_bench_archive.rows('idb').some(row=>row.state()==='Готово')}catch(e){if(e?.then)return false;throw e}})
		await page.waitForFunction(()=>$.$rise_app.Root(0).Bench().Goods_host().outbox().length===0)
		await context.close()
	}finally{clearTimeout(deadline);await browser.close()}
}
main().catch(error=>{console.error(error);process.exitCode=1})
