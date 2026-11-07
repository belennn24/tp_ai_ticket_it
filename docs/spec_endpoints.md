## Spec para endpoints

### Especificación de endpoint (genérica)
- **Ruta:** 'METODO/api/recurso'
- **Autenticación y Autorización:** rol
- **Params/query:** especificar
- **Body (JSON):** campos, tipos, formatos
- **Salida exitosa (200 o 201):** código HTTP y JSON respuesta
- **Manejo de erores:** 
  - `400 Bad Request`: si falla la validación del schema.
  - `401 Unauthorized`: si falta el token o expiró.
  - `403 Forbidden`: si el usuario no tiene permisos o no le pertenece el recurso.
  - `404 Not Found`: si el recurso buscado no existe.
  - `409 Conflict`: si viola una regla de negocio.

### Plan técnico en capas
- **Validation (Zod):** nombre del schema y validaciones específicas.
- **Route:** verbo, path y middlewares aplicados ('authMiddleware', 'validate()').
- **Controller:** extrae parámetros, delega al servicio y retorna el código de estado correspondiente.
- **Service:** reglas de negocio,transiciones de estado y cálculo de campos derivados.
- **Repository / Persistencia:** métodos requeridos de consulta y guardado en memoria.
  
### Criterio de aceptación
- **Camino feliz:** dada x condición, cuando se hace una request con los datos correctos, la salida es exitosa y se espera [tal resultado].
- **Conflicto:** dado [escenario que impide acción], se responde con el código de error correspondiente.