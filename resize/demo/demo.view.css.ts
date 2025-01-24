namespace $.$$ {

	const Stick = {
		position: 'absolute',
		background: {
			color: 'red',
		},
		opacity: 0.2,
	} as const
	
	$mol_style_define( $rise_resize_demo, {

		position: 'relative',
		height: '100%',

		Resize: {
			background: {
				color: $mol_theme.card,
			},
		},

		Stick_x: {
			...Stick,
			height: '100%',
			width: '1px',
		},

		Stick_y: {
			...Stick,
			width: '100%',
			height: '1px',
		},
		
	} )
	
}
