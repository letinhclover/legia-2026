/**
 * GEDCOM 5.5.5 Export
 * Chuẩn phổ biến nhất cho phần mềm gia phả (Ancestry, MyHeritage, Gramps, FamilyTreeMaker…)
 *
 * Cấu trúc:
 *   0 HEAD
 *   0 @I1@ INDI  — mỗi cá nhân
 *   0 @F1@ FAM   — mỗi gia đình (cha + mẹ + con)
 *   0 TRLR
 */

import { Member } from '../types';

function escapeGedcom(s: string): string {
  return s.replace(/\r?\n/g, ' ').trim();
}

/** Chuyển "YYYY-MM-DD" → "DD MON YYYY" (GEDCOM date format) */
function toGedcomDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function exportGedcom(members: Member[]): string {
  const lines: string[] = [];

  // ── HEAD ────────────────────────────────────────────────────────────
  lines.push('0 HEAD');
  lines.push('1 SOUR GIA_PHA_LE');
  lines.push('2 NAME Gia Phả Dòng Họ Lê');
  lines.push('2 VERS 1.0');
  lines.push('1 FILE GiaPhaLe.ged');
  lines.push('1 GEDC');
  lines.push('2 VERS 5.5.5');
  lines.push('1 CHAR UTF-8');
  lines.push('1 LANG Vietnamese');
  lines.push(`1 DATE ${toGedcomDate(new Date().toISOString().slice(0, 10))}`);
  lines.push('0 @SUBM1@ SUBM');
  lines.push('1 NAME Le Tinh');
  lines.push('1 WWW https://legia-2026.pages.dev');

  const memberMap = new Map(members.map(m => [m.id, m]));

  // ── INDI records ─────────────────────────────────────────────────────
  members.forEach(m => {
    lines.push(`0 @I${m.id}@ INDI`);

    // Tên: NAME tag
    lines.push(`1 NAME ${escapeGedcom(m.name)}`);
    const parts = m.name.trim().split(' ');
    const surname  = parts[0] ?? '';
    const given    = parts.slice(1).join(' ');
    lines.push(`2 GIVN ${given}`);
    lines.push(`2 SURN ${surname}`);

    if (m.tenHuy) lines.push(`1 NAME ${escapeGedcom(m.tenHuy)}\n2 TYPE AKA`);

    // Giới tính
    lines.push(`1 SEX ${m.gender === 'Nam' ? 'M' : 'F'}`);

    // Ngày sinh
    if (m.birthDate) {
      lines.push('1 BIRT');
      lines.push(`2 DATE ${toGedcomDate(m.birthDate)}`);
      if (m.birthPlace) lines.push(`2 PLAC ${escapeGedcom(m.birthPlace)}`);
    }
    if (m.birthDateLunar) {
      lines.push(`1 NOTE Ngày sinh âm lịch: ${escapeGedcom(m.birthDateLunar)}`);
    }

    // Ngày mất
    if (m.deathDate) {
      lines.push('1 DEAT');
      lines.push(`2 DATE ${toGedcomDate(m.deathDate)}`);
      if (m.deathPlace) lines.push(`2 PLAC ${escapeGedcom(m.deathPlace)}`);
    }
    if (m.deathDateLunar) {
      lines.push(`1 NOTE Ngày mất âm lịch: ${escapeGedcom(m.deathDateLunar)}`);
    }

    // Nơi an táng
    if (m.burialAddress || m.burialPlace) {
      lines.push('1 BURI');
      lines.push(`2 PLAC ${escapeGedcom(m.burialAddress ?? m.burialPlace ?? '')}`);
      if (m.burialMapLink) lines.push(`2 MAP\n3 NOTE ${m.burialMapLink}`);
    }

    // Nơi cư trú
    if (m.residence) {
      lines.push('1 RESI');
      lines.push(`2 PLAC ${escapeGedcom(m.residence)}`);
    }

    // Chức tước / tước vị
    if (m.chucTuoc) {
      lines.push(`1 TITL ${escapeGedcom(m.chucTuoc)}`);
    }

    // Tên tự / tên thụy
    if (m.tenTu)    lines.push(`1 NOTE Tên tự: ${escapeGedcom(m.tenTu)}`);
    if (m.tenThuy)  lines.push(`1 NOTE Tên thụy: ${escapeGedcom(m.tenThuy)}`);

    // Tiểu sử
    if (m.biography) {
      lines.push(`1 NOTE ${escapeGedcom(m.biography)}`);
    }

    // Ảnh (URL Cloudinary)
    if (m.photoUrl) {
      lines.push('1 OBJE');
      lines.push(`2 FILE ${m.photoUrl}`);
      lines.push('2 FORM URL');
    }

    // Thế hệ (custom tag _GEN — non-standard nhưng nhiều app hỗ trợ)
    lines.push(`1 _GEN ${m.generation}`);

    // Family linkage — sẽ thêm @F@ refs bên dưới
  });

  // ── FAM records ───────────────────────────────────────────────────────
  // Mỗi cặp vợ chồng = 1 FAM record
  // Con được list trong FAM của cha (hoặc mẹ nếu không có cha)
  const processedFams = new Set<string>();
  const famIds: { famId: string; husbId?: string; wifeId?: string; childIds: string[] }[] = [];

  members.forEach(m => {
    // Tạo FAM từ góc nhìn của người cha
    if (m.gender === 'Nam' || !m.fatherId) {
      const famKey = m.spouseId
        ? [m.id, m.spouseId].sort().join('|')
        : `single_${m.id}`;

      if (!processedFams.has(famKey)) {
        processedFams.add(famKey);
        const spouse = m.spouseId ? memberMap.get(m.spouseId) : null;
        const husbId = m.gender === 'Nam' ? m.id : spouse?.id;
        const wifeId = m.gender === 'Nam' ? spouse?.id : m.id;
        const children = members.filter(c =>
          c.fatherId === (husbId ?? '') || c.motherId === (wifeId ?? '') ||
          (husbId && c.fatherId === husbId)
        );
        famIds.push({
          famId: famKey,
          husbId,
          wifeId,
          childIds: children.map(c => c.id),
        });
      }
    }
  });

  famIds.forEach(({ famId, husbId, wifeId, childIds }, idx) => {
    const fTag = `F${idx + 1}`;
    lines.push(`0 @${fTag}@ FAM`);
    if (husbId) lines.push(`1 HUSB @I${husbId}@`);
    if (wifeId) lines.push(`1 WIFE @I${wifeId}@`);
    childIds.forEach(cid => lines.push(`1 CHIL @I${cid}@`));
    lines.push('1 _TYPE Nuclear');
  });

  // Thêm FAMC / FAMS references vào INDI
  // Cần insert vào đúng vị trí — ta làm pass 2 bằng cách append vào cuối mỗi INDI block
  // GEDCOM cho phép FAMS/FAMC ở cuối INDI
  const indiLines: string[] = [];
  let curIndi: string | null = null;
  const indiExtras = new Map<string, string[]>();

  famIds.forEach(({ famId, husbId, wifeId, childIds }, idx) => {
    const fTag = `F${idx + 1}`;
    if (husbId) {
      if (!indiExtras.has(husbId)) indiExtras.set(husbId, []);
      indiExtras.get(husbId)!.push(`1 FAMS @${fTag}@`);
    }
    if (wifeId) {
      if (!indiExtras.has(wifeId)) indiExtras.set(wifeId, []);
      indiExtras.get(wifeId)!.push(`1 FAMS @${fTag}@`);
    }
    childIds.forEach(cid => {
      if (!indiExtras.has(cid)) indiExtras.set(cid, []);
      indiExtras.get(cid)!.push(`1 FAMC @${fTag}@`);
    });
  });

  // Rebuild lines với extras
  const finalLines: string[] = [];
  let inIndi = false;
  let curIndiId: string | null = null;

  for (const line of lines) {
    if (line.startsWith('0 @I') && line.includes('@ INDI')) {
      // Flush extras của INDI trước
      if (curIndiId && indiExtras.has(curIndiId)) {
        indiExtras.get(curIndiId)!.forEach(l => finalLines.push(l));
      }
      inIndi = true;
      curIndiId = line.match(/@I([^@]+)@/)?.[1] ?? null;
      finalLines.push(line);
    } else if (line.startsWith('0 @F') || line === '0 HEAD' || line === '0 TRLR') {
      if (inIndi && curIndiId && indiExtras.has(curIndiId)) {
        indiExtras.get(curIndiId)!.forEach(l => finalLines.push(l));
        inIndi = false; curIndiId = null;
      }
      finalLines.push(line);
    } else {
      finalLines.push(line);
    }
  }

  // Flush last INDI
  if (inIndi && curIndiId && indiExtras.has(curIndiId)) {
    indiExtras.get(curIndiId)!.forEach(l => finalLines.push(l));
  }

  finalLines.push('0 TRLR');
  return finalLines.join('\n');
}

export function downloadGedcom(members: Member[]): void {
  const content = exportGedcom(members);
  const blob    = new Blob([content], { type: 'text/x-gedcom;charset=utf-8' });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement('a');
  a.href        = url;
  a.download    = `GiaPhaLe_${new Date().toISOString().slice(0, 10)}.ged`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
