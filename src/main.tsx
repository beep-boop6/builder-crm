import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import { clearMockStorage } from '@/utils/clearMockStorage';
import { ThemeProvider } from '@/components/Common/ThemeProvider';
import './styles/theme.css';
import './index.css'
import 'antd/dist/reset.css';
import App from './App'

clearMockStorage();

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </ThemeProvider>
    </StrictMode>
);
