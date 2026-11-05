namespace $ {
	/** Serial RPC: no interleaved transactions and no SQL work on the UI thread. */
	export function $rise_bench_sql_worker() {
		let driver: $rise_bench_sql_driver
		let tail = Promise.resolve()
		globalThis.onmessage = event => {
			const { id, method, args } = event.data
			tail = tail.then( async()=> {
				try {
					let result: unknown
					if( method === 'open' ) {
						const [ engine, name ] = args
						const factories: Record<string, ( name: string )=> Promise<$rise_bench_sql_driver>> = {
							sqlite: $rise_bench_sql_sqlite, pglite: $rise_bench_sql_pglite, duckdb: $rise_bench_sql_duckdb,
						}
						driver = await factories[ engine ]( name )
					} else if( method === 'close' ) await driver.close()
					else result = await driver.query( args[ 0 ] )
					globalThis.postMessage({ id, result })
				} catch( error ) { globalThis.postMessage({ id, error: error instanceof Error ? error.message : String( error ) }) }
			})
		}
	}
}
