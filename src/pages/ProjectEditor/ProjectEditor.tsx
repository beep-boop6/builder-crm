import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Alert, message } from 'antd';
import { useProjectStore } from '@/store/projectStore';
import { useEditorStore } from '@/store/editorStore';
import { signalrService } from '@/services/signalrService';
import { Canvas } from '@/components/Editor/Canvas/Canvas';
import { EditorSidebar } from '@/components/Editor/Sidebar/EditorSidebar';
import { EditorHeader } from '@/components/Editor/Header/EditorHeader';
import { PropertiesPanel } from '@/components/Editor/PropertiesPanel/PropertiesPanel';
import { InstrumentsLibrary } from '@/components/Editor/InstrumentsLibrary/InstrumentsLibrary';
import { PagesPanel } from '@/components/Editor/PagesPanel/PagesPanel';
import { SaveProjectTemplateModal } from '@/components/Editor/SaveProjectTemplateModal';
import { useTemplateStore } from '@/store/templateStore';
import { mergeCurrentPageComponents } from '@/utils/projectSnapshot';
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
        deleteElementFromSocket,
        pages,
        currentPageId,
    } = useEditorStore();
    const saveFromProject = useTemplateStore((state) => state.saveFromProject);

    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [isPagesOpen, setIsPagesOpen] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

    useEffect(() => {
        if (projectId) loadProject(projectId);
    }, [projectId, loadProject]);

    useEffect(() => {
        if (currentProject) {
            initProject(currentProject.id, currentProject.pages || [], currentProject.components);
        }
    }, [currentProject, initProject]);

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

    const handlePreview = () => {
        navigate(`/builder/${projectId}/preview`);
    };

    const handleSaveAsTemplate = async (values: { name: string; type: string }) => {
        if (!currentProject) {
            return;
        }

        try {
            await saveToProject();
            const snapshotPages = mergeCurrentPageComponents(pages, currentPageId, components);
            saveFromProject({
                name: values.name,
                type: values.type,
                pages: snapshotPages,
                navigationType: currentProject.navigationType,
                sourceProjectId: currentProject.id,
            });
            setIsTemplateModalOpen(false);
            message.success('Шаблон сохранён');
        } catch {
            message.error('Не удалось сохранить шаблон');
        }
    };

    const projectName = currentProject?.name ?? 'Без названия';

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
                    onToggleLibrary={() => {
                        setIsLibraryOpen(!isLibraryOpen);
                        setIsPagesOpen(false);
                    }}
                    onTogglePages={() => {
                        setIsPagesOpen(!isPagesOpen);
                        setIsLibraryOpen(false);
                    }}
                    onSave={handleManualSave}
                    onSaveAsTemplate={() => setIsTemplateModalOpen(true)}
                    onPreview={handlePreview}
                    isLibraryOpen={isLibraryOpen}
                    isPagesOpen={isPagesOpen}
                    saving={saving}
                />
            )}

            <div className={styles.editorMain}>
                <EditorHeader
                    projectName={projectName}
                    onUndo={undo}
                    onRedo={redo}
                    canUndo={past.length > 0}
                    canRedo={future.length > 0}
                    isPreview={isPreview}
                    onExitPreview={isPreview ? () => navigate(`/builder/${projectId}`) : undefined}
                />

                <div className={styles.editorContentRow}>
                    <div className={styles.workspaceBody}>
                        {!isPreview && (
                            <>
                                <InstrumentsLibrary isOpen={isLibraryOpen} />
                                <PagesPanel isOpen={isPagesOpen} />
                            </>
                        )}

                        {saveError && !isPreview && (
                            <div className={styles.saveErrorBanner}>
                                <Alert
                                    type="error"
                                    message={saveError}
                                    showIcon
                                    closable
                                    onClose={clearSaveError}
                                />
                            </div>
                        )}

                        <div className={styles.canvasWrapper}>
                            <Canvas components={components} readonly={isPreview} />
                        </div>
                    </div>

                    {!isPreview && currentProject && (
                        <div className={styles.propertiesPanelWrapper}>
                            <PropertiesPanel />
                        </div>
                    )}
                </div>
            </div>

            <SaveProjectTemplateModal
                open={isTemplateModalOpen}
                defaultName={projectName}
                defaultType="dashboard"
                onCancel={() => setIsTemplateModalOpen(false)}
                onSubmit={handleSaveAsTemplate}
            />
        </div>
    );
};

export default ProjectEditorPage;
