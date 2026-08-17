import { supabase } from '../lib/supabase';

const ICON_SIZE = 128;

function cropToSquareWebP(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      const canvas = document.createElement('canvas');
      canvas.width = ICON_SIZE;
      canvas.height = ICON_SIZE;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, ICON_SIZE, ICON_SIZE);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob failed'));
        },
        'image/webp',
        0.82,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

export interface UploadedIcon {
  id: string;
  public_url: string;
}

export async function uploadHoekenIcon(
  file: File,
  schoolId: string,
  userId: string,
): Promise<UploadedIcon> {
  const blob = await cropToSquareWebP(file);
  const uuid = crypto.randomUUID();
  const path = `schools/${schoolId}/hoekenwerk/${uuid}.webp`;

  const { error: uploadError } = await supabase.storage
    .from('hoekenwerk_icons')
    .upload(path, blob, { contentType: 'image/webp', upsert: false });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from('hoekenwerk_icons')
    .getPublicUrl(path);

  const publicUrl = urlData.publicUrl;

  const { data, error: dbError } = await supabase
    .from('school_hoekenwerk_icons')
    .insert({ school_id: schoolId, uploaded_by: userId, storage_path: path, public_url: publicUrl, original_name: file.name })
    .select('id, public_url')
    .single();

  if (dbError) throw dbError;

  return { id: data.id, public_url: data.public_url };
}
