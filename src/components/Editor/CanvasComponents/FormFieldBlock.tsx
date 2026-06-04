import { useCallback, useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { InputNumber } from 'antd';
import type { FormFieldDefinition } from '@/types/form';
import { MAX_FORM_FIELD_WIDTH, MIN_FORM_FIELD_WIDTH } from '@/utils/formLayout';
import styles from './FormWidget.module.css';

interface FormFieldBlockProps {
    field: FormFieldDefinition;
    isFormSelected: boolean;
    isEditing: boolean;
    textAlignStyle: CSSProperties;
    inputFontStyle: CSSProperties;
    fieldWidthStyle: CSSProperties;
    onBeginEdit: () => void;
    onEndEdit: () => void;
    onUpdateField: (patch: Partial<FormFieldDefinition>) => void;
    children: ReactNode;
}

const stopCanvasBubble = (event: React.SyntheticEvent) => {
    event.stopPropagation();
};

export const FormFieldBlock = ({
    field,
    isFormSelected,
    isEditing,
    textAlignStyle,
    inputFontStyle,
    fieldWidthStyle,
    onBeginEdit,
    onEndEdit,
    onUpdateField,
    children,
}: FormFieldBlockProps) => {
    const fieldRef = useRef<HTMLDivElement>(null);
    const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);

    useEffect(() => {
        if (!isEditing) {
            return;
        }
        const onPointerDown = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            if (!target || fieldRef.current?.contains(target)) {
                return;
            }
            onEndEdit();
        };
        document.addEventListener('mousedown', onPointerDown, true);
        return () => document.removeEventListener('mousedown', onPointerDown, true);
    }, [isEditing, onEndEdit]);

    const handleResizeStart = useCallback(
        (event: React.MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
            const currentWidth = field.fieldWidth ?? fieldRef.current?.offsetWidth ?? MIN_FORM_FIELD_WIDTH;
            resizeRef.current = { startX: event.clientX, startWidth: currentWidth };

            const onMove = (moveEvent: MouseEvent) => {
                if (!resizeRef.current) {
                    return;
                }
                const delta = moveEvent.clientX - resizeRef.current.startX;
                const next = Math.min(
                    MAX_FORM_FIELD_WIDTH,
                    Math.max(MIN_FORM_FIELD_WIDTH, Math.round(resizeRef.current.startWidth + delta))
                );
                onUpdateField({ fieldWidth: next });
            };

            const onUp = () => {
                resizeRef.current = null;
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
            };

            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
        },
        [field.fieldWidth, onUpdateField]
    );

    const handleActivateEdit = (event: React.MouseEvent) => {
        event.stopPropagation();
        if (!isFormSelected) {
            return;
        }
        if (isEditing) {
            onEndEdit();
            return;
        }
        onBeginEdit();
    };

    const inputSize = field.inputFontSize ?? 14;

    return (
        <div
            ref={fieldRef}
            className={`${styles.field} ${isEditing ? styles.fieldEditing : ''}`}
            style={{ ...textAlignStyle, ...fieldWidthStyle }}
            onDoubleClick={handleActivateEdit}
        >
            {isEditing ? (
                <div
                    className={styles.fieldEditToolbar}
                    onMouseDown={stopCanvasBubble}
                    onClick={stopCanvasBubble}
                >
                    <span className={styles.fieldEditToolbarLabel}>Шрифт</span>
                    <InputNumber
                        size="small"
                        min={10}
                        max={32}
                        value={inputSize}
                        onChange={(value) => {
                            if (value === null) {
                                return;
                            }
                            onUpdateField({ inputFontSize: value });
                        }}
                    />
                    <span className={styles.fieldEditToolbarHint}>Двойной клик — выход</span>
                </div>
            ) : null}

            <label
                className={styles.fieldLabel}
                style={textAlignStyle}
                onDoubleClick={handleActivateEdit}
            >
                {field.label}
                {field.required ? ' *' : ''}
            </label>

            <div
                className={styles.fieldControl}
                style={inputFontStyle}
                onDoubleClick={handleActivateEdit}
            >
                {children}
            </div>

            {isEditing ? (
                <button
                    type="button"
                    className={styles.fieldResizeHandle}
                    title="Изменить ширину поля"
                    onMouseDown={handleResizeStart}
                />
            ) : null}
        </div>
    );
};
