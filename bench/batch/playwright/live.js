// Read-only diagnostic of the explicitly selected user's Rise tab. Never closes Chrome.
const fs=require('node:fs')
const path=require('node:path')
const WebSocket=require('ws')
const readline=require('node:readline')
console.log('OWNER',JSON.stringify({pid:process.pid,deadline_ms:1800000}))
const lines=fs.readFileSync(path.join(process.env.LOCALAPPDATA,'Google/Chrome/User Data/DevToolsActivePort'),'utf8').trim().split(/\r?\n/)
const socket=new WebSocket(`ws://127.0.0.1:${lines[0]}${lines[1]}`)
const pending=new Map(),contexts=new Map();let serial=0,session
const input=readline.createInterface({input:process.stdin})
function finish(){input.close();socket.close();setTimeout(()=>socket.terminate(),1000).unref()}
const deadline=setTimeout(finish,1800000)
function call(method,params={},sessionId){
	return new Promise((resolve,reject)=>{
		const id=++serial,timer=setTimeout(()=>{pending.delete(id);reject(new Error(`${method}: deadline`))},20000)
		pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params,...sessionId?{sessionId}:{}}))
	})
}
socket.on('message',buffer=>{
	const message=JSON.parse(buffer.toString())
	if(message.method==='Runtime.executionContextCreated'){const context=message.params.context;if(context.origin==='https://stan-donarise.github.io'&&context.auxData?.isDefault){contexts.set(context.id,{id:context.id,frameId:context.auxData.frameId});console.log('RISE_CONTEXT',JSON.stringify({id:context.id,frameId:context.auxData.frameId}))}}
	const wait=pending.get(message.id)
	if(!wait)return
	pending.delete(message.id);clearTimeout(wait.timer)
	message.error?wait.reject(new Error(message.error.message)):wait.resolve(message.result)
})
socket.on('error',error=>{console.error('Chrome connection failed',error.code??error.message.replace(/wss?:\/\/\S+/g,'[endpoint]'));finish()})
socket.on('close',()=>{clearTimeout(deadline);for(const wait of pending.values()){clearTimeout(wait.timer);wait.reject(new Error('Disconnected'))}pending.clear();input.close()})
async function snapshot(){
	const result=await call('Runtime.evaluate',{expression:`JSON.stringify((()=>{
		const host=globalThis.$?.$rise_app?.Root(0).Bench().Goods_host();
		const child=document.querySelector('iframe')?.contentWindow;
		const api=child?.$;const bench=api?.$rise_app?.Root(0).Bench().Goods();
		const stage=api?.$rise_bench_stage?.current;
		const keys=['dataset_config()',...Object.getOwnPropertyNames(bench??{})];
		const roots=keys.map(key=>Object.getOwnPropertyDescriptor(bench,key)?.value).map(value=>value?.atom??value).filter(value=>value&&typeof value==='object'&&'task'in value&&'cache'in value);
		const seen=new Set(),tasks=[];
		function walk(task,depth){
			if(!task||seen.has(task)||depth>22||seen.size>=1400||tasks.length>=160)return;seen.add(task);
			const pending=Boolean(task.cache&&typeof task.cache.then==='function');
			if(pending)tasks.push({task:task.task?.name,host:task.host?.constructor?.name,depth});
			for(const pub of task.pub_list??[])walk(pub,depth+1);
			for(const sub of task.sub_list??[])walk(sub,depth+1);
		}
		for(const root of roots)walk(root,0);
		const initializing=bench?.['initialize_product()'];
		return {status:host?.status(),busy:host?.busy(),progress:host?.progress?{operation:host.progress.operation,elapsed_ms:Date.now()-host.progress.started}:null,
			childReady:child?.document.readyState,stage:stage?{operation:stage.operation,elapsed_ms:Date.now()-stage.started}:null,
			initializers:initializing instanceof child.Map?initializing.size:null,pendingTasks:tasks,benchClass:bench?.constructor?.name,ownKeys:Object.getOwnPropertyNames(bench??{}),
			childErrors:[...child?.document.querySelectorAll('[mol_view_error]')??[]].map(node=>node.getAttribute('mol_view_error')).slice(0,10)};
	})())`,returnByValue:true},session)
	if(result.exceptionDetails)throw new Error(result.exceptionDetails.text)
	console.log('SNAPSHOT',result.result.value)
}
socket.on('open',async()=>{
	try{
		const {targetInfos}=await call('Target.getTargets')
		const targets=targetInfos.filter(target=>{try{const url=new URL(target.url);return target.type==='page'&&url.hostname==='stan-donarise.github.io'&&url.pathname.startsWith('/mam_rise/')}catch{return false}})
		if(targets.length!==1)throw new Error(`Expected exactly one Rise tab, found ${targets.length}`)
		session=(await call('Target.attachToTarget',{targetId:targets[0].targetId,flatten:true})).sessionId
		console.log('CONNECTED_RISE');await snapshot()
		await call('Runtime.enable',{},session);console.log('CONTEXTS',JSON.stringify([...contexts.values()]))
	}catch(error){console.error(error.message);finish()}
})
input.on('line',async line=>{
	if(line.trim()==='quit')return finish()
	try{
		if(line.trim()==='snapshot')return await snapshot()
		const request=JSON.parse(line)
		if(request.method){
			if(!['Runtime.evaluate','Runtime.queryObjects','Runtime.callFunctionOn','Runtime.getProperties'].includes(request.method))throw new Error('Only read-only Runtime inspection is allowed')
			console.log('CDP_READ',JSON.stringify(await call(request.method,request.params??{},session)));return
		}
		if(typeof request.expression!=='string'||!request.expression.startsWith('JSON.stringify('))throw new Error('Expected a JSON-only read expression')
		const result=await call('Runtime.evaluate',{expression:request.expression,returnByValue:true},session)
		console.log('READ',JSON.stringify(result))
	}catch(error){console.error(error.message)}
})
input.on('close',()=>socket.close())
