namespace $ {
	export class $rise_bench_idb_ready extends $mol_object {
		constructor( readonly table: Element, readonly title: string ) { super() }
		private pending?: Promise< number >
		private observer?: MutationObserver
		private frame = 0
		visible() { return this.table.isConnected && this.table.textContent!.includes( this.title ) && !this.table.querySelector( '[mol_view_error]' ) }
		wait() {
			return this.pending ??= new Promise< number >( ( resolve, reject )=> {
				const check = ()=> {
					if( this.frame || !this.visible() ) return
					this.frame = requestAnimationFrame( ()=> {
						this.frame = requestAnimationFrame( ()=> {
							this.frame = 0
							if( !this.visible() ) return
							this.destructor()
							resolve( performance.timeOrigin + performance.now() )
						})
					})
				}
				this.observer = new MutationObserver( check )
				this.observer.observe( this.table, { childList: true, subtree: true, characterData: true, attributes: true } )
				check()
			})
		}
		destructor() {
			this.observer?.disconnect()
			if( this.frame ) cancelAnimationFrame( this.frame )
			super.destructor()
		}
	}
}
