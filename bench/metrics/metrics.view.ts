namespace $.$$ {

	export class $rise_bench_metrics extends $.$rise_bench_metrics {

		@ $mol_action
		run_add( run: $rise_bench_run ) {
			const rows = this.runs()
			if( rows.includes( run ) ) return
			this.runs( [ run, ...rows ] )
		}

		col_ids() { return [ '№', 'Дата и время', 'Версия Гипербазы', 'Версия бенчмарка', 'Объём', 'Полей', 'Состояние', ...this.operations() ] }

		@ $mol_mem
		records() {
			return this.runs().map( ( run, index, rows ) => ({
				'№': rows.length - index,
				'Дата и время': run.stamp,
				'Версия Гипербазы': run.baza_version.slice( 0, 8 ),
				'Версия бенчмарка': run.benchmark_version,
				'Объём': run.count,
				'Полей': run.properties || '—',
				'Состояние': run.state(),
				...Object.fromEntries( this.operations().map( operation => {
					const time = run.metric( operation )
					return [ operation, time === null ? '—' : time.toFixed( 3 ) ]
				}) ),
			}) )
		}

	}

}
