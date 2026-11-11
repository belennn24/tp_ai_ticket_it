### Mensajes

- `GET /api/compras/:id/mensajes`
    - **Rol:** Comprador / Organizador
    - **Recibe:** Params: `id`
    - **Errores:**
        - Token ausente o inválido -> 401
        - Usuario ajeno a la compra -> 403
        - Si la compra no existe -> 404
    - **Camino feliz:** Retorna 200 con los mensajes del chat de la compra ordenados cronológicamente.

- `POST /api/compras/:id/mensajes`
    - **Rol:** Comprador / Organizador
    - **Recibe:** Params: `id`, Body: `mensaje` (string no vacío)
    - **Errores:**
        - Mensaje vacío o formato inválido -> 400
        - Token ausente o inválido -> 401
        - Usuario no autorizado para participar en la compra -> 403
        - Si la compra no existe -> 404
    - **Camino feliz:** Registra el mensaje asociado al usuario emisor y compra, y responde 201.