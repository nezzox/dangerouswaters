// Use the nearest vessel in the receiving player's view to choose the update rate.
export function positionInterval(distance) {
  return distance <= 1000 ? 150 : 600;
}

export function vesselPosition(vessel) {
  return [Math.round(vessel.x * 10) / 10, Math.round(vessel.y * 10) / 10,
    Math.round(vessel.heading * 1000) / 1000];
}

// Keep gear changes out of high-frequency vessel snapshots. An ID can be reused
// after hauling, so compare its coordinates as well as its number.
export function potChanges(previous, next) {
  const before = new Map(previous.map(pot => [pot.id, pot]));
  const after = new Map(next.map(pot => [pot.id, pot]));
  const changes = {};
  for (const [id] of before) if (!after.has(id)) changes[id] = null;
  for (const [id, pot] of after) {
    const old = before.get(id);
    if (!old || old.x !== pot.x || old.y !== pot.y) changes[id] = [pot.x, pot.y];
  }
  return changes;
}
