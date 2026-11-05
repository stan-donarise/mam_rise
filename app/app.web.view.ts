namespace $.$$ {
	export class $rise_app extends $.$rise_app {
		fixture_kind() { return new URL( location.href ).searchParams.get( 'rise_fixture' ) }
		fixture() {
			switch( this.fixture_kind() ) {
				case 'goods': return this.Bench().Goods()
				case 'text': return this.Bench().Crdttext()
				case 'idb': return this.Bench().Idb()
				case 'sqlite': case 'pglite': case 'duckdb': return this.Bench().Idb()
				case 'demo': return this.Demo()
			}
			return null
		}
		@ $mol_mem
		bridge() {
			const kind = this.fixture_kind()
			if( !kind || ![ 'goods', 'text', 'idb', 'sqlite', 'pglite', 'duckdb' ].includes( kind ) ) return null
			return new $rise_bench_fixture( kind, this.fixture() as $rise_bench_baza_goods | $rise_bench_baza_crdttext | $rise_bench_idb )
		}
		@ $mol_mem
		override pages() {
			$rise_storage.configure()
			if( window.parent !== window ) {
				if( this.fixture_kind() === 'goods' ) return [ this.Bench().Goods().Records() ]
				if( this.fixture_kind() === 'text' ) return [ this.Bench().Crdttext().Page() ]
				if( this.fixture_kind() === 'idb' ) return [ this.Bench().Idb().Page() ]
				if( [ 'sqlite', 'pglite', 'duckdb' ].includes( this.fixture_kind() ?? '' ) ) return [ this.Bench().Idb().Page() ]
			}
			return this.fixture()?.pages_deep() ?? super.pages()
		}
		override auto() {
			$rise_storage.configure()
			this.bridge()?.listener()
			const result = this.fixture()?.auto() ?? super.auto()
			if( this.bridge() ) $giper_baza_glob.yard().sync()
			this.bridge()?.report()
			return result
		}
	}
}
