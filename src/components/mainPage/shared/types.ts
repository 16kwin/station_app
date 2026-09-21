// types.ts — типы, общие для всех информационных панелей главной страницы

/** Диапазон дат в формате ISO 'YYYY-MM-DD' (включительно) */
export interface DateRange {
  from: string;
  to: string;
}

/** Общий проп всех карточек: при изменении значения анимация загрузки проигрывается заново */
export interface AnimatedCardProps {
  animationKey: number;
}
