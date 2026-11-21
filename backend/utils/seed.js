import { Usuario } from '../models/usuario.js';
import { Categoria } from '../models/categoria.js';
import { TipoEntrada } from '../models/tipoEntrada.js';
import { Evento } from '../models/evento.js';
import { Compra } from '../models/compra.js';
import { estadoCompra } from '../models/estadoCompra.js';
import { CambioEstadoCompra } from '../models/cambioEstadoCompra.js';
import { Mensaje } from '../models/mensaje.js';
import { Resenia } from '../models/resenia.js';
import bcryptjs from 'bcryptjs';
import { esEntornoLocal } from '../config/entorno.js';
import { usuarioRepository } from '../repositories/usuarioRepository.js';
import { categoriaRepository } from '../repositories/categoriaRepository.js';
import { eventoRepository } from '../repositories/eventoRepository.js';
import { compraRepository } from '../repositories/compraRepository.js';
import { cambioEstadoCompraRepository } from '../repositories/cambioEstadoCompraRepository.js';
import { mensajeRepository } from '../repositories/mensajeRepository.js';
import { reseniaRepository } from '../repositories/reseniaRepository.js';
import { refreshTokenRepository } from '../repositories/refreshTokenRepository.js';

/**
 * Función encargada de sembrar la base de datos en memoria con datos representativos
 * para pruebas de flujo E2E, Postman y consumo desde el cliente frontend/móvil.
 * 
 * @param {Object} options
 * @param {boolean} options.clearExisting - Si es true, limpia todos los repositorios antes de sembrar.
 * @returns {Promise<Object>} Resumen de entidades sembradas en memoria.
 */
export async function seedDatabase({ clearExisting = false } = {}) {
  if (clearExisting) {
    usuarioRepository.clear();
    categoriaRepository.clear();
    eventoRepository.clear();
    compraRepository.clear();
    cambioEstadoCompraRepository.clear();
    mensajeRepository.clear();
    reseniaRepository.clear();
    refreshTokenRepository.clear();
  }

  // 1. Usuarios representativos (Compradores, Organizadores, Admin)
  const usuariosData = [
    {
      id: 'usr-organizador-1',
      nombre: 'Carlos',
      apellido: 'Productor',
      email: 'organizador@ticketit.com',
      rol: 'organizador',
      reputacion: 5.0
    },
    {
      id: 'usr-organizador-2',
      nombre: 'Ana',
      apellido: 'Festivales',
      email: 'ana@ticketit.com',
      rol: 'organizador',
      reputacion: 4.5
    },
    {
      id: 'usr-comprador-1',
      nombre: 'Juan',
      apellido: 'Comprador',
      email: 'comprador@ticketit.com',
      rol: 'comprador',
      reputacion: 0
    },
    {
      id: 'usr-comprador-2',
      nombre: 'María',
      apellido: 'Compradora',
      email: 'maria@ticketit.com',
      rol: 'comprador',
      reputacion: 0
    },
    {
      id: 'usr-admin-1',
      nombre: 'Admin',
      apellido: 'Sistema',
      email: 'admin@ticketit.com',
      rol: 'admin',
      reputacion: 0
    }
  ];

  const passwordSeed = process.env.SEED_PASSWORD || (esEntornoLocal() ? '1234' : null);
  if (!passwordSeed) {
    throw new Error('SEED_PASSWORD es obligatorio para sembrar datos fuera de desarrollo.');
  }
  const defaultPasswordHash = bcryptjs.hashSync(passwordSeed, 10);
  const usuarios = [];
  for (const u of usuariosData) {
    const usuario = new Usuario({
      ...u,
      passwordHash: u.passwordHash || defaultPasswordHash
    });
    await usuarioRepository.save(usuario);
    usuarios.push(usuario);
  }

  // 2. Categorías del Catálogo
  const categoriasData = [
    {
      id: 'cat-musica-1',
      nombre: 'Música y Recitales',
      descripcion: 'Festivales en vivo, conciertos de rock, pop, jazz y electrónica.'
    },
    {
      id: 'cat-teatro-1',
      nombre: 'Teatro y Comedia',
      descripcion: 'Obras de teatro clásicas, comedias, unipersonales y danza.'
    },
    {
      id: 'cat-deportes-1',
      nombre: 'Deportes y Torneos',
      descripcion: 'Partidos de fútbol, básquet, tenis y competiciones deportivas.'
    },
    {
      id: 'cat-conferencias-1',
      nombre: 'Conferencias y Charlas',
      descripcion: 'Charlas de tecnología, innovación, diseño y negocios.'
    }
  ];

  const categorias = [];
  for (const c of categoriasData) {
    const categoria = new Categoria(c);
    await categoriaRepository.save(categoria);
    categorias.push(categoria);
  }

  // 3. Tipos de Entrada
  const teRockGeneral = new TipoEntrada({
    id: 'te-rock-general',
    nombre: 'Campo General',
    descripcion: 'Acceso general al predio del festival',
    precio: 15000,
    cupo: 98, // Disponibles: originalmente 100, 2 ya adquiridas en cmp-activa-1
    cupoTotal: 100,
    entradasVendidas: 2
  });

  const teRockPlatea = new TipoEntrada({
    id: 'te-rock-platea',
    nombre: 'Platea Numerada',
    descripcion: 'Ubicación preferencial con butaca numerada',
    precio: 25000,
    cupo: 40, // Disponibles: 1 ya adquirida en cmp-activa-2
    cupoTotal: 41,
    entradasVendidas: 1
  });

  const teRockVip = new TipoEntrada({
    id: 'te-rock-vip',
    nombre: 'VIP Lounge Backstage',
    descripcion: 'Acceso VIP exclusivo con catering y vista preferencial',
    precio: 45000,
    cupo: 10
  });

  const teJazzMesa = new TipoEntrada({
    id: 'te-jazz-mesa',
    nombre: 'Mesa Exclusiva',
    descripcion: 'Mesa para 2 personas frente al escenario principal',
    precio: 12000,
    cupo: 2 // Cupo bajo para pruebas de límite y agotamiento
  });

  const teTechPase = new TipoEntrada({
    id: 'te-tech-pase',
    nombre: 'Pase Completo Tech Summit',
    descripcion: 'Acceso total a las 2 jornadas de conferencias y workshops',
    precio: 20000,
    cupo: 150
  });

  const teClasicoGeneral = new TipoEntrada({
    id: 'te-clasico-general',
    nombre: 'Entrada General Histórica',
    descripcion: 'Entrada general al concierto clásico',
    precio: 8000,
    cupo: 0, // Evento pasado agotado: 3 vendidas en cmp-utilizada-1 y cmp-utilizada-2
    cupoTotal: 3,
    entradasVendidas: 3
  });

  const teBtsCampo = new TipoEntrada({
    id: 'te-bts-campo',
    nombre: 'Campo Delantero ARMY',
    descripcion: 'Acceso preferencial de pie frente al escenario principal',
    precio: 95000,
    cupo: 200
  });

  const teBtsPlatea = new TipoEntrada({
    id: 'te-bts-platea',
    nombre: 'Platea Preferencial',
    descripcion: 'Butaca numerada con vista panorámica del estadio',
    precio: 72000,
    cupo: 120
  });

  const teBtsVip = new TipoEntrada({
    id: 'te-bts-vip',
    nombre: 'VIP Soundcheck Experience',
    descripcion: 'Acceso a prueba de sonido, credencial conmemorativa y sector exclusivo',
    precio: 160000,
    cupo: 25
  });

  const tePitbullCampo = new TipoEntrada({
    id: 'te-pitbull-campo',
    nombre: 'Campo General',
    descripcion: 'Acceso general al show Party After Dark',
    precio: 42000,
    cupo: 300
  });

  const tePitbullVip = new TipoEntrada({
    id: 'te-pitbull-vip',
    nombre: 'VIP Mr. Worldwide',
    descripcion: 'Sector preferencial cercano al escenario con barra libre',
    precio: 85000,
    cupo: 40
  });

  const teFestivalGeneral = new TipoEntrada({
    id: 'te-festival-general',
    nombre: 'Abono 3 Días General',
    descripcion: 'Acceso a los 3 días del festival en todos los escenarios',
    precio: 110000,
    cupo: 500
  });

  const teFestivalComfort = new TipoEntrada({
    id: 'te-festival-comfort',
    nombre: 'Abono 3 Días Comfort',
    descripcion: 'Acceso general más zonas de descanso, baños exclusivos y fast lane',
    precio: 185000,
    cupo: 80
  });

  const teNerdearlaComunidad = new TipoEntrada({
    id: 'te-nerdearla-comunidad',
    nombre: 'Entrada Comunidad IT',
    descripcion: 'Acceso presencial a todas las charlas de infraestructura, DevOps y datos',
    precio: 8500,
    cupo: 400
  });

  const teNerdearlaWorkshop = new TipoEntrada({
    id: 'te-nerdearla-workshop',
    nombre: 'Pase Workshop + Networking',
    descripcion: 'Incluye talleres prácticos de Kubernetes, observabilidad y espacio de networking',
    precio: 24000,
    cupo: 60
  });

  const teEkoGeneral = new TipoEntrada({
    id: 'te-eko-general',
    nombre: 'Pase General Conferencia',
    descripcion: 'Acceso a charlas principales, villages de hacking y demostraciones en vivo',
    precio: 32000,
    cupo: 250
  });

  const teEkoTraining = new TipoEntrada({
    id: 'te-eko-training',
    nombre: 'Pase Trainings + CTF',
    descripcion: 'Acceso completo a entrenamientos intensivos de ciberseguridad y Capture The Flag',
    precio: 68000,
    cupo: 45
  });

  const teReactEarly = new TipoEntrada({
    id: 'te-react-early',
    nombre: 'Entrada Early Bird',
    descripcion: 'Acceso a todas las charlas de React, React Native y arquitectura frontend',
    precio: 14000,
    cupo: 180
  });

  const teReactFull = new TipoEntrada({
    id: 'te-react-full',
    nombre: 'Entrada Full + Grabaciones',
    descripcion: 'Acceso presencial completo, almuerzo y grabaciones on-demand',
    precio: 22000,
    cupo: 100
  });

  // Fechas relativas para pruebas temporales consistentes
  const ahora = new Date();
  const fechaFutura5Dias = new Date(ahora.getTime() + 5 * 24 * 60 * 60 * 1000);
  const fechaFutura14Dias = new Date(ahora.getTime() + 14 * 24 * 60 * 60 * 1000);
  const fechaFutura20Dias = new Date(ahora.getTime() + 20 * 24 * 60 * 60 * 1000);
  const fechaFutura25Dias = new Date(ahora.getTime() + 25 * 24 * 60 * 60 * 1000);
  const fechaFutura30Dias = new Date(ahora.getTime() + 30 * 24 * 60 * 60 * 1000);
  const fechaFutura38Dias = new Date(ahora.getTime() + 38 * 24 * 60 * 60 * 1000);
  const fechaFutura45Dias = new Date(ahora.getTime() + 45 * 24 * 60 * 60 * 1000);
  const fechaFutura60Dias = new Date(ahora.getTime() + 60 * 24 * 60 * 60 * 1000);
  const fechaFutura75Dias = new Date(ahora.getTime() + 75 * 24 * 60 * 60 * 1000);
  const fechaPasada15Dias = new Date(ahora.getTime() - 15 * 24 * 60 * 60 * 1000);

  // 4. Eventos
  const eventoRock = new Evento({
    id: 'evt-rock-fest-1',
    nombre: 'Gran Festival de Rock 2026',
    descripcion: 'El festival de rock más esperado del año con las bandas más destacadas.',
    categoria: categorias[0], // Música
    fecha: fechaFutura30Dias,
    tiposEntrada: [teRockGeneral, teRockPlatea, teRockVip],
    multimedia: [
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745',
      'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee',
      'https://images.unsplash.com/photo-1506157786151-b8491531f063'
    ],
    ubicacion: {
      nombre: 'Estadio José Amalfitani',
      tipo: 'estadio',
      direccion: 'Av. Juan B. Justo 9200, CABA',
      latitud: -34.6354,
      longitud: -58.5207
    },
    organizador: usuarios[0] // Carlos Productor
  });

  const eventoJazz = new Evento({
    id: 'evt-jazz-night-2',
    nombre: 'Noche de Jazz Íntimo',
    descripcion: 'Un recorrido acústico por los estándares del jazz clásico en un ambiente íntimo.',
    categoria: categorias[0], // Música
    fecha: fechaFutura5Dias,
    tiposEntrada: [teJazzMesa],
    multimedia: [
      'https://images.unsplash.com/photo-1511192336575-5a79af67a629',
      'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f'
    ],
    ubicacion: {
      nombre: 'Club de Jazz San Telmo',
      tipo: 'club',
      direccion: 'Estados Unidos 2483, CABA',
      latitud: -34.6197,
      longitud: -58.3991
    },
    organizador: usuarios[0] // Carlos Productor
  });

  const eventoTech = new Evento({
    id: 'evt-tech-summit-3',
    nombre: 'AI & Cloud Tech Summit 2026',
    descripcion: 'Cumbre de inteligencia artificial aplicada, arquitecturas de software y computación en la nube.',
    categoria: categorias[3], // Conferencias
    fecha: fechaFutura60Dias,
    tiposEntrada: [teTechPase],
    multimedia: [
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
      'https://images.unsplash.com/photo-1591115765373-5207764f72e7'
    ],
    ubicacion: {
      nombre: 'Centro de Convenciones Buenos Aires',
      tipo: 'centro_convenciones',
      direccion: 'Av. Pres. Figueroa Alcorta 2099, CABA',
      latitud: -34.5844,
      longitud: -58.3909
    },
    organizador: usuarios[1] // Ana Festivales
  });

  const eventoClasicoPasado = new Evento({
    id: 'evt-clasico-pasado-4',
    nombre: 'Clásico de Verano: Rock Nacional',
    descripcion: 'Recital histórico de apertura de temporada de verano.',
    categoria: categorias[0], // Música
    fecha: fechaPasada15Dias,
    tiposEntrada: [teClasicoGeneral],
    multimedia: [
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819',
      'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec'
    ],
    ubicacion: {
      nombre: 'Teatro Ópera Orbis',
      tipo: 'teatro',
      direccion: 'Av. Corrientes 860, CABA',
      latitud: -34.6037,
      longitud: -58.3791
    },
    organizador: usuarios[0] // Carlos Productor
  });

  const eventoBts = new Evento({
    id: 'evt-bts-tour-5',
    nombre: 'BTS World Tour: Buenos Aires',
    descripcion: 'El regreso esperado de BTS con producción completa de estadio, coreografías y repertorio completo.',
    categoria: categorias[0], // Música y Recitales
    fecha: fechaFutura45Dias,
    tiposEntrada: [teBtsCampo, teBtsPlatea, teBtsVip],
    multimedia: [
      'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4',
      'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f'
    ],
    ubicacion: {
      nombre: 'Estadio Mâs Monumental',
      tipo: 'estadio',
      direccion: 'Av. Pres. Figueroa Alcorta 7597, CABA',
      latitud: -34.5453,
      longitud: -58.4498
    },
    organizador: usuarios[1] // Ana Festivales
  });

  const eventoPitbull = new Evento({
    id: 'evt-pitbull-live-6',
    nombre: 'Pitbull — Party After Dark Tour',
    descripcion: 'Mr. Worldwide llega en vivo con todos sus éxitos internacionales en una noche a puro ritmo.',
    categoria: categorias[0], // Música y Recitales
    fecha: fechaFutura20Dias,
    tiposEntrada: [tePitbullCampo, tePitbullVip],
    multimedia: [
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30',
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7'
    ],
    ubicacion: {
      nombre: 'Movistar Arena',
      tipo: 'arena',
      direccion: 'Humboldt 450, Villa Crespo, CABA',
      latitud: -34.5944,
      longitud: -58.4477
    },
    organizador: usuarios[0] // Carlos Productor
  });

  const eventoFestival = new Evento({
    id: 'evt-primavera-fest-7',
    nombre: 'Primavera Sound & Indie Festival',
    descripcion: 'Tres jornadas con más de 40 artistas internacionales y locales, escenarios al aire libre y gastronomía.',
    categoria: categorias[0], // Música y Recitales
    fecha: fechaFutura75Dias,
    tiposEntrada: [teFestivalGeneral, teFestivalComfort],
    multimedia: [
      'https://images.unsplash.com/photo-1459749411175-04bf5292ceea',
      'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3',
      'https://images.unsplash.com/photo-1506157786151-b8491531f063'
    ],
    ubicacion: {
      nombre: 'Parque de los Niños (Predio Costanera)',
      tipo: 'predio',
      direccion: 'Av. Cantilo y Av. General Paz, CABA',
      latitud: -34.5322,
      longitud: -58.4581
    },
    organizador: usuarios[1] // Ana Festivales
  });

  const eventoNerdearla = new Evento({
    id: 'evt-nerdearla-it-8',
    nombre: 'Nerdearla 2026: DevOps, Cloud & Sistemas',
    descripcion: 'Charlas técnicas, talleres prácticos y espacios de comunidad sobre ingeniería de software, SRE y datos.',
    categoria: categorias[3], // Conferencias y Charlas
    fecha: fechaFutura14Dias,
    tiposEntrada: [teNerdearlaComunidad, teNerdearlaWorkshop],
    multimedia: [
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678',
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4'
    ],
    ubicacion: {
      nombre: 'Ciudad Cultural Konex',
      tipo: 'centro_cultural',
      direccion: 'Sarmiento 3131, Abasto, CABA',
      latitud: -34.6064,
      longitud: -58.4106
    },
    organizador: usuarios[1] // Ana Festivales
  });

  const eventoEkoparty = new Evento({
    id: 'evt-ekoparty-sec-9',
    nombre: 'Ekoparty Security Conference',
    descripcion: 'La conferencia líder de ciberseguridad en Latinoamérica: charlas de investigación, AppSec y desafíos CTF.',
    categoria: categorias[3], // Conferencias y Charlas
    fecha: fechaFutura38Dias,
    tiposEntrada: [teEkoGeneral, teEkoTraining],
    multimedia: [
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5'
    ],
    ubicacion: {
      nombre: 'Centro Costa Salguero',
      tipo: 'centro_convenciones',
      direccion: 'Av. Costanera Rafael Obligado 1221, CABA',
      latitud: -34.5656,
      longitud: -58.3976
    },
    organizador: usuarios[0] // Carlos Productor
  });

  const eventoReactConf = new Evento({
    id: 'evt-react-conf-10',
    nombre: 'React & Mobile Conf Latam',
    descripcion: 'Conferencia enfocada en desarrollo frontend, React Native, Expo, rendimiento web y diseño de interfaces.',
    categoria: categorias[3], // Conferencias y Charlas
    fecha: fechaFutura25Dias,
    tiposEntrada: [teReactEarly, teReactFull],
    multimedia: [
      'https://images.unsplash.com/photo-1515187029135-18ee286d815b',
      'https://images.unsplash.com/photo-1531482615713-2afd69097998'
    ],
    ubicacion: {
      nombre: 'Teatro Gran Rex',
      tipo: 'teatro',
      direccion: 'Av. Corrientes 857, CABA',
      latitud: -34.6034,
      longitud: -58.3788
    },
    organizador: usuarios[1] // Ana Festivales
  });

  const eventos = [
    eventoRock,
    eventoJazz,
    eventoTech,
    eventoClasicoPasado,
    eventoBts,
    eventoPitbull,
    eventoFestival,
    eventoNerdearla,
    eventoEkoparty,
    eventoReactConf
  ];
  for (const ev of eventos) {
    await eventoRepository.save(ev);
  }

  // 5. Favoritos (Juan Comprador tiene en favoritos el Gran Festival de Rock)
  const juanComprador = await usuarioRepository.findById('usr-comprador-1');
  if (juanComprador) {
    juanComprador.agregarFavorito(eventoRock);
    await usuarioRepository.update('usr-comprador-1', juanComprador);
  }

  // 6. Mensajes del Chat previo para la compra activa
  const msg1 = new Mensaje({
    id: 'msg-seed-1',
    usuario: juanComprador,
    mensaje: '¿A qué hora habilitan el acceso para Campo General?',
    enviado: new Date(ahora.getTime() - 2 * 60 * 60 * 1000)
  });
  msg1.compra = 'cmp-activa-1';

  const msg2 = new Mensaje({
    id: 'msg-seed-2',
    usuario: usuarios[0], // Carlos Productor
    mensaje: 'Hola Juan! Las puertas abren a las 18:00 hs, dos horas antes del inicio del show principal.',
    enviado: new Date(ahora.getTime() - 1 * 60 * 60 * 1000)
  });
  msg2.compra = 'cmp-activa-1';

  await mensajeRepository.save(msg1);
  await mensajeRepository.save(msg2);

  // 7. Compras
  // Compra activa: Juan Comprador adquirió 2 Campo General para el Festival de Rock
  const compraActiva = new Compra({
    id: 'cmp-activa-1',
    comprador: juanComprador,
    evento: eventoRock,
    tipoEntrada: teRockGeneral,
    cantidad: 2,
    total: 30000,
    estado: estadoCompra.CONFIRMADA,
    mensajes: [msg1, msg2]
  });

  // Compra utilizada 1: Juan Comprador asistió al evento clásico pasado (puede calificarlo)
  const compraUtilizadaJuan = new Compra({
    id: 'cmp-utilizada-1',
    comprador: juanComprador,
    evento: eventoClasicoPasado,
    tipoEntrada: teClasicoGeneral,
    cantidad: 1,
    total: 8000,
    estado: estadoCompra.UTILIZADA,
    mensajes: []
  });

  // Compra utilizada 2: María Compradora asistió al evento clásico pasado (asociada a reseña existente)
  const mariaCompradora = await usuarioRepository.findById('usr-comprador-2');
  const compraUtilizadaMaria = new Compra({
    id: 'cmp-utilizada-2',
    comprador: mariaCompradora,
    evento: eventoClasicoPasado,
    tipoEntrada: teClasicoGeneral,
    cantidad: 2,
    total: 16000,
    estado: estadoCompra.UTILIZADA,
    mensajes: []
  });

  // Compra activa 2: Para pruebas de cancelación y reembolsos (CU07 / CU08)
  const compraActiva2 = new Compra({
    id: 'cmp-activa-2',
    comprador: juanComprador,
    evento: eventoRock,
    tipoEntrada: teRockPlatea,
    cantidad: 1,
    total: 25000,
    estado: estadoCompra.CONFIRMADA,
    mensajes: []
  });

  const compras = [compraActiva, compraActiva2, compraUtilizadaJuan, compraUtilizadaMaria];
  for (const comp of compras) {
    await compraRepository.save(comp);
  }

  // 8. Historial de Auditoría de Estados (CambioEstadoCompra)
  const transiciones = [
    new CambioEstadoCompra({
      id: 'trans-activa-1',
      compra: compraActiva,
      estado: estadoCompra.CONFIRMADA,
      quien: juanComprador,
      fechaHora: new Date(ahora.getTime() - 3 * 24 * 60 * 60 * 1000)
    }),
    new CambioEstadoCompra({
      id: 'trans-activa-2',
      compra: compraActiva2,
      estado: estadoCompra.CONFIRMADA,
      quien: juanComprador,
      fechaHora: new Date(ahora.getTime() - 2 * 24 * 60 * 60 * 1000)
    }),
    new CambioEstadoCompra({
      id: 'trans-utilizada-juan-1',
      compra: compraUtilizadaJuan,
      estado: estadoCompra.CONFIRMADA,
      quien: juanComprador,
      fechaHora: new Date(fechaPasada15Dias.getTime() - 5 * 24 * 60 * 60 * 1000)
    }),
    new CambioEstadoCompra({
      id: 'trans-utilizada-juan-2',
      compra: compraUtilizadaJuan,
      estado: estadoCompra.UTILIZADA,
      quien: usuarios[0], // Carlos Productor (acceso)
      fechaHora: fechaPasada15Dias
    }),
    new CambioEstadoCompra({
      id: 'trans-utilizada-maria-1',
      compra: compraUtilizadaMaria,
      estado: estadoCompra.CONFIRMADA,
      quien: mariaCompradora,
      fechaHora: new Date(fechaPasada15Dias.getTime() - 4 * 24 * 60 * 60 * 1000)
    }),
    new CambioEstadoCompra({
      id: 'trans-utilizada-maria-2',
      compra: compraUtilizadaMaria,
      estado: estadoCompra.UTILIZADA,
      quien: usuarios[0],
      fechaHora: fechaPasada15Dias
    })
  ];

  for (const t of transiciones) {
    await cambioEstadoCompraRepository.save(t);
  }

  // 9. Reseñas y Reputación
  const reseniaMaria = new Resenia({
    id: 'res-seed-1',
    comprador: mariaCompradora,
    evento: eventoClasicoPasado,
    detalle: 'Sonido excelente y una puntualidad destacable. ¡Gran evento organizado por Carlos!',
    puntuacion: 5.0
  });
  reseniaMaria.organizador = 'usr-organizador-1';
  await reseniaRepository.save(reseniaMaria);

  // Asegurar reputación de Carlos Productor en base a la reseña
  const carlosProductor = await usuarioRepository.findById('usr-organizador-1');
  if (carlosProductor) {
    carlosProductor.reputacion = 5.0;
    await usuarioRepository.update('usr-organizador-1', carlosProductor);
  }

  return {
    usuarios: usuarios.length,
    categorias: categorias.length,
    eventos: eventos.length,
    compras: compras.length,
    mensajes: 2,
    resenias: 1
  };
}

// Ejecución directa por CLI si se invoca directamente con Node
const isDirectExecution = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('backend/utils/seed.js');
if (isDirectExecution) {
  seedDatabase({ clearExisting: true })
    .then(summary => {
      console.log('🌱 Seed ejecutado exitosamente con datos representativos:');
      console.table(summary);
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Error durante la ejecución del seed:', err);
      process.exit(1);
    });
}
