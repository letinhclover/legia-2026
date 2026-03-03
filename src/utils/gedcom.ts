/**
 * gedcom.ts — Xuất + Nhập GEDCOM 5.5.5
 * Thêm mới: importFromGedcom() — parse file .ged từ Ancestry, MyHeritage, Gramps…
 */
import { Member } from '../types';

// ════════════════════════════════════════════════════════
//  EXPORT — Xuất GEDCOM
// ════════════════════════════════════════════════════════

function gedDate(iso?: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const mn = months[parseInt(m) - 1] ?? '';
  return `${d ? d + ' ' : ''}${mn ? mn + ' ' : ''}${y ?? ''}`.trim();
}

function esc(s?: string | null) { return (s ?? '').replace(/[\r\n@]/g, ' ').trim(); }

export function downloadGedcom(members: Member[]): void {
  const memberMap = new Map(members.map(m => [m.id, m]));
  const lines: string[] = [
    '0 HEAD',
    '1 SOUR Gia-Pha-Ho-Le',
    '1 GEDC',
    '2 VERS 5.5.5',
    '2 FORM LINEAGE-LINKED',
    '1 CHAR UTF-8',
    '1 LANG Vietnamese',
    `1 DATE ${new Date().toLocaleDateString('en-GB').toUpperCase()}`,
  ];

  // ── INDI records ──────────────────────────────────────
  members.forEach(m => {
    lines.push(`0 @I${m.id}@ INDI`);
    lines.push(`1 NAME ${esc(m.name)}`);

    const parts = m.name.trim().split(' ');
    const surn  = parts[0] ?? '';
    const givn  = parts.slice(1).join(' ');
    lines.push(`2 SURN ${esc(surn)}`);
    lines.push(`2 GIVN ${esc(givn)}`);

    if (m.tenHuy)    lines.push(`1 NAME ${esc(m.tenHuy)}\n2 TYPE AKA`);
    if (m.nickname)  lines.push(`1 NICK ${esc(m.nickname)}`);
    if (m.chucTuoc)  lines.push(`1 TITL ${esc(m.chucTuoc)}`);

    lines.push(`1 SEX ${m.gender === 'Nam' ? 'M' : 'F'}`);

    if (m.birthDate || m.birthPlace) {
      lines.push('1 BIRT');
      if (m.birthDate) lines.push(`2 DATE ${gedDate(m.birthDate)}`);
      if (m.birthPlace) lines.push(`2 PLAC ${esc(m.birthPlace)}`);
    }
    if (m.deathDate || m.deathPlace) {
      lines.push('1 DEAT Y');
      if (m.deathDate) lines.push(`2 DATE ${gedDate(m.deathDate)}`);
      if (m.deathPlace) lines.push(`2 PLAC ${esc(m.deathPlace)}`);
    }
    if (m.burialAddress) {
      lines.push('1 BURI');
      lines.push(`2 PLAC ${esc(m.burialAddress)}`);
      if (m.burialMapLink) lines.push(`2 NOTE Maps: ${esc(m.burialMapLink)}`);
    }
    if (m.residence) lines.push(`1 RESI\n2 PLAC ${esc(m.residence)}`);
    if (m.biography) {
      lines.push('1 NOTE');
      m.biography.split('\n').forEach((ln, i) => lines.push(`${i === 0 ? '' : '2 CONT '}${ln}`));
    }
    if (m.photoUrl)   lines.push(`1 OBJE\n2 FILE ${m.photoUrl}\n2 FORM URL`);
    if (m.memberType && m.memberType !== 'chinh')
      lines.push(`1 _MTYP ${m.memberType}`);
    if (m.generation) lines.push(`1 _GEN ${m.generation}`);
  });

  // ── FAM records ───────────────────────────────────────
  const famIds = new Set<string>();
  members.forEach(m => {
    if (!m.fatherId && !m.motherId) return;
    const fatherId = m.fatherId ?? null;
    const motherId = m.motherId ?? null;
    const famKey   = [fatherId ?? '', motherId ?? ''].join('_');
    if (famIds.has(famKey)) return;
    famIds.add(famKey);
    lines.push(`0 @F${famKey}@ FAM`);
    if (fatherId) lines.push(`1 HUSB @I${fatherId}@`);
    if (motherId) lines.push(`1 WIFE @I${motherId}@`);
    const children = members.filter(c =>
      (c.fatherId === fatherId || (!fatherId && !c.fatherId)) &&
      (c.motherId === motherId || (!motherId && !c.motherId))
    );
    children.forEach(c => lines.push(`1 CHIL @I${c.id}@`));
    // Link vợ/chồng
    if (fatherId && motherId) {
      const father = memberMap.get(fatherId);
      if (father?.spouseId === motherId) {
        const marriedAt = '';
        if (marriedAt) lines.push(`1 MARR\n2 DATE ${marriedAt}`);
        else lines.push('1 MARR');
      }
    }
  });

  lines.push('0 TRLR');

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `GiaPha_HoLe_${new Date().toISOString().slice(0, 10)}.ged`;
  a.click();
  URL.revokeObjectURL(url);
}

// ════════════════════════════════════════════════════════
//  IMPORT — Nhập GEDCOM (MỚI)
// ════════════════════════════════════════════════════════

interface GedIndi {
  id: string;
  name: string;
  gender: 'Nam' | 'Nữ';
  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  deathPlace?: string;
  nickname?: string;
  chucTuoc?: string;
  biography?: string;
  photoUrl?: string;
  generation?: number;
  memberType?: string;
}

interface GedFam {
  husbId?: string;
  wifeId?: string;
  children: string[];
}

/** Chuyển GEDCOM date string → ISO YYYY-MM-DD */
function parseGedDate(s: string): string {
  if (!s) return '';
  const months: Record<string, string> = {
    JAN:'01',FEB:'02',MAR:'03',APR:'04',MAY:'05',JUN:'06',
    JUL:'07',AUG:'08',SEP:'09',OCT:'10',NOV:'11',DEC:'12',
  };
  // Dạng "15 MAR 1945" hoặc "MAR 1945" hoặc "1945"
  const parts = s.trim().split(/\s+/);
  if (parts.length === 3) {
    const d = parts[0].padStart(2, '0');
    const m = months[parts[1].toUpperCase()] ?? '01';
    const y = parts[2];
    return `${y}-${m}-${d}`;
  }
  if (parts.length === 2) {
    const m = months[parts[0].toUpperCase()];
    if (m) return `${parts[1]}-${m}-01`;
    return `${parts[0]}-01-01`;
  }
  if (parts.length === 1 && /^\d{4}$/.test(parts[0])) {
    return `${parts[0]}-01-01`;
  }
  return '';
}

export async function importFromGedcom(file: File): Promise<Partial<Member>[]> {
  const text = await file.text();
  const lines = text.split(/\r?\n/);

  const indis = new Map<string, GedIndi>();
  const fams  = new Map<string, GedFam>();

  let curType: 'INDI' | 'FAM' | null = null;
  let curId   = '';
  let curTag  = '';   // tag level-1 hiện tại (BIRT, DEAT, …)

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const spIdx  = line.indexOf(' ');
    const level  = parseInt(line.slice(0, spIdx));
    const rest   = line.slice(spIdx + 1).trim();

    if (isNaN(level)) continue;

    // ── Level 0: record mới ──
    if (level === 0) {
      curTag = '';
      const m0 = rest.match(/^@([^@]+)@\s+(\w+)/);
      if (m0) {
        const [, xref, tag] = m0;
        if (tag === 'INDI') {
          curType = 'INDI'; curId = xref;
          indis.set(xref, { id: xref, name: 'Không rõ', gender: 'Nam' });
        } else if (tag === 'FAM') {
          curType = 'FAM'; curId = xref;
          fams.set(xref, { children: [] });
        } else {
          curType = null; curId = '';
        }
      } else {
        curType = null; curId = '';
      }
      continue;
    }

    if (!curType || !curId) continue;

    const tagSpIdx = rest.indexOf(' ');
    const tag      = tagSpIdx >= 0 ? rest.slice(0, tagSpIdx) : rest;
    const val      = tagSpIdx >= 0 ? rest.slice(tagSpIdx + 1).trim() : '';

    // ── INDI ──
    if (curType === 'INDI') {
      const indi = indis.get(curId)!;
      if (level === 1) {
        curTag = tag;
        switch (tag) {
          case 'NAME':
            // "Lê /Văn A/" → normalize
            indi.name = val.replace(/\//g, '').replace(/\s+/g, ' ').trim() || 'Không rõ';
            break;
          case 'SEX':
            indi.gender = val.trim().toUpperCase() === 'F' ? 'Nữ' : 'Nam';
            break;
          case 'NICK':  indi.nickname = val; break;
          case 'TITL':  indi.chucTuoc = val; break;
          case '_GEN':  indi.generation = parseInt(val) || undefined; break;
          case '_MTYP': indi.memberType = val; break;
          case 'NOTE':  indi.biography = val; break;
        }
      } else if (level === 2) {
        switch (curTag) {
          case 'BIRT':
            if (tag === 'DATE')  indi.birthDate  = parseGedDate(val);
            if (tag === 'PLAC')  indi.birthPlace = val;
            break;
          case 'DEAT':
            if (tag === 'DATE')  indi.deathDate  = parseGedDate(val);
            if (tag === 'PLAC')  indi.deathPlace = val;
            break;
          case 'OBJE':
            if (tag === 'FILE')  indi.photoUrl   = val;
            break;
          case 'NOTE':
            if (tag === 'CONT')  indi.biography  = (indi.biography ?? '') + '\n' + val;
            break;
        }
      }
    }

    // ── FAM ──
    if (curType === 'FAM') {
      const fam = fams.get(curId)!;
      if (level === 1) {
        const xref = val.replace(/@/g, '');
        if (tag === 'HUSB')  fam.husbId = xref;
        if (tag === 'WIFE')  fam.wifeId = xref;
        if (tag === 'CHIL')  fam.children.push(xref);
      }
    }
  }

  // ── Tính đời dựa trên quan hệ cha/mẹ ─────────────────────────────────
  // Build parent map trước
  const fatherOf = new Map<string, string>();  // childId → fatherId
  const motherOf = new Map<string, string>();  // childId → motherId
  const spouseOf = new Map<string, string>();  // id → spouseId

  fams.forEach(fam => {
    const { husbId, wifeId, children } = fam;
    if (husbId && wifeId) {
      spouseOf.set(husbId, wifeId);
      spouseOf.set(wifeId, husbId);
    }
    children.forEach(childId => {
      if (husbId) fatherOf.set(childId, husbId);
      if (wifeId) motherOf.set(childId, wifeId);
    });
  });

  // BFS tính đời
  const genMap = new Map<string, number>();
  // Root = người không có cha/mẹ trong file
  const roots = [...indis.keys()].filter(id => !fatherOf.has(id) && !motherOf.has(id));
  roots.forEach(id => genMap.set(id, 1));

  const queue = [...roots];
  const visited = new Set<string>(roots);
  while (queue.length) {
    const parentId = queue.shift()!;
    const parentGen = genMap.get(parentId) ?? 1;
    indis.forEach((_, childId) => {
      if (visited.has(childId)) return;
      const fa = fatherOf.get(childId);
      const ma = motherOf.get(childId);
      if (fa === parentId || ma === parentId) {
        genMap.set(childId, parentGen + 1);
        visited.add(childId);
        queue.push(childId);
      }
    });
  }
  // Người chưa được gán đời → đời 1
  indis.forEach((_, id) => { if (!genMap.has(id)) genMap.set(id, 1); });

  // ── Build Member[] cuối cùng ──────────────────────────────────────────
  const result: Partial<Member>[] = [];

  indis.forEach((indi, xref) => {
    const member: Partial<Member> = {
      name:       indi.name,
      gender:     indi.gender,
      generation: indi.generation ?? (genMap.get(xref) ?? 1),
      fatherId:   fatherOf.get(xref) ?? null,
      motherId:   motherOf.get(xref) ?? null,
      spouseId:   spouseOf.get(xref) ?? null,
    };
    if (indi.birthDate)  member.birthDate  = indi.birthDate;
    if (indi.birthPlace) member.birthPlace = indi.birthPlace;
    if (indi.deathDate)  member.deathDate  = indi.deathDate;
    if (indi.deathPlace) member.deathPlace = indi.deathPlace;
    if (indi.nickname)   member.nickname   = indi.nickname;
    if (indi.chucTuoc)   member.chucTuoc   = indi.chucTuoc;
    if (indi.biography)  member.biography  = indi.biography;
    if (indi.photoUrl)   member.photoUrl   = indi.photoUrl;
    if (indi.memberType) member.memberType = indi.memberType as any;

    result.push(member);
  });

  return result;
}
