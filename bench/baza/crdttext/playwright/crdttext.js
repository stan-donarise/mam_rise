const assert = require( 'node:assert/strict' )
const { chromium, headless, isolateUnitTests, resultScenario, resultStep, resultBenchmark, screenshot } = require( '../../../../../shm/hitalama/playwright/harness' )
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

		for( const lines of [ 500, 1000 ] ) {
			resultStep( `Вставить ещё 500 строк: всего ${lines}`, [ '$rise_bench_baza_crdttext.insert', '$rise_bench_baza_crdttext.write_text' ] )
			await resultBenchmark( `Вставка до ${lines} строк в textarea`, async()=> {
				await page.getByRole( 'button', { name: 'Вставить 500 строк', exact: true } ).click()
				await page.waitForFunction( lines => {
					const input = document.querySelector( '[rise_bench_baza_crdttext_editor] textarea' )
					return input?.value.split( '\n' ).length === lines
				}, lines )
			} )
			await page.waitForFunction( count => {
				const app = globalThis.$.$rise_app.Root( 0 ).Bench().Crdttext()
				return app.Metrics().runs().length === count && app.Metrics().runs()[ 0 ].state() === 'Готово'
			}, lines / 500 )
			const metrics = await page.evaluate( ()=> globalThis.$.$rise_app.Root( 0 ).Bench().Crdttext().Metrics().records() )
			assert.equal( metrics.length, lines / 500 )
			assert.ok( metrics.every( row => row[ 'Вставка, мс' ] !== '—' && Number( row[ 'Вставка, мс' ] ) >= 0 ) )
		}
		const expected = await editor.inputValue()
		assert.equal( await page.locator( '[rise_bench_baza_crdttext_metrics] [mol_grid_col_head]' ).count(), 7 )
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
		resultStep( 'Редактировать вручную и сбросить', [ '$rise_bench_baza_crdttext.text', '$rise_bench_baza_crdttext.reset' ] )
		await editor.fill( 'Ручная правка\nВторая строка' )
		await page.waitForFunction( ()=> globalThis.$.$rise_app.Root( 0 ).Bench().Crdttext().document().text() === 'Ручная правка\nВторая строка' )
		await page.getByRole( 'button', { name: 'Сбросить', exact: true } ).click()
		await page.waitForFunction( ()=> document.querySelector( '[rise_bench_baza_crdttext_editor] textarea' )?.value === '' )
		assert.equal( await page.evaluate( ()=> globalThis.$.$rise_app.Root( 0 ).Bench().Crdttext().Metrics().runs().length ), 0 )
		assert.deepEqual( errors, [] )
		await assertOffline()
		console.log( 'CRDT text: 500/1000 lines, metrics, native storage, F5, edit and reset passed' )
	} finally {
		clearTimeout( deadline )
		try { if( context ) await closeTestContext( context ) }
		finally { await browser.close() }
	}
}

main().catch( error => { console.error( error ); process.exitCode = 1 } )
