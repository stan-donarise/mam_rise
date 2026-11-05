namespace $ {
	export async function $rise_bench_sql_duckdb( name: string ): Promise< $rise_bench_sql_driver > {
		// 1.33.1-dev57 (npm latest) does not persist OPFS correctly. Pin the working release.
		const duck = await new Function( 'url', 'return import(url)' )( 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.32.0/+esm' )
		const base = 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.32.0/dist/'
		const blob = new Blob([ `importScripts(${JSON.stringify( base + 'duckdb-browser-eh.worker.js' )})` ], { type: 'text/javascript' })
		const url = URL.createObjectURL( blob )
		const worker = new Worker( url )
		const db = new duck.AsyncDuckDB( new duck.VoidLogger(), worker )
		try {
			await db.instantiate( base + 'duckdb-eh.wasm' )
			await db.open({ path: 'opfs://' + name + '.duckdb', accessMode: duck.DuckDBAccessMode.READ_WRITE })
		} catch( error ) { worker.terminate(); throw error }
		finally { URL.revokeObjectURL( url ) }
		const connection = await db.connect()
		return {
			async query( sql ) { return ( await connection.query( sql ) ).toArray().map( ( row: any )=> row.toJSON() ) },
			async close() { await connection.close(); await db.terminate(); worker.terminate() },
		}
	}
}
