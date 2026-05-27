import type { CSSProperties } from 'react';
import type { EditorComponent } from '@/store/editorStore';
import { TableWidget } from '../CanvasComponents/TableWidget';
import { ChartWidget } from '../CanvasComponents/ChartWidget';
import { ContactCardWidget } from '../CanvasComponents/ContactCardWidget';
import { ButtonWidget } from '../CanvasComponents/ButtonWidget';
import styles from './ComponentLibraryPreview.module.css';

const PREVIEW_MAX_WIDTH = 260;
const PREVIEW_MAX_HEIGHT = 200;

interface ComponentLibraryPreviewProps {
    title: string;
    component: EditorComponent;
}

export const ComponentLibraryPreview = ({ title, component }: ComponentLibraryPreviewProps) => {
    const scale = Math.min(
        PREVIEW_MAX_WIDTH / component.width,
        PREVIEW_MAX_HEIGHT / component.height,
        1
    );

    const scaledWidth = component.width * scale;
    const scaledHeight = component.height * scale;

    const renderContent = () => {
        const commonStyles: CSSProperties = {
            width: '100%',
            height: '100%',
            backgroundColor: component.backgroundColor,
            borderRadius: `${component.borderRadius ?? 4}px`,
            color: component.color || '#333333',
            fontSize: `${component.fontSize ?? 14}px`,
            fontWeight: component.fontWeight ?? 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            fontFamily: 'Raleway, sans-serif',
            boxSizing: 'border-box',
        };

        if (component.type === 'button') {
            return (
                <ButtonWidget
                    component={component}
                    readonly
                    pages={[]}
                    currentPageId={null}
                    onNavigate={() => undefined}
                />
            );
        }

        if (component.type === 'table') {
            return <TableWidget componentId="preview" props={component.props || {}} />;
        }

        if (component.type === 'chart') {
            const chartProps = component.props || {};
            const fillColor =
                (chartProps.backgroundColor as string | undefined)
                ?? component.backgroundColor
                ?? '#FFFFFF';

            return (
                <ChartWidget
                    componentId="preview"
                    props={chartProps}
                    fillColor={fillColor}
                />
            );
        }

        if (component.type === 'card') {
            return <ContactCardWidget component={component} />;
        }

        if (component.type === 'form') {
            return (
                <div className={styles.formPreview}>
                    <div className={styles.formField} />
                    <div className={styles.formField} />
                    <div className={styles.formFieldShort} />
                </div>
            );
        }

        return <div style={commonStyles}>{component.text}</div>;
    };

    return (
        <div className={styles.preview}>
            <div className={styles.previewTitle}>{title}</div>
            <div
                className={styles.previewViewport}
                style={{ width: scaledWidth, height: scaledHeight }}
            >
                <div
                    className={styles.previewScaled}
                    style={{
                        width: component.width,
                        height: component.height,
                        transform: `scale(${scale})`,
                    }}
                >
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};
