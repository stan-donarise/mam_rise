namespace $ {
	/** Stable URL order and backwards compatibility with the old `all` links. */
	export function $rise_bench_selection( value: string, options: readonly string[] ): string[] {
		if( value === 'all' ) return [ ...options ]
		const selected = new Set( value.split( ',' ) )
		return options.filter( key => selected.has( key ) )
	}
}
