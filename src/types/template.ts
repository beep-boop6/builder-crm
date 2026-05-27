import type { Page } from '@/types';

export interface ProjectTemplate {
    id: string;
    name: string;
    type: string;
    pages: Page[];
    navigationType: 'sidebar' | 'topbar';
    sourceProjectId?: string;
    createdAt: number;
    updatedAt: number;
}
