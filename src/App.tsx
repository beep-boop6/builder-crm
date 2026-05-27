import {Routes, Route} from 'react-router-dom';
import ProjectEditorPage from '@/pages/ProjectEditor/ProjectEditor';
import AdminPage from "@/pages/Admin/Admin";
import MainPage from "@/pages/MainPage/MainPage";
import CreateAppPage from "@/pages/CreateApp/CreateApp";
import SettingsPage from "@/pages/Settings/Settings";
import TemplateSelectionPage from "@/pages/TemplateSelection/TemplateSelection";
import {MainLayout} from "@/layouts/MainLayout";

export const App = function App() {
    return (
        <Routes>
            <Route path="/" element={<MainLayout/>}>
                <Route index element={<MainPage/>}/>
                <Route path="admin" element={<AdminPage/>}/>
                <Route path="create-app" element={<CreateAppPage/>}/>
                <Route path="settings" element={<SettingsPage/>}/>
                <Route path="templates" element={<TemplateSelectionPage/>}/>
            </Route>
            {/* Editor route without MainLayout to avoid double sidebar */}
            <Route path="/builder/:projectId" element={<ProjectEditorPage/>}/>
            <Route path="/builder/:projectId/preview" element={<ProjectEditorPage/>}/>
            <Route path="*" element={<div>Страница не найдена</div>}/>
        </Routes>
    );
}

export default App;
