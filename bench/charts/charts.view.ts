namespace $.$$ {
	export class $rise_bench_charts extends $.$rise_bench_charts {
		charts() { return this.operations().map( ( _, index )=> this.Chart( index ) ) }
		operation( index: number ) { return this.operations()[ index ] }
	}
}
