export interface Member {
  id: string;
  name: string;
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
  // Mộ phần — tách thành 2 trường rõ ràng
  burialAddress?: string;       // Địa chỉ văn bản
  burialMapLink?: string;       // Link Google Maps
  /** @deprecated Dùng burialAddress thay thế */
  burialPlace?: string;         // giữ lại để không mất dữ liệu cũ
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
