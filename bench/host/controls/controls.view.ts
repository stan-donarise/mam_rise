namespace $.$$ {
	export class $rise_bench_host_controls extends $.$rise_bench_host_controls {
		/** Persist the draft locally; each run takes its own immutable snapshot. */
		@ $mol_mem
		computer( next?: string ) { return $mol_state_local.value<string>( '$rise_bench_computer', next ) ?? '' }
		count_title() { return this.kind() === 'text' ? 'Количество строк' : 'Количество записей' }
		counts() {
			return { all: 'Все', ...Object.fromEntries( ( this.kind() === 'text' ? [ 100, 500, 1000, 2000, 5000 ] : [ 100, 500, 1000, 2000, 3000, 4000, 5000, 10000 ] ).map( count => [ count, String( count ) ] ) ) }
		}
		storage_label() { return this.kind() === 'text' ? 'CRDT-текст' : this.engine() === 'all' ? 'Все хранилища последовательно' : $rise_bench_engine[ this.engine() as $rise_bench_engine_kind ].storage }
		controls() {
			return [
				...this.kind() === 'text' ? [] : [ this.Engine_label() ],
				this.Storage_label(),
				...this.kind() === 'text' ? [] : [ this.Schema_label() ],
				this.Count_label(), this.Computer_label(), this.Run(), this.Status(),
				...this.retry_visible() ? [ this.Retry() ] : [],
			]
		}
	}
}
