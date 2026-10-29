// Where every node goes: papers it cites on the left, papers citing it on the right, authors on top.
export const LAYOUT = {
  radius: 220,          // distance of the first ring of neighbor papers from the selected paper
  ringGap: 180,         // a side with too many papers for one ring continues on rings further out
  minNodeGap: 34,       // minimum distance between neighbors on a ring (px)
  contextOffset: 100,   // contexts sit this far in from their paper, on the line to the selected paper
  degreesPerNode: 12,   // angular spacing between neighbors, capped by the sector span
  sideSpan: 80,         // each side uses a sector of this many degrees
  authorsPerRow: 5,
  authorGap: 90,
  authorRowGap: 64,
  authorY: -190
};
export const SIDES = {
  references: { centerDeg: 180, sign: -1 },
  cited_by:   { centerDeg: 0,   sign: 1 }
};

export function polar(deg, radius){
  const rad = deg * Math.PI / 180;
  return { x: radius * Math.cos(rad), y: radius * Math.sin(rad) };
}

// {angle, radius} of each of `count` neighbors on one side, top to bottom. A ring holds as
// many neighbors as fit its sector; the rest go on the next ring out. Up to ~11 neighbors
// need one ring only, the full-page view of a big neighbourhood uses several.
export function sidePlacements(side, count){
  const placements = [];
  for (let ring = 0; placements.length < count; ring++){
    const radius = LAYOUT.radius + ring * LAYOUT.ringGap;
    const capacity = Math.floor(radius * LAYOUT.sideSpan * Math.PI / 180 / LAYOUT.minNodeGap) + 1;
    const inRing = Math.min(capacity, count - placements.length);
    const step = inRing === 1 ? 0 : Math.min(LAYOUT.sideSpan / (inRing - 1), LAYOUT.degreesPerNode);
    for (let i = 0; i < inRing; i++){
      const offset = (i - (inRing - 1) / 2) * step;
      placements.push({ radius, angle: side.centerDeg + side.sign * offset });
    }
  }
  return placements;
}

// authors form rows on top, centered, new rows stacking upward
export function authorPosition(i, count){
  const row = Math.floor(i / LAYOUT.authorsPerRow);
  const inRow = Math.min(LAYOUT.authorsPerRow, count - row * LAYOUT.authorsPerRow);
  const column = i % LAYOUT.authorsPerRow;
  return {
    x: (column - (inRow - 1) / 2) * LAYOUT.authorGap,
    y: LAYOUT.authorY - row * LAYOUT.authorRowGap
  };
}
