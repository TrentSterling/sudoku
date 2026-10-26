'use strict';
const {chromium}=require('playwright'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const fixture=require('./browser-fixture.cjs'),root=path.resolve(__dirname,'../..');
(async()=>{
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end(fs.readFileSync(path.join(root,'index.html')))});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--mute-audio']});const results=[];
 try{for(const viewport of [{width:1000,height:800},{width:390,height:844},{width:844,height:390}]){
  const context=await browser.newContext({viewport});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(process.env.SUDOKU_LIVE_URL||`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(()=>typeof game!=='undefined'&&game.scene.keys.GameScene?.emptyCells?.length===48);
  const result=await page.evaluate(fixture);assert.deepEqual(errors,[]);results.push({...result,errors});await context.close();
 }}finally{await browser.close();server.close();fs.mkdirSync('.gameplay-evidence',{recursive:true});fs.writeFileSync('.gameplay-evidence/results.json',JSON.stringify({results},null,2))}
 console.log(JSON.stringify({viewports:results.length,cases:results.reduce((n,r)=>n+r.cases.length,0),passed:true}));
})().catch(e=>{console.error(e);process.exitCode=1});
