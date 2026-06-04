import { useEditorStore, EditorComponent } from '@/store/editorStore';
import { Rnd } from 'react-rnd';
import { useCallback, useRef, useEffect } from 'react';
import { useComponentStore } from '@/store/componentStore';
import { useReusablePresetStore } from '@/store/reusablePresetStore';
import { buildComponentFromDefinition, buildComponentFromSnapshot } from '@/utils/componentDefaults';
import { clampComponentAfterResize, getComponentResizeBounds } from '@/utils/formResize';
import { isFormSearchMode, SEARCH_FORM_BORDER_RADIUS } from '@/utils/formLayout';
import styles from './Canvas.module.css';
import { TableWidget } from '../CanvasComponents/TableWidget';
import { ChartWidget } from '../CanvasComponents/ChartWidget';
import { CardWidget } from '../CanvasComponents/CardWidget';
import { ButtonWidget } from '../CanvasComponents/ButtonWidget';
import { FormWidget } from '../CanvasComponents/FormWidget';
import { FilterWidget } from '../CanvasComponents/FilterWidget';
import { isCardComponentType } from '@/utils/componentFilters';

interface CanvasProps {
    components: EditorComponent[];
    readonly?: boolean;
}

interface DraggableData {
    x: number;
    y: number;
}

const isInteractiveCanvasTarget = (target: EventTarget | null): boolean =>
    target instanceof HTMLElement &&
    Boolean(target.closest('input, textarea, button, select, a, [contenteditable="true"]'));

export const Canvas = ({ components, readonly = false }: CanvasProps) => {
    const {
        persistComponentPosition,
        selectComponent,
        selectedComponentId,
        deleteComponent,
        showContextMenu,
        hideContextMenu,
        contextMenu,
        addComponent,
        addComponentFromSnapshot,
        duplicateComponent,
        bringToFront,
        sendToBack,
        pages,
        currentPageId,
        setCurrentPage,
    } = useEditorStore();
    const getComponentDefinition = useComponentStore((state) => state.getComponentDefinition);
    const getPreset = useReusablePresetStore((state) => state.getPreset);

    const canvasRef = useRef<HTMLDivElement>(null);

    const getCanvasBounds = useCallback(() => {
        const canvasRect = canvasRef.current?.getBoundingClientRect();
        if (canvasRect) return { width: canvasRect.width, height: canvasRect.height };
        return { width: 800, height: 600 };
    }, []);

    const clampDropPosition = useCallback((
        position: { x: number; y: number },
        size: { width: number; height: number }
    ) => {
        const bounds = getCanvasBounds();
        const x = Math.max(0, Math.min(position.x - size.width / 2, bounds.width - size.width));
        const y = Math.max(0, Math.min(position.y - size.height / 2, bounds.height - size.height));
        return { x, y };
    }, [getCanvasBounds]);

    const handleDragStop = useCallback((id: string, data: DraggableData) => {
        const bounds = getCanvasBounds();
        const component = components.find((c) => c.id === id);
        if (!component) {
            return;
        }

        const maxX = Math.max(0, bounds.width - component.width);
        const maxY = Math.max(0, bounds.height - component.height);
        const newX = Math.max(0, Math.min(data.x, maxX));
        const newY = Math.max(0, Math.min(data.y, maxY));

        persistComponentPosition(id, { x: newX, y: newY });
    }, [components, getCanvasBounds, persistComponentPosition]);

    const handleResizeStop = useCallback((id: string, ref: HTMLElement, position: { x: number, y: number }) => {
        const component = components.find((c) => c.id === id);
        if (!component) {
            return;
        }

        const definition = getComponentDefinition(component.type);
        const parsedWidth = parseInt(ref.style.width, 10);
        const parsedHeight = parseInt(ref.style.height, 10);
        const { width: newWidth, height: newHeight } = clampComponentAfterResize(
            component,
            parsedWidth,
            parsedHeight,
            definition
        );

        persistComponentPosition(id, {
            width: newWidth,
            height: newHeight,
            x: position.x,
            y: position.y,
        });
    }, [components, getComponentDefinition, persistComponentPosition]);

    const handleContextMenu = useCallback((e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        selectComponent(id);
        showContextMenu(e.clientX, e.clientY);
    }, [selectComponent, showContextMenu]);

    const handleDelete = useCallback((id: string) => {
        if (window.confirm('Вы уверены, что хотите удалить этот компонент?')) {
            deleteComponent(id);
        }
        hideContextMenu();
    }, [deleteComponent, hideContextMenu]);

    const handleCanvasClick = useCallback(() => {
        selectComponent(null);
        hideContextMenu();
    }, [selectComponent, hideContextMenu]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        if (readonly) {
            return;
        }
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }, [readonly]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        if (readonly || !canvasRef.current) {
            return;
        }
        e.preventDefault();

        const bounds = canvasRef.current.getBoundingClientRect();
        const position = {
            x: e.clientX - bounds.left,
            y: e.clientY - bounds.top,
        };

        const presetId = e.dataTransfer.getData('componentPresetId');
        if (presetId) {
            const preset = getPreset(presetId);
            if (preset) {
                const built = buildComponentFromSnapshot(preset.snapshot, { x: 0, y: 0 });
                const dropPosition = clampDropPosition(position, {
                    width: built.width,
                    height: built.height,
                });
                addComponentFromSnapshot(preset.snapshot, dropPosition);
            }
            return;
        }

        const type = e.dataTransfer.getData('componentType');
        if (!type) {
            return;
        }

        const definition = getComponentDefinition(type);
        const built = buildComponentFromDefinition(type, definition, { x: 0, y: 0 });
        const dropPosition = clampDropPosition(position, {
            width: built.width,
            height: built.height,
        });
        addComponent(buildComponentFromDefinition(type, definition, dropPosition));
    }, [addComponent, addComponentFromSnapshot, clampDropPosition, getComponentDefinition, getPreset, readonly]);

    useEffect(() => {
        const handleClickOutside = () => hideContextMenu();
        if (contextMenu.visible) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [contextMenu.visible, hideContextMenu]);

    // Функция умного рендера компонента в зависимости от его типа
    const renderComponentContent = (component: EditorComponent) => {
        const commonStyles: React.CSSProperties = {
            width: '100%',
            height: '100%',
            backgroundColor: component.backgroundColor,
            borderRadius: `${component.borderRadius ?? 12}px`,
            color: component.color || '#ffffff',
            fontSize: `${component.fontSize ?? 14}px`,
            fontWeight: component.fontWeight ?? 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            fontFamily: (component.props?.fontFamily as string) || 'Raleway, sans-serif'
        };

        if (component.type === 'button') {
            return (
                <ButtonWidget
                    component={component}
                    readonly={readonly}
                    pages={pages}
                    currentPageId={currentPageId}
                    onNavigate={setCurrentPage}
                />
            );
        }

        if (component.type === 'table') {
            return (
                <TableWidget
                    componentId={component.id}
                    props={component.props || {}}
                    fontSize={component.fontSize}
                    fontWeight={component.fontWeight}
                    color={component.color}
                    fontFamily={(component.props?.fontFamily as string) || 'Raleway, sans-serif'}
                    backgroundColor={component.backgroundColor || '#FFFFFF'}
                />
            );
        }

        if (component.type === 'chart') {
            const chartProps = component.props || {};
            const fillColor =
                (chartProps.backgroundColor as string | undefined)
                ?? component.backgroundColor
                ?? '#FFFFFF';

            return (
                <ChartWidget
                    componentId={component.id}
                    props={chartProps}
                    fillColor={fillColor}
                />
            );
        }

        if (component.type === 'form') {
            return <FormWidget component={component} />;
        }

        if (component.type === 'filter') {
            return <FilterWidget component={component} showBindingStatus={!readonly} />;
        }

        if (isCardComponentType(component.type)) {
            return <CardWidget component={component} />;
        }

        return <div style={commonStyles}>{component.text}</div>;
    };

    return (
        <div
            ref={canvasRef}
            className={styles.canvas}
            onClick={readonly ? undefined : handleCanvasClick}
            onContextMenu={(e) => e.preventDefault()}
            onDragOver={readonly ? undefined : handleDragOver}
            onDrop={readonly ? undefined : handleDrop}
        >
            {components.map((component) => {
                const definition = getComponentDefinition(component.type);
                const resizeBounds = getComponentResizeBounds(component, definition);
                const { minWidth, minHeight, maxWidth, maxHeight, horizontalOnly } = resizeBounds;
                const componentProps = component.props ?? {};
                const isVisible = componentProps.visible !== false;
                const isLocked = Boolean(componentProps.locked);
                const opacity = typeof componentProps.opacity === 'number' ? componentProps.opacity : 1;
                const borderWidth = typeof componentProps.borderWidth === 'number' ? componentProps.borderWidth : 0;
                const borderColor = String(componentProps.borderColor ?? '#E8E8E8');
                const isSelected = !readonly && selectedComponentId === component.id;
                const isSearchForm = component.type === 'form' && isFormSearchMode(componentProps);
                const shellBorderRadius = isSearchForm
                    ? (component.borderRadius ?? SEARCH_FORM_BORDER_RADIUS)
                    : (component.borderRadius ?? 12);
                const shellStyle: React.CSSProperties = {
                    borderRadius: `${shellBorderRadius}px`,
                    border: 'none',
                    boxShadow: borderWidth > 0 ? `0 0 0 ${borderWidth}px ${borderColor}` : 'none',
                    outline: isSelected ? '2px solid #1890ff' : 'none',
                    outlineOffset: 0,
                    opacity: (readonly && (componentProps.disabled)) ? 0.5 : opacity,
                    pointerEvents: (readonly && (componentProps.disabled)) ? 'none' : 'auto',
                    fontFamily: (componentProps.fontFamily as string) || 'Raleway, sans-serif',
                    fontWeight: component.fontWeight ?? 500,
                    fontSize: `${component.fontSize ?? 14}px`,
                    color: component.color || '#333333',
                };

                if (!isVisible) {
                    return null;
                }

                return (
                    <Rnd
                        key={component.id}
                        size={{ width: component.width, height: component.height }}
                        position={{ x: component.x, y: component.y }}
                        onDragStop={readonly ? undefined : (_, data) => { void handleDragStop(component.id, data); }}
                        onResizeStop={readonly ? undefined : (_e, _direction, ref, _delta, position) => { void handleResizeStop(component.id, ref, position); }}
                        onDoubleClick={(e: React.MouseEvent) => {
                            if (readonly || isInteractiveCanvasTarget(e.target)) {
                                return;
                            }
                            e.stopPropagation();
                            selectComponent(component.id);
                        }}
                        onContextMenu={readonly ? undefined : (e: React.MouseEvent) => handleContextMenu(e, component.id)}
                        style={{
                            boxSizing: 'border-box',
                            zIndex: component.zIndex || 1,
                            opacity,
                            overflow: isSearchForm ? 'visible' : undefined,
                        }}
                        bounds="parent"
                        minWidth={minWidth}
                        minHeight={minHeight}
                        maxWidth={maxWidth}
                        maxHeight={maxHeight}
                        resizeHandleStyles={{
                            right: horizontalOnly
                                ? {
                                    cursor: 'ew-resize',
                                    width: '10px',
                                    height: isSearchForm ? '28px' : '40%',
                                    top: isSearchForm ? '50%' : '30%',
                                    transform: isSearchForm ? 'translateY(-50%)' : undefined,
                                    right: isSearchForm ? -5 : 0,
                                    background: '#1890ff',
                                    borderRadius: '4px 0 0 4px',
                                    border: '2px solid #fff',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                                    zIndex: 30,
                                }
                                : undefined,
                            bottomRight: !horizontalOnly
                                ? {
                                    cursor: 'nwse-resize',
                                    width: '12px',
                                    height: '12px',
                                    background: '#1890ff',
                                    borderRadius: '50%',
                                    border: '2px solid #fff',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                                }
                                : undefined,
                        }}
                        disableDragging={readonly || isLocked}
                        enableResizing={
                            readonly || isLocked
                                ? false
                                : horizontalOnly
                                    ? { right: true }
                                    : { bottomRight: true }
                        }
                    >
                        <div className={styles.componentShell} style={shellStyle}>
                            {renderComponentContent(component)}
                        </div>
                    </Rnd>
                );
            })}

            {!readonly && contextMenu.visible && selectedComponentId && (
                <div
                    className={styles.contextMenu}
                    style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 1000 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button className={styles.contextMenuItem} onClick={() => { bringToFront(selectedComponentId); hideContextMenu(); }}>На передний план</button>
                    <button className={styles.contextMenuItem} onClick={() => { sendToBack(selectedComponentId); hideContextMenu(); }}>На задний план</button>
                    <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #eee' }} />
                    <button className={styles.contextMenuItem} onClick={() => { duplicateComponent(selectedComponentId); hideContextMenu(); }}>Дублировать</button>
                    <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #eee' }} />
                    <button className={styles.contextMenuItem} onClick={() => handleDelete(selectedComponentId)} style={{ color: 'red' }}>Удалить компонент</button>
                </div>
            )}
        </div>
    );
};
