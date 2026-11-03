namespace $ {
	export type $rise_bench_idb_storage_product = {
		id: string, title: string, color: string, status: string,
		checked?: boolean, uri?: string, quantity?: number, supply?: string, description?: string, tags?: string[],
	}
	export type $rise_bench_idb_storage_schema = {
		Product: { Key: number, Doc: $rise_bench_idb_storage_product, Indexes: {} },
	}

	/** Native IndexedDB through $mol_db. No indexes or CRDT fixture entities. */
	export class $rise_bench_idb_storage extends $mol_object {
		constructor( readonly name: string ) { super() }
		private readonly migration = ( tx: $mol_db_transaction< $mol_db_schema > )=> { tx.store_make( 'Product' ) }

		@ $mol_memo.method
		async db() { return this.$.$mol_db< $rise_bench_idb_storage_schema >( this.name, this.migration ) }

		product( index: number, compact: boolean ): $rise_bench_idb_storage_product {
			const product = {
				id: String( index ).padStart( 5, '0' ), title: $rise_bench_product_name( index ),
				color: [ 'red', 'green', 'blue' ][ index % 3 ], status: [ 'minor', 'major', 'critical' ][ index % 3 ],
			}
			return compact ? product : {
				... product, checked: false, uri: `https://xkcd.com/${ index + 1 }/`, quantity: index % 100, supply: '2026-10-05',
				description: `${ product.title } — sample product for the local CRDT benchmark.`,
				tags: Array.from( { length: 5 }, ( _, offset )=> [ 'Office', 'Home', 'Travel', 'Studio', 'Gaming', 'Portable', 'Wireless', 'Compact', 'Premium', 'Classic', 'New', 'Popular', 'Eco', 'Gift', 'Work', 'Creative', 'Audio', 'Video', 'Network', 'Accessories' ][ ( index + offset * 3 ) % 20 ] ),
			}
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
			const count = await this.count()
			if( !count ) return []
			const range = IDBKeyRange.bound( Math.max( 0, count - 24 ), count - 1 )
			return ( await ( await this.db() ).read( 'Product' ).Product.select( range ) ).reverse()
		}

		destructor() { $mol_wire_async( this ).close() }
		async close() { ( await this.db() ).destructor() }
	}
}
