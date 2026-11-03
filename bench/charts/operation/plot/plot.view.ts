namespace $.$$ {
	export class $rise_bench_charts_operation_plot extends $.$rise_bench_charts_operation_plot {
		@ $mol_mem
		dimensions() {
			const data = super.dimensions()
			return new $mol_vector_2d(
				new $mol_vector_range( 0, Math.max( 1, data.x.max ) ),
				new $mol_vector_range( 0, Math.max( .001, data.y.max * 1.1 ) ),
			)
		}
	}
}
