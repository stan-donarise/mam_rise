namespace $.$$ {
	type $rise_bench_host_pending = $rise_bench_archive_row & { kind?: string }
	export class $rise_bench_host extends $.$rise_bench_host {
		menu_title() { return this.title() }
		compare() { return this.kind() === 'goods' }
		text_mode() { return this.kind() === 'text' }
		@ $mol_mem
		mode( next?: string ) { return $mol_state_arg.value( 'results', next ) === 'charts' ? 'charts' : 'table' }
		fixture_kind() { return this.compare() ? this.engine() : this.kind() }
		@ $mol_mem
		engine( next?: string ) {
			const current = $mol_state_arg.value( 'engine' ) === 'idb' ? 'idb' : 'goods'
			if( next !== undefined && ( next === 'idb' ? 'idb' : 'goods' ) !== current ) this.ready( false )
			return $mol_state_arg.value( 'engine', next ) === 'idb' ? 'idb' : 'goods'
		}
		@ $mol_mem
		count( next?: string ) {
			const key = this.kind() === 'text' ? 'lines' : 'count'
			const value = $mol_state_arg.value( key, next ) ?? '100'
			return Object.hasOwn( this.Controls().counts(), value ) ? value : '100'
		}
		@ $mol_mem
		schema( next?: string ) {
			return $mol_state_arg.value( 'schema', next ) === 'full' ? 'full' : 'compact'
		}
		@ $mol_mem
		ready( next = false ) { return next }
		@ $mol_mem
		busy( next = false ) { return next }
		controls_enabled() { return this.ready() && !this.busy() }
		config() { return { count: this.count(), schema: this.schema() } }
		@ $mol_action
		send( command: string, data: object ) {
			const target = ( this.Frame().dom_node() as HTMLIFrameElement ).contentWindow
			if( !target || !this.ready() ) throw new Error( 'Дождитесь загрузки бенчмарка' )
			target.postMessage({ type: 'rise-bench-command', kind: this.fixture_kind(), id: crypto.randomUUID(), command, data }, location.origin )
		}
		@ $mol_action
		run() { this.send( 'run', this.config() ); this.busy( true ); this.status( 'Выполняется' ) }
		operations() {
			return $rise_bench_archive.operations( this.kind() )
		}
		@ $mol_mem
		fixture_uri() {
			const url = new URL( location.href )
			// The measured document runs the workload, not the parent unit-test suite.
			url.pathname = url.pathname.replace( /\/test\.html$/, '/index.html' )
			url.searchParams.set( 'rise_fixture', this.fixture_kind() )
			url.hash = '!count=' + this.count() + '/lines=' + this.count() + '/schema=' + this.schema()
			return url.href
		}
		@ $mol_mem
		runs() {
			const rows = this.compare() ? [ ...$rise_bench_archive.rows( 'goods' ), ...$rise_bench_archive.rows( 'idb' ) ] : $rise_bench_archive.rows( this.kind() )
			const date = ( value: string )=> value.replace( /^(\d{2})\.(\d{2})\.(\d{4})/, '$3-$2-$1' )
			return [ ...rows ].sort( ( a, b )=> date( b.stamp ).localeCompare( date( a.stamp ) ) )
		}
		pages() { return this.kind() === 'demo' ? [ this.Results() ] : super.pages() }
		results_body() { return this.kind() === 'demo' ? [ this.Frame() ] : [ this.mode() === 'charts' ? this.Charts() : this.History(), this.Frame() ] }
		retry_visible() { return this.outbox().length > 0 }
		@ $mol_mem
		outbox( next?: readonly $rise_bench_host_pending[] ) {
			return $mol_state_local.value< readonly $rise_bench_host_pending[] >( '$rise_bench_outbox_' + this.kind(), next ) ?? []
		}
		@ $mol_action
		accept( row: $rise_bench_archive_row, kind: string ) {
			if( !this.outbox().some( item => item.id === row.id ) ) this.outbox( [ ...this.outbox(), { ...row, kind } ] )
			return this.retry()
		}
		@ $mol_action
		retry() {
			return $mol_error_fence( ()=> {
				for( const row of this.outbox() ) {
					$mol_wire_sync( $rise_bench_archive ).save( row.kind ?? this.kind(), row )
					this.outbox( this.outbox().filter( item => item.id !== row.id ) )
				}
				this.status( 'Результаты сохранены' )
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
				if( event.data.type === 'rise-bench-state' ) {
					this.ready( true ); this.busy( event.data.busy === true )
					if( typeof event.data.error === 'string' ) this.status( event.data.error )
					return
				}
				if( event.data.type !== 'rise-bench-result' ) return
				const row = $rise_bench_archive.validate( event.data.row, this.operations() )
				if( !row ) return
				this.busy( false )
				$mol_wire_async( this ).accept( row, event.data.kind ).catch( error => $mol_fail_log( error ) )
			}
			window.addEventListener( 'message', receive )
			return { destructor: ()=> window.removeEventListener( 'message', receive ) }
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
