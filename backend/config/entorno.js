const ENTORNOS_LOCALES = ['test', 'development'];

export const esEntornoLocal = () => ENTORNOS_LOCALES.includes(process.env.NODE_ENV);