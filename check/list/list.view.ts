namespace $.$$ {
	/** Owned port of shm/check/list, with labels and a shared disabled state. */
	export class $rise_check_list extends $.$rise_check_list {
		checks() { return this.options().map( id => this.Check( id ) ) }
		check_title( id: string ) { return this.titles()[ id ] ?? id }
		@ $mol_mem
		all_checked( next?: boolean ): boolean {
			const options = this.options()
			if( next !== undefined ) { this.value( next ? [ ...options ] : [] ); return next }
			return options.length > 0 && options.every( id => this.checked( id ) )
		}
		checked( id: string, next?: boolean ): boolean {
			const value = this.value()
			if( next === undefined ) return value.includes( id )
			this.value( next ? value.includes( id ) ? value : [ ...value, id ] : value.filter( key => key !== id ) )
			return next
		}
	}
}
