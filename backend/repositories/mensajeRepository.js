export class MensajeRepository {
  constructor(initialData = []) {
    this.mensajes = [];
    initialData.forEach(m => this.save(m));
  }

  async save(mensaje) {
    const id = mensaje.id || String(Date.now() + Math.random());
    mensaje.id = id;
    this.mensajes.push(mensaje);
    return mensaje;
  }

  async findByCompraId(compraId) {
    if (!compraId) return [];
    return this.mensajes
      .filter(m => {
        const cId = m.compra?.id !== undefined ? m.compra.id : m.compra;
        return String(cId) === String(compraId);
      })
      .sort((a, b) => new Date(a.enviado) - new Date(b.enviado));
  }

  async findAll() {
    return [...this.mensajes];
  }

  clear() {
    this.mensajes = [];
  }
}

export const mensajeRepository = new MensajeRepository();
