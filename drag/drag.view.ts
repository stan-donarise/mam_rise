namespace $.$$ {

	export class $rise_drag extends $.$rise_drag {

		repos_x( val: number ): number {
			return val
		}
		
		repos_y( val: number ): number {
			return val
		}

		start_event?: PointerEvent
		start_pos?: { x: number, y: number }
		drags_synced_frozen: readonly $.$rise_drag[] = []

		drag_start( event: PointerEvent ) {
			this.start_event = event
			this.start_pos = { x: this.x(), y: this.y() }
			this.dragged( true )
			this.on_drag_start( event )
		}

		drag( event: PointerEvent ) {
			this.x( this.start_pos!.x + this.repos_x( event.x - this.start_event!.x ) )
			this.y( this.start_pos!.y + this.repos_y( event.y - this.start_event!.y ) )
			this.on_drag( event )
		}

		drag_end( event: PointerEvent ) {
			this.dragged( false )
			this.on_drag_end( event )
		}

		pointerdown( event: PointerEvent ) {
			
			if( !this.use_buttons().includes( event.button ) ) return
			
			this.drag_start( event )
			this.drags_synced_frozen = this.drags_synced()
			this.drags_synced_frozen.forEach( d => d.drag_start( event ) )
			//immediate flush:
			this.pointermove_listener()
			this.pointerup_listener()
			
		}

		@ $mol_mem
		pointermove_listener() {
			$mol_wire_solid()
			if( !this.dragged() ) return null

			return new $mol_dom_listener(
				this.$.$mol_dom_context.document,
				'pointermove',
				this.handle_pointermove_async,
			)
		}
		handle_pointermove_async = $mol_wire_async( ( event: PointerEvent )=> {
			this.drag( event )
			this.drags_synced_frozen.forEach( d => d.drag( event ) )
		} )

		@ $mol_mem
		pointerup_listener() {
			$mol_wire_solid()
			if( !this.dragged() ) return null

			return new $mol_dom_listener(
				this.$.$mol_dom_context.document,
				'pointerup',
				this.handle_pointerup_async,
			)
		}
		handle_pointerup_async = $mol_wire_async( ( event: PointerEvent )=> {
			this.drag_end( event )
			this.drags_synced_frozen.forEach( d => d.drag_end( event ) )
			this.drags_synced_frozen = []
			//immediate flush:
			this.pointerup_listener()
			this.pointermove_listener()
		} )
		
	}
	
}
