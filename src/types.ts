export interface Member {
  id: string;
  // Thông tin cơ bản
  name: string;
  tenHuy: string;
  tenTu: string;
  tenThuy: string;
  chucTuoc: string;
  gender: 'Nam' | 'Nữ';
  generation: number;

  // Ngày sinh
  birthDate: string;
  birthDateLunar: string;
  birthPlace: string;

  // Ngày mất
  deathDate: string;
  deathDateLunar: string;
  deathPlace: string;
  burialPlace: string;

  // Nơi cư trú
  residence: string;

  // Quan hệ
  fatherId: string | null;
  motherId: string | null;
  spouseId: string | null;

  // Ảnh & tiểu sử
  photoUrl: string;
  biography: string;

  // Email nhận thông báo
  email: string;

  createdAt?: string;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}
