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
  tenTu?: string;
  tenThuy?: string;
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

export const MEMBER_TYPE_COLOR: Record<string, { bg: string; text: string }> = {
  chinh:      { bg: '#FEF2F2', text: '#991B1B' },
  dau:        { bg: '#FDF4FF', text: '#7E22CE' },
  re:         { bg: '#EFF6FF', text: '#1D4ED8' },
  chau_ngoai: { bg: '#F0FDF4', text: '#15803D' },
  ngoai_toc:  { bg: '#FFFBEB', text: '#92400E' },
};
