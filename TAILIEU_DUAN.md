# 📋 Tài Liệu Dự Án — Gia Phả Dòng Họ Lê
> **Mục đích:** Tài liệu tham chiếu nhanh. Khi quên, mở file này ra là nhớ ngay mọi thứ.
> **Cập nhật lần cuối:** v16 — 2026

---

## 🌐 CÁC ĐƯỜNG LINK QUAN TRỌNG

| Dịch vụ | Link | Ghi chú |
|---|---|---|
| 🌍 **Website chính** | https://legia-2026.pages.dev | Mở trên điện thoại, máy tính |
| 📦 **GitHub (code)** | https://github.com/letinhbusiness/legia-2026 | Nơi lưu toàn bộ source code |
| 🔥 **Firebase Console** | https://console.firebase.google.com/project/legia-2026 | Quản lý DB + Auth |
| ☁️ **Cloudflare Pages** | https://dash.cloudflare.com → Pages → legia-2026 | Quản lý deploy, domain |
| 🖼️ **Cloudinary** | https://cloudinary.com/console | Quản lý ảnh đại diện |

---

## 🔥 FIREBASE

### Thông tin dự án
| Trường | Giá trị |
|---|---|
| **Project ID** | `legia-2026` |
| **Auth Domain** | `legia-2026.firebaseapp.com` |
| **Storage Bucket** | `legia-2026.firebasestorage.app` |
| **API Key** | `AIzaSyCppn-nRQNDthcGiCY_l5Y4AnA6tdIDTMM` |
| **App ID** | `1:825387632814:web:f1a36148fd0e9359df053f` |

### Truy cập Firebase Console
1. Mở https://console.firebase.google.com
2. Chọn project **legia-2026**

### Firestore (Cơ sở dữ liệu)
- **Collection chính:** `members` — mỗi document là 1 thành viên
- **Xem/sửa dữ liệu trực tiếp:** Firebase Console → Firestore Database → Collection `members`
- **Backup thủ công:** Settings → Xuất Excel (trong app) hoặc Firebase Console → Export

### Firebase Auth (Đăng nhập Admin)
- **Phương thức:** Email/Password
- **Xem danh sách admin:** Firebase Console → Authentication → Users
- **Thêm admin mới:** Firebase Console → Authentication → Add user
- **Cấu hình admin trong app:** File `src/App.tsx` → tìm `adminEmails` array

### Firebase Rules (Bảo mật)
```
// Firestore rules — ai cũng đọc được, chỉ auth user mới ghi
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /members/{doc} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 📦 GITHUB

### Repo
- **URL:** https://github.com/letinhbusiness/legia-2026
- **Branch chính:** `main`

### Quy trình cập nhật code
```
1. Nhận file .zip từ Claude → giải nén
2. Copy file vào đúng thư mục trong repo:
   - src/components/   → components
   - src/tabs/         → tabs
   - src/utils/        → utilities
   - src/              → types.ts, App.tsx…
3. Commit và push:
   git add .
   git commit -m "v16 — mô tả thay đổi"
   git push origin main
4. Cloudflare tự động build trong ~2 phút
5. Kiểm tra: mở web → Quản Trị → tìm "v16"
```

### Cấu trúc thư mục GitHub
```
legia-2026/
├── src/
│   ├── App.tsx              ← Root, state, routing
│   ├── types.ts             ← TypeScript interfaces
│   ├── firebase.ts          ← Firebase config
│   ├── components/          ← UI components
│   ├── tabs/                ← 4 tabs chính
│   └── utils/               ← Helpers (excel, pdf, gedcom, lunar…)
├── public/
│   ├── icon-192.svg         ← App icon (PWA)
│   └── icon-512.svg
├── index.html
├── package.json
├── vite.config.ts           ← Build config + PWA settings
└── tailwind.config.js
```

---

## ☁️ CLOUDFLARE PAGES

### Thông tin
- **Project name:** `legia-2026`
- **Domain:** `legia-2026.pages.dev`
- **Framework preset:** Vite
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Node version:** 18+

### Kết nối GitHub → Cloudflare (đã cài sẵn)
- Mỗi khi push lên `main` → Cloudflare **tự động build và deploy**
- Thời gian build: ~1–2 phút

### Xem lịch sử deploy
1. Mở https://dash.cloudflare.com
2. Chọn account → **Pages** → **legia-2026**
3. Tab **Deployments** → xem tất cả lần build

### Nếu build thất bại
1. Vào deployment → xem **Build logs**
2. Lỗi thường gặp:
   - TypeScript error → sửa code theo thông báo
   - Missing dependency → thêm vào `package.json`
3. Sau khi sửa → push lại → Cloudflare tự build lại

### Kiểm tra phiên bản đang chạy
- Mở https://legia-2026.pages.dev → tab **Quản Trị** (Settings)
- Tìm dòng "v16 — Phiên bản chính thức"
- Nếu còn hiện v12/v14 → Cloudflare chưa build xong, đợi thêm

---

## 🖼️ CLOUDINARY (Lưu trữ ảnh)

### Thông tin
| Trường | Giá trị |
|---|---|
| **Cloud name** | `dedz5a7xl` |
| **Upload preset** | `giaPha_photos` |
| **Upload URL** | `https://api.cloudinary.com/v1_1/dedz5a7xl/image/upload` |

### Truy cập
1. Mở https://cloudinary.com
2. Đăng nhập → **Media Library** → xem tất cả ảnh đã upload

### Cách hoạt động
- Khi admin upload ảnh trong app → ảnh được **nén tự động** rồi gửi lên Cloudinary
- URL ảnh được lưu vào Firebase field `photoUrl`
- Giới hạn free tier: 25GB storage, 25GB bandwidth/tháng

### Upload preset settings
- Vào Cloudinary → Settings → **Upload presets** → `giaPha_photos`
- Signing mode: **Unsigned** (không cần API secret ở frontend)

---

## 🛠️ TECH STACK CHI TIẾT

```
Frontend
├── React 18 + TypeScript        framework chính
├── Vite                         build tool (nhanh hơn CRA)
├── Tailwind CSS                 styling utility-first
├── Framer Motion 11             animations (BottomSheet, transitions)
├── ReactFlow 11                 cây phả hệ (sơ đồ nodes + edges)
├── dagre                        tính toán layout cây tự động
└── lucide-react                 icon library

Backend / Cloud
├── Firebase Firestore           database NoSQL realtime
├── Firebase Auth                xác thực admin
├── Cloudinary                   lưu ảnh + auto-compress
└── Cloudflare Pages             hosting, CDN, CI/CD

Export
├── GEDCOM 5.5.5                 chuẩn gia phả quốc tế
├── Excel (xlsx)                 sao lưu + nhập lại
└── PDF                          in ấn họp dòng họ

PWA (Progressive Web App)
├── vite-plugin-pwa              tự động tạo Service Worker
├── Workbox                      cache strategy
├── autoUpdate                   SW tự cập nhật, không hỏi user
└── standalone display           cài lên homescreen như native app
```

---

## 📱 TÍNH NĂNG HIỆN CÓ (v16)

### Tab Cây Phả Hệ (TreeTab)
- Sơ đồ phả hệ tự động layout (dagre)
- Kéo, zoom, thu phóng
- Highlight huyết thống khi chọn thành viên
- Mini-map góc phải
- Nút + thêm thành viên (admin)
- Chế độ tối/sáng

### Tab Danh Sách (DirectoryTab)
- Tìm kiếm theo tên, tên húy
- Lọc: đời thứ, giới tính, trạng thái sống/mất, **vai vế**
- Bộ lọc vai vế: Chính tộc / Con dâu / Con rể / Cháu ngoại / Ngoại tộc
- Badge vai vế trên mỗi card

### Tab Lịch Sự Kiện (EventsTab)
- Lịch tháng hiển thị dot sự kiện
- Click ngày → panel chi tiết sự kiện
- Ngày giỗ: tính "Giỗ lần thứ N", hưởng thọ/dương
- Sinh nhật: tính "Sinh nhật lần thứ N"
- Countdown ngày sắp tới

### Tab Quản Trị (SettingsTab)
- Thống kê dòng họ (biểu đồ)
- Trang tưởng nhớ người đã mất
- Bản đồ mộ phần
- **Xuất/Nhập dữ liệu (chỉ admin):**
  - Excel (.xlsx) — sao lưu + nhập lại
  - PDF — in ấn
  - GEDCOM (.ged) — chuyển sang app gia phả khác
- Đăng nhập/Đăng xuất Admin
- Footer: thông tin app, Zalo liên hệ

### Trang Chi Tiết Thành Viên (BottomSheet)
- Cover gradient (đỏ/đen tùy sống/mất)
- Avatar, tên, tên húy, nickname, chức tước
- Badge: Nam/Nữ, Đời, Sống/Mất, **Vai vế tự động**
- Ngày sinh/mất (dương + âm lịch)
- Địa danh, mộ phần + link Google Maps
- Gia đình: **Cha/Mẹ/Vợ/Chồng/Con cái đều clickable → nhảy sang trang đó**
- QR code cá nhân
- Nút Sửa (admin)

### Form Thêm/Sửa Thành Viên
5 tab: **Cơ bản | Ngày | Địa | Quan hệ | Sử**
- Upload ảnh (auto-nén, Cloudinary)
- Tên húy | Chức tước (cùng hàng)
- Tên thường gọi | Đời thứ (cùng hàng)
- Vai vế | Giới tính (cùng hàng)
- Nút **Lưu thông tin sticky** — không bao giờ bị khuất

---

## 🔐 PHÂN QUYỀN

| Chức năng | Thành viên | Admin |
|---|---|---|
| Xem tất cả | ✅ | ✅ |
| Thêm / Sửa / Xóa | ❌ | ✅ |
| Xuất Excel / PDF / GEDCOM | ❌ mờ | ✅ |
| Nhập Excel | ❌ | ✅ |

**Cách thêm admin mới:**
1. Firebase Console → Authentication → Add user (email + password)
2. Mở file `src/App.tsx` → tìm `adminEmails` → thêm email vào array
3. Commit + push lên GitHub

---

## 🗃️ CẤU TRÚC DỮ LIỆU FIREBASE

### Collection: `members`
Mỗi document có các fields:

```
id            string   (auto)
name          string   "Lê Văn A"
memberType    string   "chinh" | "dau" | "re" | "chau_ngoai" | "ngoai_toc"
tenHuy        string   "Tên trong gia phả"
nickname      string   "Tên thường gọi, biệt danh"
chucTuoc      string   "Hương lý, Chánh tổng..."
gender        string   "Nam" | "Nữ"
generation    number   1, 2, 3...
birthDate     string   "1950-03-15" (ISO)
birthDateLunar string  "15/7 Canh Dần"
birthPlace    string   "Làng X, Huyện Y"
deathDate     string   "2010-08-20"
deathDateLunar string  "12/7 Canh Dần"  ← ngày giỗ âm lịch
deathPlace    string
residence     string
burialAddress string   "Nghĩa trang X, lô Y"
burialMapLink string   "https://maps.app.goo.gl/..."
fatherId      string   ID của cha
motherId      string   ID của mẹ
spouseId      string   ID vợ/chồng
photoUrl      string   URL Cloudinary
biography     string   Tiểu sử dài
createdAt     string   ISO timestamp
```

---

## 🔄 QUY TRÌNH LÀM VIỆC VỚI CLAUDE

```
1. Mô tả vấn đề / tính năng muốn thêm
   → Claude đọc code hiện tại để chẩn đoán

2. Claude tạo file .zip với các file đã sửa
   → Tải về, giải nén

3. Copy file vào đúng vị trí trong thư mục dự án:
   src/components/X.tsx  →  vào thư mục src/components/
   src/tabs/X.tsx        →  vào thư mục src/tabs/
   src/App.tsx           →  vào thư mục src/
   src/types.ts          →  vào thư mục src/

4. Push lên GitHub:
   git add .
   git commit -m "v17 — mô tả"
   git push

5. Chờ 2 phút → mở web → kiểm tra version mới
```

### Nếu gặp lỗi TypeScript sau khi push
- GitHub Actions / Cloudflare build sẽ báo lỗi với dòng code cụ thể
- Chụp màn hình lỗi → gửi cho Claude → Claude fix ngay

---

## 📤 XUẤT DỮ LIỆU

### Excel — sao lưu định kỳ
- App → Quản Trị → Xuất Excel → tải file `.xlsx`
- Lưu lại máy tính, Google Drive
- **Có thể sửa trong Excel rồi nhập lại vào app**

### GEDCOM — chuyển sang app khác
- App → Quản Trị → Sao lưu GEDCOM → tải file `.ged`
- Mở bằng: **Gramps** (free, mọi OS), **MacFamilyTree** (Mac), **Ancestry** (web)
- Tương thích: Ancestry, MyHeritage, FamilySearch, Gramps, FamilyTreeMaker

---

## 📝 LỊCH SỬ PHIÊN BẢN

| Ver | Ngày | Nội dung |
|---|---|---|
| v8 | 2026-02 | Stitch redesign, MiniMap, bloodline highlight, PWA |
| v9 | 2026-02 | Sibling ordering (dagre post-process) |
| v10 | 2026-02 | BottomSheet scroll, DirectoryTab crash fix |
| v11 | 2026-03 | FamilyNode redesign, dark mode, EventsTab calendar |
| v12 | 2026-03 | GEDCOM export, SettingsTab footer redesign |
| v13 | 2026-03 | Scroll fix (nested context), "Người đã mất" |
| v14 | 2026-03 | MemberType (dâu/rể/cháu ngoại), filter |
| v15 | 2026-03 | Nút Lưu sticky, con cái clickable, xóa email |
| v16 | 2026-03 | Cha/mẹ/vợ/chồng clickable, auto memberType, tab layout, GEDCOM vào export |

---

## 👨‍💻 LIÊN HỆ PHÁT TRIỂN

**Lê Tỉnh** — Zalo: [0708312789](https://zalo.me/0708312789)

© Dòng Họ Lê — Dữ liệu được lưu trữ an toàn trên Firebase
