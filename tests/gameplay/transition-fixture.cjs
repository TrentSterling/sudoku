module.exports = async function transitionState(phase) {
 const s=game.scene.keys.GameScene,wait=ms=>new Promise(r=>setTimeout(r,ms));
 const place=c=>{const x=Math.floor((c.x-s.startX)/s.CELL_SIZE),y=Math.floor((c.y-s.startY)/s.CELL_SIZE);s.selectedIconKey=s.solution[y][x];s.placeIconOnGrid(c)};
 if(phase==='partial'){place(s.emptyCells[0]);await wait(450);place(s.emptyCells[0]);}
 if(phase==='complete'){for(const c of [...s.emptyCells])place(c);await wait(450);if(!s.checkWin()||!s.winText)throw Error('transition setup did not complete')}
 return JSON.stringify({board:s.board,solution:s.solution,givens:s.givenCells});
};
