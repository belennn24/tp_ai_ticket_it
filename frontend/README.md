# AI Ticket It - Frontend

App mobile en React Native con Expo (JavaScript). Consume el backend Express de la carpeta `backend/`.

## Requisitos
- Node.js y npm.
- App **Expo Go** en el celular, en la misma red Wi-Fi que la PC.

## Puesta en marcha
1. Instalar dependencias (solo la primera vez):
   ```bash
   cd frontend
   npm install
   ```
2. Copiar `.env.example` como `.env.local` y poner la IP de la PC en `EXPO_PUBLIC_API_URL`.
3. Levantar el backend desde la raíz del repo: `npm run dev`.
4. Levantar la app:
   ```bash
   npx expo start
   ```
5. Escanear el QR con Expo Go (Android) o con la cámara (iOS).

## Comandos útiles
- `npx expo install <paquete>`: agrega una librería con la versión compatible con el SDK.
- `npm run lint`: revisa el código.
- `npx expo-doctor`: detecta problemas de dependencias o configuración.

## Estructura
- `src/app/`: pantallas (Expo Router). Cada archivo es una ruta.
- `assets/`: íconos e imágenes.
