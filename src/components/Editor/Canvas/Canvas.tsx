import { useEditorStore, EditorComponent } from '@/store/editorStore';
import { Rnd } from 'react-rnd';
import { useCallback, useRef, useEffect } from 'react';
import { signalrService } from '@/services/signalrService';
import { useComponentStore } from '@/store/componentStore';
import { useReusablePresetStore } from '@/store/reusablePresetStore';
import { buildComponentFromDefinition } from '@/utils/componentDefaults';
import { getComponentMinSize } from '@/utils/componentMinSize';
import styles from './Canvas.module.css';
import { TableWidget } from '../CanvasComponents/TableWidget';
import { ChartWidget } from '../CanvasComponents/ChartWidget';
import { ContactCardWidget } from '../CanvasComponents/ContactCardWidget';
import { ButtonWidget } from '../CanvasComponents/ButtonWidget';

interface CanvasProps {
    components: EditorComponent[];
    readonly?: boolean;
}

interface DraggableData {
    x: number;
    y: number;
}

export const Canvas = ({ components, readonly = false }: CanvasProps) => {
     const {
         updateComponent,
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
         projectId,
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

    const handleDragStop = useCallback((id: string, data: DraggableData) => {
        const bounds = getCanvasBounds();
        const component = components.find((c) => c.id === id);
        if (component) {
            const maxX = Math.max(0, bounds.width - component.width);
            const maxY = Math.max(0, bounds.height - component.height);
            const newX = Math.max(0, Math.min(data.x, maxX));
            const newY = Math.max(0, Math.min(data.y, maxY));
            
            updateComponent(id, { x: newX, y: newY });
            
            // Отправляем финальную позицию в базу данных через сокет
            if (projectId) {
                signalrService.saveElementPosition(id, projectId);
            }
        }
    }, [components, getCanvasBounds, projectId, updateComponent]);

    const handleResizeStop = useCallback((id: string, ref: HTMLElement, position: { x: number, y: number }) => {
        const component = components.find((c) => c.id === id);
        if (component) {
            const definition = getComponentDefinition(component.type);
            const { minWidth, minHeight } = getComponentMinSize(component, definition);
            const newWidth = Math.max(minWidth, parseInt(ref.style.width, 10));
            const newHeight = Math.max(minHeight, parseInt(ref.style.height, 10));

            updateComponent(id, { width: newWidth, height: newHeight, x: position.x, y: position.y });
            
            // Отправляем финальный размер и позицию в базу данных через сокет
            if (projectId) {
                signalrService.saveElementPosition(id, projectId);
            }
        }
    }, [components, getComponentDefinition, projectId, updateComponent]);

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
                addComponentFromSnapshot(preset.snapshot, position);
            }
            return;
        }

        const type = e.dataTransfer.getData('componentType');
        if (!type) {
            return;
        }

        const definition = getComponentDefinition(type);
        addComponent(buildComponentFromDefinition(type, definition, position));
    }, [addComponent, addComponentFromSnapshot, getComponentDefinition, getPreset, readonly]);

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
            borderRadius: `${component.borderRadius ?? 4}px`,
            color: component.color || '#ffffff',
            fontSize: `${component.fontSize ?? 14}px`,
            fontWeight: component.fontWeight ?? 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            fontFamily: 'Raleway, sans-serif'
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

        if (component.type === 'card') {
            return <ContactCardWidget component={component} />;
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
                const { minWidth, minHeight } = getComponentMinSize(component, definition);

                return (
                <Rnd
                    key={component.id}
                    size={{ width: component.width, height: component.height }}
                    position={{ x: component.x, y: component.y }}
                    onDragStop={readonly ? undefined : (_, data) => handleDragStop(component.id, data)}
                    onResizeStop={readonly ? undefined : (_e, _direction, ref, _delta, position) => handleResizeStop(component.id, ref, position)}
                    onClick={(e: React.MouseEvent) => {
                        if (readonly) {
                            return;
                        }
                        e.stopPropagation();
                        selectComponent(component.id);
                    }}
                    onContextMenu={readonly ? undefined : (e: React.MouseEvent) => handleContextMenu(e, component.id)}
                    style={{
                        border: !readonly && selectedComponentId === component.id ? '2px solid #1890ff' : '1px solid transparent',
                        boxSizing: 'border-box',
                        zIndex: component.zIndex || 1,
                    }}
                    bounds="parent"
                    minWidth={minWidth}
                    minHeight={minHeight}
                    resizeHandleStyles={{
                        bottomRight: { cursor: 'nwse-resize', width: '12px', height: '12px', background: '#1890ff', borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }
                    }}
                    disableDragging={readonly}
                    enableResizing={readonly ? false : { bottomRight: true }}
                >
                    {renderComponentContent(component)}
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
