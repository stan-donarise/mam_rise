const assert=require('node:assert/strict')
const {chromium,resultScenario,resultStep,resultBenchmarkValue,closeTestContext}=require('../../bench/playwright/harness')
resultScenario({title:'Тестовая страница без роста памяти при открытии',group:'entities'})
async function main(){
	const browser=await chromium.launch({headless:true,channel:'chrome',args:['--js-flags=--max-old-space-size=256']})
	const deadline=setTimeout(()=>browser.close().catch(()=>{}),45000)
	let context
	try{
		for(let run=1;run<=3;run++){
			resultStep(`Открыть test.html без запуска бенчмарка, профиль ${run}`,['$rise_app_test_suite','$rise_bench_host.fixture_uri'])
			context=await browser.newContext();const page=await context.newPage()
			let passed=false,count=0;const errors=[]
			page.on('pageerror',error=>errors.push(error.message||String(error)))
			page.on('crash',()=>errors.push('Renderer crashed'))
			page.on('console',message=>{if(message.text().includes('All tests passed')){passed=true;count=Number(message.text().match(/count\s+(\d+)/)?.[1]||0)}})
			const cdp=await context.newCDPSession(page);await cdp.send('Performance.enable')
			await page.goto('http://localhost:9080/rise/app/-/test.html#!=bench/bench=%24rise_bench_baza_goods',{waitUntil:'domcontentloaded'})
			let peak=0
			for(let sample=0;sample<24;sample++){
				await page.waitForTimeout(250)
				const metrics=await cdp.send('Performance.getMetrics')
				peak=Math.max(peak,metrics.metrics.find(m=>m.name==='JSHeapUsedSize').value)
				assert.ok(peak<128*1024*1024,'Idle page must not grow to the renderer heap cap')
				if(passed&&sample>=11)break
			}
			assert.deepEqual(errors,[])
			assert.ok(passed,'UI bootstrap check must finish')
			assert.equal(count,1,'Do not execute dependency unit tests beside benchmark UI')
			const retained=await page.evaluate(()=>({total:$.$rise_app_test_suite.length,area:$.$rise_app_test_suite.some(test=>test.name==='Land Area inherits rights')}))
			assert.ok(retained.total>=596&&retained.area,'Original dependency tests must remain available')
			assert.equal(await page.evaluate(()=> $.$rise_app.Root(0).Bench().Goods_host().busy()),false)
			assert.deepEqual(await page.evaluate(()=>$.$giper_baza_yard.masters()),['http://localhost:9090/'])
			assert.equal(await page.evaluate(()=>$.$mol_wire_async(()=>$.$rise_bench_archive.root().can_change())()),true,'Signed public seed must work without a real Baza server')
			const child=page.frames().find(frame=>frame!==page.mainFrame())
			assert.ok(child);assert.ok(!child.url().includes('/test.html'),'Workload must not run another unit suite')
			assert.equal(await child.evaluate(()=>typeof globalThis.$?.$mol_test_all),'undefined')
			resultBenchmarkValue(`Профиль ${run}: максимум JS heap`,peak/(1024*1024),'MiB')
			console.log('STARTUP_PASS',JSON.stringify({run,ui_checks:count,deferred_units:retained.total,peak_mb:peak/(1024*1024)}))
			await closeTestContext(context);context=null
		}
	}finally{clearTimeout(deadline);try{if(context)await closeTestContext(context)}finally{await browser.close()}}
}
main().catch(error=>{console.error(error);process.exitCode=1})
