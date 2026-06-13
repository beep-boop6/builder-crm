import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { message, Select } from 'antd';
import { TemplateCarousel } from './TemplateCarousel';
import { useTemplateStore } from '@/store/templateStore';
import { useProjectStore } from '@/store/projectStore';
import { projectService } from '@/services/projectService';
import { TEMPLATE_TYPES } from '@/constants/templateTypes';
import { getErrorMessage } from '@/utils/getErrorMessage';
import type { ProjectTemplate } from '@/types/template';
import styles from './TemplateSelection.module.css';

const TemplateSelectionPage = () => {
    const navigate = useNavigate();
    const templates = useTemplateStore((state) => state.templates);
    const selectedType = useTemplateStore((state) => state.selectedType);
    const setSelectedType = useTemplateStore((state) => state.setSelectedType);
    const createProject = useProjectStore((state) => state.createProject);

    const filteredTemplates = useMemo(() => {
        if (selectedType === 'all') {
            return templates;
        }
        return templates.filter((template) => template.type === selectedType);
    }, [templates, selectedType]);

    const handleUseTemplate = async (template: ProjectTemplate) => {
        try {
            const project = await createProject(template.name, template.navigationType);
            const defaultPageId = project.pages[0]?.id;

            if (!defaultPageId) {
                throw new Error('У проекта нет страницы по умолчанию');
            }

            await projectService.applyTemplate(project.id, template.pages, defaultPageId);
            message.success('Проект создан из шаблона');
            navigate(`/builder/${project.id}`);
        } catch (error) {
            console.error('applyTemplate failed:', error);
            message.error(getErrorMessage(error, 'Не удалось создать проект из шаблона'));
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.typeFilter}>
                <span className={styles.typeLabel}>Тип шаблона</span>
                <Select
                    className={styles.typeSelect}
                    value={selectedType}
                    onChange={setSelectedType}
                    options={TEMPLATE_TYPES.map((type) => ({
                        value: type.id,
                        label: type.label,
                    }))}
                    popupMatchSelectWidth={false}
                />
            </div>

            <div className={styles.carouselArea}>
                <TemplateCarousel
                    templates={filteredTemplates}
                    onSelect={handleUseTemplate}
                />
            </div>
        </div>
    );
};

export default TemplateSelectionPage;
