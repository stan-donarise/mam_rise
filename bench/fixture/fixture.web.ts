namespace $.$$ {
	/** Commands carry settings only; the online host never instantiates datasets. */
	export class $rise_bench_fixture extends $mol_object {
		constructor( readonly kind: string, readonly bench: $rise_bench_baza_goods | $rise_bench_baza_crdttext | $rise_bench_idb ) {
			super()
			// A measured reload must not overlap a cross-document animation.
			if( window.parent !== window ) $mol_style_attach( 'rise-bench-fixture-transition', '@view-transition { navigation: none; }' )
		}
		private readonly completed = new Set< string >()
		@ $mol_mem
		active( next: string | null = null ) { return next }
		@ $mol_mem
		listener() { return new $mol_dom_listener( window, 'message', $mol_wire_async( this ).receive ) }
		@ $mol_action
		configure( data: { count?: string, schema?: string } ) {
			if( typeof data.count === 'string' && Object.hasOwn( this.bench.Count().options(), data.count ) ) this.bench.count_mode( data.count )
			if( this.kind !== 'text' && [ 'compact', 'full' ].includes( data.schema ?? '' ) ) ( this.bench as $rise_bench_baza_goods | $rise_bench_idb ).schema_mode( data.schema )
		}
		@ $mol_action
		receive( event: MessageEvent ) {
			if( event.origin !== location.origin || event.source !== window.parent ) return
			const request = event.data
			if( request?.type !== 'rise-bench-command' || request.kind !== this.kind || typeof request.id !== 'string' ) return
			if( request.command !== 'run' || !request.data || typeof request.data !== 'object' ) return
			if( this.completed.has( request.id ) || this.active() && this.active() !== request.id ) return
			this.active( request.id )
			this.report()
			return $mol_error_fence( ()=> {
				$mol_wire_sync( this ).configure( request.data )
				$mol_wire_sync( this.bench ).benchmark()
				this.completed.add( request.id )
				this.active( null )
				this.report()
			}, error => {
				this.completed.add( request.id ); this.active( null )
				this.report()
			window.parent.postMessage({ type: 'rise-bench-state', kind: this.kind, token: new URL( location.href ).searchParams.get( 'rise_run' ), count: this.bench.count_mode(),
					schema: this.kind === 'text' ? 'compact' : ( this.bench as $rise_bench_idb ).schema_mode(), busy: false, error: String( error ) }, location.origin )
				return error
			} )
		}
		private last_state = ''
		report() {
			this.listener()
			const state = JSON.stringify({ type: 'rise-bench-state', kind: this.kind, token: new URL( location.href ).searchParams.get( 'rise_run' ),
				count: this.bench.count_mode(), schema: this.kind === 'text' ? 'compact' : ( this.bench as $rise_bench_idb ).schema_mode(),
				busy: Boolean( this.active() ) || !this.bench.controls_enabled() })
			if( state === this.last_state ) return
			this.last_state = state
			window.parent.postMessage( JSON.parse( state ), location.origin )
		}
	}
}
