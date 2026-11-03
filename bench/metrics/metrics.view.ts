namespace $.$$ {

	export class $rise_bench_metrics extends $.$rise_bench_metrics {
		embedded() { return window.parent !== window }
		Cell( id: { row: string[], col: string } ) { return id.col === 'Компьютер' ? this.Details( id ) : super.Cell( id ) }
		details_computer( id: { row: string[], col: string } ) { return this.runs()[ Number( id.row.at( -1 ) ) ]?.computer || 'Не указаны' }
		details_browser( id: { row: string[], col: string } ) { return this.runs()[ Number( id.row.at( -1 ) ) ]?.browser || 'Не указан' }

		@ $mol_action
		run_add( run: $rise_bench_run ) {
			const rows = this.runs()
			if( rows.includes( run ) ) return
			this.runs( [ run, ...rows ] )
		}

		col_ids() { return [ '№', 'Дата и время', ...this.compare() ? [ 'Хранилище' ] : [], 'Версия Гипербазы', 'Версия бенчмарка', ...this.text_mode() ? [ 'Строк', 'Размер, КБ' ] : [ 'Объём', 'Полей' ], ...this.operations(), 'Компьютер' ] }

		@ $mol_mem
		records() {
			return this.runs().map( ( run, index, rows ) => ({
				'№': rows.length - index,
				'Дата и время': run.stamp,
				'Хранилище': run.baza_version === '—' ? 'IDB' : 'Гипербаза',
				'Версия Гипербазы': run.baza_version.slice( 0, 8 ),
				'Версия бенчмарка': run.benchmark_version,
				'Объём': run.count,
				'Строк': run.count,
				'Размер, КБ': run.bytes() === null ? '—' : ( run.bytes()! / 1024 ).toFixed( 3 ),
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
