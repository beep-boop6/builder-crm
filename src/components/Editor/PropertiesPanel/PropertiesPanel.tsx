import { useEditorStore, EditorComponent } from '@/store/editorStore';
import { useDataStore } from '@/store/dataStore';
import styles from './PropertiesPanel.module.css';

export const PropertiesPanel = () => {
    const { selectedComponentId, components, updateComponent, updateComponentProps } = useEditorStore();
    const { sources } = useDataStore();
    const selectedComponent = components.find((c) => c.id === selectedComponentId);

    if (!selectedComponent) {
        return (
            <div className={styles.propertiesPanel}>
                <div className={styles.emptyState}>
                    Выберите компонент для редактирования
                </div>
            </div>
        );
    }

    const handleUpdate = (key: keyof EditorComponent, value: string | number) => {
        updateComponent(selectedComponent.id, { [key]: value });
    };

    const handleColorChange = (key: 'backgroundColor' | 'color', e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        if (!val.startsWith('#')) val = `#${val}`;
        handleUpdate(key, val);
    };

    const hexBgColor = (selectedComponent.backgroundColor || '#FFFFFF').replace('#', '').toUpperCase();
    const hexTextColor = (selectedComponent.color || '#FFFFFF').replace('#', '').toUpperCase();

    // Специальный рендер для таблицы
    if (selectedComponent.type === 'table') {
        return (
            <div className={styles.propertiesPanel}>
                <div className={styles.content}>
                    <h2 className={styles.mainTitle}>Настройки таблицы</h2>
                    
                    <div className={styles.sectionGroup}>
                        <label className={styles.sectionTitle}>Источник данных</label>
                        <div className={styles.inputWrapper}>
                            <select
                                value={selectedComponent.props?.dataSourceId || 'none'}
                                onChange={(e) => {
                                    // При смене источника сбрасываем кастомные данные, чтобы они не мешали новому источнику
                                    updateComponentProps(selectedComponent.id, {
                                        dataSourceId: e.target.value,
                                        customData: undefined,
                                        customColumns: undefined
                                    });
                                }}
                                className={styles.select}
                            >
                                <option value="none">Нет данных (Ручное заполнение)</option>
                                {sources.map(src => (
                                    <option key={src.id} value={src.id}>{src.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    {/* Блок: Общие стили */}
                    <div className={styles.sectionGroup}>
                        <label className={styles.sectionTitle}>Общие стили</label>
                        <div className={styles.row}>
                            <div className={styles.inputWrapper}>
                                <span className={styles.prefix}>Sz</span>
                                <input 
                                    type="number" 
                                    value={parseInt(selectedComponent.props?.style?.fontSize) || 14} 
                                    onChange={(e) => updateComponentProps(selectedComponent.id, { 
                                        style: { ...selectedComponent.props?.style, fontSize: `${e.target.value}px` } 
                                    })} 
                                    className={styles.input} 
                                    min="8" 
                                    max="72" 
                                    title="Размер шрифта" 
                                />
                            </div>
                        </div>
                        <div className={styles.colorWrapper}>
                            <div className={styles.colorPickerContainer}>
                                <input 
                                    type="color" 
                                    value={selectedComponent.props?.style?.color || '#000000'} 
                                    onChange={(e) => updateComponentProps(selectedComponent.id, { 
                                        style: { ...selectedComponent.props?.style, color: e.target.value } 
                                    })} 
                                    className={styles.colorInputSquare} 
                                />
                            </div>
                            <input 
                                type="text" 
                                value={(selectedComponent.props?.style?.color || '#000000').replace('#', '')} 
                                onChange={(e) => updateComponentProps(selectedComponent.id, { 
                                    style: { ...selectedComponent.props?.style, color: `#${e.target.value}` } 
                                })} 
                                className={styles.hexInput} 
                                maxLength={7} 
                                placeholder="Цвет текста"
                            />
                        </div>
                        <div className={styles.colorWrapper}>
                            <div className={styles.colorPickerContainer}>
                                <input 
                                    type="color" 
                                    value={selectedComponent.props?.style?.backgroundColor || '#ffffff'} 
                                    onChange={(e) => updateComponentProps(selectedComponent.id, { 
                                        style: { ...selectedComponent.props?.style, backgroundColor: e.target.value } 
                                    })} 
                                    className={styles.colorInputSquare} 
                                />
                            </div>
                            <input 
                                type="text" 
                                value={(selectedComponent.props?.style?.backgroundColor || '#ffffff').replace('#', '')} 
                                onChange={(e) => updateComponentProps(selectedComponent.id, { 
                                    style: { ...selectedComponent.props?.style, backgroundColor: `#${e.target.value}` } 
                                })} 
                                className={styles.hexInput} 
                                maxLength={7} 
                                placeholder="Цвет фона"
                            />
                        </div>
                    </div>
                    
                    {/* Блок: Размер */}
                    <div className={styles.sectionGroup}>
                        <label className={styles.sectionTitle}>Размер</label>
                        <div className={styles.row}>
                            <div className={styles.inputWrapper}>
                                <span className={styles.prefix}>W</span>
                                <input type="number" value={selectedComponent.width} onChange={(e) => handleUpdate('width', parseInt(e.target.value) || 0)} className={styles.input} min="10" />
                            </div>
                            <div className={styles.inputWrapper}>
                                <span className={styles.prefix}>H</span>
                                <input type="number" value={selectedComponent.height} onChange={(e) => handleUpdate('height', parseInt(e.target.value) || 0)} className={styles.input} min="10" />
                            </div>
                        </div>
                    </div>

                    {/* Блок: Положение */}
                    <div className={styles.sectionGroup}>
                        <label className={styles.sectionTitle}>Положение</label>
                        <div className={styles.row}>
                            <div className={styles.inputWrapper}>
                                <span className={styles.prefix}>X</span>
                                <input type="number" value={selectedComponent.x} onChange={(e) => handleUpdate('x', parseInt(e.target.value) || 0)} className={styles.input} />
                            </div>
                            <div className={styles.inputWrapper}>
                                <span className={styles.prefix}>Y</span>
                                <input type="number" value={selectedComponent.y} onChange={(e) => handleUpdate('y', parseInt(e.target.value) || 0)} className={styles.input} />
                            </div>
                        </div>
                    </div>

                    {/* Блок: Слои */}
                    <div className={styles.sectionGroup}>
                        <label className={styles.sectionTitle}>Слой</label>
                        <div className={styles.row}>
                            <div className={styles.inputWrapper}>
                                <span className={styles.prefix}>Z</span>
                                <input type="number" value={selectedComponent.zIndex ?? 1} onChange={(e) => handleUpdate('zIndex', parseInt(e.target.value) || 1)} className={styles.input} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Специальный рендер для графика
    if (selectedComponent.type === 'chart') {
        const source = sources.find(s => s.id === selectedComponent.props?.dataSourceId);
        const dataKeys = source?.data && source.data.length > 0 ? Object.keys(source.data[0]) : [];

        return (
            <div className={styles.propertiesPanel}>
                <div className={styles.content}>
                    <h2 className={styles.mainTitle}>Настройки графика</h2>

                    <div className={styles.sectionGroup}>
                        <label className={styles.sectionTitle}>Источник данных</label>
                        <div className={styles.inputWrapper}>
                            <select
                                value={selectedComponent.props?.dataSourceId || 'none'}
                                onChange={(e) => updateComponentProps(selectedComponent.id, { dataSourceId: e.target.value })}
                                className={styles.select}
                            >
                                <option value="none">-- Выберите источник --</option>
                                {sources.map(src => (
                                    <option key={src.id} value={src.id}>{src.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {selectedComponent.props?.dataSourceId !== 'none' && dataKeys.length > 0 && (
                        <div className={styles.sectionGroup}>
                            <label className={styles.sectionTitle}>Тип графика</label>
                            <div className={styles.inputWrapper}>
                                <select
                                    value={selectedComponent.props?.chartType || 'bar'}
                                    onChange={(e) => updateComponentProps(selectedComponent.id, { chartType: e.target.value })}
                                    className={styles.select}
                                >
                                    <option value="bar">Столбчатый (Bar)</option>
                                    <option value="line">Линейный (Line)</option>
                                </select>
                            </div>
                            <label className={styles.sectionTitle}>Ось X (Категории)</label>
                            <div className={styles.inputWrapper}>
                                <select
                                    value={selectedComponent.props?.xAxisKey || ''}
                                    onChange={(e) => updateComponentProps(selectedComponent.id, { xAxisKey: e.target.value })}
                                    className={styles.select}
                                >
                                    <option value="">Авто</option>
                                    {dataKeys.map(key => <option key={key} value={key}>{key}</option>)}
                                </select>
                            </div>
                            <label className={styles.sectionTitle}>Ось Y (Значения)</label>
                            <div className={styles.inputWrapper}>
                                <select
                                    value={selectedComponent.props?.yAxisKey || ''}
                                    onChange={(e) => updateComponentProps(selectedComponent.id, { yAxisKey: e.target.value })}
                                    className={styles.select}
                                >
                                    <option value="">Авто</option>
                                    {dataKeys.map(key => <option key={key} value={key}>{key}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    <div className={styles.sectionGroup}>
                        <label className={styles.sectionTitle}>Цвет графика</label>
                        <div className={styles.colorWrapper}>
                            <div className={styles.colorPickerContainer}>
                                <input
                                    type="color"
                                    value={selectedComponent.props?.style?.color || '#1976d2'}
                                    onChange={(e) => updateComponentProps(selectedComponent.id, {
                                        style: { ...selectedComponent.props?.style, color: e.target.value }
                                    })}
                                    className={styles.colorInputSquare}
                                />
                            </div>
                            <input
                                type="text"
                                value={(selectedComponent.props?.style?.color || '#1976d2').replace('#', '')}
                                onChange={(e) => updateComponentProps(selectedComponent.id, {
                                    style: { ...selectedComponent.props?.style, color: `#${e.target.value}` }
                                })}
                                className={styles.hexInput}
                                maxLength={7}
                                placeholder="Цвет"
                            />
                        </div>
                    </div>

                    {/* Блок: Размер */}
                    <div className={styles.sectionGroup}>
                        <label className={styles.sectionTitle}>Размер</label>
                        <div className={styles.row}>
                            <div className={styles.inputWrapper}>
                                <span className={styles.prefix}>W</span>
                                <input type="number" value={selectedComponent.width} onChange={(e) => handleUpdate('width', parseInt(e.target.value) || 0)} className={styles.input} min="10" />
                            </div>
                            <div className={styles.inputWrapper}>
                                <span className={styles.prefix}>H</span>
                                <input type="number" value={selectedComponent.height} onChange={(e) => handleUpdate('height', parseInt(e.target.value) || 0)} className={styles.input} min="10" />
                            </div>
                        </div>
                    </div>

                    {/* Блок: Положение */}
                    <div className={styles.sectionGroup}>
                        <label className={styles.sectionTitle}>Положение</label>
                        <div className={styles.row}>
                            <div className={styles.inputWrapper}>
                                <span className={styles.prefix}>X</span>
                                <input type="number" value={selectedComponent.x} onChange={(e) => handleUpdate('x', parseInt(e.target.value) || 0)} className={styles.input} />
                            </div>
                            <div className={styles.inputWrapper}>
                                <span className={styles.prefix}>Y</span>
                                <input type="number" value={selectedComponent.y} onChange={(e) => handleUpdate('y', parseInt(e.target.value) || 0)} className={styles.input} />
                            </div>
                        </div>
                    </div>

                    {/* Блок: Слои */}
                    <div className={styles.sectionGroup}>
                        <label className={styles.sectionTitle}>Слой</label>
                        <div className={styles.row}>
                            <div className={styles.inputWrapper}>
                                <span className={styles.prefix}>Z</span>
                                <input type="number" value={selectedComponent.zIndex ?? 1} onChange={(e) => handleUpdate('zIndex', parseInt(e.target.value) || 1)} className={styles.input} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.propertiesPanel}>
            <div className={styles.content}>
                <h2 className={styles.mainTitle}>Параметры</h2>

                {/* Блок: Контент */}
                <div className={styles.sectionGroup}>
                    <label className={styles.sectionTitle}>Контент</label>
                    <div className={styles.inputWrapper}>
                        <input
                            type="text"
                            value={selectedComponent.text}
                            onChange={(e) => handleUpdate('text', e.target.value)}
                            className={styles.input}
                            placeholder="Текст компонента"
                        />
                    </div>
                </div>

                {/* Блок: Размер */}
                <div className={styles.sectionGroup}>
                    <label className={styles.sectionTitle}>Размер</label>
                    <div className={styles.row}>
                        <div className={styles.inputWrapper}>
                            <span className={styles.prefix}>W</span>
                            <input type="number" value={selectedComponent.width} onChange={(e) => handleUpdate('width', parseInt(e.target.value) || 0)} className={styles.input} min="10" />
                        </div>
                        <div className={styles.inputWrapper}>
                            <span className={styles.prefix}>H</span>
                            <input type="number" value={selectedComponent.height} onChange={(e) => handleUpdate('height', parseInt(e.target.value) || 0)} className={styles.input} min="10" />
                        </div>
                    </div>
                </div>

                {/* Блок: Положение */}
                <div className={styles.sectionGroup}>
                    <label className={styles.sectionTitle}>Положение</label>
                    <div className={styles.row}>
                        <div className={styles.inputWrapper}>
                            <span className={styles.prefix}>X</span>
                            <input type="number" value={selectedComponent.x} onChange={(e) => handleUpdate('x', parseInt(e.target.value) || 0)} className={styles.input} />
                        </div>
                        <div className={styles.inputWrapper}>
                            <span className={styles.prefix}>Y</span>
                            <input type="number" value={selectedComponent.y} onChange={(e) => handleUpdate('y', parseInt(e.target.value) || 0)} className={styles.input} />
                        </div>
                    </div>
                </div>

                {/* Блок: Внешний вид */}
                <div className={styles.sectionGroup}>
                    <label className={styles.sectionTitle}>Внешний вид</label>
                    <div className={styles.row}>
                        <div className={styles.inputWrapper}>
                            <span className={styles.prefix}>R</span>
                            <input type="number" value={selectedComponent.borderRadius ?? 4} onChange={(e) => handleUpdate('borderRadius', parseInt(e.target.value) || 0)} className={styles.input} min="0" title="Скругление углов" />
                        </div>
                    </div>
                    <div className={styles.colorWrapper}>
                        <div className={styles.colorPickerContainer}>
                            <input type="color" value={selectedComponent.backgroundColor || '#FFFFFF'} onChange={(e) => handleColorChange('backgroundColor', e)} className={styles.colorInputSquare} />
                        </div>
                        <input type="text" value={hexBgColor} onChange={(e) => handleColorChange('backgroundColor', e)} className={styles.hexInput} maxLength={7} />
                    </div>
                </div>

                {/* Блок: Типографика */}
                <div className={styles.sectionGroup}>
                    <label className={styles.sectionTitle}>Типографика</label>
                    <div className={styles.row}>
                        <div className={styles.inputWrapper}>
                            <span className={styles.prefix}>Sz</span>
                            <input type="number" value={selectedComponent.fontSize ?? 14} onChange={(e) => handleUpdate('fontSize', parseInt(e.target.value) || 14)} className={styles.input} min="8" max="72" title="Размер шрифта" />
                        </div>
                    </div>
                    <div className={styles.colorWrapper}>
                        <div className={styles.colorPickerContainer}>
                            <input type="color" value={selectedComponent.color || '#FFFFFF'} onChange={(e) => handleColorChange('color', e)} className={styles.colorInputSquare} />
                        </div>
                        <input type="text" value={hexTextColor} onChange={(e) => handleColorChange('color', e)} className={styles.hexInput} maxLength={7} />
                    </div>
                </div>

                {/* Блок: Слои */}
                <div className={styles.sectionGroup}>
                    <label className={styles.sectionTitle}>Слой</label>
                    <div className={styles.row}>
                        <div className={styles.inputWrapper}>
                            <span className={styles.prefix}>Z</span>
                            <input type="number" value={selectedComponent.zIndex ?? 1} onChange={(e) => handleUpdate('zIndex', parseInt(e.target.value) || 1)} className={styles.input} />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
