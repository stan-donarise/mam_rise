namespace $ {
	export function $rise_bench_product_name( index: number ) {
		const brands = [ 'Aurora', 'Orion', 'Vega', 'Nova', 'Atlas', 'Pixel', 'Aero', 'Terra', 'Lumen', 'Zen' ]
		const models = [ 'Wireless', 'Compact', 'Pro', 'Mini', 'Classic', 'Smart', 'Portable', 'Studio', 'Premium', 'Travel' ]
		const types = [ 'Notebook', 'Headphones', 'Monitor', 'Mouse', 'Keyboard', 'Camera', 'Printer', 'Router', 'Speaker', 'Watch' ]
		return `${ brands[ Math.floor( index / 10 ) % 10 ] } ${ models[ Math.floor( index / 100 ) % 10 ] } ${ types[ index % 10 ] } ${ String( index ).padStart( 5, '0' ) }`
	}
}
