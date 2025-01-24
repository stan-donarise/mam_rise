namespace $.$$ {

	$mol_style_define( $rise_radio, {
		
		gap: '1rem',
		
		Circle: {
			height: '1rem',
			width: '1rem',
			border: {
				radius: '50%',
			},
			justify: {
				content: 'center'
			},
			align: {
				items: 'center'
			},
			box: {
				shadow: [[ 'inset', 0, 0, 0, '1px', $mol_theme.control ]],
			},
		},

		Option: {
			padding: 0,
			'[mol_check_checked]': {
				true: {
					['Circle' as '$mol_view']: {
						box: {
							shadow: [[ 'inset', 0, 0, 0, '1px', $mol_theme.current ]],
						},
					},
				},
			},
		},

		Circle_inner: {
			height: '.5rem',
			width: '.5rem',
			background: {
				color: $mol_theme.current,
			},
			border: {
				radius: '50%',
			},
		},
		
	} )
	
}
