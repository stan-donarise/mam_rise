namespace $.$$ {
	export class $rise_bench_charts_selection extends $.$rise_bench_charts_selection {
		selection_title() {
			const selected = new Set( this.value() )
			return `Прогоны (${ this.runs().filter( run => selected.has( run.id ) ).length })`
		}
		choices() { return [ this.Presets(), ...this.runs().map( run => this.Check( run.id ) ) ] }
		presets() { return [ 0, 10, 20, 30, 50 ].map( count => this.Preset( count ) ) }
		preset_title( count: number ) { return String( count ) }
		@ $mol_action
		select_latest( count: number ) { this.value( this.runs().slice( 0, count ).map( run => run.id ) ) }
		checked( id: string, next?: boolean ): boolean {
			const value = this.value()
			if( next === undefined ) return value.includes( id )
			this.value( next ? value.includes( id ) ? value : [ ...value, id ] : value.filter( key => key !== id ) )
			return next
		}
		run_title( id: string ) {
			const rows = this.runs(), index = rows.findIndex( run => run.id === id ), run = rows[ index ]
			const engine = $rise_bench_engine[ run.engine as $rise_bench_engine_kind ]?.title ?? run.engine
			return `№ ${ rows.length - index } · ${ run.stamp } · ${ engine } · ${ run.count } ${ run.properties ? `записей · ${ run.properties } полей` : 'строк' } · v${ run.benchmark_version } · ${ run.state() }`
		}
	}
}
