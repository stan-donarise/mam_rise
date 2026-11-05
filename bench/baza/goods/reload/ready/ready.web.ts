namespace $ {

	/** Observe the real rendered viewport, then allow a paint before completing. */
	export class $rise_bench_baza_goods_reload_ready extends $mol_object {
		constructor( readonly table: Element, readonly title: string ) { super() }
		private observer?: MutationObserver
		private timer?: ReturnType< typeof setTimeout >
		private frame = 0
		private pending?: Promise< number >

		visible() {
			if( !this.table.isConnected ) return false
			const rows = [ ...this.table.querySelectorAll( '[rise_bench_baza_goods_table_row]' ) ].filter( row => {
				const rect = row.getBoundingClientRect()
				return rect.top < innerHeight && rect.bottom > 0
			})
			return rows.length > 0
				&& rows[ 0 ].textContent!.includes( this.title )
				&& rows.every( row => !row.querySelector( '[mol_view_error]' )
					&& !!row.querySelector( '[rise_bench_baza_goods_table_title]' )?.textContent?.trim() )
		}

		wait(): Promise< number > {
			return this.pending ??= new Promise( ( resolve, reject )=> {
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
				this.observer.observe( this.table, { childList: true, subtree: true, attributes: true, characterData: true } )
				this.timer = setTimeout( ()=> {
					this.destructor()
					reject( new Error( 'После F5 товары не появились за 300 секунд' ) )
				}, 300_000 )
				check()
			})
		}

		destructor() {
			this.observer?.disconnect()
			if( this.timer ) clearTimeout( this.timer )
			if( this.frame ) cancelAnimationFrame( this.frame )
			super.destructor()
		}
	}

}
