import {Button, Space} from 'antd';
import {HomeOutlined} from '@ant-design/icons';
import {useNavigate} from 'react-router-dom';
import styles from './Settings.module.css';

const SettingsPage = () => {
    const navigate = useNavigate();

    return (
        <div className={styles.content}>
            <h1>Настройки</h1>
            <p>Здесь будут настройки приложения</p>
            <Space>
                <Button icon={<HomeOutlined/>} onClick={() => navigate('/')}>
                    На главную
                </Button>
            </Space>
        </div>
    );
};

export default SettingsPage;
