// Xuất PDF gia phả — dùng html2canvas + jsPDF (load động, không cần npm install)
import { Member } from '../types';

async function loadScript(src: string): Promise<void> {
  if (document.querySelector(`script[src="${src}"]`)) return;
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function loadLibs() {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
}

// ─── Tạo HTML cây phả đồ dạng bảng để render PDF ────────────────────────
function buildFamilyHTML(members: Member[]): string {
  const sorted = [...members].sort((a, b) => a.generation - b.generation || a.name.localeCompare(b.name));
  const maxGen = Math.max(...members.map(m => m.generation), 0);
  const byGen: Member[][] = Array.from({ length: maxGen }, (_, i) =>
    sorted.filter(m => m.generation === i + 1)
  );
  const memberMap = new Map(members.map(m => [m.id, m]));

  const memberHTML = (m: Member) => {
    const isDeceased = !!m.deathDate;
    const birthY = m.birthDate ? new Date(m.birthDate).getFullYear() : '';
    const deathY = m.deathDate ? new Date(m.deathDate).getFullYear() : '';
    const bg = isDeceased ? '#f0f0f0' : m.gender === 'Nam' ? '#EBF5FB' : '#FDF2F8';
    const border = m.gender === 'Nam' ? '#1A5276' : '#922B21';

    return `
      <div style="
        display:inline-block; width:160px; margin:6px; padding:8px 10px;
        background:${bg}; border:2px solid ${border}; border-radius:12px;
        vertical-align:top; text-align:center; font-family:sans-serif;
        box-shadow:0 2px 8px rgba(0,0,0,0.1);
      ">
        ${m.photoUrl ? `<img src="${m.photoUrl}" style="width:50px;height:50px;border-radius:50%;object-fit:cover;border:2px solid ${border};margin-bottom:4px;" crossorigin="anonymous"/>` : `<div style="width:50px;height:50px;border-radius:50%;background:#ddd;margin:0 auto 4px;display:flex;align-items:center;justify-content:center;font-size:20px;">${m.gender==='Nam'?'👨':'👩'}</div>`}
        <div style="font-weight:800;font-size:11px;color:#1a1a1a;line-height:1.3;">${m.name}</div>
        ${m.tenHuy ? `<div style="font-size:9px;color:#666;font-style:italic;">Húy: ${m.tenHuy}</div>` : ''}
        ${m.chucTuoc ? `<div style="font-size:9px;color:#B8860B;font-weight:600;">${m.chucTuoc}</div>` : ''}
        <div style="font-size:9px;color:#888;margin-top:2px;">${birthY}${deathY ? ` — ${deathY}` : ''}</div>
        ${m.spouseId && memberMap.get(m.spouseId) ? `<div style="font-size:8px;color:#B8860B;">💑 ${memberMap.get(m.spouseId)!.name.split(' ').pop()}</div>` : ''}
      </div>`;
  };

  const rows = byGen.map((gen, i) => `
    <div style="text-align:center;margin-bottom:8px;">
      <div style="display:inline-block;background:#800000;color:#FFD700;padding:4px 16px;border-radius:20px;font-size:12px;font-weight:700;margin-bottom:8px;font-family:sans-serif;">
        Đời thứ ${i + 1} &nbsp;·&nbsp; ${gen.length} người
      </div>
      <div style="text-align:center;">${gen.map(memberHTML).join('')}</div>
    </div>
    <div style="border-top:1px dashed #ccc;margin:8px 40px;"></div>
  `).join('');

  return `
    <div id="pdf-content" style="background:white;padding:30px;min-width:900px;font-family:sans-serif;">
      <!-- Header -->
      <div style="text-align:center;margin-bottom:24px;padding-bottom:16px;border-bottom:3px solid #800000;">
        <div style="font-size:28px;font-weight:900;color:#800000;letter-spacing:1px;">GIA PHẢ DÒNG HỌ LÊ</div>
        <div style="font-size:13px;color:#B8860B;margin-top:4px;font-weight:600;">Truyền thống · Đoàn kết · Phát triển</div>
        <div style="font-size:11px;color:#999;margin-top:4px;">Xuất ngày ${new Date().toLocaleDateString('vi-VN')} · Tổng cộng ${members.length} thành viên · ${maxGen} đời</div>
      </div>
      <!-- Cây phả đồ -->
      ${rows}
      <!-- Footer -->
      <div style="text-align:center;margin-top:24px;padding-top:12px;border-top:2px solid #800000;font-size:10px;color:#888;">
        legia-2026.netlify.app &nbsp;·&nbsp; Dữ liệu lưu trữ bảo mật trên Firebase
      </div>
    </div>`;
}

export async function exportToPDF(
  members: Member[],
  onProgress?: (msg: string) => void
): Promise<void> {
  onProgress?.('Đang tải thư viện...');
  await loadLibs();

  // Tạo container ẩn để render HTML
  onProgress?.('Đang tạo bản vẽ...');
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;background:white;';
  container.innerHTML = buildFamilyHTML(members);
  document.body.appendChild(container);

  const el = container.querySelector('#pdf-content') as HTMLElement;

  // Chờ ảnh load
  await Promise.all(
    Array.from(el.querySelectorAll('img')).map(img =>
      new Promise<void>(r => { img.onload = img.onerror = () => r(); })
    )
  );

  onProgress?.('Đang chụp ảnh...');
  const canvas = await (window as any).html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  document.body.removeChild(container);

  onProgress?.('Đang tạo PDF...');
  const { jsPDF } = (window as any).jspdf;

  // Tính toán khổ giấy A1 ngang (841 × 594 mm)
  const imgW = canvas.width;
  const imgH = canvas.height;
  const ratio = imgH / imgW;

  // Khổ A1 = 841 × 594mm, A0 = 1189 × 841mm
  const pageW = imgW > 3000 ? 1189 : 841;
  const pageH = Math.max(594, Math.ceil(pageW * ratio));

  const pdf = new jsPDF({
    orientation: pageH > pageW ? 'portrait' : 'landscape',
    unit: 'mm',
    format: [pageW, pageH],
  });

  pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pageW, pageH);

  const today = new Date().toISOString().slice(0, 10);
  pdf.save(`GiaPha_HoLe_${today}.pdf`);

  onProgress?.('✅ Xuất PDF thành công!');
}
