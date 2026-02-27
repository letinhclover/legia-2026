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

  // URL tối ưu: tự chọn format + quality + resize
  const url: string = data.secure_url;
  return url.replace('/upload/', '/upload/f_auto,q_auto,w_500,c_fill,g_face/');
}
