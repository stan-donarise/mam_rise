namespace $.$$ {

	const Edge_size = 10

	const Top_edge = {
		top: `-${ Edge_size/2 }px`,
		height: `${ Edge_size }px`,
	} as const

	const Left_edge = {
		left: `-${ Edge_size/2 }px`,
		width: `${ Edge_size }px`,
	} as const

	const Right_edge = {
		right: `-${ Edge_size/2 }px`,
		width: `${ Edge_size }px`,
	} as const

	const Bottom_edge = {
		bottom: `-${ Edge_size/2 }px`,
		height: `${ Edge_size }px`,
	} as const
	
	$mol_style_define( $rise_resize_ratio, {

		Left_top_edge_ratio: {
			cursor: 'nwse-resize',
			... Left_edge,
			height: '50%',
		},
		
		Left_bottom_edge_ratio: {
			cursor: 'nesw-resize',
			... Left_edge,
			height: '50%',
			top: '50%',
		},

		Right_bottom_edge_ratio: {
			cursor: 'nwse-resize',
			... Right_edge,
			height: '50%',
			top: '50%',
		},
		
		Right_top_edge_ratio: {
			cursor: 'nesw-resize',
			... Right_edge,
			height: '50%',
		},
		
		Top_left_edge_ratio: {
			cursor: 'nwse-resize',
			... Top_edge,
			width: '50%',
		},
		
		Top_right_edge_ratio: {
			cursor: 'nesw-resize',
			... Top_edge,
			width: '50%',
			left: '50%',
		},
		
		Bottom_left_edge_ratio: {
			cursor: 'nesw-resize',
			... Bottom_edge,
			width: '50%',
		},
		
		Bottom_right_edge_ratio: {
			cursor: 'nwse-resize',
			... Bottom_edge,
			width: '50%',
			left: '50%',
		},
		
	} )
	
}
