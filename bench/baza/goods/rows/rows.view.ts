namespace $.$$ {
	/** Search replaces the set: preserve the viewport, not the previous row identity. */
	export class $rise_bench_baza_goods_rows extends $.$rise_bench_baza_goods_rows {
		@ $mol_mem
		sub() {
			const rows = this.rows()
			// Native sub() searches the old row through the entire lazy range.
			// No identity anchoring here: filtering replaces the result set.
			return rows.length ? rows : [ this.Empty() ]
		}
	}
}
