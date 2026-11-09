const assert=require('node:assert/strict')
const {chromium,resultScenario,resultStep,screenshot}=require('../../bench/playwright/harness')
resultScenario({title:'Демо, тема, код и небольшие наборы бенчмарка',group:'entities'})
async function main(){
	console.log('OWNER',JSON.stringify({pid:process.pid,deadline_ms:240000}))
	const browser=await chromium.launch({channel:'chrome',headless:true}),deadline=setTimeout(()=>browser.close().catch(()=>{}),240000)
	try{
		const page=await browser.newPage({viewport:{width:1600,height:1000},serviceWorkers:'block'});page.setDefaultTimeout(30000)
		const url=new URL(process.env.RISE_TEST_URL||'http://localhost:9080/rise/app/-/test.html');url.searchParams.set('rise_fixture','sqltests');url.hash='!=demo'
		await page.goto(url.href,{waitUntil:'domcontentloaded'})
		resultStep('Открыть Demo без обёртки результатов',['$rise_app.Demo'])
		await page.locator('[rise_demo]').waitFor();assert.equal(await page.getByText('Результаты',{exact:true}).count(),0);assert.equal(await page.locator('iframe').count(),0)
		console.log('DEMO',await screenshot(page,'demo-direct.png'))
		await page.getByRole('link',{name:'Bench',exact:true}).click();await page.getByRole('link',{name:'Сущности',exact:true}).click()
		const engines=page.locator('[rise_bench_host_controls_engine]'),counts=page.locator('[rise_bench_host_controls_count]')
		const link=page.getByRole('link',{name:'Код',exact:true})
		const setEngines=async(labels)=>{
			const all=engines.getByRole('checkbox',{name:'Все',exact:true})
			if(await all.getAttribute('aria-checked')!=='true')await all.click()
			await all.click()
			for(const label of labels)await engines.getByRole('checkbox',{name:label,exact:true}).click()
		}
		resultStep('Проверить ссылки на исходники каждого хранилища',['$rise_bench_host_controls.source_uri'])
		for(const [labels,path] of [
			[['Гипербаза'],'baza/goods/goods.view.ts'],[['IDB'],'idb/idb.view.ts'],[['SQLite'],'sql/sqlite/sqlite.ts'],[['PGlite'],'sql/pglite/pglite.ts'],[['DuckDB'],'sql/duckdb/duckdb.ts'],[['IDB','Гипербаза'],'baza/goods/goods.view.ts'],
		]){await setEngines(labels);await page.waitForFunction(path=>document.querySelector('[rise_bench_host_controls_intro] a')?.href.endsWith(path),path);assert.ok((await link.getAttribute('href')).endsWith(path))}
		resultStep('Переключить тему и проверить оба логотипа',['$rise_app.Lights','$rise_bench_host_controls_support.logo_uri'])
		const logo=page.locator('[rise_bench_host_controls_support_logo]'),lights=page.locator('[rise_app_lights]')
		for(const theme of ['$mol_theme_dark','$mol_theme_light']){
			if(await page.locator('[rise_app]').first().getAttribute('mol_theme')!==theme)await lights.click()
			await page.waitForFunction(theme=>document.querySelector('[rise_app]').getAttribute('mol_theme')===theme,theme)
			await logo.scrollIntoViewIfNeeded();await page.waitForFunction(()=>{const img=document.querySelector('[rise_bench_host_controls_support_logo]');return img.complete&&img.naturalWidth>0})
			assert.ok((await logo.getAttribute('src')).endsWith(theme.endsWith('light')?'foot_logo_dark.png':'foot_logo_light.png'))
			console.log('THEME',await screenshot(page,theme.endsWith('light')?'benchmark-light.png':'benchmark-dark.png'))
		}
		resultStep('Прогнать все пять хранилищ по 1 и 10 записей',['$rise_bench_batch','$rise_bench_host.run'])
		await setEngines(['Гипербаза','IDB','SQLite','PGlite','DuckDB'])
		await counts.getByRole('checkbox',{name:'100',exact:true}).click();await counts.getByRole('checkbox',{name:'1',exact:true}).click();await counts.getByRole('checkbox',{name:'10',exact:true}).click()
		await page.waitForFunction(()=>$.$rise_app.Root(0).Bench().Goods_host().run_enabled())
		await page.getByRole('button',{name:'Запустить бенчмарк',exact:true}).click()
		await page.waitForFunction(()=>{const h=$.$rise_app.Root(0).Bench().Goods_host();return !h.busy()&&h.runs().length===10&&h.outbox().length===0},null,{timeout:150000})
		const rows=await page.evaluate(()=>$.$rise_app.Root(0).Bench().Goods_host().runs().map(r=>({engine:r.engine,count:r.count,state:r.state(),error:r.failure()})))
		assert.ok(rows.every(r=>r.state==='Готово'),JSON.stringify(rows));assert.equal(new Set(rows.map(r=>r.engine+':'+r.count)).size,10);assert.ok(rows.every(r=>[1,10].includes(r.count)))
		await page.setViewportSize({width:390,height:900});await logo.scrollIntoViewIfNeeded();console.log('NARROW',await screenshot(page,'benchmark-narrow.png'))
		console.log('BENCHMARK_UI_PASS',JSON.stringify({demoDirect:true,themes:2,sourceLinks:6,smallRuns:rows}))
	}finally{clearTimeout(deadline);await browser.close()}
}
main().catch(error=>{console.error(error);process.exitCode=1})
