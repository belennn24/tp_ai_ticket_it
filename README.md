# AI Ticket It

Plataforma full-stack para búsqueda, compra y gestión de entradas a eventos, con mapa interactivo de ubicaciones, favoritos, reseñas con reputación del organizador y chat por compra entre compradores y organizadores.

---

## Tecnologías

- **Backend:** Node.js (ES Modules). Persistencia en memoria con carga inicial automática (*seed*) en desarrollo.
- **Frontend:** React Native con Expo (Expo Router).

---

## Estructura del repositorio

```text
tp_ai_ticket_it/
├── backend/        # API REST (app, routes, controllers, services, models, repositories, validations, utils/seed)
├── frontend/       # App móvil/web en Expo (src/app, src/components, src/api, src/hooks, src/theme)
├── tests/          # Suite de pruebas unitarias y de integración (Jest)
├── docs/           # Especificaciones de arquitectura y endpoints
└── backend/postman/# Colecciones y entorno de Postman generados
```


### 1. Backend

En la raíz del proyecto:

```bash
npm install
npm run dev
```

- `npm run dev` ejecuta `backend/dev.js`, que configura `NODE_ENV=development`, levanta el servidor en `http://localhost:3000` y siembra los datos iniciales automáticamente.
- En producción (`npm start`), es obligatorio definir `JWT_SECRET` (y `SEED_PASSWORD` si se ejecuta el seed).

### 2. Frontend


```bash
cd frontend
npm install
npx expo start
```
La aplicación fue probada en Expo Go.
---

## Usuarios de prueba (Seed de desarrollo)

Al iniciar con `npm run dev`, se cargan eventos, categorías, compras, mensajes y reseñas de ejemplo. La contraseña por defecto en desarrollo es `1234`:

| Rol | Nombre | Email | Contraseña |
| :--- | :--- | :--- | :--- |
| Organizador | Carlos Productor | `organizador@ticketit.com` | `1234` |
| Organizador | Ana Festivales | `ana@ticketit.com` | `1234` |
| Comprador | Juan Comprador | `comprador@ticketit.com` | `1234` |
| Comprador | María Compradora | `maria@ticketit.com` | `1234` |

---

## Tests y scripts útiles

Desde la raíz del proyecto:

```bash
npm test              # Ejecuta las 27 suites de Jest (unitarios e integración)
npm run test:coverage # Ejecuta tests con reporte de cobertura
npm run postman:generate # Regenera las colecciones de Postman
```
