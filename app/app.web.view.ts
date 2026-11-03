namespace $.$$ {
	export class $rise_app extends $.$rise_app {
		fixture_kind() { return new URL( location.href ).searchParams.get( 'rise_fixture' ) }
		fixture() {
			switch( this.fixture_kind() ) {
				case 'goods': return this.Bench().Goods()
				case 'text': return this.Bench().Crdttext()
				case 'idb': return this.Bench().Idb()
				case 'demo': return this.Demo()
			}
			return null
		}
		@ $mol_mem
		override pages() {
			$rise_storage.configure()
			return this.fixture()?.pages_deep() ?? super.pages()
		}
		override auto() {
			$rise_storage.configure()
			return this.fixture()?.auto() ?? super.auto()
		}
	}
}
