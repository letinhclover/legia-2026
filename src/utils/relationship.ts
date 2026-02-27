// Tính xưng hô tự động theo quan hệ huyết thống
import { Member } from '../types';

type RelationResult = { label: string; desc: string };

function findPath(from: string, to: string, members: Member[]): string[] | null {
  // BFS tìm đường đi từ 'from' đến 'to' qua quan hệ cha mẹ/con cái
  const map = new Map(members.map(m => [m.id, m]));
  const queue: string[][] = [[from]];
  const visited = new Set([from]);
  while (queue.length) {
    const path = queue.shift()!;
    const cur = map.get(path[path.length - 1]);
    if (!cur) continue;
    const neighbors: string[] = [];
    if (cur.fatherId) neighbors.push(cur.fatherId);
    if (cur.motherId) neighbors.push(cur.motherId);
    if (cur.spouseId) neighbors.push(cur.spouseId);
    members.filter(m => m.fatherId === cur.id || m.motherId === cur.id).forEach(m => neighbors.push(m.id));
    for (const n of neighbors) {
      if (n === to) return [...path, n];
      if (!visited.has(n)) { visited.add(n); queue.push([...path, n]); }
    }
  }
  return null;
}

export function getRelationship(viewer: Member, target: Member, members: Member[]): RelationResult {
  if (viewer.id === target.id) return { label: 'Chính bạn', desc: '' };

  const genDiff = target.generation - viewer.generation;
  const viewerGender = viewer.gender;
  const targetGender = target.gender;

  // Vợ/chồng
  if (viewer.spouseId === target.id || target.spouseId === viewer.id) {
    return {
      label: targetGender === 'Nam' ? 'Chồng' : 'Vợ',
      desc: 'Quan hệ hôn nhân'
    };
  }

  // Cha mẹ (đời trên 1)
  if (target.id === viewer.fatherId) return { label: 'Cha', desc: `Đời ${target.generation}` };
  if (target.id === viewer.motherId) return { label: 'Mẹ', desc: `Đời ${target.generation}` };

  // Con (đời dưới 1)
  if (target.fatherId === viewer.id || target.motherId === viewer.id) {
    return {
      label: targetGender === 'Nam' ? 'Con trai' : 'Con gái',
      desc: `Đời ${target.generation}`
    };
  }

  // Anh chị em ruột (cùng cha hoặc mẹ)
  const sameParent = viewer.fatherId && viewer.fatherId === target.fatherId
    || viewer.motherId && viewer.motherId === target.motherId;
  if (sameParent && genDiff === 0) {
    if (targetGender === 'Nam') return { label: 'Anh/Em trai', desc: 'Anh em ruột' };
    return { label: 'Chị/Em gái', desc: 'Chị em ruột' };
  }

  // Ông bà nội/ngoại (đời trên 2)
  if (genDiff === -2) {
    const isNoi = target.id === (members.find(m => m.id === viewer.fatherId)?.fatherId)
      || target.id === (members.find(m => m.id === viewer.fatherId)?.motherId);
    const side = isNoi ? 'nội' : 'ngoại';
    return {
      label: targetGender === 'Nam' ? `Ông ${side}` : `Bà ${side}`,
      desc: `Đời ${target.generation}`
    };
  }

  // Cháu (đời dưới 2)
  if (genDiff === 2) {
    return {
      label: targetGender === 'Nam' ? 'Cháu trai' : 'Cháu gái',
      desc: `Đời ${target.generation}`
    };
  }

  // Chú bác cô dì (đời trên 1, không phải cha mẹ)
  if (genDiff === -1) {
    // Là anh/em của cha
    const fatherSiblings = members.filter(m =>
      m.fatherId === members.find(p => p.id === viewer.fatherId)?.fatherId
      && m.id !== viewer.fatherId
    );
    if (fatherSiblings.find(m => m.id === target.id)) {
      if (targetGender === 'Nam') return { label: 'Chú/Bác', desc: 'Anh em của cha' };
      return { label: 'Cô', desc: 'Chị em của cha' };
    }
    // Là anh/em của mẹ
    if (targetGender === 'Nam') return { label: 'Cậu', desc: 'Anh em của mẹ' };
    return { label: 'Dì', desc: 'Chị em của mẹ' };
  }

  // Cụ kỵ
  if (genDiff <= -3) {
    const levels = Math.abs(genDiff) - 1;
    const prefix = levels === 2 ? 'Cụ' : levels >= 3 ? 'Kỵ/Tổ' : '';
    return {
      label: `${prefix} ${targetGender === 'Nam' ? 'ông' : 'bà'}`,
      desc: `Đời ${target.generation}`
    };
  }

  // Chắt, chít
  if (genDiff >= 3) {
    const label = genDiff === 3 ? 'Chắt' : 'Chít';
    return { label, desc: `Đời ${target.generation}` };
  }

  return {
    label: `Cùng dòng họ`,
    desc: `Đời ${target.generation} — chênh ${Math.abs(genDiff)} đời`
  };
}
