namespace $.$$ {

	export class $rise_bench_baza_goods_table extends $.$rise_bench_baza_goods_table {

		count() { return this.products().length }

		row_content( id: number ) {
			return this.compact()
				? [ this.Compact_id_labeler( id ), this.Title_labeler( id ), this.Color_labeler( id ), this.Status_labeler( id ) ]
				: [ ...super.row_content( id ), this.Details( id ) ]
		}
		row_description( id: number ) { return this.products()[ id ].Description()?.val() ?? '' }
		row_tags( id: number ) {
			const tags = this.products()[ id ].Tags()?.remote_list() ?? []
			return [ tags.map( tag => tag.Title()?.val() ?? '' ).join( ', ' ) ]
		}

		@ $mol_mem
		rows() {
			const count = this.count()
			const color = this.color_filter()
			const status = this.status_filter()
			const terms = this.query().trim().toLowerCase().split( /\s+/ ).filter( Boolean )
			if( !terms.length && color === 'all' && status === 'all' ) return $mol_range2( index => this.Row( count - index - 1 ), ()=> count )
			const color_index = this.index_matches( [ 'Color', color ] )
			const status_index = this.index_matches( [ 'Status', status ] )
			const links = this.links()
			const matches: number[] = []
			for( let index = count - 1; index >= 0; --index ) {
				if( color_index ? !color_index.has( links[ index ].str ) : color !== 'all' && this.row_color( index ) !== color ) continue
				if( status_index ? !status_index.has( links[ index ].str ) : status !== 'all' && this.row_status( index ) !== status ) continue
				if( terms.length && !terms.every( term => this.row_title( index ).toLowerCase().includes( term ) ) ) continue
				matches.push( index )
			}
			return $mol_range2( index => this.Row( matches[ index ] ), ()=> matches.length )
		}

		@ $mol_mem_key
		index_matches( selection: readonly [ 'Color' | 'Status', string ] ): Set< string > | null {
			const [ field, key ] = selection
			if( key === 'all' ) return null
			const dataset = this.dataset() as $rise_bench_baza_goods_dataset | null
			const index = field === 'Color' ? dataset?.Color_index()?.remote() : dataset?.Status_index()?.remote()
			if( !index?.Ready()?.val() ) return null
			return new Set( index.bucket( key )?.items().map( link => link.str ) ?? [] )
		}

		@ $mol_action
		index_keys( index: $rise_bench_baza_goods_index, next: string ) {
			return [ ...new Set( [ ...index.keys().filter( key => typeof key === 'string' && key.startsWith( 'bucket:' ) ).map( key => String( key ).slice( 7 ) ), next ] ) ].sort()
		}

		@ $mol_action
		change_field( id: number, field: 'Color' | 'Status', next: string ) {
			const product = this.products()[ id ]
			const dataset = this.dataset() as $rise_bench_baza_goods_dataset | null
			const index = field === 'Color' ? dataset?.Color_index()?.remote() : dataset?.Status_index()?.remote()
			// A suspended/interrupted update leaves the index unready: readers fall back to a scan.
			if( index ) index.Ready( null )!.val( false )
			product[ field ]( null )!.val( next )
			if( index ) {
				const keys = $mol_wire_sync( this ).index_keys( index, next )
				for( const key of keys ) $mol_wire_sync( index ).set_member( product.link(), key, key === next )
				index.Ready( null )!.val( true )
			}
			return next
		}

		row_id( id: number ) { return this.products()[ id ].Id()!.val()! }
		@ $mol_mem_key
		row_title( id: number ) { return this.products()[ id ].Title()!.val()! }
		row_uri( id: number ) { return this.compact() ? `https://xkcd.com/${ Number( this.row_id( id ) ) + 1 }/` : this.products()[ id ].Uri()!.val()! }

		row_checked( id: number, next?: boolean ) {
			return this.products()[ id ].Checked()!.val( next ) ?? false
		}

		row_color( id: number, next?: string ) {
			return next === undefined ? this.products()[ id ].Color()!.val() ?? '' : this.change_field( id, 'Color', next )
		}

		row_status( id: number, next?: string ) {
			return next === undefined ? this.products()[ id ].Status()!.val() ?? '' : this.change_field( id, 'Status', next )
		}

		row_quantity( id: number, next?: number ) {
			return this.products()[ id ].Quantity()!.val( next ) ?? 0
		}

		row_moment( id: number, next?: $mol_time_moment ) {
			return this.products()[ id ].Supply()!.val( next )!
		}

		row_date( id: number ) { return this.row_moment( id ).toString( 'DD.MM.YYYY' ) }

	}

}
