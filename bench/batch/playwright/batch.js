const assert=require('node:assert/strict')
const fs=require('node:fs/promises')
const path=require('node:path')
const os=require('node:os')
const {chromium,resultScenario,resultStep,screenshot}=require('../../playwright/harness')
resultScenario({title:'Последовательная матрица хранилищ и размеров',group:'entities'})
async function main(){
	const matrix=process.argv.includes('--matrix'),stopCheck=process.argv.includes('--stop'),mixed=process.argv.includes('--mixed')
	if(process.argv.includes('--timeout'))throw Error('Automatic timeouts were removed; use --stop')
	const output=path.resolve(__dirname,'../../../-test-results',`batch-${Date.now()}-${process.pid}`)
	await fs.mkdir(output,{recursive:true})
	console.log('OWNER',JSON.stringify({pid:process.pid,output,matrix,stopCheck,deadline_ms:matrix?14400000:240000}))
	const browser=await chromium.launch({headless:true,channel:'chrome'}),deadline=setTimeout(()=>browser.close().catch(()=>{}),matrix?14400000:240000)
	let built
	try{
		if(process.env.RISE_TEST_BUILT==='1')built=await require('../../playwright/built').serveBuilt()
		const context=await browser.newContext({viewport:{width:1600,height:1000},serviceWorkers:'block'})
		const page=await context.newPage();page.setDefaultTimeout(30000)
		const held=[]
		await page.addInitScript(()=>{
			globalThis.batchRows=[];globalThis.batchPhases=[]
			window.addEventListener('message',event=>{
				if(event.origin!==location.origin)return
				if(event.data?.type==='rise-bench-progress')batchPhases.push({kind:event.data.kind,operation:event.data.operation,count:event.data.row?.count,at:Date.now()})
			})
		})
		if(stopCheck)await context.route('https://cdn.jsdelivr.net/npm/@sqlite.org/sqlite-wasm@*/**',route=>{held.push(route)})
		const url=new URL(built?.url||process.env.RISE_TEST_URL||'http://localhost:9080/rise/app/-/test.html')
		url.searchParams.set('rise_fixture','sqltests')
		url.hash=mixed?'!=bench/bench=%24rise_bench_baza_goods/engine=idb,sqlite/count=100,500/schema=compact,full':'!=bench/bench=%24rise_bench_baza_goods/schema=compact'
		await page.goto(url.href,{waitUntil:'domcontentloaded'})
		await page.waitForFunction(()=>Boolean(globalThis.$?.$rise_app))
		resultStep('Выбрать Все хранилища и '+(matrix?'Все размеры':'100 записей'),['$rise_bench_batch','$rise_bench_host.run'])
		if(!mixed)await page.locator('[rise_bench_host_controls_engine]').getByRole('checkbox',{name:'Все',exact:true}).click()
		if(matrix)await page.locator('[rise_bench_host_controls_count]').getByRole('checkbox',{name:'Все',exact:true}).click()
		await page.getByRole('button',{name:'Запустить бенчмарк',exact:true}).click()
		if(stopCheck){
			resultStep('Удержать SQLite и проверить ручную остановку оставшейся очереди',['$rise_bench_host.stop'])
			await page.waitForFunction(()=>{const host=$.$rise_app.Root(0).Bench().Goods_host();return host.active_case()?.engine==='sqlite'&&host.progress?.operation==='Запуск БД, с'})
			const progress=await page.evaluate(()=>{
				const host=$.$rise_app.Root(0).Bench().Goods_host()
				return {type:'rise-bench-progress',kind:'sqlite',token:host.active_case().token,...host.progress,started:Date.now()-300001}
			})
			const frame=await page.locator('iframe').elementHandle().then(node=>node.contentFrame())
			await frame.evaluate(progress=>parent.postMessage(progress,location.origin),progress)
			await page.waitForFunction(()=>$.$rise_app.Root(0).Bench().Goods_host().progress?.started<Date.now()-300000)
			assert.equal(await page.evaluate(()=>$.$rise_app.Root(0).Bench().Goods_host().active_case()?.engine),'sqlite','Elapsed time must not abort the case')
			await page.getByRole('button',{name:'Остановить',exact:true}).click()
			await page.waitForFunction(()=>!globalThis.$.$rise_app.Root(0).Bench().Goods_host().active_case())
			for(const route of held)await route.abort().catch(()=>{})
		}
		const expected=stopCheck?3:matrix?50:mixed?8:5,start=Date.now(),seen=new Set()
		let lastStatus=''
		while(true){
			if(os.freemem()<1536*1024*1024)throw Error('Stopped own benchmark: less than 1.5 GiB available RAM; progress preserved')
			const state=await page.evaluate(()=>{
				const $=globalThis.$,host=$.$rise_app.Root(0).Bench().Goods_host()
				return {busy:host.busy(),active:host.active_case(),status:host.status(),outbox:host.outbox().length,
					rows:host.runs().map(run=>({id:run.id,engine:run.engine,count:run.count,properties:run.properties,state:run.state(),error:run.failure(),metrics:Object.fromEntries(host.operations().map(name=>[name,run.metric(name)]))})),phases:globalThis.batchPhases}
			})
			for(const row of state.rows)if(!seen.has(row.id)){seen.add(row.id);console.log('RESULT',JSON.stringify(row))}
			if(state.status!==lastStatus){lastStatus=state.status;console.log('PROGRESS',state.status)}
			await fs.writeFile(path.join(output,'results.json'),JSON.stringify({url:url.href,started:start,free_ram:os.freemem(),...state},null,2))
			if(!state.busy&&state.rows.length===expected&&state.outbox===0){
				assert.equal(new Set(state.rows.map(r=>r.engine+':'+r.count+':'+r.properties)).size,expected)
				assert.ok(state.rows.every(r=>mixed?[4,10].includes(r.properties):r.properties===4))
				if(!stopCheck)assert.ok(state.rows.every(r=>r.state==='Готово'),JSON.stringify(state.rows.filter(r=>r.state!=='Готово')))
				else {assert.equal(state.rows.filter(r=>r.state==='Остановлено').length,1);assert.ok(state.rows.some(r=>r.engine==='sqlite'&&r.state==='Остановлено'));assert.ok(!state.rows.some(r=>['pglite','duckdb'].includes(r.engine)))}
				console.log('BATCH_PASS',JSON.stringify({cases:state.rows.length,failed:state.rows.filter(r=>r.state==='Ошибка').length,stopped:state.rows.filter(r=>r.state==='Остановлено').length,elapsed_ms:Date.now()-start,output}))
				break
			}
			if(Date.now()-start>(matrix?14300000:220000))throw Error('Batch exceeded runner deadline')
			await new Promise(resolve=>setTimeout(resolve,1000))
		}
		await screenshot(page,'batch-complete.png')
		await context.close()
	}finally{clearTimeout(deadline);await browser.close();await built?.close()}
}
main().catch(error=>{console.error(error);process.exitCode=1})
