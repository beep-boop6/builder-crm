const MOCK_STORAGE_KEYS = [
    'builder_crm_projects',
    'builder_crm_project_meta',
] as const;

export const clearMockStorage = (): void => {
    for (const key of MOCK_STORAGE_KEYS) {
        localStorage.removeItem(key);
    }
};
