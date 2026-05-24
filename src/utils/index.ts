import {useNavigate} from 'react-router-dom';
import {useCallback} from 'react';

export const testAlias = () => console.log('Alias works!');

export const useRouter = () => {
    const navigate = useNavigate();

    return useCallback((path: string) => {
        navigate(path);
    }, [navigate]);
};
