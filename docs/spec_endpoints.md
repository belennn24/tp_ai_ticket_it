## Spec para endpoints

### Especificación de endpoint (genérica)
**Recibe:** [Headers / Params / Body con tipos y restricciones clave]
**Errores:** [Condición error 1] → [Código error 400/401/403/404/409]. [Condición error 2] → [Código error 400/401/403/404/409]
**Éxito:** [Efecto en dominio / persistencia], responde [Código 200/201] con [estructura/datos de salida]

### Plan técnico en capas
- **Validation (Zod):** nombre del schema y validaciones específicas.
- **Route:** verbo, path y middlewares aplicados ('authMiddleware', 'validate()').
- **Controller:** extrae parámetros, delega al servicio y retorna el código de estado correspondiente.
- **Service:** reglas de negocio,transiciones de estado y cálculo de campos derivados.
- **Repository / Persistencia:** métodos requeridos de consulta y guardado en memoria.
  
### Criterio de aceptación
- **Camino feliz:** dada x condición, cuando se hace una request con los datos correctos, la salida es exitosa y se espera [tal resultado].
- **Conflicto:** dado [escenario que impide acción], se responde con el código de error correspondiente.