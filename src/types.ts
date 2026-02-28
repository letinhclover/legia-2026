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
  burialPlace?: string;
  burialLat?: number | null;   // tọa độ GPS mộ phần
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
