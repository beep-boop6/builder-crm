export type FormFieldType = 'text' | 'number' | 'date' | 'select' | 'submit';

export interface FormFieldDefinition {
    name: string;
    label: string;
    type: FormFieldType;
    required?: boolean;
    placeholder?: string;
    options?: string[];
}

export type FormMode = 'default' | 'search';

/** Заливка фона на всю область компонента в режиме поиска */
export type SearchBackgroundMode = 'fill' | 'transparent';
