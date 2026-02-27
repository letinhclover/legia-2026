// Nén ảnh trước khi upload — giảm ~90% dung lượng
export async function compressImage(file: File, maxWidth = 800, quality = 0.75): Promise<Blob> {
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
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Compress failed')), 'image/jpeg', quality);
    };
    img.onerror = reject;
    img.src = url;
  });
}

// Upload lên Cloudinary (unsigned)
export async function uploadToCloudinary(file: File): Promise<string> {
  const CLOUD_NAME = 'dedz5a7xl';
  const UPLOAD_PRESET = 'giaPha_photos';

  // Nén ảnh trước
  const compressed = await compressImage(file);
  const sizeMB = (compressed.size / 1024 / 1024).toFixed(2);
  console.log(`Ảnh sau nén: ${sizeMB}MB`);

  const formData = new FormData();
  formData.append('file', compressed, 'photo.jpg');
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'giaPha');

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Upload thất bại');
  }

  const data = await res.json();
  // Trả về URL tối ưu: auto format + quality
  return data.secure_url.replace('/upload/', '/upload/f_auto,q_auto,w_400/');
}
