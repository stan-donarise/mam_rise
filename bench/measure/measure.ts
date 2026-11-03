namespace $ {

	/** Stable operation identity and clock across wire suspension/replay. */
	export class $rise_bench_measure {
		readonly started = performance.now()
		duration: number | null = null

		constructor( readonly title: string, readonly count = 0, readonly unit = 'зап.' ) {}

		finish() { this.duration ??= performance.now() - this.started }
	}

}
