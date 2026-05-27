import {useNavigate} from 'react-router-dom';
import {useCallback} from 'react';

export const generateGuid = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const useRouter = () => {
    const navigate = useNavigate();

    return useCallback((path: string) => {
        navigate(path);
    }, [navigate]);
};
