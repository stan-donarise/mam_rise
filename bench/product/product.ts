namespace $ {
	export type $rise_bench_product = {
		id: string, title: string, color: string, status: string,
		checked?: boolean, uri?: string, quantity?: number, supply?: string, description?: string, tags?: string[],
	}
	/** Identical input data for each non-CRDT storage adapter. */
	export function $rise_bench_product_make( index: number, compact: boolean ): $rise_bench_product {
		const product = {
			id: String( index ).padStart( 5, '0' ), title: $rise_bench_product_name( index ),
			color: [ 'red', 'green', 'blue' ][ index % 3 ], status: [ 'minor', 'major', 'critical' ][ index % 3 ],
		}
		return compact ? product : {
			...product, checked: false, uri: `https://xkcd.com/${ index + 1 }/`, quantity: index % 100, supply: '2026-10-05',
			description: `${ product.title } — sample product for the local CRDT benchmark.`,
			tags: Array.from( { length: 5 }, ( _, offset )=> [ 'Office', 'Home', 'Travel', 'Studio', 'Gaming', 'Portable', 'Wireless', 'Compact', 'Premium', 'Classic', 'New', 'Popular', 'Eco', 'Gift', 'Work', 'Creative', 'Audio', 'Video', 'Network', 'Accessories' ][ ( index + offset * 3 ) % 20 ] ),
		}
	}
}
