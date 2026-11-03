namespace $.$$ {
	/** Workload surface: keep the native scroll/virtualization, not page chrome. */
	export class $rise_bench_surface extends $.$rise_bench_surface {
		embedded() { return window.parent !== window }
		sub() { return this.embedded() ? [ this.Body() ] : super.sub() }
	}
}
