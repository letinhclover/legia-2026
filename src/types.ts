/**
 * memberType — phân loại mối quan hệ trong dòng họ
 *
 *  chinh      : thành viên chính, mang họ Lê hoặc con ruột dòng họ
 *  dau        : con dâu — vợ của con trai Lê (ngoại tộc kết hôn vào)
 *  re         : con rể — chồng của con gái Lê (ngoại tộc kết hôn vào)
 *  chau_ngoai : cháu ngoại — con của con gái Lê (mang họ cha/rể)
 *  ngoai_toc  : người ngoại tộc khác (ông bà ngoại, họ hàng bên vợ/chồng...)
 *
 * Mặc định (undefined / 'chinh'): thành viên chính dòng họ Lê
 */
export type MemberType = 'chinh' | 'dau' | 're' | 'chau_ngoai' | 'ngoai_toc';

export interface Member {
  id: string;
  name: string;
  memberType?: MemberType;   // phân loại quan hệ dòng họ — mặc định 'chinh'
  tenHuy?: string;
  tenTu?: string;   // giữ để không mất dữ liệu cũ
  tenThuy?: string; // giữ để không mất dữ liệu cũ
  nickname?: string; // tên thường gọi / biệt danh
  chucTuoc?: string;
  gender: 'Nam' | 'Nữ';
  generation: number;
  birthDate?: string;
  birthDateLunar?: string;
  birthPlace?: string;
  deathDate?: string;
  deathDateLunar?: string;
  deathPlace?: string;
  burialAddress?: string;
  burialMapLink?: string;
  /** @deprecated dùng burialAddress */
  burialPlace?: string;
  burialLat?: number | null;
  burialLng?: number | null;
  residence?: string;
  fatherId?: string | null;
  motherId?: string | null;
  spouseId?: string | null;
  photoUrl?: string;
  biography?: string;
  email?: string;
  createdAt?: string;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

// ── Label & màu cho từng loại thành viên ─────────────────────────────────
export const MEMBER_TYPE_LABEL: Record<string, string> = {
  chinh:      '🔴 Chính tộc',
  dau:        '💍 Con dâu',
  re:         '🤝 Con rể',
  chau_ngoai: '👶 Cháu ngoại',
  ngoai_toc:  '🔗 Ngoại tộc',
};

export const MEMBER_TYPE_COLOR: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  chinh:      { bg: '#FEF2F2', text: '#991B1B', darkBg: '#3b0a0a', darkText: '#FCA5A5' },
  dau:        { bg: '#FDF4FF', text: '#7E22CE', darkBg: '#2e0a40', darkText: '#D8B4FE' },
  re:         { bg: '#EFF6FF', text: '#1D4ED8', darkBg: '#0d1f3c', darkText: '#93C5FD' },
  chau_ngoai: { bg: '#F0FDF4', text: '#15803D', darkBg: '#0a2e1a', darkText: '#6EE7B7' },
  ngoai_toc:  { bg: '#FFFBEB', text: '#92400E', darkBg: '#2a1f08', darkText: '#FCD34D' },
};

// Helper để lấy màu đúng theo theme
export function getMemberTypeColor(type: string, darkMode: boolean): { bg: string; text: string } {
  const c = MEMBER_TYPE_COLOR[type] ?? MEMBER_TYPE_COLOR['chinh'];
  return darkMode
    ? { bg: c.darkBg, text: c.darkText }
    : { bg: c.bg,     text: c.text };
}
