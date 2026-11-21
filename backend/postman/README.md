# Postman Collections & E2E Testing Suite - AI Ticket It

Esta carpeta contiene la suite completa de colecciones de **Postman (v2.1.0)** y variables de entorno para probar todos los casos de uso y el flujo transaccional End-to-End (E2E) de la plataforma **AI Ticket It**, desarrollada para la cátedra de Desarrollo de Software (UTN-BA).

---

## 📁 Estructura de Archivos

### 1. Colecciones Individuales por Caso de Uso (Consigna y Specs)
| Archivo | Caso de Uso | Rol / Actor | Endpoints Principales |
|---|---|---|---|
| `CU01_Visualizar_Mis_Compras.postman_collection.json` | **CU01 - Visualizar mis compras** | Comprador | `GET /api/compras`, `GET /api/compras/:id`, `GET /api/compras/:id/historial` |
| `CU02_Visualizar_Compras_Evento.postman_collection.json` | **CU02 - Visualizar compras asociadas a un Evento** | Organizador | `GET /api/eventos/:id/compras` |
| `CU03_Buscar_Eventos_Y_Categorias.postman_collection.json` | **CU03 - Buscar Eventos y explorar por categorías** | Comprador / Público | `GET /api/categorias`, `GET /api/eventos` (`texto`, `categoriaId`, `precioMin`, `precioMax`), `GET /api/eventos/:id` |
| `CU04_Crear_Evento.postman_collection.json` | **CU04 - Crear un Evento con tipos de entrada** | Organizador | `POST /api/eventos` (General, Platea, VIP con cupos y precios) |
| `CU05_Enviar_Mensaje_Chat.postman_collection.json` | **CU05 - Enviar mensajes en chat de compra** | Comprador | `POST /api/compras/:id/mensajes`, `GET /api/compras/:id/mensajes` |
| `CU06_Responder_Mensaje_Chat.postman_collection.json` | **CU06 - Responder mensajes en chat de compra** | Organizador | `POST /api/compras/:id/mensajes`, `GET /api/compras/:id/mensajes` |
| `CU07_Cancelar_Compra.postman_collection.json` | **CU07 - Cancelar compra para obtener reembolso** | Comprador | `PATCH /api/compras/:id/estado` con `estado: CANCELADA` (verifica restitución de cupo y transición a CANCELADA) |
| `CU08_Reglas_Cancelacion.postman_collection.json` | **CU08 - Reglas de restricción de cancelación** | Organizador / Negocio | `PATCH /api/compras/:id/estado` con `estado: CANCELADA` (valida 409 Conflict si ya está UTILIZADA o evento pasado, 403 Forbidden a ajenos) |
| `CU09_Calificar_Evento.postman_collection.json` | **CU09 - Calificar Evento tras utilizar entrada** | Organizador & Comprador | `PATCH /api/compras/:id/estado` con `estado: UTILIZADA` (acceso), `POST /api/resenias` (puntuación 1-5 y comentario) |
| `CU10_Visualizar_Resenias_Y_Reputacion.postman_collection.json` | **CU10 - Visualizar reseñas y reputación del Organizador** | Público / Comprador | `GET /api/organizadores/:id/resenias`, `GET /api/resenias/organizadores/:id` |
| `CU11_Ordenar_Eventos.postman_collection.json` | **CU11 - Ordenar eventos al buscar** | Comprador / Público | `GET /api/eventos?orden=precio`, `GET /api/eventos?orden=fecha`, `GET /api/eventos?orden=reputacion` |
| `CU12_Realizar_Compra_Cupo.postman_collection.json` | **CU12 - Realizar compra con validación de cupo** | Comprador | `POST /api/compras` (201 éxito decrementando cupo, 409 conflicto si supera cupo) |
| `CU_EXTRA_Favoritos.postman_collection.json` | **CU_EXTRA - Gestión de Favoritos** | Comprador | `POST /api/usuarios/me/favoritos/:id`, `GET /api/usuarios/me/favoritos`, `DELETE /api/usuarios/me/favoritos/:id` |
| `CU_EXTRA_Categorias.postman_collection.json` | **CU_EXTRA - Gestión de Categorías** | Organizador / Admin | `GET /api/categorias`, `POST /api/categorias` |

---

### 2. Colección Maestra (Suite Completa)
- **`AI_Ticket_It_Casos_De_Uso.postman_collection.json`**:
  Agrupa todos los Casos de Uso (CU01 a CU12 + Extras) en carpetas organizadas dentro de una única colección. Permite correr requests individuales o carpetas temáticas enteras con tests automáticos integrados.

---

### 3. Colección Flujo E2E (End-to-End)
- **`AI_Ticket_It_Flujo_E2E.postman_collection.json`**:
  Simula el ciclo de vida completo de un evento y su interacción con los distintos actores de la plataforma de principio a fin, transfiriendo IDs dinámicamente mediante variables de colección:
  1. **Autenticación:** Generación/validación de token JWT para el Organizador.
  2. **Autenticación:** Generación/validación de token JWT para el Comprador.
  3. **Categorización:** Organizador crea la categoría *"Recitales y Mega Eventos"*.
  4. **Publicación:** Organizador publica el evento *"Gran Recital E2E AI Ticket It"* configurando 3 tipos de entrada (General 50 cupos, Platea 20 cupos, VIP 5 cupos).
  5. **Búsqueda & Catálogo:** Comprador busca por texto y filtra por categoría y orden.
  6. **Favoritos:** Comprador agrega el evento a su lista de favoritos.
  7. **Consulta Favoritos:** Comprador corrobora que el evento figura guardado.
  8. **Adquisición (Compra 1):** Comprador adquiere 2 entradas de Campo General (calcula total y verifica estado `CONFIRMADA`).
  9. **Seguimiento Comprador:** Comprador revisa sus compras activas y visualiza el cálculo dinámico de `diasFaltantes`.
  10. **Monitoreo Organizador:** Organizador inspecciona las compras del evento y corrobora que el cupo de General decrementó de 50 a 48.
  11. **Chat (Pregunta):** Comprador envía un mensaje preguntando por el guardarropas.
  12. **Chat (Respuesta):** Organizador responde confirmando guardarropas en el hall.
  13. **Chat (Historial):** Comprador verifica el historial cronológico completo de la conversación.
  14. **Compra 2 (Flujo Alternativo):** Comprador adquiere 1 entrada VIP para un acompañante.
  15. **Cancelación:** Comprador cancela la Compra 2 por imposibilidad de asistencia.
  16. **Auditoría de Cancelación:** Se verifica que la compra pasó a `CANCELADA` y el cupo VIP fue restituido a 5.
  17. **Día del Evento (Acceso):** Organizador valida la entrada en el acceso y marca la Compra 1 como `UTILIZADA`.
  18. **Post-Evento (Calificación):** Comprador califica su experiencia con 5 estrellas y un comentario detallado.
  19. **Reputación:** Público y futuros compradores consultan la reputación promedio del Organizador (5.0 / 5) y sus opiniones.
  20. **Robustez y Conflictos:** Intento de compra con cantidad superior al cupo disponible recibiendo `409 Conflict`.

---

### 4. Variables de Entorno (Environment)
- **`AI_Ticket_It_Local.postman_environment.json`**:
  Define las variables base reutilizables:
  - `baseUrl`: `http://localhost:3000`
  - `token_comprador`: Token JWT pre-firmado para el rol `comprador` (`usr-comprador-1`).
  - `token_organizador`: Token JWT pre-firmado para el rol `organizador` (`usr-organizador-1`).
  - `token_admin`: Token JWT pre-firmado para el rol `admin` (`usr-admin-1`).
  - `token_comprador_2`: Token JWT pre-firmado para un segundo comprador (`usr-comprador-2`), utilizado en pruebas de permisos y seguridad 403.
  - IDs dinámicos: `categoriaId`, `eventoId`, `tipoEntradaId`, `compraId`, `compra2Id`, etc.

---

## 🚀 Cómo Ejecutar las Pruebas

### Paso 1: Iniciar el Backend
En la raíz del proyecto, ejecuta:
```bash
npm start
```
El servidor quedará escuchando en `http://localhost:3000`.

### Paso 2: Importar en Postman
1. Abre **Postman**.
2. Haz clic en el botón **Import** (esquina superior izquierda).
3. Selecciona la carpeta `postman/` o arrastra los archivos JSON correspondientes:
   - `AI_Ticket_It_Local.postman_environment.json` (Selecciónalo como tu ambiente activo en Postman).
   - `AI_Ticket_It_Flujo_E2E.postman_collection.json` (Para probar el flujo integral completo).
   - `AI_Ticket_It_Casos_De_Uso.postman_collection.json` o cualquiera de las colecciones individuales `CU01` a `CU12`.

### Paso 3: Ejecutar con Collection Runner
1. Abre la colección **AI Ticket It - Flujo End to End (E2E)**.
2. Haz clic en **Run collection**.
3. Asegúrate de tener seleccionado el environment **AI Ticket It - Local Environment**.
4. Presiona **Run AI Ticket It - Flujo End to End (E2E)**.
5. Verás el 100% de los tests automáticos en verde (status codes, esquemas, transiciones y validaciones de negocio).
