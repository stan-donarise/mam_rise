const assert = require( 'node:assert/strict' )
const fs = require( 'node:fs' )
const path = require( 'node:path' )
const { chromium, headless, reportsDir, screenshot, resultScenario, resultStep, resultBenchmarkValue } = require( '../../../../../shm/hitalama/playwright/harness' )

resultScenario({ title: 'Восстановление локальных CRDT после F5', group: 'entities' })
const url = 'http://localhost:9080/rise/bench/baza/goods/-/test.html'
const storage = process.argv.includes( '--area' ) ? 'area' : 'single'
const count = process.argv.includes('--10000') ? 10000 : process.argv.includes('--3000') ? 3000 : 1000
const operationLimit = 120_000
const target = `${url}#!storage=${storage}/count=${count}`
const lastName = `Zen Travel Watch ${String(count - 1).padStart(5, '0')}`

function observeReload() {
	globalThis.__reload = { ready: 0, longTasks: [], reads: [] }
	document.addEventListener('click', event=> {
		if(event.target.closest('[rise_bench_baza_goods_create]')) globalThis.__createStart = performance.now()
	}, true)
	document.addEventListener('input', event=> {
		if(event.target.getAttribute('placeholder') === 'Название товара' && globalThis.__search) globalThis.__search.start = performance.now()
	}, true)
	const searchObserver = new MutationObserver(()=> {
		const search = globalThis.__search
		if(!search?.start || search.ready || search.finishing) return
		const table = document.querySelector('[rise_bench_baza_goods_table]')
		const names = [...document.querySelectorAll('[rise_bench_baza_goods_table_name]')]
		if(table?.querySelector('[mol_view_error]')) return
		const terms = search.query.toLowerCase().split(/\s+/)
		if(search.expected === 0 ? names.length !== 0 : !names.length || names[0].textContent !== search.first || !names.every(name=>terms.every(term=>name.textContent.toLowerCase().includes(term)))) return
		search.finishing = true
		requestAnimationFrame(()=>requestAnimationFrame(()=> { search.ready = performance.now() }))
	})
	searchObserver.observe(document, { childList: true, subtree: true, characterData: true, attributes: true })
	const getAll = IDBObjectStore.prototype.getAll
	IDBObjectStore.prototype.getAll = function( ...args ) {
		const start = performance.now()
		const request = getAll.apply( this, args )
		const land = args[0]?.lower?.[0] ?? ''
		request.addEventListener( 'success', ()=> globalThis.__reload.reads.push({ store: this.name, land, start, ms: performance.now() - start, count: request.result.length }) )
		return request
	}
	new PerformanceObserver( list => {
		for( const entry of list.getEntries() ) globalThis.__reload.longTasks.push({ start: entry.startTime, ms: entry.duration })
	}).observe({ type: 'longtask', buffered: true })
	let finishing = false
	const observer = new MutationObserver(()=> {
		const table = document.querySelector( '[rise_bench_baza_goods_table]' )
		const rows = [ ...document.querySelectorAll( '[rise_bench_baza_goods_table_row]' ) ]
		if( finishing || !rows.length || table?.querySelector('[mol_view_error]') || !rows.every(row=> /[A-Za-z]+ [A-Za-z]+ [A-Za-z]+ \d{5}/.test(row.textContent)) ) return
		finishing = true
		requestAnimationFrame(()=> requestAnimationFrame(()=> {
			globalThis.__reload.ready = performance.now()
			observer.disconnect()
		}) )
	})
	observer.observe( document, { childList: true, subtree: true, characterData: true, attributes: true } )

	globalThis.__install_baza_probe = $ => {
		if( !globalThis.__profile_baza ) return
		const stats = globalThis.__baza_probe = {}
		function wrap( prototype, name ) {
			const original = prototype[ name ]
			const stat = stats[ name ] = { calls: 0, completed: 0, suspended: 0, syncMs: 0, asyncMs: 0, units: 0 }
			prototype[ name ] = function( ...args ) {
				const start = performance.now()
				++stat.calls
				try {
					const result = original.apply( this, args )
					++stat.completed
					if( result?.then ) result.then( units => {
						stat.asyncMs += performance.now() - start
						if( Array.isArray( units ) ) stat.units += units.length
					}, ()=> {} )
					return result
				} catch( error ) {
					if( error?.then ) ++stat.suspended
					throw error
				} finally { stat.syncMs += performance.now() - start }
			}
		}
		wrap( $.$giper_baza_mine_idb.prototype, 'units_load' )
		for( const name of [ 'loading', 'diff_apply', 'sand_add', 'sand_decode' ] ) wrap( $.$giper_baza_land.prototype, name )
		const original = IDBObjectStore.prototype.getAll
		stats.idb_getAll = []
		IDBObjectStore.prototype.getAll = function( ...args ) {
			const start = performance.now()
			const request = original.apply( this, args )
			request.addEventListener( 'success', ()=> stats.idb_getAll.push({ store: this.name, ms: performance.now() - start, count: request.result.length }) )
			return request
		}
	}
}

async function search(page, query, expected, firstIndex) {
	await page.evaluate(({query,expected,firstIndex})=> {
		globalThis.__search = { query, expected, first: expected ? globalThis.$.$rise_bench_baza_goods_product_name(firstIndex) : '', start: 0, ready: 0, readStart: globalThis.__reload.reads.length }
	}, {query,expected,firstIndex})
	await page.getByPlaceholder('Название товара', { exact: true }).fill(query)
	await page.waitForFunction(()=>globalThis.__search.ready > 0, null, { timeout: operationLimit })
	const result = await page.evaluate(()=> {
		const app = globalThis.$.$rise_bench_baza_goods.Root(0)
		const measured = globalThis.__search
		return { query: measured.query, matches: app.Table().rows().length, ms: measured.ready - measured.start, reads: globalThis.__reload.reads.slice(measured.readStart), longTasks: globalThis.__reload.longTasks.filter(task=>task.start >= measured.start && task.start <= measured.ready) }
	})
	assert.equal(result.matches, expected)
	console.log('[search]', query, result.ms.toFixed(1), 'ms;', result.matches, 'matches')
	resultBenchmarkValue(`Поиск ${query} до отображения результатов`, result.ms, 'ms')
	return result
}

async function snapshot( page, timeout = operationLimit ) {
	await page.waitForFunction(()=> globalThis.__reload.ready > 0, null, { timeout } )
	return page.evaluate(()=> ({
		...globalThis.__reload,
		probe: globalThis.__baza_probe ?? null,
		domRows: document.querySelectorAll( '[rise_bench_baza_goods_table_row]' ).length,
		scripts: performance.getEntriesByType( 'resource' ).filter( e=> e.name.endsWith( '/web.js' ) ).map( e=> ({ start: e.startTime, end: e.responseEnd }) ),
	}) )
}

async function main() {
	const browser = await chromium.launch({ headless: headless() })
	const deadline = setTimeout(()=> { console.error('[deadline] Closing benchmark browser'); browser.close().catch(()=> {}) }, 240_000)
	const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
	await context.addInitScript( observeReload )
	const page = await context.newPage()
	const unstable = []
	const errors = []
	page.on( 'console', message => {
		if( /Different (host|args|task) on restart/.test( message.text() ) ) unstable.push( message.text() )
	})
	page.on( 'pageerror', error => { errors.push( error.message ); console.error( '[browser]', error.message ) })
	const results = []
	const searches = []
	try {
		// Freeze the app and keep development audit/hot reload out of measurements.
		const code = fs.readFileSync( path.resolve( __dirname, '../-/web.js' ), 'utf8' )
		await context.route( '**/rise/bench/baza/goods/-/web.js', route => route.fulfill({ body: code + '\n;globalThis.__install_baza_probe(globalThis.$);', contentType: 'application/javascript' }) )
		await context.route( '**/web.audit.js', route => route.fulfill({ body: '', contentType: 'application/javascript' }) )
		await context.route( '**/mol/build/client/client.js', route => route.fulfill({ body: '', contentType: 'application/javascript' }) )
		resultStep( `Подготовить локальные ${count} записей: ${storage}`, [ '$rise_bench_baza_goods.create' ] )
		await page.goto( target, { waitUntil: 'domcontentloaded' } )
		await page.getByRole( 'button', { name: 'Создать записи', exact: true } ).click({ timeout: 120_000 })
		await snapshot( page, 120_000 )
		const creation = await page.evaluate(()=> ({ objectsMs: globalThis.$.$rise_bench_baza_goods.Root(0).creation_ms(), visibleMs: globalThis.__reload.ready - globalThis.__createStart }))
		resultBenchmarkValue('Создание записей после инициализации land', creation.objectsMs, 'ms')
		resultBenchmarkValue('Нажатие создания до заполненного окна таблицы', creation.visibleMs, 'ms')
		console.log('[creation]', storage, count, JSON.stringify(creation))
		// Independent IndexedDB read confirms persistence, without forcing internal saves.
		const durable = await page.evaluate( async()=> {
			const db = await globalThis.$.$giper_baza_mine_idb.db()
			const app = globalThis.$.$rise_bench_baza_goods.Root( 0 )
			const expected = new Map([ [ app.dataset().land().link().str, app.dataset().land().total() ] ])
			for( const product of app.products() ) expected.set( product.land().link().str, product.land().total() )
			const start = performance.now()
			while( performance.now() - start < 60_000 ) {
				const keys = await new Promise( ( resolve, reject )=> {
					const request = db.read( 'Unit' ).Unit.native.getAllKeys()
					request.onsuccess = ()=> resolve( request.result )
					request.onerror = ()=> reject( request.error )
				})
				const counts = new Map()
				for( const [ land ] of keys ) counts.set( land, ( counts.get( land ) ?? 0 ) + 1 )
				if( [ ...expected ].every( ([ land, count ])=> ( counts.get( land ) ?? 0 ) >= count ) ) return {
					lands: expected.size, expected: [ ...expected.values() ].reduce( ( a, b )=> a + b, 0 ), persisted: keys.length,
					listLand: app.dataset().land().link().str,
					productLands: [ ...new Set( app.products().map( product => product.land().link().str ) ) ],
					creationMs: app.creation_ms(),
				}
				await new Promise( done => setTimeout( done, 20 ) )
			}
			throw new Error( 'Local persistence timeout' )
		})
		console.log( '[reload] persisted', { ...durable, productLands: durable.productLands.length } )
		assert.equal( durable.productLands.length, storage === 'area' ? count : 1 )
		assert.equal( durable.lands, storage === 'area' ? count + 1 : 1 )
		assert.equal( unstable.length, 0, 'Creation must have no unstable wire restart warnings' )
		for( let sample = 0; sample < 3; ++sample ) {
			resultStep( `F5 без профилировщика ${ sample + 1 }`, [ '$giper_baza_land.loading', '$giper_baza_mine_idb.units_load' ] )
			await page.reload({ waitUntil: 'domcontentloaded' })
			const result = { sample, ...await snapshot( page ) }
			assert( result.domRows > 0 && result.domRows < 100, 'Table must open automatically with virtualized rows' )
			const productReads = result.reads.filter( read => durable.productLands.includes( read.land ) && read.land !== durable.listLand )
			result.productAreas = new Set(productReads.map(read=>read.land)).size
			if( storage === 'area' ) assert.equal( result.productAreas, result.domRows, 'Only displayed record areas should load' )
			results.push( result )
			resultBenchmarkValue( 'F5 до заполненного окна таблицы', result.ready, 'ms' )
			resultBenchmarkValue( 'Самая длинная блокировка главного потока', Math.max( 0, ...result.longTasks.map( e=> e.ms ) ), 'ms' )
			console.log( '[reload]', JSON.stringify( result ) )
			resultStep(`Поиск после F5 ${sample + 1}`, ['$rise_bench_baza_goods_table.rows', '$giper_baza_land.loading', '$mol_dimmer.parts'])
			searches.push({ sample, cold: await search(page, 'Aurora Keyboard', count / 100, count - 96), warm: await search(page, 'Keyboard', count / 10, count - 6) })
		}
		if(process.argv.includes('--timing-only')) {
			await screenshot(page, 'search-results.png')
			fs.mkdirSync(reportsDir, { recursive: true })
			fs.writeFileSync(path.join(reportsDir, 'reload.json'), JSON.stringify({ storage, count, creation, durable, results, searches, unstable, errors }, null, 2))
			assert.equal(unstable.length, 0)
			assert.deepEqual(errors, [])
			console.log('[timing] passed', storage, count)
			return
		}
		resultStep( 'CPU-профиль восстановления CRDT', [ '$giper_baza_land.diff_apply', '$giper_baza_land.sand_add' ] )
		await context.addInitScript(()=> { globalThis.__profile_baza = true })
		const cdp = await context.newCDPSession( page )
		await cdp.send( 'Profiler.enable' )
		await cdp.send( 'Profiler.start' )
		await page.reload({ waitUntil: 'domcontentloaded' })
		const profiled = await snapshot( page )
		const { profile } = await cdp.send( 'Profiler.stop' )
		console.log( '[reload] profile', JSON.stringify( profiled ) )
		resultStep( 'Проверить все восемь полей и уникальность после F5', [ '$rise_bench_baza_goods.products', '$rise_bench_baza_goods_product' ] )
		const valid = await page.evaluate( async()=> {
			const $ = globalThis.$
			const products = $.$rise_bench_baza_goods.Root(0).products()
			const checks = await Promise.all( Array.from( { length: products.length }, ( _, index )=> $.$mol_wire_async(()=> {
				const product = products[index]
				return product.Id().val() === String(index).padStart(5,'0') &&
					product.Title().val() === $.$rise_bench_baza_goods_product_name( index ) &&
					product.Checked().val() === false && product.Quantity().val() === index % 100 &&
					product.Uri().val() === `https://xkcd.com/${ index + 1 }/` &&
					product.Color().val() === ['red','green','blue'][index%3] &&
					product.Status().val() === ['minor','major','critical'][index%3] &&
					product.Supply().val().toString('YYYY-MM-DD') === '2026-10-05'
			})() ) )
			return { fields: checks.every(Boolean), count: products.length, unique: new Set(products.map(product=>product.link().str)).size }
		})
		assert.deepEqual( valid, { fields: true, count, unique: count } )
		resultStep( 'Проверить начало и конец виртуального списка', [ '$mol_list.view_window', '$rise_bench_baza_goods_table.row_title' ] )
		await page.getByText(lastName, { exact: true }).waitFor()
		await screenshot(page, 'first-records.png')
		await page.locator('[rise_bench_baza_goods_records] [mol_page_body]').evaluate(element=> { element.scrollTop = element.scrollHeight })
		await page.getByText('Aurora Wireless Notebook 00000', { exact: true }).waitFor()
		await screenshot(page, 'last-record.png')
		await page.locator('[rise_bench_baza_goods_records] [mol_page_body]').evaluate(element=> { element.scrollTop = 0 })
		await page.getByText(lastName, { exact: true }).waitFor()
		fs.mkdirSync( reportsDir, { recursive: true } )
		fs.writeFileSync( path.join( reportsDir, 'reload.cpuprofile' ), JSON.stringify( profile ) )
		assert.equal( unstable.length, 0, 'Scenario must have no unstable wire restart warnings' )
		assert.equal( errors.length, 0, 'Scenario must have no uncaught browser errors' )
		fs.writeFileSync( path.join( reportsDir, 'reload.json' ), JSON.stringify({ storage, count, creation, durable, results, searches, profiled, valid, unstable, errors }, null, 2 ) )
	} catch( error ) {
		console.error( '[state]', await page.evaluate(()=> ({ text: document.body.textContent.slice(0,1500), cursor: globalThis.$?.$rise_bench_baza_goods.Root(0).preparation?.cursor }) ).catch(()=> null) )
		throw error
	} finally {
		clearTimeout(deadline)
		await context.close().catch(()=> {})
		await browser.close().catch(()=> {})
	}
}

async function matrix() {
	const report = []
	fs.mkdirSync(reportsDir, { recursive: true })
	const save = ()=> fs.writeFileSync(path.join(reportsDir, 'matrix.json'), JSON.stringify(report, null, 2))
	const sizes = process.argv.find(arg=>arg.startsWith('--sizes='))?.slice(8).split(',').map(Number) ?? [500, 1000, 2000, 4000, 8000]
	const modes = process.argv.find(arg=>arg.startsWith('--modes='))?.slice(8).split(',') ?? (process.argv.includes('--shards-only') ? ['shard64', 'shard256'] : process.argv.includes('--areas-only') ? ['area'] : process.argv.includes('--single-only') ? ['single'] : ['single', 'area'])
	const schemas = process.argv.includes('--all-schemas') ? ['compact', 'full'] : [process.argv.includes('--compact') ? 'compact' : 'full']
	// Freeze one build across the entire matrix, not a different build for each context.
	const code = fs.readFileSync(path.resolve(__dirname, '../-/web.js'), 'utf8')
	fs.writeFileSync(path.join(reportsDir, 'app.web.js'), code)
	for(const size of sizes) for(const schema of schemas) for(const mode of modes) {
		const row = { schema, storage: mode, count: size, extras: schema === 'full' && !process.argv.includes('--without-extras'), indexes: mode !== 'single' && !process.argv.includes('--without-indexes'), reloadUnitTests: !process.argv.includes('--isolate-reload-tests'), operations: [], warnings: [], errors: [] }
		report.push(row)
		const browser = await chromium.launch({ headless: headless() })
		const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
		await context.route('**/rise/bench/baza/goods/-/web.js', route=>route.fulfill({body:code,contentType:'application/javascript'}))
		await context.route('**/web.audit.js', route=>route.fulfill({body:'',contentType:'application/javascript'}))
		await context.route('**/mol/build/client/client.js', route=>route.fulfill({body:'',contentType:'application/javascript'}))
		await context.addInitScript(observeReload)
		const page = await context.newPage()
		const profile = process.argv.includes('--profile-create') ? await context.newCDPSession(page) : null
		page.setDefaultTimeout(operationLimit)
		page.on('pageerror', error=>row.errors.push(error.message))
		page.on('console', message=> {
			if(/Different (host|args|task) on restart/.test(message.text())) row.warnings.push(message.text())
		})
		async function measure(name, task) {
			resultStep(`${schema}, ${mode}, ${size}: ${name}`, ['$rise_bench_baza_goods.create', '$rise_bench_baza_goods_table.rows', '$giper_baza_land.loading'])
			console.log('[matrix start]', mode, size, name)
			const entry = { name, status: 'running' }
			row.operations.push(entry)
			const start = performance.now()
			let timer
			try {
				entry.details = await Promise.race([
					task(),
					new Promise((_, reject)=> { timer = setTimeout(()=> {
						entry.status = 'over-limit'
						// This timer lives outside the renderer, so even a frozen page is stopped.
						browser.close().catch(()=> {})
						reject(new Error(`${name}: exceeded ${operationLimit / 1000} seconds`))
					}, operationLimit) }),
				])
				entry.status = 'passed'
				entry.ms = performance.now() - start
				resultBenchmarkValue(name, entry.ms, 'ms')
				const details = entry.details?.reads ? { ...entry.details, reads: entry.details.reads.length, longTasks: entry.details.longTasks.length } : entry.details
				console.log('[matrix result]', mode, size, JSON.stringify({ ...entry, details }))
				return entry.details
			} catch(error) {
				entry.ms = performance.now() - start
				if(entry.status !== 'over-limit') entry.status = 'failed'
				entry.error = error.message
				console.log('[matrix stopped]', mode, size, JSON.stringify(entry))
				throw error
			} finally { clearTimeout(timer); save() }
		}
		const settle = ()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))
		const state = ()=>page.evaluate(()=> {
			const app = globalThis.$.$rise_bench_baza_goods.Root(0)
			return { matches: app.Table().rows().length, domRows: document.querySelectorAll('[rise_bench_baza_goods_table_row]').length }
		})
		const reload = async()=> {
			await page.reload({ waitUntil: 'domcontentloaded' })
			const data = await snapshot(page)
			assert(data.domRows > 0 && data.domRows < 100)
			assert.equal(await page.locator('[rise_bench_baza_goods_records] [mol_page_body]').evaluate(element=>element.scrollTop), 0)
			const recordLands = await page.evaluate(()=> {
				const app = globalThis.$.$rise_bench_baza_goods.Root(0)
				return [...new Set(app.product_links().map(link=>globalThis.$.$giper_baza_glob.Pawn(link,globalThis.$.$rise_bench_baza_goods_product).land().link().str))]
			})
			const recordLandsRead = new Set(data.reads.filter(read=>read.store==='Unit'&&recordLands.includes(read.land)).map(read=>read.land)).size
			if(mode.startsWith('shard')) assert(recordLandsRead <= Math.ceil(data.domRows / Number(mode.slice(5))) + 1, 'First screen must not preload all shards')
			return { readyMs: data.ready, domRows: data.domRows, landsRead: new Set(data.reads.map(read=>read.land)).size, recordLandsRead, maxFreezeMs: Math.max(0, ...data.longTasks.map(task=>task.ms)) }
		}
		const filter = async(component, label, expected)=> {
			await page.locator(`[rise_bench_baza_goods_${component}_filter]`).getByRole('checkbox').first().click()
			await page.getByRole('button', { name: label, exact: true }).click()
			await page.waitForFunction(expected=> {
				try { return globalThis.$.$rise_bench_baza_goods.Root(0).Table().rows().length === expected }
				catch(error) { if(error?.then) return false; throw error }
			}, expected)
			await settle()
			return state()
		}
		try {
			await measure('Открыть пустой набор', async()=> {
				const tests = page.waitForEvent('console', { predicate: message=>message.text().includes('All tests passed') })
				await page.goto(`${url}#!storage=${mode}/count=${size}/schema=${schema}`, { waitUntil: 'domcontentloaded' })
				await tests
				// Account preparation is fixture setup, not record creation. Resolve it
				// once before asking Baza to allocate a second key for the dataset.
				await page.evaluate(()=>globalThis.$.$mol_wire_async(()=>globalThis.$.$giper_baza_auth.current().pass().lord().str)())
				const config = await page.evaluate(()=> {
					const app = globalThis.$.$rise_bench_baza_goods.Root(0)
					return { schema: app.schema_mode(), count: app.record_count(), compact: app.Table().compact(), storage: app.storage_mode(), indexed: app.Table().indexed(), labels: app.Schema().options() }
				})
				assert.equal(config.schema, schema, 'Stale bundle or wrong schema')
				assert.equal(config.count, size, 'Requested dataset size must be supported by the build')
				assert.equal(config.storage, mode, 'Requested storage must be supported by the build')
				assert.equal(config.indexed, mode !== 'single')
				assert.equal(config.compact, schema === 'compact')
				assert.deepEqual(config.labels, { compact: '4 свойства', full: '10 свойств' })
				// Native DB tests migrate $mol_db_test to versions 2 and 3. A fast
				// F5 may interrupt their cleanup; keep them out of reload timings.
				if(process.argv.includes('--isolate-reload-tests')) await context.route('**/web.test.js', route=>route.fulfill({body:'',contentType:'application/javascript'}))
			})
			// Diagnostic ablation only in this isolated browser; shipped schema stays intact.
			await page.evaluate(({extras,indexes,mode})=> {
				const $ = globalThis.$
				if(!extras) {
					const atom = { val: ()=>'' }
					const list = { items: ()=>[], remote_list: ()=>[] }
					Object.defineProperty($.$rise_bench_baza_goods_product.prototype, 'Description', {value:()=>atom,configurable:true})
					Object.defineProperty($.$rise_bench_baza_goods_product.prototype, 'Tags', {value:()=>list,configurable:true})
				}
				if(mode !== 'single' && !indexes) $.$rise_bench_baza_goods.Root(0).build_index = ()=>{}
			}, {extras:row.extras,indexes:row.indexes,mode})
			if(profile) {
				await profile.send('Profiler.enable')
				await profile.send('Profiler.start')
				await page.evaluate(()=> {
					globalThis.__creationProbe = {}
					const app = globalThis.$.$rise_bench_baza_goods.Root(0)
					for(const [host, names] of [[app, ['prepare_product', 'prepare_tags', 'build_index', 'collect_index']], [globalThis.$.$giper_baza_land.prototype, ['post', 'sand_ordered']], [globalThis.$.$giper_baza_list.prototype, ['splice']]]) {
						for(const name of names) {
							const original = host[name]
							const stat = globalThis.__creationProbe[name] = {calls:0, ms:0}
							host[name] = function(...args) {
								++stat.calls
								const start = performance.now()
								try { return original.apply(this,args) }
								finally { stat.ms += performance.now() - start }
							}
						}
					}
				})
			}
			await measure('Создать записи до первого заполненного экрана', async()=> {
				await page.getByRole('button', { name: 'Создать записи', exact: true }).click()
				await snapshot(page)
				return page.evaluate(()=> ({ objectsMs: globalThis.$.$rise_bench_baza_goods.Root(0).creation_ms(), visibleMs: globalThis.__reload.ready - globalThis.__createStart, count: globalThis.$.$rise_bench_baza_goods.Root(0).product_links().length }))
			})
			if(profile) {
				const { profile: data } = await profile.send('Profiler.stop')
				fs.writeFileSync(path.join(reportsDir, `${mode}-${size}-create.cpuprofile`), JSON.stringify(data))
				row.probe = await page.evaluate(()=>globalThis.__creationProbe)
				console.log('[creation probe]', mode, size, JSON.stringify(row.probe))
			}
			await measure('Дождаться сохранения локальных CRDT', async()=> {
				return page.evaluate(async()=> {
					const app = globalThis.$.$rise_bench_baza_goods.Root(0)
					const expected = new Map([[app.dataset().land().link().str, app.dataset().land().total()]])
					const recordLands = new Set()
					for(const product of app.products()) {
						const land = product.land()
						recordLands.add(land.link().str)
						expected.set(land.link().str, land.total())
					}
					const expectedRecordLands = app.shard_size() ? Math.ceil(app.record_count()/app.shard_size()) : app.area_mode() ? app.record_count() : 1
					if(recordLands.size !== expectedRecordLands) throw Error('Unexpected number of record Lands: '+recordLands.size+' vs '+expectedRecordLands)
					if(app.indexed_mode()) for(const field of ['Color_index', 'Status_index']) {
						const index = app.dataset()[field]?.()?.remote()
						if(index) expected.set(index.land().link().str, index.land().total())
					}
					const db = await globalThis.$.$giper_baza_mine_idb.db()
					while(true) {
						const keys = await new Promise((resolve,reject)=> {
							const request = db.read('Unit').Unit.native.getAllKeys()
							request.onsuccess = ()=>resolve(request.result)
							request.onerror = ()=>reject(request.error)
						})
						const counts = new Map()
						for(const [land] of keys) counts.set(land, (counts.get(land) ?? 0) + 1)
						if([...expected].every(([land,count])=>(counts.get(land) ?? 0) >= count)) return { lands: expected.size, recordLands:recordLands.size, units: keys.length }
						await new Promise(resolve=>setTimeout(resolve, 50))
					}
				})
			})
			await measure('F5: первый экран перед Color', reload)
			if(process.argv.includes('--creation-only')) {
				assert.deepEqual(row.errors, [])
				assert.deepEqual(row.warnings, [])
				row.status = 'passed'
				continue
			}
			await measure('Color red после F5', ()=>filter('color', 'red', Math.ceil(size / 3)))
			await measure('Color red + Status Sale: пустой результат', ()=>filter('status', 'Sale', 0))
			await measure('Color red + Status Store', ()=>filter('status', 'Store', Math.ceil(size / 3)))
			await measure('F5: первый экран перед Status', reload)
			await measure('Status Sale после F5', ()=>filter('status', 'Sale', Math.floor((size + 1) / 3)))
			await measure('F5: первый экран перед поиском', reload)
			await measure('Поиск Aurora Keyboard после F5', ()=>search(page, 'Aurora Keyboard', size / 100, size - 96))
			await measure('Повторный поиск Keyboard', ()=>search(page, 'Keyboard', size / 10, size - 6))
			await measure('Поиск без совпадений', ()=>search(page, 'Nonexistent product', 0, 0))
			// Verify raw storage only after cold measurements; do not preload areas
			// or include a full diagnostic scan in user-operation timings.
			if(schema === 'compact') await measure('Проверить четыре сохранённых поля', async()=> {
				const fields = await page.evaluate(()=>globalThis.$.$mol_wire_async(()=> {
					const app = globalThis.$.$rise_bench_baza_goods.Root(0)
					return { keys: Array.from(app.products(), product=>product.keys().slice().sort()), tags: app.dataset().Tags() === null }
				})())
				assert(fields.keys.every(keys=>JSON.stringify(keys) === JSON.stringify(['Color','Id','Status','Title'])), `Unexpected compact fields: ${JSON.stringify(fields.keys.slice(0,3))}`)
				assert(fields.tags, 'Compact schema must not create the tag catalog')
			})
			await measure('Очистить поиск', async()=> {
				await page.getByPlaceholder('Название товара', { exact: true }).fill('')
				await page.waitForFunction(size=>globalThis.$.$rise_bench_baza_goods.Root(0).Table().rows().length === size, size)
				await settle()
				return state()
			})
			await measure('Добавить одну запись', async()=> {
				await page.getByRole('button', { name: 'Добавить запись', exact: true }).click()
				await page.waitForFunction(size=>globalThis.$.$rise_bench_baza_goods.Root(0).product_links().length === size + 1, size)
				await page.getByText(await page.evaluate(size=>globalThis.$.$rise_bench_baza_goods_product_name(size), size), { exact: true }).waitFor()
				await settle()
				return state()
			})
			await measure('Изменить Status первой записи', async()=> {
				const first = page.locator('[rise_bench_baza_goods_table_row]').first()
				const support = first.getByRole('checkbox', { name: 'Support', exact: true })
				const target = await support.getAttribute('aria-checked') === 'true' ? 'Store' : 'Support'
				const choice = first.getByRole('checkbox', { name: target, exact: true })
				assert.notEqual(await choice.getAttribute('aria-checked'), 'true', 'Status must actually change')
				await choice.click()
				await settle()
				assert.equal(await choice.getAttribute('aria-checked'), 'true')
				return state()
			})
			if(mode !== 'single') await measure('Перестроить индексы', async()=> {
				await page.getByRole('button', { name: 'Перестроить индексы', exact: true }).click()
				await page.waitForFunction(()=> {
					const app = globalThis.$.$rise_bench_baza_goods.Root(0)
					return !globalThis.$.$mol_promise_like(app.Rebuild_indexes().status()?.[0]) && app.dataset().Color_index().remote().Ready().val() && app.dataset().Status_index().remote().Ready().val()
				})
				await settle()
			})
			await screenshot(page, `${schema}-${mode}-${size}.png`)
			if(process.argv.includes('--boundary-check') && size === 500 && mode.startsWith('shard')) {
				await measure('Добавить записи через границу шарда и проверить F5', async()=> {
					for(let index = size + 1; index <= 512; ++index) {
						await page.getByRole('button', {name:'Добавить запись',exact:true}).click()
						await page.getByText(await page.evaluate(i=>globalThis.$.$rise_bench_baza_goods_product_name(i),index),{exact:true}).waitFor()
					}
					const layout = await page.evaluate(async()=> {
						const app = globalThis.$.$rise_bench_baza_goods.Root(0)
						const links = app.product_links()
						const expected = new Map([[app.dataset().land().link().str,app.dataset().land().total()]])
						const lands = new Set()
						for(const product of app.products()) {
							lands.add(product.land().link().str)
							expected.set(product.land().link().str,product.land().total())
						}
						for(const field of ['Color_index','Status_index']) {
							const index=app.dataset()[field]().remote()
							expected.set(index.land().link().str,index.land().total())
						}
						const db=await globalThis.$.$giper_baza_mine_idb.db()
						while(true) {
							const keys=await new Promise((resolve,reject)=>{const request=db.read('Unit').Unit.native.getAllKeys();request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})
							const counts=new Map()
							for(const [land] of keys)counts.set(land,(counts.get(land)??0)+1)
							if([...expected].every(([land,count])=>(counts.get(land)??0)>=count))break
							await new Promise(resolve=>setTimeout(resolve,50))
						}
						return {count:links.length,unique:new Set(links.map(link=>link.str)).size,recordLands:lands.size,shardSize:app.shard_size()}
					})
					assert.equal(layout.count,513)
					assert.equal(layout.unique,513)
					assert.equal(layout.recordLands,Math.ceil(513/layout.shardSize))
					const loaded=await reload()
					await page.getByText(await page.evaluate(()=>globalThis.$.$rise_bench_baza_goods_product_name(512)),{exact:true}).waitFor()
					const indexed=await page.evaluate(()=>globalThis.$.$mol_wire_async(()=> {
						const app=globalThis.$.$rise_bench_baza_goods.Root(0)
						const link=app.product_links().find(link=>globalThis.$.$giper_baza_glob.Pawn(link,globalThis.$.$rise_bench_baza_goods_product).Id().val()==='00512')
						return {count:app.product_links().length,color:app.dataset().Color_index().remote().bucket('blue').items().some(item=>item.str===link.str),status:app.dataset().Status_index().remote().bucket('critical').items().some(item=>item.str===link.str)}
					})())
					assert.deepEqual(indexed,{count:513,color:true,status:true})
					return {...layout,reloaded:loaded,indexed}
				})
			}
			await measure('Сбросить выбранный набор', async()=> {
				await page.getByRole('button', { name: 'Сбросить', exact: true }).click()
				await page.locator('[rise_bench_baza_goods_table_row]').waitFor({ state: 'detached' })
				await settle()
				return state()
			})
			assert.deepEqual(row.errors, [])
			assert.deepEqual(row.warnings, [])
			row.status = 'passed'
		} catch(error) {
			row.status = row.operations.at(-1)?.status === 'over-limit' ? 'over-limit' : 'failed'
			row.error = error.message
		} finally {
			await context.close().catch(()=> {})
			await browser.close().catch(()=> {})
			save()
		}
	}
	console.log('[matrix complete]', JSON.stringify(report.map(row=>({storage:row.storage,count:row.count,status:row.status,operations:row.operations.map(({name,status,ms,details})=>({name,status,ms,details: details?.ms ? {ms:details.ms,matches:details.matches} : details}))}))))
	if(report.some(row=>row.status === 'failed')) throw new Error('Matrix has failed checks; see matrix.json')
}

(process.argv.includes('--matrix') ? matrix() : main()).catch( error => { console.error( error ); process.exitCode = 1 } )
