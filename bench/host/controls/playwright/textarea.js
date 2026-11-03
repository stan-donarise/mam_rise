const assert=require('node:assert/strict')
const {chromium,resultScenario,resultStep,screenshot,closeTestContext}=require('../../../playwright/harness')
const {openBenchmark}=require('../../../playwright/offline')
resultScenario({title:'Параметры компьютера: переносы и выделение',group:'entities'})
async function main(){
	const browser=await chromium.launch({headless:true,channel:'chrome'}),deadline=setTimeout(()=>browser.close().catch(()=>{}),45000)
	let context
	try{
		context=await browser.newContext({viewport:{width:1200,height:900}});const page=await context.newPage()
		const errors=[];page.on('pageerror',error=>errors.push(error.message))
		await openBenchmark(page,'http://localhost:9080/rise/app/-/test.html')
		await page.getByRole('link',{name:'Bench',exact:true}).click();await page.getByRole('link',{name:'Сущности',exact:true}).click()
		const sample='Имя устройства\tDESKTOP-241FU8E\r\nПроцессор\tAMD Ryzen 9 7845HX with Radeon Graphics 3.00 GHz\rОперативная память\t32,0 ГБ (доступно: 31,2 ГБ)'
		resultStep('Открыть сохранённый текст с табами, CR и CRLF',['$rise_bench_host_controls.Computer','$rise_bench_textarea'])
		await page.evaluate(sample=>$.$rise_app.Root(0).Bench().Goods_host().Controls().computer(sample),sample)
		const editor=page.getByRole('textbox',{name:'Процессор, память, ОС',exact:true});await editor.waitFor()
		await page.waitForFunction(sample=>document.querySelector('[rise_bench_host_controls_computer] textarea')?.value===sample.replace(/\r\n?/g,'\n'),sample)
		const layout=await page.evaluate(()=>{
			const component=$.$rise_app.Root(0).Bench().Goods_host().Controls().Computer(),input=component.Edit().dom_node(),clone=input.cloneNode()
			clone.removeAttribute('id');clone.style.height='0';clone.style.visibility='hidden';clone.value=input.value
			input.parentNode.appendChild(clone)
			try{return{shared:component instanceof $.$rise_bench_textarea,lines:component.View().text_lines().length,native:clone.scrollHeight,view:component.View().dom_node().getBoundingClientRect().height}}
			finally{clone.remove()}
		})
		assert.equal(layout.shared,true);assert.equal(layout.lines,3);assert.ok(Math.abs(layout.native-layout.view)<=2,JSON.stringify(layout))
		resultStep('Выделить, перенести курсор и дописать текст',['$rise_bench_textarea_input.field'])
		await editor.focus();await page.keyboard.press('Control+A');await screenshot(page,'computer-selection.png')
		await page.keyboard.press('ArrowRight');await page.keyboard.insertText('!')
		assert.equal(await editor.inputValue(),sample.replace(/\r\n?/g,'\n')+'!')
		await page.getByRole('checkbox',{name:'IDB',exact:true}).click()
		await page.getByRole('checkbox',{name:'Гипербаза',exact:true}).click()
		assert.equal(await editor.inputValue(),sample.replace(/\r\n?/g,'\n')+'!')
		assert.deepEqual(errors,[]);console.log('TEXTAREA_PASS',JSON.stringify(layout))
	}finally{clearTimeout(deadline);try{if(context)await closeTestContext(context)}finally{await browser.close()}}
}
main().catch(error=>{console.error(error);process.exitCode=1})
