namespace $ {
	/** UTF-8 with BOM and semicolons opens correctly in Russian Windows Excel. */
	export function $rise_bench_csv( rows: readonly Record<string, unknown>[], columns: readonly string[] ) {
		const cell = ( value: unknown )=> {
			const text = String( value ?? '' )
			// Quoting alone does not protect spreadsheet applications from formulas.
			return typeof value === 'string' && /^[=+@\-\t\r]/.test( text ) ? "'" + text : text
		}
		return '\uFEFF' + $mol_csv_serial_table( [ [ ...columns ], ...rows.map( row => columns.map( key => cell( row[ key ] ) ) ) ], ';' )
	}
}
