namespace $.$$ {
	/** Native selection is applied as a command, never replayed by unrelated renders. */
	export class $rise_bench_textarea_input extends $.$rise_bench_textarea_input {
		private applied?: { from: number, to: number, value: string }
		field(): ReturnType< $.$rise_bench_textarea_input['field'] > {
			return { ...super.field(), selectionStart: undefined!, selectionEnd: undefined! }
		}
		@ $mol_mem
		render() {
			const from = this.selection_start(), to = this.selection_end(), value = this.value()
			super.render()
			if( from === undefined || to === undefined ) return
			if( this.applied?.from === from && this.applied.to === to && this.applied.value === value ) return
			const node = this.dom_node() as HTMLTextAreaElement
			if( node.selectionStart !== from || node.selectionEnd !== to ) node.setSelectionRange( from, to )
			this.applied = { from, to, value }
		}
		/** CRDT writes may suspend; a Promise is not an invalid-input error. */
		@ $mol_mem
		value_changed( next?: string ): string {
			const node = this.dom_node() as HTMLTextAreaElement
			node.setCustomValidity( '' )
			return $mol_error_fence( ()=> this.value( next ), error => {
				node.setCustomValidity( this.$.$mol_error_message( error ) )
				node.reportValidity()
				return next ?? $mol_mem_cached( ()=> this.value_changed() ) ?? ''
			} )
		}
	}
}
