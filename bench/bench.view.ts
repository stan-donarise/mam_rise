namespace $.$$ {
	export class $rise_bench extends $.$rise_bench {
		spread_ids(): readonly string[] {
			const ids = super.spread_ids()
			return new URL( location.href ).searchParams.get( 'rise_fixture' ) === 'tests' ? [ ...ids, '$rise_bench_idb' ] : ids
		}
		Spread( id: string ): $mol_view {
			// Offline regression entry point exercises the same raw workload views.
			if( new URL( location.href ).searchParams.get( 'rise_fixture' ) === 'tests' ) {
				if( id === '$rise_bench_baza_goods' ) return this.Goods()
				if( id === '$rise_bench_baza_crdttext' ) return this.Crdttext()
				if( id === '$rise_bench_idb' ) return this.Idb()
			}
			return super.Spread( id )
		}
	}
}
