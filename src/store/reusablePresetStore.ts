import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ComponentSnapshot } from '@/utils/componentDefaults';
import { generateGuid } from '@/utils';

export interface ReusablePreset {
    id: string;
    name: string;
    category: string;
    snapshot: ComponentSnapshot;
    createdAt: number;
    updatedAt: number;
}

interface ReusablePresetState {
    presets: ReusablePreset[];
    savePreset: (name: string, snapshot: ComponentSnapshot, category?: string) => ReusablePreset;
    updatePreset: (id: string, updates: Partial<Pick<ReusablePreset, 'name' | 'category'>>) => void;
    deletePreset: (id: string) => void;
    getPreset: (id: string) => ReusablePreset | undefined;
    getAllPresets: () => ReusablePreset[];
}

export const useReusablePresetStore = create<ReusablePresetState>()(
    persist(
        (set, get) => ({
            presets: [],

            savePreset: (name, snapshot, category = 'custom') => {
                const now = Date.now();
                const preset: ReusablePreset = {
                    id: generateGuid(),
                    name: name.trim() || 'Без названия',
                    category,
                    snapshot,
                    createdAt: now,
                    updatedAt: now,
                };

                set((state) => ({
                    presets: [preset, ...state.presets],
                }));

                return preset;
            },

            updatePreset: (id, updates) => set((state) => ({
                presets: state.presets.map((preset) =>
                    preset.id === id
                        ? {
                            ...preset,
                            ...updates,
                            name: updates.name?.trim() || preset.name,
                            updatedAt: Date.now(),
                        }
                        : preset
                ),
            })),

            deletePreset: (id) => set((state) => ({
                presets: state.presets.filter((preset) => preset.id !== id),
            })),

            getPreset: (id) => get().presets.find((preset) => preset.id === id),

            getAllPresets: () => get().presets,
        }),
        {
            name: 'builder_crm_reusable_presets',
        }
    )
);
