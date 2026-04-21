namespace $.$$ {

	export class $rise_bug_baza_slowtext_entity extends $giper_baza_entity.with({

		Text: $giper_baza_text,

	}) {
		
	}
	export class $rise_bug_baza_slowtext extends $.$rise_bug_baza_slowtext {
		
		@ $mol_mem
		entity( reset?: null ) {
			const land = this.$.$giper_baza_glob.land_grab( [[ null, $giper_baza_rank_deny ]] )
			const entity = land.Data( $rise_bug_baza_slowtext_entity )
			entity.Text(null)
			return entity
		}

		text( next?: string ): string {
			return this.entity().Text(next)?.value( next ) ?? ''
		}
		
	}

}
