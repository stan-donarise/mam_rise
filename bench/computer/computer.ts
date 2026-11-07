namespace $ {
	export class $rise_bench_computer {
		static clean( text: string ) {
			return text.replace( /\r\n?/g, '\n' )
				.replace( /^[\t ]*(?:Код устройства|Идентификатор устройства|Device ID)[^\n]*\n[\s\S]*?(?=^[\t ]*(?:Тип системы|System type)(?=[\t :]|$))/gim, '' )
				.replace( /^[\t ]*(?:Код устройства|Идентификатор устройства|Код продукта|Идентификатор продукта|Device ID|Product ID)[^\n]*(?:\n[\t ]*(?:[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}|[\dA-Z]{5}(?:-[\dA-Z]{5}){4}|\d{5}-\d{5}-\d{5}-[\dA-Z]{5})[\t ]*)?\n?/gim, '' )
		}
	}
}
