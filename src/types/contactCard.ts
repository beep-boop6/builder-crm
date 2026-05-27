export type ContactCardTextAlign = 'left' | 'center' | 'right';

export type ContactCardCoverType = 'gradient' | 'color' | 'image';

export interface ContactPhone {
    id: string;
    label?: string;
    number: string;
}

export interface ContactCardProps {
    fullName: string;
    organization: string;
    email: string;
    description: string;
    /** Legacy inline URL — не сохраняется в localStorage */
    photoUrl: string;
    /** Id изображения в IndexedDB */
    photoId: string;
    phones: ContactPhone[];
    textAlign: ContactCardTextAlign;
    coverType: ContactCardCoverType;
    coverColor: string;
    coverImageId: string;
}
