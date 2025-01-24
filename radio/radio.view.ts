namespace $.$$ {
	export class $rise_radio extends $.$rise_radio {
		
		@ $mol_mem_key
		circle_inner( id: any ): readonly any[] {
			return this.option_checked( id ) ? super.circle_inner( id ) : []
		}
		
	}
}
