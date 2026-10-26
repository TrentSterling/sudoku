# 2026-10-26: placement correctness

Changing the palette during the placement animation previously stored the new selection while displaying the old icon. Repeating a placement on the same cell could remove an unrelated empty cell and trigger a false win with blanks still on the board.

Each animation now retains its submitted value and owns its pending cell until it completes or is canceled. Repeated submissions on that cell do nothing while other cells remain playable. Wrong-answer feedback releases the cell for another attempt. Completion checks the actual board against the solution, and a win is created once.

New Game cancels pending work and celebration effects before generating the next puzzle. Resizing redraws the current puzzle at the current viewport size, preserving accepted values and completion state while canceling unfinished placements. Scene effects are cleaned up before redraw, preventing leftover error highlights, duplicate crabs and repeating celebration timers.

The existing puzzle generator, 48-blank starting rule, artwork, palette, animation timing and About content are preserved. The game has no persisted puzzle/save format. Local tests use muted isolated headless DOM and scene calls; physical touch, keyboard and audio are not tested.
