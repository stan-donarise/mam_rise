namespace $ {
	/** MAM's UI entry loads dependency tests too. Never run them beside timed workloads. */
	export const $rise_app_test_suite = $mol_test_all.slice()
	if( !new URL( location.href ).searchParams.has( 'rise_unit_suite' ) ) {
		$mol_test_all.splice( 0 )
		console.warn( `Rise: ${ $rise_app_test_suite.length } dependency unit tests deferred, not passed. Explicit runner: ?rise_unit_suite=1` )
		$mol_test({
			'Benchmark UI retains a separate unit suite'() {
				$mol_assert_ok( $rise_app_test_suite.length > 0 )
				$mol_assert_ok( $rise_app_test_suite.some( test => test.name === 'Land Area inherits rights' ) )
			},
		})
	}
}
