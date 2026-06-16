import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { clearMockStorage } from '@/utils/clearMockStorage';
import { BRAND_PRIMARY } from '@/constants/brandColors';
import './index.css'
import 'antd/dist/reset.css';
import App from './App'

clearMockStorage();

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: BRAND_PRIMARY,
                },
            }}
        >
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </ConfigProvider>
    </StrictMode>
);
