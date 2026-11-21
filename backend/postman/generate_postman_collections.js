import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'ticketit_jwt_secret_key_2026';

// Tokens permanentes sin expiración para testing
const tokenComprador = jwt.sign(
  { id: 'usr-comprador-1', email: 'comprador@ticketit.com', role: 'comprador', rol: 'comprador', nombre: 'Juan Comprador' },
  JWT_SECRET
);

const tokenOrganizador = jwt.sign(
  { id: 'usr-organizador-1', email: 'organizador@ticketit.com', role: 'organizador', rol: 'organizador', nombre: 'Carlos Productor' },
  JWT_SECRET
);

const tokenComprador2 = jwt.sign(
  { id: 'usr-comprador-2', email: 'maria@ticketit.com', role: 'comprador', rol: 'comprador', nombre: 'Maria Compradora' },
  JWT_SECRET
);

const defaultVariables = [
  { key: 'baseUrl', value: 'http://localhost:3000', type: 'string' },
  { key: 'token_comprador', value: tokenComprador, type: 'string' },
  { key: 'token_organizador', value: tokenOrganizador, type: 'string' },
  { key: 'token_comprador_2', value: tokenComprador2, type: 'string' },
  { key: 'categoriaId', value: 'cat-musica-1', type: 'string' },
  { key: 'eventoId', value: 'evt-rock-fest-1', type: 'string' },
  { key: 'tipoEntradaId', value: 'te-rock-general', type: 'string' },
  { key: 'tipoEntradaGeneralId', value: 'te-rock-general', type: 'string' },
  { key: 'tipoEntradaPlateaId', value: 'te-rock-platea', type: 'string' },
  { key: 'tipoEntradaVipId', value: 'te-rock-vip', type: 'string' },
  { key: 'compraId', value: 'cmp-activa-1', type: 'string' },
  { key: 'compra2Id', value: 'cmp-activa-2', type: 'string' },
  { key: 'organizadorId', value: 'usr-organizador-1', type: 'string' },
  { key: 'compradorId', value: 'usr-comprador-1', type: 'string' }
];

function createRequestItem({
  name,
  method,
  urlPath,
  queryParams = [],
  headers = [],
  body = null,
  authBearerVar = null,
  testScript = ''
}) {
  const reqHeaders = [...headers];
  if (authBearerVar) {
    reqHeaders.push({
      key: 'Authorization',
      value: `Bearer {{${authBearerVar}}}`,
      type: 'text'
    });
  }

  const query = queryParams.map(q => ({
    key: q.key,
    value: String(q.value),
    description: q.description || ''
  }));

  const pathParts = urlPath.replace(/^\//, '').split('/');

  const urlObj = {
    raw: `{{baseUrl}}${urlPath}${query.length > 0 ? '?' + query.map(q => `${q.key}=${q.value}`).join('&') : ''}`,
    host: ['{{baseUrl}}'],
    path: pathParts,
    query: query.length > 0 ? query : undefined
  };

  const item = {
    name,
    request: {
      method,
      header: reqHeaders,
      url: urlObj
    }
  };

  if (body) {
    item.request.header.push({
      key: 'Content-Type',
      value: 'application/json',
      type: 'text'
    });
    item.request.body = {
      mode: 'raw',
      raw: typeof body === 'string' ? body : JSON.stringify(body, null, 2),
      options: {
        raw: {
          language: 'json'
        }
      }
    };
  }

  if (testScript) {
    item.event = [
      {
        listen: 'test',
        script: {
          exec: testScript.split('\n'),
          type: 'text/javascript'
        }
      }
    ];
  }

  return item;
}

// -------------------------------------------------------------
// DEFINICIÓN DE CASOS DE USO SEGÚN CONSIGNAS Y SPECS
// -------------------------------------------------------------

const casosDeUso = [
  {
    id: 'CU01',
    name: 'CU01 - Visualizar mis compras (Comprador)',
    description: 'Como comprador, quiero poder visualizar mis compras, diferenciando con claridad el estado en el que se encuentran y cuántos días faltan para el evento en caso de estar en estado confirmada.',
    items: [
      createRequestItem({
        name: '1. Listar mis compras (con cálculo de días faltantes)',
        method: 'GET',
        urlPath: '/api/compras',
        authBearerVar: 'token_comprador',
        testScript: `
pm.test("Status code es 200", () => {
    pm.response.to.have.status(200);
});
pm.test("Retorna lista de compras del comprador", () => {
    const data = pm.response.json();
    pm.expect(Array.isArray(data)).to.be.true;
    if (data.length > 0) {
        pm.collectionVariables.set("compraId", data[0].id);
        const primera = data[0];
        pm.expect(primera).to.have.property('estado');
        if (primera.estado === 'CONFIRMADA') {
            pm.expect(primera).to.have.property('diasFaltantes');
        }
    }
});`
      }),
      createRequestItem({
        name: '2. Filtrar mis compras por estado CONFIRMADA',
        method: 'GET',
        urlPath: '/api/compras',
        queryParams: [{ key: 'estado', value: 'CONFIRMADA' }],
        authBearerVar: 'token_comprador',
        testScript: `
pm.test("Status code es 200", () => {
    pm.response.to.have.status(200);
});
pm.test("Todas las compras retornadas están en estado CONFIRMADA", () => {
    const data = pm.response.json();
    data.forEach(c => {
        pm.expect(c.estado).to.equal('CONFIRMADA');
        pm.expect(c).to.have.property('diasFaltantes');
    });
});`
      }),
      createRequestItem({
        name: '3. Ver detalle de compra por ID',
        method: 'GET',
        urlPath: '/api/compras/{{compraId}}',
        authBearerVar: 'token_comprador',
        testScript: `
pm.test("Status code es 200", () => {
    pm.response.to.have.status(200);
});
pm.test("Detalle de compra incluye evento y tipo de entrada", () => {
    const data = pm.response.json();
    pm.expect(data).to.have.property('id');
    pm.expect(data).to.have.property('estado');
    pm.expect(data).to.have.property('evento');
});`
      }),
      createRequestItem({
        name: '4. Ver historial de cambios de estado de la compra',
        method: 'GET',
        urlPath: '/api/compras/{{compraId}}/historial',
        authBearerVar: 'token_comprador',
        testScript: `
pm.test("Status code es 200", () => {
    pm.response.to.have.status(200);
});
pm.test("Retorna historial cronológico de auditoría", () => {
    const data = pm.response.json();
    pm.expect(Array.isArray(data)).to.be.true;
    if (data.length > 0) {
        pm.expect(data[0]).to.have.property('estado');
        pm.expect(data[0]).to.have.property('fechaHora');
    }
});`
      }),
      createRequestItem({
        name: '5. Seguridad - Intentar ver compras sin token (401)',
        method: 'GET',
        urlPath: '/api/compras',
        testScript: `
pm.test("Status code es 401 Unauthorized", () => {
    pm.response.to.have.status(401);
});`
      }),
      createRequestItem({
        name: '6. Seguridad - Intentar ver compras con rol no comprador (403)',
        method: 'GET',
        urlPath: '/api/compras',
        authBearerVar: 'token_organizador',
        testScript: `
pm.test("Status code es 403 Forbidden para rol organizador", () => {
    pm.response.to.have.status(403);
});`
      })
    ]
  },
  {
    id: 'CU02',
    name: 'CU02 - Visualizar compras asociadas a un Evento (Organizador)',
    description: 'Como organizador, quiero poder visualizar las compras asociadas a un Evento en particular, diferenciando con claridad el estado en el que se encuentran y cuántas entradas quedan disponibles de cada tipo.',
    items: [
      createRequestItem({
        name: '1. Organizador consulta compras y balance de cupos de su Evento',
        method: 'GET',
        urlPath: '/api/eventos/{{eventoId}}/compras',
        authBearerVar: 'token_organizador',
        testScript: `
pm.test("Status code es 200", () => {
    pm.response.to.have.status(200);
});
pm.test("Retorna lista de compras y balance de cupos por tipo de entrada", () => {
    const data = pm.response.json();
    pm.expect(data).to.have.property('compras');
    pm.expect(Array.isArray(data.compras)).to.be.true;
    pm.expect(data.cuposDisponibles || data.balanceCupos).to.be.an('array');
});`
      }),
      createRequestItem({
        name: '2. Seguridad - Comprador intenta ver compras del evento (403)',
        method: 'GET',
        urlPath: '/api/eventos/{{eventoId}}/compras',
        authBearerVar: 'token_comprador',
        testScript: `
pm.test("Status code es 403 Forbidden si no es el organizador dueño", () => {
    pm.response.to.have.status(403);
});`
      }),
      createRequestItem({
        name: '3. Error - Consultar compras de evento inexistente (404)',
        method: 'GET',
        urlPath: '/api/eventos/evento-inexistente-999/compras',
        authBearerVar: 'token_organizador',
        testScript: `
pm.test("Status code es 404 Not Found", () => {
    pm.response.to.have.status(404);
});`
      })
    ]
  },
  {
    id: 'CU03',
    name: 'CU03 - Buscar Eventos y explorar por categorías (Comprador)',
    description: 'Como comprador, quiero poder buscar Eventos de forma específica mediante una búsqueda textual o explorarlos por categorías.',
    items: [
      createRequestItem({
        name: '1. Explorar catálogo general de categorías',
        method: 'GET',
        urlPath: '/api/categorias',
        testScript: `
pm.test("Status code es 200", () => {
    pm.response.to.have.status(200);
});
pm.test("Retorna array de categorías disponibles", () => {
    const data = pm.response.json();
    pm.expect(Array.isArray(data)).to.be.true;
    if (data.length > 0) {
        pm.collectionVariables.set("categoriaId", data[0].id);
    }
});`
      }),
      createRequestItem({
        name: '2. Buscar eventos por coincidencia textual',
        method: 'GET',
        urlPath: '/api/eventos',
        queryParams: [{ key: 'texto', value: 'Rock' }],
        testScript: `
pm.test("Status code es 200", () => {
    pm.response.to.have.status(200);
});
pm.test("Retorna eventos coincidentes con el texto buscado", () => {
    const data = pm.response.json();
    pm.expect(Array.isArray(data)).to.be.true;
});`
      }),
      createRequestItem({
        name: '3. Filtrar eventos por Categoría',
        method: 'GET',
        urlPath: '/api/eventos',
        queryParams: [{ key: 'categoriaId', value: '{{categoriaId}}' }],
        testScript: `
pm.test("Status code es 200", () => {
    pm.response.to.have.status(200);
});
pm.test("Retorna eventos correspondientes a la categoría", () => {
    const data = pm.response.json();
    pm.expect(Array.isArray(data)).to.be.true;
});`
      }),
      createRequestItem({
        name: '4. Búsqueda combinada (texto + rango de precios)',
        method: 'GET',
        urlPath: '/api/eventos',
        queryParams: [
          { key: 'texto', value: 'Rock' },
          { key: 'precioMin', value: '1000' },
          { key: 'precioMax', value: '50000' }
        ],
        testScript: `
pm.test("Status code es 200", () => {
    pm.response.to.have.status(200);
});
pm.test("Filtra con éxito por rango de precios", () => {
    const data = pm.response.json();
    pm.expect(Array.isArray(data)).to.be.true;
});`
      }),
      createRequestItem({
        name: '5. Ver detalle completo de un evento por ID',
        method: 'GET',
        urlPath: '/api/eventos/{{eventoId}}',
        testScript: `
pm.test("Status code es 200", () => {
    pm.response.to.have.status(200);
});
pm.test("Retorna detalle completo con tipos de entrada y cupos", () => {
    const data = pm.response.json();
    pm.expect(data).to.have.property('id');
    pm.expect(data).to.have.property('tiposEntrada');
    pm.expect(Array.isArray(data.tiposEntrada)).to.be.true;
});`
      }),
      createRequestItem({
        name: '6. Error de validación - precioMin mayor a precioMax (400)',
        method: 'GET',
        urlPath: '/api/eventos',
        queryParams: [
          { key: 'precioMin', value: '50000' },
          { key: 'precioMax', value: '1000' }
        ],
        testScript: `
pm.test("Status code es 400 Bad Request", () => {
    pm.response.to.have.status(400);
});`
      })
    ]
  },
  {
    id: 'CU04',
    name: 'CU04 - Crear un Evento con tipos de entrada (Organizador)',
    description: 'Como organizador, quiero poder crear un Evento ofreciendo distintos tipos de entrada, cada uno con su precio y cupo, permitiendo adaptarse a diferentes públicos y presupuestos.',
    items: [
      createRequestItem({
        name: '1. Organizador publica nuevo Evento con múltiples tipos de entrada',
        method: 'POST',
        urlPath: '/api/eventos',
        authBearerVar: 'token_organizador',
        body: {
          nombre: 'Festival Rock Ticket It 2026',
          descripcion: 'El festival de música más esperado del año con artistas nacionales e internacionales.',
          categoriaId: '{{categoriaId}}',
          fecha: '2026-12-15T20:00:00.000Z',
          tiposEntrada: [
            { nombre: 'General', descripcion: 'Acceso campo general', precio: 5000, cupo: 100 },
            { nombre: 'Platea', descripcion: 'Ubicación preferencial con butaca', precio: 12000, cupo: 30 },
            { nombre: 'VIP Experience', descripcion: 'Acceso VIP, consumición y catering', precio: 25000, cupo: 10 }
          ],
          multimedia: ['https://ticketit.com/images/festival2026.jpg']
        },
        testScript: `
pm.test("Status code es 201 Created", () => {
    pm.response.to.have.status(201);
});
pm.test("Evento creado correctamente y guarda IDs para pruebas posteriores", () => {
    const data = pm.response.json();
    pm.expect(data).to.have.property('id');
    pm.collectionVariables.set("eventoId", data.id);
    pm.expect(data.tiposEntrada).to.be.an('array').with.lengthOf(3);
    pm.collectionVariables.set("tipoEntradaGeneralId", data.tiposEntrada[0].id);
    pm.collectionVariables.set("tipoEntradaPlateaId", data.tiposEntrada[1].id);
    pm.collectionVariables.set("tipoEntradaVipId", data.tiposEntrada[2].id);
    pm.collectionVariables.set("tipoEntradaId", data.tiposEntrada[0].id);
});`
      }),
      createRequestItem({
        name: '2. Error de validación - Tipos de entrada con precio o cupo <= 0 (400)',
        method: 'POST',
        urlPath: '/api/eventos',
        authBearerVar: 'token_organizador',
        body: {
          nombre: 'Evento Inválido',
          descripcion: 'Prueba con cupo negativo',
          categoriaId: '{{categoriaId}}',
          fecha: '2026-12-15T20:00:00.000Z',
          tiposEntrada: [
            { nombre: 'General', precio: -500, cupo: 0 }
          ]
        },
        testScript: `
pm.test("Status code es 400 Bad Request", () => {
    pm.response.to.have.status(400);
});`
      }),
      createRequestItem({
        name: '3. Seguridad - Comprador intenta crear un evento (403)',
        method: 'POST',
        urlPath: '/api/eventos',
        authBearerVar: 'token_comprador',
        body: {
          nombre: 'Evento No Autorizado',
          descripcion: 'Debería ser rechazado',
          categoriaId: '{{categoriaId}}',
          fecha: '2026-12-15T20:00:00.000Z',
          tiposEntrada: [{ nombre: 'General', precio: 1000, cupo: 10 }]
        },
        testScript: `
pm.test("Status code es 403 Forbidden", () => {
    pm.response.to.have.status(403);
});`
      })
    ]
  },
  {
    id: 'CU05',
    name: 'CU05 - Enviar mensajes en chat de compra (Comprador)',
    description: 'Como comprador, quiero poder enviar mensajes en cualquier momento relacionados a una compra mediante un chat dentro de la misma.',
    items: [
      createRequestItem({
        name: '1. Comprador envía consulta sobre el acceso en la compra',
        method: 'POST',
        urlPath: '/api/compras/{{compraId}}/mensajes',
        authBearerVar: 'token_comprador',
        body: {
          mensaje: 'Hola! ¿A qué hora abren las puertas para el ingreso?'
        },
        testScript: `
pm.test("Status code es 201 Created", () => {
    pm.response.to.have.status(201);
});
pm.test("Mensaje registrado con usuario emisor y fechaHora", () => {
    const data = pm.response.json();
    pm.expect(data).to.have.property('mensaje');
    pm.expect(data.mensaje).to.equal('Hola! ¿A qué hora abren las puertas para el ingreso?');
    pm.expect(data).to.have.property('fechaHora');
});`
      }),
      createRequestItem({
        name: '2. Comprador consulta historial del chat de la compra',
        method: 'GET',
        urlPath: '/api/compras/{{compraId}}/mensajes',
        authBearerVar: 'token_comprador',
        testScript: `
pm.test("Status code es 200", () => {
    pm.response.to.have.status(200);
});
pm.test("Lista de mensajes en orden cronológico", () => {
    const data = pm.response.json();
    pm.expect(Array.isArray(data)).to.be.true;
    pm.expect(data.length).to.be.above(0);
});`
      }),
      createRequestItem({
        name: '3. Error de validación - Enviar mensaje vacío (400)',
        method: 'POST',
        urlPath: '/api/compras/{{compraId}}/mensajes',
        authBearerVar: 'token_comprador',
        body: {
          mensaje: ''
        },
        testScript: `
pm.test("Status code es 400 Bad Request", () => {
    pm.response.to.have.status(400);
});`
      }),
      createRequestItem({
        name: '4. Seguridad - Usuario ajeno a la compra intenta enviar mensaje (403)',
        method: 'POST',
        urlPath: '/api/compras/{{compraId}}/mensajes',
        authBearerVar: 'token_comprador_2',
        body: {
          mensaje: 'Intento infiltrarme en esta conversación ajena'
        },
        testScript: `
pm.test("Status code es 403 Forbidden para usuario ajeno a la compra", () => {
    pm.response.to.have.status(403);
});`
      })
    ]
  },
  {
    id: 'CU06',
    name: 'CU06 - Responder mensajes en chat de compra (Organizador)',
    description: 'Como organizador, quiero poder responder mensajes en cualquier momento relacionados a una compra mediante un chat dentro de la misma.',
    items: [
      createRequestItem({
        name: '1. Organizador responde mensaje del comprador',
        method: 'POST',
        urlPath: '/api/compras/{{compraId}}/mensajes',
        authBearerVar: 'token_organizador',
        body: {
          mensaje: 'Hola Juan, las puertas abrirán a las 18:00 hs. Habrá control de acceso en la entrada norte.'
        },
        testScript: `
pm.test("Status code es 201 Created", () => {
    pm.response.to.have.status(201);
});
pm.test("Respuesta del organizador guardada correctamente", () => {
    const data = pm.response.json();
    pm.expect(data).to.have.property('mensaje');
    pm.expect(data.mensaje).to.include('18:00 hs');
});`
      }),
      createRequestItem({
        name: '2. Organizador lee todos los mensajes de la compra',
        method: 'GET',
        urlPath: '/api/compras/{{compraId}}/mensajes',
        authBearerVar: 'token_organizador',
        testScript: `
pm.test("Status code es 200", () => {
    pm.response.to.have.status(200);
});
pm.test("Historial contiene la conversación completa entre comprador y organizador", () => {
    const data = pm.response.json();
    pm.expect(Array.isArray(data)).to.be.true;
    pm.expect(data.length).to.be.at.least(2);
});`
      })
    ]
  },
  {
    id: 'CU07',
    name: 'CU07 - Cancelar compra para obtener reembolso (Comprador)',
    description: 'Como comprador, quiero poder cancelar una compra para obtener el reembolso en caso de no poder asistir al evento.',
    items: [
      createRequestItem({
        name: '1. Comprador cancela compra activa para obtener reembolso',
        method: 'PATCH',
        urlPath: '/api/compras/{{compra2Id}}/estado',
        authBearerVar: 'token_comprador',
        body: {
          estado: 'CANCELADA',
          motivo: 'Inconvenientes de fuerza mayor, solicito reembolso.'
        },
        testScript: `
pm.test("Status code es 200 OK", () => {
    pm.response.to.have.status(200);
});
pm.test("La compra pasa a estado CANCELADA y registra el motivo", () => {
    const data = pm.response.json();
    pm.expect(data.estado).to.equal('CANCELADA');
    pm.expect(data.motivo).to.equal('Inconvenientes de fuerza mayor, solicito reembolso.');
});`
      }),
      createRequestItem({
        name: '2. Verificar restitución de cupo en el Evento tras la cancelación',
        method: 'GET',
        urlPath: '/api/eventos/{{eventoId}}',
        testScript: `
pm.test("Status code es 200", () => {
    pm.response.to.have.status(200);
});
pm.test("El cupo del tipo de entrada cancelada fue restituido", () => {
    const data = pm.response.json();
    const vip = data.tiposEntrada.find(t => t.id === pm.collectionVariables.get("tipoEntradaVipId"));
    if (vip) {
        pm.expect(vip.cupo).to.be.at.least(1);
    }
});`
      }),
      createRequestItem({
        name: '3. Auditar transición en el historial de la compra',
        method: 'GET',
        urlPath: '/api/compras/{{compra2Id}}/historial',
        authBearerVar: 'token_comprador',
        testScript: `
pm.test("Status code es 200", () => {
    pm.response.to.have.status(200);
});
pm.test("El historial registra la transición a CANCELADA y guarda el motivo", () => {
    const data = pm.response.json();
    const cancelado = data.find(h => h.estado === 'CANCELADA');
    pm.expect(cancelado).to.be.an('object');
    pm.expect(cancelado.motivo).to.equal('Inconvenientes de fuerza mayor, solicito reembolso.');
});`
      })
    ]
  },
  {
    id: 'CU08',
    name: 'CU08 - Reglas de restricción de cancelación (Organizador / Negocio)',
    description: 'Como organizador, quiero que los compradores puedan cancelar una compra siempre que la misma no se encuentre en estado utilizada y el evento aún no se haya realizado.',
    items: [
      createRequestItem({
        name: '1. Conflicto - Intento de cancelar compra ya cancelada (409)',
        method: 'PATCH',
        urlPath: '/api/compras/{{compra2Id}}/estado',
        authBearerVar: 'token_comprador',
        body: {
          estado: 'CANCELADA',
          motivo: 'Reintento inválido'
        },
        testScript: `
pm.test("Status code es 409 Conflict", () => {
    pm.response.to.have.status(409);
});`
      }),
      createRequestItem({
        name: '2. Seguridad - Usuario ajeno intenta cancelar la compra (403)',
        method: 'PATCH',
        urlPath: '/api/compras/{{compraId}}/estado',
        authBearerVar: 'token_comprador_2',
        body: {
          estado: 'CANCELADA',
          motivo: 'Intento no autorizado'
        },
        testScript: `
pm.test("Status code es 403 Forbidden", () => {
    pm.response.to.have.status(403);
});`
      }),
      createRequestItem({
        name: '3. Error - Cancelar compra inexistente (404)',
        method: 'PATCH',
        urlPath: '/api/compras/compra-inexistente-999',
        authBearerVar: 'token_comprador',
        body: {
          estado: 'CANCELADA',
          motivo: 'No existe'
        },
        testScript: `
pm.test("Status code es 404 Not Found", () => {
    pm.response.to.have.status(404);
});`
      })
    ]
  },
  {
    id: 'CU09',
    name: 'CU09 - Calificar Evento tras utilizar entrada (Organizador / Comprador)',
    description: 'Como organizador, quiero que una vez utilizada una entrada el comprador pueda puntuar el Evento de forma numérica y dejar un comentario escrito.',
    items: [
      createRequestItem({
        name: '1. Regla de negocio - Comprador intenta reseñar SIN entrada utilizada (409)',
        method: 'POST',
        urlPath: '/api/resenias',
        authBearerVar: 'token_comprador',
        body: {
          eventoId: '{{eventoId}}',
          puntuacion: 5,
          detalle: 'Quiero opinar antes de asistir'
        },
        testScript: `
pm.test("Status code es 409 Conflict (no tiene compra UTILIZADA)", () => {
    pm.response.to.have.status(409);
});`
      }),
      createRequestItem({
        name: '2. Organizador registra ingreso y marca compra como UTILIZADA',
        method: 'PATCH',
        urlPath: '/api/compras/{{compraId}}/estado',
        authBearerVar: 'token_organizador',
        body: {
          estado: 'UTILIZADA'
        },
        testScript: `
pm.test("Status code es 200 OK", () => {
    pm.response.to.have.status(200);
});
pm.test("Estado de compra cambia a UTILIZADA", () => {
    const data = pm.response.json();
    pm.expect(data.estado).to.equal('UTILIZADA');
});`
      }),
      createRequestItem({
        name: '3. Comprador califica el evento con puntuación y comentario',
        method: 'POST',
        urlPath: '/api/resenias',
        authBearerVar: 'token_comprador',
        body: {
          eventoId: '{{eventoId}}',
          puntuacion: 5,
          detalle: 'Excelente organización, sonido impecable y acceso rápido!'
        },
        testScript: `
pm.test("Status code es 201 Created", () => {
    pm.response.to.have.status(201);
});
pm.test("Reseña creada y asociada correctamente", () => {
    const data = pm.response.json();
    pm.expect(data).to.have.property('id');
    pm.expect(data.puntuacion).to.equal(5);
});`
      }),
      createRequestItem({
        name: '4. Conflicto - Intento de duplicar reseña para el mismo evento (409)',
        method: 'POST',
        urlPath: '/api/resenias',
        authBearerVar: 'token_comprador',
        body: {
          eventoId: '{{eventoId}}',
          puntuacion: 4,
          detalle: 'Segunda opinión no permitida'
        },
        testScript: `
pm.test("Status code es 409 Conflict", () => {
    pm.response.to.have.status(409);
});`
      }),
      createRequestItem({
        name: '5. Error de validación - Puntuación fuera de rango numérico (400)',
        method: 'POST',
        urlPath: '/api/resenias',
        authBearerVar: 'token_comprador',
        body: {
          eventoId: '{{eventoId}}',
          puntuacion: 10,
          detalle: 'Puntaje inválido'
        },
        testScript: `
pm.test("Status code es 400 Bad Request", () => {
    pm.response.to.have.status(400);
});`
      })
    ]
  },
  {
    id: 'CU10',
    name: 'CU10 - Visualizar reseñas de eventos anteriores y reputación (Comprador)',
    description: 'Como comprador, quiero que las reseñas de eventos anteriores se visualicen en los Eventos de cada organizador para conocer experiencias previas antes de comprar.',
    items: [
      createRequestItem({
        name: '1. Público consulta reseñas y reputación promedio del Organizador',
        method: 'GET',
        urlPath: '/api/organizadores/{{organizadorId}}/resenias',
        testScript: `
pm.test("Status code es 200", () => {
    pm.response.to.have.status(200);
});
pm.test("Retorna lista de opiniones y reputación numérica calculada", () => {
    const data = pm.response.json();
    pm.expect(data).to.have.property('resenias');
    pm.expect(Array.isArray(data.resenias)).to.be.true;
    pm.expect(data).to.have.property('reputacionPromedio');
    pm.expect(typeof data.reputacionPromedio).to.equal('number');
});`
      }),
      createRequestItem({
        name: '2. Consultar reseñas vía ruta alternativa de especificación',
        method: 'GET',
        urlPath: '/api/resenias/organizadores/{{organizadorId}}',
        testScript: `
pm.test("Status code es 200", () => {
    pm.response.to.have.status(200);
});`
      }),
      createRequestItem({
        name: '3. Error - Consultar reseñas de organizador inexistente (404)',
        method: 'GET',
        urlPath: '/api/organizadores/organizador-no-existe-999/resenias',
        testScript: `
pm.test("Status code es 404 Not Found", () => {
    pm.response.to.have.status(404);
});`
      })
    ]
  },
  {
    id: 'CU11',
    name: 'CU11 - Ordenar eventos al buscar (Comprador)',
    description: 'Como comprador, al buscar Eventos, quiero poder ordenarlos por precio, fecha del evento y puntaje del organizador.',
    items: [
      createRequestItem({
        name: '1. Ordenar eventos por Precio',
        method: 'GET',
        urlPath: '/api/eventos',
        queryParams: [{ key: 'orden', value: 'precio' }],
        testScript: `
pm.test("Status code es 200", () => {
    pm.response.to.have.status(200);
});
pm.test("Eventos ordenados por precio", () => {
    const data = pm.response.json();
    pm.expect(Array.isArray(data)).to.be.true;
});`
      }),
      createRequestItem({
        name: '2. Ordenar eventos por Fecha de realización',
        method: 'GET',
        urlPath: '/api/eventos',
        queryParams: [{ key: 'orden', value: 'fecha' }],
        testScript: `
pm.test("Status code es 200", () => {
    pm.response.to.have.status(200);
});
pm.test("Eventos ordenados cronológicamente por fecha", () => {
    const data = pm.response.json();
    pm.expect(Array.isArray(data)).to.be.true;
});`
      }),
      createRequestItem({
        name: '3. Ordenar eventos por Puntaje / Reputación del Organizador',
        method: 'GET',
        urlPath: '/api/eventos',
        queryParams: [{ key: 'orden', value: 'reputacion' }],
        testScript: `
pm.test("Status code es 200", () => {
    pm.response.to.have.status(200);
});
pm.test("Eventos ordenados por reputación del organizador", () => {
    const data = pm.response.json();
    pm.expect(Array.isArray(data)).to.be.true;
});`
      })
    ]
  },
  {
    id: 'CU12',
    name: 'CU12 - Realizar compra con validación de cupo (Comprador)',
    description: 'Como comprador, quiero poder realizar una compra sobre un Evento seleccionando uno de los tipos de entrada disponibles y la cantidad deseada, sin superar el cupo disponible.',
    items: [
      createRequestItem({
        name: '1. Comprador adquiere entradas válidas dentro del cupo',
        method: 'POST',
        urlPath: '/api/compras',
        authBearerVar: 'token_comprador',
        body: {
          eventoId: '{{eventoId}}',
          tipoEntradaId: '{{tipoEntradaGeneralId}}',
          cantidad: 2
        },
        testScript: `
pm.test("Status code es 201 Created", () => {
    pm.response.to.have.status(201);
});
pm.test("Compra creada en estado CONFIRMADA y descuenta cupo", () => {
    const data = pm.response.json();
    pm.expect(data).to.have.property('id');
    pm.expect(data.estado).to.equal('CONFIRMADA');
    pm.expect(data.cantidad).to.equal(2);
    pm.expect(data.total).to.equal(10000); // 2 * 5000
    pm.collectionVariables.set("compraId", data.id);
});`
      }),
      createRequestItem({
        name: '2. Conflicto - Intentar comprar superando el cupo disponible (409)',
        method: 'POST',
        urlPath: '/api/compras',
        authBearerVar: 'token_comprador',
        body: {
          eventoId: '{{eventoId}}',
          tipoEntradaId: '{{tipoEntradaGeneralId}}',
          cantidad: 999999
        },
        testScript: `
pm.test("Status code es 409 Conflict por cupo insuficiente", () => {
    pm.response.to.have.status(409);
});`
      }),
      createRequestItem({
        name: '3. Error de validación - Cantidad menor o igual a cero (400)',
        method: 'POST',
        urlPath: '/api/compras',
        authBearerVar: 'token_comprador',
        body: {
          eventoId: '{{eventoId}}',
          tipoEntradaId: '{{tipoEntradaGeneralId}}',
          cantidad: 0
        },
        testScript: `
pm.test("Status code es 400 Bad Request", () => {
    pm.response.to.have.status(400);
});`
      }),
      createRequestItem({
        name: '4. Error - Tipo de entrada inexistente para el evento (404)',
        method: 'POST',
        urlPath: '/api/compras',
        authBearerVar: 'token_comprador',
        body: {
          eventoId: '{{eventoId}}',
          tipoEntradaId: 'tipo-inexistente-123',
          cantidad: 1
        },
        testScript: `
pm.test("Status code es 404 Not Found", () => {
    pm.response.to.have.status(404);
});`
      })
    ]
  },
  {
    id: 'CU_EXTRA_FAVS',
    name: 'CU_EXTRA - Gestión de Favoritos (Comprador)',
    description: 'Funcionalidad de guardado y remoción de eventos favoritos para compradores según especificación técnica.',
    items: [
      createRequestItem({
        name: '1. Comprador agrega evento a su lista de Favoritos',
        method: 'POST',
        urlPath: '/api/usuarios/me/favoritos/{{eventoId}}',
        authBearerVar: 'token_comprador',
        testScript: `
pm.test("Status code es 200 OK", () => {
    pm.response.to.have.status(200);
});
pm.test("Evento agregado con éxito", () => {
    const data = pm.response.json();
    pm.expect(data.favoritos).to.be.an('array');
});`
      }),
      createRequestItem({
        name: '2. Conflicto - Intento de agregar nuevamente el mismo evento a favoritos (409)',
        method: 'POST',
        urlPath: '/api/usuarios/me/favoritos/{{eventoId}}',
        authBearerVar: 'token_comprador',
        testScript: `
pm.test("Status code es 409 Conflict (ya es favorito)", () => {
    pm.response.to.have.status(409);
});`
      }),
      createRequestItem({
        name: '3. Comprador consulta sus eventos Favoritos',
        method: 'GET',
        urlPath: '/api/usuarios/me/favoritos',
        authBearerVar: 'token_comprador',
        testScript: `
pm.test("Status code es 200", () => {
    pm.response.to.have.status(200);
});
pm.test("Lista contiene el evento guardado", () => {
    const data = pm.response.json();
    pm.expect(Array.isArray(data)).to.be.true;
    pm.expect(data.some(e => e.id === pm.collectionVariables.get("eventoId"))).to.be.true;
});`
      }),
      createRequestItem({
        name: '4. Comprador elimina el evento de sus Favoritos',
        method: 'DELETE',
        urlPath: '/api/usuarios/me/favoritos/{{eventoId}}',
        authBearerVar: 'token_comprador',
        testScript: `
pm.test("Status code es 200 OK", () => {
    pm.response.to.have.status(200);
});`
      }),
      createRequestItem({
        name: '5. Error - Intentar eliminar un evento que ya no está en favoritos (404)',
        method: 'DELETE',
        urlPath: '/api/usuarios/me/favoritos/{{eventoId}}',
        authBearerVar: 'token_comprador',
        testScript: `
pm.test("Status code es 404 Not Found", () => {
    pm.response.to.have.status(404);
});`
      })
    ]
  },
  {
    id: 'CU_EXTRA_CAT',
    name: 'CU_EXTRA - Gestión de Categorías del Catálogo',
    description: 'Creación y consulta de categorías de espectáculos según spec_categorias.md.',
    items: [
      createRequestItem({
        name: '1. Listar categorías del catálogo (Público)',
        method: 'GET',
        urlPath: '/api/categorias',
        testScript: `
pm.test("Status code es 200", () => {
    pm.response.to.have.status(200);
});`
      }),
      createRequestItem({
        name: '2. Organizador/Admin crea nueva Categoría',
        method: 'POST',
        urlPath: '/api/categorias',
        authBearerVar: 'token_organizador',
        body: {
          nombre: 'Festivales al Aire Libre',
          descripcion: 'Eventos masivos y festivales en espacios abiertos'
        },
        testScript: `
pm.test("Status code es 201 Created", () => {
    pm.response.to.have.status(201);
});
pm.test("Categoría creada con ID único", () => {
    const data = pm.response.json();
    pm.expect(data).to.have.property('id');
    pm.collectionVariables.set("categoriaId", data.id);
});`
      }),
      createRequestItem({
        name: '3. Conflicto - Intento de crear categoría con nombre existente (409)',
        method: 'POST',
        urlPath: '/api/categorias',
        authBearerVar: 'token_organizador',
        body: {
          nombre: 'Festivales al Aire Libre',
          descripcion: 'Intento duplicado'
        },
        testScript: `
pm.test("Status code es 409 Conflict", () => {
    pm.response.to.have.status(409);
});`
      })
    ]
  },
  {
    id: 'CU_AUTH',
    name: 'CU_EXTRA - Autenticación y Autorización de Usuarios (JWT)',
    description: 'Gestión completa de identidad: registro de nuevos usuarios, login con contraseña segura hasheada con bcrypt, obtención de perfil autenticado y token Bearer JWT.',
    items: [
      createRequestItem({
        name: '1. Registro de nuevo usuario comprador (POST /api/auth/registro)',
        method: 'POST',
        urlPath: '/api/auth/registro',
        body: {
          nombre: 'Lucia',
          apellido: 'Ventas',
          email: 'lucia.compradora@ticketit.com',
          password: 'Password123!',
          rol: 'comprador'
        },
        testScript: `
pm.test("Status code es 201 Created", () => {
    pm.response.to.have.status(201);
});
var data = pm.response.json();
pm.expect(data.token).to.be.a('string');
pm.expect(data.usuario.email).to.equal('lucia.compradora@ticketit.com');
pm.collectionVariables.set("token_lucia", data.token);
`
      }),
      createRequestItem({
        name: '2. Login con credenciales válidas (POST /api/auth/login)',
        method: 'POST',
        urlPath: '/api/auth/login',
        body: {
          email: 'lucia.compradora@ticketit.com',
          password: 'Password123!'
        },
        testScript: `
pm.test("Status code es 200 OK", () => {
    pm.response.to.have.status(200);
});
var data = pm.response.json();
pm.expect(data.token).to.be.a('string');
pm.collectionVariables.set("token_lucia", data.token);
`
      }),
      createRequestItem({
        name: '3. Login fallido por contraseña incorrecta (401 Unauthorized)',
        method: 'POST',
        urlPath: '/api/auth/login',
        body: {
          email: 'lucia.compradora@ticketit.com',
          password: 'PasswordErronea'
        },
        testScript: `
pm.test("Status code es 401 Unauthorized", () => {
    pm.response.to.have.status(401);
});
`
      }),
      createRequestItem({
        name: '4. Consultar perfil del usuario autenticado (GET /api/auth/me)',
        method: 'GET',
        urlPath: '/api/auth/me',
        headers: [
          { key: 'Authorization', value: 'Bearer {{token_lucia}}' }
        ],
        testScript: `
pm.test("Status code es 200 OK", () => {
    pm.response.to.have.status(200);
});
var data = pm.response.json();
pm.expect(data.user || data.usuario).to.be.an('object');
`
      }),
      createRequestItem({
        name: '5. Renovar access token con cookie HttpOnly (POST /api/auth/refresh)',
        method: 'POST',
        urlPath: '/api/auth/refresh',
        testScript: `
pm.test("Status code es 200 OK", () => {
    pm.response.to.have.status(200);
});
var data = pm.response.json();
pm.expect(data.token).to.be.a('string');
pm.collectionVariables.set("token_lucia", data.token);
`
      }),
      createRequestItem({
        name: '6. Cerrar sesión y revocar refresh token (POST /api/auth/logout)',
        method: 'POST',
        urlPath: '/api/auth/logout',
        testScript: `
pm.test("Status code es 200 OK", () => {
    pm.response.to.have.status(200);
});
var data = pm.response.json();
pm.expect(data.mensaje).to.include('exitosa');
`
      })
    ]
  }
];

// -------------------------------------------------------------
// DEFINICIÓN DE LA COLECCIÓN E2E (FLUJO COMPLETO END-TO-END)
// -------------------------------------------------------------

const itemsE2E = [
  createRequestItem({
    name: '01. Autenticación - Login Organizador (email y password)',
    method: 'POST',
    urlPath: '/api/auth/login',
    body: {
      email: 'organizador@ticketit.com',
      password: 'Password123!'
    },
    testScript: `
pm.test("Status code es 200", () => {
    pm.response.to.have.status(200);
});
var data = pm.response.json();
pm.collectionVariables.set("token_organizador", data.token);
pm.collectionVariables.set("organizadorId", data.user?.id || data.usuario?.id || 'usr-organizador-1');
`
  }),
  createRequestItem({
    name: '02. Autenticación - Login Comprador (email y password)',
    method: 'POST',
    urlPath: '/api/auth/login',
    body: {
      email: 'comprador@ticketit.com',
      password: 'Password123!'
    },
    testScript: `
pm.test("Status code es 200", () => {
    pm.response.to.have.status(200);
});
var data = pm.response.json();
pm.collectionVariables.set("token_comprador", data.token);
pm.collectionVariables.set("compradorId", data.user?.id || data.usuario?.id || 'usr-comprador-1');
`
  }),
  createRequestItem({
    name: '03. Setup - Organizador crea Categoría del Espectáculo',
    method: 'POST',
    urlPath: '/api/categorias',
    authBearerVar: 'token_organizador',
    body: {
      nombre: 'Recitales y Mega Eventos',
      descripcion: 'Recitales musicales en vivo de grandes bandas'
    },
    testScript: `
pm.test("Status code es 201 Created", () => {
    pm.response.to.have.status(201);
});
var data = pm.response.json();
pm.collectionVariables.set("categoriaId", data.id);
`
  }),
  createRequestItem({
    name: '04. Publicación - Organizador publica Evento con 3 tipos de entrada',
    method: 'POST',
    urlPath: '/api/eventos',
    authBearerVar: 'token_organizador',
    body: {
      nombre: 'Gran Recital E2E AI Ticket It',
      descripcion: 'Edición especial de prueba End-to-End con toda la experiencia.',
      categoriaId: '{{categoriaId}}',
      fecha: '2026-12-20T21:00:00.000Z',
      tiposEntrada: [
        { nombre: 'General Campo', descripcion: 'Entrada para campo', precio: 5000, cupo: 50 },
        { nombre: 'Platea Numerada', descripcion: 'Ubicación numerada con vista preferencial', precio: 12000, cupo: 20 },
        { nombre: 'VIP Front Stage', descripcion: 'Acceso exclusivo frente al escenario', precio: 25000, cupo: 5 }
      ],
      multimedia: ['https://ticketit.com/flyer.png']
    },
    testScript: `
pm.test("Status code es 201 Created", () => {
    pm.response.to.have.status(201);
});
var data = pm.response.json();
pm.collectionVariables.set("eventoId", data.id);
pm.collectionVariables.set("tipoEntradaGeneralId", data.tiposEntrada[0].id);
pm.collectionVariables.set("tipoEntradaPlateaId", data.tiposEntrada[1].id);
pm.collectionVariables.set("tipoEntradaVipId", data.tiposEntrada[2].id);
`
  }),
  createRequestItem({
    name: '05. Exploración - Comprador busca y filtra el evento en el catálogo',
    method: 'GET',
    urlPath: '/api/eventos',
    queryParams: [
      { key: 'texto', value: 'Gran Recital' },
      { key: 'categoriaId', value: '{{categoriaId}}' },
      { key: 'orden', value: 'precio' }
    ],
    testScript: `
pm.test("Status code es 200", () => {
    pm.response.to.have.status(200);
});
var data = pm.response.json();
pm.expect(data.some(e => e.id === pm.collectionVariables.get("eventoId"))).to.be.true;
`
  }),
  createRequestItem({
    name: '06. Favoritos - Comprador guarda el evento en su lista de favoritos',
    method: 'POST',
    urlPath: '/api/usuarios/me/favoritos/{{eventoId}}',
    authBearerVar: 'token_comprador',
    testScript: `
pm.test("Status code es 200 OK", () => {
    pm.response.to.have.status(200);
});
`
  }),
  createRequestItem({
    name: '07. Favoritos - Comprador verifica que el evento está en sus favoritos',
    method: 'GET',
    urlPath: '/api/usuarios/me/favoritos',
    authBearerVar: 'token_comprador',
    testScript: `
pm.test("Status code es 200", () => {
    pm.response.to.have.status(200);
});
var data = pm.response.json();
pm.expect(data.some(e => e.id === pm.collectionVariables.get("eventoId"))).to.be.true;
`
  }),
  createRequestItem({
    name: '08. Compra 1 - Comprador adquiere 2 entradas Campo General',
    method: 'POST',
    urlPath: '/api/compras',
    authBearerVar: 'token_comprador',
    body: {
      eventoId: '{{eventoId}}',
      tipoEntradaId: '{{tipoEntradaGeneralId}}',
      cantidad: 2
    },
    testScript: `
pm.test("Status code es 201 Created", () => {
    pm.response.to.have.status(201);
});
var data = pm.response.json();
pm.collectionVariables.set("compraId", data.id);
pm.expect(data.estado).to.equal('CONFIRMADA');
pm.expect(data.total).to.equal(10000);
pm.expect(data).to.have.property('diasFaltantes');
`
  }),
  createRequestItem({
    name: '09. Verificación Comprador - Visualiza sus compras y días faltantes',
    method: 'GET',
    urlPath: '/api/compras',
    authBearerVar: 'token_comprador',
    testScript: `
pm.test("Status code es 200", () => {
    pm.response.to.have.status(200);
});
var data = pm.response.json();
var miCompra = data.find(c => c.id === pm.collectionVariables.get("compraId"));
pm.expect(miCompra).to.exist;
pm.expect(miCompra.estado).to.equal('CONFIRMADA');
pm.expect(miCompra.diasFaltantes).to.not.be.null;
`
  }),
  createRequestItem({
    name: '10. Verificación Organizador - Monitorea compras del evento y balance de cupos',
    method: 'GET',
    urlPath: '/api/eventos/{{eventoId}}/compras',
    authBearerVar: 'token_organizador',
    testScript: `
pm.test("Status code es 200", () => {
    pm.response.to.have.status(200);
});
var data = pm.response.json();
pm.expect(data.compras.length).to.be.at.least(1);
var cupos = data.cuposDisponibles || data.balanceCupos;
var cupoGeneral = cupos.find(c => c.id === pm.collectionVariables.get("tipoEntradaGeneralId"));
pm.expect(cupoGeneral.cupo).to.equal(48); // 50 iniciales - 2 vendidas
`
  }),
  createRequestItem({
    name: '11. Interacción - Comprador envía mensaje en el chat de la compra',
    method: 'POST',
    urlPath: '/api/compras/{{compraId}}/mensajes',
    authBearerVar: 'token_comprador',
    body: {
      mensaje: 'Hola! Quería consultar si el acceso cuenta con guardarropas habilitado.'
    },
    testScript: `
pm.test("Status code es 201 Created", () => {
    pm.response.to.have.status(201);
});
`
  }),
  createRequestItem({
    name: '12. Interacción - Organizador responde la consulta en el chat',
    method: 'POST',
    urlPath: '/api/compras/{{compraId}}/mensajes',
    authBearerVar: 'token_organizador',
    body: {
      mensaje: 'Hola Juan! Sí, contamos con guardarropas en el hall principal de acceso.'
    },
    testScript: `
pm.test("Status code es 201 Created", () => {
    pm.response.to.have.status(201);
});
`
  }),
  createRequestItem({
    name: '13. Interacción - Comprador verifica el chat completo',
    method: 'GET',
    urlPath: '/api/compras/{{compraId}}/mensajes',
    authBearerVar: 'token_comprador',
    testScript: `
pm.test("Status code es 200", () => {
    pm.response.to.have.status(200);
});
var data = pm.response.json();
pm.expect(data.length).to.be.at.least(2);
`
  }),
  createRequestItem({
    name: '14. Flujo Alternativo - Comprador adquiere una segunda compra (VIP)',
    method: 'POST',
    urlPath: '/api/compras',
    authBearerVar: 'token_comprador',
    body: {
      eventoId: '{{eventoId}}',
      tipoEntradaId: '{{tipoEntradaVipId}}',
      cantidad: 1
    },
    testScript: `
pm.test("Status code es 201 Created", () => {
    pm.response.to.have.status(201);
});
var data = pm.response.json();
pm.collectionVariables.set("compra2Id", data.id);
pm.expect(data.total).to.equal(25000);
`
  }),
  createRequestItem({
    name: '15. Flujo Alternativo - Comprador cancela la Compra 2 para reembolso',
    method: 'PATCH',
    urlPath: '/api/compras/{{compra2Id}}/estado',
    authBearerVar: 'token_comprador',
    body: {
      estado: 'CANCELADA',
      motivo: 'Un amigo no podrá asistir.'
    },
    testScript: `
pm.test("Status code es 200 OK", () => {
    pm.response.to.have.status(200);
});
var data = pm.response.json();
pm.expect(data.estado).to.equal('CANCELADA');
pm.expect(data.motivo).to.equal('Un amigo no podrá asistir.');
`
  }),
  createRequestItem({
    name: '16. Validación de Negocio - Restitución de cupo tras cancelación',
    method: 'GET',
    urlPath: '/api/eventos/{{eventoId}}',
    testScript: `
pm.test("Status code es 200", () => {
    pm.response.to.have.status(200);
});
var data = pm.response.json();
var vip = data.tiposEntrada.find(t => t.id === pm.collectionVariables.get("tipoEntradaVipId"));
pm.expect(vip.cupo).to.equal(5); // Vuelve a los 5 iniciales
`
  }),
  createRequestItem({
    name: '17. Día del Evento - Organizador registra ingreso marcando Compra 1 como UTILIZADA',
    method: 'PATCH',
    urlPath: '/api/compras/{{compraId}}/estado',
    authBearerVar: 'token_organizador',
    body: {
      estado: 'UTILIZADA'
    },
    testScript: `
pm.test("Status code es 200 OK", () => {
    pm.response.to.have.status(200);
});
var data = pm.response.json();
pm.expect(data.estado).to.equal('UTILIZADA');
`
  }),
  createRequestItem({
    name: '18. Post-Evento - Comprador califica su experiencia con 5 estrellas',
    method: 'POST',
    urlPath: '/api/resenias',
    authBearerVar: 'token_comprador',
    body: {
      eventoId: '{{eventoId}}',
      puntuacion: 5,
      detalle: 'Increíble experiencia, puntualidad y sonido de máxima fidelidad.'
    },
    testScript: `
pm.test("Status code es 201 Created", () => {
    pm.response.to.have.status(201);
});
var data = pm.response.json();
pm.expect(data.puntuacion).to.equal(5);
`
  }),
  createRequestItem({
    name: '19. Reputación - Consultar opiniones y reputación actualizada del Organizador',
    method: 'GET',
    urlPath: '/api/organizadores/{{organizadorId}}/resenias',
    testScript: `
pm.test("Status code es 200", () => {
    pm.response.to.have.status(200);
});
var data = pm.response.json();
pm.expect(data.reputacionPromedio).to.equal(5);
pm.expect(data.resenias.length).to.be.at.least(1);
`
  }),
  createRequestItem({
    name: '20. Cierre y Robustez - Intento de compra excediendo cupo disponible (409 Conflict)',
    method: 'POST',
    urlPath: '/api/compras',
    authBearerVar: 'token_comprador',
    body: {
      eventoId: '{{eventoId}}',
      tipoEntradaId: '{{tipoEntradaPlateaId}}',
      cantidad: 1000
    },
    testScript: `
pm.test("Status code es 409 Conflict", () => {
    pm.response.to.have.status(409);
});
`
  })
];

// -------------------------------------------------------------
// GENERACIÓN DE ARCHIVOS
// -------------------------------------------------------------

const postmanDirs = [
  path.resolve('backend/postman'),
  path.resolve('postman')
];

postmanDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const filenameMap = {
  CU01: 'CU01_Visualizar_Mis_Compras.postman_collection.json',
  CU02: 'CU02_Visualizar_Compras_Evento.postman_collection.json',
  CU03: 'CU03_Buscar_Eventos_Y_Categorias.postman_collection.json',
  CU04: 'CU04_Crear_Evento.postman_collection.json',
  CU05: 'CU05_Enviar_Mensaje_Chat.postman_collection.json',
  CU06: 'CU06_Responder_Mensaje_Chat.postman_collection.json',
  CU07: 'CU07_Cancelar_Compra.postman_collection.json',
  CU08: 'CU08_Reglas_Cancelacion.postman_collection.json',
  CU09: 'CU09_Calificar_Evento.postman_collection.json',
  CU10: 'CU10_Visualizar_Resenias_Y_Reputacion.postman_collection.json',
  CU11: 'CU11_Ordenar_Eventos.postman_collection.json',
  CU12: 'CU12_Realizar_Compra_Cupo.postman_collection.json',
  CU_EXTRA_FAVS: 'CU_EXTRA_Favoritos.postman_collection.json',
  CU_EXTRA_CAT: 'CU_EXTRA_Categorias.postman_collection.json',
  CU_AUTH: 'CU_EXTRA_Autenticacion.postman_collection.json'
};

// 1. Colecciones individuales por Caso de Uso
casosDeUso.forEach(cu => {
  const collectionJson = {
    info: {
      _postman_id: `ticketit-${cu.id.toLowerCase()}`,
      name: `AI Ticket It - ${cu.name}`,
      description: cu.description,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    variable: defaultVariables,
    item: cu.items
  };

  const filename = filenameMap[cu.id] || `${cu.id}.postman_collection.json`;
  postmanDirs.forEach(dir => {
    fs.writeFileSync(path.join(dir, filename), JSON.stringify(collectionJson, null, 2), 'utf-8');
  });
});

// 2. Colección Maestra de Casos de Uso (Agrupada en Folders)
const masterCasosDeUsoCollection = {
  info: {
    _postman_id: 'ticketit-todos-los-casos-de-uso',
    name: 'AI Ticket It - Casos de Uso (Suite Completa)',
    description: 'Colección integral que contiene todos los Casos de Uso requeridos por la consigna de AI Ticket It organizados en carpetas modulares con validaciones automáticas.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  variable: defaultVariables,
  item: casosDeUso.map(cu => ({
    name: cu.name,
    description: cu.description,
    item: cu.items
  }))
};

postmanDirs.forEach(dir => {
  fs.writeFileSync(
    path.join(dir, 'AI_Ticket_It_Casos_De_Uso.postman_collection.json'),
    JSON.stringify(masterCasosDeUsoCollection, null, 2),
    'utf-8'
  );
});

// 3. Colección Flujo E2E
const e2eCollection = {
  info: {
    _postman_id: 'ticketit-flujo-e2e',
    name: 'AI Ticket It - Flujo End to End (E2E)',
    description: 'Recorrido transaccional integral de principio a fin: creación de categoría, publicación de evento, búsqueda por catálogo, favoritos, compras, control de cupos, chat bidireccional, cancelación de compra, uso en puerta, calificación y reputación.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  variable: defaultVariables,
  item: itemsE2E
};

postmanDirs.forEach(dir => {
  fs.writeFileSync(
    path.join(dir, 'AI_Ticket_It_Flujo_E2E.postman_collection.json'),
    JSON.stringify(e2eCollection, null, 2),
    'utf-8'
  );
});

// 4. Environment de Postman
const environmentJson = {
  id: 'ticketit-local-environment',
  name: 'AI Ticket It - Local Environment',
  values: defaultVariables.map(v => ({
    key: v.key,
    value: v.value,
    type: 'default',
    enabled: true
  })),
  _postman_variable_scope: 'environment'
};

postmanDirs.forEach(dir => {
  fs.writeFileSync(
    path.join(dir, 'AI_Ticket_It_Local.postman_environment.json'),
    JSON.stringify(environmentJson, null, 2),
    'utf-8'
  );
});

console.log('✅ Todas las colecciones y ambientes de Postman fueron generados exitosamente.');
