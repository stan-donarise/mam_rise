namespace $ {

	export class $rise_bench_baza_goods_dataset extends $giper_baza_entity.with({
		Products: $giper_baza_list_link.to( ()=> $rise_bench_baza_goods_product ),
		Tags: $giper_baza_list_link.to( ()=> $rise_bench_baza_goods_tag ),
	}) {}

}
