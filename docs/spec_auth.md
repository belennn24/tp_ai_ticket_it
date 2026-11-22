### Autenticación

> **Decisión: JWT con access token corto y refresh token, adaptado a la app móvil.**
> El access token (JWT, 15 min) viaja en `Authorization: Bearer <token>` y lleva el id y el rol
> del usuario, así el backend autoriza cada pedido sin guardar sesiones. El refresh token (7 días)
> permite pedir un par nuevo sin volver a loguearse; el backend lo **rota** en cada uso (el anterior
> queda revocado) y lo revoca al cerrar sesión.
>
> - **Clientes web:** el refresh token viaja en una cookie `HttpOnly` (`path=/api/auth`,
>   `sameSite=strict`), que un script de la página no puede leer.
> - **App móvil:** se identifica con el encabezado `X-Cliente: movil`. En una app nativa no hay un
>   navegador del que proteger el token y las cookies no se manejan igual que en la web, por eso el
>   refresh token viaja en el **cuerpo** de las respuestas y de los pedidos. La app guarda los dos
>   tokens solo en memoria; cuando un pedido recibe 401, renueva la sesión una vez (compartida entre
>   pedidos simultáneos) y lo repite. Si no puede renovarla, vuelve al login.

- `POST /api/auth/registro`
    - **Rol:** Público
    - **Recibe:** Body: `nombre`, `apellido` (opcional), `email`, `password`, `rol` (`comprador` u `organizador`)
    - **Errores:**
        - Datos faltantes o inválidos, o rol inexistente -> 400
        - Email ya registrado -> 409
    - **Camino feliz:** Crea el usuario y responde 201 con `token` y `usuario`. El refresh token va en la cookie (web) o en `refreshToken` del cuerpo (`X-Cliente: movil`).

- `POST /api/auth/login`
    - **Rol:** Público
    - **Recibe:** Body: `email`, `password`
    - **Errores:**
        - Email o contraseña faltantes -> 400
        - Credenciales inválidas -> 401
    - **Camino feliz:** Responde 200 con `mensaje`, `token` y `usuario`. El refresh token va en la cookie (web) o en `refreshToken` del cuerpo (`X-Cliente: movil`).

- `POST /api/auth/refresh`
    - **Rol:** Público (requiere un refresh token válido)
    - **Recibe:** el refresh token en la cookie (web) o en el body `refreshToken` (`X-Cliente: movil`)
    - **Errores:**
        - Refresh token faltante, vencido, inválido o ya usado -> 401
    - **Camino feliz:** Revoca el refresh token recibido, emite un par nuevo y responde 200 con `token` y `usuario` (más `refreshToken` para la app móvil).

- `POST /api/auth/logout`
    - **Rol:** Público
    - **Recibe:** el refresh token en la cookie (web) o en el body `refreshToken` (`X-Cliente: movil`)
    - **Camino feliz:** Revoca el refresh token, borra la cookie y responde 200.

- `GET /api/auth/me`
    - **Rol:** Usuario autenticado
    - **Recibe:** Headers: `Authorization: Bearer <token>`
    - **Errores:**
        - Token ausente, vencido o inválido -> 401
    - **Camino feliz:** Responde 200 con el perfil público del usuario.
