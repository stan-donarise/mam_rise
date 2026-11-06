const assert=require('node:assert/strict')
const {chromium,resultScenario,resultStep}=require('../../playwright/harness')
const {openBenchmark}=require('../../playwright/offline')
resultScenario({title:'Первый вариант матрицы без публикации результатов',group:'entities'})
async function main(){
	const noise=process.argv.includes('--noise')
	console.log('OWNER',JSON.stringify({pid:process.pid,deadline_ms:90000}))
	const browser=await chromium.launch({headless:true,channel:'chrome'})
	const deadline=setTimeout(()=>browser.close().catch(()=>{}),90000)
	try{
		const context=await browser.newContext()
		await context.addInitScript(noise=>{
			globalThis.startupProgress=[];globalThis.startupResult=null
			if(window.parent!==window){
				if(noise)window.addEventListener('message',event=>{
					if(event.source===parent&&event.data?.type==='rise-bench-command'&&event.data.command==='run'&&!globalThis.startupNoiseSent){
						globalThis.startupNoiseSent=true
						setTimeout(()=>{
							window.postMessage({unrelatedProbe:true},location.origin)
							parent.postMessage({type:'startup-probe-echo',request:event.data},location.origin)
						},0)
					}
				})
				return
			}
			// Keep the normal online shell, but stop delivery before it could archive a result.
			window.addEventListener('message',event=>{
				if(event.origin!==location.origin)return
				if(noise&&event.data?.type==='startup-probe-echo'){
					event.stopImmediatePropagation();event.source.postMessage(event.data.request,location.origin);return
				}
				if(noise&&event.data?.type==='rise-bench-progress'&&event.data.operation==='Создание, с')event.source.postMessage({type:'unrelated-parent-probe'},location.origin)
				if(event.data?.type==='rise-bench-progress')startupProgress.push({operation:event.data.operation,at:Date.now()})
				if(event.data?.type==='rise-bench-result'||event.data?.type==='rise-bench-state'&&event.data.error){
					event.stopImmediatePropagation();startupResult=event.data
				}
			},true)
		},noise)
		const page=await context.newPage(),errors=[]
		page.setDefaultTimeout(60000)
		page.on('pageerror',error=>errors.push(error.message))
		page.on('console',message=>{if(message.type()==='error')errors.push(message.text().slice(0,800))})
		const url=new URL(process.env.RISE_TEST_URL||'https://stan-donarise.github.io/mam_rise/')
		url.hash='!=bench/bench=%24rise_bench_baza_goods/results=table/engine=all/count=all'
		resultStep('Открыть обычную опубликованную страницу и запустить Все × Все',['$rise_bench_host.run'])
		await openBenchmark(page,url.href)
		await page.getByRole('button',{name:'Запустить бенчмарк',exact:true}).click()
		try{
			await page.waitForFunction(()=>Boolean(globalThis.startupResult),null,{timeout:noise?15000:60000})
		}finally{
			console.log('DIAGNOSTIC',JSON.stringify(await page.evaluate(()=>{
				const host=globalThis.$?.$rise_app.Root(0).Bench().Goods_host()
				return {status:host?.status(),busy:host?.busy(),active:host?.active_case(),phases:globalThis.startupProgress,result:globalThis.startupResult}
			})))
			console.log('BROWSER_ERRORS',JSON.stringify(errors))
		}
		const result=await page.evaluate(()=>startupResult)
		assert.equal(result.row?.state,'Готово',JSON.stringify(result))
		assert.equal(result.row?.count,100)
		assert.match(await page.evaluate(()=>$.$rise_app.Root(0).Bench().Goods_host().status()),/^1\/40: Гипербаза, 100 — /)
		assert.equal(await page.evaluate(()=>startupProgress.filter(row=>row.operation==='Подготовка').length),1,'Duplicate delivery must not restart the benchmark')
		console.log('FIRST_CASE_PASS')
		await context.close()
	}finally{clearTimeout(deadline);await browser.close()}
}
main().catch(error=>{console.error(error);process.exitCode=1})
