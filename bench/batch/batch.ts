namespace $ {
	export type $rise_bench_batch_case = { engine: string, count: string, schema: string }

	/** A fixed, sequential matrix. Selection changes never alter a running batch. */
	export function $rise_bench_batch( engine: string, count: string, schema: string, text = false ): $rise_bench_batch_case[] {
		const engines = text ? [ 'text' ] : engine === 'all' ? Object.keys( $rise_bench_engine ) : [ engine ]
		const counts = count === 'all' ? text ? [ 100, 500, 1000, 2000, 5000 ] : [ 100, 500, 1000, 2000, 3000, 4000, 5000, 10000 ] : [ Number( count ) ]
		return engines.flatMap( engine => counts.map( count => ({ engine, count: String( count ), schema }) ) )
	}
}
