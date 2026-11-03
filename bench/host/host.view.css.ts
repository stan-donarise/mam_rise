namespace $ {
	$mol_style_define( $rise_bench_host, {
		flex: { grow: 1, shrink: 1 },
		Frame: { width: $mol_style_unit.per(100), height: $mol_style_unit.vh(75), flex: { shrink: 0 } },
		'@media': { '(max-width: 640px)': { minWidth: $mol_style_unit.per(100) } },
	} )
}
