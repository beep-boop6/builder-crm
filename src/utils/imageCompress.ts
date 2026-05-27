export interface CompressImageOptions {
    maxWidth: number;
    maxHeight: number;
    quality?: number;
    mimeType?: 'image/jpeg' | 'image/webp';
}

const loadImageFromFile = (file: File): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const image = new Image();

        image.onload = () => {
            URL.revokeObjectURL(url);
            resolve(image);
        };
        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Не удалось загрузить изображение'));
        };
        image.src = url;
    });

export const compressImageFile = async (
    file: File,
    options: CompressImageOptions
): Promise<Blob> => {
    const image = await loadImageFromFile(file);
    const ratio = Math.min(
        options.maxWidth / image.width,
        options.maxHeight / image.height,
        1
    );

    const width = Math.max(1, Math.round(image.width * ratio));
    const height = Math.max(1, Math.round(image.height * ratio));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error('Canvas недоступен');
    }

    context.drawImage(image, 0, 0, width, height);

    const mimeType = options.mimeType ?? 'image/jpeg';
    const quality = options.quality ?? 0.82;

    const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((result) => resolve(result), mimeType, quality);
    });

    if (!blob) {
        throw new Error('Не удалось сжать изображение');
    }

    return blob;
};
