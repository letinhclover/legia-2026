# 🏛️ Gia Phả Dòng Họ Lê

> Ứng dụng gia phả số — lưu trữ, tra cứu và kết nối các thế hệ dòng họ Lê.
> Xây dựng như một **Progressive Web App (PWA)** — cài được trên điện thoại, dùng offline.

[![Version](https://img.shields.io/badge/version-v2.3-red)](https://legia-2026.pages.dev)
[![Live](https://img.shields.io/badge/live-legia--2026.pages.dev-green)](https://legia-2026.pages.dev)
[![Deploy](https://img.shields.io/badge/deploy-Cloudflare%20Pages-orange)](https://dash.cloudflare.com)

---

## 🌐 Truy cập

| Môi trường | URL |
|---|---|
| **Production** | https://legia-2026.pages.dev |
| **GitHub Repo** | https://github.com/letinhbusiness/legia-2026 |
| **Firebase Console** | https://console.firebase.google.com/project/legia-2026 |
| **Cloudflare** | https://dash.cloudflare.com → Pages → legia-2026 |

---

## ✨ Tính năng chính

| Tính năng | Mô tả |
|---|---|
| 🌳 **Cây gia phả** | Sơ đồ tương tác (ReactFlow), zoom/pan, focus huyết thống |
| 🔍 **Focus Mode** | Chạm 1 = highlight huyết thống, chạm 2 = mở chi tiết |
| 📋 **Danh sách** | Tìm kiếm, lọc đời/giới/trạng thái/vai vế |
| 📅 **Lịch sự kiện** | Ngày giỗ & sinh nhật, calendar tháng |
| 🔔 **Thông báo** | Banner in-app + Web Push cho ngày giỗ/sinh nhật |
| 👤 **Chi tiết** | Ảnh, tiểu sử, quan hệ gia đình, bản đồ mộ phần |
| ✏️ **Quản trị** | Thêm/sửa/xóa, phân quyền 2 cấp (Admin / Editor) |
| 📤 **Xuất dữ liệu** | PDF (sắp xếp theo gia đình), Excel, GEDCOM |
| 🔗 **Deeplink QR** | Quét QR → mở thẳng trang thành viên |
| 🌙 **Dark mode** | Chuyển sáng/tối, nhớ lựa chọn |
| 📱 **PWA** | Cài trên iOS/Android, dùng offline |

---

## 🛠️ Tech Stack

| Công nghệ | Dùng cho |
|---|---|
| React 18 + TypeScript + Vite | Frontend |
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| ReactFlow + dagre | Cây gia phả |
| Firebase Firestore + Auth | Database + Login |
| Cloudinary | Ảnh |
| Cloudflare Pages | Hosting + CI/CD |
| vite-plugin-pwa | PWA + Service Worker |

---

## 📁 Cấu trúc dự án

```
legia-2026/
├── .env.local          ← Firebase keys (KHÔNG commit)
├── .env.example        ← Mẫu .env.local
├── .gitignore
├── vite.config.ts
└── src/
    ├── App.tsx
    ├── types.ts
    ├── firebase.ts     ← Đọc từ .env.local
    ├── components/
    │   ├── NotificationBanner.tsx  ← MỚI: Banner ngày giỗ/sinh nhật
    │   ├── FamilyNode.tsx
    │   ├── MemberBottomSheet.tsx
    │   ├── MemberForm.tsx
    │   └── ...
    ├── tabs/
    │   ├── TreeTab.tsx
    │   ├── DirectoryTab.tsx
    │   ├── EventsTab.tsx
    │   └── SettingsTab.tsx
    └── utils/
        ├── notifications.ts  ← MỚI: Logic thông báo
        ├── pdfExport.ts      ← Cập nhật: sort theo gia đình
        ├── layout.ts
        └── ...
```

---

## 🚀 Deploy lên GitHub + Cloudflare

```bash
# 1. Commit và push
git add .
git commit -m "v2.3 — notifications, pdf fix, deeplink"
git push origin main

# 2. Cloudflare tự build trong ~2 phút
# Kiểm tra: dash.cloudflare.com → Pages → legia-2026
```

---

## ⚙️ Cài đặt local

```bash
git clone https://github.com/letinhbusiness/legia-2026.git
cd legia-2026
cp .env.example .env.local   # Điền Firebase keys vào .env.local
npm install
npm run dev                   # → http://localhost:5173
```

---

## 🔑 Cloudflare Environment Variables

Vào Cloudflare → Pages → legia-2026 → Settings → Environment variables:

```
VITE_FIREBASE_API_KEY         = AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN     = legia-2026.firebaseapp.com
VITE_FIREBASE_PROJECT_ID      = legia-2026
VITE_FIREBASE_STORAGE_BUCKET  = legia-2026.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID = 825387632814
VITE_FIREBASE_APP_ID          = 1:825387632814:web:...
```

> ⚠️ Bước này BẮT BUỘC sau khi đã chuyển sang biến môi trường.
> Nếu thiếu, Cloudflare build sẽ thành công nhưng app sẽ báo lỗi Firebase.

---

## 🔑 Phân quyền Admin

| Chức năng | Thành viên | Editor | Super Admin |
|---|---|---|---|
| Xem cây / danh sách / lịch | ✅ | ✅ | ✅ |
| Thêm / Sửa thành viên | ❌ | ✅ | ✅ |
| Xóa thành viên | ❌ | ❌ | ✅ |
| Xuất / Nhập dữ liệu | ❌ | ✅ | ✅ |

Cấu hình email trong `src/App.tsx`:
```typescript
const SUPER_ADMIN_EMAILS = ['letinhclover@gmail.com'];
const EDITOR_EMAILS      = ['quanlylegia2026@gmail.com'];
```

---

## 📅 Hệ thống thông báo

- **Banner in-app**: tự hiện khi mở app nếu có sự kiện trong 7 ngày tới
- **Push Notification**: app hỏi xin quyền lần đầu, sau đó nhắc tự động hàng ngày
- Hỗ trợ cả dương lịch và âm lịch
- Sự kiện: ngày giỗ (người đã mất) + sinh nhật (người còn sống)

---

## 📝 Lịch sử phiên bản

| Version | Nội dung chính |
|---|---|
| **v2.3** | Thông báo ngày giỗ/sinh nhật, PDF sort theo gia đình, fix deeplink QR, Firebase env config, fix double-tap |
| v2.2 | Focus Mode, Controls mới, MiniMap màu, Pull-to-refresh, Icons to hơn, nút Sửa/Phả hệ/Chi tiết |
| v16 | Clickable relatives, auto memberType |
| v14 | MemberType: dâu/rể/cháu ngoại |
| v11 | Dark mode, EventsTab calendar |
| v8 | PWA, MiniMap, bloodline highlight |

---

## 👨‍💻 Liên hệ

**Lê Tỉnh** — Zalo: [0708312789](https://zalo.me/0708312789)

© Bản quyền thuộc về Dòng Họ Lê
