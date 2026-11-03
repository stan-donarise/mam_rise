const assert = require( 'node:assert/strict' )
const { chromium, headless, isolateUnitTests, resultScenario, resultStep, resultBenchmark, resultBenchmarkValue, screenshot } = require( '../../../../../shm/hitalama/playwright/harness' )
const { closeTestContext } = require( '../../../../../shm/hitalama/playwright/unit-isolation' )
const { observeOffline, targetUrl, openBenchmark } = require( '../../../playwright/offline' )

resultScenario({ title: 'CRDT-текст: запись и метрики', group: 'entities' })

async function main() {
	const browser = await chromium.launch({ headless: headless(), channel: 'chrome' })
	const deadline = setTimeout( ()=> browser.close().catch( ()=> {} ), 180_000 )
	let context
	try {
		context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
		await isolateUnitTests( context )
		const page = await context.newPage()
		let navigations = 0
		page.on( 'framenavigated', frame => { if( frame === page.mainFrame() ) ++navigations } )
		const url = targetUrl()
		const assertOffline = observeOffline( page, url )
		page.setDefaultTimeout( 60_000 )
		const errors = []
		page.on( 'pageerror', error => { errors.push( error.message ); console.error( '[pageerror]', error.message ) } )
		page.on( 'console', message => {
			if( /Different (host|args|task) on restart/.test( message.text() ) ) errors.push( message.text() )
		} )
		resultStep( 'Открыть CRDT-текст в каталоге', [ '$rise_bench.Crdttext' ] )
		await openBenchmark( page, url )
		await page.getByRole( 'link', { name: 'Bench', exact: true } ).click()
		await page.getByRole( 'link', { name: '$rise_bench_baza_crdttext', exact: true } ).click()
		const editor = page.locator( '[rise_bench_baza_crdttext_editor] textarea' )
		await editor.waitFor()

		let previousLink = ''
		for( const [ index, lines ] of [ 500, 1000, 5000 ].entries() ) {
			resultStep( `Прогон ${lines} строк: вставка, символ и F5`, [ '$rise_bench_baza_crdttext.benchmark', '$rise_bench_baza_crdttext.append_one', '$rise_bench_baza_crdttext.resume_reload' ] )
			await page.getByRole( 'checkbox', { name: String( lines ), exact: true } ).click()
			const before = navigations
			await resultBenchmark( `Полный прогон ${lines} строк`, async()=> {
				await page.getByRole( 'button', { name: 'Запустить бенчмарк', exact: true } ).click()
				await page.waitForFunction( count => {
					const app = globalThis.$?.$rise_app.Root( 0 ).Bench().Crdttext()
					return app?.Metrics().runs().length === count && app.Metrics().runs()[ 0 ].state() === 'Готово'
				}, index + 1 )
			} )
			assert.ok( navigations > before, 'The benchmark must reload the whole page' )
			const content = await editor.inputValue()
			assert.equal( content.split( '\n' ).length, lines )
			assert.ok( content.startsWith( 'Строка 1:' ) && content.includes( `Строка ${lines}:` ) )
			assert.ok( content.endsWith( '.!' ) && !content.endsWith( '!!' ), 'Exactly one symbol must be appended across replay' )
			const link = await page.evaluate( ()=> globalThis.$.$rise_app.Root( 0 ).Bench().Crdttext().text_link() )
			assert.notEqual( link, previousLink, 'Each run must use a fresh Land' )
			previousLink = link
			const metrics = await page.evaluate( ()=> globalThis.$.$rise_app.Root( 0 ).Bench().Crdttext().Metrics().records() )
			assert.equal( metrics.length, index + 1 )
			assert.equal( metrics[ 0 ][ 'Объём' ], lines )
			for( const column of [ 'Вставка, с', 'Добавить символ, с', 'F5, с' ] ) {
				assert.match( metrics[ 0 ][ column ], /^\d+\.\d{3}$/ )
				resultBenchmarkValue( `${lines} строк: ${column}`, Number( metrics[ 0 ][ column ] ), 's' )
			}
			assert.ok( Number( metrics[ 0 ][ 'Скорость, симв./с' ] ) > 0 )
			console.log( 'CRDT metrics', JSON.stringify( metrics[ 0 ] ) )
		}
		const expected = await editor.inputValue()
		const completed = await page.evaluate( ()=> globalThis.$.$rise_app.Root( 0 ).Bench().Crdttext().Metrics().records() )
		assert.equal( await page.locator( '[rise_bench_baza_crdttext_metrics] [mol_grid_col_head]' ).count(), 9 )
		console.log( '[metrics screenshot]', await screenshot( page, 'crdttext-metrics.png' ) )
		assert.ok( expected.startsWith( 'Строка 1:' ) )
		assert.ok( expected.includes( 'Строка 1000:' ) )
		resultStep( 'Проверить CRDT-хранение и F5', [ '$rise_bench_baza_crdttext.document', '$rise_bench_baza_crdttext.text_link' ] )
		assert.equal( await page.evaluate( ()=> {
			const app = globalThis.$.$rise_app.Root( 0 ).Bench().Crdttext()
			return app.document() instanceof globalThis.$.$giper_baza_text
		} ), true )
		await page.reload({ waitUntil: 'domcontentloaded' })
		await page.waitForFunction( expected => document.querySelector( '[rise_bench_baza_crdttext_editor] textarea' )?.value === expected, expected )
		assert.deepEqual( await page.evaluate( ()=> globalThis.$.$rise_app.Root( 0 ).Bench().Crdttext().Metrics().records() ), completed )
		resultStep( 'Редактировать вручную и очистить новым Land', [ '$rise_bench_baza_crdttext.text', '$rise_bench_baza_crdttext.reset' ] )
		await editor.fill( 'Ручная правка\nВторая строка' )
		await page.waitForFunction( ()=> globalThis.$.$rise_app.Root( 0 ).Bench().Crdttext().document().text() === 'Ручная правка\nВторая строка' )
		const oldLink = await page.evaluate( ()=> globalThis.$.$rise_app.Root( 0 ).Bench().Crdttext().text_link() )
		await page.getByRole( 'button', { name: 'Очистить', exact: true } ).click()
		await page.waitForFunction( ()=> document.querySelector( '[rise_bench_baza_crdttext_editor] textarea' )?.value === '' )
		const clearedLink = await page.evaluate( ()=> globalThis.$.$rise_app.Root( 0 ).Bench().Crdttext().text_link() )
		assert.ok( clearedLink && clearedLink !== oldLink )
		const oldText = await page.evaluate( oldLink => globalThis.$.$mol_wire_async( ()=> globalThis.$.$giper_baza_glob.Pawn( new globalThis.$.$giper_baza_link( oldLink ), globalThis.$.$giper_baza_text ).text() )(), oldLink )
		assert.equal( oldText, 'Ручная правка\nВторая строка', 'Clear must not rewrite the previous CRDT Land' )
		await page.reload({ waitUntil: 'domcontentloaded' })
		await editor.waitFor()
		assert.equal( await editor.inputValue(), '' )
		assert.equal( await page.evaluate( ()=> globalThis.$.$rise_app.Root( 0 ).Bench().Crdttext().text_link() ), clearedLink )
		assert.deepEqual( await page.evaluate( ()=> globalThis.$.$rise_app.Root( 0 ).Bench().Crdttext().Metrics().records() ), completed )
		assert.deepEqual( errors, [] )
		await assertOffline()
		console.log( 'CRDT text: 500/1000/5000 lines, single character, measured F5, history, edit and fresh-Land clear passed' )
	} finally {
		clearTimeout( deadline )
		try { if( context ) await closeTestContext( context ) }
		finally { await browser.close() }
	}
}

main().catch( error => { console.error( error ); process.exitCode = 1 } )
