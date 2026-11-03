namespace $ {
	export const $rise_bench_run_baza_version = '2e6100b225c8d4fb3a5b5d14e8568223e8a8c785'
	export const $rise_bench_run_benchmark_version = '0.1.0'

	export class $rise_bench_run extends $mol_object {
		constructor(
			readonly count: number,
			readonly properties = 0,
			readonly stamp = new $mol_time_moment().toString( 'DD.MM.YYYY hh:mm:ss' ),
			readonly baza_version = $rise_bench_run_baza_version,
			readonly benchmark_version = $rise_bench_run_benchmark_version,
		) { super() }
		@ $mol_mem
		state( next = 'Выполняется' ) { return next }
		@ $mol_mem_key
		metric( operation: string, next?: number ): number | null { return next ?? null }
	}

}
