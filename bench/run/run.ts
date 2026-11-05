namespace $ {
	export const $rise_bench_run_baza_version = '2e6100b225c8d4fb3a5b5d14e8568223e8a8c785'
	export const $rise_bench_run_benchmark_version = '0.5.0'

	export class $rise_bench_run extends $mol_object {
		constructor(
			readonly count: number,
			readonly properties = 0,
			readonly stamp = new $mol_time_moment().toString( 'DD.MM.YYYY hh:mm:ss' ),
			readonly baza_version = $rise_bench_run_baza_version,
			readonly benchmark_version = $rise_bench_run_benchmark_version,
			readonly id: string = crypto.randomUUID(),
			readonly computer = $mol_state_local.value<string>( '$rise_bench_computer' ) ?? '',
			readonly browser = typeof navigator === 'undefined' ? '' : navigator.userAgent,
			readonly engine: string = baza_version === '—' ? 'idb' : 'goods',
			readonly engine_version = baza_version === '—' ? 'browser' : baza_version,
		) { super() }
		// Memoized channels can be reaped when neither table nor chart observes them.
		// A run owns its data independently of those temporary subscriptions.
		private state_value = 'Выполняется'
		private failure_value = ''
		private bytes_value: number | null = null
		private readonly metric_values = new Map< string, number >()
		@ $mol_mem
		state( next?: string ) {
			if( next !== undefined ) this.state_value = next
			return this.state_value
		}
		@ $mol_mem
		failure( next?: string ) {
			if( next !== undefined ) this.failure_value = next
			return this.failure_value
		}
		@ $mol_mem
		bytes( next?: number | null ) {
			if( next !== undefined ) this.bytes_value = next
			return this.bytes_value
		}
		@ $mol_mem_key
		metric( operation: string, next?: number ): number | null {
			if( next !== undefined ) this.metric_values.set( operation, next )
			return this.metric_values.get( operation ) ?? null
		}
	}

}
