namespace $.$$ {

	$mol_style_define( $rise_bench_baza_goods_table, {
		Compact_id_labeler: { flex: { basis: $mol_style_unit.rem( 5 ) } },
		Row: {
			// Restore the spacing visible in the original table, requested by the user.
			minHeight: $mol_style_unit.px( 96 ),
			flex: { wrap: 'wrap' },
			padding: $mol_gap.block,
			gap: $mol_gap.block,
			alignItems: 'flex-start',
		},
		Details: { flex: { basis: '100%', wrap: 'wrap' }, gap: $mol_gap.block },
		Description_labeler: { flex: { basis: $mol_style_unit.rem( 30 ), shrink: 1 } },
		Description: { flex: { shrink: 1 }, minWidth: 0 },
	})

}
