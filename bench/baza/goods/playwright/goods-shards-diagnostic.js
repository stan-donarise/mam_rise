const fs = require('node:fs')
const path = require('node:path')
const { chromium, resultScenario, resultStep } = require('../../../../../shm/hitalama/playwright/harness')
resultScenario({ title: 'Диагностика создания шардов', group: 'entities' })
async function main() {
	const browser = await chromium.launch({ headless: true })
	const deadline = setTimeout(()=>browser.close().catch(()=>{}), 20000)
	try {
		const page = await browser.newPage()
		let code = fs.readFileSync(path.resolve(__dirname, '../-/web.js'), 'utf8')
		for(const [from,to] of [
			['const land = $mol_wire_sync($giper_baza_glob).land_grab(this.preset);','console.log("probe grab before"); let land; try { land = $mol_wire_sync($giper_baza_glob).land_grab(this.preset); } catch(e) { console.log("probe throw",String(e)); if(e?.then)e.then(()=>console.log("probe promise resolved"),e=>console.log("probe rejected",String(e))); throw e; } console.log("probe grab after");'],
			['dataset.Products(null);','console.log("probe list before"); dataset.Products(null); console.log("probe list after");'],
			['return new $rise_bench_baza_goods_preparation(dataset, config.area, config.count, config.compact, config.shard_size);','console.log("probe prep before", JSON.stringify(config)); const state = new $rise_bench_baza_goods_preparation(dataset, config.area, config.count, config.compact, config.shard_size); console.log("probe prep after"); return state;'],
		]) code = code.replace(from,to)
		await page.route('**/web.js',route=>route.fulfill({body:code}))
		await page.route('**/web.test.js',route=>route.fulfill({body:''}))
		await page.route('**/web.audit.js',route=>route.fulfill({body:''}))
		await page.route('**/mol/build/client/client.js',route=>route.fulfill({body:''}))
		page.on('console',message=>console.log(message.text().slice(0,500)))
		page.on('pageerror',error=>console.error(error))
		resultStep('Создать тестовые шарды', ['$rise_bench_baza_goods.prepare_dataset'])
		await page.goto('http://localhost:9080/rise/bench/baza/goods/-/test.html#!storage=shard64/count=500/schema=compact',{waitUntil:'domcontentloaded'})
		if(process.argv.includes('--prewarm-author')) {
			await page.evaluate(()=>globalThis.$.$mol_wire_async(()=>globalThis.$.$giper_baza_auth.current().pass().lord().str)())
			console.log('probe auth prepared')
		}
		await page.getByRole('button',{name:'Создать записи',exact:true}).click()
		await page.locator('[rise_bench_baza_goods_table_name]').first().waitFor()
	} finally {
		clearTimeout(deadline)
		await browser.close()
	}
}
main().catch(error=>{console.error(error.message);process.exitCode=1})
