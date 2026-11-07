### Eventos

- `GET /api/eventos`
    - **Rol:** Público
    - **Recibe:** Query: `texto` (opcional), `categoriaId` (opcional), `precioMin` (opcional), `precioMax` (opcional), `orden` (opcional: fecha, precio, reputacion)
    - **Errores:**
        - Tipos inválidos o `precioMin` > `precioMax` -> 400
    - **Camino feliz:** Filtra y ordena eventos disponibles evaluando precios (`tuPrecioEstaEntre`) y responde 200 con la lista de eventos.

- `GET /api/eventos/:id`
    - **Rol:** Público
    - **Recibe:** Params: `id`
    - **Errores:**
        - Formato de ID inválido -> 400
        - Si el evento no existe -> 404
    - **Camino feliz:** Retorna 200 con el detalle completo del evento y tipos de entrada con sus cupos disponibles.

- `POST /api/eventos`
    - **Rol:** Organizador
    - **Recibe:** Body: `nombre`, `descripcion`, `categoriaId`, `fecha`, `tiposEntrada` (`[{ nombre, descripcion, precio, cupo }]`), `multimedia` (opcional)
    - **Errores:**
        - Faltan campos requeridos, formato de fecha inválido, precio <= 0 o cupo <= 0 -> 400
        - Token ausente o inválido -> 401
        - Rol incorrecto (no es Organizador) -> 403
        - Categoría no encontrada -> 404
    - **Camino feliz:** Crea el evento asignando al organizador autenticado y responde 201 con el evento creado.

- `GET /api/eventos/:id/compras`
    - **Rol:** Organizador
    - **Recibe:** Params: `id`
    - **Errores:**
        - Token ausente o inválido -> 401
        - Evento no pertenece al organizador -> 403
        - Si el evento no existe -> 404
    - **Camino feliz:** Retorna 200 con la lista de compras del evento y el balance de cupos restantes por tipo de entrada.
