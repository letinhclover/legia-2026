import { Member } from '../types';

async function loadScript(src: string): Promise<void> {
  if (document.querySelector(`script[src="${src}"]`)) return;
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.onload = () => resolve(); s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function loadLibs() {
  await Promise.all([
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'),
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'),
  ]);
}

// ─── Render từng node thành viên ─────────────────────────────────────────
function memberCard(m: Member): string {
  const isDeceased = !!m.deathDate;
  const bg = isDeceased ? '#F0F0F0' : m.gender === 'Nam' ? '#EBF5FB' : '#FDF2F8';
  const border = m.gender === 'Nam' ? '#1A5276' : '#922B21';
  const birthY = m.birthDate ? new Date(m.birthDate).getFullYear() : '';
  const deathY = m.deathDate ? new Date(m.deathDate).getFullYear() : '';

  return `<div style="
    display:inline-flex;flex-direction:column;align-items:center;
    width:150px;margin:5px;padding:10px 8px;
    background:${bg};border:2.5px solid ${border};border-radius:14px;
    font-family:'Segoe UI',sans-serif;box-shadow:0 3px 10px rgba(0,0,0,0.12);
    vertical-align:top;position:relative;
    filter:${isDeceased?'grayscale(30%)':'none'};
  ">
    <div style="width:52px;height:52px;border-radius:50%;overflow:hidden;border:2.5px solid ${border};margin-bottom:6px;background:#ddd;display:flex;align-items:center;justify-content:center;font-size:22px;">
      ${m.photoUrl ? `<img src="${m.photoUrl}" style="width:100%;height:100%;object-fit:cover;" crossorigin="anonymous"/>` : (m.gender==='Nam'?'👨':'👩')}
    </div>
    <div style="font-weight:800;font-size:11px;color:#111;text-align:center;line-height:1.3;margin-bottom:2px;">${m.name}</div>
    ${m.tenHuy ? `<div style="font-size:9px;color:#666;font-style:italic;">Húy: ${m.tenHuy}</div>` : ''}
    ${m.chucTuoc ? `<div style="font-size:9px;color:#B8860B;font-weight:700;">${m.chucTuoc}</div>` : ''}
    ${(m.memberType && m.memberType !== 'chinh') ? '<div style="font-size:8px;padding:1px 5px;border-radius:8px;margin-top:2px;font-weight:700;background:' + (m.memberType==='dau'?'#FDF4FF':m.memberType==='re'?'#EFF6FF':m.memberType==='chau_ngoai'?'#F0FDF4':'#FFFBEB') + ';color:' + (m.memberType==='dau'?'#7E22CE':m.memberType==='re'?'#1D4ED8':m.memberType==='chau_ngoai'?'#15803D':'#92400E') + ';">' + (m.memberType==='dau'?'💍 Con dâu':m.memberType==='re'?'🤝 Con rể':m.memberType==='chau_ngoai'?'👶 Cháu ngoại':'🔗 Ngoại tộc') + '</div>' : ''}
    <div style="font-size:9px;color:#888;margin-top:3px;">
      ${birthY}${deathY ? ` — ${deathY}` : ''}
    </div>
    <div style="position:absolute;top:4px;right:4px;background:#800000;color:#FFD700;font-size:8px;font-weight:900;padding:1px 5px;border-radius:10px;">${m.generation}</div>
  </div>`;
}

// ─── Build full HTML tree ─────────────────────────────────────────────────
function buildTreeHTML(members: Member[]): string {
  const maxGen = Math.max(...members.map(m => m.generation), 1);
  const byGen: Member[][] = Array.from({ length: maxGen }, (_, i) =>
    members
      .filter(m => m.generation === i + 1)
      .sort((a, b) => {
        const ya = a.birthDate ? parseInt(a.birthDate) : 9999;
        const yb = b.birthDate ? parseInt(b.birthDate) : 9999;
        return ya - yb;
      })
  );

  const rows = byGen.map((gen, i) => `
    <div style="margin-bottom:6px;">
      <div style="text-align:center;margin-bottom:8px;">
        <span style="background:#800000;color:#FFD700;padding:4px 18px;border-radius:20px;font-size:12px;font-weight:800;font-family:sans-serif;">
          Đời thứ ${i+1} &nbsp;·&nbsp; ${gen.length} người
        </span>
      </div>
      <div style="text-align:center;line-height:0;">
        ${gen.map(memberCard).join('')}
      </div>
    </div>
    <div style="border-top:1px dashed #CCC;margin:6px 60px;"></div>
  `).join('');

  return `<div id="pdf-root" style="
    background:white;padding:32px 24px;
    min-width:${Math.max(byGen.reduce((m,g) => Math.max(m, g.length),0) * 166, 800)}px;
    font-family:'Segoe UI',sans-serif;
  ">
    <div style="text-align:center;margin-bottom:28px;border-bottom:3px solid #800000;padding-bottom:16px;">
      <div style="font-size:28px;font-weight:900;color:#800000;letter-spacing:1px;">GIA PHẢ DÒNG HỌ LÊ</div>
      <div style="font-size:13px;color:#B8860B;font-weight:600;margin-top:4px;">Truyền thống · Đoàn kết · Phát triển</div>
      <div style="font-size:11px;color:#999;margin-top:4px;">
        Xuất ngày ${new Date().toLocaleDateString('vi-VN')} &nbsp;·&nbsp;
        Tổng cộng ${members.length} thành viên &nbsp;·&nbsp; ${maxGen} đời
      </div>
    </div>
    ${rows}
    <div style="text-align:center;margin-top:20px;padding-top:12px;border-top:2px solid #800000;font-size:10px;color:#888;">
      legia-2026.pages.dev &nbsp;·&nbsp; Dữ liệu lưu trữ bảo mật trên Firebase
    </div>
  </div>`;
}

// ─── Export ───────────────────────────────────────────────────────────────
export async function exportToPDF(
  members: Member[],
  onProgress?: (msg: string) => void
): Promise<void> {
  onProgress?.('Đang tải thư viện...');
  await loadLibs();

  // YC6: Render off-screen với kích thước thật — KHÔNG bị cắt viewport
  onProgress?.('Đang tạo bản vẽ (toàn bộ cây)...');
  const wrap = document.createElement('div');
  wrap.style.cssText = `
    position:fixed;left:-99999px;top:0;z-index:-999;
    background:white;overflow:visible;
  `;
  wrap.innerHTML = buildTreeHTML(members);
  document.body.appendChild(wrap);

  const el = wrap.querySelector('#pdf-root') as HTMLElement;

  // Chờ tất cả ảnh load xong
  await Promise.all(
    Array.from(el.querySelectorAll('img')).map(img =>
      new Promise<void>(r => { img.onload = img.onerror = () => r(); if (img.complete) r(); })
    )
  );
  // Nhỏ delay để browser paint xong
  await new Promise(r => setTimeout(r, 300));

  const elW = el.scrollWidth;
  const elH = el.scrollHeight;

  onProgress?.(`Đang chụp (${elW}×${elH}px)...`);

  // YC6: Chụp đúng kích thước thật scrollWidth×scrollHeight
  const canvas = await (window as any).html2canvas(el, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    width: elW,
    height: elH,
    windowWidth: elW,
    windowHeight: elH,
  });

  document.body.removeChild(wrap);

  onProgress?.('Đang tạo PDF...');
  const { jsPDF } = (window as any).jspdf;

  // Tính khổ giấy: fit vào A1 landscape (841×594mm) hoặc lớn hơn
  const ratio = canvas.height / canvas.width;
  const pgW = Math.max(841, Math.ceil(canvas.width / 3));   // ~300dpi
  const pgH = Math.max(594, Math.ceil(pgW * ratio));

  const pdf = new jsPDF({
    orientation: pgH > pgW ? 'portrait' : 'landscape',
    unit: 'mm',
    format: [pgW, pgH],
    compress: true,
  });

  pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pgW, pgH);

  const today = new Date().toISOString().slice(0, 10);
  pdf.save(`GiaPha_HoLe_${today}.pdf`);
  onProgress?.('✅ Xuất PDF thành công!');
}
