namespace $ {
	export async function $rise_bench_sql_sqlite( name: string ): Promise< $rise_bench_sql_driver > {
		const { default: initialize } = await new Function( 'url', 'return import(url)' )( 'https://cdn.jsdelivr.net/npm/@sqlite.org/sqlite-wasm@3.54.1-build1/dist/index.mjs' )
		const sqlite = await initialize()
		// The previous document may still be releasing its worker during F5.
		// Own this database for the driver's lifetime, not only during initialization.
		return new Promise( ( resolve, reject )=> {
			navigator.locks.request( 'rise-bench-sqlite:' + name, async()=> {
				let release!: ()=> void
				const held = new Promise<void>( done => { release = done } )
				try {
					const pool = await sqlite.installOpfsSAHPoolVfs({ directory: '/rise-bench/' + name, preserveOnInitFailure: true })
					const db = new pool.OpfsSAHPoolDb( '/products.sqlite' )
					resolve({
						async query( sql ) { return db.exec({ sql, rowMode: 'object', returnValue: 'resultRows' }) },
						async close() { try { db.close(); await pool.pauseVfs() } finally { release() } },
					})
					await held
				} catch( error ) { reject( error ) }
			}).catch( reject )
		})
	}
}
