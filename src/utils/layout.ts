import dagre from 'dagre';
import { Node, Edge } from 'reactflow';
import { Member } from '../types';

export const NODE_W = 145;
export const NODE_H = 148;

const SPOUSE_GAP      = 28;
const RANK_SEP        = 190;
const NODE_SEP        = 50;
const SIBLING_STAGGER = 14; // px lệch Y nhẹ giữa anh em

function getBirthYear(m: Member): number {
  if (!m.birthDate) return Infinity;
  const y = parseInt(m.birthDate.slice(0, 4));
  return isNaN(y) ? Infinity : y;
}

function sortSiblings(members: Member[]): Member[] {
  const groups = new Map<string, Member[]>();
  members.forEach(m => {
    const key = m.fatherId ?? m.motherId ?? '__root__';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  });
  groups.forEach(g => g.sort((a, b) => getBirthYear(a) - getBirthYear(b) || a.id.localeCompare(b.id)));

  const visited = new Set<string>();
  const sorted: Member[] = [];
  const roots = members
    .filter(m => !m.fatherId && !m.motherId)
    .sort((a, b) => getBirthYear(a) - getBirthYear(b));

  const queue = [...roots];
  while (queue.length) {
    const cur = queue.shift()!;
    if (visited.has(cur.id)) continue;
    visited.add(cur.id);
    sorted.push(cur);
    queue.push(...(groups.get(cur.id) ?? []).filter(c => !visited.has(c.id)));
  }
  members.forEach(m => { if (!visited.has(m.id)) sorted.push(m); });
  return sorted;
}

export function buildFamilyLayout(
  members: Member[],
  onNodeClick: (m: Member) => void
): { nodes: Node[]; edges: Edge[] } {
  if (members.length === 0) return { nodes: [], edges: [] };

  const memberMap = new Map(members.map(m => [m.id, m]));
  const sortedMembers = sortSiblings(members);

  // Bước 1: Couple groups
  const processedSpouse = new Set<string>();
  const coupleGroups: Array<{ id: string; members: string[] }> = [];
  const memberToGroup = new Map<string, string>();

  sortedMembers.forEach(m => {
    if (processedSpouse.has(m.id)) return;
    const spouse = m.spouseId ? memberMap.get(m.spouseId) : null;
    if (spouse && !processedSpouse.has(spouse.id)) {
      const husband = m.gender === 'Nam' ? m : spouse;
      const wife    = m.gender === 'Nam' ? spouse : m;
      const gid     = `couple_${husband.id}`;
      coupleGroups.push({ id: gid, members: [husband.id, wife.id] });
      memberToGroup.set(husband.id, gid);
      memberToGroup.set(wife.id, gid);
      processedSpouse.add(m.id);
      processedSpouse.add(spouse.id);
    } else {
      const gid = `single_${m.id}`;
      coupleGroups.push({ id: gid, members: [m.id] });
      memberToGroup.set(m.id, gid);
      processedSpouse.add(m.id);
    }
  });

  // Bước 2: Dagre
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: NODE_SEP, ranksep: RANK_SEP });

  coupleGroups.forEach(group => {
    const w = group.members.length === 2 ? NODE_W * 2 + SPOUSE_GAP : NODE_W;
    g.setNode(group.id, { width: w, height: NODE_H });
  });

  const addedGroupEdges = new Set<string>();
  members.forEach(child => {
    const cg = memberToGroup.get(child.id)!;
    for (const pid of [child.fatherId, child.motherId].filter(Boolean) as string[]) {
      const pg = memberToGroup.get(pid);
      if (!pg || pg === cg) continue;
      const key = `${pg}→${cg}`;
      if (!addedGroupEdges.has(key)) { addedGroupEdges.add(key); g.setEdge(pg, cg); }
    }
  });

  dagre.layout(g);

  // Bước 3: Pixel positions — vợ chồng cùng Y tuyệt đối
  const positions = new Map<string, { x: number; y: number }>();
  coupleGroups.forEach(group => {
    const gPos = g.node(group.id);
    if (!gPos) return;
    const baseY = gPos.y - NODE_H / 2;
    const left  = gPos.x - gPos.width / 2;
    if (group.members.length === 2) {
      const [husbandId, wifeId] = group.members;
      positions.set(husbandId, { x: left,                       y: baseY });
      positions.set(wifeId,    { x: left + NODE_W + SPOUSE_GAP, y: baseY });
    } else {
      positions.set(group.members[0], { x: gPos.x - NODE_W / 2, y: baseY });
    }
  });

  // Bước 4: Sibling stagger — anh cả cao nhất, em thấp dần nhẹ
  const siblingGroupsMap = new Map<string, string[]>();
  sortedMembers.forEach(m => {
    const parentId = m.fatherId ?? m.motherId;
    if (!parentId) return;
    if (!siblingGroupsMap.has(parentId)) siblingGroupsMap.set(parentId, []);
    siblingGroupsMap.get(parentId)!.push(m.id);
  });
  siblingGroupsMap.forEach(siblingIds => {
    if (siblingIds.length < 2) return;
    const anchor = positions.get(siblingIds[0]);
    if (!anchor) return;
    siblingIds.forEach((id, idx) => {
      if (idx === 0) return;
      const pos = positions.get(id);
      if (!pos) return;
      const newY = anchor.y + idx * SIBLING_STAGGER;
      positions.set(id, { x: pos.x, y: newY });
      // Sync spouse Y
      const m = memberMap.get(id);
      if (m?.spouseId) {
        const sp = positions.get(m.spouseId);
        if (sp) positions.set(m.spouseId, { x: sp.x, y: newY });
      }
    });
  });

  // Bước 5: Anti-overlap theo generation
  const byGen = new Map<number, string[]>();
  members.forEach(m => {
    if (!byGen.has(m.generation)) byGen.set(m.generation, []);
    byGen.get(m.generation)!.push(m.id);
  });
  byGen.forEach(ids => {
    ids.sort((a, b) => (positions.get(a)?.x ?? 0) - (positions.get(b)?.x ?? 0));
    for (let i = 1; i < ids.length; i++) {
      const prev = positions.get(ids[i - 1]);
      const cur  = positions.get(ids[i]);
      if (!prev || !cur) continue;
      if (cur.x - prev.x < NODE_W + 18)
        positions.set(ids[i], { x: prev.x + NODE_W + 18, y: cur.y });
    }
  });

  // Bước 6: Nodes
  const flowNodes: Node[] = members.map(m => ({
    id: m.id,
    type: 'familyNode',
    position: positions.get(m.id) ?? { x: 0, y: 0 },
    data: {
      ...m,
      spouseName: m.spouseId ? memberMap.get(m.spouseId)?.name : undefined,
      onEdit: onNodeClick,
    },
  }));

  // Bước 7: Edges
  const flowEdges: Edge[] = [];
  const memberIds   = new Set(members.map(m => m.id));
  const addedFlow   = new Set<string>();
  const addedSpouse = new Set<string>();

  members.forEach(m => {
    if (m.fatherId && memberIds.has(m.fatherId)) {
      const key = `f-${m.fatherId}-${m.id}`;
      if (!addedFlow.has(key)) {
        addedFlow.add(key);
        flowEdges.push({
          id: key, source: m.fatherId, target: m.id,
          type: 'smoothstep',
          style: { stroke: '#800000', strokeWidth: 2.5 },
          markerEnd: { type: 'arrowclosed' as any, color: '#800000' },
        });
      }
    }
    if (m.motherId && memberIds.has(m.motherId) && !m.fatherId) {
      const key = `m-${m.motherId}-${m.id}`;
      if (!addedFlow.has(key)) {
        addedFlow.add(key);
        flowEdges.push({
          id: key, source: m.motherId, target: m.id,
          type: 'smoothstep',
          style: { stroke: '#BE185D', strokeWidth: 1.8, strokeDasharray: '6,3' },
        });
      }
    }
    if (m.spouseId && memberIds.has(m.spouseId)) {
      const pairKey = [m.id, m.spouseId].sort().join('|');
      if (!addedSpouse.has(pairKey)) {
        addedSpouse.add(pairKey);
        const husband = m.gender === 'Nam' ? m : memberMap.get(m.spouseId)!;
        const wife    = m.gender === 'Nam' ? memberMap.get(m.spouseId)! : m;
        flowEdges.push({
          id: `spouse-${pairKey}`,
          source: husband?.id ?? m.id,
          target: wife?.id   ?? m.spouseId,
          type: 'straight',
          style: { stroke: '#B8860B', strokeWidth: 2, strokeDasharray: '8,4' },
          label: '💑',
          labelStyle: { fontSize: 10 },
          labelBgStyle: { fill: 'transparent' },
        });
      }
    }
  });

  return { nodes: flowNodes, edges: flowEdges };
}
