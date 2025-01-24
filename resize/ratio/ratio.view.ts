namespace $.$$ {

	export class $rise_resize_ratio extends $.$rise_resize_ratio {

		top_edge_y_by_ratio() {
			const height_next = this.width() / this.ratio()
			const top_edge_y_stick = this.bottom_edge_y_stick() - height_next
			this.top_edge_y_stick( top_edge_y_stick )
		}

		bottom_edge_y_by_ratio() {
			const height_next = this.width() / this.ratio()
			const bottom_edge_y_stick = height_next + this.top_edge_y_stick()
			this.bottom_edge_y_stick( bottom_edge_y_stick )
		}

		left_edge_x_by_ratio() {
			const width_next = this.height() * this.ratio()
			const left_edge_x_stick = this.right_edge_x_stick() - width_next
			this.left_edge_x_stick( left_edge_x_stick )
		}

		right_edge_x_by_ratio() {
			const width_next = this.height() * this.ratio()
			const right_edge_x_stick = width_next + this.left_edge_x_stick()
			this.right_edge_x_stick( right_edge_x_stick )
		}

		@ $mol_mem
		left_top_edge_ratio_x( next?: number ): number {
			if( next === undefined ) return 0
			this.left_edge_x( next )
			this.top_edge_y_by_ratio()
			return next
		}
		@ $mol_mem
		left_bottom_edge_ratio_x( next?: number ): number {
			if( next === undefined ) return 0
			this.left_edge_x( next )
			this.bottom_edge_y_by_ratio()
			return next
		}
		@ $mol_mem
		right_bottom_edge_ratio_x( next?: number ): number {
			if( next === undefined ) return 0
			this.right_edge_x( next )
			this.bottom_edge_y_by_ratio()
			return next
		}
		@ $mol_mem
		top_left_edge_ratio_y( next?: number ): number {
			if( next === undefined ) return 0
			this.top_edge_y( next )
			this.left_edge_x_by_ratio()
			return next
		}
		@ $mol_mem
		right_top_edge_ratio_x( next?: number ): number {
			if( next === undefined ) return 0
			this.right_edge_x( next )
			this.top_edge_y_by_ratio()
			return next
		}
		@ $mol_mem
		top_right_edge_ratio_y( next?: number ): number {
			if( next === undefined ) return 0
			this.top_edge_y( next )
			this.right_edge_x_by_ratio()
			return next
		}
		@ $mol_mem
		bottom_left_edge_ratio_y( next?: number ): number {
			if( next === undefined ) return 0
			this.bottom_edge_y( next )
			this.left_edge_x_by_ratio()
			return next
		}
		@ $mol_mem
		bottom_right_edge_ratio_y( next?: number ): number {
			if( next === undefined ) return 0
			this.bottom_edge_y( next )
			this.right_edge_x_by_ratio()
			return next
		}

		@ $mol_mem
		edges(): readonly ( any )[] {
			return this.ratio() ? this.edges_ratio() : super.edges()
		}

		@ $mol_action
		vals_to_sticks() {
			this.x( this.x_stick() )
			this.y( this.y_stick() )
			
			if( this.ratio() ) {
				this.left_bottom_edge_ratio_x( this.left_edge_x_stick() )
				this.left_top_edge_ratio_x( this.left_edge_x_stick() )
				this.right_bottom_edge_ratio_x( this.right_edge_x_stick() )
				this.right_top_edge_ratio_x( this.right_edge_x_stick() )
				this.top_left_edge_ratio_y( this.top_edge_y_stick() )
				this.top_right_edge_ratio_y( this.top_edge_y_stick() )
				this.bottom_left_edge_ratio_y( this.bottom_edge_y_stick() )
				this.bottom_right_edge_ratio_y( this.bottom_edge_y_stick() )
			} else {
				this.bottom_edge_y( this.bottom_edge_y_stick() )
				this.right_edge_x( this.right_edge_x_stick() )
				this.top_edge_y( this.top_edge_y_stick() )
				this.left_edge_x( this.left_edge_x_stick() )
			}
		}

	}

}
