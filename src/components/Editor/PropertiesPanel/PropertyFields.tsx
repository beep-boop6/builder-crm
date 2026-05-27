import type { ReactNode, SelectHTMLAttributes, InputHTMLAttributes } from 'react';
import { DeleteOutlined, LinkOutlined, RedoOutlined, SaveOutlined } from '@ant-design/icons';
import styles from './PropertiesPanel.module.css';

interface PropertyPanelHeaderProps {
    title?: string;
    subtitle?: string;
    showToolbar?: boolean;
    onSavePreset?: () => void;
    onDuplicate?: () => void;
    onDelete?: () => void;
}

export const PropertyPanelHeader = ({
    title = 'Параметры',
    subtitle,
    showToolbar,
    onSavePreset,
    onDuplicate,
    onDelete,
}: PropertyPanelHeaderProps) => (
    <div className={styles.panelHeader}>
        <div className={styles.headerMain}>
            <h2 className={styles.mainTitle}>{title}</h2>
            {subtitle && <span className={styles.componentBadge}>{subtitle}</span>}
        </div>
        {showToolbar && (
            <div className={styles.headerToolbar}>
                <button type="button" className={styles.headerIconButton} title="Привязать к сетке">
                    <LinkOutlined />
                </button>
                <button
                    type="button"
                    className={styles.headerIconButton}
                    title="Сохранить пресет"
                    onClick={onSavePreset}
                >
                    <SaveOutlined />
                </button>
                <button
                    type="button"
                    className={styles.headerIconButton}
                    title="Дублировать"
                    onClick={onDuplicate}
                >
                    <RedoOutlined />
                </button>
                <button
                    type="button"
                    className={styles.headerIconButton}
                    title="Удалить"
                    onClick={onDelete}
                >
                    <DeleteOutlined />
                </button>
            </div>
        )}
    </div>
);

interface PropertySectionProps {
    title: string;
    children: ReactNode;
    action?: ReactNode;
}

export const PropertySection = ({ title, children, action }: PropertySectionProps) => (
    <div className={styles.sectionGroup}>
        <div className={styles.sectionHeader}>
            <label className={styles.sectionTitle}>{title}</label>
            {action}
        </div>
        {children}
    </div>
);

interface PropertyTextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
    prefix?: string;
}

export const PropertyTextInput = ({ prefix, ...props }: PropertyTextInputProps) => (
    <div className={styles.inputWrapper}>
        {prefix && <span className={styles.prefix}>{prefix}</span>}
        <input {...props} className={styles.input} />
    </div>
);

interface PropertyNumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'type'> {
    prefix?: string;
}

export const PropertyNumberInput = ({ prefix, ...props }: PropertyNumberInputProps) => (
    <PropertyTextInput {...props} type="number" prefix={prefix} />
);

interface PropertyNumberRowProps {
    items: Array<{
        prefix: string;
        value: number;
        onChange: (value: number) => void;
        min?: number;
        max?: number;
        title?: string;
    }>;
}

export const PropertyNumberRow = ({ items }: PropertyNumberRowProps) => (
    <div className={styles.row}>
        {items.map((item) => (
            <PropertyNumberInput
                key={item.prefix}
                prefix={item.prefix}
                value={item.value}
                min={item.min}
                max={item.max}
                title={item.title}
                onChange={(event) => item.onChange(parseInt(event.target.value, 10) || 0)}
            />
        ))}
    </div>
);

interface PropertyColorInputProps {
    color: string;
    hexValue: string;
    onChange: (color: string) => void;
}

export const PropertyColorInput = ({ color, hexValue, onChange }: PropertyColorInputProps) => {
    const handleHexChange = (raw: string) => {
        let val = raw.replace('#', '');
        if (val.length <= 6) {
            onChange(`#${val}`);
        }
    };

    return (
        <div className={styles.colorWrapper}>
            <div className={styles.colorPickerContainer}>
                <input
                    type="color"
                    value={color}
                    onChange={(event) => onChange(event.target.value)}
                    className={styles.colorInputSquare}
                />
            </div>
            <input
                type="text"
                value={hexValue.replace('#', '').toUpperCase()}
                onChange={(event) => handleHexChange(event.target.value)}
                className={styles.hexInput}
                maxLength={6}
            />
        </div>
    );
};

interface PropertySelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
    options: Array<{ value: string; label: string }>;
}

export const PropertySelect = ({ options, ...props }: PropertySelectProps) => (
    <div className={styles.inputWrapper}>
        <select {...props} className={styles.select}>
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    </div>
);

interface PropertyButtonProps {
    children: ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'outline' | 'danger' | 'ghost';
    block?: boolean;
    disabled?: boolean;
    icon?: ReactNode;
}

export const PropertyButton = ({
    children,
    onClick,
    variant = 'outline',
    block = false,
    disabled = false,
    icon,
}: PropertyButtonProps) => (
    <button
        type="button"
        className={`${styles.propertyButton} ${styles[`button_${variant}`]} ${block ? styles.buttonBlock : ''}`}
        onClick={onClick}
        disabled={disabled}
    >
        {icon && <span className={styles.buttonIcon}>{icon}</span>}
        {children}
    </button>
);

interface PropertyAlertProps {
    type: 'info' | 'warning' | 'error';
    message: string;
}

export const PropertyAlert = ({ type, message }: PropertyAlertProps) => (
    <div className={`${styles.alert} ${styles[`alert_${type}`]}`}>
        {message}
    </div>
);

interface LayoutSectionsProps {
    component: {
        width: number;
        height: number;
        x: number;
        y: number;
        zIndex?: number;
    };
    onUpdate: (key: 'width' | 'height' | 'x' | 'y' | 'zIndex', value: number) => void;
    minWidth?: number;
    minHeight?: number;
}

export const LayoutSections = ({ component, onUpdate, minWidth = 10, minHeight = 10 }: LayoutSectionsProps) => (
    <>
        <PropertySection title="Размер">
            <PropertyNumberRow
                items={[
                    {
                        prefix: 'W',
                        value: component.width,
                        onChange: (v) => onUpdate('width', Math.max(minWidth, v)),
                        min: minWidth,
                    },
                    {
                        prefix: 'H',
                        value: component.height,
                        onChange: (v) => onUpdate('height', Math.max(minHeight, v)),
                        min: minHeight,
                    },
                ]}
            />
        </PropertySection>

        <PropertySection title="Положение">
            <PropertyNumberRow
                items={[
                    { prefix: 'X', value: component.x, onChange: (v) => onUpdate('x', v) },
                    { prefix: 'Y', value: component.y, onChange: (v) => onUpdate('y', v) },
                ]}
            />
        </PropertySection>

        <PropertySection title="Слой">
            <PropertyNumberRow
                items={[
                    {
                        prefix: 'Z',
                        value: component.zIndex ?? 1,
                        onChange: (v) => onUpdate('zIndex', v),
                        title: 'Порядок наложения',
                    },
                ]}
            />
        </PropertySection>
    </>
);

interface AppearanceSectionProps {
    borderRadius: number;
    backgroundColor: string;
    onBorderRadiusChange: (value: number) => void;
    onBackgroundColorChange: (value: string) => void;
}

export const AppearanceSection = ({
    borderRadius,
    backgroundColor,
    onBorderRadiusChange,
    onBackgroundColorChange,
}: AppearanceSectionProps) => (
    <PropertySection title="Внешний вид">
        <PropertyNumberRow
            items={[
                {
                    prefix: 'R',
                    value: borderRadius,
                    onChange: onBorderRadiusChange,
                    min: 0,
                    title: 'Скругление углов',
                },
            ]}
        />
        <PropertyColorInput
            color={backgroundColor || '#FFFFFF'}
            hexValue={(backgroundColor || '#FFFFFF').replace('#', '').toUpperCase()}
            onChange={onBackgroundColorChange}
        />
    </PropertySection>
);

interface TypographySectionProps {
    fontSize: number;
    color: string;
    onFontSizeChange: (value: number) => void;
    onColorChange: (value: string) => void;
}

export const TypographySection = ({
    fontSize,
    color,
    onFontSizeChange,
    onColorChange,
}: TypographySectionProps) => (
    <PropertySection title="Типографика">
        <PropertyNumberRow
            items={[
                {
                    prefix: 'Sz',
                    value: fontSize,
                    onChange: onFontSizeChange,
                    min: 8,
                    max: 72,
                    title: 'Размер шрифта',
                },
            ]}
        />
        <PropertyColorInput
            color={color || '#FFFFFF'}
            hexValue={(color || '#FFFFFF').replace('#', '').toUpperCase()}
            onChange={onColorChange}
        />
    </PropertySection>
);
