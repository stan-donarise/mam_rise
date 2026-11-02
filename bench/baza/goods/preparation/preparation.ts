namespace $ {

	// A stable host identity: wire must not serialize a growing products array as a task argument.
	export class $rise_bench_baza_goods_preparation {
		readonly products: $rise_bench_baza_goods_product[] = []
		readonly started = performance.now()
		readonly date = new $mol_time_moment( '2026-10-05' )
		links: $giper_baza_link[] | null = null
		readonly tag_links: $giper_baza_link[][] = []
		readonly indexes_ready: boolean

		constructor(
			readonly dataset: $rise_bench_baza_goods_dataset,
			readonly area: boolean,
			readonly count: number,
			readonly compact = false,
			readonly shard_size = 0,
		) {
			this.indexes_ready = ( area || shard_size > 0 ) && !!dataset.Color_index()?.remote()?.Ready()?.val() && !!dataset.Status_index()?.remote()?.Ready()?.val()
		}
	}

}
