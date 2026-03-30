namespace $.$$ {
	export class $rise_bug extends $.$rise_bug {
		
		spreads() {
			const dict = Object.fromEntries( this.spread_classes().map( name => {
				return [ name, new ((this.$ as any)[name]) ]
			} ) )
			return dict
		}
		
	}
}
