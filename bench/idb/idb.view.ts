namespace $.$$ {
	export class $rise_bench_idb extends $.$rise_bench_idb {
		engine_kind(): $rise_bench_engine_kind {
			const kind = new URL( location.href ).searchParams.get( 'rise_fixture' )
			return [ 'sqlite', 'pglite', 'duckdb' ].includes( kind ?? '' ) ? kind as $rise_bench_engine_kind : 'idb'
		}
		storage_title() { return $rise_bench_engine[ this.engine_kind() ].title }
		storage_label() { return $rise_bench_engine[ this.engine_kind() ].storage }
		dataset_prefix() { return '$rise_bench_' + this.engine_kind() }
		@ $mol_mem
		count_mode( next?: string ) {
			const count = $mol_state_arg.value( 'count', next )
			return count && Object.hasOwn( this.Count().options(), count ) ? count : '100'
		}
		@ $mol_mem
		schema_mode( next?: string ) { return $mol_state_arg.value( 'schema', next ) === 'full' ? 'full' : 'compact' }
		compact() { return this.schema_mode() === 'compact' }
		@ $mol_mem
		dataset_name( next?: string ) {
			const name = $mol_state_local.value< string >( this.dataset_prefix() + '_dataset_' + this.count_mode() + '_' + this.schema_mode() + ( new URL( location.href ).searchParams.get( 'rise_run' ) || '' ), next )
			if( name !== null && name !== undefined ) return name
			// Reuse the former single dataset only when its saved run matches the selection.
			const row = this.reload_store().snapshot.rows[ 0 ]
			return row?.count === Number( this.count_mode() ) && row.properties === ( this.compact() ? 4 : 10 )
				? $mol_state_local.value<string>( this.dataset_prefix() + '_dataset' ) ?? '' : ''
		}
		@ $mol_mem
		storage() {
			return this.engine_kind() === 'idb' ? new $rise_bench_idb_storage( this.dataset_name() )
				: new $rise_bench_sql_storage( this.dataset_name(), this.engine_kind(), this.compact() )
		}
		@ $mol_mem
		revision( next = 0 ) { return next }
		@ $mol_mem
		products() {
			this.revision()
			if( !this.dataset_name() ) return []
			return $mol_wire_sync( this.storage() ).rows()
		}
		@ $mol_action
		refresh() { this.revision( this.revision() + 1 ) }
		@ $mol_action
		change( key: string, next?: string | number | boolean ) {
			if( next === undefined ) return null
			$mol_wire_async( this ).save_change( key, next ).catch( error => this.change_error( error ) )
			return next
		}
		@ $mol_mem
		change_error( next: Error | null = null ) { return next }
		change_message() { return this.change_error()?.message ?? '' }
		manual_content() {
			return [ this.Search_label(), this.Color_label(), this.Status_label(), this.Manual_actions(), ...this.change_error() ? [ this.Change_status() ] : [] ]
		}
		@ $mol_action
		save_change( key: string, next: string | number | boolean ) {
			this.change_error( null )
			const [ index, field ] = key.split( ':' )
			if( ![ 'color', 'status', 'checked', 'quantity', 'supply' ].includes( field ) ) throw new Error( 'Неизвестное поле' )
			$mol_wire_sync( this.storage() ).change( Number( index ), field as keyof $rise_bench_idb_storage_product, next )
			this.refresh()
		}
		@ $mol_action
		reset() {
			this.dataset_name( this.dataset_prefix() + '_' + $mol_wire_sync( crypto ).randomUUID() )
			this.search_query( '' ); this.color_filter( 'all' ); this.status_filter( 'all' )
			this.refresh(); this.body_scroll_top( 0 )
		}
		@ $mol_action
		add_one() {
			if( !this.dataset_name() ) this.reset()
			$mol_wire_sync( this.storage() ).add( this.compact() )
			this.refresh(); this.body_scroll_top( 0 )
		}
		controls_enabled() {
			return this.filters_enabled()
				&& !$mol_promise_like( this.Add().status()?.[ 0 ] ) && !$mol_promise_like( this.Reset().status()?.[ 0 ] )
		}
		filters_enabled() { return this.Metrics().runs()[ 0 ]?.state() !== 'Перезагрузка' && !$mol_promise_like( this.Run().status()?.[ 0 ] ) }
		@ $mol_mem
		reload_store() { return new $rise_bench_reload< { name: string, count: number, started: number } >( this.dataset_prefix() + '_runs' ) }
		private restored = false
		@ $mol_action
		restore_runs() {
			if( this.restored ) return
			this.Metrics().runs( this.reload_store().snapshot.rows.map( row => {
				const run = new $rise_bench_run( row.count, row.properties, row.stamp, row.baza_version ?? '—', row.benchmark_version ?? '—', row.id, row.computer ?? '', row.browser ?? '', row.engine, row.engine_version )
				run.state( row.state )
				run.bytes( row.bytes ?? null )
				for( const [ name, value ] of Object.entries( row.metrics ) ) if( value !== null ) run.metric( name, value )
				return run
			}) )
			this.restored = true
		}
		@ $mol_action
		start_run( run: $rise_bench_run ) {
			if( this.Metrics().runs().includes( run ) ) return
			this.reset()
			this.Metrics().run_add( run )
		}
		@ $mol_action
		benchmark() {
			this.restore_runs()
			const run = new ( $mol_wire_sync( $rise_bench_run ) )( Number( this.count_mode() ), this.compact() ? 4 : 10, undefined, '—', undefined, undefined, undefined, undefined, this.engine_kind(), $rise_bench_engine[ this.engine_kind() ].version )
			new ( $mol_wire_sync( $rise_bench_stage ) )( run, 'Подготовка' )
			$mol_wire_sync( this ).start_run( run )
			return $mol_error_fence( ()=> {
				new ( $mol_wire_sync( $rise_bench_stage ) )( run, 'Запуск БД, с' )
				const prepare = new ( $mol_wire_sync( $rise_bench_measure ) )( 'Запуск БД' )
				$mol_wire_sync( this.storage() ).prepare()
				prepare.finish(); run.metric( 'Запуск БД, с', prepare.duration! / 1000 )
				new ( $mol_wire_sync( $rise_bench_stage ) )( run, 'Создание, с' )
				const create = new ( $mol_wire_sync( $rise_bench_measure ) )( 'Создание IDB' )
				$mol_wire_sync( this.storage() ).create( run.count, this.compact() )
				create.finish(); run.metric( 'Создание, с', create.duration! / 1000 )
				new ( $mol_wire_sync( $rise_bench_stage ) )( run, 'Поиск, с' )
				const search = new ( $mol_wire_sync( $rise_bench_measure ) )( 'Поиск IDB' )
				if( $mol_wire_sync( this.storage() ).search() !== 1 ) throw new Error( 'Поиск должен найти один товар' )
				search.finish(); run.metric( 'Поиск, с', search.duration! / 1000 )
				new ( $mol_wire_sync( $rise_bench_stage ) )( run, 'Добавить 1, с' )
				const add = new ( $mol_wire_sync( $rise_bench_measure ) )( 'Добавление IDB' )
				$mol_wire_sync( this.storage() ).add( this.compact() )
				add.finish(); run.metric( 'Добавить 1, с', add.duration! / 1000 )
				$mol_wire_sync( this ).refresh()
				run.state( 'Перезагрузка' )
				new ( $mol_wire_sync( $rise_bench_stage ) )( run, 'F5, с' )
				this.reload_store().save( this.Metrics().runs(), this.Metrics().operations(), { name: this.dataset_name(), count: run.count, started: performance.timeOrigin + performance.now() } )
				this.$.$mol_dom_context.location.reload()
			}, error => {
				run.state( 'Ошибка' )
				run.failure( String( error ) )
				this.reload_store().save( this.Metrics().runs(), this.Metrics().operations(), null )
				return $mol_fail( error )
			} )
		}
		private resumed = false
		@ $mol_mem
		resume_reload() {
			if( this.resumed ) return
			const ticket = this.reload_store().snapshot.pending
			if( !ticket ) return
			const run = this.Metrics().runs()[ 0 ]
			return $mol_error_fence( ()=> {
				if( this.dataset_name() !== ticket.name || $mol_wire_sync( this.storage() ).count() !== ticket.count + 1 ) throw new Error( 'После F5 открыт неполный набор IDB' )
				const ready = new ( $mol_wire_sync( $rise_bench_idb_ready ) )( this.Table().dom_node(), $rise_bench_product_name( ticket.count ) )
				run.metric( 'F5, с', ( $mol_wire_sync( ready ).wait() - ticket.started ) / 1000 )
				new ( $mol_wire_sync( $rise_bench_stage ) )( run, 'Поиск после F5, с' )
				const search = new ( $mol_wire_sync( $rise_bench_measure ) )( 'Поиск IDB после F5' )
				if( $mol_wire_sync( this.storage() ).search() !== 1 ) throw new Error( 'Поиск IDB после F5 должен найти один товар' )
				search.finish(); run.metric( 'Поиск после F5, с', search.duration! / 1000 )
				this.resumed = true; run.state( 'Готово' )
				this.reload_store().save( this.Metrics().runs(), this.Metrics().operations(), null )
			}, error => {
				this.resumed = true; run.state( 'Ошибка' )
				run.failure( String( error ) )
				this.reload_store().save( this.Metrics().runs(), this.Metrics().operations(), null )
				return error
			} )
		}
		override auto() { this.restore_runs(); this.resume_reload(); return [] }
	}
}
