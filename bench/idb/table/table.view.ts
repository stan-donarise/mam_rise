namespace $.$$ {
	/** Same cards and virtualization; only field access differs from CRDT storage. */
	export class $rise_bench_idb_table extends $.$rise_bench_idb_table {
		count() { return this.records().length }
		row_id( id: number ) { return this.records()[ id ].id }
		row_title( id: number ) { return this.records()[ id ].title }
		row_uri( id: number ) { return this.records()[ id ].uri ?? `https://xkcd.com/${ Number( this.row_id( id ) ) + 1 }/` }
		row_description( id: number ) { return this.records()[ id ].description ?? '' }
		row_tags( id: number ) { return [ this.records()[ id ].tags?.join( ', ' ) ?? '' ] }
		row_color( id: number, next?: string ) {
			if( next !== undefined ) { this.change( `${id}:color`, next ); return next }
			return this.records()[ id ].color
		}
		row_status( id: number, next?: string ) {
			if( next !== undefined ) { this.change( `${id}:status`, next ); return next }
			return this.records()[ id ].status
		}
		row_checked( id: number, next?: boolean ) {
			if( next !== undefined ) { this.change( `${id}:checked`, next ); return next }
			return this.records()[ id ].checked ?? false
		}
		row_quantity( id: number, next?: number ) {
			if( next !== undefined ) { this.change( `${id}:quantity`, next ); return next }
			return this.records()[ id ].quantity ?? 0
		}
		@ $mol_mem_key
		row_moment( id: number, next?: $mol_time_moment ) {
			if( next !== undefined ) { this.change( `${id}:supply`, next.toString( 'YYYY-MM-DD' ) ); return next }
			return new $mol_time_moment( this.records()[ id ].supply ?? '2026-10-05' )
		}
	}
}
