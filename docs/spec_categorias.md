### Categorías

- `GET /api/categorias`
    - **Rol:** Público
    - **Recibe:** Ninguno
    - **Errores:**
        - Error interno del servidor -> 500
    - **Camino feliz:** Retorna 200 con la lista de categorías del catálogo.

- `POST /api/categorias`
    - **Rol:** Admin / Organizador
    - **Recibe:** Body: `nombre` (string, obligatorio), `descripcion` (string, opcional)
    - **Errores:**
        - Faltan campos requeridos o tipos inválidos -> 400
        - Token ausente o inválido -> 401
        - Rol no autorizado -> 403
        - Categoría ya existente con el mismo nombre -> 409
    - **Camino feliz:** Crea la categoría y responde 201 con los datos de la categoría creada.