import { Button, Space } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { DataSourcesManager } from '@/components/DataSources/DataSourcesManager';
import styles from './Settings.module.css';

const SettingsPage = () => {
    const navigate = useNavigate();

    return (
        <div className={styles.content}>
            <div className={styles.header}>
                <div>
                    <h1>Настройки</h1>
                    <p>Управление источниками данных для таблиц и графиков</p>
                </div>
                <Space>
                    <Button icon={<HomeOutlined />} onClick={() => navigate('/')}>
                        На главную
                    </Button>
                </Space>
            </div>

            <DataSourcesManager />
        </div>
    );
};

export default SettingsPage;
