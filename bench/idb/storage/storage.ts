namespace $ {
	export type $rise_bench_idb_storage_product = $rise_bench_product
	export type $rise_bench_idb_storage_schema = {
		Product: { Key: number, Doc: $rise_bench_idb_storage_product, Indexes: {} },
	}

	/** Native IndexedDB through $mol_db. No indexes or CRDT fixture entities. */
	export class $rise_bench_idb_storage extends $mol_object {
		constructor( readonly name: string ) { super() }
		private readonly migration = ( tx: $mol_db_transaction< $mol_db_schema > )=> { tx.store_make( 'Product' ) }

		@ $mol_memo.method
		async db() { return this.$.$mol_db< $rise_bench_idb_storage_schema >( this.name, this.migration ) }
		async prepare() { await this.db() }

		product( index: number, compact: boolean ): $rise_bench_idb_storage_product {
			return $rise_bench_product_make( index, compact )
		}

		async create( count: number, compact: boolean ) {
			const db = await this.db()
			const tx = db.change( 'Product' )
			const products = tx.stores.Product
			const requests = Array.from( { length: count }, ( _, index )=> products.put( this.product( index, compact ), index ) )
			await Promise.all( [ ... requests, tx.commit() ] )
		}

		async count() { return ( await this.db() ).read( 'Product' ).Product.count() }

		async search() {
			const products = await ( await this.db() ).read( 'Product' ).Product.select()
			return products.filter( product => product.title.toLowerCase().includes( 'notebook 00000' ) ).length
		}

		async add( compact: boolean ) {
			const index = await this.count()
			const tx = ( await this.db() ).change( 'Product' )
			await Promise.all( [ tx.stores.Product.put( this.product( index, compact ), index ), tx.commit() ] )
		}

		async rows() {
			return ( await ( await this.db() ).read( 'Product' ).Product.select() )
		}
		async change( index: number, field: keyof $rise_bench_idb_storage_product, value: string | number | boolean ) {
			const db = await this.db(), product = await db.read( 'Product' ).Product.get( index )
			if( !product ) throw new Error( 'Запись не найдена' )
			const tx = db.change( 'Product' )
			await Promise.all([ tx.stores.Product.put( { ...product, [ field ]: value }, index ), tx.commit() ])
		}

		destructor() { $mol_wire_async( this ).close() }
		async close() { ( await this.db() ).destructor() }
	}
}
