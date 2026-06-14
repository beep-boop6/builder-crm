import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    define: {
        'import.meta.env.VITE_USE_MOCK': JSON.stringify('false'),
    },
    plugins: [react({
        svgr: {
            // Проверяем, что SVG-файлы импортируются как React-компоненты
            // Это позволяет делать: import Icon from '@/assets/icons/file.svg'
        },
    })],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    ssr: {
        external: ['recharts'],
    },
    optimizeDeps: {
        include: ['recharts'],
    },
});
