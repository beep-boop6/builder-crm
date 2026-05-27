import { useEffect, useState } from 'react';
import { getImageObjectUrl } from '@/services/imageStorage';

/**
 * Загружает изображение по id (IndexedDB) или legacy data:/http URL.
 */
export const useStoredImage = (imageId?: string, legacyUrl?: string): string | null => {
    const [url, setUrl] = useState<string | null>(legacyUrl || null);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            if (imageId) {
                const objectUrl = await getImageObjectUrl(imageId);
                if (!cancelled) {
                    setUrl(objectUrl);
                }
                return;
            }

            if (!cancelled) {
                setUrl(legacyUrl || null);
            }
        };

        void load();

        return () => {
            cancelled = true;
        };
    }, [imageId, legacyUrl]);

    return url;
};
