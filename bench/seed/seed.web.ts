namespace $ {
	/** Retain every seed Land until peer URLs have live reactive consumers. */
	export class $rise_bench_seed extends $mol_object {
		@ $mol_mem
		static lands() {
			const pack = $mol_wire_sync( $giper_baza_pack ).from( $mol_file.relative( 'web.baza' ).buffer() ) as $giper_baza_pack
			const parts = $mol_wire_sync( pack ).parts() as $giper_baza_pack_parts
			const lands = parts.map( ([ id ])=> $giper_baza_glob.Land( new $giper_baza_link( id ) ) )
			$mol_wire_sync( $giper_baza_glob ).apply_parts( parts )
			return lands
		}
	}
}
