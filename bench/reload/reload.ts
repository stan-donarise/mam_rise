namespace $ {
	/** Per-tab run history; the pending ticket belongs only to the next page. */
	export class $rise_bench_reload< Ticket > {
		readonly snapshot: {
			rows: { count: number, properties: number, stamp: string, state: string, baza_version?: string, benchmark_version?: string, metrics: Record< string, number | null > }[]
			pending: Ticket | null
		}

		constructor( readonly key: string ) {
			const saved = $mol_error_fence( ()=> JSON.parse( sessionStorage.getItem( key ) || 'null' ), ()=> null )
			this.snapshot = Array.isArray( saved?.rows ) ? saved : { rows: [], pending: null }
		}

		save( runs: readonly $rise_bench_run[], operations: readonly string[], pending: Ticket | null ) {
			const rows = runs.map( run => ({
				count: run.count, properties: run.properties, stamp: run.stamp, state: run.state(),
				baza_version: run.baza_version, benchmark_version: run.benchmark_version,
				metrics: Object.fromEntries( operations.map( operation => [ operation, run.metric( operation ) ] ) ),
			}) )
			sessionStorage.setItem( this.key, JSON.stringify({ rows, pending }) )
		}
	}
}
