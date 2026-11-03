namespace $.$$ {

	export class $rise_bench_baza_crdttext extends $.$rise_bench_baza_crdttext {

		@ $mol_mem
		text_link( next?: string ) {
			return $mol_state_local.value< string >( '$rise_bench_baza_crdttext', next ) ?? ''
		}

		@ $mol_mem
		document() {
			const link = this.text_link()
			return link ? $giper_baza_glob.Pawn( new $giper_baza_link( link ), $giper_baza_text ) : null
		}

		@ $mol_action
		prepare_document() {
			this.$.$giper_baza_auth.current().pass()
			return $mol_wire_sync( $giper_baza_glob ).land_grab( [[ null, $giper_baza_rank_read ]] ).Data( $giper_baza_text )
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

		@ $mol_action
		insertion_text() {
			const prev = this.text()
			const lines = prev ? prev.split( '\n' ).length : 0
			const block = Array.from( { length: 500 }, ( _, index ) =>
				`Строка ${ lines + index + 1 }: проверяем запись и редактирование текста в Гипербазе.`
			).join( '\n' )
			return prev ? prev + '\n' + block : block
		}

		@ $mol_action
		insert() {
			const next = $mol_wire_sync( this ).insertion_text()
			const run = new ( $mol_wire_sync( $rise_bench_run ) )( next.length )
			this.Metrics().run_add( run )
			return $mol_error_fence( ()=> {
				const measure = new ( $mol_wire_sync( $rise_bench_measure ) )( 'Вставка' )
				$mol_wire_sync( this ).write_text( next )
				measure.finish()
				run.metric( 'Вставка, с', measure.duration! / 1000 )
				run.metric( 'Скорость, симв./с', measure.duration ? next.length * 1000 / measure.duration : 0 )
				run.state( 'Готово' )
			}, error => { run.state( 'Ошибка' ); return error } )
		}

		@ $mol_action
		reset() {
			const document = this.document()
			if( document ) $mol_wire_sync( document ).text( '' )
		}

		controls_enabled() {
			return !$mol_promise_like( this.Insert().status()?.[ 0 ] ) && !$mol_promise_like( this.Reset().status()?.[ 0 ] )
		}
	}

}
