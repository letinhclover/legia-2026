import { Member } from '../types';

async function loadScript(src: string): Promise<void> {
  if (document.querySelector(`script[src="${src}"]`)) return;
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.onload = () => res(); s.onerror = rej;
    document.head.appendChild(s);
  });
}

async function loadLibs() {
  await Promise.all([
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'),
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'),
  ]);
}

// ── Màu sắc phân loại ──────────────────────────────────────────────────────
const TYPE_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  chinh:      { bg: '#FFF5F5', color: '#9B1C1C', label: 'Chính tộc' },
  dau:        { bg: '#FAF5FF', color: '#6B21A8', label: 'Con dâu'   },
  re:         { bg: '#EFF6FF', color: '#1E40AF', label: 'Con rể'    },
  chau_ngoai: { bg: '#F0FDF4', color: '#166534', label: 'Cháu ngoại'},
  ngoai_toc:  { bg: '#FFFBEB', color: '#92400E', label: 'Ngoại tộc' },
};

// ── Render card 1 thành viên ───────────────────────────────────────────────
function memberCard(m: Member): string {
  const deceased  = !!m.deathDate;
  const isMale    = m.gender === 'Nam';
  const typeStyle = TYPE_STYLE[m.memberType ?? 'chinh'] ?? TYPE_STYLE.chinh;

  const accentColor = isMale ? '#1D3A6B' : '#8B2252';
  const cardBg      = deceased ? '#F8F8F6' : typeStyle.bg;
  const birthY      = m.birthDate ? new Date(m.birthDate).getFullYear() : (m as any).birthYear ?? '';
  const deathY      = m.deathDate ? new Date(m.deathDate).getFullYear() : (m as any).deathYear ?? '';

  const yearStr = birthY
    ? `${birthY}${deathY ? ` – ${deathY}` : ''}`
    : '';

  const age = (() => {
    if (!birthY) return '';
    const endY = deathY || new Date().getFullYear();
    const a = Number(endY) - Number(birthY);
    return a > 0 ? `${a} tuổi` : '';
  })();

  return `
  <div style="
    display:inline-flex; flex-direction:column; align-items:center;
    width:148px; margin:6px;
    background:${cardBg};
    border:1.5px solid ${accentColor}28;
    border-radius:18px;
    box-shadow:0 3px 14px rgba(28,20,16,0.09), 0 1px 3px rgba(28,20,16,0.06);
    font-family:'Segoe UI','Be Vietnam Pro',sans-serif;
    vertical-align:top; position:relative;
    overflow:hidden;
    filter:${deceased ? 'grayscale(45%)' : 'none'};
    opacity:${deceased ? '0.88' : '1'};
  ">
    <!-- Accent bar trên đầu -->
    <div style="height:4px; width:100%; background:${accentColor}; border-radius:18px 18px 0 0;"></div>

    <!-- Avatar -->
    <div style="
      width:58px; height:58px; border-radius:50%; overflow:hidden;
      border:2.5px solid ${accentColor};
      background:${isMale ? '#EEF2FF' : '#FFF0F6'};
      display:flex; align-items:center; justify-content:center;
      font-size:26px; margin:14px 0 8px;
      box-shadow:0 2px 8px rgba(28,20,16,0.14);
    ">
      ${m.photoUrl
        ? `<img src="${m.photoUrl}" style="width:100%;height:100%;object-fit:cover;" crossorigin="anonymous"/>`
        : (isMale ? '👨' : '👩')
      }
    </div>

    <!-- Tên -->
    <div style="
      font-weight:800; font-size:11.5px; color:#1C1410;
      text-align:center; line-height:1.3;
      padding:0 10px; margin-bottom:3px;
      word-break:break-word;
    ">${m.name}</div>

    <!-- Tên húy -->
    ${m.tenHuy ? `
    <div style="font-size:9.5px;color:#6B5E52;font-style:italic;margin-bottom:2px;">
      Húy: ${m.tenHuy}
    </div>` : ''}

    <!-- Chức tước -->
    ${m.chucTuoc ? `
    <div style="
      font-size:9px; font-weight:700; color:#B8860B;
      background:#FFFBEB; border-radius:8px; padding:1px 8px; margin-bottom:4px;
    ">${m.chucTuoc}</div>` : ''}

    <!-- Vai vế (nếu không phải chính tộc) -->
    ${(m.memberType && m.memberType !== 'chinh') ? `
    <div style="
      font-size:8.5px; font-weight:700;
      color:${typeStyle.color}; background:${typeStyle.bg};
      border:1px solid ${typeStyle.color}30;
      border-radius:10px; padding:1px 8px; margin-bottom:4px;
    ">${typeStyle.label}</div>` : ''}

    <!-- Năm sinh – năm mất -->
    ${yearStr ? `
    <div style="font-size:10px; color:#6B5E52; margin-bottom:2px; font-weight:500;">
      ${yearStr}
    </div>` : ''}

    <!-- Tuổi -->
    ${age ? `
    <div style="font-size:9px; color:${accentColor}; font-weight:700; margin-bottom:6px;">
      ${deceased ? '🕯️ ' : ''}${age}
    </div>` : '<div style="margin-bottom:6px;"></div>'}

    <!-- Nơi sinh -->
    ${m.birthPlace ? `
    <div style="
      font-size:8.5px; color:#9C8E82; text-align:center;
      padding:0 8px 6px; line-height:1.3;
    ">📍 ${m.birthPlace}</div>` : ''}

    <!-- Badge đời — góc trên phải -->
    <div style="
      position:absolute; top:10px; right:8px;
      background:${accentColor}; color:#fff;
      font-size:8px; font-weight:900; font-family:serif;
      padding:2px 6px; border-radius:20px;
      box-shadow:0 1px 4px rgba(0,0,0,0.2);
    ">Đ${m.generation}</div>
  </div>`;
}

// ── Build full HTML ────────────────────────────────────────────────────────
function buildHTML(members: Member[]): string {
  const maxGen = Math.max(...members.map(m => m.generation), 1);
  const byGen  = Array.from({ length: maxGen }, (_, i) =>
    members
      .filter(m => m.generation === i + 1)
      .sort((a, b) => {
        const ya = (a as any).birthYear || (a.birthDate ? parseInt(a.birthDate) : 9999);
        const yb = (b as any).birthYear || (b.birthDate ? parseInt(b.birthDate) : 9999);
        return ya - yb;
      })
  );

  const maxPerRow = Math.max(...byGen.map(g => g.length), 1);
  const pageW     = Math.max(maxPerRow * 168 + 96, 900);

  const rows = byGen.map((gen, i) => `
    <div style="margin-bottom:12px;">
      <!-- Đầu đời -->
      <div style="
        display:flex; align-items:center; gap:14px;
        margin:0 48px 10px;
      ">
        <div style="flex:1; height:1px; background:linear-gradient(90deg,transparent,#E2D8CA);"></div>
        <div style="
          background:linear-gradient(135deg,#800000,#5C0000);
          color:#D4AF37; padding:5px 22px; border-radius:30px;
          font-size:12px; font-weight:800;
          font-family:'Segoe UI',sans-serif;
          box-shadow:0 3px 10px rgba(128,0,0,0.25);
          white-space:nowrap;
        ">
          Đời thứ ${i + 1} &nbsp;·&nbsp; ${gen.length} người
        </div>
        <div style="flex:1; height:1px; background:linear-gradient(90deg,#E2D8CA,transparent);"></div>
      </div>
      <!-- Cards -->
      <div style="text-align:center;">${gen.map(memberCard).join('')}</div>
    </div>
    ${i < byGen.length - 1 ? `<div style="height:1px;background:linear-gradient(90deg,transparent,#E2D8CA 30%,#E2D8CA 70%,transparent);margin:4px 64px 16px;"></div>` : ''}
  `).join('');

  return `
  <div id="pdf-root" style="
    background:#FFFDF7;
    padding:40px 48px 48px;
    width:${pageW}px;
    font-family:'Segoe UI','Be Vietnam Pro',sans-serif;
  ">
    <!-- TIÊU ĐỀ -->
    <div style="text-align:center; margin-bottom:36px;">
      <!-- Logo -->
      <div style="
        width:72px; height:72px; border-radius:20px; margin:0 auto 16px;
        background:linear-gradient(135deg,#800000 0%,#4a0000 60%,#B8860B 100%);
        display:flex; align-items:center; justify-content:center;
        box-shadow:0 6px 24px rgba(128,0,0,0.3);
      ">
        <span style="color:white;font-size:32px;font-weight:900;font-family:serif;">Lê</span>
      </div>

      <div style="
        font-size:32px; font-weight:900; color:#800000;
        font-family:'Georgia',serif; letter-spacing:-0.5px;
        margin-bottom:6px;
      ">GIA PHẢ DÒNG HỌ LÊ</div>

      <div style="
        font-size:13px; color:#B8860B; font-weight:600;
        letter-spacing:3px; margin-bottom:12px;
        text-transform:uppercase;
      ">Truyền Thống · Đoàn Kết · Phát Triển</div>

      <!-- Đường kẻ vàng -->
      <div style="
        width:120px; height:3px; margin:0 auto 14px;
        background:linear-gradient(90deg,transparent,#D4AF37,transparent);
        border-radius:2px;
      "></div>

      <!-- Meta info -->
      <div style="
        display:inline-flex; gap:24px;
        background:#FFF5E6; border:1px solid #E2D8CA;
        border-radius:16px; padding:10px 28px;
        font-size:12px; color:#6B5E52;
      ">
        <span>📅 Xuất ngày ${new Date().toLocaleDateString('vi-VN')}</span>
        <span>👥 ${members.length} thành viên</span>
        <span>🏛️ ${maxGen} đời</span>
      </div>
    </div>

    <!-- CÂY GIA PHẢ -->
    ${rows}

    <!-- FOOTER -->
    <div style="
      margin-top:32px; padding-top:20px;
      border-top:2px solid #E2D8CA;
      text-align:center;
      color:#9C8E82; font-size:10px;
    ">
      <div style="font-weight:700; color:#6B5E52; margin-bottom:4px;">
        legia-2026.pages.dev
      </div>
      Dữ liệu được lưu trữ bảo mật trên Firebase &nbsp;·&nbsp; 
      © ${new Date().getFullYear()} Dòng Họ Lê
    </div>
  </div>`;
}

// ── Export chính ───────────────────────────────────────────────────────────
export async function exportToPDF(
  members: Member[],
  onProgress?: (msg: string) => void
): Promise<void> {
  onProgress?.('Đang tải thư viện…');
  await loadLibs();

  onProgress?.('Đang tạo bản vẽ…');
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;left:-99999px;top:0;z-index:-999;background:#FFFDF7;overflow:visible;';
  wrap.innerHTML = buildHTML(members);
  document.body.appendChild(wrap);

  const el = wrap.querySelector('#pdf-root') as HTMLElement;

  // Đợi ảnh load
  await Promise.all(
    Array.from(el.querySelectorAll('img')).map(img =>
      new Promise<void>(r => { img.onload = img.onerror = () => r(); if (img.complete) r(); })
    )
  );
  await new Promise(r => setTimeout(r, 400));

  const elW = el.scrollWidth;
  const elH = el.scrollHeight;

  onProgress?.(`Đang chụp (${elW}×${elH}px)…`);

  const canvas = await (window as any).html2canvas(el, {
    scale: 2.2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#FFFDF7',
    logging: false,
    width: elW, height: elH,
    windowWidth: elW, windowHeight: elH,
  });

  document.body.removeChild(wrap);

  onProgress?.('Đang tạo file PDF…');
  const { jsPDF } = (window as any).jspdf;

  const ratio = canvas.height / canvas.width;
  const pgW   = Math.max(900, Math.ceil(canvas.width / 2.8));
  const pgH   = Math.ceil(pgW * ratio);

  const pdf = new jsPDF({
    orientation: pgH > pgW ? 'portrait' : 'landscape',
    unit: 'mm', format: [pgW, pgH], compress: true,
  });

  pdf.addImage(canvas.toDataURL('image/jpeg', 0.93), 'JPEG', 0, 0, pgW, pgH);

  const today = new Date().toISOString().slice(0, 10);
  pdf.save(`GiaPha_HoLe_v18_${today}.pdf`);
  onProgress?.('✅ Xuất PDF thành công!');
}
