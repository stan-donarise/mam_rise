namespace $.$$ {

	export class $rise_resize_ratio_demo extends $.$rise_resize_ratio_demo {
		
		content(): string {
			return ''+
				'! height\n  ! ' + this.height() + '\n' + //+ '\n    ! ' + this.height_stick() + '\n' +
				'! width\n  ! ' + this.width() + '\n' + //+ '\n    ! ' + this.width_stick() + '\n' +
				'! top\n  ! ' + this.top() + '\n' + //+ '\n    ! ' + this.top_stick() + '\n' +
				'! left\n  ! ' + this.left() + '\n' + //+ '\n    ! ' + this.left_stick() + '\n' +
				// ''
				'! x\n  ! ' + this.x() + '\n    ! ' + this.x_stick() + '\n' +
				'! right_edge_x\n  ! ' + this.right_edge_x() + '\n    ! ' + this.right_edge_x_stick() + '\n' +
				'! left_edge_x\n  ! ' + this.left_edge_x() + '\n    ! ' + this.left_edge_x_stick() + '\n' +
				'! y\n  ! ' + this.y() + '\n    ! ' + this.y_stick() + '\n' +
				'! bottom_edge_y\n  ! ' + this.bottom_edge_y() + '\n    ! ' + this.bottom_edge_y_stick() + '\n' +
				'! top_edge_y\n  ! ' + this.top_edge_y() + '\n    ! ' + this.top_edge_y_stick() + '\n'
		}

		sticks() {
			return [
				... this.sticks_x().map( x => this.Stick_x( x ) ),
				... this.sticks_y().map( y => this.Stick_y( y ) ),
			]
		}

		@ $mol_mem_key
		stick_left( x: number ): string {
			return x + 'px'
		}

		@ $mol_mem_key
		stick_top( y: number ): string {
			return y + 'px'
		}
		
	}

}
