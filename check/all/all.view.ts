namespace $.$$ {
	/** Owned port of shm/check/all. No runtime dependency on shm. */
	export class $rise_check_all extends $.$rise_check_all {
		@ $mol_mem
		checked( next?: boolean ) {
			const checks = this.checks()
			if( next !== undefined ) {
				for( const check of checks ) check.checked( next )
				return next
			}
			return checks.length > 0 && checks.every( check => check.checked() )
		}
	}
}
