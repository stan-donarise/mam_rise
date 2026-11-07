namespace $ {
	export type $rise_bench_batch_case = { engine: string, count: string, schema: string }

	/** A fixed, sequential matrix. Selection changes never alter a running batch. */
	export function $rise_bench_batch( engine: string, count: string, schema: string, text = false ): $rise_bench_batch_case[] {
		const engines = text ? [ 'text' ] : $rise_bench_selection( engine, Object.keys( $rise_bench_engine ) )
		const counts = $rise_bench_selection( count, ( text ? [ 100, 500, 1000, 2000, 5000 ] : [ 100, 500, 1000, 2000, 3000, 4000, 5000, 10000 ] ).map( String ) )
		const schemas = text ? [ 'compact' ] : $rise_bench_selection( schema, [ 'compact', 'full' ] )
		return engines.flatMap( engine => schemas.flatMap( schema => counts.map( count => ({ engine, count, schema }) ) ) )
	}
}
