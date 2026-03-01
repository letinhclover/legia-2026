# 🏛️ Gia Phả Dòng Họ Lê

> Ứng dụng gia phả số — lưu trữ, tra cứu và kết nối các thế hệ dòng họ Lê.

[![Version](https://img.shields.io/badge/version-v16-red)](https://legia-2026.pages.dev)
[![Live](https://img.shields.io/badge/live-legia--2026.pages.dev-green)](https://legia-2026.pages.dev)
[![Deploy](https://img.shields.io/badge/deploy-Cloudflare%20Pages-orange)](https://dash.cloudflare.com)

---

## 🌐 Truy cập

| Môi trường | URL |
|---|---|
| **Production** | https://legia-2026.pages.dev |
| **GitHub Repo** | https://github.com/[your-username]/giaPha |
| **Firebase Console** | https://console.firebase.google.com/project/[project-id] |
| **Cloudinary** | https://cloudinary.com/console |
| **Cloudflare Dashboard** | https://dash.cloudflare.com |

---

## 🛠️ Tech Stack

| Công nghệ | Dùng cho | Ghi chú |
|---|---|---|
| **React + TypeScript + Vite** | Frontend framework | Node.js ≥ 18 |
| **Tailwind CSS** | Styling | CDN, không cần build step riêng |
| **Framer Motion** | Animations | BottomSheet, transitions |
| **ReactFlow** | Cây phả hệ (sơ đồ) | dagre layout |
| **Firebase Firestore** | Cơ sở dữ liệu realtime | NoSQL |
| **Firebase Auth** | Đăng nhập Admin | Email/Password |
| **Cloudinary** | Lưu trữ & tối ưu ảnh | Auto-compress upload |
| **Cloudflare Pages** | Hosting & CDN | Free tier, CI/CD tự động |
| **GitHub** | Source code & deploy trigger | Push → auto-build |

---

## 📁 Cấu trúc dự án

```
src/
├── App.tsx                    # Root component, state management
├── types.ts                   # TypeScript types (Member, MemberType…)
│
├── components/
│   ├── BottomSheet.tsx        # Sheet trượt lên từ dưới (scroll container)
│   ├── MemberBottomSheet.tsx  # Chi tiết thành viên (flat, no nested scroll)
│   ├── MemberForm.tsx         # Form thêm/sửa thành viên (5 tabs)
│   ├── MemberDetail.tsx       # Trang chi tiết đầy đủ
│   ├── FamilyNode.tsx         # Node trong cây phả hệ
│   ├── MemorialPage.tsx       # Trang tưởng nhớ người đã mất
│   └── BottomNav.tsx          # Thanh điều hướng dưới cùng
│
├── tabs/
│   ├── TreeTab.tsx            # Tab cây phả hệ (ReactFlow)
│   ├── DirectoryTab.tsx       # Tab danh sách thành viên + bộ lọc
│   ├── EventsTab.tsx          # Tab lịch sự kiện (giỗ, sinh nhật)
│   └── SettingsTab.tsx        # Tab cài đặt + xuất nhập dữ liệu
│
├── utils/
│   ├── layout.ts              # Tính toán layout cây (dagre + post-process)
│   ├── gedcom.ts              # Xuất GEDCOM 5.5.5
│   ├── excelIO.ts             # Xuất/Nhập Excel
│   ├── pdfExport.ts           # Xuất PDF in ấn
│   ├── imageCompress.ts       # Nén ảnh trước upload
│   └── lunarCalendar.ts       # Chuyển đổi dương/âm lịch
│
└── firebase.ts                # Cấu hình Firebase
```

---

## 🗂️ Dữ liệu — Member type

```typescript
interface Member {
  id: string;              // Firebase document ID
  name: string;            // Họ và tên đầy đủ
  memberType?: MemberType; // Vai vế: chinh|dau|re|chau_ngoai|ngoai_toc
  tenHuy?: string;         // Tên ghi trong gia phả / bia mộ
  nickname?: string;       // Tên thường gọi, biệt danh
  chucTuoc?: string;       // Chức tước, tước vị
  gender: 'Nam' | 'Nữ';
  generation: number;      // Đời thứ (1, 2, 3…)
  birthDate?: string;      // ISO: "YYYY-MM-DD"
  birthDateLunar?: string; // VD: "15/7 Quý Mão"
  deathDate?: string;      // ISO: "YYYY-MM-DD"
  deathDateLunar?: string; // Ngày giỗ âm lịch
  birthPlace?: string;
  deathPlace?: string;
  residence?: string;
  burialAddress?: string;
  burialMapLink?: string;  // Link Google Maps
  fatherId?: string;       // ID cha trong Firebase
  motherId?: string;       // ID mẹ
  spouseId?: string;       // ID vợ/chồng
  photoUrl?: string;       // URL Cloudinary
  biography?: string;
}
```

### Vai vế tự động (auto-resolve)

| Loại | Quy tắc tự động |
|---|---|
| 🔴 **Chính tộc** | Mặc định, mang họ Lê |
| 💍 **Con dâu** | Nữ, spouseId → thành viên chính tộc Nam |
| 🤝 **Con rể** | Nam, spouseId → thành viên chính tộc Nữ |
| 👶 **Cháu ngoại** | Mẹ là chính tộc, cha là rể/ngoại tộc |
| 🔗 **Ngoại tộc** | Gán thủ công |

---

## 🚀 Cách deploy / cập nhật code

### 1. Chỉnh sửa code
- Nhận file `.zip` từ Claude → giải nén
- Copy vào đúng thư mục trong dự án GitHub

### 2. Upload lên GitHub
```bash
git add .
git commit -m "v16 — fix scroll, memberType auto, ..."
git push origin main
```

### 3. Cloudflare tự động build
- Sau push, Cloudflare Pages **tự động detect** và build trong ~2 phút
- Kiểm tra: https://dash.cloudflare.com → Pages → giaPha → Deployments
- Xác nhận version mới: mở https://legia-2026.pages.dev → tab **Quản Trị** → tìm chuỗi "v16"

### 4. Nếu Cloudflare không tự build
- Vào Cloudflare → Pages → Settings → Builds & Deployments → Retry

---

## 🔑 Phân quyền Admin

| Chức năng | Thành viên | Admin |
|---|---|---|
| Xem cây phả hệ | ✅ | ✅ |
| Xem danh sách | ✅ | ✅ |
| Xem lịch sự kiện | ✅ | ✅ |
| Xem chi tiết thành viên | ✅ | ✅ |
| Thêm / Sửa / Xóa thành viên | ❌ | ✅ |
| Xuất Excel | ❌ (mờ) | ✅ |
| Nhập Excel | ❌ | ✅ |
| Xuất PDF | ❌ (mờ) | ✅ |
| Xuất GEDCOM | ❌ (mờ) | ✅ |

Admin login: tab **Quản Trị** → nhập email + password Firebase.

---

## 📤 Xuất dữ liệu

| Format | Dùng cho | Ghi chú |
|---|---|---|
| **Excel (.xlsx)** | Sao lưu, chỉnh sửa hàng loạt, nhập lại | Có thể import ngược lại |
| **PDF** | In ấn, họp dòng họ | Khổ A3/A4 ngang |
| **GEDCOM (.ged)** | Chuyển sang app gia phả khác | Chuẩn quốc tế 5.5.5 — tương thích Ancestry, MyHeritage, Gramps, FamilyTreeMaker |

---

## 📅 Lịch sự kiện

- **Ngày giỗ**: tính từ `deathDateLunar` (âm lịch), hiển thị "Giỗ lần thứ N"
- **Sinh nhật**: tính từ `birthDate`, hiển thị "Sinh nhật lần thứ N"
- **Hưởng thọ/dương**: ≥ 70 tuổi = hưởng thọ, < 70 = hưởng dương
- Sự kiện trong **60 ngày tới** hiển thị trên trang Lịch

---

## 🔧 Cài đặt local (phát triển)

```bash
# Clone repo
git clone https://github.com/[your-username]/giaPha.git
cd giaPha

# Cài dependencies
npm install

# Chạy dev server
npm run dev
# → mở http://localhost:5173

# Build production
npm run build
```

---

## 📝 Lịch sử phiên bản

| Version | Nội dung chính |
|---|---|
| v8 | Stitch redesign, MiniMap, bloodline highlight, PWA |
| v9 | Sibling ordering fix (dagre post-process) |
| v10 | BottomSheet scroll fix, DirectoryTab crash fix |
| v11 | FamilyNode redesign, dark mode, EventsTab calendar |
| v12 | GEDCOM export, SettingsTab footer redesign |
| v13 | BottomSheet scroll fix (nested context), "Người đã mất" |
| v14 | MemberType (dâu/rể/cháu ngoại), DirectoryTab filter |
| v15 | Nút Lưu sticky, con cái clickable, xóa email field |
| v16 | Cha/mẹ/vợ/chồng clickable, auto memberType, tab layout |

---

## 👨‍💻 Liên hệ phát triển

**Lê Tỉnh** — Zalo: [0708312789](https://zalo.me/0708312789)

© Bản quyền thuộc về Dòng Họ Lê
