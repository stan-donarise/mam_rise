namespace $.$$ {

	$mol_style_define( $rise_bench_baza_goods, {
		Settings: { flex: { grow: 0, basis: $mol_style_unit.rem( 20 ) } },
		Records: {
			flex: { grow: 1, shrink: 1 },
			minWidth: $mol_style_unit.px( 640 ),
			'@media': {
				'(max-width: 640px)': { minWidth: $mol_style_unit.per( 100 ) },
			},
		},
		Actions: { flex: { wrap: 'wrap' } },
	})

}
