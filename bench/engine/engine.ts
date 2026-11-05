namespace $ {
	export const $rise_bench_engine = {
		goods: { title: 'Гипербаза', version: $rise_bench_run_baza_version, storage: 'Хранение: одна Area на запись' },
		idb: { title: 'IDB', version: 'browser', storage: 'IndexedDB через $mol_db, без индексов' },
		sqlite: { title: 'SQLite', version: '3.54.1-build1', storage: 'SQLite WASM · OPFS SAH Pool · без индексов' },
		pglite: { title: 'PGlite', version: '0.5.15', storage: 'PGlite · IndexedDB · без индексов' },
		duckdb: { title: 'DuckDB', version: '1.32.0', storage: 'DuckDB WASM · OPFS · без индексов' },
	}
	export type $rise_bench_engine_kind = keyof typeof $rise_bench_engine
}
