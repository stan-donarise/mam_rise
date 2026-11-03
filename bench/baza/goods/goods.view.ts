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
		fill_product( state: $rise_bench_baza_goods_preparation, index: number, product: $rise_bench_baza_goods_product ) {
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
			if( state.products[ index ] ) return state.products[ index ]
			const product = $mol_wire_sync( state.dataset.land() ).area_make().Data( $rise_bench_baza_goods_product )
			return state.products[ index ] = this.fill_product( state, index, product )
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
		add_enabled() {
			return this.Metrics().runs()[ 0 ]?.state() !== 'Перезагрузка'
				&& !$mol_promise_like( this.Create().status()?.[0] )
		}
		create_enabled() { return this.controls_enabled() && !$mol_promise_like( this.Create().status()?.[0] ) }

		prepare_append( dataset: $rise_bench_baza_goods_dataset ) {
			return new $rise_bench_baza_goods_preparation( dataset, dataset.Products()!.items().length, this.compact_mode() )
		}

		@ $mol_action
		add_one() {
			const total = new ( $mol_wire_sync( $rise_bench_measure ) )( 'Добавление' )
			const dataset = this.dataset() ?? $mol_wire_sync( this ).prepare_dataset( this.dataset_config() ).dataset
			// Freeze the insertion index before any writes or suspension.
			const state = $mol_wire_sync( this ).prepare_append( dataset )
			const product = $mol_wire_sync( dataset.Products()! ).make( dataset.land() )
			$mol_wire_sync( this ).fill_product( state, state.count, product )
			this.dataset_link( dataset.link().str )
			this.body_scroll_top( 0 )
			total.finish()
			return total.duration!
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
			for( let index = 0; index < state.count; ++index ) this.initialize_product( [ state, index ] )
			// Publish once, after all Areas are filled. Publishing on each make()
			// forces the next Area to save an increasingly large parent list.
			$mol_wire_sync( state.dataset.Products()! ).items( state.links ??= state.products.map( product => product.link() ) )
			this.dataset_link( state.dataset.link().str )
			total.finish()
			return total.duration!
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
			this.restore_runs()
			const run = new ( $mol_wire_sync( $rise_bench_run ) )( this.record_count(), this.compact_mode() ? 4 : 10 )
			$mol_wire_sync( this ).start_run( run )
			return $mol_error_fence( ()=> {
				const created = $mol_wire_sync( this ).create()
				run.metric( 'Создание, с', created / 1000 )
				// Drain the previous writes before measuring another operation.
				$mol_wire_sync( this ).save_dataset()
				const search = new ( $mol_wire_sync( $rise_bench_measure ) )( 'Поиск' )
				if( $mol_wire_sync( this ).benchmark_search() !== 1 ) throw new Error( 'Поиск должен найти один товар' )
				search.finish()
				run.metric( 'Поиск, с', search.duration! / 1000 )
				this.search_query( '' )
				const added = $mol_wire_sync( this ).add_one()
				run.metric( 'Добавить 1, с', added / 1000 )
				$mol_wire_sync( this ).save_dataset()
				$mol_wire_sync( this ).request_reload( run )
			}, error => { run.state( 'Ошибка' ); return error } )
		}

		@ $mol_mem
		reload_store() { return new $rise_bench_baza_goods_reload }

		private runs_restored = false
		@ $mol_action
		restore_runs() {
			if( this.runs_restored ) return
			const rows = this.reload_store().snapshot.rows.map( row => {
				const run = new $rise_bench_run( row.count, row.properties, row.stamp )
				run.state( row.state )
				for( const [ name, value ] of Object.entries( row.metrics ) ) if( value !== null ) run.metric( name, value )
				return run
			})
			this.Metrics().runs( rows )
			this.runs_restored = true
		}

		@ $mol_action
		save_dataset() {
			const lands = new Set( [ this.dataset()!.land(), ...this.products().map( product => product.land() ) ] )
			// Native units_saving suspends until signing and IDB commits finish.
			for( const land of lands ) $mol_wire_sync( land ).units_saving()
		}

		@ $mol_action
		request_reload( run: $rise_bench_run ) {
			run.state( 'Перезагрузка' )
			this.reload_store().save( this.Metrics().runs(), this.Metrics().operations(), {
				link: this.dataset_link(), count: run.count,
				started: performance.timeOrigin + performance.now(),
			})
			this.$.$mol_dom_context.location.reload()
		}

		private reload_done = false
		@ $mol_mem
		resume_reload() {
			if( this.reload_done ) return
			const ticket = this.reload_store().snapshot.pending
			if( !ticket ) return
			const run = this.Metrics().runs()[ 0 ]
			return $mol_error_fence( ()=> {
				if( this.dataset_link() !== ticket.link || this.product_links().length !== ticket.count + 1 ) {
					throw new Error( 'После F5 открыт другой или неполный набор товаров' )
				}
				const ready = new ( $mol_wire_sync( $rise_bench_baza_goods_reload_ready ) )( this.Table().dom_node(), $rise_bench_baza_goods_product_name( ticket.count ) )
				const finished = $mol_wire_sync( ready ).wait()
				run.metric( 'F5, с', ( finished - ticket.started ) / 1000 )
				const search = new ( $mol_wire_sync( $rise_bench_measure ) )( 'Поиск после F5' )
				if( $mol_wire_sync( this ).benchmark_search() !== 1 ) throw new Error( 'Поиск после F5 должен найти один товар' )
				search.finish()
				run.metric( 'Поиск после F5, с', search.duration! / 1000 )
				this.search_query( '' )
				this.reload_done = true
				run.state( 'Готово' )
				this.reload_store().save( this.Metrics().runs(), this.Metrics().operations(), null )
			}, error => {
				this.reload_done = true
				run.state( 'Ошибка' )
				this.reload_store().save( this.Metrics().runs(), this.Metrics().operations(), null )
				return error
			} )
		}

		override auto() {
			this.restore_runs()
			this.resume_reload()
			return []
		}

		@ $mol_mem
		content() {
			// Keep the synchronizer subscribed for the lifetime of the application.
			$giper_baza_glob.yard().sync()
			return [ this.Settings(), this.Records() ]
		}

	}

}
