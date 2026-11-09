const assert=require('node:assert/strict')
const {chromium,resultScenario,resultStep,screenshot}=require('../../../playwright/harness')
resultScenario({title:'Текст без автоматического открытия прошлого документа',group:'entities'})
async function main(){
	console.log('OWNER',JSON.stringify({pid:process.pid,deadline_ms:120000}))
	const browser=await chromium.launch({channel:'chrome',headless:true}),deadline=setTimeout(()=>browser.close().catch(()=>{}),120000)
	try{
		const page=await browser.newPage({viewport:{width:1400,height:1000},serviceWorkers:'block'});page.setDefaultTimeout(25000)
		await page.addInitScript(()=>localStorage.setItem('$rise_bench_baza_crdttext',JSON.stringify('invalid-legacy-link-do-not-open')))
		const url=new URL(process.env.RISE_TEST_URL||'http://localhost:9080/rise/app/-/test.html');url.searchParams.set('rise_fixture','sqltests');url.hash='!=bench/bench=%24rise_bench_baza_crdttext'
		await page.goto(url.href,{waitUntil:'domcontentloaded'})
		async function empty(){
			const frame=await page.locator('iframe').elementHandle().then(n=>n.contentFrame())
			await frame.waitForFunction(()=>globalThis.$?.$rise_app.Root(0).Bench().Crdttext().Editor().Edit().dom_node().value==='')
			assert.equal(await frame.evaluate(()=>$.$rise_app.Root(0).Bench().Crdttext().text_link()),'')
		}
		resultStep('Не открывать старую ссылку при входе',['$rise_bench_baza_crdttext.text_link'])
		await empty()
		resultStep('Сохранить настоящее восстановление внутри измеряемого F5',['$rise_bench_baza_crdttext.reload_ticket','$rise_bench_baza_crdttext.resume_reload'])
		await page.waitForFunction(()=>$.$rise_app.Root(0).Bench().Text_host().run_enabled())
		await page.getByRole('button',{name:'Запустить бенчмарк',exact:true}).click()
		await page.waitForFunction(()=>{const h=$.$rise_app.Root(0).Bench().Text_host();return !h.busy()&&h.runs().length===1&&h.runs()[0].state()==='Готово'&&h.outbox().length===0})
		const frame=await page.locator('iframe').elementHandle().then(n=>n.contentFrame())
		assert.ok((await frame.locator('textarea').inputValue()).startsWith('!Строка 1:'))
		assert.ok(await page.evaluate(()=>$.$rise_app.Root(0).Bench().Text_host().runs()[0].metric('F5, с')>0))
		resultStep('Вернуться к пустому тексту после переключения и F5',['$rise_bench_baza_crdttext.text_link'])
		await page.getByRole('link',{name:'Сущности',exact:true}).click()
		await page.getByRole('link',{name:'Текст',exact:true}).click();await empty()
		await page.reload({waitUntil:'domcontentloaded'});await empty()
		assert.equal(await page.evaluate(()=>$.$rise_app.Root(0).Bench().Text_host().runs().length),1)
		const logo=page.locator('[rise_bench_host_controls_support_logo]');await logo.scrollIntoViewIfNeeded()
		await page.waitForFunction(()=>{const img=document.querySelector('[rise_bench_host_controls_support_logo]');return img.complete&&img.naturalWidth>0})
		console.log('FOOTER',await screenshot(page,'text-empty-footer.png'))
		console.log('TEXT_REOPEN_PASS',JSON.stringify({legacyLinkIgnored:true,measuredReload:true,reopenEmpty:true,parentReloadEmpty:true,historyRetained:true}))
	}finally{clearTimeout(deadline);await browser.close()}
}
main().catch(error=>{console.error(error);process.exitCode=1})
