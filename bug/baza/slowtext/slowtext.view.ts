namespace $.$$ {

	export class $rise_bug_baza_slowtext_entity extends $giper_baza_entity.with({

		Text: $giper_baza_text,

	}) {
		
	}
	export class $rise_bug_baza_slowtext extends $.$rise_bug_baza_slowtext {
		
		entity_reset() {
			this.link_str( null )
		}
		
		@ $mol_mem
		link_str( next?: string | null ) {
			if( next ) {
				return $mol_state_arg.value( 'link_str', next )!
			}

			let str = $mol_state_arg.value( 'link_str' )
			if( str && next !== null ) return str

			const land = this.$.$giper_baza_glob.land_grab( [[ null, $giper_baza_rank_deny ]] )
			return $mol_state_arg.value( 'link_str', land.link().str )!
		}
		
		@ $mol_mem
		entity() {
			const link = new $giper_baza_link( this.link_str() )
			const land = this.$.$giper_baza_glob.Land( link )
			const entity = land.Data( $rise_bug_baza_slowtext_entity )
			entity.Text(null)
			return entity
		}

		text( next?: string ): string {
			return this.entity().Text(next)?.value( next ) ?? ''
		}
		
	}

}
