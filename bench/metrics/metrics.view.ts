namespace $.$$ {

	export class $rise_bench_metrics extends $.$rise_bench_metrics {

		@ $mol_action
		measure_add( measure: $rise_bench_measure ) {
			measure.finish()
			const rows = this.measurements()
			if( rows.includes( measure ) ) return
			this.measurements( [ measure, ...rows ].slice( 0, 100 ) )
		}

		@ $mol_mem
		records() {
			return this.measurements().map( measure => ({
				'Операция': measure.title,
				'Время, мс': ( measure.duration ?? 0 ).toFixed( 2 ),
				'Объём': measure.count ? `${ measure.count } ${ measure.unit }` : '—',
				'Скорость': measure.count && measure.duration
					? `${ Math.round( measure.count * 1000 / measure.duration ) } ${ measure.unit }/с` : '—',
			}) )
		}

	}

}
