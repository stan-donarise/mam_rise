const assert = require('node:assert/strict')
const {chromium,resultScenario,resultStep,screenshot}=require('../../playwright/harness')
const {openBenchmark}=require('../../playwright/offline')
resultScenario({title:'SQL движки: общие карточки, операции и настоящий F5',group:'entities'})
async function main(){
	console.log('OWNER',JSON.stringify({pid:process.pid,deadline:360000}))
	const browser=await chromium.launch({headless:true,channel:'chrome'})
	const deadline=setTimeout(()=>browser.close().catch(()=>{}),360000)
	let built
	try{
		if(process.env.RISE_TEST_BUILT==='1')built=await require('../../playwright/built').serveBuilt()
		const context=await browser.newContext({viewport:{width:1600,height:1000}})
		const page=await context.newPage();page.setDefaultTimeout(90000)
		const errors=[];page.on('pageerror',error=>errors.push(error.message))
		await page.addInitScript(()=>window.addEventListener('message',event=>{if(event.data?.type==='rise-bench-state'&&event.data.error)console.error('FIXTURE_ERROR',event.data.error)}))
		page.on('console',message=>{if(/Different (host|args|task) on restart|Audit fail/.test(message.text()))errors.push(message.text())})
		const url=new URL(built?.url||process.env.RISE_TEST_URL||'http://localhost:9080/rise/app/-/test.html')
		const count=Number(process.env.RISE_SQL_COUNT||100)
		url.searchParams.set('rise_fixture','sqltests') // Fully offline parent and real archive, not raw fixture catalogue.
		url.hash='!=bench/bench=%24rise_bench_baza_goods/count='+count
		await openBenchmark(page,url.href)
		const engines=[['sqlite','SQLite'],['pglite','PGlite'],['duckdb','DuckDB'],['idb','IDB'],['goods','Гипербаза']].filter(([kind])=>!process.env.RISE_SQL_ENGINE||process.env.RISE_SQL_ENGINE.split(',').includes(kind))
		assert.ok(engines.length,'Unknown RISE_SQL_ENGINE')
		let selected='Гипербаза'
		for(const [engine,label] of engines){
			resultStep(`Выбрать ${label} и прогнать ${count} записей`,['$rise_bench_host.engine','$rise_bench_sql_storage.create','$rise_bench_idb.resume_reload'])
			if(selected!==label){await page.getByRole('checkbox',{name:selected,exact:true}).click();await page.getByRole('checkbox',{name:label,exact:true}).click()}
			selected=label
			const frame=await page.locator('iframe').elementHandle().then(element=>element.contentFrame())
			await frame.waitForFunction(engine=>globalThis.$?.$rise_app.Root(0).fixture_kind()===engine,engine)
			const run=page.getByRole('button',{name:'Запустить бенчмарк',exact:true})
			await page.waitForFunction(()=>!document.querySelector('[rise_bench_host_controls_run]')?.hasAttribute('disabled'))
			assert.equal(await frame.getByRole('button',{name:'Запустить бенчмарк',exact:true}).count(),0)
			await run.click()
			try{await page.waitForFunction(engine=>{try{return $.$rise_bench_archive.rows(engine).some(row=>['Готово','Ошибка'].includes(row.state()))}catch(e){if(e?.then)return false;throw e}},engine)}
			catch(error){console.log('FAILED',await page.evaluate(()=>({text:document.body.innerText.slice(0,2400),frames:[...document.querySelectorAll('iframe')].map(frame=>frame.contentDocument?.body.innerText.slice(0,2400))})));throw error}
			const data=await frame.evaluate(()=>{
				const bench=$.$rise_app.Root(0).fixture(),row=bench.Metrics().runs()[0]
				return {engine:row.engine,version:row.engine_version,state:row.state(),count:bench.products().length,metrics:bench.Metrics().operations().map(name=>row.metric(name)),masters:$.$giper_baza_yard.masters()}
			})
			assert.equal(data.engine,engine);assert.equal(data.state,'Готово');assert.equal(data.count,count+1)
			const mounted=await frame.locator('[rise_bench_baza_goods_table_row]').count();assert.ok(mounted>0&&mounted<30)
			assert.deepEqual(data.masters,[]);assert.ok(data.metrics.every(time=>Number.isFinite(time)&&time>=0))
			console.log('RESULT',JSON.stringify(data))
			if(engine==='goods')continue
			resultStep(`${label}: поиск, ручное добавление и сброс`,['$rise_bench_idb.add_one','$rise_bench_idb.reset'])
			const search=frame.getByRole('textbox',{name:'Название товара',exact:true})
			await search.fill('Notebook 00000')
			await frame.waitForFunction(()=>$.$rise_app.Root(0).fixture().Table().rows().length===1)
			await frame.locator('[mol_search_clear]').click()
			await frame.getByRole('button',{name:'Добавить запись',exact:true}).click()
			await frame.waitForFunction(count=>{try{return $.$rise_app.Root(0).fixture().products().length===count+2}catch(e){if(e?.then)return false;throw e}},count)
			await screenshot(page,`sql-${engine}.png`)
			await frame.getByRole('button',{name:'Очистить',exact:true}).click()
			await frame.waitForFunction(()=>{try{return $.$rise_app.Root(0).fixture().products().length===0}catch(e){if(e?.then)return false;throw e}})
			if(['sqlite','pglite','duckdb','idb'].includes(engine)){
				resultStep(`${label}: десять полей, редактирование и повторный F5`,['$rise_bench_sql_storage.change','$rise_bench_sql_storage.rows'])
				await page.getByRole('checkbox',{name:'4 свойства',exact:true}).click()
				await page.getByRole('checkbox',{name:'10 свойств',exact:true}).click()
				await page.waitForFunction(()=>!document.querySelector('[rise_bench_host_controls_run]')?.hasAttribute('disabled'))
				const before=await page.evaluate(engine=>$.$rise_bench_archive.rows(engine).map(row=>row.id),engine)
				await run.click()
				await page.waitForFunction(({engine,before})=>{try{return $.$rise_bench_archive.rows(engine).some(row=>!before.includes(row.id)&&['Готово','Ошибка'].includes(row.state()))}catch(e){if(e?.then)return false;throw e}},{engine,before})
				const child=await page.locator('iframe').elementHandle().then(element=>element.contentFrame())
				assert.equal(await child.evaluate(()=>$.$rise_app.Root(0).fixture().Metrics().runs()[0].state()),'Готово')
				const product=await child.evaluate(count=>$.$rise_app.Root(0).fixture().products()[count],count)
				assert.equal(product.id,String(count).padStart(5,'0'));assert.equal(product.quantity,count%100);assert.equal(product.checked,false);assert.equal(product.tags.length,5)
				await child.locator('[mol_list_demo_table_quantity] input').first().fill('42')
				await child.locator('[mol_list_demo_table_quantity] input').first().press('Tab')
				try{await child.waitForFunction(count=>{try{return $.$rise_app.Root(0).fixture().products()[count].quantity===42}catch(e){if(e?.then)return false;throw e}},count,{timeout:5000})}
				catch(error){console.log('EDIT_FAILED',await child.evaluate(()=>({inputs:[...document.querySelectorAll('[mol_list_demo_table_quantity] input')].map(input=>({id:input.id,value:input.value})),changed:$.$rise_app.Root(0).fixture().products().filter(p=>p.quantity===42)})));throw error}
				await child.goto(child.url(),{waitUntil:'domcontentloaded'})
				await child.waitForFunction(count=>{try{return globalThis.$?.$rise_app.Root(0).fixture().products()[count]?.quantity===42}catch(e){if(e?.then)return false;throw e}},count)
				await screenshot(page,`sql-${engine}-full.png`)
				await page.getByRole('checkbox',{name:'10 свойств',exact:true}).click()
				await page.getByRole('checkbox',{name:'4 свойства',exact:true}).click()
			}
		}
		assert.deepEqual(errors,[])
		resultStep('Общая таблица и графики пяти движков',['$rise_bench_metrics.records','$rise_bench_charts_operation.groups'])
		const titles=await page.evaluate(()=>$.$rise_app.Root(0).Bench().Goods_host().Metrics().records().map(row=>row['Хранилище']))
		for(const [,title] of engines)assert.ok(titles.includes(title))
		await page.getByRole('checkbox',{name:'Графики',exact:true}).click()
		await screenshot(page,'sql-charts.png')
		await context.close()
	}finally{clearTimeout(deadline);await browser.close();await built?.close()}
}
main().catch(error=>{console.error(error);process.exitCode=1})
