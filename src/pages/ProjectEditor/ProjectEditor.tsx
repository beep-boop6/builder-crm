import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Alert, message } from 'antd';
import { useProjectStore } from '@/store/projectStore';
import { useEditorStore } from '@/store/editorStore';
import { signalrService } from '@/services/signalrService';
import { Canvas } from '@/components/Editor/Canvas/Canvas';
import { EditorSidebar } from '@/components/Editor/Sidebar/EditorSidebar';
import { PropertiesPanel } from '@/components/Editor/PropertiesPanel/PropertiesPanel';
import { InstrumentsLibrary } from '@/components/Editor/InstrumentsLibrary/InstrumentsLibrary';
import { PagesPanel } from '@/components/Editor/PagesPanel/PagesPanel';
import styles from './ProjectEditor.module.css';

const ProjectEditorPage = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const isPreview = location.pathname.endsWith('/preview');
    const { currentProject, loadProject, loading, error } = useProjectStore();
    const {
        components,
        initProject,
        saveToProject,
        undo,
        redo,
        past,
        future,
        saving,
        saveError,
        clearSaveError,
        updateElementFromSocket,
        deleteElementFromSocket
    } = useEditorStore();

    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [isPagesOpen, setIsPagesOpen] = useState(false);

    useEffect(() => {
        if (projectId) loadProject(projectId);
    }, [projectId, loadProject]);

    useEffect(() => {
        if (currentProject) {
            initProject(currentProject.id, currentProject.pages || [], currentProject.components);
        }
    }, [currentProject, initProject]);

    useEffect(() => {
        if (!currentProject || isPreview) return;
        const timer = setTimeout(() => saveToProject(), 1000); 
        return () => clearTimeout(timer);
    }, [components, currentProject, isPreview, saveToProject]);

    // ИНИЦИАЛИЗАЦИЯ SIGNALR
    useEffect(() => {
        if (isPreview) {
            return;
        }

        const initRealtime = async () => {
            await signalrService.startConnection();

            signalrService.onReceiveNewState((elementId, json) => {
                updateElementFromSocket(elementId, json);
            });

            signalrService.onDeleteElement((elementId) => {
                deleteElementFromSocket(elementId);
            });
        };

        initRealtime();

        return () => {
            signalrService.stopConnection();
        };
    }, [isPreview, updateElementFromSocket, deleteElementFromSocket]);

    const handleManualSave = async () => {
        try {
            await saveToProject();
            message.success('Проект успешно сохранён');
        } catch {
            // Ошибка уже показана в store/interceptor
        }
    };

    if (loading && !currentProject) {
        return <div className={styles.editorContainer}>Загрузка проекта...</div>;
    }

    if (error) {
        return (
            <div className={styles.editorContainer} style={{ padding: 24 }}>
                <Alert
                    type="error"
                    message="Не удалось загрузить проект"
                    description={error}
                    showIcon
                />
            </div>
        );
    }

    return (
        <div className={styles.editorContainer}>
            {!isPreview && (
                <EditorSidebar
                    onToggleLibrary={() => { setIsLibraryOpen(!isLibraryOpen); setIsPagesOpen(false); }}
                    onTogglePages={() => { setIsPagesOpen(!isPagesOpen); setIsLibraryOpen(false); }}
                />
            )}
            
            <div className={styles.workspaceWrapper} style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative' }}>
                {!isPreview && (
                    <>
                        <InstrumentsLibrary isOpen={isLibraryOpen} />
                        <PagesPanel isOpen={isPagesOpen} />
                    </>
                )}
                
                <div className={styles.topPanel} style={{ 
                    height: '50px', background: '#fff', borderBottom: '1px solid #e0e0e0',
                    display: 'flex', alignItems: 'center', padding: '0 20px', gap: '12px', zIndex: 10
                }}>
                    {saveError && !isPreview && (
                        <Alert
                            type="error"
                            message={saveError}
                            showIcon
                            closable
                            onClose={clearSaveError}
                            style={{ flex: 1, padding: '4px 12px' }}
                        />
                    )}
                    {isPreview ? (
                        <button onClick={() => navigate(`/builder/${projectId}`)} style={btnStyle}>Вернуться в редактор</button>
                    ) : (
                        <>
                            <button onClick={handleManualSave} disabled={saving} style={{...btnStyle, opacity: saving ? 0.6 : 1}}>
                                {saving ? 'Сохранение...' : 'Сохранить'}
                            </button>
                            <button onClick={undo} disabled={past.length === 0} style={{...btnStyle, opacity: past.length === 0 ? 0.5 : 1}}>Отменить</button>
                            <button onClick={redo} disabled={future.length === 0} style={{...btnStyle, opacity: future.length === 0 ? 0.5 : 1}}>Повторить</button>
                            <button onClick={() => navigate(`/builder/${projectId}/preview`)} style={btnStyle}>Предпросмотр</button>
                        </>
                    )}
                </div>

                <div className={styles.canvasWrapper} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                    <Canvas components={components} readonly={isPreview}/>
                </div>
            </div>

            {!isPreview && currentProject && (
                <div className={styles.propertiesPanelWrapper}>
                    <PropertiesPanel />
                </div>
            )}
        </div>
    );
};

const btnStyle = {
    padding: '6px 14px', borderRadius: '6px', border: '1px solid #155DA4',
    background: '#fff', color: '#155DA4', cursor: 'pointer', fontWeight: 500,
    fontSize: '14px', transition: 'all 0.2s'
};

export default ProjectEditorPage;
