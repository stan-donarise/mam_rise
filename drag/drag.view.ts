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
			
			this.drag_start( event )
			this.drags_synced().forEach( d => d.drag_start( event ) )
			
			const mousemove =  new $mol_dom_listener(
				this.$.$mol_dom_context.document,
				'mousemove',
				$mol_wire_async( event => {
					this.drag( event )
					this.drags_synced().forEach( d => d.drag( event ) )
				} ),
			)

			const mouseup = new $mol_dom_listener(
				this.$.$mol_dom_context.document,
				'mouseup',
				$mol_wire_async( event => {
					this.drag_end( event )
					this.drags_synced().forEach( d => d.drag_end( event ) )
					mouseup?.destructor()
					mousemove?.destructor()
				} ),
			)
			
		}
		
	}
	
}
