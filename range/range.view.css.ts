namespace $.$$ {
	
	const Thumb_size = $mol_gap.block
	const Track_height = $mol_gap.space
	const Track_margin = $mol_gap.block // expands vertical clickable area
	
	$mol_style_define( $rise_range, {
		
		flex: {
			grow: 1,
			direction: 'column',
		},
		padding: {
			top: $mol_gap.space,
			bottom: $mol_gap.space,
		},

		Labels: {
			pointerEvents: 'none',
			left: 0,
			right: 0,
			justify: {
				content: 'space-between',
			},
		},

		Current: {
			pointerEvents: 'none',
			position: 'relative',
			height: '1.5rem',
			margin: {
				left: $mol_style_func.calc( `${Thumb_size} / 2` ),
				right: $mol_style_func.calc( `${Thumb_size} / 2` ),
			},
		},

		'[disabled]': {
			'true': {
				Value: {
					color: $mol_theme.shade,
				},
			},
		},

		Value: {
			position: 'absolute',
			left: $mol_style_func.vary( '--rise_range_percent' ),
			transform: 'translateX(-50%)',
			color: $mol_theme.current,
		},
		
	} )

	const Track = {
		height: Track_height,

		border: {
			radius: $mol_gap.round,
		},
		background: {
			color: $mol_theme.line,
		},
	} as const

	const Thumb = {
		height: Thumb_size,
		width: Thumb_size,
		margin: {
			top: $mol_style_func.calc( `(${Track_height} - ${Thumb_size}) / 2` ),
		},

		appearance: 'none',
		border: {
			radius: '50%',
		},
		background: {
			color: $mol_theme.current,
		},
	} as const

	$mol_style_define( $rise_range_input, {

		height: $mol_style_func.calc( `${Thumb_size} + 2 * ${Track_margin}` ),
		margin: {
			top: $mol_style_func.calc( `-1 * ${Track_margin} / 2 - var(--mol_gap_space)` ),
			bottom: $mol_style_func.calc( `-1 * ${Track_margin} / 2` ),
			left: 0,
			right: 0,
		},
		
		'::-webkit-slider-runnable-track': Track,
		['::-moz-range-track' as any]: Track as any,
		
		'::-webkit-slider-thumb': Thumb,
		['::-moz-range-thumb' as any]: Thumb as any,
		
		appearance: 'none',
		background: {
			color: 'transparent',
		},
		cursor: 'pointer',
		
		':disabled': {
			cursor: 'default',
			'::-webkit-slider-thumb': {
				background: {
					color: $mol_theme.shade,
				},
			},
			['::-moz-range-thumb' as any]: {
				background: {
					color: $mol_theme.shade,
				},
			} as any,
		},
		
		':focus': {
			outline: 'none',
		},
		
	} )

	$mol_style_define( $rise_range_value, {
		
		'[disabled]': {
			'true': {
				color: $mol_theme.shade,
			},
		},
		
	} )
	
}
