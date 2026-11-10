# Análisis de Calidad y Arquitectura - Backend AI Ticket It

Basado en la evaluación de atributos de calidad (ISO/IEC 25010), principios SOLID, declaratividad y modelo de dominio rico.

---

## 1. Vulnerabilidades y Problemas Críticos (Prioridad Inmediata)

1. **Escalamiento de privilegios a Administrador en Autorregistro:**
   - `authService.registro` aceptaba `rol` arbitrario del cuerpo de la petición.
   - *Corrección:* El autorregistro público solo admite `comprador` u `organizador`. Queda expresamente prohibido registrar `admin` por endpoint público. El usuario `admin` solo nace del `seed` o por aprovisionamiento interno seguro.

2. **Fuga de Credenciales (`passwordHash`) en Endpoints Públicos:**
   - `seed.js` asigna el objeto `Usuario` al `organizador` del evento.
   - Sin `toJSON()`, `JSON.stringify` en `GET /api/eventos` filtraba el `passwordHash` y correos en texto estructurado.
   - *Corrección:* Implementación de `toJSON()` en `Usuario` que excluye `passwordHash`, `borrado` y `fechaBaja`.

3. **Mutación de Entidades en Consultas de Solo Lectura (Violación CQS):**
   - En `eventoService.getAll(orden='reputacion')`, se sobreescribía `ev.organizador = org` en memoria al resolver organizadores guardados como ID string.
   - *Corrección:* Las consultas resuelven la reputación para el ordenamiento en estructuras temporales (`Map`), sin mutar las entidades guardadas.

4. **Autorización Permisiva ante Usuarios Falsy (Fail-Open Bug):**
   - `Compra.puedeAcceder(usuarioRef)` retornaba `true` si `!usuarioRef`.
   - *Corrección:* Enfoque de mínimo privilegio (*fail-closed*): si no hay usuario autenticado, `puedeAcceder` retorna `false`.

5. **Efectos Colaterales en Consultas GET:**
   - `usuarioService.obtenerFavoritos` utilizaba `obtenerOCrearUsuario`, creando usuarios "fantasma" en una operación de lectura.
   - *Corrección:* Las operaciones de lectura validan la existencia y no crean entidades colaterales.

6. **Mutación de `process.env` y Gestión de Secretos JWT:**
   - `app.js` asignaba directamente `process.env.JWT_SECRET`.
   - *Corrección:* Fuente única de verdad en `backend/config/jwtConfig.js` que lee `process.env.JWT_SECRET` o valor por defecto de desarrollo de forma inmutable.

7. **Serialización Limpia de `Compra` (DTO / `toJSON`):**
   - Sin `toJSON()`, `Compra` serializaba banderas privadas de control (`_diasFaltantes`, `_cupoRestituido`).
   - *Corrección:* `toJSON()` en `Compra` expone el getter de negocio `diasFaltantes` y oculta variables internas.

---

## 2. Hoja de Ruta de Refactorizaciones Posteriores

### Fase 2: Eliminación de Alias y Caminos Alternativos Redundantes (Completada)
- Se eliminaron alias obsoletos (`crearCompra`, `cancelarCompra`, `utilizarCompra`, `obtenerCompras`, `buscarEventos`, `obtenerEventoPorId`, `crearResenia`, etc.) consolidando los métodos estándar (`create`, `getById`, `getAll`, `cancelar`, `utilizar`).
- Simplificación declarativa de filtros y ordenamiento en `EventoService.getAll()`.
- Unificación de firma de `Compra.cancelar()` y `utilizar()` con soporte de opciones y parámetros nombrados `{ quien, fechaReferencia, motivo }`.

### Fase 3: Unificación de Auditoría y Fuente de Verdad de Mensajes (Completada)
- Reutilización directa de la instancia de `CambioEstadoCompra` que genera el método de dominio `compra.actualizarEstado()` en `auditarYGuardar`, eliminando la doble instanciación de auditoría.
- Centralización del ciclo de vida del chat exclusivamente en `MensajeService` / `mensajeRepository`, con inyección de proveedor de reloj (`fechaActualProvider`) y delegación directa desde `CompraService`.
- Validación de participantes del chat en `MensajeService.validarParticipante` unificada mediante delegación en `Compra.puedeAcceder`.

### Fase 4: Jerarquía de Repositorios InMemoryRepository y DRY (Completada)
- Creación de `InMemoryRepository` como clase base para los 7 repositorios (`CategoriaRepository`, `EventoRepository`, `UsuarioRepository`, `ReseniaRepository`, `MensajeRepository`, `CambioEstadoCompraRepository`, `CompraRepository`).
- Eliminación de la duplicación de lógica CRUD (`save`, `findById`, `findAll`, `update`, `delete`, `clear`, `count`).
- En `CompraRepository`, refactorización de `findByCompradorId`, `findByEventoId` y `findByCompradorYEvento` para delegar directamente en `findAll(filtros)`.

### Fase 5: Robustez, Seguridad y Eliminación de Código Muerto (Completada)
- **3.4 JWT Secret en Producción:** `getJwtSecret` en `backend/config/jwtConfig.js` lanza un error explícito si `process.env.NODE_ENV === 'production'` y no se configuró `JWT_SECRET`.
- **3.5 Manejador de Errores 4xx:** `backend/middlewares/errorHandler.js` normaliza errores con código 4xx (como `SyntaxError` de JSON inválido proveniente de body-parser) retornando status 400 y `{ status: 'fail', message: err.message }` en lugar de un 500 no operacional.
- **Limpieza de Código Muerto:**
  - Se eliminaron los archivos obsoletos `backend/middlewares/auth.js` y `backend/errors/BadRequestError.js`.
  - Se eliminaron del controlador `compraController` métodos huérfanos sin ruta (`getByEventoId`, `getMensajes`, `enviarMensaje`).
  - Se eliminó el alias no utilizado `enriquecerConDiasFaltantes` en `compraService`.
- **3.3 Unificación de Roles y Autorizaciones Seguras:**
  - Se creó `backend/models/rol.js` con el enum congelado `Rol` (`COMPRADOR`, `ORGANIZADOR`, `ADMIN`), lista `ROLES_VALIDOS` y función de normalización `rolDe(user)`.
  - Se corrigió la fuga en autorizaciones que aprobaba por defecto cuando faltaba el usuario o el rol: ahora deniegan por defecto (*fail-closed*).
  - Se corrigió el registro en `authService.registro` para que pase `rol: rolNormalizado` a `Usuario`.
- **3.1 Desacoplamiento SRP en Auditoría de Compras:**
  - Se eliminó el estado compartido `_ultimoCambioDominio` en el singleton de `CompraService`.
  - La entidad de dominio `Compra` almacena su `ultimoCambio` al ejecutar `actualizarEstado`, permitiendo que el servicio persista exactamente la instancia de dominio generada sin dependencias temporales ni duplicaciones en el repositorio.
- **3.2 Transiciones de Estado con Firma Limpia:**
  - `Compra.cancelar({ quien, fechaReferencia, motivo })` y `Compra.utilizar({ quien, fechaReferencia })` utilizan opciones nombradas y eliminan la ambigüedad con identificadores numéricos en strings (`Date.parse("1")`).
- **Unificación de Validaciones entre Dominio, Servicios y Zod:**
  - `Resenia`: model exige puntuación entre 1 y 5 (en consonancia con Zod).
  - `TipoEntrada`: model exige precio > 0 y cupo no negativo.
  - `Compra`: model exige cantidad entero positivo > 0 (con valor por defecto 1 para entidades mockeadas).
  - Se agregaron esquemas Zod en `backend/validations/authValidation.js` para las rutas de autenticación (`/registro`, `/login`, `/token`).
  - `ReseniaService`: se evita mutar el objeto persistido colgándole propiedades externas (`organizador` se pasa en el constructor y se eliminó la asignación de `reputacionOrganizadorActualizada`).

### Fase 6: Desacoplamiento de Roles del Dominio y Servicios (Completada)
- **Eliminación del enum `Rol` y helpers de rol:** Se eliminó el archivo `backend/models/rol.js`. El dominio y los servicios ya no gestionan roles de aplicación.
- **Separación de RBAC vs. ABAC (Pertenencia):**
  - **RBAC (Role-Based Access Control):** Vive exclusivamente en el perímetro HTTP (`backend/routes/` con `requireRole('organizador')` y `requireRole('comprador')`).
  - **Pertenencia (Ownership / ABAC):** Permanece en el dominio y servicios (`compra.esDeComprador(usuario)`, `compra.esDeOrganizador(usuario)`, `evento.esOrganizadoPor(organizadorId)`).
- **Limpieza en Servicios y Controladores:**
  - `EventoService`: se eliminó `validarRolOrganizador`. `create` y `getCompras` confían en el filtro de la ruta; `getCompras` valida únicamente la pertenencia del organizador al evento.
  - `ReseniaService`: se eliminó `validarRolComprador`. La regla de negocio se protege verificando compras en estado `UTILIZADA`.
  - `CompraService`: `validarPermisoCancelacion` y `validarPermisoUtilizacion` validan exclusivamente la relación de pertenencia entre el usuario y la compra/evento, sin consultar cadenas de rol.
  - `EventoController` y `ReseniaController`: dejaron de pasar `userRole` innecesariamente a las capas inferiores.
- **Ajuste de Tests:** Se actualizaron los tests unitarios de controladores y servicios para alinearse a esta separación de responsabilidades, manteniendo la verificación estricta de roles en `tests/rutasAuthIntegration.test.js`.
