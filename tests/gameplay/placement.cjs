'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8');
const source=html.slice(html.indexOf('class GameScene'),html.indexOf('\nconst config ='));
const ctx=vm.createContext({Phaser:{Scene:class{}},Set,Map,Number,Math,JSON});
vm.runInContext(source+'\nthis.GameScene=GameScene;',ctx);
function object(x=0,y=0){return {x,y,active:true,data:{},enabled:true,add(){return this},setScale(){return this},setInteractive(){this.enabled=true;return this},disableInteractive(){this.enabled=false;return this},setData(k,v){if(typeof k==='object')Object.assign(this.data,k);else this.data[k]=v;return this},getData(k){return this.data[k]},destroy(){this.active=false}}}
function scene(){
 const s=new ctx.GameScene();s.CELL_SIZE=10;s.startX=s.startY=0;s.calls=[];s.jobs=[];s.wins=0;
 s.add={container:object,graphics:()=>object()};s.drawMakeupIcon=(icon,key)=>icon.key=key;
 s.tweens={add:job=>{s.jobs.push(job);return job},killTweensOf:target=>{for(const j of s.jobs)if(j.targets===target)j.killed=true}};
 s.triggerParticles=()=>{};s.flashIncorrectLines=()=>{};s.jiggleConflicts=(y,x,value)=>s.calls.push(value);s.cameras={main:{shake(){}}};
 s.generateSudoku=()=>{s.board=Array.from({length:9},()=>Array(9).fill(0));s.solution=Array.from({length:9},(_,y)=>Array.from({length:9},(_,x)=>(x+y)%9+1))};
 s.gridSprites=Array.from({length:9},(_,y)=>Array.from({length:9},(_,x)=>object(x*10+5,y*10+5)));
 s.winGame=function(){assert.ok(this.checkWin());this.wins++};s.resetBoard();return s;
}
function place(s,c=s.emptyCells[0],value){const y=Math.floor(c.y/10),x=Math.floor(c.x/10);s.selectedIconKey=value??s.solution[y][x];s.placeIconOnGrid(c);return s.jobs.at(-1)}
test('palette changes preserve the animated value and reject duplicate same-cell submissions',()=>{const s=scene(),c=s.emptyCells[0],j=place(s,c);for(let i=1;i<=9;i++){s.selectedIconKey=i;s.placeIconOnGrid(c)}assert.equal(s.jobs.length,1);j.onComplete();assert.equal(s.board[0][0],1);assert.equal(s.emptyCells.length,80);assert.equal(c.enabled,false);j.onComplete();assert.equal(s.emptyCells.length,80)});
test('different cells can settle in either order with captured values',()=>{const s=scene(),a=place(s,s.emptyCells[0]),b=place(s,s.emptyCells[1]);s.selectedIconKey=9;b.onComplete();a.onComplete();assert.deepEqual(s.board[0].slice(0,2),[1,2]);assert.equal(s.emptyCells.length,79)});
test('incorrect feedback uses original selection and the cell can retry after fade',()=>{const s=scene(),c=s.emptyCells[0],j=place(s,c,2);s.selectedIconKey=1;j.onComplete();assert.deepEqual(s.calls,[2]);assert.equal(s.board[0][0],0);const fade=s.jobs.at(-1);fade.onComplete();assert.equal(c.icon,null);assert.equal(c.enabled,true);place(s,c,1).onComplete();fade.onComplete();assert.equal(s.board[0][0],1);assert.equal(c.icon.active,true)});
test('stopped entrance and fade animations restore the blank cell without committing',()=>{for(const wrong of [false,true]){const s=scene(),c=s.emptyCells[0],j=place(s,c,wrong?2:1);if(wrong)j.onComplete();s.jobs.at(-1).onStop();assert.equal(c.enabled,true);assert.equal(c.icon,null);assert.equal(s.pendingPlacements.size,0);assert.equal(s.board[0][0],0);j.onComplete();assert.equal(s.board[0][0],0)}});
test('reset cancels pending callbacks and stale completions cannot edit a new puzzle',()=>{const s=scene(),c=s.emptyCells[0],j=place(s,c);s.resetBoard();const board=s.board;j.onComplete();assert.equal(s.board,board);assert.equal(s.board[0][0],0);assert.equal(s.emptyCells.length,81);assert.equal(c.icon,null);assert.equal(s.pendingPlacements.size,0)});
test('reset cancels an incorrect fade and its late callback cannot destroy a new icon',()=>{const s=scene(),c=s.emptyCells[0];place(s,c,2).onComplete();const fade=s.jobs.at(-1);s.resetBoard();place(s,c).onComplete();const icon=c.icon;fade.onComplete();assert.equal(c.icon,icon);assert.equal(icon.active,true);assert.equal(s.board[0][0],1)});
test('redraw cancels pending work, keeps board and solution, and updates cell identities',()=>{const s=scene(),c=s.emptyCells[0],j=place(s,c),board=s.board,solution=s.solution;s.cancelPlacements();s.gridSprites=s.gridSprites.map(row=>row.map(c=>object(c.x,c.y)));s.renderBoard();j.onComplete();assert.equal(s.board,board);assert.equal(s.solution,solution);assert.equal(s.board[0][0],0);assert.equal(s.emptyCells.length,81);s.placeIconOnGrid(c);assert.equal(s.pendingPlacements.size,0)});
test('last two placements win once, even with replayed callbacks and duplicate submissions',()=>{const s=scene();s.board=s.solution.map(row=>[...row]);s.board[0][0]=s.board[0][1]=0;s.renderBoard();const c=s.emptyCells[0],a=place(s,c),b=place(s,s.emptyCells[1]);a.onComplete();assert.equal(s.wins,0);b.onComplete();assert.equal(s.wins,1);a.onComplete();b.onComplete();s.placeIconOnGrid(c);assert.equal(s.wins,1);assert.equal(s.emptyCells.length,0);assert.ok(s.checkWin())});
test('a corrupted remaining-cell list cannot falsely report a completed board',()=>{const s=scene();s.emptyCells=[];assert.equal(s.checkWin(),false)});
test('given cells and invalid palette keys cannot start animations',()=>{const s=scene(),c=s.emptyCells[0];for(const value of [0,10,1.5,NaN])place(s,c,value);s.board[0][0]=1;place(s,c,2);assert.equal(s.jobs.length,0)});
