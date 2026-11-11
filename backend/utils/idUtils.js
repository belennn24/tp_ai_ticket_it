/**
 * Utilidades para manejo y extracción uniforme de identificadores
 * Elimina duplicación del patrón: ref?.id !== undefined ? ref.id : ref
 */

export const extraerId = (ref) => {
    if (ref === null || ref === undefined) return '';
    return String(ref.id !== undefined ? ref.id : ref);
};
