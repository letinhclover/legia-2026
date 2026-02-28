import dagre from 'dagre';
import { Node, Edge } from 'reactflow';
import { Member } from '../types';

export const NODE_W = 230;
export const NODE_H = 115;
const SPOUSE_GAP  = 40;
const RANK_SEP    = 180;
const NODE_SEP    = 70;

// Chồng cao hơn vợ 14px → cảm giác "ảnh chồng lớn hơn bên trái"
const HUSBAND_Y_OFFSET = -14;

// Bậc thang Y cho anh em
const STAIRCASE_OFFSET = 80;

function getBirthYear(m: Member): number {
  if (!m.birthDate) return Infinity;
  const y = parseInt(m.birthDate.slice(0, 4));
  return isNaN(y) ? Infinity : y;
}

function sortSiblings(members: Member[]): Member[] {
  const siblingGroups = new Map<string, Member[]>();
  members.forEach(m => {
    const key = m.fatherId ?? m.motherId ?? '__root__';
    if (!siblingGroups.has(key)) siblingGroups.set(key, []);
    siblingGroups.get(key)!.push(m);
  });

  siblingGroups.forEach(group => {
    group.sort((a, b) => {
      const diff = getBirthYear(a) - getBirthYear(b);
      return diff !== 0 ? diff : a.id.localeCompare(b.id);
    });
  });

  const visited = new Set<string>();
  const sorted: Member[] = [];

  const roots = members
    .filter(m => !m.fatherId && !m.motherId)
    .sort((a, b) => {
      const diff = getBirthYear(a) - getBirthYear(b);
      return diff !== 0 ? diff : a.id.localeCompare(b.id);
    });

  const queue = [...roots];
  while (queue.length) {
    const cur = queue.shift()!;
    if (visited.has(cur.id)) continue;
    visited.add(cur.id);
    sorted.push(cur);
    const children = siblingGroups.get(cur.id) ?? [];
    queue.push(...children.filter(c => !visited.has(c.id)));
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

  // ── Bước 1: Tạo couple groups ──
  const processedSpouse = new Set<string>();
  const coupleGroups: Array<{ id: string; members: string[] }> = [];
  const memberToGroup = new Map<string, string>();

  sortedMembers.forEach(m => {
    if (processedSpouse.has(m.id)) return;
    const spouse = m.spouseId ? memberMap.get(m.spouseId) : null;

    if (spouse && !processedSpouse.has(spouse.id)) {
      const husband = m.gender === 'Nam' ? m : spouse;
      const wife    = m.gender === 'Nam' ? spouse : m;
      const gid = `couple_${husband.id}`;
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

  // ── Bước 2: Dagre ──
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: NODE_SEP, ranksep: RANK_SEP });

  coupleGroups.forEach(group => {
    const w = group.members.length === 2 ? NODE_W * 2 + SPOUSE_GAP : NODE_W;
    g.setNode(group.id, { width: w, height: NODE_H });
  });

  const addedEdges = new Set<string>();
  members.forEach(child => {
    const childGroup = memberToGroup.get(child.id)!;
    for (const pid of [child.fatherId, child.motherId].filter(Boolean) as string[]) {
      const parentGroup = memberToGroup.get(pid);
      if (!parentGroup || parentGroup === childGroup) continue;
      const key = `${parentGroup}→${childGroup}`;
      if (!addedEdges.has(key)) { addedEdges.add(key); g.setEdge(parentGroup, childGroup); }
    }
  });

  dagre.layout(g);

  // ── Bước 3: Tính vị trí pixel ──
  const positions = new Map<string, { x: number; y: number }>();

  coupleGroups.forEach(group => {
    const gPos = g.node(group.id);
    if (!gPos) return;

    if (group.members.length === 2) {
      const [husbandId, wifeId] = group.members;
      const left  = gPos.x - gPos.width / 2;
      const baseY = gPos.y - NODE_H / 2;
      // Chồng cao hơn vợ HUSBAND_Y_OFFSET px
      positions.set(husbandId, { x: left, y: baseY + HUSBAND_Y_OFFSET });
      positions.set(wifeId,    { x: left + NODE_W + SPOUSE_GAP, y: baseY });
    } else {
      positions.set(group.members[0], {
        x: gPos.x - NODE_W / 2,
        y: gPos.y - NODE_H / 2,
      });
    }
  });

  // ── Bước 4: Staircase — con của anh cả cao hơn, con của em thấp dần ──
  const siblingGroupsForStaircase = new Map<string, string[]>();
  sortedMembers.forEach(m => {
    const parentId = m.fatherId ?? m.motherId;
    if (!parentId) return;
    if (!siblingGroupsForStaircase.has(parentId))
      siblingGroupsForStaircase.set(parentId, []);
    siblingGroupsForStaircase.get(parentId)!.push(m.id);
  });

  siblingGroupsForStaircase.forEach(siblingIds => {
    if (siblingIds.length < 2) return;
    const basePos = positions.get(siblingIds[0]);
    if (!basePos) return;
    const baseY = basePos.y;

    siblingIds.forEach((id, idx) => {
      const pos = positions.get(id);
      if (!pos) return;
      const newY = baseY + idx * STAIRCASE_OFFSET;
      positions.set(id, { x: pos.x, y: newY });

      // Sync vợ/chồng theo Y mới, giữ nguyên offset chồng/vợ
      const m = memberMap.get(id);
      if (m?.spouseId) {
        const spousePos = positions.get(m.spouseId);
        if (spousePos) {
          const isHusband = m.gender === 'Nam';
          positions.set(m.spouseId, {
            x: spousePos.x,
            y: isHusband
              ? newY + Math.abs(HUSBAND_Y_OFFSET)   // vợ thấp hơn chồng
              : newY - Math.abs(HUSBAND_Y_OFFSET),   // chồng cao hơn vợ
          });
        }
      }
    });
  });

  // ── Bước 5: React Flow nodes ──
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

  // ── Bước 6: Edges ──
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
          markerEnd: undefined,
          label: '💑',
          labelStyle: { fontSize: 12 },
          labelBgStyle: { fill: 'transparent' },
        });
      }
    }
  });

  return { nodes: flowNodes, edges: flowEdges };
}
