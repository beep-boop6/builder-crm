import type { EditorComponent } from '@/store/editorStore';
import { resolveCardVariant } from '@/utils/componentFilters';
import { PropertySection, PropertyTextInput } from './PropertyFields';

interface Props {
    component: EditorComponent;
    onUpdateProps: (props: Record<string, unknown>) => void;
}

export const CardVariantPropertiesView = ({ component, onUpdateProps }: Props) => {
    const props = component.props ?? {};
    const variant = resolveCardVariant(component.type);

    const patch = (patchProps: Record<string, unknown>) => {
        onUpdateProps({ ...props, ...patchProps });
    };

    if (variant === 'deal') {
        return (
            <PropertySection title="Сделка">
                <PropertyTextInput
                    value={String(props.dealTitle ?? '')}
                    placeholder="Название сделки"
                    onChange={(event) => patch({ dealTitle: event.target.value })}
                />
                <PropertyTextInput
                    value={String(props.clientName ?? '')}
                    placeholder="Клиент"
                    onChange={(event) => patch({ clientName: event.target.value })}
                />
                <PropertyTextInput
                    value={String(props.dealStatus ?? '')}
                    placeholder="Статус"
                    onChange={(event) => patch({ dealStatus: event.target.value })}
                />
                <PropertyTextInput
                    value={String(props.dealAmount ?? '')}
                    placeholder="Сумма"
                    onChange={(event) => patch({ dealAmount: event.target.value })}
                />
            </PropertySection>
        );
    }

    if (variant === 'summary') {
        return (
            <PropertySection title="Итоги">
                <PropertyTextInput
                    value={String(props.totalIncome ?? '')}
                    placeholder="Общий доход"
                    onChange={(event) => patch({ totalIncome: event.target.value })}
                />
                <PropertyTextInput
                    value={String(props.totalExpense ?? '')}
                    placeholder="Общий расход"
                    onChange={(event) => patch({ totalExpense: event.target.value })}
                />
                <PropertyTextInput
                    value={String(props.profit ?? '')}
                    placeholder="Прибыль"
                    onChange={(event) => patch({ profit: event.target.value })}
                />
            </PropertySection>
        );
    }

    if (variant === 'kpi') {
        return (
            <PropertySection title="Показатель KPI">
                <PropertyTextInput
                    value={String(props.kpiLabel ?? '')}
                    placeholder="Название показателя"
                    onChange={(event) => patch({ kpiLabel: event.target.value })}
                />
                <PropertyTextInput
                    value={String(props.kpiValue ?? '')}
                    placeholder="Значение"
                    onChange={(event) => patch({ kpiValue: event.target.value })}
                />
            </PropertySection>
        );
    }

    return null;
};
