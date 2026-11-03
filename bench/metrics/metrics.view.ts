namespace $.$$ {

	export class $rise_bench_metrics extends $.$rise_bench_metrics {

		@ $mol_action
		run_add( run: $rise_bench_run ) {
			const rows = this.runs()
			if( rows.includes( run ) ) return
			this.runs( [ run, ...rows ] )
		}

		col_ids() { return [ '№', 'Дата и время', 'Объём', 'Полей', 'Состояние', ...this.operations() ] }

		@ $mol_mem
		records() {
			return this.runs().map( ( run, index, rows ) => ({
				'№': rows.length - index,
				'Дата и время': run.stamp,
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
