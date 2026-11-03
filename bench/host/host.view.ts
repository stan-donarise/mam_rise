namespace $.$$ {
	export class $rise_bench_host extends $.$rise_bench_host {
		operations() {
			return $rise_bench_archive.operations( this.kind() )
		}
		@ $mol_mem
		fixture_uri() {
			const url = new URL( location.href )
			url.searchParams.set( 'rise_fixture', this.kind() )
			url.hash = ''
			return url.href
		}
		@ $mol_mem
		runs() { return $rise_bench_archive.rows( this.kind() ) }
		body() { return this.kind() === 'demo' ? [ this.Frame() ] : [ this.Status(), ... this.outbox().length ? [ this.Retry() ] : [], this.Metrics(), this.Frame() ] }
		@ $mol_mem
		outbox( next?: readonly $rise_bench_archive_row[] ) {
			return $mol_state_local.value< readonly $rise_bench_archive_row[] >( '$rise_bench_outbox_' + this.kind(), next ) ?? []
		}
		@ $mol_action
		accept( row: $rise_bench_archive_row ) {
			if( !this.outbox().some( item => item.id === row.id ) ) this.outbox( [ ...this.outbox(), row ] )
			return this.retry()
		}
		@ $mol_action
		retry() {
			return $mol_error_fence( ()=> {
				for( const row of this.outbox() ) {
					$mol_wire_sync( $rise_bench_archive ).save( this.kind(), row )
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
				if( event.data?.type !== 'rise-bench-result' || event.data.kind !== this.kind() ) return
				const row = $rise_bench_archive.validate( event.data.row, this.operations() )
				if( !row ) return
				$mol_wire_async( this ).accept( row ).catch( error => $mol_fail_log( error ) )
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
