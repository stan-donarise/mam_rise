namespace $.$$ {
	export class $rise_bench_charts extends $.$rise_bench_charts {
		charts() { return [ this.Selection(), ...this.operations().map( ( _, index )=> this.Chart( index ) ) ] }
		@ $mol_mem
		selected_runs() {
			const selected = new Set( this.selected() )
			return this.runs().filter( run => selected.has( run.id ) )
		}
		operation( index: number ) { return this.operations()[ index ] }
	}
}
