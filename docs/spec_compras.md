### Compras

> **Decisión de alcance: pagos y reembolsos manuales.** La consigna no incluye una pasarela de
> pagos. Por eso el pago y la devolución del dinero se coordinan por fuera de la app (por ejemplo,
> por el chat de la compra) y el organizador los registra:
>
> `PENDIENTE` (comprar) → `CONFIRMADA` (el organizador confirma el pago) → `UTILIZADA` (ingreso).
> El comprador puede cancelar una compra `PENDIENTE` o `CONFIRMADA` (`CANCELADA`, se libera el cupo).
> Si el pago se había confirmado, el organizador registra la devolución (`REEMBOLSADA`).

- `POST /api/compras`
    - **Rol:** Comprador
    - **Recibe:** Body: `eventoId`, `tipoEntradaId`, `cantidad`
    - **Errores:**
        - Faltan campos obligatorios o la cantidad es <= 0 -> 400
        - Token de comprador ausente o inválido -> 401
        - Rol incorrecto -> 403
        - Si el evento o tipo de entrada no existe -> 404
        - Si no hay cupos suficientes (`!hayCupoPara`), el evento ya ocurrió o se supera el máximo de 5 entradas por persona -> 409
    - **Camino feliz:** Reserva el cupo del tipo de entrada, crea la compra en estado `PENDIENTE` (pendiente de pago), registra el alta en `CambioEstadoCompra` y responde 201. `diasFaltantes` es `null` hasta que se confirme el pago.

- `GET /api/compras`
    - **Rol:** Comprador
    - **Recibe:** Headers: `Authorization`
    - **Errores:**
        - Token ausente o inválido -> 401
        - Rol incorrecto -> 403
    - **Camino feliz:** Retorna 200 con las compras del comprador autenticado, calculando dinámicamente `diasFaltantes` para las compras `CONFIRMADA`.

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

- `PATCH /api/compras/:id/estado` — **Confirmar el pago**
    - **Rol:** Organizador
    - **Recibe:**
        - Params: `id`
        - Body: `estado` ("CONFIRMADA")
    - **Errores:**
        - Campo `estado` faltante o con valor inválido -> 400
        - Token ausente o inválido -> 401
        - Organizador no es dueño del evento -> 403
        - Si la compra no existe -> 404
        - Compra no está en estado `PENDIENTE` o el evento ya finalizó -> 409
    - **Camino feliz:** Cambia el estado a `CONFIRMADA`, registra la fecha del pago (`fechaPago`) y el `CambioEstadoCompra`, y responde 200 con la compra y sus `diasFaltantes`.

- `PATCH /api/compras/:id/estado` — **Cancelar Compra**
    - **Rol:** Comprador
    - **Recibe:** 
        - Params: `id`
        - Body: `estado` ("CANCELADA"), `motivo` (opcional)
    - **Errores:**
        - Campo `estado` faltante o con valor inválido -> 400
        - Token ausente o inválido -> 401
        - Compra no pertenece al comprador -> 403
        - Si la compra no existe -> 404
        - Compra ya en estado `UTILIZADA`, `CANCELADA`, `REEMBOLSADA` o la fecha del evento ya expiró -> 409
    - **Camino feliz:** Restituye cupo al `TipoEntrada`, cambia estado a `CANCELADA`, registra `CambioEstadoCompra` (con motivo si fue provisto) y responde 200 con la compra actualizada. Se puede cancelar tanto una compra `PENDIENTE` como una `CONFIRMADA`.

- `PATCH /api/compras/:id/estado` — **Marcar como utilizada**
    - **Rol:** Organizador
    - **Recibe:** 
        - Params: `id`
        - Body: `estado` ("UTILIZADA")
    - **Errores:**
        - Campo `estado` faltante o con valor inválido -> 400
        - Token ausente o inválido -> 401
        - Organizador no es dueño del evento -> 403
        - Si la compra no existe -> 404
        - Compra no está en estado `CONFIRMADA` o el evento ya finalizó -> 409
    - **Camino feliz:** Marca la entrada en estado `UTILIZADA`, registra `CambioEstadoCompra` y responde 200 con la compra actualizada.

- `PATCH /api/compras/:id/estado` — **Registrar el reembolso**
    - **Rol:** Organizador
    - **Recibe:**
        - Params: `id`
        - Body: `estado` ("REEMBOLSADA"), `motivo` (opcional)
    - **Errores:**
        - Campo `estado` faltante o con valor inválido -> 400
        - Token ausente o inválido -> 401
        - Organizador no es dueño del evento -> 403
        - Si la compra no existe -> 404
        - Compra no está en estado `CANCELADA`, o se canceló antes de confirmar el pago (no hay dinero que devolver) -> 409
    - **Camino feliz:** Cambia el estado a `REEMBOLSADA`, registra `CambioEstadoCompra` (con motivo si fue provisto) y responde 200 con la compra actualizada.
