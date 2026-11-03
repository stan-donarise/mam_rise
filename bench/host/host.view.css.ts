namespace $ {
	$mol_style_define( $rise_bench_host, {
		Results: { flex: { grow: 1, shrink: 1 }, minWidth: $mol_style_unit.px( 640 ), '@media': { '(max-width: 640px)': { minWidth: $mol_style_unit.per(100) } } },
		Frame: { width: $mol_style_unit.per(100), height: $mol_style_unit.vh(75), flex: { shrink: 0 } },
		History: { maxHeight: $mol_style_unit.rem( 28 ), flex: { grow: 0, shrink: 0 } },
	} )
}
