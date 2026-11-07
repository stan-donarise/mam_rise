namespace $.$$ {
	export class $rise_bench_host_controls extends $.$rise_bench_host_controls {
		/** Persist the draft locally; each run takes its own immutable snapshot. */
		@ $mol_mem
		computer( next?: string ) { return $mol_state_local.value<string>( '$rise_bench_computer', next === undefined ? undefined : $rise_bench_computer.clean( next ) ) ?? '' }
		intro() {
			return `Выберите хранилища, состав и объёмы данных. «Все» отмечает всю группу; каждое выбранное сочетание выполняется по очереди.\n\nНебольшой набор — обычно несколько секунд, крупные наборы — минуты. Полный перебор может занять десятки минут и дольше: время зависит от компьютера и хранилища. Таймаута нет — при необходимости нажмите «Остановить».\n\nВерсия бенчмарка: ${ $rise_bench_run_benchmark_version }.`
		}
		engine_keys() { return Object.keys( $rise_bench_engine ) }
		engine_titles() { return Object.fromEntries( Object.entries( $rise_bench_engine ).map( ([ key, engine ])=> [ key, engine.title ] ) ) }
		count_title() { return this.kind() === 'text' ? 'Количество строк' : 'Количество записей' }
		counts() {
			return Object.fromEntries( ( this.kind() === 'text' ? [ 100, 500, 1000, 2000, 5000 ] : [ 100, 500, 1000, 2000, 3000, 4000, 5000, 10000 ] ).map( count => [ count, String( count ) ] ) )
		}
		count_keys() { return Object.keys( this.counts() ) }
		storage_label() { return this.kind() === 'text' ? 'CRDT-текст' : this.engines().length === 1 ? $rise_bench_engine[ this.engines()[ 0 ] as $rise_bench_engine_kind ].storage : 'Выбранные хранилища выполняются последовательно' }
		controls() {
			return [
				this.Intro(),
				...this.kind() === 'text' ? [] : [ this.Engine_label() ],
				this.Storage_label(),
				...this.kind() === 'text' ? [] : [ this.Schema_label() ],
				this.Count_label(), this.Computer_label(), this.Run(), ...this.running() ? [ this.Stop() ] : [], this.Status(), this.Elapsed(),
				...this.retry_visible() ? [ this.Retry() ] : [],
			]
		}
	}
}
