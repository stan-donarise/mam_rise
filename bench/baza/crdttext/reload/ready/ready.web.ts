namespace $ {
	/** Give the native textarea a paint opportunity after CRDT data has loaded. */
	export class $rise_bench_baza_crdttext_reload_ready extends $mol_object {
		private pending?: Promise< number >
		private frame = 0
		private timer?: ReturnType< typeof setTimeout >

		wait() {
			return this.pending ??= new Promise< number >( ( resolve, reject )=> {
				this.timer = setTimeout( ()=> {
					this.destructor()
					reject( new Error( 'После F5 текст не отрисован за 45 секунд' ) )
				}, 45_000 )
				this.frame = requestAnimationFrame( ()=> {
					this.frame = requestAnimationFrame( ()=> {
						this.destructor()
						resolve( performance.timeOrigin + performance.now() )
					})
				})
			})
		}

		destructor() {
			if( this.frame ) cancelAnimationFrame( this.frame )
			if( this.timer ) clearTimeout( this.timer )
			super.destructor()
		}
	}
}
