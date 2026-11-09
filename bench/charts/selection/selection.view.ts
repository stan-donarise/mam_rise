namespace $.$$ {
	export class $rise_bench_charts_selection extends $.$rise_bench_charts_selection {
		selection_title() {
			const selected = new Set( this.value() )
			return `Выбранные (${ this.runs().filter( run => selected.has( run.id ) ).length })`
		}
		choices() { return [ this.Reset(), ...this.runs().map( run => this.Check( run.id ) ) ] }
		@ $mol_action
		reset() { this.value( this.runs().slice( 0, 10 ).map( run => run.id ) ) }
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
