import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const BUCKET = 'product-images';
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function useImageUpload() {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function uploadImage(file: File): Promise<string> {
        setError(null);

        if (!ALLOWED_TYPES.includes(file.type)) {
            const msg = 'Only JPG, PNG, and WebP images are allowed.';
            setError(msg);
            throw new Error(msg);
        }

        if (file.size > MAX_SIZE) {
            const msg = 'Image must be 2 MB or smaller.';
            setError(msg);
            throw new Error(msg);
        }

        setIsUploading(true);
        try {
            const ext = file.name.split('.').pop() ?? 'jpg';
            const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from(BUCKET)
                .upload(path, file, { cacheControl: '3600', upsert: false });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
            return data.publicUrl;
        } finally {
            setIsUploading(false);
        }
    }

    async function deleteImage(publicUrl: string): Promise<void> {
        try {
            // Extract path from public URL: ...product-images/filename.ext
            const marker = `/object/public/${BUCKET}/`;
            const idx = publicUrl.indexOf(marker);
            if (idx === -1) return;
            const path = publicUrl.slice(idx + marker.length);

            await supabase.storage.from(BUCKET).remove([path]);
        } catch {
            // Silently ignore delete failures — image may already be removed
        }
    }

    return { uploadImage, deleteImage, isUploading, error };
}
