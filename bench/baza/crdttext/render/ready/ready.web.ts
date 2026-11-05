namespace $ {
	/** Native textarea plus its visible text layer, followed by a paint opportunity. */
	export class $rise_bench_baza_crdttext_render_ready extends $mol_object {
		constructor( readonly editor: $mol_textarea, readonly expected: string, readonly page: $mol_page ) { super() }
		private pending?: Promise< number >
		private observer?: MutationObserver
		private frame = 0
		private timer?: ReturnType< typeof setTimeout >

		visible() {
			const input = this.editor.Edit().dom_node() as HTMLTextAreaElement
			const row = this.editor.View().Row( 1 ).dom_node()
			const rect = row.getBoundingClientRect()
			const viewport = this.page.Body().dom_node().getBoundingClientRect()
			return input.isConnected && input.value === this.expected
				&& this.editor.View().dom_node().contains( row )
				&& rect.height > 0 && rect.bottom > viewport.top && rect.bottom <= viewport.bottom + 1
				&& row.textContent!.endsWith( this.expected.split( '\n', 1 )[ 0 ] )
		}

		wait() {
			return this.pending ??= new Promise< number >( ( resolve, reject )=> {
				const check = ()=> {
					// Show the first line through native scrolling, never force render.
					this.page.body_scroll_top( 0 )
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
				this.observer.observe( this.editor.dom_node(), { childList: true, subtree: true, characterData: true } )
				this.timer = setTimeout( ()=> {
					this.destructor()
					reject( new Error( 'Текст не появился в редакторе за 300 секунд' ) )
				}, 300_000 )
				check()
			})
		}

		destructor() {
			this.observer?.disconnect()
			if( this.frame ) cancelAnimationFrame( this.frame )
			if( this.timer ) clearTimeout( this.timer )
			super.destructor()
		}
	}
}
