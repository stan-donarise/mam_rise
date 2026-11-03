const assert = require( 'node:assert/strict' )
const { chromium, headless, isolateUnitTests, resultScenario, resultStep, resultBenchmark, screenshot } = require( '../../../../../shm/hitalama/playwright/harness' )
const { closeTestContext } = require( '../../../../../shm/hitalama/playwright/unit-isolation' )
const { observeOffline, targetUrl } = require( '../../../playwright/offline' )

resultScenario({ title: 'Товары: Area на запись', group: 'entities' })

async function main() {
	const browser = await chromium.launch({ headless: headless(), channel: 'chrome' })
	const deadline = setTimeout( ()=> browser.close().catch( ()=> {} ), 180_000 )
	let context
	try {
		context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
		await isolateUnitTests( context )
		const page = await context.newPage()
		const url = targetUrl()
		const assertOffline = observeOffline( page, url )
		page.setDefaultTimeout( 60_000 )
		const errors = []
		page.on( 'pageerror', error => errors.push( error.message ) )
		page.on( 'console', message => {
			if( /Different (host|args|task) on restart/.test( message.text() ) ) errors.push( message.text() )
		} )
		const fields = ()=> page.evaluate( ()=> globalThis.$.$mol_wire_async( ()=> {
			const app = globalThis.$.$rise_app.Root( 0 ).Bench().Goods()
			return app.products().map( product => ({
				id: product.Id().val(), title: product.Title().val(),
				land: product.land().link().str, color: product.Color().val(),
			}) )
		} )() )

		resultStep( 'Открыть бенчмарк через каталог', [ '$rise_bench', '$rise_bench_baza_goods' ] )
		await page.goto( url, { waitUntil: 'domcontentloaded' } )
		await page.getByRole( 'link', { name: 'Bench', exact: true } ).click()
		await page.getByRole( 'link', { name: '$rise_bench_baza_goods', exact: true } ).click()
		await page.getByRole( 'button', { name: 'Добавить запись', exact: true } ).waitFor()
		assert.equal( await page.locator( '[rise_bench_baza_goods_storage]' ).count(), 0 )

		resultStep( 'Добавить две записи в отдельные Area', [ '$rise_bench_baza_goods.add_one' ] )
		for( let count = 1; count <= 2; ++count ) {
			await resultBenchmark( `Добавить запись ${count}`, async()=> {
				await page.getByRole( 'button', { name: 'Добавить запись', exact: true } ).click()
				await page.waitForFunction( count => {
					try {
						const app = globalThis.$.$rise_app.Root( 0 ).Bench().Goods()
						return app.products().length === count && !globalThis.$.$mol_promise_like( app.Add().status()?.[ 0 ] )
					} catch( error ) { if( error?.then ) return false; throw error }
				}, count )
				await page.getByText( count === 1 ? 'Aurora Wireless Notebook 00000' : 'Aurora Wireless Headphones 00001', { exact: true } ).waitFor()
			} )
		}
		const before = await fields()
		assert.equal( new Set( before.map( row => row.land ) ).size, 2 )
		const rootLand = await page.evaluate( ()=> globalThis.$.$rise_app.Root( 0 ).Bench().Goods().dataset().land().link().str )
		assert.ok( before.every( row => row.land !== rootLand ) )

		resultStep( 'Найти товар и изменить цвет', [ '$rise_bench_baza_goods_table.rows', '$rise_bench_baza_goods_table.change_field' ] )
		const search = page.locator( '[rise_bench_baza_goods_search]' ).locator( 'input' )
		await search.fill( 'Notebook' )
		await page.waitForFunction( ()=> globalThis.$.$rise_app.Root( 0 ).Bench().Goods().Table().rows().length === 1 )
		await page.locator( '[rise_bench_baza_goods_table_color]' ).first().getByRole( 'checkbox' ).click()
		await page.getByRole( 'button', { name: 'blue', exact: true } ).click()
		await page.waitForFunction( ()=> globalThis.$.$rise_app.Root( 0 ).Bench().Goods().products()[ 0 ].Color().val() === 'blue' )
		await page.locator( '[rise_bench_baza_goods_search] [mol_search_clear]' ).click()
		await page.waitForFunction( ()=> globalThis.$.$rise_app.Root( 0 ).Bench().Goods().Table().rows().length === 2 )
		const changed = await fields()

		resultStep( 'Восстановить записи после F5', [ '$rise_bench_baza_goods.dataset_link', '$rise_bench_baza_goods.dataset' ] )
		await resultBenchmark( 'F5 до отображения записей', async()=> {
			await page.reload({ waitUntil: 'domcontentloaded' })
			await page.getByText( 'Aurora Wireless Notebook 00000', { exact: true } ).waitFor()
			await page.getByText( 'Aurora Wireless Headphones 00001', { exact: true } ).waitFor()
		} )
		assert.deepEqual( await fields(), changed )

		resultStep( 'Создать 500 записей и проверить виртуализацию', [ '$rise_bench_baza_goods.create', '$rise_bench_baza_goods.initialize_products', '$rise_bench_baza_goods_table.rows' ] )
		await page.getByRole( 'button', { name: 'Сбросить', exact: true } ).click()
		await page.getByRole( 'checkbox', { name: '4 свойства', exact: true } ).click()
		await page.getByRole( 'checkbox', { name: '500', exact: true } ).click()
		await resultBenchmark( 'Создать 500 записей до отображения', async()=> {
			await page.getByRole( 'button', { name: 'Создать записи', exact: true } ).click()
			await page.getByText( 'Zen Classic Watch 00499', { exact: true } ).waitFor()
		} )
		const lands = await page.evaluate( ()=> globalThis.$.$rise_app.Root( 0 ).Bench().Goods().product_links().map( link => link.land().str ) )
		assert.equal( lands.length, 500 )
		assert.equal( new Set( lands ).size, 500 )
		const metrics = await page.evaluate( ()=> globalThis.$.$rise_app.Root( 0 ).Bench().Goods().Metrics().records() )
		assert.deepEqual( metrics.map( row => row[ 'Операция' ] ), [ 'Создание набора: всего', 'Построение индексов', 'Публикация списка', 'Заполнение товаров' ] )
		assert.ok( metrics.every( row => Number( row[ 'Время, мс' ] ) >= 0 ) )
		assert.equal( await page.locator( '[rise_bench_baza_goods_metrics] [mol_grid_col_head]' ).count(), 4 )
		console.log( '[metrics screenshot]', await screenshot( page, 'goods-metrics.png' ) )
		const rows = await page.locator( '[rise_bench_baza_goods_table_row]' ).count()
		assert.ok( rows > 0 && rows < 100, `Expected virtualized rows, got ${rows}` )
		assert.deepEqual( errors, [] )
		await assertOffline()
		console.log( 'Area goods: catalog, add, search, edit, reload, create 500, virtualization passed' )
	} finally {
		clearTimeout( deadline )
		try { if( context ) await closeTestContext( context ) }
		finally { await browser.close() }
	}
}

main().catch( error => { console.error( error ); process.exitCode = 1 } )
