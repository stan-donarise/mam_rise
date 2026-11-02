namespace $ {

	export class $rise_bench_baza_goods_product extends $giper_baza_entity.with({
		Id: $giper_baza_atom_text,
		Checked: $giper_baza_atom_bool,
		Uri: $giper_baza_atom_text,
		Color: $giper_baza_atom_text,
		Status: $giper_baza_atom_text,
		Quantity: $giper_baza_atom_real,
		Supply: $giper_baza_atom_time,
		Description: $giper_baza_atom_text,
		Tags: $giper_baza_list_link.to( ()=> $rise_bench_baza_goods_tag ),
	}) {}

}
