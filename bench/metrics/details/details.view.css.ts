namespace $ {
	$mol_style_define( $rise_bench_metrics_details, {
		padding: 0,
		Trigger: { padding: $mol_gap.text, minWidth: $mol_style_unit.rem( 2.5 ), minHeight: $mol_style_unit.rem( 2.5 ) },
		Bubble: { maxHeight: $mol_style_unit.vh( 80 ), overflow: 'auto' },
		Text: { padding: $mol_gap.block, flex: { direction: 'column' }, maxWidth: $mol_style_unit.vw( 80 ), width: $mol_style_unit.rem( 28 ) },
		Computer: { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' },
		Computer_label: { Label: { align: { items: 'center' } } },
		Browser: { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' },
	} )
}
