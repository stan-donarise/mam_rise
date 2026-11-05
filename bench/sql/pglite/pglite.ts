namespace $ {
	export async function $rise_bench_sql_pglite( name: string ): Promise< $rise_bench_sql_driver > {
		const { PGlite } = await new Function( 'url', 'return import(url)' )( 'https://cdn.jsdelivr.net/npm/@electric-sql/pglite@0.5.15/dist/index.js' )
		const db = await PGlite.create( 'idb://' + name, { relaxedDurability: false } )
		return {
			async query( sql ) { const results = await db.exec( sql ); return results.at( -1 )?.rows ?? [] },
			async close() { await db.close() },
		}
	}
}
