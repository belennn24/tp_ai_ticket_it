### Compras

- `POST /api/compras`
    - **Rol:** Comprador
    - **Recibe:** Body: `eventoId`, `tipoEntradaId`, `cantidad`
    - **Errores:**
        - Faltan campos obligatorios o la cantidad es <= 0 -> 400
        - Token de comprador ausente o inválido -> 401
        - Rol incorrecto -> 403
        - Si el evento o tipo de entrada no existe -> 404
        - Si no hay cupos suficientes (`!hayCupoPara`) -> 409
    - **Camino feliz:** Descuenta cupo del tipo de entrada, crea la compra (estado `CONFIRMADA`), registra auditoría en `CambioEstadoCompra`, calcula diasFaltantes y responde 201.

- `GET /api/compras`
    - **Rol:** Comprador
    - **Recibe:** Headers: `Authorization`
    - **Errores:**
        - Token ausente o inválido -> 401
        - Rol incorrecto -> 403
    - **Camino feliz:** Retorna 200 con las compras del comprador autenticado, calculando dinámicamente `diasFaltantes` para las compras activas.

- `GET /api/compras/:id`
    - **Rol:** Comprador / Organizador
    - **Recibe:** Params: `id`
    - **Errores:**
        - Token ausente o inválido -> 401
        - Usuario ajeno a la compra o evento -> 403
        - Si la compra no existe -> 404
    - **Camino feliz:** Retorna 200 con el detalle de la compra, evento, tipo de entrada y diasFaltantes.

- `GET /api/compras/:id/historial`
    - **Rol:** Comprador / Organizador
    - **Recibe:** Params: `id`
    - **Errores:**
        - Token ausente o inválido -> 401
        - Usuario no autorizado para ver esta compra -> 403
        - Si la compra no existe -> 404
    - **Camino feliz:** Retorna 200 con la cronología de estados en `CambioEstadoCompra` para esa compra.

- `PATCH /api/compras/:id/cancelar`
    - **Rol:** Comprador
    - **Recibe:** Params: `id`, Body: `motivo` (opcional)
    - **Errores:**
        - Token ausente o inválido -> 401
        - Compra no pertenece al comprador -> 403
        - Si la compra no existe -> 404
        - Compra ya en estado `UTILIZADA`, `CANCELADA` o la fecha del evento ya expiró -> 409
    - **Camino feliz:** Restituye cupo al `TipoEntrada`, cambia estado a `CANCELADA`, registra `CambioEstadoCompra` y responde 200.

- `PATCH /api/compras/:id/utilizar`
    - **Rol:** Organizador
    - **Recibe:** Params: `id`
    - **Errores:**
        - Token ausente o inválido -> 401
        - Organizador no es dueño del evento -> 403
        - Si la compra no existe -> 404
        - Compra no está en estado `CONFIRMADA` o el evento ya finalizó -> 409
    - **Camino feliz:** Marca la entrada en estado `UTILIZADA`, registra `CambioEstadoCompra` y responde 200.
