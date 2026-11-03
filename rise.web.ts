namespace $ {

	/** Rise demos and benchmarks never read from or publish to Baza servers.
	 * Keep yard.sync(): it also drains local IndexedDB saves.
	 * Override the final selector, not just defaults: URL/seed peers stay disabled.
	 */
	export function $rise_baza_masters(): string[] { return [] }

	$giper_baza_yard.masters = $rise_baza_masters

}
