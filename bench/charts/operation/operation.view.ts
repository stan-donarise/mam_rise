namespace $.$$ {
	export class $rise_bench_charts_operation extends $.$rise_bench_charts_operation {
		@ $mol_mem
		groups() {
			const groups = new Map< string, { title: string, values: Map< number, number[] > } >()
			for( const run of this.runs() ) {
				if( run.benchmark_version !== $rise_bench_run_benchmark_version ) continue
				const time = run.metric( this.operation() )
				if( run.state() !== 'Готово' || time === null ) continue
				const engine = run.baza_version === '—' ? 'IDB' : 'Гипербаза'
				const key = JSON.stringify([ engine, run.properties, run.computer, run.browser, run.benchmark_version, run.baza_version ])
				if( !groups.has( key ) ) groups.set( key, {
					title: `${ engine } · ${ run.properties || 'текст' } · ${ run.computer.split( /\r?\n/ )[ 0 ] || 'ПК не указан' } · v${ run.benchmark_version }`, values: new Map,
				} )
				const values = groups.get( key )!.values
				if( !values.has( run.count ) ) values.set( run.count, [] )
				values.get( run.count )!.push( time )
			}
			return [ ...groups.values() ].map( group => ({ title: group.title, points: [ ...group.values ].sort( ( a, b )=> a[0] - b[0] ).map( ([ count, times ])=> {
				const sorted = [ ...times ].sort( ( a, b )=> a - b ), middle = Math.floor( sorted.length / 2 )
				return [ count, sorted.length % 2 ? sorted[ middle ] : ( sorted[ middle - 1 ] + sorted[ middle ] ) / 2 ]
			}) }) )
		}
		content() { return this.groups().length ? [ this.Title(), this.Legend(), this.Plot(), this.Note() ] : [ this.Title(), this.Empty() ] }
		series_title( id: number ) { return this.groups()[ id ].title }
		series_x( id: number ) { return this.groups()[ id ].points.map( point => point[ 0 ] ) }
		series_y( id: number ) { return this.groups()[ id ].points.map( point => point[ 1 ] ) }
		graphs() { return [ ...this.groups().map( ( _, id )=> this.Series( id ) ), this.X(), this.Y() ] }
		legends() { return this.groups().map( ( _, id )=> this.Legend_item( id ) ) }
		legend_content( id: number ) { return [ this.Legend_sample( id ), this.Legend_text( id ) ] }
		legend_sample( id: number ) { return [ this.Series( id ).Sample() ] }
	}
}
