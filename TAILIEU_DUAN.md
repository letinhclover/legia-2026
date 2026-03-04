# 📋 Tài Liệu Dự Án — Gia Phả Dòng Họ Lê
> **Mục đích:** Tài liệu tham chiếu nhanh dành cho người quản trị.
> **Cập nhật lần cuối:** v2.3 — 2026

---

## 🌐 CÁC ĐƯỜNG LINK QUAN TRỌNG

| Dịch vụ | Link |
|---|---|
| 🌍 **Website** | https://legia-2026.pages.dev |
| 📦 **GitHub** | https://github.com/letinhbusiness/legia-2026 |
| 🔥 **Firebase** | https://console.firebase.google.com/project/legia-2026 |
| ☁️ **Cloudflare** | https://dash.cloudflare.com → Pages → legia-2026 |
| 🖼️ **Cloudinary** | https://cloudinary.com/console |

---

## 🔥 FIREBASE

### Thông tin dự án
| Trường | Giá trị |
|---|---|
| **Project ID** | `legia-2026` |
| **Auth Domain** | `legia-2026.firebaseapp.com` |
| **Storage Bucket** | `legia-2026.firebasestorage.app` |
| **Messaging Sender ID** | `825387632814` |

> ⚠️ API Key và App ID được lưu trong file `.env.local` (local) và trong
> Cloudflare Environment Variables (production). KHÔNG lưu trong source code.

### Truy cập Firebase Console
1. Mở https://console.firebase.google.com
2. Chọn project **legia-2026**

### Firestore (Database)
- **Collection chính:** `members` — mỗi document là 1 thành viên
- **Collection phụ:** `meta/stats` — đếm lượt xem

### Firebase Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /members/{doc} {
      allow read: if true;           // Ai cũng đọc được
      allow write: if request.auth != null; // Chỉ admin mới ghi
    }
    match /meta/{doc} {
      allow read: if true;
      allow write: if true;          // Visitor counter cần ghi không cần auth
    }
  }
}
```

### Firebase Auth
- **Phương thức:** Email / Password
- **Xem/thêm admin:** Firebase Console → Authentication → Users
- **Cấu hình trong app:** `src/App.tsx` → `SUPER_ADMIN_EMAILS` và `EDITOR_EMAILS`

---

## 📦 GITHUB — QUY TRÌNH CẬP NHẬT CODE

### Bước chuẩn
```
1. Nhận file .zip từ Claude → giải nén
2. Copy file vào đúng thư mục trong repo local
3. git add .
4. git commit -m "v2.3 — mô tả thay đổi"
5. git push origin main
6. Cloudflare tự build trong ~2 phút
7. Kiểm tra: mở web → tab Cài Đặt → tìm version mới
```

### Files thường xuyên thay đổi
| File | Khi nào cần thay |
|---|---|
| `src/tabs/TreeTab.tsx` | Thay đổi cây gia phả |
| `src/tabs/DirectoryTab.tsx` | Thay đổi danh sách |
| `src/components/FamilyNode.tsx` | Thay đổi card node |
| `src/components/MemberForm.tsx` | Thay đổi form thêm/sửa |
| `src/components/MemberBottomSheet.tsx` | Thay đổi chi tiết |
| `src/utils/pdfExport.ts` | Thay đổi xuất PDF |
| `src/App.tsx` | Thay đổi logic tổng thể |
| `src/index.css` | Thay đổi giao diện |

---

## ☁️ CLOUDFLARE PAGES

### Environment Variables (BẮT BUỘC)
Vào: dash.cloudflare.com → Pages → legia-2026 → Settings → Environment variables

| Tên biến | Giá trị (lấy từ Firebase Console) |
|---|---|
| `VITE_FIREBASE_API_KEY` | `AIzaSyCppn-nRQNDthcGiCY_l5Y4AnA6tdIDTMM` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `legia-2026.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `legia-2026` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `legia-2026.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `825387632814` |
| `VITE_FIREBASE_APP_ID` | `1:825387632814:web:f1a36148fd0e9359df053f` |

> Phải set cả **Production** và **Preview** environment.

### Build Settings
| Setting | Giá trị |
|---|---|
| Framework preset | None (Vite) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | `18` hoặc cao hơn |

---

## 🔔 HỆ THỐNG THÔNG BÁO

### Cách hoạt động
1. Khi app mở, tự tính sự kiện trong **7 ngày tới**
2. Hiển thị **banner màu** ngay dưới header
3. Tự động rotate nếu có nhiều sự kiện (4 giây/sự kiện)
4. Lần đầu mở app (có sự kiện), popup hỏi bật **Push Notification**
5. Nếu cho phép: gửi thông báo hệ thống vào **hôm có sự kiện**

### Dữ liệu cần có để thông báo hoạt động
- **Ngày giỗ**: trường `deathDate` (dương lịch), `deathDateLunar` (âm lịch — hiển thị thêm)
- **Sinh nhật**: trường `birthDate`, thành viên `deathDate` = rỗng (còn sống)

### Giới hạn của Web Push
- Push Notification chỉ hoạt động khi **app đang mở** hoặc **PWA đã cài**
- Trình duyệt Safari iOS **không hỗ trợ** Web Push Notification (chỉ có banner in-app)
- Android Chrome: hỗ trợ đầy đủ

---

## 📤 XUẤT DỮ LIỆU

### PDF
- **Logic sắp xếp mới (v2.3):** Mỗi đời nhóm theo cha mẹ → anh/chị trước em → vợ chồng đứng cạnh nhau
- Mỗi card có số thứ tự `#N` ở góc trên trái
- Ghi chú sắp xếp ở header PDF

### Excel
- Xuất toàn bộ fields của Member
- Có thể nhập lại bằng cách upload file Excel đã sửa

### GEDCOM
- Chuẩn quốc tế 5.5.5
- Tương thích: Ancestry, MyHeritage, Gramps, FamilyTreeMaker

---

## 🗂️ CẤU TRÚC DỮ LIỆU MEMBER

```typescript
{
  id: string,              // Tự sinh bởi Firestore
  name: string,            // Bắt buộc
  gender: 'Nam' | 'Nữ',   // Bắt buộc
  generation: number,      // Bắt buộc (1, 2, 3...)

  memberType: 'chinh'      // Mặc định — thành viên dòng họ chính
           | 'dau'         // Con dâu
           | 're'          // Con rể
           | 'chau_ngoai'  // Cháu ngoại
           | 'ngoai_toc',  // Ngoại tộc khác

  tenHuy: string,          // Tên húy
  nickname: string,        // Tên thường gọi
  chucTuoc: string,        // Chức tước

  birthDate: 'YYYY-MM-DD', // Ngày sinh dương lịch
  birthDateLunar: string,  // Ngày sinh âm lịch (VD: "15/7 Quý Mão")
  birthPlace: string,

  deathDate: 'YYYY-MM-DD', // Ngày mất dương lịch (để trống nếu còn sống)
  deathDateLunar: string,  // Ngày giỗ âm lịch
  deathPlace: string,

  burialAddress: string,   // Địa chỉ mộ phần
  burialMapLink: string,   // Link Google Maps
  burialLat: number,       // Tọa độ mộ
  burialLng: number,

  residence: string,       // Nơi cư trú

  fatherId: string,        // ID cha (Firestore document ID)
  motherId: string,        // ID mẹ
  spouseId: string,        // ID vợ/chồng

  photoUrl: string,        // URL Cloudinary
  biography: string,       // Tiểu sử

  createdAt: string        // ISO timestamp, tự sinh khi tạo mới
}
```

---

## 🧩 PHÂN TÍCH CHẤT LƯỢNG CODE (v2.3)

### Điểm mạnh
- TypeScript xuyên suốt, ít dùng `any`
- Design tokens nhất quán (CSS vars + theme objects)
- Framer Motion animation đồng bộ
- Phân quyền phân tầng rõ ràng
- PWA + offline cache tốt (Workbox)

### Điểm cần cải thiện (lộ trình tương lai)
| Vấn đề | Mức độ | Giải pháp đề xuất |
|---|---|---|
| `App.tsx` quá lớn (~450 dòng) | Trung bình | Tách `useMembers`, `useAuth` hooks |
| `darkMode` prop drilling sâu | Thấp | React Context |
| Magic numbers rải rác | Thấp | `constants/layout.ts` |
| Thiếu Error Boundary | Cao | Wrap TreeTab, DirectoryTab |
| Không có unit test | Cao | Vitest + React Testing Library |

---

## 🎨 ĐỀ XUẤT CẢI THIỆN UI/UX (Lộ trình)

### Ưu tiên cao
1. **Header quá chật** trên màn nhỏ → Chuyển dropdown đời vào floating chip bar trong TreeTab
2. **MemberForm 5 tabs** → Đổi sang long-scroll 1 trang (admin dễ thao tác hơn)
3. **Empty State TreeTab** → Màn hình hướng dẫn khi chưa có thành viên

### Ưu tiên trung bình
4. **Share card ảnh** → Xuất PNG đẹp để chia sẻ Zalo/Facebook (html2canvas)
5. **Navigation trong detail** → Nút ← → để duyệt qua các thành viên
6. **Badge vai vế dark mode** → Màu sắc badge bị nhạt trên nền tối (cần override)
7. **Tìm kiếm toàn cục** → Nút search trên header, tìm ở mọi tab

### Nice-to-have
8. **Dark mode tự động** → Đọc `prefers-color-scheme` làm mặc định
9. **Album ảnh** → Nhiều ảnh cho mỗi thành viên
10. **Lịch sử chỉnh sửa** → Activity log: ai sửa, sửa gì, khi nào

---

## 👨‍💻 LIÊN HỆ

**Lê Tỉnh** — Zalo: 0708312789

© Bản quyền thuộc về Dòng Họ Lê
