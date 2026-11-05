const assert = require('node:assert/strict')
const {chromium,resultScenario,resultStep,resultBenchmark,screenshot,closeTestContext}=require('../../playwright/harness')
const {openBenchmark}=require('../../playwright/offline')
resultScenario({title:'Общие результаты Rise и изолированные нагрузки',group:'entities'})
async function measurements(page,completed){
	return page.evaluate(completed=>completed.map(({kind,id})=>{
		const run=$.$rise_bench_archive.rows(kind).find(row=>row.id===id)
		return {kind,id,state:run.state(),failure:run.failure(),bytes:run.bytes(),metrics:Object.fromEntries($.$rise_bench_archive.operations(kind).map(name=>[name,run.metric(name)]))}
	}),completed)
}
async function watchFilters(child,method){
	await child.evaluate(method=>{
		const bench=$.$rise_app.Root(0).Bench()[method]();const nodes=[bench.Search_label().dom_node(),bench.Color_label().dom_node(),bench.Status_label().dom_node()]
		const changes=[];const observer=new MutationObserver(records=>{for(const record of records)if(changes.length<50)changes.push(record.attributeName)})
		for(const node of nodes)observer.observe(node,{subtree:true,attributes:true,attributeFilter:['disabled','placeholder','mol_view_error']})
		window.riseFilterWatch={nodes,changes,observer}
	},method)
}
async function checkFilters(child){
	const state=await child.evaluate(()=>{const watch=window.riseFilterWatch;watch.observer.disconnect();delete window.riseFilterWatch;return{connected:watch.nodes.every(node=>node.isConnected),changes:watch.changes}})
	assert.equal(state.connected,true);assert.deepEqual(state.changes,[],'Adding a record must not disable or suspend the filter panel')
}
async function main(){
	const browser=await chromium.launch({headless:true,channel:'chrome'})
	const deadline=setTimeout(()=>browser.close().catch(()=>{}),180000)
	const contexts=[]
	try{
		const context=await browser.newContext({viewport:{width:1600,height:1000}});contexts.push(context)
		const page=await context.newPage();page.setDefaultTimeout(60000)
		const errors=[];page.on('pageerror',e=>errors.push(e.message))
		page.on('console',message=>{if(/Different (host|args|task) on restart/.test(message.text()))errors.push(message.text())})
		const packets=[]
		page.on('websocket',socket=>socket.on('framesent',frame=>{if(Buffer.isBuffer(frame.payload))packets.push([...frame.payload])}))
		const url=process.env.RISE_ARCHIVE_URL||'http://localhost:9080/rise/app/-/test.html'
		const local=new URL(url).hostname==='localhost'
		const sockets=[];page.on('websocket',socket=>sockets.push(socket.url()))
		resultStep('Открыть каталог и публичную таблицу',['$rise_bench_host.fixture_uri','$rise_bench_archive.root'])
		await openBenchmark(page,url)
		await page.getByRole('link',{name:'Bench',exact:true}).click()
		const completed=[]
		let selected=''
		assert.equal(await page.getByRole('link',{name:'Сущности IDB',exact:true}).count(),0)
		for(const [label,kind,method] of [['Сущности','goods','Goods'],['Сущности','idb','Idb'],['Текст','text','Crdttext']]){
			resultStep(`Прогнать ${label} и дождаться iframe F5`,['$rise_bench_reload.save','$rise_bench_host.accept','$rise_bench_archive.save'])
			if(selected!==label)await page.getByRole('link',{name:label,exact:true}).click()
			selected=label
			const runButton=page.getByRole('button',{name:'Запустить бенчмарк',exact:true})
			await runButton.waitFor();await page.waitForFunction(()=>!document.querySelector('[rise_bench_host_controls_run]')?.hasAttribute('disabled'))
			if(kind==='idb')await page.getByRole('checkbox',{name:'IDB',exact:true}).click()
			if(kind==='goods')await page.getByRole('checkbox',{name:'Гипербаза',exact:true}).click()
			await page.waitForFunction(()=>!document.querySelector('[rise_bench_host_controls_run]')?.hasAttribute('disabled'))
			await page.getByRole('textbox',{name:'Процессор, память, ОС',exact:true}).fill('Rise test computer\nCPU / RAM / OS')
			const element=page.locator('iframe');await element.waitFor()
			const child=await element.elementHandle().then(e=>e.contentFrame())
			await child.waitForFunction(kind=>globalThis.$?.$rise_app.Root(0).fixture_kind()===kind,kind)
			assert.equal(await child.getByRole('button',{name:'Запустить бенчмарк',exact:true}).count(),0)
			assert.equal(await child.locator('[rise_bench_baza_goods_settings],[rise_bench_idb_settings],[rise_bench_baza_crdttext_menu]').count(),0)
			assert.deepEqual(await child.evaluate(()=>$.$giper_baza_yard.masters()),[])
			let id
			let reloads=0;const onFrame=frame=>{if(frame===child)++reloads};page.on('framenavigated',onFrame)
			await resultBenchmark(`${label}: полный прогон`,async()=>{
				await runButton.click()
				const handle=await child.waitForFunction(method=>globalThis.$?.$rise_app.Root(0).Bench()[method]().Metrics().runs()[0]?.id,method)
				id=await handle.jsonValue();await handle.dispose()
				try { await page.waitForFunction(({kind,id})=>{try{return $.$rise_bench_archive.rows(kind).some(r=>r.id===id&&r.state()==='Готово')}catch(e){if(e?.then)return false;throw e}},{kind,id}) }
				catch(error){
					console.log('FAILED_CHILD',await child.evaluate(method=>({runs:$.$rise_app.Root(0).Bench()[method]().Metrics().runs().map(r=>({id:r.id,state:r.state()})),text:document.body.innerText.slice(0,2000)}),method))
					await screenshot(page,'archive-failure.png');throw error
				}
			})
			page.off('framenavigated',onFrame);assert.ok(reloads>=1,'Real iframe reload')
			const run=await page.evaluate(({kind,id})=>{
				const r=$.$rise_bench_archive.rows(kind).find(r=>r.id===id)
				return {kind,id:r.id,count:r.count,baza:r.baza_version,version:r.benchmark_version,state:r.state(),computer:r.computer,browser:r.browser,bytes:r.bytes()}
			},{kind,id})
			assert.equal(run.count,100);assert.equal(run.version,'0.5.0');assert.equal(run.state,'Готово')
			assert.equal(run.computer,'Rise test computer\nCPU / RAM / OS');assert.ok(run.browser.includes('Chrome'))
			assert.equal(run.baza,kind==='idb'?'—':'2e6100b225c8d4fb3a5b5d14e8568223e8a8c785');completed.push(run)
			const boundary=await child.evaluate(({method,kind})=>$.$mol_wire_async(()=>{
				const app=$.$rise_app.Root(0).Bench()[method]()
				return {masters:$.$giper_baza_yard.masters(),db:$.$mol_wire_sync($.$rise_storage).db().native?.name,
					lands:[...$.$giper_baza_glob.lands_touched],records:kind==='goods'?app.products().length:kind==='text'?app.text().startsWith('!Строка 1:'):$.$mol_wire_sync(app.storage()).count(),
					}
			})(),{method,kind})
			assert.deepEqual(boundary.masters,[]);assert.equal(boundary.records,kind==='text'?true:101)
			assert.equal(boundary.db,'$rise_workload_'+kind)
			if(kind==='text'){
				const bytes=await child.evaluate(()=>new TextEncoder().encode($.$rise_app.Root(0).Bench().Crdttext().text()).byteLength)
				assert.equal(run.bytes,bytes)
				const columns=await page.evaluate(()=>$.$rise_app.Root(0).Bench().Text_host().Metrics().col_ids())
				assert.ok(columns.includes('Строк')&&columns.includes('Размер, КБ')&&!columns.includes('Полей')&&columns.includes('Состояние'))
			}
			const parentLands=await page.evaluate(()=>[...$.$giper_baza_glob.lands_touched])
			assert.ok(boundary.lands.every(id=>!parentLands.includes(id)),'No workload Land in online parent')
			await screenshot(page,`archive-${kind}.png`)
			if(kind==='goods'){
				await child.getByText('Aurora Compact Notebook 00100',{exact:true}).waitFor()
				resultStep('Проверить фильтры и действия внутри iframe без новых строк истории',['$rise_bench_baza_goods.Manual'])
				const before=await page.evaluate(()=>$.$rise_bench_archive.rows('goods').length)
				assert.equal(await page.getByRole('button',{name:'Добавить запись',exact:true}).count(),0)
				const search=child.getByRole('textbox',{name:'Название товара',exact:true})
				await search.fill('Notebook 00000')
				await child.waitForFunction(()=>{try{return $.$rise_app.Root(0).Bench().Goods().Table().rows().length===1}catch(error){if(error?.then)return false;throw error}})
				await child.locator('[mol_search_clear]').click()
				await child.getByText('Aurora Compact Notebook 00100',{exact:true}).waitFor()
				await watchFilters(child,'Goods')
				await child.getByRole('button',{name:'Добавить запись',exact:true}).click()
				await child.waitForFunction(()=>$.$rise_app.Root(0).Bench().Goods().products().length===102)
				await page.waitForFunction(()=>!document.querySelector('[rise_bench_host_controls_run]').hasAttribute('disabled'))
				await checkFilters(child)
				await child.getByRole('button',{name:'Очистить',exact:true}).click()
				await child.waitForFunction(()=>$.$rise_app.Root(0).Bench().Goods().products().length===0)
				await page.waitForFunction(()=>!document.querySelector('[rise_bench_host_controls_run]').hasAttribute('disabled'))
				assert.equal(await page.evaluate(()=>$.$rise_bench_archive.rows('goods').length),before)
				for(const count of ['500','100']){
					await page.getByRole('checkbox',{name:count,exact:true}).click()
					await child.waitForFunction(count=>new URL(location.href).hash.includes('count='+count)&&globalThis.$?.$rise_app?.Root(0).Bench().Goods().count_mode()===count,count)
					await page.waitForFunction(()=>!document.querySelector('[rise_bench_host_controls_run]').hasAttribute('disabled'))
				}
			}
			assert.equal(await runButton.isEnabled(),true)
			if(kind==='idb'){
				const engines=await page.evaluate(()=>$.$rise_app.Root(0).Bench().Goods_host().Metrics().records().map(row=>row['Хранилище']))
				assert.ok(engines.includes('IDB')&&engines.includes('Гипербаза'),'Both engines in one table')
				assert.equal(await child.evaluate(()=>$.$mol_wire_async(()=>$.$rise_app.Root(0).Bench().Idb().Table().rows().length)()),101,'All records, not the last 24')
				const search=child.getByRole('textbox',{name:'Название товара',exact:true})
				await search.fill('Notebook 00000')
				await child.waitForFunction(()=>{try{return $.$rise_app.Root(0).Bench().Idb().Table().rows().length===1}catch(error){if(error?.then)return false;throw error}})
				assert.equal(await child.locator('[rise_bench_baza_goods_table]').count(),1,'Reuse the exact card implementation')
				await child.locator('[rise_bench_baza_goods_table_color]').first().getByRole('checkbox').click()
				await child.getByRole('button',{name:'blue',exact:true}).click()
				await child.waitForFunction(()=>{try{return $.$rise_app.Root(0).Bench().Idb().products()[0].color==='blue'}catch(error){if(error?.then)return false;throw error}})
				await child.locator('[mol_search_clear]').click()
				await child.getByText('Aurora Compact Notebook 00100',{exact:true}).waitFor()
				await watchFilters(child,'Idb')
				await child.getByRole('button',{name:'Добавить запись',exact:true}).click()
				await child.waitForFunction(()=>{try{return $.$rise_app.Root(0).Bench().Idb().Table().rows().length===102}catch(error){if(error?.then)return false;throw error}})
				await page.waitForFunction(()=>!document.querySelector('[rise_bench_host_controls_run]').hasAttribute('disabled'))
				await checkFilters(child)
				if(local){
					resultStep('Накопить настоящие прогоны и проверить внутренний скролл истории',['$rise_bench_host.History'])
					for(let index=0;index<10;index++){
						const previous=await child.evaluate(()=>$.$rise_app.Root(0).Bench().Idb().Metrics().runs()[0].id)
						await runButton.click()
						const next=await child.waitForFunction(previous=>{const id=globalThis.$?.$rise_app?.Root(0).Bench().Idb().Metrics().runs()[0]?.id;return id&&id!==previous?id:false},previous)
						const id=await next.jsonValue();await next.dispose()
						await page.waitForFunction(id=>{try{return $.$rise_bench_archive.rows('idb').some(row=>row.id===id&&row.state()==='Готово')}catch(error){if(error?.then)return false;throw error}},id)
					}
				}
				const history=page.locator('[rise_bench_host_history]');const size=await history.evaluate(node=>({height:node.clientHeight,full:node.scrollHeight}))
				assert.ok(size.height<=450&&size.full>size.height,'History must scroll internally at about ten rows')
				const rowHeight=await page.locator('[rise_bench_metrics_table] > [mol_grid_row]').first().evaluate(node=>node.getBoundingClientRect().height)
				assert.ok(rowHeight<=42,'Info button must not inflate the row')
				await history.hover();await page.mouse.wheel(0,900)
				await page.waitForFunction(()=>document.querySelector('[rise_bench_host_history]').scrollTop>0)
				await screenshot(page,'archive-history-scroll.png')
			}
		}
		resultStep('Проверить отсутствие тестовых Lands в сетевых пакетах',['$rise_storage.db','$rise_bench_seed.lands'])
		const sent=await page.evaluate(packets=>{
			const buffers=packets.map(bytes=>new Uint8Array(bytes))
			return $.$mol_wire_async(()=>buffers.flatMap(buffer=>$.$mol_wire_sync($.$mol_wire_sync($.$giper_baza_pack).from(buffer)).parts().map(([id])=>id)))()
		},packets)
		const touched=await page.evaluate(()=>[...$.$giper_baza_glob.lands_touched])
		if(!local)assert.ok(sent.length>0)
		assert.ok(sent.every(id=>touched.includes(id)))
		assert.equal(await page.evaluate(()=>$.$mol_wire_async(()=>$.$mol_wire_sync($.$rise_storage).db().name)()),'$rise_results')
		if(!local){
		resultStep('Прочитать результаты новым профилем и подтвердить публичную запись',['$rise_bench_archive.rows','$rise_bench_archive.save'])
		const reader=await browser.newContext();contexts.push(reader)
		const other=await reader.newPage();other.setDefaultTimeout(60000)
		await openBenchmark(other,url)
		await other.getByRole('link',{name:'Bench',exact:true}).click()
		await other.getByRole('link',{name:'Сущности',exact:true}).click()
		await other.waitForFunction(completed=>{try{return completed.every(r=>$.$rise_bench_archive.rows(r.kind).some(row=>row.id===r.id))}catch(e){if(e?.then)return false;throw e}},completed)
		assert.equal(await other.evaluate(()=>$.$mol_wire_async(()=> $.$rise_bench_archive.root().can_change())()),true)
		// Same measured data, new formatting: forces a real write by the second author.
		await other.evaluate(run=>$.$mol_wire_async(()=>{
			const atom=$.$rise_bench_archive.root().dive(run.kind+':'+run.id,$.$giper_baza_atom_text)
			atom.val(' '+JSON.stringify(JSON.parse(atom.val())))
			$.$mol_wire_sync($.$rise_bench_archive.root().land()).units_saving()
		})(),completed[0])
		await page.waitForFunction(run=>{try{return $.$rise_bench_archive.root().dive(run.kind+':'+run.id,$.$giper_baza_atom_text).val().startsWith(' ')}catch(e){if(e?.then)return false;throw e}},completed[0])
		// Re-save canonically without adding a fake measurement.
		await other.evaluate(run=>$.$mol_wire_async(()=>{
			const root=$.$rise_bench_archive.root();const row=JSON.parse(root.dive(run.kind+':'+run.id,$.$giper_baza_atom_text).val())
			$.$mol_wire_sync($.$rise_bench_archive).save(run.kind,row)
		})(),completed[0])
		}else{
			assert.ok(sockets.every(value=>['localhost:9080','localhost:9090'].includes(new URL(value).host)),'Local UI must never connect to real Baza')
		}
		resultStep('Открыть параметры компьютера и переключить графики',['$rise_bench_metrics.Details','$rise_bench_charts'])
		const details=page.locator('[rise_bench_metrics_details_trigger]').first();await details.click()
		await page.locator('[rise_bench_metrics_details_computer]').filter({hasText:'Rise test computer'}).waitFor()
		const padding=await page.locator('[rise_bench_metrics_details_text]').evaluate(node=>parseFloat(getComputedStyle(node).paddingLeft))
		assert.ok(padding>=8)
		assert.ok(await details.evaluate(node=>node.getBoundingClientRect().height)>=40,'Normal click target without a taller row')
		await screenshot(page,'archive-computer.png')
		await page.keyboard.press('Escape')
		await page.locator('[rise_bench_metrics_details_computer]').waitFor({state:'detached'})
		// Isolated local archive: exercise the older rows excluded from current-version charts too.
		if(local){
			const legacy=await page.evaluate(()=>$.$mol_wire_async(()=>{
				const root=$.$rise_bench_archive.root()
				const source=root.keys().find(key=>String(key).startsWith('text:'))
				return JSON.parse(root.dive(source,$.$giper_baza_atom_text).val())
			})())
			legacy.id=require('node:crypto').randomUUID();legacy.benchmark_version='0.3.0'
			await page.evaluate(row=>$.$mol_wire_async(()=>$.$rise_bench_archive.save('text',row))(),legacy)
			completed.push({kind:'text',id:legacy.id})
			const failed={...legacy,id:require('node:crypto').randomUUID(),state:'Ошибка',error:'Вставка, с: превышен лимит 300 с',metrics:{'Вставка, с':0,'Добавить символ, с':null,'F5, с':null}}
			await page.evaluate(row=>$.$mol_wire_async(()=>$.$rise_bench_archive.save('text',row))(),failed)
			completed.push({kind:'text',id:failed.id})
		}
		const measured=await measurements(page,completed)
		assert.ok(measured.every(row=>Object.values(row.metrics).some(value=>typeof value==='number')),'Native runs must have measurements before switching')
		for(let attempt=0;attempt<3;attempt++){
			await page.getByRole('checkbox',{name:'Графики',exact:true}).click()
			await page.locator('[rise_bench_charts_operation_plot]').first().waitFor()
			assert.equal(await page.locator('[rise_bench_charts_operation_plot]').count(),3)
			if(local){
				const versions=await page.locator('[rise_bench_charts_operation_legend_text]').allTextContents()
				assert.ok(versions.some(title=>title.includes('v0.3.0')),'Historical measurements must appear in charts')
				assert.ok(versions.some(title=>title.includes('v0.5.0')),'Current measurements must remain a separate series')
			}
			if(attempt===0)await screenshot(page,'archive-charts.png')
			await page.getByRole('checkbox',{name:'Таблица',exact:true}).click()
			await page.locator('[rise_bench_metrics_table]').waitFor()
			assert.deepEqual(await measurements(page,completed),measured,'Charts must not discard archived measurements or status')
		}
		resultStep('Проверить узкое окно и светлую тему',['$rise_bench_host.Frame'])
		await page.emulateMedia({colorScheme:'light'})
		for(const frame of page.frames())await frame.evaluate(()=>document.documentElement.setAttribute('mol_theme','$mol_theme_light'))
		for(const width of [700,320]){
			await page.setViewportSize({width,height:900})
			await page.waitForFunction(width=>{const node=$.$rise_app.Root(0).Bench().Text_host().Results().dom_node();return node.getBoundingClientRect().width<=width+1},width)
			await page.locator('[rise_bench_host_results]').last().scrollIntoViewIfNeeded()
			await page.waitForFunction(()=>document.querySelector('[rise_bench_host_results_head]').getBoundingClientRect().height<=80,null,{timeout:5000})
			await screenshot(page,`archive-light-${width}.png`)
		}
		await page.reload({waitUntil:'domcontentloaded'})
		await page.waitForFunction(completed=>{try{return completed.every(r=>$.$rise_bench_archive.rows(r.kind).filter(row=>row.id===r.id).length===1)}catch(e){if(e?.then)return false;throw e}},completed)
		assert.deepEqual(await measurements(page,completed),measured,'F5 must preserve the same values, not repair them')
		assert.deepEqual(errors,[])
		console.log('ARCHIVE_PASS',JSON.stringify({completed,packets:packets.length,independent_sync_checked:!local}))
	}finally{clearTimeout(deadline);for(const context of contexts)await closeTestContext(context);await browser.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1})
