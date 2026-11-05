namespace $ {
	/** Per-tab run history; the pending ticket belongs only to the next page. */
	export class $rise_bench_reload< Ticket > {
		readonly snapshot: {
			rows: $rise_bench_archive_row[]
			pending: Ticket | null
		}

		readonly key: string
		constructor( key: string ) {
			this.key = key + ( new URL( location.href ).searchParams.get( 'rise_run' ) || '' )
			const saved = $mol_error_fence( ()=> JSON.parse( sessionStorage.getItem( this.key ) || 'null' ), ()=> null )
			this.snapshot = Array.isArray( saved?.rows ) ? saved : { rows: [], pending: null }
		}

		save( runs: readonly $rise_bench_run[], operations: readonly string[], pending: Ticket | null ) {
			const rows = runs.map( run => ({
				count: run.count, properties: run.properties, stamp: run.stamp, state: run.state(),
				error: run.failure(),
				baza_version: run.baza_version, benchmark_version: run.benchmark_version,
				engine: run.engine, engine_version: run.engine_version,
				id: run.id,
				computer: run.computer, browser: run.browser,
				bytes: run.bytes(),
				metrics: Object.fromEntries( operations.map( operation => [ operation, run.metric( operation ) ] ) ),
			}) )
			sessionStorage.setItem( this.key, JSON.stringify({ rows, pending }) )
			if( !pending && [ 'Готово', 'Ошибка' ].includes( rows[ 0 ]?.state ) ) $rise_bench_stage.current = null
			const kind = new URL( location.href ).searchParams.get( 'rise_fixture' )
			if( window.parent !== window && !pending && [ 'Готово', 'Ошибка' ].includes( rows[ 0 ]?.state ) ) {
				window.parent.postMessage({ type: 'rise-bench-result', kind, token: new URL( location.href ).searchParams.get( 'rise_run' ), row: rows[ 0 ] }, location.origin )
			}
		}
	}
}
