namespace $.$$ {

	export class $rise_bench_baza_crdttext extends $.$rise_bench_baza_crdttext {
		private readonly preset: $giper_baza_rank_preset = [[ null, $giper_baza_rank_read ]]

		@ $mol_mem
		count_mode( next?: string ) {
			const count = $mol_state_arg.value( 'lines', next )
			return count && Object.hasOwn( this.Count().options(), count ) ? count : '100'
		}
		line_count() { return Number( this.count_mode() ) }
		page_title() { return `CRDT-текст: ${ this.line_count() } строк` }

		private text_link_value?: string
		@ $mol_mem
		text_link( next?: string ) {
			if( next !== undefined ) this.text_link_value = next
			return this.text_link_value ??= this.reload_ticket()?.link ?? ''
		}
		reload_ticket() {
			const navigation = performance.getEntriesByType( 'navigation' )[ 0 ] as PerformanceNavigationTiming | undefined
			return navigation?.type === 'reload' ? this.reload_store().snapshot.pending : null
		}

		@ $mol_mem
		document() {
			const link = this.text_link()
			return link ? $giper_baza_glob.Pawn( new $giper_baza_link( link ), $giper_baza_text ) : null
		}

		@ $mol_action
		prepare_document() {
			this.$.$giper_baza_auth.current().pass()
			return $mol_wire_sync( $giper_baza_glob ).land_grab( this.preset ).Data( $giper_baza_text )
		}

		@ $mol_action
		write_text( next: string ) {
			const document = this.document() ?? $mol_wire_sync( this ).prepare_document()
			$mol_wire_sync( document ).text( next )
			this.text_link( document.link().str )
		}

		@ $mol_mem
		text( next?: string ) {
			if( next !== undefined ) this.write_text( next )
			$giper_baza_glob.yard().sync()
			return this.document()?.text() ?? ''
		}

		@ $mol_mem_key
		sample_text( lines: number ) {
			return Array.from( { length: lines }, ( _, index ) =>
				`Строка ${ index + 1 }: проверяем запись и редактирование текста в Гипербазе.`
			).join( '\n' )
		}

		@ $mol_action
		insert( next: string ) {
			const measure = new ( $mol_wire_sync( $rise_bench_measure ) )( 'Вставка' )
			$mol_wire_sync( this ).write_text( next )
			measure.finish()
			return measure.duration!
		}

		@ $mol_action
		appended_text() { return '!' + this.text() }

		@ $mol_action
		append_one() {
			const measure = new ( $mol_wire_sync( $rise_bench_measure ) )( 'Добавление символа' )
			const next = $mol_wire_sync( this ).appended_text()
			$mol_wire_sync( this ).write_text( next )
			const ready = new ( $mol_wire_sync( $rise_bench_baza_crdttext_render_ready ) )( this.Editor(), next, this.Page() )
			$mol_wire_sync( ready ).wait()
			measure.finish()
			return measure.duration!
		}

		@ $mol_action
		start_run( run: $rise_bench_run ) {
			if( this.Metrics().runs().includes( run ) ) return
			$mol_wire_sync( this ).reset()
			this.Metrics().run_add( run )
		}

		@ $mol_action
		benchmark() {
			this.restore_runs()
			const run = new ( $mol_wire_sync( $rise_bench_run ) )( this.line_count() )
			new ( $mol_wire_sync( $rise_bench_stage ) )( run, 'Подготовка' )
			const block = this.sample_text( run.count )
			$mol_wire_sync( this ).start_run( run )
			return $mol_error_fence( ()=> {
				new ( $mol_wire_sync( $rise_bench_stage ) )( run, 'Вставка, с' )
				const inserted = $mol_wire_sync( this ).insert( block )
				run.metric( 'Вставка, с', inserted / 1000 )
				new ( $mol_wire_sync( $rise_bench_stage ) )( run, 'Сохранение после вставки' )
				$mol_wire_sync( this ).save_document()
				new ( $mol_wire_sync( $rise_bench_stage ) )( run, 'Добавить символ, с' )
				const appended = $mol_wire_sync( this ).append_one()
				run.metric( 'Добавить символ, с', appended / 1000 )
				new ( $mol_wire_sync( $rise_bench_stage ) )( run, 'Сохранение после добавления' )
				$mol_wire_sync( this ).save_document()
				new ( $mol_wire_sync( $rise_bench_stage ) )( run, 'F5, с' )
				$mol_wire_sync( this ).request_reload( run )
			}, error => {
				run.state( 'Ошибка' )
				run.failure( $rise_bench_stage.failure( error ) )
				this.reload_store().save( this.Metrics().runs(), this.Metrics().operations(), null )
				return error
			} )
		}

		@ $mol_action
		reset() {
			const document = $mol_wire_sync( this ).prepare_document()
			this.text_link( document.link().str )
		}

		controls_enabled() {
			return this.Metrics().runs()[ 0 ]?.state() !== 'Перезагрузка'
				&& !$mol_promise_like( this.Run().status()?.[ 0 ] )
				&& !$mol_promise_like( this.Reset().status()?.[ 0 ] )
		}

		@ $mol_mem
		reload_store() { return new $rise_bench_baza_crdttext_reload }

		private runs_restored = false
		@ $mol_action
		restore_runs() {
			if( this.runs_restored ) return
			this.Metrics().runs( this.reload_store().snapshot.rows.map( row => {
				const run = new $rise_bench_run( row.count, row.properties, row.stamp, row.baza_version ?? '—', row.benchmark_version ?? '—', row.id, row.computer ?? '', row.browser ?? '' )
				run.state( row.state )
				run.bytes( row.bytes ?? null )
				for( const [ name, value ] of Object.entries( row.metrics ) ) if( value !== null ) run.metric( name, value )
				return run
			}) )
			this.runs_restored = true
		}

		@ $mol_action
		save_document() { $mol_wire_sync( this.document()!.land() ).units_saving() }

		@ $mol_action
		request_reload( run: $rise_bench_run ) {
			run.bytes( $mol_charset_encode( this.text() ).byteLength )
			run.state( 'Перезагрузка' )
			this.reload_store().save( this.Metrics().runs(), this.Metrics().operations(), {
				link: this.text_link(), count: run.count, started: performance.timeOrigin + performance.now(),
			})
			this.$.$mol_dom_context.location.reload()
		}

		private reload_done = false
		@ $mol_mem
		resume_reload() {
			if( this.reload_done ) return
			const ticket = this.reload_ticket()
			if( !ticket ) return
			const run = this.Metrics().runs()[ 0 ]
			return $mol_error_fence( ()=> {
				const expected = '!' + this.sample_text( ticket.count )
				if( this.text_link() !== ticket.link || this.text() !== expected ) throw new Error( 'После F5 открыт другой или неполный CRDT-текст' )
				const ready = new ( $mol_wire_sync( $rise_bench_baza_crdttext_render_ready ) )( this.Editor(), expected, this.Page() )
				const finished = $mol_wire_sync( ready ).wait()
				if( ( this.Editor().Edit().dom_node() as HTMLTextAreaElement ).value !== expected ) throw new Error( 'После F5 текст не появился в textarea' )
				run.metric( 'F5, с', ( finished - ticket.started ) / 1000 )
				this.reload_done = true
				run.state( 'Готово' )
				this.reload_store().save( this.Metrics().runs(), this.Metrics().operations(), null )
			}, error => {
				this.reload_done = true
				run.state( 'Ошибка' )
				run.failure( $rise_bench_stage.failure( error ) )
				this.reload_store().save( this.Metrics().runs(), this.Metrics().operations(), null )
				return error
			} )
		}

		override auto() {
			this.restore_runs()
			this.resume_reload()
			return []
		}
	}

}
