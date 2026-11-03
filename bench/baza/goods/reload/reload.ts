namespace $ {

	export interface $rise_bench_baza_goods_reload_row {
		count: number
		properties: number
		stamp: string
		state: string
		metrics: Record< string, number | null >
	}

	export interface $rise_bench_baza_goods_reload_ticket {
		link: string
		count: number
		started: number
	}

	export class $rise_bench_baza_goods_reload {
		readonly key = '$rise_bench_baza_goods_runs'
		readonly snapshot: {
			rows: $rise_bench_baza_goods_reload_row[]
			pending: $rise_bench_baza_goods_reload_ticket | null
		} = $mol_error_fence( ()=> JSON.parse( sessionStorage.getItem( this.key ) || 'null' ), ()=> null )
			?? { rows: [], pending: null }

		save( runs: readonly $rise_bench_run[], operations: readonly string[], pending: $rise_bench_baza_goods_reload_ticket | null ) {
			const rows = runs.map( run => ({
				count: run.count, properties: run.properties, stamp: run.stamp, state: run.state(),
				metrics: Object.fromEntries( operations.map( operation => [ operation, run.metric( operation ) ] ) ),
			}) )
			sessionStorage.setItem( this.key, JSON.stringify({ rows, pending }) )
		}
	}

}
