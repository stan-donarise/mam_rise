namespace $.$$ {

	export class $rise_range extends $.$rise_range {
		
		@ $mol_action
		event_input( event: Event ){
			const el = event.target as HTMLInputElement
			this.value( Number( el.value ) )
		}

		medium(): number {
			return Math.round( ( this.min() + this.max() ) / 2 )
		}

		label_min(): string {
			return this.min() + ' ' + this.unit()
		}

		label_max(): string {
			return this.max() + ' ' + this.unit()
		}

		label_medium(): string {
			return this.medium() + ' ' + this.unit()
		}

		percent(): string {
			const val = this.value() - this.min()
			const range = this.max() - this.min()
			return ( val / range ) * 100 + '%'
		}

		disabled(): boolean {
			return !this.enabled()
		}
		
	}

}
