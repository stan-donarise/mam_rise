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
			const matches: number[] = []
			for( let index = count - 1; index >= 0; --index ) {
				$rise_bench_stage.current?.check()
				if( color !== 'all' && this.row_color( index ) !== color ) continue
				if( status !== 'all' && this.row_status( index ) !== status ) continue
				if( terms.length && !terms.every( term => this.row_title( index ).toLowerCase().includes( term ) ) ) continue
				matches.push( index )
			}
			return $mol_range2( index => this.Row( matches[ index ] ), ()=> matches.length )
		}

		row_id( id: number ) { return this.products()[ id ].Id()!.val()! }
		@ $mol_mem_key
		row_title( id: number ) { return this.products()[ id ].Title()!.val()! }
		row_uri( id: number ) { return this.compact() ? `https://xkcd.com/${ Number( this.row_id( id ) ) + 1 }/` : this.products()[ id ].Uri()!.val()! }

		row_checked( id: number, next?: boolean ) {
			return this.products()[ id ].Checked()!.val( next ) ?? false
		}

		row_color( id: number, next?: string ) {
			return this.products()[ id ].Color()!.val( next ) ?? ''
		}

		row_status( id: number, next?: string ) {
			return this.products()[ id ].Status()!.val( next ) ?? ''
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
