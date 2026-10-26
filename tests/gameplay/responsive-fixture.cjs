// Read geometry and exercise existing controls/scene methods; no synthetic input or focus.
module.exports = async function responsiveChecks({flows=true}={}) {
 const s=game.scene.keys.GameScene,wait=ms=>new Promise(r=>setTimeout(r,ms));
 const assert=(v,m)=>{if(!v)throw Error(m)};
 const rect=r=>({x:r.x,y:r.y,w:r.width,h:r.height});
 const inside=r=>r.x>=-.2&&r.y>=-.2&&r.x+r.w<=innerWidth+.2&&r.y+r.h<=innerHeight+.2;
 const intersects=(a,b)=>a.x<b.x+b.w-.1&&a.x+a.w>b.x+.1&&a.y<b.y+b.h-.1&&a.y+a.h>b.y+.1;
 const read=()=>{
  const c=s.game.canvas.getBoundingClientRect(),sx=c.width/s.scale.width,sy=c.height/s.scale.height;
  const board={x:c.x+(s.startX-10)*sx,y:c.y+(s.startY-10)*sy,w:(s.CELL_SIZE*9+20)*sx,h:(s.CELL_SIZE*9+20)*sy};
  const controls=[...document.querySelectorAll('#ui-container .palette-button,#ui-container button,#trontAbout > summary')].map(e=>{
   const r=rect(e.getBoundingClientRect()),hit=document.elementFromPoint(r.x+r.w/2,r.y+r.h/2);
   return{id:e.id||e.dataset.key||'About',...r,hit:!!hit&&(e===hit||e.contains(hit))};
  });
  const compact=s.compactLayout;
  assert(inside(board),'board outside viewport '+JSON.stringify(board));
  for(const r of controls){assert(inside(r)&&r.hit,'control outside or obscured '+JSON.stringify(r));if(compact){assert(r.w>=43.9&&r.h>=43.9,'control target below44 '+r.id);assert(!intersects(board,r),'control overlaps board '+r.id)}}
  if(compact)for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++)assert(!intersects(controls[i],controls[j]),'overlapping controls '+controls[i].id+'/'+controls[j].id);
  for(let y=0;y<9;y++)for(let x=0;x<9;x++){const cell=s.gridSprites[y][x];assert(Math.floor((cell.x-s.startX)/s.CELL_SIZE)===x&&Math.floor((cell.y-s.startY)/s.CELL_SIZE)===y,'cell coordinate round trip failed')}
  return{compact,side:s.sideLayout,board,cellSize:s.CELL_SIZE,controls,canvas:rect(c)};
 };
 const initial=read(),selected=[];
 for(let n=1;n<=9;n++){document.querySelector('.palette-button[data-key="'+n+'"]').click();const r=read();assert(s.selectedIconKey===n&&document.querySelector('.palette-button.selected').dataset.key===String(n),'selection failed');selected.push(r.controls.find(c=>c.id===String(n)))}
 const result={initial,selected,viewport:{width:innerWidth,height:innerHeight},touchAction:getComputedStyle(s.game.canvas).touchAction,viewportMeta:document.querySelector('meta[name=viewport]').content};
 if(!flows)return result;
 const cell=s.emptyCells[0],x=Math.floor((cell.x-s.startX)/s.CELL_SIZE),y=Math.floor((cell.y-s.startY)/s.CELL_SIZE);s.selectedIconKey=s.solution[y][x];s.placeIconOnGrid(cell);await wait(450);const board=JSON.stringify(s.board),solution=JSON.stringify(s.solution);
 document.getElementById('info-button').click();const info=document.getElementById('info-modal'),close=document.getElementById('close-modal');
 const modal=[];for(const offset of [0,100000]){info.scrollTop=offset;await wait(30);const r=rect(close.getBoundingClientRect()),hit=document.elementFromPoint(r.x+r.w/2,r.y+r.h/2);assert(inside(r)&&hit===close,'Info Close unreachable');if(s.compactLayout)assert(r.w>=44&&r.h>=44,'Info Close target below44');modal.push({bounds:rect(info.getBoundingClientRect()),close:r,scroll:info.scrollTop,maxScroll:info.scrollHeight-info.clientHeight})}
 if(s.compactLayout)assert(modal.every(m=>inside(m.bounds)),'Info outside compact viewport');close.click();
 document.querySelector('#trontAbout summary').click();await wait(30);const panel=document.querySelector('#trontAbout .tront-about-panel');assert(panel,'missing About panel');panel.scrollTop=panel.scrollHeight;document.querySelector('#trontAbout summary').click();
 assert(JSON.stringify(s.board)===board&&JSON.stringify(s.solution)===solution,'dialog return changed puzzle');read();result.modal=modal;result.returnPreserved=true;
 for(const c of [...s.emptyCells]){const x=Math.floor((c.x-s.startX)/s.CELL_SIZE),y=Math.floor((c.y-s.startY)/s.CELL_SIZE);s.selectedIconKey=s.solution[y][x];s.placeIconOnGrid(c)}
 const frames=[];for(let i=0;i<20;i++){await wait(100);if(s.winText){const r=rect(s.winText.getBounds());if(s.compactLayout)assert(inside(r),'animated win outside viewport '+JSON.stringify(r));frames.push(r)}}
 assert(s.checkWin()&&s.winText,'no completed state');result.win={frames,final:rect(s.winText.getBounds())};result.completed=read();
 document.getElementById('new-game-button').click();assert(s.emptyCells.length===48&&!s.winText,'New Game failed');result.reset=read();return result;
};
