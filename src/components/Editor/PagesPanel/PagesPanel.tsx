import { useState } from 'react';
import { useEditorStore } from '@/store/editorStore';
import styles from './PagesPanel.module.css';

export const PagesPanel = ({ isOpen }: { isOpen: boolean }) => {
    const { pages, currentPageId, setCurrentPage, addPage, deletePage } = useEditorStore();
    const [newTitle, setNewTitle] = useState('');
    
    if (!isOpen) return null;

    const handleAdd = () => {
        if (newTitle.trim()) {
            addPage(newTitle, `/${newTitle.toLowerCase().replace(/\s+/g, '-')}`);
            setNewTitle('');
        }
    };

    return (
        <div className={styles.pagesPanel}>
            <div className={styles.header}><h2 className={styles.title}>Страницы</h2></div>
            <div className={styles.pageList}>
                {pages.map(page => (
                    <div 
                        key={page.id} 
                        className={`${styles.pageItem} ${page.id === currentPageId ? styles.activePage : ''}`}
                        onClick={() => setCurrentPage(page.id)}
                    >
                        <div>
                            <div className={styles.pageTitle}>{page.title}</div>
                            <div className={styles.pageRoute}>{page.route}</div>
                        </div>
                        {pages.length > 1 && (
                            <button className={styles.deleteBtn} onClick={(e) => { e.stopPropagation(); deletePage(page.id); }}>×</button>
                        )}
                    </div>
                ))}
            </div>
            <div className={styles.addSection}>
                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Название страницы" className={styles.input} />
                <button onClick={handleAdd} className={styles.addBtn}>+ Добавить страницу</button>
            </div>
        </div>
    );
};
