namespace $.$$ {
	
	export class $rise_bug_baza_noseal_entity extends $giper_baza_entity.with({

		Dict: $giper_baza_dict_to( $giper_baza_atom_link_to( ()=> $giper_baza_atom_text ) ),

		List: $giper_baza_list_link_to( ()=> $giper_baza_atom_text ),

	}) {
		
	}

	export class $rise_bug_baza_noseal extends $.$rise_bug_baza_noseal {
		
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
		entity( reset?: null ) {
			const link = new $giper_baza_link( this.link_str() )
			const land = this.$.$giper_baza_glob.Land( link )
			return land.Data( $rise_bug_baza_noseal_entity )
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
			entity.Dict(null)?.key( $mol_wire_sync($).$mol_guid(), 'auto' )
		}
		
	}
}
