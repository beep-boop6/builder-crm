import { generateGuid } from '@/utils';
import type { ContactCardCoverType, ContactCardProps, ContactPhone } from '@/types/contactCard';

export const DEFAULT_CONTACT_CARD_PROPS: ContactCardProps = {
    fullName: 'Иван Иванов',
    organization: 'ООО «Пример»',
    email: 'ivan@example.com',
    description: 'Менеджер по работе с клиентами',
    photoUrl: '',
    photoId: '',
    phones: [{ id: generateGuid(), number: '+7 (999) 123-45-67' }],
    textAlign: 'left',
    coverType: 'gradient',
    coverColor: '#155DA4',
    coverImageId: '',
};

export const createEmptyPhone = (): ContactPhone => ({
    id: generateGuid(),
    number: '',
});

const parseCoverType = (value: unknown): ContactCardCoverType => {
    if (value === 'color' || value === 'image' || value === 'gradient') {
        return value;
    }
    return DEFAULT_CONTACT_CARD_PROPS.coverType;
};

export const normalizeContactCardProps = (
    raw: Record<string, unknown> | undefined
): ContactCardProps => {
    const phonesRaw = raw?.phones;
    const phones: ContactPhone[] = Array.isArray(phonesRaw)
        ? phonesRaw
            .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
            .map((item) => ({
                id: String(item.id ?? generateGuid()),
                label: item.label != null ? String(item.label) : undefined,
                number: String(item.number ?? ''),
            }))
        : DEFAULT_CONTACT_CARD_PROPS.phones;

    const legacyTitle = raw?.title != null ? String(raw.title) : '';
    const legacyContent = raw?.content != null ? String(raw.content) : '';

    const photoUrlRaw = raw?.photoUrl != null ? String(raw.photoUrl) : '';
    const photoUrl =
        photoUrlRaw.startsWith('data:') && raw?.photoId
            ? ''
            : photoUrlRaw;

    return {
        fullName: String(raw?.fullName ?? (legacyTitle || DEFAULT_CONTACT_CARD_PROPS.fullName)),
        organization: String(raw?.organization ?? DEFAULT_CONTACT_CARD_PROPS.organization),
        email: String(raw?.email ?? DEFAULT_CONTACT_CARD_PROPS.email),
        description: String(raw?.description ?? (legacyContent || DEFAULT_CONTACT_CARD_PROPS.description)),
        photoUrl,
        photoId: String(raw?.photoId ?? DEFAULT_CONTACT_CARD_PROPS.photoId),
        phones: phones.length > 0 ? phones : [{ ...createEmptyPhone() }],
        textAlign:
            raw?.textAlign === 'center' || raw?.textAlign === 'right'
                ? raw.textAlign
                : DEFAULT_CONTACT_CARD_PROPS.textAlign,
        coverType: parseCoverType(raw?.coverType),
        coverColor: String(raw?.coverColor ?? DEFAULT_CONTACT_CARD_PROPS.coverColor),
        coverImageId: String(raw?.coverImageId ?? DEFAULT_CONTACT_CARD_PROPS.coverImageId),
    };
};
