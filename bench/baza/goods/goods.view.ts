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

		controls_enabled() { return this.add_enabled() && !$mol_promise_like( this.Add().status()?.[0] ) }
		add_enabled() { return !$mol_promise_like( this.Create().status()?.[0] ) }
		create_enabled() { return this.controls_enabled() && !$mol_promise_like( this.Create().status()?.[0] ) }

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
			this.dataset_link( dataset.link().str )
			this.body_scroll_top( 0 )
		}

		@ $mol_action
		reset() {
			// Detach only this selected benchmark dataset, not the whole local database.
			this.dataset_link( '' )
			this.search_query( '' )
			this.color_filter( 'all' )
			this.status_filter( 'all' )
			this.body_scroll_top( 0 )
		}

		@ $mol_action
		create() {
			const total = new ( $mol_wire_sync( $rise_bench_measure ) )( 'Создание набора: всего', this.record_count() )
			const state = $mol_wire_sync( this ).prepare_dataset( this.dataset_config() )
			const records = new ( $mol_wire_sync( $rise_bench_measure ) )( 'Заполнение товаров', state.count )
			this.initialize_products( [ state, 0, state.count ] )
			records.finish()
			const links = new ( $mol_wire_sync( $rise_bench_measure ) )( 'Публикация списка', state.count )
			// Publish only fully initialized records.
			this.initialize_links( state.dataset.Products()!, state.links ??= state.products.map( product => product.link() ) )
			links.finish()
			this.dataset_link( state.dataset.link().str )
			total.finish()
			return { total: total.duration!, records: records.duration!, links: links.duration! }
		}

		@ $mol_action
		start_run( run: $rise_bench_run ) {
			if( this.Metrics().runs().includes( run ) ) return
			this.reset()
			this.Metrics().run_add( run )
		}

		@ $mol_action
		benchmark_search() {
			this.search_query( 'Notebook 00000' )
			return this.Table().rows().length
		}

		@ $mol_action
		benchmark() {
			const run = new ( $mol_wire_sync( $rise_bench_run ) )( this.record_count(), this.compact_mode() ? 4 : 10 )
			$mol_wire_sync( this ).start_run( run )
			return $mol_error_fence( ()=> {
				const created = $mol_wire_sync( this ).create()
				run.metric( 'Создание, с', created.total / 1000 )
				run.metric( 'Заполнение, с', created.records / 1000 )
				run.metric( 'Список, с', created.links / 1000 )
				const search = new ( $mol_wire_sync( $rise_bench_measure ) )( 'Поиск' )
				if( $mol_wire_sync( this ).benchmark_search() !== 1 ) throw new Error( 'Поиск должен найти один товар' )
				search.finish()
				run.metric( 'Поиск, с', search.duration! / 1000 )
				this.search_query( '' )
				const add = new ( $mol_wire_sync( $rise_bench_measure ) )( 'Добавление' )
				$mol_wire_sync( this ).add_one()
				add.finish()
				run.metric( 'Добавить 1, с', add.duration! / 1000 )
				run.state( 'Готово' )
			}, error => { run.state( 'Ошибка' ); return error } )
		}

		@ $mol_mem
		content() {
			// Keep the synchronizer subscribed for the lifetime of the application.
			$giper_baza_glob.yard().sync()
			return [ this.Settings(), this.Records() ]
		}

	}

}
