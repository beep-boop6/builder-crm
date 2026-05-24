import { EditorComponent } from '../store/editorStore';

export interface Project {
    id: string;
    name: string;
    navigationType: 'sidebar' | 'topbar';
    components?: EditorComponent[]; // Оставлено для совместимости старых проектов
    createdAt?: number;
    updatedAt?: string;
    pages: Page[];
}

export interface Page {
    id: string;
    title: string;
    route: string;
    components: EditorComponent[];
    order: number;
}
