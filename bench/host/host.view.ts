namespace $.$$ {
	type $rise_bench_host_pending = $rise_bench_archive_row & { kind?: string }
	export class $rise_bench_host extends $.$rise_bench_host {
		menu_title() { return this.title() }
		compare() { return this.kind() === 'goods' }
		text_mode() { return this.kind() === 'text' }
		@ $mol_mem
		mode( next?: string ) { return $mol_state_arg.value( 'results', next ) === 'charts' ? 'charts' : 'table' }
		fixture_kind() { return ( this.active_case() ?? this.display_case() )?.engine ?? ( this.compare() ? this.selected_engines()[ 0 ] ?? 'goods' : this.kind() ) }
		@ $mol_mem
		engine( next?: string ) {
			if( next !== undefined ) this.display_case( null )
			if( next !== undefined && next !== ( $mol_state_arg.value( 'engine' ) ?? 'goods' ) ) this.ready( false )
			return $mol_state_arg.value( 'engine', next ) ?? 'goods'
		}
		@ $mol_mem
		count( next?: string ) {
			if( next !== undefined ) this.display_case( null )
			const key = this.kind() === 'text' ? 'lines' : 'count'
			if( next !== undefined && next !== ( $mol_state_arg.value( key ) ?? '100' ) ) this.ready( false )
			return $mol_state_arg.value( key, next ) ?? '100'
		}
		@ $mol_mem
		schema( next?: string ) {
			if( next !== undefined ) this.display_case( null )
			if( next !== undefined && next !== ( $mol_state_arg.value( 'schema' ) ?? 'compact' ) ) this.ready( false )
			return $mol_state_arg.value( 'schema', next ) ?? 'compact'
		}
		selected_engines( next?: readonly string[] ) { return $rise_bench_selection( this.engine( next?.join( ',' ) ), Object.keys( $rise_bench_engine ) ) }
		selected_counts( next?: readonly string[] ) { return $rise_bench_selection( this.count( next?.join( ',' ) ), Object.keys( this.Controls().counts() ) ) }
		selected_schemas( next?: readonly string[] ) { return $rise_bench_selection( this.schema( next?.join( ',' ) ), [ 'compact', 'full' ] ) }
		private chart_selection_value?: readonly string[]
		@ $mol_mem
		chart_selection( next?: readonly string[] ): readonly string[] {
			if( next !== undefined ) this.chart_selection_value = next
			return this.chart_selection_value ?? this.runs().slice( 0, 10 ).map( run => run.id )
		}
		@ $mol_mem
		ready( next = false ) { return next }
		@ $mol_mem
		busy( next = false ) { return next }
		@ $mol_mem
		active_case( next: ( $rise_bench_batch_case & { token: string } ) | null = null ) { return next }
		@ $mol_mem
		display_case( next: ( $rise_bench_batch_case & { token: string } ) | null = null ) { return next }
		@ $mol_mem
		frame_generation( next = 0 ) { return next }
		private queue: $rise_bench_batch_case[] = []
		private total = 0
		private finished = 0
		private failed = 0
		private command_sent = false
		private progress: { operation: string, started: number, row: $rise_bench_archive_row } | null = null
		private timing_value = { batch: 0, step: 0, ended: 0 }
		@ $mol_mem
		timing( next?: { batch: number, step: number, ended: number } ) {
			if( next !== undefined ) this.timing_value = next
			return this.timing_value
		}
		elapsed_text() {
			const timing = this.timing()
			if( !timing.batch ) return ''
			const now = timing.ended || $mol_state_time.now( 1000 )
			return `Текущий этап: ${ this.duration( now - timing.step ) } · Всего: ${ this.duration( now - timing.batch ) }`
		}
		duration( milliseconds: number ) {
			const seconds = Math.max( 0, Math.floor( milliseconds / 1000 ) )
			return [ Math.floor( seconds / 3600 ), Math.floor( seconds / 60 ) % 60, seconds % 60 ].map( value => String( value ).padStart( 2, '0' ) ).join( ':' )
		}
		private readonly settled = new Set<string>()
		engine_title( engine: string ) { return engine === 'text' ? 'CRDT-текст' : $rise_bench_engine[ engine as $rise_bench_engine_kind ].title }
		controls_enabled() { return !this.busy() }
		run_enabled() { return this.ready() && this.controls_enabled() && this.selected_counts().length > 0 && ( this.text_mode() || this.selected_engines().length > 0 && this.selected_schemas().length > 0 ) }
		config() { const current = this.active_case() ?? this.display_case(); return { count: current?.count ?? this.selected_counts()[ 0 ] ?? '100', schema: current?.schema ?? this.selected_schemas()[ 0 ] ?? 'compact' } }
		@ $mol_action
		send( command: string, data: object ) {
			const target = ( this.Frame().dom_node() as HTMLIFrameElement ).contentWindow
			if( !target || !this.ready() ) throw new Error( 'Дождитесь загрузки бенчмарка' )
			target.postMessage({ type: 'rise-bench-command', kind: this.fixture_kind(), id: crypto.randomUUID(), command, data }, location.origin )
		}
		@ $mol_action
		run() {
			if( this.active_case() || !this.run_enabled() ) return
			this.queue = $rise_bench_batch( this.engine(), this.count(), this.schema(), this.text_mode() )
			this.total = this.queue.length; this.finished = 0; this.failed = 0
			this.settled.clear()
			this.timing( { batch: Date.now(), step: Date.now(), ended: 0 } )
			this.next_case()
		}
		@ $mol_action
		next_case() {
			this.progress = null; this.command_sent = false
			const next = this.queue.shift()
			if( next || !this.display_case() ) this.ready( false )
			this.active_case( next ? { ...next, token: crypto.randomUUID() } : null )
			if( next || !this.display_case() ) this.frame_generation( this.frame_generation() + 1 )
			this.busy( Boolean( next ) )
			if( !next ) {
				this.timing( { ...this.timing(), ended: Date.now() } )
				this.status( `Завершено ${ this.finished } из ${ this.total }; ошибки: ${ this.failed }` ); return
			}
			this.timing( { ...this.timing(), step: Date.now() } )
			this.status( `${ this.finished + 1 }/${ this.total }: ${ this.engine_title( next.engine ) }, ${ next.count } — загрузка` )
		}
		@ $mol_action
		fail_case() {
			const active = this.active_case()
			if( !active ) return
			this.finish_case( { ...this.partial_row(), state: 'Ошибка', error: `${ this.progress?.operation ?? 'Загрузка' }: ошибка выполнения` }, active.engine )
		}
		partial_row(): $rise_bench_archive_row {
			const active = this.active_case()!
			return this.progress?.row ?? {
				id: crypto.randomUUID(), count: Number( active.count ), properties: this.text_mode() ? 0 : active.schema === 'full' ? 10 : 4,
				stamp: new $mol_time_moment().toString( 'DD.MM.YYYY hh:mm:ss' ), state: 'Ошибка',
				baza_version: active.engine === 'goods' || active.engine === 'text' ? $rise_bench_run_baza_version : '—',
				benchmark_version: $rise_bench_run_benchmark_version, engine: active.engine === 'text' ? 'goods' : active.engine,
				engine_version: active.engine === 'text' ? $rise_bench_run_baza_version : $rise_bench_engine[ active.engine as $rise_bench_engine_kind ].version,
				computer: this.Controls().computer(), browser: navigator.userAgent,
				metrics: Object.fromEntries( this.operations().map( name => [ name, null ] ) ),
			}
		}
		@ $mol_action
		stop() {
			const active = this.active_case()
			if( !active ) return
			const row = { ...this.partial_row(), state: 'Остановлено', error: `Остановлено пользователем · ${ this.progress?.operation ?? 'Загрузка' }` }
			this.settled.add( active.token )
			this.queue = []
			this.display_case( null ); this.active_case( null ); this.busy( false ); this.ready( false )
			this.command_sent = false; this.progress = null
			this.timing( { ...this.timing(), ended: Date.now() } )
			// A new document tears down the old workload, its listeners and SQL workers.
			this.frame_generation( this.frame_generation() + 1 )
			this.status( `Остановлено. Завершено ${ this.finished } из ${ this.total }` )
			$mol_wire_async( this ).accept( row, active.engine ).catch( error => $mol_fail_log( error ) )
		}
		@ $mol_action
		finish_case( row: $rise_bench_archive_row, kind: string ) {
			const active = this.active_case()
			if( !active || this.settled.has( active.token ) ) return
			this.settled.add( active.token )
			++ this.finished
			if( row.state === 'Ошибка' ) ++ this.failed
			this.display_case( row.state === 'Готово' && !this.queue.length ? active : null )
			$mol_wire_async( this ).accept( row, kind ).catch( error => $mol_fail_log( error ) )
			this.next_case()
		}
		operations() {
			return $rise_bench_archive.operations( this.kind() )
		}
		@ $mol_mem
		fixture_uri() {
			const url = new URL( location.href )
			// The measured document runs the workload, not the parent unit-test suite.
			url.pathname = url.pathname.replace( /\/test\.html$/, '/index.html' )
			url.searchParams.set( 'rise_fixture', this.fixture_kind() )
			url.searchParams.set( 'rise_generation', String( this.frame_generation() ) )
			url.searchParams.set( 'rise_selection', [ this.engine(), this.count(), this.schema() ].join( ':' ) )
			const active = this.active_case() ?? this.display_case()
			if( active ) url.searchParams.set( 'rise_run', active.token )
			else url.searchParams.delete( 'rise_run' )
			const config = this.config()
			url.hash = '!count=' + config.count + '/lines=' + config.count + '/schema=' + config.schema
			return url.href
		}
		@ $mol_mem
		runs() {
			const rows = this.compare() ? Object.keys( $rise_bench_engine ).flatMap( kind => $rise_bench_archive.rows( kind ) ) : $rise_bench_archive.rows( this.kind() )
			const date = ( value: string )=> value.replace( /^(\d{2})\.(\d{2})\.(\d{4})/, '$3-$2-$1' )
			return [ ...rows ].sort( ( a, b )=> date( b.stamp ).localeCompare( date( a.stamp ) ) )
		}
		pages() { return this.kind() === 'demo' ? [ this.Results() ] : super.pages() }
		csv_filename() { return `rise-${ this.text_mode() ? 'text' : 'entities' }-v${ $rise_bench_run_benchmark_version }.csv` }
		csv_title() { return $mol_window.size().width < 640 ? 'CSV' : 'Скачать CSV' }
		@ $mol_mem
		csv_blob() {
			const columns = [ ...this.Metrics().col_ids(), 'Браузер' ]
			const runs = this.runs()
			const rows = this.Metrics().records().map( ( record: Record<string, unknown>, index: number )=> ({
				...record, 'Компьютер': runs[ index ].computer, 'Браузер': runs[ index ].browser,
				...Object.fromEntries( this.operations().map( operation => [ operation, runs[ index ].metric( operation ) ] ) ),
			}) )
			return new $mol_blob( [ $rise_bench_csv( rows, columns ) ], { type: 'text/csv;charset=utf-8' } )
		}
		results_body() { return this.kind() === 'demo' ? [ this.Frame() ] : [ this.mode() === 'charts' ? this.Charts() : this.History(), this.Frame() ] }
		retry_visible() { return this.outbox().length > 0 }
		@ $mol_mem
		outbox( next?: readonly $rise_bench_host_pending[] ) {
			return $mol_state_local.value< readonly $rise_bench_host_pending[] >( '$rise_bench_outbox_' + this.kind(), next ) ?? []
		}
		@ $mol_action
		accept( row: $rise_bench_archive_row, kind: string ) {
			if( !this.outbox().some( item => item.id === row.id ) ) this.outbox( [ ...this.outbox(), { ...row, kind } ] )
			const result = this.retry()
			if( !this.total && row.state === 'Ошибка' && !this.outbox().some( item => item.id === row.id ) ) this.status( 'Бенчмарк завершился с ошибкой. Доступные измерения сохранены.' )
			return result
		}
		@ $mol_action
		retry() {
			return $mol_error_fence( ()=> {
				for( const row of this.outbox() ) {
					$mol_wire_sync( $rise_bench_archive ).save( row.kind ?? this.kind(), row )
					this.outbox( this.outbox().filter( item => item.id !== row.id ) )
				}
				if( !this.total ) this.status( 'Результаты сохранены' )
			}, error => { this.status( 'Не удалось сохранить результат. Нажмите «Повторить сохранение».' ); return error } )
		}
		private restored = false
		@ $mol_action
		restore_outbox() {
			if( this.restored ) return
			this.restored = true
			if( this.outbox().length ) $mol_wire_async( this ).retry().catch( error => $mol_fail_log( error ) )
		}
		@ $mol_mem
		listener() {
			const receive = ( event: MessageEvent )=> {
				if( event.origin !== location.origin || event.source !== ( this.Frame().dom_node() as HTMLIFrameElement ).contentWindow ) return
				if( event.data?.kind !== this.fixture_kind() ) return
				const active = this.active_case()
				if( event.data?.token !== ( active?.token ?? this.display_case()?.token ?? null ) ) return
				if( event.data.type === 'rise-bench-progress' ) {
					if( !active || !this.command_sent || typeof event.data.operation !== 'string' || !Number.isFinite( event.data.started ) ) return
					const row = $rise_bench_archive.validate( event.data.row, this.operations() )
					if( !row || row.count !== Number( active.count ) || row.engine !== ( active.engine === 'text' ? 'goods' : active.engine ) ) return
					if( this.progress?.operation === event.data.operation && this.progress?.started === event.data.started ) return
					this.progress = { operation: event.data.operation, started: event.data.started, row }
					this.timing( { ...this.timing(), step: event.data.started } )
					this.status( `${ this.finished + 1 }/${ this.total }: ${ this.engine_title( active.engine ) }, ${ active.count } — ${ event.data.operation }` )
					return
				}
				if( event.data.type === 'rise-bench-state' ) {
					const config = this.config()
					if( event.data.count !== config.count || this.kind() !== 'text' && event.data.schema !== config.schema ) return
					this.ready( true ); this.busy( Boolean( active ) || event.data.busy === true )
					if( active && !this.command_sent && !event.data.busy ) { this.command_sent = true; this.send( 'run', config ) }
					if( typeof event.data.error === 'string' ) { if( active ) this.fail_case(); else this.status( event.data.error ) }
					return
				}
				if( event.data.type !== 'rise-bench-result' ) return
				const row = $rise_bench_archive.validate( event.data.row, this.operations() )
				if( !row ) return
				if( active ) this.finish_case( row, event.data.kind )
			}
			window.addEventListener( 'message', receive )
			return { destructor: ()=> window.removeEventListener( 'message', receive ) }
		}
		override destructor() {
			this.queue = []
			super.destructor()
		}
		override auto() {
			if( this.kind() === 'demo' ) return []
			this.listener()
			this.restore_outbox()
			$rise_bench_seed.lands()
			$giper_baza_glob.yard().sync()
			return []
		}
	}
}
