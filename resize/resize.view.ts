namespace $.$$ {

	export class $rise_resize extends $.$rise_resize {

		repos_x( val: number ): number {
			return val
		}
		
		repos_y( val: number ): number {
			return val
		}
		
		to_stick( sticks: readonly number[], val: number, shift: number ) {
			if( !this.stickable() ) return val
			
			for( const stick of sticks ) {
				const to_stick = stick - (val + shift)
				if( Math.abs( to_stick ) < this.stick_threshold() ) {
					return val + to_stick
				}
			}
			return val
		}

		to_stick_x( val: number, shift: number ) {
			return this.to_stick( this.sticks_x(), val, shift )
		}

		to_stick_y( val: number, shift: number ) {
			return this.to_stick( this.sticks_y(), val, shift )
		}

		@ $mol_mem
		y( next?: number ): number {
			if( next === undefined ) return 0
			const top_stick = this.to_stick_y( next, this.top_edge_y_stick() )
			if( top_stick == next ) {
				const bottom_stick = this.to_stick_y( next, this.top_edge_y_stick() + this.height() )
				this.y_stick( bottom_stick )
			} else {
				this.y_stick( top_stick )
			}
			return next
		}

		@ $mol_mem
		x( next?: number ): number {
			if( next === undefined ) return 0
			const left_stick = this.to_stick_x( next, this.left_edge_x_stick() )
			if( left_stick == next ) {
				const right_stick = this.to_stick_x( next, this.left_edge_x_stick() + this.width() )
				this.x_stick( right_stick )
			} else {
				this.x_stick( left_stick )
			}
			return next
		}

		@ $mol_mem
		top_edge_y( next?: number ): number {
			if( next === undefined ) return 0
			const limit = this.bottom_edge_y_stick() - this.height_min()
			const top_edge_y_stick = Math.min( this.to_stick_y( next, this.y_stick() ), limit )
			this.top_edge_y_stick( top_edge_y_stick )
			return next
		}

		@ $mol_mem
		bottom_edge_y( next?: number ): number {
			if( next === undefined ) return 0
			const limit = this.top_edge_y_stick() + this.height_min()
			const bottom_edge_y_stick = Math.max( this.to_stick_y( next, this.top() - this.top_edge_y_stick() ), limit )
			this.bottom_edge_y_stick( bottom_edge_y_stick )
			return next
		}

		@ $mol_mem
		left_edge_x( next?: number ): number {
			if( next === undefined ) return 0
			const limit = this.right_edge_x_stick() - this.width_min()
			const left_edge_x_stick = Math.min( this.to_stick_x( next, this.x_stick() ), limit )
			this.left_edge_x_stick( left_edge_x_stick )
			return next
		}

		@ $mol_mem
		right_edge_x( next?: number ): number {
			if( next === undefined ) return 0
			const limit =  this.left_edge_x_stick() + this.width_min()
			let right_edge_x_stick = Math.max( this.to_stick_x( next, this.left() - this.left_edge_x_stick() ), limit )
			this.right_edge_x_stick( right_edge_x_stick )
			return next
		}

		@ $mol_mem
		top( next?: number ): number {
			if( next !== undefined ) {
				this.y_stick( next - this.top_edge_y_stick() )
			}
			return this.y_stick() + this.top_edge_y_stick()
		}

		@ $mol_mem
		left( next?: number ): number {
			if( next !== undefined ) {
				this.x_stick( next - this.left_edge_x_stick() )
			}
			return this.x_stick() + this.left_edge_x_stick()
		}

		@ $mol_mem
		width( next?: number ): number {
			if( next !== undefined ) {
				console.log('next', next)
				this.right_edge_x_stick( next + this.left_edge_x_stick() )
			}
			return this.right_edge_x_stick() - this.left_edge_x_stick()
		}

		@ $mol_mem
		height( next?: number ): number {
			if( next !== undefined ) {
				this.bottom_edge_y_stick( next + this.top_edge_y_stick() )
			}
			return this.bottom_edge_y_stick() - this.top_edge_y_stick()
		}

		@ $mol_mem
		height_px(): string {
			return this.height() + 'px'
		}

		@ $mol_mem
		width_px(): string {
			return this.width() + 'px'
		}

		@ $mol_mem
		top_px(): string {
			return this.top() + 'px'
		}

		@ $mol_mem
		left_px(): string {
			return this.left() + 'px'
		}

		on_drag_end() {
			this.vals_to_sticks()
		}

		resize_start( next?: any ) {
			this.resizing( true )
		}

		resize_end() {
			this.on_drag_end()
			this.resizing( false )
		}

		@ $mol_action
		vals_to_sticks() {
			this.x( this.x_stick() )
			this.y( this.y_stick() )
			
			this.bottom_edge_y( this.bottom_edge_y_stick() )
			this.right_edge_x( this.right_edge_x_stick() )
			this.top_edge_y( this.top_edge_y_stick() )
			this.left_edge_x( this.left_edge_x_stick() )
		}

	}

}
