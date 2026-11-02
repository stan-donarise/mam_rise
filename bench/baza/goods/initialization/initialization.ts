namespace $ {

	/** Explicit initialization of an unpublished, empty CRDT list. */
	export class $rise_bench_baza_goods_initialization {

		readonly chunks: readonly $giper_baza_link[][]

		constructor(
			readonly list: $giper_baza_list_link,
			readonly links: readonly $giper_baza_link[],
		) {
			this.chunks = Array.from( { length: Math.ceil( links.length / 32 ) }, ( _, index )=>
				links.slice( index * 32, index * 32 + 32 )
			)
		}

		@ $mol_mem_key
		append( index: number ) {
			// Fixed insertion positions and stable chunks survive partial async replay.
			// Finishing this channel releases the completed action's write dependencies.
			this.list.splice( this.chunks[ index ], index * 32, index * 32 )
			return true
		}

		@ $mol_action
		run() {
			for( let index = 0; index < this.chunks.length; ++index ) this.append( index )
			return this.list
		}

	}

}
