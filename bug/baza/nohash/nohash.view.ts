namespace $.$$ {
	
	export class $rise_bug_baza_nohash_entity extends $giper_baza_entity.with({

		Dict: $giper_baza_dict_to( $giper_baza_atom_link_to( ()=> $giper_baza_atom_text ) ),

		List: $giper_baza_list_link_to( ()=> $giper_baza_atom_text ),

	}) {
		
	}

	export class $rise_bug_baza_nohash extends $.$rise_bug_baza_nohash {
		
		entity_reset() {
			this.entity( null )
		}

		@ $mol_mem
		entity( reset?: null ) {
			const land = this.$.$giper_baza_glob.land_grab( [[ null, $giper_baza_rank_deny ]] )
			return land.Data( $rise_bug_baza_nohash_entity )
		}

		id( id: any ): string {
			return id
		}

		items(): readonly ( any )[] {
			return this.entity().List()?.remote_list().map( i => this.Item( i.link().str ) ) ?? []
		}

		add( next?: any ) {
			const entity = this.entity()

			const item = entity.List(null)?.make( entity.land() )
			const title = item?.link().toString()! ?? ''
			item?.val(title)
			entity.Dict(null)?.key( title, 'auto' )
		}
		
	}
}
