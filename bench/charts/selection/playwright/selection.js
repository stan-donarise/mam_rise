const assert=require('node:assert/strict')
const {chromium,resultScenario,resultStep,screenshot}=require('../../../playwright/harness')
const {openBenchmark}=require('../../../playwright/offline')
resultScenario({title:'Выбор прогонов для графиков',group:'entities'})
async function main(){
	console.log('OWNER',JSON.stringify({pid:process.pid,deadline_ms:120000}))
	const browser=await chromium.launch({channel:'chrome',headless:true})
	const deadline=setTimeout(()=>browser.close().catch(()=>{}),120000)
	try{
		const page=await browser.newPage({viewport:{width:1600,height:1000}});page.setDefaultTimeout(20000)
		const url=new URL(process.env.RISE_TEST_URL||'http://localhost:9080/rise/app/-/test.html')
		url.searchParams.set('rise_fixture','sqltests');url.hash='!=bench/bench=%24rise_bench_baza_goods/engine=idb'
		await openBenchmark(page,url.href)
		resultStep('Создать двенадцать реальных прогонов',['$rise_bench_host.run'])
		for(let n=1;n<=12;n++){
			await page.waitForFunction(()=>$.$rise_app.Root(0).Bench().Goods_host().run_enabled())
			await page.getByRole('button',{name:'Запустить бенчмарк',exact:true}).click()
			try{await page.waitForFunction(n=>{const h=$.$rise_app.Root(0).Bench().Goods_host();return !h.busy()&&h.runs().length===n&&h.outbox().length===0},n)}
			catch(error){console.log('RUN_DIAGNOSTIC',await page.evaluate(()=>{const h=$.$rise_app.Root(0).Bench().Goods_host();return {busy:h.busy(),status:h.status(),count:h.runs().length,outbox:h.outbox().length}}));throw error}
		}
		await page.getByRole('checkbox',{name:'Графики',exact:true}).click()
		const trigger=()=>page.getByRole('checkbox',{name:/^Выбранные \(/})
		const selected=()=>page.evaluate(()=>$.$rise_app.Root(0).Bench().Goods_host().Charts().selected_runs().map(r=>r.id))
		const expected=await page.evaluate(()=>$.$rise_app.Root(0).Bench().Goods_host().runs().slice(0,10).map(r=>r.id))
		await trigger().filter({hasText:'Выбранные (10)'}).waitFor();assert.deepEqual(await selected(),expected)
		resultStep('Изменить выбор и сохранить его при переключении вида',['$rise_bench_charts_selection.checked','$rise_bench_host.chart_selection'])
		await trigger().click()
		const list=page.locator('[rise_bench_charts_selection_list]')
		assert.equal(await list.getByRole('checkbox').count(),12)
		await list.getByRole('checkbox').first().click();assert.equal((await selected()).length,9)
		await list.getByRole('checkbox').last().click();const changed=await selected();assert.equal(changed.length,10);assert.notDeepEqual(changed,expected)
		await page.evaluate(()=>Promise.all(document.getAnimations().map(animation=>animation.finished.catch(()=>{}))))
		console.log('POPUP',await screenshot(page,'chart-selection-popup.png'))
		await page.keyboard.press('Escape');await list.waitFor({state:'hidden'})
		await page.getByRole('checkbox',{name:'Таблица',exact:true}).click();await page.locator('[rise_bench_metrics_table]').waitFor()
		await page.getByRole('checkbox',{name:'Графики',exact:true}).click();await trigger().waitFor();assert.deepEqual(await selected(),changed)
		resultStep('Очистить выбор и сбросить к последним десяти',['$rise_bench_charts_selection.reset','$rise_bench_charts.selected_runs'])
		await trigger().click()
		for(let i=0;i<12;i++){const check=list.getByRole('checkbox').nth(i);if(await check.getAttribute('aria-checked')==='true')await check.click()}
		assert.deepEqual(await selected(),[]);assert.equal(await page.locator('[rise_bench_charts_operation_plot]').count(),0)
		await list.getByRole('button',{name:'Сбросить',exact:true}).click();assert.deepEqual(await selected(),expected)
		await page.getByRole('checkbox',{name:'Таблица',exact:true}).click();await list.waitFor({state:'hidden'})
		await page.getByRole('checkbox',{name:'Графики',exact:true}).click()
		await page.setViewportSize({width:390,height:900});await page.evaluate(()=>document.documentElement.setAttribute('mol_theme','$mol_theme_light'))
		await trigger().click();await page.evaluate(()=>Promise.all(document.getAnimations().map(animation=>animation.finished.catch(()=>{}))))
		console.log('NARROW',await screenshot(page,'chart-selection-narrow.png'))
		await page.keyboard.press('Escape');await list.waitFor({state:'hidden'})
		console.log('CHART_SELECTION_PASS',JSON.stringify({runs:12,defaultSelected:10,retainedAcrossModes:true,reset:true}))
	}finally{clearTimeout(deadline);await browser.close()}
}
main().catch(error=>{console.error(error);process.exitCode=1})
