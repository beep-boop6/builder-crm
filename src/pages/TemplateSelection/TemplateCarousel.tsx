import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import arrowIcon from '@/assets/icons/arrow.svg';
import { getTemplateTypeLabel } from '@/constants/templateTypes';
import type { ProjectTemplate } from '@/types/template';
import styles from './TemplateCarousel.module.css';

const getSlideOffsetPx = () => {
    if (typeof window === 'undefined') {
        return 340;
    }
    return Math.min(400, Math.max(280, window.innerWidth * 0.34));
};

const getSlideStyle = (offset: number, animating: boolean, slideOffsetPx: number): CSSProperties => {
    const distance = Math.abs(offset);
    const scale = offset === 0 ? 1 : distance === 1 ? 0.78 : 0.65;
    const opacity = distance > 2 ? 0 : 1;
    const translateX = offset * slideOffsetPx;

    return {
        transform: `translateX(calc(-50% + ${translateX}px)) scale(${scale})`,
        opacity,
        zIndex: 20 - distance,
        pointerEvents: Math.abs(offset) > 1 ? 'none' : 'auto',
        transition: animating
            ? 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1)'
            : 'none',
    };
};

interface TemplateCarouselProps {
    templates: ProjectTemplate[];
    onSelect: (template: ProjectTemplate) => void;
}

export const TemplateCarousel = ({ templates, onSelect }: TemplateCarouselProps) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [animating, setAnimating] = useState(true);
    const [slideOffsetPx, setSlideOffsetPx] = useState(getSlideOffsetPx);

    useEffect(() => {
        const handleResize = () => setSlideOffsetPx(getSlideOffsetPx());
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const normalizedIndex = useMemo(() => {
        if (templates.length === 0) {
            return 0;
        }
        return ((activeIndex % templates.length) + templates.length) % templates.length;
    }, [activeIndex, templates.length]);

    useEffect(() => {
        setActiveIndex(0);
    }, [templates]);

    useEffect(() => {
        if (templates.length === 0) {
            return;
        }
        if (activeIndex >= templates.length) {
            setActiveIndex(0);
        }
    }, [templates.length, activeIndex]);

    const goTo = useCallback((nextIndex: number) => {
        if (templates.length === 0) {
            return;
        }
        setAnimating(true);
        setActiveIndex(nextIndex);
    }, [templates.length]);

    const goPrev = () => goTo(activeIndex - 1);
    const goNext = () => goTo(activeIndex + 1);

    const activeTemplate = templates[normalizedIndex];

    if (templates.length === 0) {
        return (
            <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>Шаблонов пока нет</p>
                <p className={styles.emptyHint}>
                    Сохраните проект как шаблон в редакторе — он появится здесь
                </p>
            </div>
        );
    }

    return (
        <div className={styles.carouselRoot}>
            <button
                type="button"
                className={styles.navButton}
                onClick={goPrev}
                aria-label="Предыдущий шаблон"
            >
                <img src={arrowIcon} alt="" className={styles.navIcon} />
            </button>

            <div className={styles.viewport}>
                {templates.map((template, index) => {
                    let offset = index - normalizedIndex;
                    if (offset > templates.length / 2) {
                        offset -= templates.length;
                    } else if (offset < -templates.length / 2) {
                        offset += templates.length;
                    }

                    if (Math.abs(offset) > 2) {
                        return null;
                    }

                    return (
                        <button
                            key={template.id}
                            type="button"
                            className={`${styles.slide} ${offset === 0 ? styles.slideActive : ''}`}
                            style={getSlideStyle(offset, animating, slideOffsetPx)}
                            onClick={() => {
                                if (offset === 0) {
                                    onSelect(template);
                                    return;
                                }
                                goTo(index);
                            }}
                        >
                            <div className={styles.slideCard}>
                                <span className={styles.slideLabel}>{template.name}</span>
                            </div>
                            {offset === 0 && (
                                <div className={styles.slideMeta}>
                                    <span className={styles.slideType}>
                                        {getTemplateTypeLabel(template.type)}
                                    </span>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            <button
                type="button"
                className={`${styles.navButton} ${styles.navButtonRight}`}
                onClick={goNext}
                aria-label="Следующий шаблон"
            >
                <img src={arrowIcon} alt="" className={`${styles.navIcon} ${styles.navIconRight}`} />
            </button>

            {activeTemplate && (
                <button
                    type="button"
                    className={styles.useButton}
                    onClick={() => onSelect(activeTemplate)}
                >
                    Использовать шаблон
                </button>
            )}
        </div>
    );
};
