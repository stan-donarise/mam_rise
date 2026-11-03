namespace $.$$ {
	export class $rise_bench_textarea_view extends $.$rise_bench_textarea_view {
		@ $mol_mem
		text_lines() { return ( this.text() ?? '' ).split( /\r\n?|\n/ ) }
	}
}
