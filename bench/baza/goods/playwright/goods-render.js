const assert = require( 'node:assert/strict' )
const fs = require( 'node:fs' )
const path = require( 'node:path' )
const {
	chromium, headless, screenshot, reportsDir, actionOnce,
	resultScenario, resultStep, resultBenchmarkValue,
} = require( '../../../../../shm/hitalama/playwright/harness' )

resultScenario({
	title: '1000 товаров: штатный виртуальный список и Giper Baza',
	group: 'entities',
})

const count = process.argv.includes('--10000') ? 10000 : process.argv.includes('--3000') ? 3000 : 1000
const createLabel = 'Создать записи'
const lastName = `Zen Travel Watch ${String(count - 1).padStart(5,'0')}`

const url = 'http://localhost:9080/rise/bench/baza/goods/-/test.html'

async function selectChoice(page, name) {
	const choice = page.getByRole('checkbox', { name, exact: true })
	if(await choice.getAttribute('aria-checked') !== 'true') await choice.click()
}

async function selectFilter(page, component, label) {
	await page.locator(`[rise_bench_baza_goods_${component}_filter]`).getByRole('checkbox').first().click()
	await page.getByRole('button', { name: label, exact: true }).click()
}

async function checkFilters(page, storage) {
	resultStep(`Фильтры цвета и статуса: ${storage}`, ['$rise_bench_baza_goods_table.rows', '$rise_bench_baza_goods_table.row_status'])
	const red = Math.ceil(count / 3)
	const expectRows = async expected=> {
		await page.waitForFunction(expected=> {
			try { return globalThis.$.$rise_bench_baza_goods.Root(0).Table().rows().length === expected }
			catch(error) { if(error?.then) return false; throw error }
		}, expected)
		if(expected === 0) await page.locator('[rise_bench_baza_goods_table_row]').waitFor({ state: 'detached' })
	}
	await selectFilter(page, 'color', 'red')
	await expectRows(red)
	await selectFilter(page, 'status', 'Sale')
	await expectRows(0)
	await selectFilter(page, 'status', 'Store')
	await expectRows(red)
	await page.getByPlaceholder('Название товара', { exact: true }).fill('Keyboard')
	await expectRows(Array.from({length:count}, (_,i)=>i).filter(i=>i % 3 === 0 && i % 10 === 4).length)
	await screenshot(page, `filters-${storage}.png`)
	await page.getByPlaceholder('Название товара', { exact: true }).press('Escape')
	await expectRows(red)
	await page.locator('[rise_bench_baza_goods_table_row]').first().getByRole('checkbox', { name: 'Sale', exact: true }).click()
	await expectRows(red - 1)
	await selectFilter(page, 'status', 'All statuses')
	await expectRows(red)
	await page.locator('[rise_bench_baza_goods_table_row]').first().getByRole('checkbox', { name: 'Store', exact: true }).click()
	const changedId = await page.locator('[rise_bench_baza_goods_table_row]').first().locator('[mol_check_title]').first().textContent()
	await page.locator('[rise_bench_baza_goods_table_row]').first().getByRole('checkbox', { name: 'red', exact: true }).click()
	await page.getByRole('button', { name: 'blue', exact: true }).click()
	await expectRows(red - 1)
	await selectFilter(page, 'color', 'All colors')
	await expectRows(count)
	await page.locator('[rise_bench_baza_goods_table_row]').filter({ has: page.getByRole('checkbox', { name: changedId, exact: true }) }).getByRole('checkbox', { name: 'blue', exact: true }).click()
	await page.getByPlaceholder(/^(Filter|Фильтр)/).fill('red')
	await page.getByRole('button', { name: 'red', exact: true }).click()
	await page.locator('[rise_bench_baza_goods_color_filter]').getByRole('checkbox').first().click()
	await page.getByText(`Товары: ${count} записей`, { exact: true }).click()
	await page.waitForFunction(()=>!globalThis.$.$rise_bench_baza_goods.Root(0).Color_filter().showed())
	await page.locator('[rise_bench_baza_goods_status_filter]').getByRole('checkbox').first().click()
	await page.keyboard.press('Escape')
	await page.waitForFunction(()=>!globalThis.$.$rise_bench_baza_goods.Root(0).Status_filter().showed())
}

async function checkCommands(page) {
	const saved = []
	for(const schema of ['full', 'compact']) for(const storage of ['single', 'area']) for(const size of [1000, 3000, 10000]) {
		console.log('[commands]', schema, storage, size)
		await selectChoice(page, schema === 'full' ? '10 свойств' : '4 свойства')
		resultStep(`Add 1 и Reset: ${storage}, ${size}`, ['$rise_bench_baza_goods.add_one', '$rise_bench_baza_goods.reset', '$rise_bench_baza_goods_table.rows'])
		await selectChoice(page, storage === 'single' ? 'Один Land на все записи' : 'Своя Area на каждую запись')
		await page.waitForFunction(storage=>globalThis.$.$rise_bench_baza_goods.Root(0).storage_mode() === storage, storage)
		await selectChoice(page, String(size))
		await page.waitForFunction(({storage,size})=> {
			const app = globalThis.$.$rise_bench_baza_goods.Root(0)
			return app.storage_mode() === storage && app.record_count() === size
		}, {storage,size})
		await page.getByRole('button', { name: 'Сбросить', exact: true }).click()
		await page.locator('[rise_bench_baza_goods_table_row]').waitFor({ state: 'detached' })
		assert.equal(await page.evaluate(()=>globalThis.$.$rise_bench_baza_goods.Root(0).dataset_link()), '')
		for(let index = 0; index < 2; ++index) {
			const started = Date.now()
			await page.getByRole('button', { name: 'Добавить запись', exact: true }).click()
			await page.waitForFunction(expected=>globalThis.$.$rise_bench_baza_goods.Root(0).products().length === expected, index + 1)
			await page.waitForFunction(expected=>document.querySelector('[rise_bench_baza_goods_table_name]')?.textContent === globalThis.$.$rise_bench_baza_goods_product_name(expected), index)
			resultBenchmarkValue(`Добавить запись ${index + 1}`, Date.now() - started, 'ms')
		}
		await checkIndexes(page)
		if(storage === 'area') await checkIndexRecovery(page)
		const fixture = await page.evaluate(()=>globalThis.$.$mol_wire_async(()=> {
			const app = globalThis.$.$rise_bench_baza_goods.Root(0)
			return { link: app.dataset_link(), ids: Array.from(app.products(), product=>product.Id().val()), links: app.product_links().map(link=>link.str) }
		})())
		assert.deepEqual(fixture.ids, ['00000', '00001'])
		assert.equal(new Set(fixture.links).size, 2)
		if(schema === 'compact') {
			const fields = await page.evaluate(()=>globalThis.$.$mol_wire_async(()=>Array.from(globalThis.$.$rise_bench_baza_goods.Root(0).products(), product=>product.keys().slice().sort()))())
			assert(fields.every(keys=>JSON.stringify(keys) === JSON.stringify(['Color','Id','Status','Title'])))
			assert.equal(await page.locator('[rise_bench_baza_goods_table_description]').count(), 0)
		}
		saved.push({ schema, storage, size, link: fixture.link })
		await page.reload({ waitUntil: 'domcontentloaded' })
		await page.getByText('Aurora Wireless Headphones 00001', { exact: true }).waitFor()
		assert.equal(await page.evaluate(()=>globalThis.$.$rise_bench_baza_goods.Root(0).products().length), 2)
		await screenshot(page, `commands-${schema}-${storage}-${size}.png`)
	}
	for(const fixture of saved) {
		await selectChoice(page, fixture.schema === 'full' ? '10 свойств' : '4 свойства')
		await selectChoice(page, fixture.storage === 'single' ? 'Один Land на все записи' : 'Своя Area на каждую запись')
		await page.waitForFunction(storage=>globalThis.$.$rise_bench_baza_goods.Root(0).storage_mode() === storage, fixture.storage)
		await selectChoice(page, String(fixture.size))
		await page.waitForFunction(({schema,storage,size,link})=> {
			const app = globalThis.$.$rise_bench_baza_goods.Root(0)
			return app.schema_mode() === schema && app.storage_mode() === storage && app.record_count() === size && app.dataset_link() === link
		}, fixture)
		await page.getByText('Aurora Wireless Headphones 00001', { exact: true }).waitFor()
		assert.equal(await page.evaluate(()=>globalThis.$.$rise_bench_baza_goods.Root(0).dataset_link()), fixture.link)
	}
	resultStep('Повторный Reset и Add 1 после F5', ['$rise_bench_baza_goods.reset', '$rise_bench_baza_goods.add_one'])
	await page.getByPlaceholder('Название товара', { exact: true }).fill('nonexistent')
	await page.getByRole('button', { name: 'Сбросить', exact: true }).click()
	await page.getByRole('button', { name: 'Сбросить', exact: true }).click()
	await page.getByRole('button', { name: 'Добавить запись', exact: true }).click()
	await page.getByText('Aurora Wireless Notebook 00000', { exact: true }).waitFor()
	assert.notEqual(await page.evaluate(()=>globalThis.$.$rise_bench_baza_goods.Root(0).dataset_link()), saved.at(-1).link)
	await page.getByRole('button', { name: 'Сбросить', exact: true }).click()
	await page.reload({ waitUntil: 'domcontentloaded' })
	assert.equal(await page.getByPlaceholder('Название товара', { exact: true }).inputValue(), '')
	assert.equal(await page.evaluate(()=>globalThis.$.$rise_bench_baza_goods.Root(0).dataset_link()), '')
	await page.getByRole('button', { name: 'Добавить запись', exact: true }).click()
	await page.getByText('Aurora Wireless Notebook 00000', { exact: true }).waitFor()
	const newLink = await page.evaluate(()=>globalThis.$.$rise_bench_baza_goods.Root(0).dataset_link())
	assert.notEqual(newLink, saved.at(-1).link)
	await page.setViewportSize({ width: 800, height: 900 })
	await screenshot(page, 'commands-narrow.png')
	await page.setViewportSize({ width: 1440, height: 900 })
	await page.evaluate(()=>document.documentElement.setAttribute('mol_theme', '$mol_theme_light'))
	await screenshot(page, 'commands-light.png')
	await page.evaluate(()=>document.documentElement.setAttribute('mol_theme', '$mol_theme_dark'))
}

async function checkSearch( page, storage ) {
	resultStep( `Поиск по названию: ${ storage }`, [ '$rise_bench_baza_goods_table.rows', '$mol_dimmer.parts' ] )
	const input = page.getByPlaceholder('Название товара', { exact: true })
	for( const [ query, expected ] of [ [ '  aUrOrA   KeYbOaRd  ', count / 100 ], [ 'Keyboard', count / 10 ], [ 'nonexistent_[.*]', 0 ], [ '', count ] ] ) {
		await page.evaluate(()=> { globalThis.__searchStart = performance.now() })
		if( query ) await input.fill(query)
		else await input.press('Escape')
		const found = await page.evaluate(()=> globalThis.$.$mol_wire_async(()=> ({
			count: globalThis.$.$rise_bench_baza_goods.Root(0).Table().rows().length,
			ms: performance.now() - globalThis.__searchStart,
		}))() )
		assert.equal(found.count, expected, `Wrong match count for ${ query }`)
		resultBenchmarkValue(`Поиск ${ query || 'очистить' }: ${ storage }`, found.ms, 'ms')
		if( expected === 0 ) await page.locator('[rise_bench_baza_goods_table_row]').waitFor({ state: 'detached' })
		else {
			await page.waitForFunction( query => {
				const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
				const names = [...document.querySelectorAll('[rise_bench_baza_goods_table_name]')]
				return names.length > 0 && names.every(name=>terms.every(term=>name.textContent.toLowerCase().includes(term)))
			}, query )
			if( query ) assert(await page.locator('[rise_bench_baza_goods_table_name] [mol_dimmer_high]').count() > 0)
			const links = page.locator('[rise_bench_baza_goods_table_title]')
			const ids = await page.locator('[rise_bench_baza_goods_table_row]').evaluateAll(rows=>rows.map(row=>Number(row.querySelector('[mol_check_title]')?.textContent)))
			assert(ids.every((id, index)=>index === 0 || id < ids[index - 1]), 'Rows must be newest first, including search results')
			assert(await links.count() > 0)
			assert.notEqual(await links.first().getAttribute('mol_link_current'), 'true')
			assert.match(await links.first().getAttribute('href'), /^https:\/\/xkcd\.com\/\d+\/$/)
			if( query === 'Keyboard' ) await screenshot(page, `search-${storage}-keyboard.png`)
		}
	}
	await screenshot(page, `search-${storage}-cleared.png`)
}

async function checkExtended(page) {
	const data = await page.evaluate(()=>globalThis.$.$mol_wire_async(()=> {
		const app = globalThis.$.$rise_bench_baza_goods.Root(0)
		const product = app.products().at(-1)
		const catalog = app.dataset().Tags().items().map(link=>link.str)
		const links = product.Tags().items().map(link=>link.str)
		return { catalog, links, names: product.Tags().remote_list().map(tag=>tag.Title().val()), description: product.Description().val() }
	})())
	assert.equal(data.catalog.length, 20)
	assert.equal(new Set(data.catalog).size, 20)
	assert.equal(data.links.length, 5)
	assert.equal(new Set(data.links).size, 5)
	assert(data.links.every(link=>data.catalog.includes(link)))
	assert(data.names.every(Boolean))
	assert(data.description.includes('local CRDT benchmark'))
}

async function checkIndexes(page) {
	const data = await page.evaluate(()=>globalThis.$.$mol_wire_async(()=> {
		const app = globalThis.$.$rise_bench_baza_goods.Root(0)
		const dataset = app.dataset()
		const color = dataset.Color_index()?.remote()
		const status = dataset.Status_index()?.remote()
		return {
			area: app.area_mode(), root: dataset.land().link().str,
			links: app.product_links().map(link=>link.str),
			color: color && { land: color.land().link().str, ready: color.Ready()?.val(), buckets: ['red','green','blue'].map(key=>color.bucket(key)?.items().map(link=>link.str) ?? []) },
			status: status && { land: status.land().link().str, ready: status.Ready()?.val(), buckets: ['minor','major','critical'].map(key=>status.bucket(key)?.items().map(link=>link.str) ?? []) },
		}
	})())
	if(!data.area) { assert.equal(data.color ?? null, null); assert.equal(data.status ?? null, null); return }
	assert.equal(new Set([data.root,data.color.land,data.status.land]).size, 3)
	for(const index of [data.color,data.status]) {
		assert.equal(index.ready, true)
		const links = index.buckets.flat()
		assert.equal(links.length, data.links.length)
		assert.equal(new Set(links).size, data.links.length)
		assert.deepEqual([...links].sort(), [...data.links].sort())
	}
}

async function checkColdIndex(page) {
	resultStep('Индекс после F5: без распаковки всех Area', ['$rise_bench_baza_goods_table.index_matches', '$rise_bench_baza_goods_index.bucket'])
	const started = Date.now()
	await selectFilter(page, 'color', 'red')
	await page.waitForFunction(expected=> {
		try { return globalThis.$.$rise_bench_baza_goods.Root(0).Table().rows().length === expected }
		catch(error) { if(error?.then) return false; throw error }
	}, Math.ceil(count / 3))
	await page.locator('[rise_bench_baza_goods_table_row]').first().getByRole('checkbox', { name: 'red', exact: true }).waitFor()
	resultBenchmarkValue('Color: холодный индекс после F5', Date.now() - started, 'ms')
	const loaded = await page.evaluate(()=> {
		const lands = new Set(globalThis.$.$rise_bench_baza_goods.Root(0).product_links().map(link=>link.land().str))
		return new Set(globalThis.__indexReads.filter(link=>lands.has(link))).size
	})
	assert(loaded > 0 && loaded < 30, `Indexed filter read ${loaded} product Areas`)
	resultBenchmarkValue('Area записей, прочитанных после F5 и фильтра', loaded, 'areas')
	await screenshot(page, 'cold-index.png')
	await selectFilter(page, 'color', 'All colors')
}

async function checkIndexRecovery(page) {
	resultStep('Восстановить отсутствующий и незавершённый индекс', ['$rise_bench_baza_goods.rebuild_indexes', '$rise_bench_baza_goods_table.index_matches'])
	for(const missing of [false,true]) {
		await actionOnce(page, missing=> {
			const dataset = globalThis.$.$rise_bench_baza_goods.Root(0).dataset()
			if(missing) dataset.Color_index().val(null)
			else dataset.Color_index().remote().Ready().val(false)
		}, missing)
		await selectFilter(page, 'color', 'red')
		await page.getByText('Aurora Wireless Notebook 00000', { exact: true }).waitFor()
		assert.equal(await page.evaluate(()=>globalThis.$.$rise_bench_baza_goods.Root(0).Table().rows().length), 1)
		for(let repeat = 0; repeat < 2; ++repeat) {
			const started = Date.now()
			await page.getByRole('button', { name: 'Перестроить индексы', exact: true }).click()
			await page.waitForFunction(()=> {
				try { const app = globalThis.$.$rise_bench_baza_goods.Root(0); const dataset = app.dataset(); return !globalThis.$.$mol_promise_like(app.Rebuild_indexes().status()?.[0]) && dataset.Color_index()?.remote()?.Ready()?.val() && dataset.Status_index()?.remote()?.Ready()?.val() }
				catch(error) { if(error?.then) return false; throw error }
			})
			await checkIndexes(page)
			resultBenchmarkValue(`Перестроить индекс: ${missing ? 'отсутствующий' : 'незавершённый'}, ${repeat + 1}`, Date.now() - started, 'ms')
		}
		await selectFilter(page, 'color', 'All colors')
	}
}

async function checkCatalog(page) {
	resultStep('Открыть единственное приложение в каталоге', ['$rise_bug.spread_classes', '$rise_bench_baza_goods.count_mode'])
	const unitTests = page.waitForEvent('console', { predicate: message=>message.text().includes('All tests passed'), timeout: 60_000 })
	await page.goto('http://localhost:9080/rise/bug/-/test.html', { waitUntil: 'domcontentloaded', timeout: 120_000 })
	await unitTests
	const link = page.getByRole('link', { name: '$rise_bench_baza_goods', exact: true })
	await link.waitFor()
	assert.deepEqual(await page.evaluate(()=>globalThis.$.$rise_bug.Root(0).spread_classes()), ['$rise_bench_baza_goods'])
	await link.click()
	await selectChoice(page, '10000')
	await selectChoice(page, 'Своя Area на каждую запись')
	await page.getByRole('button', { name: 'Добавить запись', exact: true }).click()
	await page.getByText('Aurora Wireless Notebook 00000', { exact: true }).waitFor()
	await page.reload({ waitUntil: 'domcontentloaded' })
	await page.getByText('Aurora Wireless Notebook 00000', { exact: true }).waitFor()
	const state = await page.evaluate(()=>globalThis.$.$mol_wire_async(()=> {
		const app = globalThis.$.$rise_bug.Root(0).Spread('$rise_bench_baza_goods')
		return { count: app.record_count(), mode: app.storage_mode(), records: app.products().length, colorReady: app.dataset().Color_index().remote().Ready().val() }
	})())
	assert.deepEqual(state, { count: 10000, mode: 'area', records: 1, colorReady: true })
	await screenshot(page, 'catalog-goods.png')
}

async function main() {
	console.log('[stage] launch')
	const browser = await chromium.launch({ headless: headless() })
	const deadline = setTimeout(()=> { console.error('[deadline] Closing benchmark browser'); browser.close().catch(()=> {}) }, 240_000)
	console.log('[stage] browser ready')
	const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
	const page = await context.newPage()
	await context.addInitScript(()=> {
		globalThis.__indexReads = []
		const getAll = IDBObjectStore.prototype.getAll
		IDBObjectStore.prototype.getAll = function(...args) {
			globalThis.__indexReads.push(args[0]?.lower?.[0] ?? '')
			return getAll.apply(this,args)
		}
	})
	console.log('[stage] page ready')
	const results = []
	const unstable = []
	const errors = []
	page.on('crash', ()=> { console.error('[browser] Renderer crashed'); browser.close().catch(()=> {}) })
	page.on('console', message=> {
		if(/Different (host|args|task) on restart/.test(message.text())) {
			if(!unstable.length) console.error('[unstable]', message.text())
			unstable.push(message.text())
		}
	})
	page.on('pageerror', error=> { errors.push(error.message); console.error('[browser]', error.message) })
	try {
		resultStep( `Создать ${count} товаров в одной land`, [ '$rise_bench_baza_goods.create' ] )
		// Let bundled unit tests finish before the benchmark monopolizes the main thread.
		const unitTests = page.waitForEvent('console', { predicate: message=>message.text().includes('All tests passed'), timeout: 60_000 })
		await page.goto( url, { waitUntil: 'domcontentloaded', timeout: 120_000 } )
		await unitTests
		console.log('[stage] page loaded')
		if(process.argv.includes('--catalog')) {
			await checkCatalog(page)
			assert.equal(unstable.length, 0)
			assert.deepEqual(errors, [])
			console.log('[goods] catalog checks passed')
			return
		}
		if(process.argv.includes('--commands-only')) {
			await checkCommands(page)
			assert.equal(unstable.length, 0)
			assert.deepEqual(errors, [])
			console.log('[goods] command checks passed')
			return
		}
		if( count !== 1000 ) await page.getByRole('checkbox', { name: String(count), exact: true }).click()
		await page.getByRole( 'button', { name: createLabel, exact: true } ).click({ timeout: 120_000 } )
		console.log('[stage] creation clicked')
		await page.getByText( lastName, { exact: true } ).waitFor({ timeout: 90_000 } )
		await page.waitForFunction(count=> globalThis.$.$rise_bench_baza_goods.Root( 0 ).products().length === count, count, { timeout: 60_000 } )
		const fixture = await page.evaluate( ()=> globalThis.$.$mol_wire_async(()=> {
			const app = globalThis.$.$rise_bench_baza_goods.Root( 0 )
			const products = app.products()
			return {
				creationMs: app.creation_ms(), count: products.length,
				unique: new Set( products.map( product => product.link().str ) ).size,
				valid: products.every( ( product, index )=>
					product.Id().val() === String( index ).padStart( 5, '0' ) &&
					product.Title().val() === globalThis.$.$rise_bench_baza_goods_product_name( index ) &&
					product.Quantity().val() === index % 100 &&
					product.Checked().val() === false &&
					product.Color().val() === [ 'red', 'green', 'blue' ][ index % 3 ] &&
					product.Status().val() === [ 'minor', 'major', 'critical' ][ index % 3 ] &&
					product.Uri().val() === `https://xkcd.com/${ index + 1 }/` &&
					product.Supply().val().toString( 'YYYY-MM-DD' ) === '2026-10-05' &&
					product.Description().val().includes(product.Title().val()) &&
					product.Tags().items().length === 5 &&
					new Set(product.Tags().items().map(link=>link.str)).size === 5 &&
					product.Tags().remote_list().every(tag=>tag.Title().val())
				),
			}
		})() )
		assert.equal( fixture.unique, count )
		assert.equal( fixture.valid, true )
		await checkIndexes(page)
		resultBenchmarkValue( `Создание ${count} записей, без инициализации land`, fixture.creationMs, 'ms' )
		results.push({ operation: 'create', ...fixture })
		console.log( '[goods] creation', fixture.creationMs )

		const domRows = await page.locator( '[rise_bench_baza_goods_table_row]' ).count()
		assert( domRows > 0 && domRows < count, 'Table must open automatically and remain virtualized' )
		resultBenchmarkValue( 'Строки в DOM', domRows, 'rows' )
		resultStep( 'Прокрутить до последней записи', [ '$mol_list.view_window', '$rise_bench_baza_goods_table.row_title' ] )
		await page.locator( '[rise_bench_baza_goods_records] [mol_page_body]' ).evaluate( element => { element.scrollTop = element.scrollHeight } )
		await page.getByText( 'Aurora Wireless Notebook 00000', { exact: true } ).waitFor({ timeout: 60_000 } )
		await screenshot( page, 'last-record.png' )
		resultStep( 'Вернуться к первой записи', [ '$mol_list.view_window' ] )
		await page.locator( '[rise_bench_baza_goods_records] [mol_page_body]' ).evaluate( element => { element.scrollTop = 0 } )
		await page.getByText( lastName, { exact: true } ).waitFor({ timeout: 60_000 } )
		await screenshot( page, 'first-records.png' )
		await checkSearch(page, 'single')
		await checkFilters(page, 'single')
		resultStep( 'Переключить схему на areas и создать отдельный набор', [ '$rise_bench_baza_goods.storage_mode', '$rise_bench_baza_goods.create' ] )
		const singleLink = await page.evaluate(()=> globalThis.$.$rise_bench_baza_goods.Root(0).dataset_link())
		await page.getByRole('checkbox', { name: 'Своя Area на каждую запись', exact: true }).click()
		await page.getByRole('button', { name: createLabel, exact: true }).waitFor()
		assert.equal(await page.getByRole('button', { name: createLabel, exact: true }).isEnabled(), true)
		await page.getByRole('button', { name: createLabel, exact: true }).click()
		await page.getByText(lastName, { exact: true }).waitFor({ timeout: 120_000 })
		const areas = await page.evaluate(()=> {
			const app = globalThis.$.$rise_bench_baza_goods.Root(0)
			return { link: app.dataset_link(), count: app.products().length, lands: new Set(app.products().map(product=>product.land().link().str)).size }
		})
		assert.equal(areas.count, count)
		assert.equal(areas.lands, count)
		assert.notEqual(areas.link, singleLink)
		await checkExtended(page)
		await checkIndexes(page)
		await screenshot(page, 'areas.png')
		resultStep( 'Вернуться к 1 land и сохранить выбор после F5', [ '$rise_bench_baza_goods.storage_mode', '$rise_bench_baza_goods.dataset_link' ] )
		await page.getByRole('checkbox', { name: 'Один Land на все записи', exact: true }).click()
		await page.getByText(lastName, { exact: true }).waitFor()
		assert.equal(await page.evaluate(()=> globalThis.$.$rise_bench_baza_goods.Root(0).dataset_link()), singleLink)
		await page.getByRole('checkbox', { name: 'Своя Area на каждую запись', exact: true }).click()
		await page.getByText(lastName, { exact: true }).waitFor()
		await page.reload({ waitUntil: 'domcontentloaded' })
		await page.getByText(lastName, { exact: true }).waitFor()
		assert.equal(await page.getByRole('checkbox', { name: 'Своя Area на каждую запись', exact: true }).getAttribute('aria-checked'), 'true')
		assert.equal(await page.evaluate(()=> globalThis.$.$rise_bench_baza_goods.Root(0).dataset_link()), areas.link)
		assert.equal(await page.getByRole('checkbox', { name: String(count), exact: true }).getAttribute('aria-checked'), 'true')
		await checkExtended(page)
		await checkColdIndex(page)
		await checkIndexes(page)
		await checkSearch(page, 'area')
		await checkFilters(page, 'area')
		resultStep('Переключить размер и вернуться к сохранённому набору', [ '$rise_bench_baza_goods.count_mode', '$rise_bench_baza_goods.dataset_link' ])
		await page.getByRole('checkbox', { name: String(count === 3000 ? 1000 : 3000), exact: true }).click()
		assert.equal(await page.getByRole('button', { name: 'Создать записи', exact: true }).isEnabled(), true)
		assert.equal(await page.evaluate(()=> globalThis.$.$rise_bench_baza_goods.Root(0).dataset_link()), '')
		await page.getByRole('checkbox', { name: String(count), exact: true }).click()
		await page.getByText(lastName, { exact: true }).waitFor()
		assert.equal(await page.evaluate(()=> globalThis.$.$rise_bench_baza_goods.Root(0).dataset_link()), areas.link)
		resultStep('Добавить запись к заполненному набору', ['$rise_bench_baza_goods.add_one', '$rise_bench_baza_goods_table.rows'])
		await page.getByRole('button', { name: 'Добавить запись', exact: true }).click()
		await page.waitForFunction(expected=>globalThis.$.$rise_bench_baza_goods.Root(0).products().length === expected, count + 1)
		const added = await page.evaluate(()=>globalThis.$.$mol_wire_async(()=> {
			const app = globalThis.$.$rise_bench_baza_goods.Root(0)
			return { id: app.products().at(-1).Id().val(), name: app.products().at(-1).Title().val(), first: app.products()[0].Id().val() }
		})())
		assert.equal(added.id, String(count).padStart(5, '0'))
		assert.equal(added.first, '00000')
		await checkExtended(page)
		await checkIndexes(page)
		await page.waitForFunction(name=>document.querySelector('[rise_bench_baza_goods_table_name]')?.textContent === name, added.name)
		await checkCommands(page)
		assert.equal(unstable.length, 0)
		assert.deepEqual(errors, [])
		fs.mkdirSync( reportsDir, { recursive: true } )
		fs.writeFileSync( path.join( reportsDir, 'goods-render.json' ), JSON.stringify({ url, viewport: '1440x900', count, storage: 'single and area; eight separate CRDT fields', results, unstable, errors }, null, 2 ) )
		console.log( '[goods] fixture and scroll checks passed' )
	} catch( error ) {
		console.error('[state]', await page.evaluate(()=> {
			const $ = globalThis.$
			const app = $?.$rise_bench_baza_goods.Root(0)
			return app && { storage: app.storage_mode(), count: app.record_count(), link: app.dataset_link(), hash: location.hash }
		}).catch(()=> null))
		await screenshot( page, 'failure.png' ).catch(()=> {})
		throw error
	} finally {
		clearTimeout(deadline)
		await context.close().catch(()=> {})
		await browser.close().catch(()=> {})
	}
}

main().catch( error => { console.error( error ); process.exitCode = 1 } )
