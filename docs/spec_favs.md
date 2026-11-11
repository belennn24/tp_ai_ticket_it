### Favoritos

- `GET /api/usuarios/me/favoritos`
    - **Rol:** Comprador
    - **Recibe:** Headers: `Authorization`
    - **Errores:**
        - Token ausente o inválido -> 401
        - Rol incorrecto -> 403
    - **Camino feliz:** Retorna 200 con la lista de eventos favoritos del comprador autenticado.

- `POST /api/usuarios/me/favoritos/:eventoId`
    - **Rol:** Comprador
    - **Recibe:** Params: `eventoId`
    - **Errores:**
        - Token ausente o inválido -> 401
        - Rol incorrecto -> 403
        - Si el evento no existe -> 404
        - Evento ya guardado previamente en favoritos -> 409
    - **Camino feliz:** Guarda el evento en la lista de favoritos del comprador y responde 200.

- `DELETE /api/usuarios/me/favoritos/:eventoId`
    - **Rol:** Comprador
    - **Recibe:** Params: `eventoId`
    - **Errores:**
        - Token ausente o inválido -> 401
        - Rol incorrecto -> 403
        - Si el evento no existe o no estaba en favoritos -> 404
    - **Camino feliz:** Remueve el evento de favoritos del comprador y responde 200.