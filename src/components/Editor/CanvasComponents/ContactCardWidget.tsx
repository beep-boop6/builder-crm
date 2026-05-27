import type { CSSProperties } from 'react';
import { useMemo } from 'react';
import { Card, Avatar, Typography } from 'antd';
import {
    BankOutlined,
    MailOutlined,
    PhoneOutlined,
    UserOutlined,
} from '@ant-design/icons';
import type { EditorComponent } from '@/store/editorStore';
import { useStoredImage } from '@/hooks/useStoredImage';
import { getAdaptivePalette, isDarkColor, normalizeHexColor } from '@/utils/colorContrast';
import { normalizeContactCardProps } from '@/utils/contactCardDefaults';
import styles from './ContactCardWidget.module.css';

const { Text, Paragraph } = Typography;

interface ContactCardWidgetProps {
    component: EditorComponent;
}

const rowJustify = (align: 'left' | 'center' | 'right'): CSSProperties['justifyContent'] => {
    if (align === 'center') return 'center';
    if (align === 'right') return 'flex-end';
    return 'flex-start';
};

export const ContactCardWidget = ({ component }: ContactCardWidgetProps) => {
    const contact = normalizeContactCardProps(component.props);
    const fontSize = component.fontSize ?? 14;
    const borderRadius = component.borderRadius ?? 8;
    const backgroundColor = component.backgroundColor ?? '#FFFFFF';

    const avatarUrl = useStoredImage(contact.photoId, contact.photoUrl);
    const coverImageUrl = useStoredImage(
        contact.coverType === 'image' ? contact.coverImageId : undefined
    );

    const bodyPalette = useMemo(
        () => getAdaptivePalette(backgroundColor),
        [backgroundColor]
    );

    const coverPalette = useMemo(() => {
        if (contact.coverType === 'color') {
            return getAdaptivePalette(contact.coverColor);
        }
        if (contact.coverType === 'image' && coverImageUrl) {
            return getAdaptivePalette('#2A2A2A');
        }
        return getAdaptivePalette('#0E4A85');
    }, [contact.coverType, contact.coverColor, coverImageUrl]);

    const coverStyle = useMemo((): CSSProperties => {
        if (contact.coverType === 'color') {
            return { background: normalizeHexColor(contact.coverColor, '#155DA4') };
        }
        if (contact.coverType === 'image' && coverImageUrl) {
            return {
                backgroundImage: `url(${coverImageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            };
        }
        return {};
    }, [contact.coverType, contact.coverColor, coverImageUrl]);

    const textStyle: CSSProperties = {
        fontSize,
        color: bodyPalette.text,
        textAlign: contact.textAlign,
    };

    const filledPhones = contact.phones.filter((phone) => phone.number.trim());
    const cardBorderColor = isDarkColor(backgroundColor)
        ? 'rgba(255, 255, 255, 0.12)'
        : 'rgba(0, 0, 0, 0.08)';

    return (
        <div className={styles.wrapper}>
            <Card
                className={styles.card}
                bordered
                hoverable={false}
                style={{
                    borderRadius,
                    backgroundColor,
                    borderColor: cardBorderColor,
                    height: '100%',
                }}
                styles={{
                    body: { textAlign: contact.textAlign },
                }}
                cover={
                    <div
                        className={`${styles.cover} ${contact.coverType === 'gradient' ? styles.coverGradient : ''}`}
                        style={coverStyle}
                    >
                        <div className={styles.avatarWrap}>
                            <Avatar
                                className={styles.avatar}
                                size={72}
                                src={avatarUrl || undefined}
                                icon={!avatarUrl ? <UserOutlined /> : undefined}
                                style={{
                                    borderColor: coverPalette.avatarBorder,
                                    backgroundColor: coverPalette.avatarBg,
                                    color: coverPalette.avatarIcon,
                                }}
                            />
                        </div>
                    </div>
                }
            >
                <div className={styles.body} style={textStyle}>
                    <Typography.Title
                        level={5}
                        className={styles.name}
                        style={{ fontSize: fontSize + 4, color: bodyPalette.text }}
                    >
                        {contact.fullName || (
                            <span className={styles.emptyHint} style={{ color: bodyPalette.muted }}>
                                Имя
                            </span>
                        )}
                    </Typography.Title>

                    {contact.organization ? (
                        <div
                            className={styles.metaRow}
                            style={{ justifyContent: rowJustify(contact.textAlign) }}
                        >
                            <BankOutlined className={styles.metaIcon} style={{ color: bodyPalette.icon }} />
                            <Text style={{ fontSize, color: bodyPalette.accent, fontWeight: 600 }}>
                                {contact.organization}
                            </Text>
                        </div>
                    ) : null}

                    {filledPhones.map((phone) => (
                        <div
                            key={phone.id}
                            className={styles.metaRow}
                            style={{ justifyContent: rowJustify(contact.textAlign) }}
                        >
                            <PhoneOutlined className={styles.metaIcon} style={{ color: bodyPalette.icon }} />
                            <Text style={{ fontSize, color: bodyPalette.text }}>
                                {phone.label ? `${phone.label}: ` : ''}
                                {phone.number}
                            </Text>
                        </div>
                    ))}

                    {contact.email ? (
                        <div
                            className={styles.metaRow}
                            style={{ justifyContent: rowJustify(contact.textAlign) }}
                        >
                            <MailOutlined className={styles.metaIcon} style={{ color: bodyPalette.icon }} />
                            <Text style={{ fontSize, color: bodyPalette.text }}>{contact.email}</Text>
                        </div>
                    ) : null}

                    {contact.description ? (
                        <Paragraph
                            className={styles.description}
                            style={{
                                fontSize,
                                color: bodyPalette.muted,
                                textAlign: contact.textAlign,
                            }}
                        >
                            {contact.description}
                        </Paragraph>
                    ) : null}
                </div>
            </Card>
        </div>
    );
};
