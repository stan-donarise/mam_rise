namespace $ {
	export class $rise_storage extends $mol_object {
		@ $mol_memo.method
		static configure() { this.$.$giper_baza_mine_idb.db = ()=> this.db(); return true }
		@ $mol_memo.method
		static db() {
			const fixture = new URL( location.href ).searchParams.get( 'rise_fixture' )
			return this.$.$mol_db<{
				Unit: { Key: [ string, string ], Doc: [ ArrayBuffer ], Indexes: {} }
				Ball: { Key: [ string, string ], Doc: [ ArrayBuffer ], Indexes: {} }
			}>( fixture ? '$rise_workload_' + fixture : '$rise_results',
				mig => mig.store_make( 'Unit' ), mig => mig.store_make( 'Ball' ),
			)
		}
	}
}
