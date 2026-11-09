namespace $.$$ {
	export class $rise_bench_host_controls_support extends $.$rise_bench_host_controls_support {
		logo_uri() {
			const path = `rise/bench/host/controls/support/foot_logo_${ this.$.$mol_lights() ? 'dark' : 'light' }.png`
			return new URL( location.pathname.includes( '/-/' ) ? '/' + path : path, location.href ).href
		}
	}
}
