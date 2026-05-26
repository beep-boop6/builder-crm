import { useEditorStore, EditorComponent } from '@/store/editorStore';
import { Rnd } from 'react-rnd';
import { useCallback, useRef, useEffect } from 'react';
import { signalrService } from '@/services/signalrService';
import styles from './Canvas.module.css';
import { TableWidget } from '../CanvasComponents/TableWidget';

interface CanvasProps {
    components: EditorComponent[];
}

interface DraggableData {
    x: number;
    y: number;
}

const MIN_WIDTH = 50;
const MIN_HEIGHT = 30;

export const Canvas = ({ components }: CanvasProps) => {
    const {
        updateComponent,
        selectComponent,
        selectedComponentId,
        deleteComponent,
        showContextMenu,
        hideContextMenu,
        contextMenu,
        addComponent,
        bringToFront,
        sendToBack,
    } = useEditorStore();
    
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
            signalrService.saveElementPosition(id);
        }
    }, [components, updateComponent, getCanvasBounds]);

    const handleResizeStop = useCallback((id: string, ref: HTMLElement, position: { x: number, y: number }) => {
        const component = components.find((c) => c.id === id);
        if (component) {
            const newWidth = Math.max(MIN_WIDTH, parseInt(ref.style.width, 10));
            const newHeight = Math.max(MIN_HEIGHT, parseInt(ref.style.height, 10));
            
            updateComponent(id, { width: newWidth, height: newHeight, x: position.x, y: position.y });
            
            // Отправляем финальный размер и позицию в базу данных через сокет
            signalrService.saveElementPosition(id);
        }
    }, [components, updateComponent]);

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
        e.preventDefault(); 
        e.dataTransfer.dropEffect = 'copy';
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('componentType');
        if (!type || !canvasRef.current) return;

        const bounds = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - bounds.left;
        const y = e.clientY - bounds.top;

        const defaultProps = {
            button: { width: 140, height: 45, text: 'Кнопка', backgroundColor: '#155DA4', color: '#ffffff', borderRadius: 8 },
            table: { width: 400, height: 250, text: 'Таблица данных', backgroundColor: '#ffffff', color: '#000000', borderRadius: 4 },
            placeholder: { width: 200, height: 100, text: 'Новый элемент', backgroundColor: '#f0f0f0', color: '#333333', borderRadius: 4 }
        };

        const props = defaultProps[type as keyof typeof defaultProps] || defaultProps.placeholder;

        addComponent({ type, x, y, ...props });
    }, [addComponent]);

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
                <button style={{ ...commonStyles, border: 'none', cursor: 'pointer' }}>
                    {component.text}
                </button>
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

        return <div style={commonStyles}>{component.text}</div>;
    };

    return (
        <div 
            ref={canvasRef}
            className={styles.canvas}
            onClick={handleCanvasClick}
            onContextMenu={(e) => e.preventDefault()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {components.map((component) => (
                <Rnd
                    key={component.id}
                    size={{ width: component.width, height: component.height }}
                    position={{ x: component.x, y: component.y }}
                    onDragStop={(_, data) => handleDragStop(component.id, data)}
                    onResizeStop={(_e, _direction, ref, _delta, position) => handleResizeStop(component.id, ref, position)}
                    onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        selectComponent(component.id);
                    }}
                    onContextMenu={(e: React.MouseEvent) => handleContextMenu(e, component.id)}
                    style={{
                        border: selectedComponentId === component.id ? '2px solid #1890ff' : '1px solid transparent',
                        boxSizing: 'border-box',
                        zIndex: component.zIndex || 1,
                    }}
                    bounds="parent"
                    minWidth={MIN_WIDTH}
                    minHeight={MIN_HEIGHT}
                    resizeHandleStyles={{
                        bottomRight: { cursor: 'nwse-resize', width: '12px', height: '12px', background: '#1890ff', borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }
                    }}
                    enableResizing={{ bottomRight: true }}
                >
                    {renderComponentContent(component)}
                </Rnd>
            ))}

            {contextMenu.visible && selectedComponentId && (
                <div
                    className={styles.contextMenu}
                    style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 1000 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button className={styles.contextMenuItem} onClick={() => { bringToFront(selectedComponentId); hideContextMenu(); }}>На передний план</button>
                    <button className={styles.contextMenuItem} onClick={() => { sendToBack(selectedComponentId); hideContextMenu(); }}>На задний план</button>
                    <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #eee' }} />
                    <button className={styles.contextMenuItem} onClick={() => handleDelete(selectedComponentId)} style={{ color: 'red' }}>Удалить компонент</button>
                </div>
            )}
        </div>
    );
};
