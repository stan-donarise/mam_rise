namespace $ {
	/** Same product generation and operations as IDB, with relational SQL columns. */
	export class $rise_bench_sql_storage extends $mol_object {
		constructor( readonly name: string, readonly engine: $rise_bench_engine_kind, readonly compact: boolean ) { super() }
		product( index: number, compact: boolean ) { return $rise_bench_product_make( index, compact ) }
		private worker?: Worker
		private serial = 0
		private pending = new Map<number, { resolve( value: any ): void, reject( reason: Error ): void }>()
		private disposed = false
		@ $mol_memo.method
		async open() {
			if( this.disposed ) throw new Error( 'Хранилище закрыто' )
			const source = [ $rise_bench_sql_sqlite, $rise_bench_sql_pglite, $rise_bench_sql_duckdb, $rise_bench_sql_worker ]
				.map( factory => factory.toString() ).join( '\n' )
				+ '\nconst $ = { $rise_bench_sql_sqlite, $rise_bench_sql_pglite, $rise_bench_sql_duckdb }; $rise_bench_sql_worker()'
			const url = URL.createObjectURL( new Blob([ source ], { type: 'text/javascript' }) )
			this.worker = new Worker( url )
			URL.revokeObjectURL( url )
			this.worker.onmessage = ({ data })=> {
				const task = this.pending.get( data.id ); if( !task ) return
				this.pending.delete( data.id )
				data.error ? task.reject( new Error( data.error ) ) : task.resolve( data.result )
			}
			this.worker.onerror = error => { this.fail( new Error( error.message ) ); this.destructor() }
			await this.request( 'open', [ this.engine, this.name ] )
			await this.request( 'query', [ 'CREATE TABLE IF NOT EXISTS products (id TEXT, title TEXT, color TEXT, status TEXT'
				+ ( this.compact ? '' : ', checked INTEGER, uri TEXT, quantity INTEGER, supply TEXT, description TEXT, tags TEXT' ) + ')' ] )
		}
		private request( method: string, args: unknown[] ): Promise<any> {
			if( this.disposed || !this.worker ) return Promise.reject( new Error( 'Хранилище закрыто' ) )
			const id = ++this.serial
			return new Promise( ( resolve, reject )=> {
				const timer = setTimeout( ()=> { this.fail( new Error( 'Движок не ответил за 300 секунд' ) ); this.destructor() }, 300000 )
				this.pending.set( id, {
					resolve: value => { clearTimeout( timer ); resolve( value ) },
					reject: error => { clearTimeout( timer ); reject( error ) },
				})
				this.worker!.postMessage({ id, method, args })
			})
		}
		private fail( error: Error ) { for( const task of this.pending.values() ) task.reject( error ); this.pending.clear() }
		async query( sql: string ): Promise<Record<string, any>[]> { await this.open(); return this.request( 'query', [ sql ] ) }
		async prepare() { await this.open() }
		literal( value: unknown ) {
			if( value === undefined || value === null ) return 'NULL'
			if( typeof value === 'boolean' ) return value ? '1' : '0'
			if( typeof value === 'number' ) { if( !Number.isFinite( value ) ) throw new Error( 'Некорректное число' ); return String( value ) }
			return "'" + String( Array.isArray( value ) ? JSON.stringify( value ) : value ).replace( /'/g, "''" ) + "'"
		}
		private tuple( index: number, compact: boolean ) { return '(' + Object.values( this.product( index, compact ) ).map( value => this.literal( value ) ).join( ',' ) + ')' }
		private async write( sql: string ) {
			await this.query( sql )
			if( this.engine === 'duckdb' ) await this.query( 'CHECKPOINT' )
		}
		async create( count: number, compact: boolean ) {
			await this.write( 'INSERT INTO products VALUES ' + Array.from({ length: count }, ( _, index )=> this.tuple( index, compact ) ).join( ',' ) )
		}
		async count() { return Number( ( await this.query( 'SELECT COUNT(*) AS n FROM products' ) )[ 0 ].n ) }
		async search() { return Number( ( await this.query( "SELECT COUNT(*) AS n FROM products WHERE LOWER(title) LIKE '%notebook 00000%'" ) )[ 0 ].n ) }
		async add( compact: boolean ) { await this.write( 'INSERT INTO products VALUES ' + this.tuple( await this.count(), compact ) ) }
		async rows(): Promise<$rise_bench_product[]> {
			return ( await this.query( 'SELECT * FROM products ORDER BY id' ) ).map( row => ({ ...row,
				...( row.checked === undefined ? {} : { checked: Boolean( row.checked ), tags: JSON.parse( row.tags ) } ),
			}) as $rise_bench_product )
		}
		async change( index: number, field: keyof $rise_bench_product, value: string | number | boolean ) {
			if( ![ 'color', 'status', 'checked', 'quantity', 'supply' ].includes( field ) ) throw new Error( 'Неизвестное поле' )
			await this.write( 'UPDATE products SET ' + field + '=' + this.literal( value ) + ' WHERE id=' + this.literal( String( index ).padStart( 5, '0' ) ) )
		}
		destructor() {
			this.disposed = true
			this.fail( new Error( 'Хранилище закрыто' ) )
			this.worker?.terminate()
		}
		async close() { try { if( this.worker && !this.disposed ) await this.request( 'close', [] ) } finally { this.destructor() } }
	}
}
