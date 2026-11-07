### Reseñas

- `POST /api/resenias`
    - **Rol:** Comprador
    - **Recibe:** Body: `eventoId`, `puntuacion` (número, ej. 1 a 5), `detalle` (opcional)
    - **Errores:**
        - Faltan campos requeridos o puntuación fuera de rango -> 400
        - Token ausente o inválido -> 401
        - Rol incorrecto -> 403
        - Si el evento no existe -> 404
        - No hay ni una compra en estado `UTILIZADA` para este evento o ya existe reseña -> 409
    - **Camino feliz:** Crea y persiste la resenia, actualiza la reputación del organizador y responde 201.

- `GET /api/organizadores/:id/resenias`
    - **Rol:** Público
    - **Recibe:** Params: `id`
    - **Errores:**
        - Formato de ID inválido -> 400
        - Si el organizador no existe -> 404
    - **Camino feliz:** Retorna 200 con el listado de opiniones/reseñas y la reputación promedio calculada.