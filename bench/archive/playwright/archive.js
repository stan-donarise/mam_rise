const assert = require('node:assert/strict')
const {chromium,isolateUnitTests,resultScenario,resultStep,resultBenchmark,screenshot}=require('../../../../shm/hitalama/playwright/harness')
const {closeTestContext}=require('../../../../shm/hitalama/playwright/unit-isolation')
const {openBenchmark}=require('../../playwright/offline')
resultScenario({title:'Общие результаты Rise и изолированные нагрузки',group:'entities'})
async function main(){
	const browser=await chromium.launch({headless:true,channel:'chrome'})
	const deadline=setTimeout(()=>browser.close().catch(()=>{}),180000)
	const contexts=[]
	try{
		const context=await browser.newContext({viewport:{width:1600,height:1000}});contexts.push(context);await isolateUnitTests(context)
		const page=await context.newPage();page.setDefaultTimeout(60000)
		const errors=[];page.on('pageerror',e=>errors.push(e.message))
		const packets=[]
		page.on('websocket',socket=>socket.on('framesent',frame=>{if(Buffer.isBuffer(frame.payload))packets.push([...frame.payload])}))
		const url=process.env.RISE_ARCHIVE_URL||'http://localhost:9080/rise/app/-/index.html'
		resultStep('Открыть каталог и публичную таблицу',['$rise_bench_host.fixture_uri','$rise_bench_archive.root'])
		await openBenchmark(page,url)
		await page.getByRole('link',{name:'Bench',exact:true}).click()
		const completed=[]
		for(const [label,kind,method] of [['Сущности','goods','Goods'],['Текст','text','Crdttext'],['Сущности IDB','idb','Idb']]){
			resultStep(`Прогнать ${label} и дождаться iframe F5`,['$rise_bench_reload.save','$rise_bench_host.accept','$rise_bench_archive.save'])
			await page.getByRole('link',{name:label,exact:true}).click()
			const element=page.locator('iframe');await element.waitFor()
			const child=await element.elementHandle().then(e=>e.contentFrame())
			await child.getByRole('button',{name:'Запустить бенчмарк',exact:true}).waitFor()
			assert.deepEqual(await child.evaluate(()=>$.$giper_baza_yard.masters()),[])
			let id
			let reloads=0;const onFrame=frame=>{if(frame===child)++reloads};page.on('framenavigated',onFrame)
			await resultBenchmark(`${label}: полный прогон`,async()=>{
				await child.getByRole('button',{name:'Запустить бенчмарк',exact:true}).click()
				const handle=await child.waitForFunction(method=>globalThis.$?.$rise_app.Root(0).Bench()[method]().Metrics().runs()[0]?.id,method)
				id=await handle.jsonValue();await handle.dispose()
				await page.waitForFunction(({kind,id})=>{try{return $.$rise_bench_archive.rows(kind).some(r=>r.id===id&&r.state()==='Готово')}catch(e){if(e?.then)return false;throw e}},{kind,id})
			})
			page.off('framenavigated',onFrame);assert.ok(reloads>=1,'Real iframe reload')
			const run=await page.evaluate(({kind,id})=>{
				const r=$.$rise_bench_archive.rows(kind).find(r=>r.id===id)
				return {kind,id:r.id,count:r.count,baza:r.baza_version,version:r.benchmark_version,state:r.state()}
			},{kind,id})
			assert.equal(run.count,100);assert.equal(run.version,'0.2.0');assert.equal(run.state,'Готово')
			assert.equal(run.baza,kind==='idb'?'—':'2e6100b225c8d4fb3a5b5d14e8568223e8a8c785');completed.push(run)
			const boundary=await child.evaluate(({method,kind})=>$.$mol_wire_async(()=>{
				const app=$.$rise_app.Root(0).Bench()[method]()
				return {masters:$.$giper_baza_yard.masters(),db:$.$mol_wire_sync($.$rise_storage).db().native?.name,
					lands:[...$.$giper_baza_glob.lands_touched],records:kind==='goods'?app.products().length:kind==='text'?app.text().startsWith('!Строка 1:'):$.$mol_wire_sync(app.storage()).count(),
					}
			})(),{method,kind})
			assert.deepEqual(boundary.masters,[]);assert.equal(boundary.records,kind==='text'?true:101)
			assert.equal(boundary.db,'$rise_workload_'+kind)
			const parentLands=await page.evaluate(()=>[...$.$giper_baza_glob.lands_touched])
			assert.ok(boundary.lands.every(id=>!parentLands.includes(id)),'No workload Land in online parent')
			await screenshot(page,`archive-${kind}.png`)
		}
		resultStep('Проверить отсутствие тестовых Lands в сетевых пакетах',['$rise_storage.db','$rise_bench_seed.lands'])
		const sent=await page.evaluate(packets=>{
			const buffers=packets.map(bytes=>new Uint8Array(bytes))
			return $.$mol_wire_async(()=>buffers.flatMap(buffer=>$.$mol_wire_sync($.$mol_wire_sync($.$giper_baza_pack).from(buffer)).parts().map(([id])=>id)))()
		},packets)
		const touched=await page.evaluate(()=>[...$.$giper_baza_glob.lands_touched])
		assert.ok(sent.length>0);assert.ok(sent.every(id=>touched.includes(id)))
		assert.equal(await page.evaluate(()=>$.$mol_wire_async(()=>$.$mol_wire_sync($.$rise_storage).db().name)()),'$rise_results')
		resultStep('Прочитать результаты новым профилем и подтвердить публичную запись',['$rise_bench_archive.rows','$rise_bench_archive.save'])
		const reader=await browser.newContext();contexts.push(reader);await isolateUnitTests(reader)
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
		// Re-save the exact real result canonically: no new row or fake measurement.
		await other.evaluate(run=>$.$mol_wire_async(()=>{
			const root=$.$rise_bench_archive.root();const row=JSON.parse(root.dive(run.kind+':'+run.id,$.$giper_baza_atom_text).val())
			$.$mol_wire_sync($.$rise_bench_archive).save(run.kind,row)
		})(),completed[0])
		resultStep('Проверить узкое окно и светлую тему',['$rise_bench_host.Frame'])
		await page.emulateMedia({colorScheme:'light'})
		for(const frame of page.frames())await frame.evaluate(()=>document.documentElement.setAttribute('mol_theme','$mol_theme_light'))
		for(const width of [700,320]){
			await page.setViewportSize({width,height:900})
			await page.waitForFunction(width=>{const node=$.$rise_app.Root(0).Bench().Idb_host().dom_node();return node.getBoundingClientRect().width<=width+1},width)
			await page.locator('[rise_bench_host]').last().scrollIntoViewIfNeeded()
			await screenshot(page,`archive-light-${width}.png`)
		}
		await page.reload({waitUntil:'domcontentloaded'})
		await page.waitForFunction(completed=>{try{return completed.every(r=>$.$rise_bench_archive.rows(r.kind).filter(row=>row.id===r.id).length===1)}catch(e){if(e?.then)return false;throw e}},completed)
		assert.deepEqual(errors,[])
		console.log('ARCHIVE_PASS',JSON.stringify({completed,packets:packets.length}))
	}finally{clearTimeout(deadline);for(const context of contexts)await closeTestContext(context);await browser.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1})
