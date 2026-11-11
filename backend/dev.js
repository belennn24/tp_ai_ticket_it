   // Arranque local: marca el entorno como desarrollo antes de cargar la app.
   process.env.NODE_ENV ??= 'development';
   await import('./server.js');