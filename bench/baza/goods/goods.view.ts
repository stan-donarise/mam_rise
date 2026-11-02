namespace $.$$ {

	export class $rise_bench_baza_goods extends $.$rise_bench_baza_goods {

		private readonly preset: $giper_baza_rank_preset = [[ null, $giper_baza_rank_read ]]
		private readonly tag_names = [ 'Office', 'Home', 'Travel', 'Studio', 'Gaming', 'Portable', 'Wireless', 'Compact', 'Premium', 'Classic', 'New', 'Popular', 'Eco', 'Gift', 'Work', 'Creative', 'Audio', 'Video', 'Network', 'Accessories' ]

		@ $mol_action
		prepare_tags( dataset: $rise_bench_baza_goods_dataset ) {
			const list = dataset.Tags( null )!
			const existing = list.items()
			if( existing.length === this.tag_names.length ) return existing
			// Publish the catalog only after every referenced tag is fully initialized.
			list.items( $mol_wire_sync( this ).prepare_catalog_links( dataset ) )
			return list.items()
		}

		@ $mol_action
		prepare_tag( dataset: $rise_bench_baza_goods_dataset, index: number ) {
			const tag = dataset.land().Pawn( $rise_bench_baza_goods_tag ).Head( $mol_wire_sync( dataset.land() ).self_make() )
			tag.Title( null )!.val( this.tag_names[ index ] )
			return tag
		}

		@ $mol_action
		prepare_catalog_links( dataset: $rise_bench_baza_goods_dataset ) {
			return this.tag_names.map( ( _, index )=> $mol_wire_sync( this ).prepare_tag( dataset, index ).link() )
		}

		@ $mol_mem
		dataset_config() { return { count: this.record_count(), compact: this.compact_mode() } }

		@ $mol_action
		prepare_dataset( config: { count: number, compact: boolean } ) {
			// Resolve the local author before allocating another signing key. On a
			// fresh profile, interleaving both initializations can strand king_grab.
			this.$.$giper_baza_auth.current().pass()
			const land = $mol_wire_sync( $giper_baza_glob ).land_grab( this.preset )
			const dataset = land.Data( $rise_bench_baza_goods_dataset )
			dataset.Products( null )!
			return new $rise_bench_baza_goods_preparation( dataset, config.count, config.compact )
		}

		@ $mol_action
		prepare_product( state: $rise_bench_baza_goods_preparation, index: number ) {
			const product = $mol_wire_sync( state.dataset.land() ).area_make( index + 1 ).Data( $rise_bench_baza_goods_product )
			product.Id( null )!.val( String( index ).padStart( 5, '0' ) )
			product.Title( null )!.val( $rise_bench_baza_goods_product_name( index ) )
			product.Color( null )!.val( [ 'red', 'green', 'blue' ][ index % 3 ] )
			product.Status( null )!.val( [ 'minor', 'major', 'critical' ][ index % 3 ] )
			if( state.compact ) return product
			product.Checked( null )!.val( false )
			product.Uri( null )!.val( `https://xkcd.com/${ index + 1 }/` )
			product.Quantity( null )!.val( index % 100 )
			product.Supply( null )!.val( state.date )
			product.Description( null )!.val( `${ $rise_bench_baza_goods_product_name( index ) } — sample product for the local CRDT benchmark.` )
			const tags = $mol_wire_sync( this ).prepare_tags( state.dataset )
			// Link.toBin caches bytes relative to its first Land; do not reuse catalog
			// link instances when serializing the references into another Area.
			product.Tags( null )!.items( state.tag_links[ index ] ??= Array.from( { length: 5 }, ( _, offset )=>
				new $giper_baza_link( tags[ ( index + offset * 3 ) % tags.length ].str )
			) )
			return product
		}

		@ $mol_mem_key
		initialize_product( key: readonly [ $rise_bench_baza_goods_preparation, number ] ) {
			const [ state, index ] = key
			// This initializer is only invoked by Create. A completed record has no
			// remaining write dependencies and is never recreated on async replay.
			return state.products[ index ] ??= this.prepare_product( state, index )
		}

		@ $mol_mem_key
		initialize_products( key: readonly [ $rise_bench_baza_goods_preparation, number, number ] ): boolean {
			const [ state, from, to ] = key
			if( to - from <= 32 ) {
				for( let index = from; index < to; ++index ) this.initialize_product( [ state, index ] )
			} else {
				const middle = Math.floor( ( from + to ) / 2 )
				this.initialize_products( [ state, from, middle ] )
				this.initialize_products( [ state, middle, to ] )
			}
			return true
		}

		@ $mol_action
		initialize_links( list: $giper_baza_list_link, links: readonly $giper_baza_link[] ) {
			const init = new ( $mol_wire_sync( $rise_bench_baza_goods_initialization ) )( list, links )
			$mol_wire_sync( init ).run()
		}

		@ $mol_action
		reconcile_bucket( bucket: $giper_baza_list_link, links: readonly $giper_baza_link[] ) {
			const existing = bucket.items()
			const members = new Set( existing.map( link => link.str ) )
			// Index buckets represent membership, not ordering. Avoid rewriting a
			// valid bucket merely because Add inserts its new member at the front.
			if( existing.length === links.length && members.size === links.length && links.every( link => members.has( link.str ) ) ) return
			if( !existing.length ) this.initialize_links( bucket, links )
			else bucket.items( links )
		}

		@ $mol_mem
		schema_mode( next?: string ) {
			return $mol_state_arg.value( 'schema', next ) === 'compact' ? 'compact' : 'full'
		}

		compact_mode() { return this.schema_mode() === 'compact' }

		@ $mol_mem
		count_mode( next?: string ) {
			const count = $mol_state_arg.value( 'count', next )
			return count && Object.hasOwn( this.Count().options(), count ) ? count : '1000'
		}

		record_count() { return Number( this.count_mode() ) }
		app_title() { return `Товары: ${ this.record_count() } записей` }

		@ $mol_mem
		dataset_link( next?: string ) {
			// Keep existing Area datasets; retired single/shard datasets stay untouched.
			const key = '$rise_bug_listbaza_dataset_names2_area' + ( this.record_count() === 1000 ? '' : '_' + this.record_count() ) + ( this.compact_mode() ? '_compact' : '' )
			return $mol_state_local.value< string >( key, next ) ?? ''
		}

		@ $mol_mem
		dataset() {
			const link = this.dataset_link()
			return link ? $giper_baza_glob.Pawn( new $giper_baza_link( link ), $rise_bench_baza_goods_dataset ) : null
		}

		@ $mol_mem
		products() {
			const links = this.product_links()
			return $mol_range2(
				index => $giper_baza_glob.Pawn( links[ index ], $rise_bench_baza_goods_product ),
				()=> links.length,
			)
		}

		@ $mol_mem
		product_links() { return this.dataset()?.Products()?.items() ?? [] }

		@ $mol_action
		collect_index( dataset: $rise_bench_baza_goods_dataset, field: 'Color' | 'Status' ) {
			const result: Record< string, $giper_baza_link[] > = field === 'Color'
				? { red: [], green: [], blue: [] } : { minor: [], major: [], critical: [] }
			for( const [ key, link ] of this.index_values( [ dataset, field, 0, dataset.Products()!.items().length ] ) ) {
				;( result[ key ] ??= [] ).push( new $giper_baza_link( link.str ) )
			}
			return result
		}

		@ $mol_mem_key
		index_values( key: readonly [ $rise_bench_baza_goods_dataset, 'Color' | 'Status', number, number ] ): readonly ( readonly [ string, $giper_baza_link ] )[] {
			const [ dataset, field, from, to ] = key
			if( to - from > 32 ) {
				const middle = Math.floor( ( from + to ) / 2 )
				return [ ...this.index_values( [ dataset, field, from, middle ] ), ...this.index_values( [ dataset, field, middle, to ] ) ]
			}
			const links = dataset.Products()!.items()
			const result: ( readonly [ string, $giper_baza_link ] )[] = []
			for( let index = from; index < to; ++index ) {
				const product = $giper_baza_glob.Pawn( links[ index ], $rise_bench_baza_goods_product )
				result.push( [ product[ field ]()?.val() ?? '', links[ index ] ] )
			}
			return result
		}

		@ $mol_action
		build_index( dataset: $rise_bench_baza_goods_dataset, field: 'Color' | 'Status' ) {
			const atom = field === 'Color' ? dataset.Color_index( null )! : dataset.Status_index( null )!
			const index = $mol_wire_sync( atom ).ensure( dataset.land() )!
			index.Ready( null )!.val( false )
			const buckets = $mol_wire_sync( this ).collect_index( dataset, field )
			for( const key of index.keys() ) {
				if( typeof key === 'string' && key.startsWith( 'bucket:' ) ) buckets[ key.slice( 7 ) ] ??= []
			}
			for( const [ key, links ] of Object.entries( buckets ) ) $mol_wire_sync( this ).reconcile_bucket( index.bucket( key, null )!, links )
			index.Ready( null )!.val( true )
		}

		@ $mol_action
		rebuild_indexes() {
			const dataset = this.dataset()
			if( !dataset ) return
			$mol_wire_sync( this ).build_index( dataset, 'Color' )
			$mol_wire_sync( this ).build_index( dataset, 'Status' )
		}

		index_rebuild_enabled() { return !!this.dataset_link() && !$mol_promise_like( this.Add().status()?.[0] ) && !$mol_promise_like( this.Create().status()?.[0] ) }

		@ $mol_action
		extend_index( dataset: $rise_bench_baza_goods_dataset, product: $rise_bench_baza_goods_product, field: 'Color' | 'Status' ) {
			const index = ( field === 'Color' ? dataset.Color_index() : dataset.Status_index() )!.remote()!
			index.Ready()!.val( false )
			$mol_wire_sync( index ).set_member( product.link(), product[ field ]()!.val()!, true )
			index.Ready()!.val( true )
		}

		@ $mol_mem
		creation_ms( next = 0 ) { return next }

		controls_enabled() { return this.add_enabled() && !$mol_promise_like( this.Add().status()?.[0] ) }
		add_enabled() { return !$mol_promise_like( this.Create().status()?.[0] ) && !$mol_promise_like( this.Rebuild_indexes().status()?.[0] ) }
		create_enabled() { return !this.dataset_link() && !$mol_promise_like( this.Add().status()?.[0] ) && !$mol_promise_like( this.Rebuild_indexes().status()?.[0] ) }

		prepare_append( dataset: $rise_bench_baza_goods_dataset ) {
			return new $rise_bench_baza_goods_preparation( dataset, dataset.Products()!.items().length, this.compact_mode() )
		}

		@ $mol_action
		add_one() {
			const dataset = this.dataset() ?? $mol_wire_sync( this ).prepare_dataset( this.dataset_config() ).dataset
			// Freeze the insertion index before any writes or suspension.
			const state = $mol_wire_sync( this ).prepare_append( dataset )
			const product = $mol_wire_sync( this ).prepare_product( state, state.count )
			$mol_wire_sync( dataset.Products()! ).splice( state.links ??= [ product.link() ] )
			if( state.indexes_ready ) {
				$mol_wire_sync( this ).extend_index( dataset, product, 'Color' )
				$mol_wire_sync( this ).extend_index( dataset, product, 'Status' )
			} else {
				$mol_wire_sync( this ).build_index( dataset, 'Color' )
				$mol_wire_sync( this ).build_index( dataset, 'Status' )
			}
			this.dataset_link( dataset.link().str )
			this.body_scroll_top( 0 )
		}

		@ $mol_action
		reset() {
			// Detach only this selected benchmark dataset, not the whole local database.
			this.dataset_link( '' )
			this.creation_ms( 0 )
			this.search_query( '' )
			this.color_filter( 'all' )
			this.status_filter( 'all' )
			this.body_scroll_top( 0 )
		}

		@ $mol_action
		create() {
			if( this.dataset_link() ) return
			const state = $mol_wire_sync( this ).prepare_dataset( this.dataset_config() )
			this.initialize_products( [ state, 0, state.count ] )
			// Publish only fully initialized records.
			this.initialize_links( state.dataset.Products()!, state.links ??= state.products.map( product => product.link() ) )
			$mol_wire_sync( this ).build_index( state.dataset, 'Color' )
			$mol_wire_sync( this ).build_index( state.dataset, 'Status' )
			this.creation_ms( performance.now() - state.started )
			this.dataset_link( state.dataset.link().str )
		}

		@ $mol_mem
		content() {
			// Keep the synchronizer subscribed for the lifetime of the application.
			$giper_baza_glob.yard().sync()
			return [ this.Settings(), this.Records() ]
		}

	}

}
