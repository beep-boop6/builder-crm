export type FormFieldType = 'text' | 'number' | 'date' | 'select' | 'submit';

/** Раскладка формы: добавление столбца или строки в таблицу */
export type FormLayout = 'column' | 'row';

export interface FormFieldDefinition {
    name: string;
    label: string;
    type: FormFieldType;
    required?: boolean;
    placeholder?: string;
    options?: string[];
    /** Ширина блока поля (px); без значения — на всю доступную ширину */
    fieldWidth?: number;
    /** Размер шрифта вводимого текста (px) */
    inputFontSize?: number;
}

export type FormMode = 'default' | 'search';
