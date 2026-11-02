namespace $ {

	export class $rise_bench_baza_goods_index extends $giper_baza_dict.with({ Ready: $giper_baza_atom_bool }) {
		bucket( key: string, auto?: null ) { return this.dive( 'bucket:' + key, $giper_baza_list_link, auto ) }

		@ $mol_action
		set_member( link: $giper_baza_link, key: string, included: boolean ) {
			const serialized = new ( $mol_wire_sync( $giper_baza_link ) )( link.str )
			this.bucket( key, null )!.has( serialized, included )
		}
	}

}
