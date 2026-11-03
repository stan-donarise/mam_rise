const assert = require( 'node:assert/strict' )

/** Observe, do not block: accidental network activity must fail the test. */
function observeOffline( page, target ) {
	const writes = []
	const sockets = []
	const app = new URL( target )
	page.on( 'request', request => {
		if( ![ 'GET', 'HEAD', 'OPTIONS' ].includes( request.method() ) ) writes.push( `${request.method()} ${new URL( request.url() ).pathname}` )
	} )
	page.on( 'websocket', socket => {
		const url = new URL( socket.url() )
		// Only the local MAM hot-reload socket is allowed, never a Baza socket.
		if( app.hostname === 'localhost' && url.host === app.host && url.pathname === app.pathname && app.pathname.endsWith( '/test.html' ) ) return
		sockets.push( `${url.host}${url.pathname}` )
	} )
	return async()=> {
		assert.deepEqual( writes, [], 'No network writes' )
		assert.deepEqual( sockets, [], 'No Baza WebSocket, including failed attempts' )
		assert.deepEqual( await page.evaluate( ()=> globalThis.$.$giper_baza_yard.masters() ), [] )
		assert.equal( await page.evaluate( ()=> globalThis.$.$giper_baza_glob.yard().master() ), null )
	}
}

function targetUrl() {
	const url = new URL( process.env.RISE_TEST_URL || 'http://localhost:9080/rise/app/-/test.html' )
	url.searchParams.set( 'rise_fixture', 'tests' )
	// An explicit endpoint must not bypass Rise's local-only policy.
	url.hash = '!giper_baza_yard_masters=' + encodeURIComponent( 'http://127.0.0.1:9/' )
	return url.toString()
}

async function openBenchmark( page, url ) {
	await page.goto( url, { waitUntil: 'domcontentloaded' } )
	// Native $mol_offline reloads the first page (including test.html) when its worker
	// activates. Wait for that real navigation before starting a measured action.
	await page.waitForFunction( ()=> globalThis.$ && (
		!navigator.serviceWorker || navigator.serviceWorker.controller?.state === 'activated'
	), null, { timeout: 30_000 } )
}

module.exports = { observeOffline, targetUrl, openBenchmark }
