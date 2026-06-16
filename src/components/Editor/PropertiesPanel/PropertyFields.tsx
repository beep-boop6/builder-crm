import React, { useRef, useEffect, useCallback } from 'react';
import type { ReactNode, SelectHTMLAttributes, InputHTMLAttributes } from 'react';
import {
    AlignCenterOutlined,
    AlignLeftOutlined,
    AlignRightOutlined,
    CopyOutlined,
    DeleteOutlined,
    EyeInvisibleOutlined,
    EyeOutlined,
    LinkOutlined,
    SaveOutlined,
    VerticalAlignBottomOutlined,
    VerticalAlignMiddleOutlined,
    VerticalAlignTopOutlined,
} from '@ant-design/icons';
import styles from './PropertiesPanel.module.css';

/* ─────────────────────────── Panel Header ─────────────────────────── */

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
        <div className={styles.headerRow}>
            <div>
                <h2 className={styles.mainTitle}>{title}</h2>
                {subtitle && <span className={styles.componentBadge}>{subtitle}</span>}
            </div>
            {showToolbar && (
                <div className={styles.headerToolbar}>
                    <button type="button" className={styles.headerIconButton} title="Привязать к сетке">
                        <LinkOutlined />
                    </button>
                    <button type="button" className={styles.headerIconButton} title="Сохранить пресет" onClick={onSavePreset}>
                        <SaveOutlined />
                    </button>
                    <button type="button" className={styles.headerIconButton} title="Дублировать" onClick={onDuplicate}>
                        <CopyOutlined />
                    </button>
                    <button type="button" className={styles.headerIconButton} title="Удалить" onClick={onDelete}>
                        <DeleteOutlined />
                    </button>
                </div>
            )}
        </div>
    </div>
);

/* ─────────────────────────── Generic hooks ──────────────────────────── */

export const useNumberDrag = (value: number, onChange: (v: number) => void, min?: number, max?: number, step = 1) => {
    const startX = useRef(0);
    const valueRef = useRef(value);
    
    useEffect(() => { valueRef.current = value; }, [value]);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if (e.button !== 2 && e.button !== 0) return;
        if (e.button === 0 && (e.target as HTMLElement).tagName === 'INPUT') return;

        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);

        startX.current = e.clientX;
        const startVal = valueRef.current;

        const onPointerMove = (moveEvent: PointerEvent) => {
            const diffX = moveEvent.clientX - startX.current;
            let newValue = startVal + Math.round(diffX / 2) * step;
            if (min !== undefined) newValue = Math.max(min, newValue);
            if (max !== undefined) newValue = Math.min(max, newValue);
            onChange(newValue);
        };

        const onPointerUp = (upEvent: Event) => {
            try {
                if ('pointerId' in upEvent) {
                    e.currentTarget.releasePointerCapture((upEvent as PointerEvent).pointerId);
                }
            } catch (err) {
                // Ignore if capture was already lost
            }
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);
            window.removeEventListener('contextmenu', preventCtx, true);
        };

        const preventCtx = (ev: Event) => {
            ev.preventDefault();
            ev.stopPropagation();
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);
        if (e.button === 2) {
            window.addEventListener('contextmenu', preventCtx, true);
        }
    }, [onChange, min, max, step]);

    return { 
        onPointerDown: handlePointerDown, 
        onContextMenu: (e: React.MouseEvent) => {
            if ((e.target as HTMLElement).tagName !== 'INPUT') {
                e.preventDefault();
                e.stopPropagation();
            }
        }
    };
};

/* ─────────────────────────── Generic primitives ─────────────────────── */

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
        const val = raw.replace('#', '');
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

/* ─────────────────────────── Design-spec param input ──────────────── */

interface ParamInputProps {
    label: string;
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
    prefix?: string;
    disabled?: boolean;
}

const ParamInput = ({ label, value, onChange, min, max, prefix, disabled }: ParamInputProps) => {
    const dragProps = useNumberDrag(value, onChange, min, max, 1);
    
    return (
    <div className={styles.paramField}>
        <span className={styles.paramLabel}>{label}</span>
        <div className={styles.paramInputRow} {...(!disabled ? dragProps : {})} style={!disabled ? { cursor: 'ew-resize' } : {}}>
            {prefix && <span className={styles.paramInputPrefix}>{prefix}</span>}
            <input
                type="number"
                className={styles.paramInput}
                value={value}
                min={min}
                max={max}
                disabled={disabled}
                onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
            />
        </div>
    </div>
    );
};

/* ─────────────────────────── Color + opacity field ─────────────────── */

interface ColorOpacityFieldProps {
    label: string;
    color: string;
    onChange: (color: string) => void;
    onOpacityChange?: (v: number) => void;
    opacity?: number;
}

const ColorOpacityField = ({ label, color, onChange, onOpacityChange, opacity = 1 }: ColorOpacityFieldProps) => {
    const hex = color.replace('#', '').toUpperCase().slice(0, 6) || 'FFFFFF';
    const handleHex = (raw: string) => {
        const val = raw.replace('#', '').slice(0, 6);
        onChange(`#${val}`);
    };

    return (
        <div className={styles.paramField}>
            <span className={styles.paramLabel}>{label}</span>
            <div className={styles.colorOpacityRow}>
                <div className={styles.colorSwatch}>
                    <input
                        type="color"
                        value={`#${hex}`}
                        onChange={(e) => onChange(e.target.value)}
                        className={styles.colorInputSquare}
                    />
                </div>
                <input
                    type="text"
                    value={hex}
                    onChange={(e) => handleHex(e.target.value)}
                    className={styles.colorHexInline}
                    maxLength={6}
                />
                {onOpacityChange && (
                    <div className={styles.opacityField} {...useNumberDrag(Math.round(opacity * 100), (v) => onOpacityChange(v / 100), 0, 100, 1)}>
                        {Math.round(opacity * 100)}%
                    </div>
                )}
            </div>
        </div>
    );
};

/* ─────────────────────────── LayoutSections (position/size/align) ── */

const H_ALIGNS = [
    { value: 'left', icon: <AlignLeftOutlined style={{ fontSize: 15 }} />, title: 'По левому краю' },
    { value: 'center', icon: <AlignCenterOutlined style={{ fontSize: 15 }} />, title: 'По центру' },
    { value: 'right', icon: <AlignRightOutlined style={{ fontSize: 15 }} />, title: 'По правому краю' },
] as const;

const V_ALIGNS = [
    { value: 'top', icon: <VerticalAlignTopOutlined style={{ fontSize: 15 }} />, title: 'Вверх' },
    { value: 'middle', icon: <VerticalAlignMiddleOutlined style={{ fontSize: 15 }} />, title: 'По центру вертикально' },
    { value: 'bottom', icon: <VerticalAlignBottomOutlined style={{ fontSize: 15 }} />, title: 'Вниз' },
] as const;

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
    maxWidth?: number;
    maxHeight?: number;
    lockHeight?: boolean;
    opacity?: number;
    textAlign?: string;
    verticalAlign?: string;
    onOpacityChange?: (v: number) => void;
    onTextAlignChange?: (v: string) => void;
    onVerticalAlignChange?: (v: string) => void;
    hideAlignment?: boolean;
    hideHorizontalAlign?: boolean;
    hideVerticalAlign?: boolean;
}

export const LayoutSections = ({
    component,
    onUpdate,
    minWidth = 10,
    minHeight = 10,
    maxWidth,
    maxHeight,
    lockHeight = false,
    opacity = 1,
    textAlign = 'left',
    verticalAlign = 'top',
    onOpacityChange,
    onTextAlignChange,
    onVerticalAlignChange,
    hideAlignment = false,
    hideHorizontalAlign = false,
    hideVerticalAlign = false,
}: LayoutSectionsProps) => {
    const showHorizontalAlign = !hideAlignment && !hideHorizontalAlign && Boolean(onTextAlignChange);
    const showVerticalAlign = !hideAlignment && !hideVerticalAlign && Boolean(onVerticalAlignChange);
    const showAlignment = showHorizontalAlign || showVerticalAlign;
    const clampW = (v: number) => {
        let n = Math.max(minWidth, v);
        if (typeof maxWidth === 'number') n = Math.min(maxWidth, n);
        return n;
    };
    const clampH = (v: number) => {
        let n = Math.max(minHeight, v);
        if (typeof maxHeight === 'number') n = Math.min(maxHeight, n);
        return n;
    };

    return (
        <div className={styles.paramsBlock}>
            {/* Row 1: Position + Size */}
            <div className={styles.params2col}>
                {/* Position */}
                <div className={styles.paramGroup}>
                    <span className={styles.paramGroupLabel}>Положение</span>
                    <div className={styles.paramPair}>
                        <div className={styles.paramInputRow}>
                            <span className={styles.paramInputPrefix}>X</span>
                            <input
                                type="number"
                                className={styles.paramInput}
                                value={component.x}
                                onChange={(e) => onUpdate('x', parseInt(e.target.value, 10) || 0)}
                            />
                        </div>
                        <div className={styles.paramInputRow}>
                            <span className={styles.paramInputPrefix}>Y</span>
                            <input
                                type="number"
                                className={styles.paramInput}
                                value={component.y}
                                onChange={(e) => onUpdate('y', parseInt(e.target.value, 10) || 0)}
                            />
                        </div>
                    </div>
                </div>

                {/* Size */}
                <div className={styles.paramGroup}>
                    <div className={styles.paramGroupLabelRow}>
                        <span className={styles.paramGroupLabel}>Размер</span>
                        <LinkOutlined className={styles.paramGroupIcon} title="Сохранить пропорции" />
                    </div>
                    <div className={styles.paramPair}>
                        <div className={styles.paramInputRow}>
                            <span className={styles.paramInputPrefix}>W</span>
                            <input
                                type="number"
                                className={styles.paramInput}
                                value={component.width}
                                min={minWidth}
                                onChange={(e) => onUpdate('width', clampW(parseInt(e.target.value, 10) || minWidth))}
                            />
                        </div>
                        {!lockHeight ? (
                            <div className={styles.paramInputRow}>
                                <span className={styles.paramInputPrefix}>H</span>
                                <input
                                    type="number"
                                    className={styles.paramInput}
                                    value={component.height}
                                    min={minHeight}
                                    onChange={(e) => onUpdate('height', clampH(parseInt(e.target.value, 10) || minHeight))}
                                />
                            </div>
                        ) : (
                            <div className={styles.paramInputRow}>
                                <span className={styles.paramInputPrefix}>H</span>
                                <input
                                    type="number"
                                    className={`${styles.paramInput} ${styles.paramInputLocked}`}
                                    value={component.height}
                                    disabled
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Row 2: Alignment + Opacity */}
            <div className={styles.params2col}>
                {/* Alignment */}
                {showAlignment && (
                    <div className={styles.paramGroup}>
                        <span className={styles.paramGroupLabel}>Выравнивание</span>
                        <div className={styles.alignRow}>
                            {showHorizontalAlign
                                ? H_ALIGNS.map((a) => (
                                    <button
                                        key={a.value}
                                        type="button"
                                        title={a.title}
                                        className={`${styles.alignBtn} ${textAlign === a.value ? styles.alignBtnActive : ''}`}
                                        onClick={() => onTextAlignChange?.(a.value)}
                                    >
                                        {a.icon}
                                    </button>
                                ))
                                : null}
                            {showVerticalAlign
                                ? V_ALIGNS.map((a) => (
                                    <button
                                        key={a.value}
                                        type="button"
                                        title={a.title}
                                        className={`${styles.alignBtn} ${verticalAlign === a.value ? styles.alignBtnActive : ''}`}
                                        onClick={() => onVerticalAlignChange?.(a.value)}
                                    >
                                        {a.icon}
                                    </button>
                                ))
                                : null}
                        </div>
                    </div>
                )}

                {/* Opacity */}
                <div className={styles.paramGroup}>
                    <span className={styles.paramGroupLabel}>Прозрачность</span>
                    <div 
                        className={styles.paramInputRow}
                        {...useNumberDrag(Math.round(opacity * 100), (v) => onOpacityChange?.(v / 100), 0, 100, 1)}
                        style={{ cursor: 'ew-resize' }}
                    >
                        <span
                            className={styles.opacitySquare}
                            style={{ opacity }}
                        />
                        <input
                            type="number"
                            className={styles.paramInput}
                            value={Math.round(opacity * 100)}
                            min={0}
                            max={100}
                            onChange={(e) => onOpacityChange?.((parseInt(e.target.value, 10) || 0) / 100)}
                        />
                        <span className={styles.paramInputSuffix}>%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ─────────────────────────── Border / Appearance section ───────────── */

interface BorderSectionProps {
    enabled: boolean;
    borderColor: string;
    borderWidth: number;
    backgroundColor: string;
    borderRadius: number;
    hideBackgroundColor?: boolean;
    onEnabledChange: (v: boolean) => void;
    onBorderColorChange: (v: string) => void;
    onBorderWidthChange: (v: number) => void;
    onBackgroundColorChange: (v: string) => void;
    onBorderRadiusChange: (v: number) => void;
}

export const BorderSection = ({
    enabled,
    borderColor,
    borderWidth,
    backgroundColor,
    borderRadius,
    hideBackgroundColor = false,
    onEnabledChange,
    onBorderColorChange,
    onBorderWidthChange,
    onBackgroundColorChange,
    onBorderRadiusChange,
}: BorderSectionProps) => (
    <div className={styles.blockSection}>
        <div className={styles.blockHeader}>
            <span className={styles.blockTitle}>Рамка</span>
            <div className={styles.blockActions}>
                <button
                    type="button"
                    className={styles.blockIconBtn}
                    title={enabled ? 'Скрыть рамку' : 'Показать рамку'}
                    onClick={() => onEnabledChange(!enabled)}
                >
                    {enabled ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                </button>
            </div>
        </div>

        <div className={styles.params2col}>
            <ColorOpacityField
                label="Цвет"
                color={borderColor || '#155DA4'}
                onChange={onBorderColorChange}
            />
            <ParamInput
                label="Толщина"
                value={enabled ? Math.max(1, borderWidth) : 0}
                onChange={onBorderWidthChange}
                min={0}
                max={20}
                prefix="≡"
                disabled={!enabled}
            />
            {!hideBackgroundColor ? (
                <ColorOpacityField
                    label="Цвет фона"
                    color={backgroundColor || '#FFFFFF'}
                    onChange={onBackgroundColorChange}
                />
            ) : null}
            <ParamInput
                label="Закругление"
                value={borderRadius}
                onChange={onBorderRadiusChange}
                min={0}
                max={64}
                prefix="⌐"
            />
        </div>
    </div>
);

/* ─────────────────────────── Text / Typography section ─────────────── */

const FONT_OPTIONS = [
    { value: 'Raleway', label: 'Raleway' },
    { value: 'Inter', label: 'Inter' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'monospace', label: 'Моноширинный' },
];

interface TextSectionProps {
    fontFamily: string;
    fontSize: number;
    fontWeight: number;
    color: string;
    onFontFamilyChange: (v: string) => void;
    onFontSizeChange: (v: number) => void;
    onFontWeightChange: (v: number) => void;
    onColorChange: (v: string) => void;
}

export const TextSection = ({
    fontFamily,
    fontSize,
    fontWeight,
    color,
    onFontFamilyChange,
    onFontSizeChange,
    onFontWeightChange,
    onColorChange,
}: TextSectionProps) => (
    <div className={styles.blockSection}>
        <div className={styles.blockHeader}>
            <span className={styles.blockTitle}>Текст</span>
        </div>

        <div className={styles.params2col}>
            {/* Font family */}
            <div className={styles.paramField}>
                <span className={styles.paramLabel}>Шрифт</span>
                <div className={styles.paramSelectRow}>
                    <select
                        className={styles.paramSelect}
                        value={fontFamily}
                        onChange={(e) => onFontFamilyChange(e.target.value)}
                    >
                        {FONT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Color */}
            <ColorOpacityField
                label="Цвет"
                color={color || '#000000'}
                onChange={onColorChange}
            />

            {/* Weight */}
            <ParamInput
                label="Толщина"
                value={fontWeight}
                onChange={onFontWeightChange}
                min={100}
                max={900}
                prefix="≡"
            />

            {/* Size */}
            <ParamInput
                label="Размер"
                value={fontSize}
                onChange={onFontSizeChange}
                min={8}
                max={128}
                prefix="↑"
            />
        </div>
    </div>
);

/* ─────────────────────────── Behavior section ──────────────────────── */

interface BehaviorSectionProps {
    visible: boolean;
    locked: boolean;
    onVisibleChange: (value: boolean) => void;
    onLockedChange: (value: boolean) => void;
}

export const BehaviorSection = ({
    visible,
    locked,
    onVisibleChange,
    onLockedChange,
}: BehaviorSectionProps) => (
    <PropertySection title="Поведение">
        <label className={styles.checkboxRow}>
            <input
                type="checkbox"
                checked={visible}
                onChange={(event) => onVisibleChange(event.target.checked)}
            />
            <span className={styles.checkboxLabel}>Видимый</span>
        </label>
        <label className={styles.checkboxRow}>
            <input
                type="checkbox"
                checked={locked}
                onChange={(event) => onLockedChange(event.target.checked)}
            />
            <span className={styles.checkboxLabel}>Закрепить (без перемещения)</span>
        </label>
    </PropertySection>
);

/* ─────────────────── Legacy compat: AppearanceSection ──────────────── */

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

/* ─────────────────── Legacy compat: TypographySection ──────────────── */

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

/* ─────────── Legacy compat: ExtendedAppearanceSection ──────────────── */

interface ExtendedAppearanceSectionProps extends AppearanceSectionProps {
    opacity: number;
    borderColor: string;
    borderWidth: number;
    borderEnabled: boolean;
    onOpacityChange: (value: number) => void;
    onBorderColorChange: (value: string) => void;
    onBorderEnabledChange: (enabled: boolean) => void;
    onBorderWidthChange: (value: number) => void;
}

export const ExtendedAppearanceSection = ({
    borderRadius,
    backgroundColor,
    borderColor,
    borderWidth,
    borderEnabled,
    opacity: _opacity,
    onBorderRadiusChange,
    onBackgroundColorChange,
    onBorderColorChange,
    onBorderEnabledChange,
    onBorderWidthChange,
}: ExtendedAppearanceSectionProps) => (
    <BorderSection
        enabled={borderEnabled}
        borderColor={borderColor}
        borderWidth={borderWidth}
        backgroundColor={backgroundColor}
        borderRadius={borderRadius}
        onEnabledChange={onBorderEnabledChange}
        onBorderColorChange={onBorderColorChange}
        onBorderWidthChange={onBorderWidthChange}
        onBackgroundColorChange={onBackgroundColorChange}
        onBorderRadiusChange={onBorderRadiusChange}
    />
);
