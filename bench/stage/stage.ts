namespace $ {
	/** Reports phase boundaries; only the user decides when to stop a workload. */
	export class $rise_bench_stage {
		static current: $rise_bench_stage | null = null
		static failure( error: unknown ) {
			// Native failures may contain a workload database name or Land ID.
			// Archive only the stage and a bounded diagnostic, never raw payloads.
			return `${ this.current?.operation ?? 'Операция' }: ошибка выполнения`
		}
		readonly started = Date.now()
		constructor( readonly run: $rise_bench_run, readonly operation: string ) {
			$rise_bench_stage.current = this
			const token = new URL( location.href ).searchParams.get( 'rise_run' )
			if( window.parent !== window ) window.parent.postMessage({
				type: 'rise-bench-progress', kind: new URL( location.href ).searchParams.get( 'rise_fixture' ), token,
				operation, started: this.started,
				row: { id: run.id, count: run.count, properties: run.properties, stamp: run.stamp,
					state: 'Ошибка', baza_version: run.baza_version, benchmark_version: run.benchmark_version,
					engine: run.engine, engine_version: run.engine_version, computer: run.computer, browser: run.browser,
					bytes: run.bytes(), metrics: Object.fromEntries( $rise_bench_archive.operations( run.properties ? 'goods' : 'text' ).map( name => [ name, run.metric( name ) ] ) ) },
			}, location.origin )
		}
	}
}
