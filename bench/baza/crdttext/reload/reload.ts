namespace $ {
	export interface $rise_bench_baza_crdttext_reload_ticket {
		link: string
		count: number
		started: number
	}

	export class $rise_bench_baza_crdttext_reload extends $rise_bench_reload< $rise_bench_baza_crdttext_reload_ticket > {
		constructor() { super( '$rise_bench_baza_crdttext_runs' ) }
	}
}
