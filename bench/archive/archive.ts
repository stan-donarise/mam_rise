namespace $ {
	export type $rise_bench_archive_row = {
		id?: string
		count: number
		properties: number
		stamp: string
		state: string
		error?: string
		baza_version?: string
		benchmark_version?: string
		engine?: string
		engine_version?: string
		computer?: string
		browser?: string
		bytes?: number | null
		metrics: Record< string, number | null >
	}

	/** Small result metadata only. Never stores a workload Land or database name. */
	export class $rise_bench_archive extends $mol_object {
		static link = 'CdQsmv8O_YAqIGknH'
		static operations( kind: string ) {
			return kind === 'text' ? [ 'Вставка, с', 'Добавить символ, с', 'F5, с' ]
				: [ 'Запуск БД, с', 'Создание, с', 'Поиск, с', 'Добавить 1, с', 'F5, с', 'Поиск после F5, с' ]
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
			$rise_bench_archive_seed.apply()
			return $giper_baza_glob.Land( new $giper_baza_link( this.link ) ).Data( $giper_baza_dict )
		}
		static validate( value: unknown, operations: readonly string[] ): $rise_bench_archive_row | null {
			if( !value || typeof value !== 'object' ) return null
			const row = value as $rise_bench_archive_row
			if( typeof row.id !== 'string' || !/^[\da-f-]{36}$/.test( row.id ) ) return null
			if( !Number.isSafeInteger( row.count ) || row.count < 1 || row.count > 10000 ) return null
			if( ![ 0, 4, 10 ].includes( row.properties ) || ![ 'Готово', 'Ошибка' ].includes( row.state ) ) return null
			if( typeof row.stamp !== 'string' || !/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2}$/.test( row.stamp ) ) return null
			if( row.error !== undefined && ( typeof row.error !== 'string' || row.error.length > 2000 ) ) return null
			if( typeof row.baza_version !== 'string' || !/^(?:[\da-f]{40}|—)$/.test( row.baza_version ) ) return null
			if( typeof row.benchmark_version !== 'string' || !/^\d+\.\d+\.\d+$/.test( row.benchmark_version ) ) return null
			if( row.engine !== undefined && !Object.hasOwn( $rise_bench_engine, row.engine ) ) return null
			if( row.engine_version !== undefined && ( typeof row.engine_version !== 'string' || !/^[\w.\-—]{1,80}$/.test( row.engine_version ) ) ) return null
			if( row.computer !== undefined && ( typeof row.computer !== 'string' || row.computer.length > 8000 ) ) return null
			if( row.browser !== undefined && ( typeof row.browser !== 'string' || row.browser.length > 4000 ) ) return null
			if( row.bytes != null && ( !Number.isSafeInteger( row.bytes ) || row.bytes < 0 || row.bytes > 100_000_000 ) ) return null
			if( !row.metrics || typeof row.metrics !== 'object' ) return null
			const metrics: Record< string, number | null > = {}
			for( const name of operations ) {
				// Older results and native Baza do not have a separate initialization phase.
				const time = name === 'Запуск БД, с' ? row.metrics[ name ] ?? null : row.metrics[ name ]
				if( time !== null && ( typeof time !== 'number' || !Number.isFinite( time ) || time < 0 ) ) return null
				metrics[ name ] = time
			}
			return { id: row.id, count: row.count, properties: row.properties, stamp: row.stamp, state: row.state, error: row.error ?? '',
				baza_version: row.baza_version, benchmark_version: row.benchmark_version, engine: row.engine, engine_version: row.engine_version, computer: row.computer ?? '', browser: row.browser ?? '', bytes: row.bytes ?? null, metrics }
		}
		@ $mol_action
		static save( kind: string, row: $rise_bench_archive_row ) {
			if( kind !== 'text' && !Object.hasOwn( $rise_bench_engine, kind ) ) throw new Error( 'Неизвестный бенчмарк' )
			const validated = this.validate( row, this.operations( kind ) )
			if( !validated ) throw new Error( 'Некорректный результат бенчмарка' )
			if( validated.engine !== undefined && validated.engine !== ( kind === 'text' ? 'goods' : kind ) ) throw new Error( 'Движок результата не соответствует нагрузке' )
			const atom = this.root().dive( kind + ':' + row.id, $giper_baza_atom_text, null )
			if( !atom ) throw new Error( 'Нет доступа к результатам' )
			atom.val( JSON.stringify( validated ) )
			$mol_wire_sync( this.root().land() ).units_saving()
		}
		@ $mol_mem_key
		static rows( kind: string ) {
			const root = this.root()
			return root.keys().filter( key => typeof key === 'string' && key.startsWith( kind + ':' ) ).flatMap( key => {
				const run = this.row( key as string )
				return run ? [ run ] : []
			})
		}
		@ $mol_mem_key
		static row( key: string ) {
			const kind = key.split( ':' )[ 0 ]
			const text = this.root().dive( key, $giper_baza_atom_text )?.val()
			const row = text && $mol_error_fence( ()=> this.validate( JSON.parse( text ), this.operations( kind ) ), ()=> null )
			if( !row || key !== kind + ':' + row.id ) return null
			const run = new ( $mol_wire_sync( $rise_bench_run ) )( row.count, row.properties, row.stamp, row.baza_version ?? '—', row.benchmark_version ?? '—', row.id, row.computer ?? '', row.browser ?? '', row.engine, row.engine_version )
			run.state( row.state )
			run.failure( row.error ?? '' )
			run.bytes( row.bytes ?? null )
			for( const [ operation, value ] of Object.entries( row.metrics ) ) if( typeof value === 'number' ) run.metric( operation, value )
			return run
		}
	}
}
