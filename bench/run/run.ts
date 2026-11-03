namespace $ {
	export class $rise_bench_run extends $mol_object {
		constructor(
			readonly count: number,
			readonly properties = 0,
			readonly stamp = new $mol_time_moment().toString( 'DD.MM.YYYY hh:mm:ss' ),
		) { super() }
		@ $mol_mem
		state( next = 'Выполняется' ) { return next }
		@ $mol_mem_key
		metric( operation: string, next?: number ): number | null { return next ?? null }
	}

}
