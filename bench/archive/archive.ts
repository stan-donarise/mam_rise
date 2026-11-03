namespace $ {
	export type $rise_bench_archive_row = {
		id?: string
		count: number
		properties: number
		stamp: string
		state: string
		baza_version?: string
		benchmark_version?: string
		metrics: Record< string, number | null >
	}

	/** Small result metadata only. Never stores a workload Land or database name. */
	export class $rise_bench_archive extends $mol_object {
		static link = 'CdQsmv8O_YAqIGknH'
		static operations( kind: string ) {
			return kind === 'text' ? [ 'Вставка, с', 'Добавить символ, с', 'F5, с' ]
				: [ 'Создание, с', 'Поиск, с', 'Добавить 1, с', 'F5, с', 'Поиск после F5, с' ]
		}
		private static readonly preset: $giper_baza_rank_preset = [[ null, $giper_baza_rank_post( 'just' ) ]]
		@ $mol_action
		static provision() {
			this.$.$giper_baza_auth.current().pass()
			const land = $mol_wire_sync( $giper_baza_glob ).land_grab( this.preset )
			land.Data( $giper_baza_dict ).dive( 'title', $giper_baza_atom_text, null )!.val( 'Rise benchmark results' )
			$mol_wire_sync( land ).units_saving()
			return land.link().str
		}
		@ $mol_mem
		static root() {
			if( !this.link ) throw new Error( 'Не настроен общий Land результатов' )
			return $giper_baza_glob.Land( new $giper_baza_link( this.link ) ).Data( $giper_baza_dict )
		}
		static validate( value: unknown, operations: readonly string[] ): $rise_bench_archive_row | null {
			if( !value || typeof value !== 'object' ) return null
			const row = value as $rise_bench_archive_row
			if( typeof row.id !== 'string' || !/^[\da-f-]{36}$/.test( row.id ) ) return null
			if( !Number.isSafeInteger( row.count ) || row.count < 1 || row.count > 10000 ) return null
			if( ![ 0, 4, 10 ].includes( row.properties ) || ![ 'Готово', 'Ошибка' ].includes( row.state ) ) return null
			if( typeof row.stamp !== 'string' || !/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2}$/.test( row.stamp ) ) return null
			if( typeof row.baza_version !== 'string' || !/^(?:[\da-f]{40}|—)$/.test( row.baza_version ) ) return null
			if( typeof row.benchmark_version !== 'string' || !/^\d+\.\d+\.\d+$/.test( row.benchmark_version ) ) return null
			if( !row.metrics || typeof row.metrics !== 'object' ) return null
			const metrics: Record< string, number | null > = {}
			for( const name of operations ) {
				const time = row.metrics[ name ]
				if( time !== null && ( typeof time !== 'number' || !Number.isFinite( time ) || time < 0 ) ) return null
				metrics[ name ] = time
			}
			return { id: row.id, count: row.count, properties: row.properties, stamp: row.stamp, state: row.state,
				baza_version: row.baza_version, benchmark_version: row.benchmark_version, metrics }
		}
		@ $mol_action
		static save( kind: string, row: $rise_bench_archive_row ) {
			if( ![ 'goods', 'text', 'idb' ].includes( kind ) ) throw new Error( 'Неизвестный бенчмарк' )
			const validated = this.validate( row, this.operations( kind ) )
			if( !validated ) throw new Error( 'Некорректный результат бенчмарка' )
			const atom = this.root().dive( kind + ':' + row.id, $giper_baza_atom_text, null )
			if( !atom ) throw new Error( 'Нет доступа к результатам' )
			atom.val( JSON.stringify( validated ) )
			$mol_wire_sync( this.root().land() ).units_saving()
		}
		@ $mol_mem_key
		static rows( kind: string ) {
			const root = this.root()
			return root.keys().filter( key => typeof key === 'string' && key.startsWith( kind + ':' ) ).flatMap( key => {
				const text = root.dive( key, $giper_baza_atom_text )?.val()
				const row = text && $mol_error_fence( ()=> this.validate( JSON.parse( text ), this.operations( kind ) ), ()=> null )
				if( !row ) return []
				if( key !== kind + ':' + row.id ) return []
				const run = new $rise_bench_run( row.count, row.properties, row.stamp, row.baza_version ?? '—', row.benchmark_version ?? '—', row.id )
				run.state( row.state )
				for( const [ operation, value ] of Object.entries( row.metrics ) ) if( typeof value === 'number' ) run.metric( operation, value )
				return [ run ]
			})
		}
	}
}
