const fs=require('node:fs/promises')
const path=require('node:path')
const http=require('node:http')
const assert=require('node:assert/strict')
/** Serve the unchanged, source-map-verified MAM artifacts when the shared watcher is unavailable. */
async function serveBuilt(){
	const root=path.resolve(__dirname,'../../app/-')
	const map=JSON.parse(await fs.readFile(path.join(root,'web.js.map'),'utf8'))
	let checked=0
	for(let i=0;i<map.sources.length;i++){
		const source=map.sources[i]
		if(!source.startsWith('../../../rise/')||source.includes('/-')||!source.endsWith('.ts'))continue
		assert.equal((await fs.readFile(path.resolve(root,source),'utf8')).replace(/\r\n/g,'\n'),map.sourcesContent[i].replace(/\r\n/g,'\n'),`Stale built source: ${source}`);checked++
	}
	assert.ok(checked>20,'Own runtime sources must be verified')
	const server=http.createServer(async(request,response)=>{
		try{
			const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname)
			if(pathname==='/favicon.ico'){response.writeHead(204);return response.end()}
			const prefix='/rise/app/-/'
			if(!pathname.startsWith(prefix)){response.writeHead(404);return response.end()}
			const target=path.resolve(root,pathname.slice(prefix.length))
			if(!target.startsWith(root+path.sep)){response.writeHead(403);return response.end()}
			const type=target.endsWith('.html')?'text/html':target.endsWith('.js')?'text/javascript':target.endsWith('.css')?'text/css':'application/octet-stream'
			response.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});response.end(await fs.readFile(target))
		}catch{if(!response.headersSent)response.writeHead(404);response.end()}
	})
	server.on('upgrade',(_request,socket)=>socket.destroy())
	await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)})
	const url=`http://localhost:${server.address().port}/rise/app/-/test.html`
	console.log('OWNED_BUILT_SERVER',JSON.stringify({pid:process.pid,url,verified_sources:checked}))
	return {url,close:async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}}
}
module.exports={serveBuilt}
