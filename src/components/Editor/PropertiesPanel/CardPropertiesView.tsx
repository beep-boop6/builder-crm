import { useRef } from 'react';
import { message } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { EditorComponent } from '@/store/editorStore';
import type { ContactCardCoverType, ContactCardProps, ContactPhone } from '@/types/contactCard';
import {
    createEmptyPhone,
    DEFAULT_CONTACT_CARD_PROPS,
    normalizeContactCardProps,
} from '@/utils/contactCardDefaults';
import { compressImageFile } from '@/utils/imageCompress';
import { deleteImage, saveImageBlob } from '@/services/imageStorage';
import {
    PropertyButton,
    PropertyColorInput,
    PropertySection,
    PropertySelect,
    PropertyTextInput,
} from './PropertyFields';
import styles from './CardPropertiesView.module.css';

interface CardPropertiesViewProps {
    component: EditorComponent;
    onUpdate: (key: keyof EditorComponent, value: string | number) => void;
    onUpdateProps: (props: Record<string, unknown>) => void;
}

export const CardPropertiesView = ({
    component,
    onUpdate,
    onUpdateProps,
}: CardPropertiesViewProps) => {
    const photoInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const contact = normalizeContactCardProps(component.props);
    const patchContact = (patch: Partial<ContactCardProps>) => {
        const next = { ...contact, ...patch };
        onUpdateProps(next);
        if (patch.fullName !== undefined) {
            onUpdate('text', patch.fullName);
        }
    };

    const updatePhones = (phones: ContactPhone[]) => {
        patchContact({ phones });
    };

    const handlePhoneChange = (id: string, field: 'number' | 'label', value: string) => {
        updatePhones(
            contact.phones.map((phone) =>
                phone.id === id ? { ...phone, [field]: value } : phone
            )
        );
    };

    const handleAddPhone = () => {
        updatePhones([...contact.phones, createEmptyPhone()]);
    };

    const handleRemovePhone = (id: string) => {
        const next = contact.phones.filter((phone) => phone.id !== id);
        updatePhones(next.length > 0 ? next : [createEmptyPhone()]);
    };

    const storeImageFromFile = async (
        file: File,
        size: { maxWidth: number; maxHeight: number }
    ): Promise<string> => {
        const blob = await compressImageFile(file, {
            maxWidth: size.maxWidth,
            maxHeight: size.maxHeight,
            quality: 0.82,
        });
        return saveImageBlob(blob);
    };

    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) {
            return;
        }

        try {
            if (contact.photoId) {
                await deleteImage(contact.photoId);
            }
            const photoId = await storeImageFromFile(file, { maxWidth: 256, maxHeight: 256 });
            patchContact({ photoId, photoUrl: '' });
            message.success('Фото загружено');
        } catch {
            message.error('Не удалось загрузить фото');
        }
    };

    const handleClearPhoto = async () => {
        if (contact.photoId) {
            await deleteImage(contact.photoId);
        }
        patchContact({ photoId: '', photoUrl: '' });
    };

    const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) {
            return;
        }

        try {
            if (contact.coverImageId) {
                await deleteImage(contact.coverImageId);
            }
            const coverImageId = await storeImageFromFile(file, { maxWidth: 800, maxHeight: 240 });
            patchContact({ coverType: 'image', coverImageId });
            message.success('Обложка обновлена');
        } catch {
            message.error('Не удалось загрузить обложку');
        }
    };

    const handleClearCoverImage = async () => {
        if (contact.coverImageId) {
            await deleteImage(contact.coverImageId);
        }
        patchContact({ coverImageId: '', coverType: 'gradient' });
    };

    const handleClearField = (field: keyof Pick<ContactCardProps, 'fullName' | 'organization' | 'email' | 'description'>) => {
        const empty = field === 'fullName' ? DEFAULT_CONTACT_CARD_PROPS.fullName : '';
        patchContact({ [field]: empty });
    };

    return (
        <>
            <PropertySection title="Данные">
                <PropertyTextInput
                    value={contact.fullName}
                    placeholder="ФИО"
                    onChange={(event) => patchContact({ fullName: event.target.value })}
                />
                <PropertyButton variant="ghost" onClick={() => handleClearField('fullName')}>
                    Очистить имя
                </PropertyButton>

                <PropertyTextInput
                    value={contact.organization}
                    placeholder="Организация"
                    onChange={(event) => patchContact({ organization: event.target.value })}
                />
                <PropertyButton variant="ghost" onClick={() => handleClearField('organization')}>
                    Удалить организацию
                </PropertyButton>

                <PropertyTextInput
                    value={contact.email}
                    placeholder="Электронная почта"
                    onChange={(event) => patchContact({ email: event.target.value })}
                />
                <PropertyButton variant="ghost" onClick={() => handleClearField('email')}>
                    Удалить электронную почту
                </PropertyButton>

                <PropertyTextInput
                    value={contact.description}
                    placeholder="Описание"
                    onChange={(event) => patchContact({ description: event.target.value })}
                />
                <PropertyButton variant="ghost" onClick={() => handleClearField('description')}>
                    Удалить описание
                </PropertyButton>
            </PropertySection>

            <PropertySection title="Фото">
                <div className={styles.photoBlock}>
                    <span className={styles.phoneRowLabel}>
                        {contact.photoId ? 'Фото сохранено' : 'Нет фото'}
                    </span>
                    <div className={styles.phoneActions}>
                        <PropertyButton variant="outline" onClick={() => photoInputRef.current?.click()}>
                            Загрузить
                        </PropertyButton>
                        {contact.photoId ? (
                            <PropertyButton variant="danger" onClick={() => void handleClearPhoto()}>
                                Удалить фото
                            </PropertyButton>
                        ) : null}
                    </div>
                </div>
                <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className={styles.hiddenFileInput}
                    onChange={(event) => void handlePhotoUpload(event)}
                />
            </PropertySection>

            <PropertySection title="Обложка">
                <PropertySelect
                    value={contact.coverType}
                    onChange={(event) =>
                        patchContact({
                            coverType: event.target.value as ContactCardCoverType,
                        })
                    }
                    options={[
                        { value: 'gradient', label: 'Градиент (по умолчанию)' },
                        { value: 'color', label: 'Цвет' },
                        { value: 'image', label: 'Изображение' },
                    ]}
                />

                {contact.coverType === 'color' ? (
                    <PropertyColorInput
                        color={contact.coverColor}
                        hexValue={contact.coverColor}
                        onChange={(value) => patchContact({ coverColor: value })}
                    />
                ) : null}

                {contact.coverType === 'image' ? (
                    <div className={styles.phoneActions}>
                        <PropertyButton variant="outline" onClick={() => coverInputRef.current?.click()}>
                            Загрузить обложку
                        </PropertyButton>
                        {contact.coverImageId ? (
                            <PropertyButton variant="danger" onClick={() => void handleClearCoverImage()}>
                                Удалить обложку
                            </PropertyButton>
                        ) : null}
                    </div>
                ) : null}

                <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className={styles.hiddenFileInput}
                    onChange={(event) => void handleCoverUpload(event)}
                />
            </PropertySection>

            <PropertySection
                title="Телефоны"
                action={
                    <PropertyButton variant="outline" icon={<PlusOutlined />} onClick={handleAddPhone}>
                        Добавить
                    </PropertyButton>
                }
            >
                {contact.phones.map((phone, index) => (
                    <div key={phone.id} className={styles.phoneRow}>
                        <div className={styles.phoneRowHeader}>
                            <span className={styles.phoneRowLabel}>Телефон {index + 1}</span>
                            <PropertyButton
                                variant="danger"
                                icon={<DeleteOutlined />}
                                onClick={() => handleRemovePhone(phone.id)}
                            >
                                Удалить
                            </PropertyButton>
                        </div>
                        <PropertyTextInput
                            value={phone.label ?? ''}
                            placeholder="Подпись (необязательно)"
                            onChange={(event) => handlePhoneChange(phone.id, 'label', event.target.value)}
                        />
                        <PropertyTextInput
                            value={phone.number}
                            placeholder="Номер телефона"
                            onChange={(event) => handlePhoneChange(phone.id, 'number', event.target.value)}
                        />
                    </div>
                ))}
            </PropertySection>

        </>
    );
};
