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
		resultStep('Создать пятьдесят два реальных прогона',['$rise_bench_host.run'])
		for(let n=1;n<=52;n++){
			await page.waitForFunction(()=>$.$rise_app.Root(0).Bench().Goods_host().run_enabled())
			await page.getByRole('button',{name:'Запустить бенчмарк',exact:true}).click()
			try{await page.waitForFunction(n=>{const h=$.$rise_app.Root(0).Bench().Goods_host();return !h.busy()&&h.runs().length===n&&h.outbox().length===0},n)}
			catch(error){console.log('RUN_DIAGNOSTIC',await page.evaluate(()=>{const h=$.$rise_app.Root(0).Bench().Goods_host();return {busy:h.busy(),status:h.status(),count:h.runs().length,outbox:h.outbox().length}}));throw error}
		}
		await page.getByRole('checkbox',{name:'Графики',exact:true}).click()
		const trigger=()=>page.getByRole('checkbox',{name:/^Прогоны \(/})
		const selected=()=>page.evaluate(()=>$.$rise_app.Root(0).Bench().Goods_host().Charts().selected_runs().map(r=>r.id))
		const expected=await page.evaluate(()=>$.$rise_app.Root(0).Bench().Goods_host().runs().slice(0,20).map(r=>r.id))
		await trigger().filter({hasText:'Прогоны (20)'}).waitFor();assert.deepEqual(await selected(),expected)
		resultStep('Изменить выбор и сохранить его при переключении вида',['$rise_bench_charts_selection.checked','$rise_bench_host.chart_selection'])
		await trigger().click()
		const list=page.locator('[rise_bench_charts_selection_list]')
		assert.equal(await page.evaluate(()=>$.$rise_app.Root(0).Bench().Goods_host().Charts().Selection().runs().length),52)
		assert.ok(await list.getByRole('checkbox').count()>0,'Visible checkboxes are mounted; the rest are virtualized')
		await list.getByRole('checkbox').first().click();assert.equal((await selected()).length,19)
		await list.getByRole('checkbox').nth(20).click();const changed=await selected();assert.equal(changed.length,20);assert.notDeepEqual(changed,expected)
		await list.getByRole('checkbox').first().scrollIntoViewIfNeeded()
		await page.evaluate(()=>Promise.all(document.getAnimations().map(animation=>animation.finished.catch(()=>{}))))
		console.log('POPUP',await screenshot(page,'chart-selection-popup.png'))
		await page.keyboard.press('Escape');await list.waitFor({state:'hidden'})
		await page.getByRole('checkbox',{name:'Таблица',exact:true}).click();await page.locator('[rise_bench_metrics_table]').waitFor()
		await page.getByRole('checkbox',{name:'Графики',exact:true}).click();await trigger().waitFor();assert.deepEqual(await selected(),changed)
		resultStep('Выбрать последние 0, 10, 20, 30 и 50 прогонов',['$rise_bench_charts_selection.select_latest','$rise_bench_charts.selected_runs'])
		await trigger().click()
		for(const count of [0,10,20,30,50]){
			await list.getByRole('button',{name:String(count),exact:true}).click()
			const latest=await page.evaluate(count=>$.$rise_app.Root(0).Bench().Goods_host().runs().slice(0,count).map(r=>r.id),count)
			assert.deepEqual(await selected(),latest)
			if(count===0)assert.equal(await page.locator('[rise_bench_charts_operation_plot]').count(),0)
		}
		await list.getByRole('button',{name:'20',exact:true}).click();assert.deepEqual(await selected(),expected)
		await page.getByRole('checkbox',{name:'Таблица',exact:true}).click();await list.waitFor({state:'hidden'})
		await page.getByRole('checkbox',{name:'Графики',exact:true}).click()
		await page.setViewportSize({width:390,height:900});await page.evaluate(()=>document.documentElement.setAttribute('mol_theme','$mol_theme_light'))
		await trigger().click();await page.evaluate(()=>Promise.all(document.getAnimations().map(animation=>animation.finished.catch(()=>{}))))
		const tops=await list.getByRole('button').evaluateAll(nodes=>nodes.map(node=>Math.round(node.getBoundingClientRect().top)))
		assert.equal(new Set(tops).size,1,'Five preset buttons must stay on one line')
		console.log('NARROW',await screenshot(page,'chart-selection-narrow.png'))
		await page.keyboard.press('Escape');await list.waitFor({state:'hidden'})
		console.log('CHART_SELECTION_PASS',JSON.stringify({runs:52,defaultSelected:20,retainedAcrossModes:true,presets:[0,10,20,30,50]}))
	}finally{clearTimeout(deadline);await browser.close()}
}
main().catch(error=>{console.error(error);process.exitCode=1})
