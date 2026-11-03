namespace $ {

	// Only the embedded workload disables transport. The outer application keeps
	// the native selector (including the localhost override in yard.test.ts).
	if( new URL( location.href ).searchParams.has( 'rise_fixture' ) ) {
		$.$giper_baza_yard.masters = ()=> []
	}

}
