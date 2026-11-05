namespace $ {
	/** Minimal driver boundary; implementation lives entirely in a dedicated worker. */
	export type $rise_bench_sql_driver = {
		query( sql: string ): Promise< Record<string, any>[] >
		close(): Promise<void>
	}
}
