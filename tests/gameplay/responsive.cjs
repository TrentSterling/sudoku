'use strict';
const {chromium}=require('playwright'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const fixture=require('./responsive-fixture.cjs'),transition=require('./transition-fixture.cjs'),root=path.resolve(__dirname,'../..');
const sizes=[[320,480],[320,640],[360,640],[390,844],[430,932],[480,320],[568,320],[667,375],[844,390],[760,600],[761,600],[1000,540],[1000,541],[1024,768],[1280,800],[1024,640],[853,533],[640,400],[312,675],[260,563]];
(async()=>{
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end(fs.readFileSync(path.join(root,'index.html')))});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;const results=[];
 try{browser=await chromium.launch({channel:'chrome',headless:true,args:['--mute-audio']});const context=await browser.newContext(),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  for(const[width,height]of sizes){await page.setViewportSize({width,height});await page.goto(process.env.SUDOKU_LIVE_URL||`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>typeof game!=='undefined'&&game.scene.keys.GameScene?.emptyCells?.length===48);
   const result=await page.evaluate(fixture);const state=await page.evaluate(transition,'partial');
   await page.setViewportSize({width:height,height:width});await page.waitForFunction(w=>game.scale.width===w,height);const rotated=await page.evaluate(fixture,{flows:false});
   assert.equal(await page.evaluate(transition,'read'),state);assert.equal(await page.evaluate(()=>game.scene.keys.GameScene.pendingPlacements.size),0);const completed=await page.evaluate(transition,'complete');
   await page.setViewportSize({width,height});await page.waitForFunction(w=>game.scale.width===w,width);const restored=await page.evaluate(fixture,{flows:false});
   assert.equal(await page.evaluate(transition,'read'),completed);assert.equal(await page.evaluate(()=>!!game.scene.keys.GameScene.winText),true);results.push({width,height,result,rotated,restored});
  }assert.deepEqual(errors,[]);
 }finally{if(browser)await browser.close();server.close();fs.mkdirSync('.gameplay-evidence',{recursive:true});fs.writeFileSync('.gameplay-evidence/responsive.json',JSON.stringify({results},null,2))}
 console.log(JSON.stringify({responsiveViewports:results.length,passed:true}));
})().catch(e=>{console.error(e);process.exitCode=1});
