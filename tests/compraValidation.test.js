import {
    compraBaseSchema,
    crearCompraSchema,
    actualizarCompraSchema,
    cancelarCompraSchema,
    utilizarCompraSchema,
    agregarMensajeSchema,
    cantidadSchema,
    totalSchema,
    idSchema
} from '../backend/validations/compraValidation.js';

describe('CompraValidation (Declarativo)', () => {
    const validCompraData = {
        eventoId: 'evento-123',
        tipoEntradaId: 'vip-456',
        cantidad: 2,
        total: 2500.50,
        compradorId: 'usuario-789'
    };

    describe('Esquemas declarativos unitarios', () => {
        test('cantidadSchema valida enteros positivos y coacciona strings', () => {
            expect(cantidadSchema.safeParse(1).success).toBe(true);
            expect(cantidadSchema.safeParse('3').data).toBe(3);
            expect(cantidadSchema.safeParse(0).success).toBe(false);
            expect(cantidadSchema.safeParse(-2).success).toBe(false);
            expect(cantidadSchema.safeParse(1.5).success).toBe(false);
            expect(cantidadSchema.safeParse('abc').success).toBe(false);
        });

        test('totalSchema valida números mayores o iguales a 0', () => {
            expect(totalSchema.safeParse(0).success).toBe(true);
            expect(totalSchema.safeParse(150.75).success).toBe(true);
            expect(totalSchema.safeParse('50').data).toBe(50);
            expect(totalSchema.safeParse(-10).success).toBe(false);
        });

        test('idSchema valida identificadores string o numéricos no vacíos', () => {
            expect(idSchema.safeParse('evt-1').success).toBe(true);
            expect(idSchema.safeParse(42).success).toBe(true);
            expect(idSchema.safeParse('').success).toBe(false);
            expect(idSchema.safeParse('   ').success).toBe(false);
            expect(idSchema.safeParse(-5).success).toBe(false);
        });
    });

    describe('crearCompraSchema', () => {
        test('valida exitosamente una compra válida', () => {
            const result = crearCompraSchema.safeParse(validCompraData);
            expect(result.success).toBe(true);
            expect(result.data.cantidad).toBe(2);
            expect(result.data.total).toBe(2500.50);
        });

        test('permite omitir total y compradorId al crear compra', () => {
            const result = crearCompraSchema.safeParse({
                eventoId: 'evento-1',
                tipoEntradaId: 'general-1',
                cantidad: 1
            });
            expect(result.success).toBe(true);
            expect(result.data.total).toBeUndefined();
        });

        test('falla si la cantidad es 0 o negativa', () => {
            const resultCero = crearCompraSchema.safeParse({
                ...validCompraData,
                cantidad: 0
            });
            expect(resultCero.success).toBe(false);
            expect(resultCero.error.issues[0].message).toContain('mayor a 0');

            const resultNegativo = crearCompraSchema.safeParse({
                ...validCompraData,
                cantidad: -1
            });
            expect(resultNegativo.success).toBe(false);
        });

        test('falla si la cantidad no es un número entero', () => {
            const result = crearCompraSchema.safeParse({
                ...validCompraData,
                cantidad: 2.5
            });
            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toContain('entero');
        });

        test('falla si el total es un número negativo', () => {
            const result = crearCompraSchema.safeParse({
                ...validCompraData,
                total: -100
            });
            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toContain('mayor o igual a 0');
        });

        test('falla si faltan campos obligatorios como eventoId o tipoEntradaId', () => {
            const sinEvento = crearCompraSchema.safeParse({
                tipoEntradaId: 't1',
                cantidad: 1
            });
            expect(sinEvento.success).toBe(false);

            const sinTipoEntrada = crearCompraSchema.safeParse({
                eventoId: 'e1',
                cantidad: 1
            });
            expect(sinTipoEntrada.success).toBe(false);
        });
    });

    describe('actualizarCompraSchema (declarativo con .partial())', () => {
        test('permite actualizar campos individuales de forma válida', () => {
            const result = actualizarCompraSchema.safeParse({ cantidad: 4 });
            expect(result.success).toBe(true);
            expect(result.data.cantidad).toBe(4);
        });

        test('mantiene las reglas numéricas declaradas al enviar valores inválidos en actualización', () => {
            const resultZero = actualizarCompraSchema.safeParse({ cantidad: 0 });
            expect(resultZero.success).toBe(false);
            expect(resultZero.error.issues[0].message).toContain('mayor a 0');

            const resultNeg = actualizarCompraSchema.safeParse({ total: -50 });
            expect(resultNeg.success).toBe(false);
            expect(resultNeg.error.issues[0].message).toContain('mayor o igual a 0');
        });
    });

    describe('cancelarCompraSchema, utilizarCompraSchema y agregarMensajeSchema', () => {
        test('cancelarCompraSchema acepta motivo opcional o cuerpo vacío', () => {
            expect(cancelarCompraSchema.safeParse({}).success).toBe(true);
            expect(cancelarCompraSchema.safeParse({ motivo: 'Inconveniente' }).success).toBe(true);
        });

        test('utilizarCompraSchema acepta cuerpo vacío', () => {
            expect(utilizarCompraSchema.safeParse({}).success).toBe(true);
        });

        test('agregarMensajeSchema valida texto no vacío y reutiliza idSchema para usuarioId', () => {
            expect(agregarMensajeSchema.safeParse({ mensaje: 'Hola', usuarioId: 'u1' }).success).toBe(true);
            expect(agregarMensajeSchema.safeParse({ mensaje: '   ' }).success).toBe(false);
        });
    });
});
