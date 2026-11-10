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

  const passwordSeed = process.env.SEED_PASSWORD || (esEntornoLocal() ? 'Password123!' : null);
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
    cupo: 98 // Originalmente 100, 2 ya adquiridas en la compra activa
  });

  const teRockPlatea = new TipoEntrada({
    id: 'te-rock-platea',
    nombre: 'Platea Numerada',
    descripcion: 'Ubicación preferencial con butaca numerada',
    precio: 25000,
    cupo: 40
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
    cupo: 0 // Evento pasado agotado
  });

  // Fechas relativas para pruebas temporales consistentes
  const ahora = new Date();
  const fechaFutura30Dias = new Date(ahora.getTime() + 30 * 24 * 60 * 60 * 1000);
  const fechaFutura5Dias = new Date(ahora.getTime() + 5 * 24 * 60 * 60 * 1000);
  const fechaFutura60Dias = new Date(ahora.getTime() + 60 * 24 * 60 * 60 * 1000);
  const fechaPasada15Dias = new Date(ahora.getTime() - 15 * 24 * 60 * 60 * 1000);

  // 4. Eventos
  const eventoRock = new Evento({
    id: 'evt-rock-fest-1',
    nombre: 'Gran Festival de Rock 2026',
    descripcion: 'El festival de rock más esperado del año con las bandas más destacadas.',
    categoria: categorias[0], // Música
    fecha: fechaFutura30Dias,
    tiposEntrada: [teRockGeneral, teRockPlatea, teRockVip],
    multimedia: ['https://images.unsplash.com/photo-1470225620780-dba8ba36b745'],
    organizador: usuarios[0] // Carlos Productor
  });

  const eventoJazz = new Evento({
    id: 'evt-jazz-night-2',
    nombre: 'Noche de Jazz Íntimo',
    descripcion: 'Un recorrido acústico por los estándares del jazz clásico en un ambiente íntimo.',
    categoria: categorias[0], // Música
    fecha: fechaFutura5Dias,
    tiposEntrada: [teJazzMesa],
    multimedia: ['https://images.unsplash.com/photo-1511192336575-5a79af67a629'],
    organizador: usuarios[0] // Carlos Productor
  });

  const eventoTech = new Evento({
    id: 'evt-tech-summit-3',
    nombre: 'AI & Cloud Tech Summit 2026',
    descripcion: 'Cumbre de inteligencia artificial aplicada, arquitecturas de software y computación en la nube.',
    categoria: categorias[3], // Conferencias
    fecha: fechaFutura60Dias,
    tiposEntrada: [teTechPase],
    multimedia: ['https://images.unsplash.com/photo-1540575467063-178a50c2df87'],
    organizador: usuarios[1] // Ana Festivales
  });

  const eventoClasicoPasado = new Evento({
    id: 'evt-clasico-pasado-4',
    nombre: 'Clásico de Verano: Rock Nacional',
    descripcion: 'Recital histórico de apertura de temporada de verano.',
    categoria: categorias[0], // Música
    fecha: fechaPasada15Dias,
    tiposEntrada: [teClasicoGeneral],
    multimedia: [],
    organizador: usuarios[0] // Carlos Productor
  });

  const eventos = [eventoRock, eventoJazz, eventoTech, eventoClasicoPasado];
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

  const msg2 = new Mensaje({
    id: 'msg-seed-2',
    usuario: usuarios[0], // Carlos Productor
    mensaje: 'Hola Juan! Las puertas abren a las 18:00 hs, dos horas antes del inicio del show principal.',
    enviado: new Date(ahora.getTime() - 1 * 60 * 60 * 1000)
  });

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

  const compras = [compraActiva, compraUtilizadaJuan, compraUtilizadaMaria];
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
