const assert = require( 'node:assert/strict' )
const { chromium, headless, resultScenario, resultStep, resultBenchmark, resultBenchmarkValue, screenshot, closeTestContext } = require( '../../../playwright/harness' )
const { observeOffline, targetUrl, openBenchmark } = require( '../../../playwright/offline' )

resultScenario({ title: 'Товары: Area на запись', group: 'entities' })

async function main() {
	const browser = await chromium.launch({ headless: headless(), channel: 'chrome' })
	const deadline = setTimeout( ()=> browser.close().catch( ()=> {} ), 180_000 )
	let context
	try {
		context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
		const page = await context.newPage()
		let navigations = 0
		page.on( 'framenavigated', frame => { if( frame === page.mainFrame() ) ++navigations } )
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
			return Array.from( app.products(), product => ({
				id: product.Id().val(), title: product.Title().val(),
				land: product.land().link().str, color: product.Color().val(),
			}) )
		} )() )

		resultStep( 'Открыть бенчмарк через каталог', [ '$rise_bench', '$rise_bench_baza_goods' ] )
		await openBenchmark( page, url )
		await page.getByRole( 'link', { name: 'Bench', exact: true } ).click()
		await page.getByRole( 'link', { name: 'Сущности', exact: true } ).click()
		assert.deepEqual( await page.evaluate( ()=> {
			const app = globalThis.$.$rise_app.Root( 0 ).Bench().Goods()
			return [ app.record_count(), app.compact_mode() ]
		} ), [ 100, true ] )
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

		resultStep( 'Найти товар и изменить цвет', [ '$rise_bench_baza_goods_table.rows', '$rise_bench_baza_goods_table.row_color' ] )
		const search = page.locator( '[rise_bench_baza_goods_search]' ).locator( 'input' )
		await search.fill( 'Notebook' )
		await page.waitForFunction( ()=> globalThis.$.$rise_app.Root( 0 ).Bench().Goods().Table().rows().length === 1 )
		await page.locator( '[rise_bench_baza_goods_table_color]' ).first().getByRole( 'checkbox' ).click()
		await page.getByRole( 'button', { name: 'blue', exact: true } ).click()
		await page.waitForFunction( ()=> globalThis.$.$rise_app.Root( 0 ).Bench().Goods().products()[ 0 ].Color().val() === 'blue' )
		await page.locator( '[rise_bench_baza_goods_search] [mol_search_clear]' ).click()
		await page.waitForFunction( ()=> globalThis.$.$rise_app.Root( 0 ).Bench().Goods().Table().rows().length === 2 )
		resultStep( 'Фильтровать цвет и статус без индексов', [ '$rise_bench_baza_goods_table.rows' ] )
		const selectFilter = async( name, label )=> {
			await page.locator( `[rise_bench_baza_goods_${name}_filter]` ).getByRole( 'checkbox' ).first().click()
			await page.getByRole( 'button', { name: label, exact: true } ).click()
		}
		const expectRows = count => page.waitForFunction( count => globalThis.$.$rise_app.Root( 0 ).Bench().Goods().Table().rows().length === count, count )
		await selectFilter( 'color', 'blue' )
		await expectRows( 1 )
		await selectFilter( 'status', 'Sale' )
		await expectRows( 0 )
		await selectFilter( 'color', 'All colors' )
		await expectRows( 1 )
		await selectFilter( 'status', 'All statuses' )
		await expectRows( 2 )
		const changed = await fields()

		resultStep( 'Восстановить записи после F5', [ '$rise_bench_baza_goods.dataset_link', '$rise_bench_baza_goods.dataset' ] )
		await resultBenchmark( 'F5 до отображения записей', async()=> {
			await page.reload({ waitUntil: 'domcontentloaded' })
			await page.getByText( 'Aurora Wireless Notebook 00000', { exact: true } ).waitFor()
			await page.getByText( 'Aurora Wireless Headphones 00001', { exact: true } ).waitFor()
		} )
		assert.deepEqual( await fields(), changed )

		resultStep( 'Создать 500 записей и проверить виртуализацию', [ '$rise_bench_baza_goods.create', '$rise_bench_baza_goods.initialize_product', '$rise_bench_baza_goods_table.rows' ] )
		await page.getByRole( 'button', { name: 'Очистить', exact: true } ).click()
		await page.getByRole( 'checkbox', { name: '4 свойства', exact: true } ).click()
		await page.getByRole( 'checkbox', { name: '500', exact: true } ).click()
		const beforeRun = navigations
		await resultBenchmark( 'Создать 500 записей до отображения', async()=> {
			await page.getByRole( 'button', { name: 'Запустить бенчмарк', exact: true } ).click()
			await page.waitForFunction( ()=> globalThis.$?.$rise_app.Root( 0 ).Bench().Goods().Metrics().runs()[ 0 ]?.state() === 'Готово' )
		} )
		const lands = await page.evaluate( ()=> globalThis.$.$rise_app.Root( 0 ).Bench().Goods().product_links().map( link => link.land().str ) )
		assert.ok( navigations > beforeRun, 'The benchmark must really reload the whole page' )
		assert.equal( lands.length, 501 )
		assert.equal( new Set( lands ).size, 501 )
		const metrics = await page.evaluate( ()=> globalThis.$.$rise_app.Root( 0 ).Bench().Goods().Metrics().records() )
		assert.equal( metrics.length, 1 )
		assert.equal( metrics[ 0 ][ 'Состояние' ], 'Готово' )
		for( const column of [ 'Создание, с', 'Поиск, с', 'Добавить 1, с', 'F5, с', 'Поиск после F5, с' ] ) {
			assert.notEqual( metrics[ 0 ][ column ], '—' )
			assert.ok( Number( metrics[ 0 ][ column ] ) >= 0 )
			assert.match( metrics[ 0 ][ column ], /^\d+\.\d{3}$/ )
		}
		assert.equal( metrics[ 0 ][ 'Версия Гипербазы' ], '2e6100b2' )
		assert.equal( metrics[ 0 ][ 'Версия бенчмарка' ], '0.3.0' )
		assert.equal( await page.locator( '[rise_bench_baza_goods_metrics] [mol_grid_col_head]' ).count(), 12 )
		assert.equal( await page.getByRole( 'button', { name: 'Перестроить индексы', exact: true } ).count(), 0 )
		const keys = await page.evaluate( ()=> globalThis.$.$mol_wire_async( ()=> globalThis.$.$rise_app.Root( 0 ).Bench().Goods().dataset().keys() )() )
		assert.ok( !keys.includes( 'Color_index' ) && !keys.includes( 'Status_index' ) )
		resultStep( 'Ручное добавление не создаёт прогон', [ '$rise_bench_baza_goods.add_one' ] )
		await page.getByRole( 'button', { name: 'Добавить запись', exact: true } ).click()
		await page.waitForFunction( ()=> globalThis.$.$rise_app.Root( 0 ).Bench().Goods().product_links().length === 502 )
		assert.deepEqual( await page.evaluate( ()=> globalThis.$.$rise_app.Root( 0 ).Bench().Goods().Metrics().records() ), metrics )
		resultStep( 'Повторить прогон на новом наборе', [ '$rise_bench_baza_goods.benchmark', '$rise_bench_baza_goods.start_run' ] )
		await page.getByRole( 'button', { name: 'Запустить бенчмарк', exact: true } ).click()
		await page.waitForFunction( ()=> {
			const app = globalThis.$?.$rise_app.Root( 0 ).Bench().Goods()
			return app?.Metrics().runs().length === 2 && app.Metrics().runs()[ 0 ].state() === 'Готово'
		} )
		assert.equal( await page.evaluate( ()=> globalThis.$.$rise_app.Root( 0 ).Bench().Goods().product_links().length ), 501 )
		const completed = await page.evaluate( ()=> globalThis.$.$rise_app.Root( 0 ).Bench().Goods().Metrics().records() )
		resultStep( 'Повторный F5 сохраняет историю и не повторяет прогон', [ '$rise_bench_baza_goods.restore_runs', '$rise_bench_baza_goods.resume_reload' ] )
		await page.reload({ waitUntil: 'domcontentloaded' })
		await page.getByText( 'Aurora Smart Notebook 00500', { exact: true } ).waitFor()
		assert.deepEqual( await page.evaluate( ()=> globalThis.$.$rise_app.Root( 0 ).Bench().Goods().Metrics().records() ), completed )

		resultStep( 'Сверить границы замеров на 500 записях по 10 полей', [ '$rise_bench_baza_goods.benchmark', '$rise_bench_baza_goods.save_dataset', '$rise_bench_baza_goods.add_one' ] )
		await page.getByRole( 'checkbox', { name: '10 свойств', exact: true } ).click()
		await page.evaluate( ()=> {
			const app = globalThis.$.$rise_app.Root( 0 ).Bench().Goods()
			const trace = []
			const fill = app.fill_product
			app.fill_product = function( state, index, product ) {
				const count = state.dataset.Products().items().length
				if( count !== ( index < 500 ? 0 : 501 ) ) throw new Error( 'Bulk references must be published only after initialization; single make must append immediately' )
				return fill.call( this, state, index, product )
			}
			for( const name of [ 'create', 'save_dataset', 'benchmark_search', 'add_one' ] ) {
				const original = app[ name ]
				let entry
				// Observe native method calls without changing their work or clocks.
				app[ name ] = function( ...args ) {
					if( !entry || entry.end !== undefined ) trace.push( entry = { name, start: performance.now(), attempts: 0 } )
					++entry.attempts
					const value = original.apply( this, args )
					entry.end = performance.now()
					entry.value = value
					return value
				}
			}
			const reload = app.request_reload
			app.request_reload = function( ...args ) {
				sessionStorage.setItem( 'rise-goods-timing-check', JSON.stringify( trace ) )
				return reload.apply( this, args )
			}
		} )
		await page.getByRole( 'button', { name: 'Запустить бенчмарк', exact: true } ).click()
		await page.waitForFunction( ()=> globalThis.$?.$rise_app.Root( 0 ).Bench().Goods().Metrics().runs()[ 0 ]?.state() === 'Готово' )
		const trace = await page.evaluate( ()=> JSON.parse( sessionStorage.getItem( 'rise-goods-timing-check' ) ) )
		assert.deepEqual( trace.map( entry => entry.name ), [ 'create', 'save_dataset', 'benchmark_search', 'add_one', 'save_dataset' ] )
		for( let index = 1; index < trace.length; ++index ) assert.ok( trace[ index ].start >= trace[ index - 1 ].end, 'Stages must not overlap' )
		const measured = await page.evaluate( ()=> globalThis.$.$rise_app.Root( 0 ).Bench().Goods().Metrics().records()[ 0 ] )
		assert.equal( measured[ 'Полей' ], 10 )
		for( const [ index, column ] of [ [ 0, 'Создание, с' ], [ 3, 'Добавить 1, с' ] ] ) {
			const entry = trace[ index ]
			assert.equal( measured[ column ], ( entry.value / 1000 ).toFixed( 3 ) )
			assert.ok( Math.abs( entry.end - entry.start - entry.value ) < 30, `${column}: native call and reported clock must agree` )
		}
		assert.ok( trace[ 0 ].attempts > 1, 'Creation must exercise real asynchronous replay' )
		console.log( 'Native timing boundaries', JSON.stringify({ trace, measured }) )
		for( const column of [ 'Создание, с', 'Поиск, с', 'Добавить 1, с', 'F5, с', 'Поиск после F5, с' ] ) {
			assert.match( measured[ column ], /^\d+\.\d{3}$/ )
			resultBenchmarkValue( `500 × 10: ${column}`, Number( measured[ column ] ), 's' )
		}
		const persisted = await page.evaluate( ()=> globalThis.$.$mol_wire_async( ()=> {
			const app = globalThis.$.$rise_app.Root( 0 ).Bench().Goods()
			return Array.from( app.products(), product => ({ title: product.Title().val(), description: product.Description().val(), tags: product.Tags().items().length }) )
		} )() )
		assert.equal( persisted.length, 501 )
		assert.ok( persisted.every( product => product.title && product.description && product.tags === 5 ) )
		console.log( '[metrics screenshot]', await screenshot( page, 'goods-metrics.png' ) )
		const rows = await page.locator( '[rise_bench_baza_goods_table_row]' ).count()
		assert.ok( rows > 0 && rows < 100, `Expected virtualized rows, got ${rows}` )
		resultStep( 'Правая страница помещается в широком и узком окне', [ '$rise_bench_baza_goods.Records' ] )
		for( const width of [ 2048, 700, 320 ] ) {
			await page.setViewportSize({ width, height: 900 })
			await page.waitForFunction( width => {
				const app = globalThis.$.$rise_app.Root( 0 )
				const root = app.dom_node()
				const records = app.Bench().Goods().Records().dom_node()
				return width === 2048
					? root.scrollWidth <= root.clientWidth + 1
					: records.getBoundingClientRect().width <= width + 1
						&& records.getBoundingClientRect().width >= Math.min( 640, width ) - 1
			}, width )
			await page.locator( '[rise_bench_baza_goods_records]' ).scrollIntoViewIfNeeded()
			console.log( '[layout screenshot]', await screenshot( page, `goods-layout-${width}.png` ) )
		}
		resultStep( 'Сравнение с IndexedDB через $mol_db', [ '$rise_bench_idb.benchmark', '$rise_bench_idb_storage.create', '$rise_bench_idb_storage.search', '$rise_bench_idb_storage.add' ] )
		await page.setViewportSize({ width: 1440, height: 900 })
		await page.getByRole( 'link', { name: 'Сущности IDB', exact: true } ).click()
		let previousDatabase = ''
		for( const [ index, count ] of [ 100, 500 ].entries() ) {
			await page.getByRole( 'checkbox', { name: String( count ), exact: true } ).click()
			await page.getByRole( 'checkbox', { name: index ? '10 свойств' : '4 свойства', exact: true } ).click()
			const before = navigations
			await page.getByRole( 'button', { name: 'Запустить бенчмарк', exact: true } ).click()
			await page.waitForFunction( expected => {
				const app = globalThis.$?.$rise_app.Root( 0 ).Bench().Idb()
				return app?.Metrics().runs().length === expected && app.Metrics().runs()[ 0 ].state() === 'Готово'
			}, index + 1 )
			assert.ok( navigations > before, 'IDB benchmark must really reload' )
			const result = await page.evaluate( ()=> globalThis.$.$mol_wire_async( ()=> {
				const app = globalThis.$.$rise_app.Root( 0 ).Bench().Idb()
				return { count: globalThis.$.$mol_wire_sync( app.storage() ).count(), name: app.dataset_name(), rows: app.Table().rows().length, last: app.products().at(-1).id, metrics: app.Metrics().records() }
			} )() )
			assert.equal( result.count, count + 1 )
			assert.notEqual( result.name, previousDatabase )
			previousDatabase = result.name
			assert.equal( result.rows, count + 1 )
			assert.equal( result.last, String( count ).padStart( 5, '0' ) )
			assert.equal( result.metrics[ 0 ][ 'Версия Гипербазы' ], '—' )
			for( const column of [ 'Создание, с', 'Поиск, с', 'Добавить 1, с', 'F5, с', 'Поиск после F5, с' ] ) assert.match( result.metrics[ 0 ][ column ], /^\d+\.\d{3}$/ )
			console.log( 'IndexedDB metrics', JSON.stringify( result.metrics[ 0 ] ) )
		}
		await page.getByRole( 'button', { name: 'Очистить', exact: true } ).click()
		await page.waitForFunction( previous => globalThis.$.$rise_app.Root( 0 ).Bench().Idb().dataset_name() !== previous, previousDatabase )
		assert.equal( await page.evaluate( ()=> globalThis.$.$mol_wire_async( ()=> globalThis.$.$mol_wire_sync( globalThis.$.$rise_app.Root( 0 ).Bench().Idb().storage() ).count() )() ), 0 )
		console.log( '[IDB screenshot]', await screenshot( page, 'idb-metrics.png' ) )
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
