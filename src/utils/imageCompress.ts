export async function compressImage(file: File, maxWidth = 800, quality = 0.78): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('Không thể nén ảnh')),
        'image/jpeg', quality
      );
    };
    img.onerror = () => reject(new Error('Không đọc được ảnh'));
    img.src = url;
  });
}

export async function uploadToCloudinary(
  file: File,
  onProgress?: (msg: string) => void
): Promise<string> {
  const CLOUD_NAME = 'dedz5a7xl';
  const UPLOAD_PRESET = 'giaPha_photos';

  onProgress?.('Đang nén ảnh...');
  let blob: Blob;
  try {
    blob = await compressImage(file);
  } catch {
    // Nếu nén lỗi, dùng file gốc
    blob = file;
  }

  const kb = Math.round(blob.size / 1024);
  onProgress?.(`Đang tải lên (${kb}KB)...`);

  const formData = new FormData();
  formData.append('file', blob, 'photo.jpg');
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'giaPha');

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || `Lỗi ${res.status}: Upload thất bại`);
  }

  // URL tối ưu: tự chọn format + quality + resize (full size cho detail view)
  const url: string = data.secure_url;
  return url.replace('/upload/', '/upload/f_auto,q_auto,w_500,c_fill,g_face/');
}

/**
 * Trả về URL ảnh Cloudinary với kích thước nhỏ hơn cho thumbnail.
 * Mặc định w=100 (avatar 48–56px, pixel-ratio 2x = 100px thực).
 * Hoạt động với cả URL cũ (không có transform) và URL đã có transform.
 */
export function cloudinaryThumb(url: string | undefined, w = 100): string {
  if (!url) return '';
  if (!url.includes('res.cloudinary.com')) return url;
  // Nếu URL đã có transform (f_auto...), thay w_500 → w_{w}
  if (url.includes('/upload/f_auto')) {
    return url.replace(/w_\d+/, `w_${w}`);
  }
  // URL gốc không có transform → thêm vào
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${w},c_fill,g_face/`);
}
