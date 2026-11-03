const { chromium } = require('playwright')
const fs = require('node:fs/promises')
const path = require('node:path')
const output = path.resolve(__dirname, '../../-test-results', `${Date.now()}-${process.pid}`)

function resultScenario(value) { console.log('SCENARIO', JSON.stringify(value)) }
function resultStep(title, coverage) { console.log('STEP', title, JSON.stringify(coverage)) }
function resultBenchmarkValue(title, value, unit) { console.log('METRIC', JSON.stringify({title,value,unit})) }
async function resultBenchmark(title, action) {
	const start = performance.now()
	const value = await action()
	resultBenchmarkValue(title, performance.now() - start, 'ms')
	return value
}
async function screenshot(page, name, options = {}) {
	await fs.mkdir(output, {recursive:true})
	const target = path.join(output, path.basename(name))
	await page.screenshot({path:target, ...options})
	return target
}
async function closeTestContext(context) { await context.close() }

module.exports = {chromium, headless:()=>process.env.HEADLESS !== '0', resultScenario, resultStep, resultBenchmark, resultBenchmarkValue, screenshot, closeTestContext}
