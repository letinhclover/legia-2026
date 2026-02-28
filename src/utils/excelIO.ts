// Xuất/Nhập dữ liệu gia phả qua Excel
// Dùng SheetJS (xlsx) — không cần cài thêm gói nặng
import { Member } from '../types';

// ─── Cột trong file Excel ──────────────────────────────────────────────────
const COLUMNS = [
  { key: 'id',              label: 'ID (Không sửa)' },
  { key: 'name',            label: 'Họ và tên *' },
  { key: 'tenHuy',          label: 'Tên Húy' },
  { key: 'tenTu',           label: 'Tự' },
  { key: 'tenThuy',         label: 'Thụy' },
  { key: 'chucTuoc',        label: 'Chức tước' },
  { key: 'gender',          label: 'Giới tính (Nam/Nữ) *' },
  { key: 'generation',      label: 'Đời thứ *' },
  { key: 'birthDate',       label: 'Ngày sinh (YYYY-MM-DD)' },
  { key: 'birthDateLunar',  label: 'Ngày sinh Âm lịch' },
  { key: 'birthPlace',      label: 'Nơi sinh' },
  { key: 'deathDate',       label: 'Ngày mất (YYYY-MM-DD)' },
  { key: 'deathDateLunar',  label: 'Ngày giỗ Âm lịch' },
  { key: 'deathPlace',      label: 'Nơi mất' },
  { key: 'burialPlace',     label: 'Nơi chôn cất / Mộ phần' },
  { key: 'burialLat',       label: 'Vĩ độ mộ (latitude)' },
  { key: 'burialLng',       label: 'Kinh độ mộ (longitude)' },
  { key: 'residence',       label: 'Nơi cư trú' },
  { key: 'fatherId',        label: 'ID Cha' },
  { key: 'motherId',        label: 'ID Mẹ' },
  { key: 'spouseId',        label: 'ID Vợ/Chồng' },
  { key: 'photoUrl',        label: 'Link ảnh' },
  { key: 'email',           label: 'Email nhận thông báo' },
  { key: 'biography',       label: 'Tiểu sử' },
];

// ─── Load SheetJS động ────────────────────────────────────────────────────
async function loadXLSX() {
  if ((window as any).XLSX) return (window as any).XLSX;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js';
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return (window as any).XLSX;
}

// ─── XUẤT Excel ───────────────────────────────────────────────────────────
export async function exportToExcel(members: Member[]): Promise<void> {
  const XLSX = await loadXLSX();

  // Header row
  const header = COLUMNS.map(c => c.label);

  // Data rows
  const rows = members
    .sort((a, b) => a.generation - b.generation || a.name.localeCompare(b.name))
    .map(m => COLUMNS.map(c => (m as any)[c.key] ?? ''));

  // Worksheet
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);

  // Định dạng cột rộng hơn
  ws['!cols'] = COLUMNS.map((c, i) => ({
    wch: i === 0 ? 24 : i === COLUMNS.length - 1 ? 50 : 20,
  }));

  // Freeze header row
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };

  // Workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Gia Phả');

  // Sheet hướng dẫn
  const guide = [
    ['HƯỚNG DẪN SỬ DỤNG FILE EXCEL GIA PHẢ'],
    [''],
    ['1. XUẤT: File này là bản sao lưu toàn bộ dữ liệu gia phả'],
    ['2. SỬA: Có thể sửa trực tiếp các ô (trừ cột ID)'],
    ['3. THÊM MỚI: Thêm hàng mới — để trống cột ID (hệ thống tự tạo)'],
    ['4. NHẬP LẠI: Vào app → Tab Quản Trị → Nhập Excel → chọn file này'],
    [''],
    ['LƯU Ý QUAN TRỌNG:'],
    ['- Cột ID: KHÔNG được sửa — dùng để nhận dạng quan hệ'],
    ['- Ngày tháng: Định dạng YYYY-MM-DD (VD: 1945-08-19)'],
    ['- Giới tính: Chỉ nhập "Nam" hoặc "Nữ"'],
    ['- ID Cha/Mẹ/Vợ-Chồng: Copy từ cột ID tương ứng'],
    ['- Vĩ độ/Kinh độ mộ: Lấy từ Google Maps (bấm chuột phải vào bản đồ)'],
  ];
  const wsGuide = XLSX.utils.aoa_to_sheet(guide);
  wsGuide['!cols'] = [{ wch: 70 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Hướng Dẫn');

  // Tên file có ngày
  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `GiaPha_HoLe_${today}.xlsx`);
}

// ─── NHẬP Excel ───────────────────────────────────────────────────────────
export async function importFromExcel(file: File): Promise<Partial<Member>[]> {
  const XLSX = await loadXLSX();

  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });

  // Đọc sheet đầu tiên (Gia Phả)
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  if (raw.length < 2) throw new Error('File Excel không có dữ liệu');

  // Map header label → key
  const headerRow = raw[0] as string[];
  const colMap = new Map<number, string>();
  headerRow.forEach((label, i) => {
    const col = COLUMNS.find(c => c.label === label);
    if (col) colMap.set(i, col.key);
  });

  if (colMap.size === 0) throw new Error('File Excel không đúng định dạng — hãy dùng file xuất từ app');

  // Parse từng hàng
  const members: Partial<Member>[] = [];
  for (let r = 1; r < raw.length; r++) {
    const row = raw[r] as any[];
    const name = row[headerRow.indexOf(COLUMNS.find(c => c.key === 'name')!.label)];
    if (!name || !String(name).trim()) continue; // bỏ hàng trống

    const member: any = {};
    colMap.forEach((key, colIdx) => {
      let val = row[colIdx];
      if (val === null || val === undefined || val === '') {
        member[key] = null;
        return;
      }
      val = String(val).trim();
      if (key === 'generation') member[key] = parseInt(val) || 1;
      else if (key === 'burialLat' || key === 'burialLng') member[key] = parseFloat(val) || null;
      else member[key] = val || null;
    });

    members.push(member);
  }

  return members;
}
