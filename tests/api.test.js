import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import Database from 'better-sqlite3';
import { createApp, SCHEMA } from '../app.js';

let app;

beforeAll(() => {
  const db = new Database(':memory:');
  db.exec(SCHEMA);
  app = createApp(db);
});

// ─── Tabla inválida ────────────────────────────────────────────────────────────

describe('tabla inválida', () => {
  it('GET devuelve 404', async () => {
    const res = await request(app).get('/api/collections/usuarios/records');
    expect(res.status).toBe(404);
  });

  it('POST devuelve 404', async () => {
    const res = await request(app).post('/api/collections/usuarios/records').send({ name: 'X' });
    expect(res.status).toBe(404);
  });

  it('PATCH devuelve 404', async () => {
    const res = await request(app).patch('/api/collections/usuarios/records/123').send({ name: 'X' });
    expect(res.status).toBe(404);
  });

  it('DELETE devuelve 404', async () => {
    const res = await request(app).delete('/api/collections/usuarios/records/123');
    expect(res.status).toBe(404);
  });
});

// ─── CRUD categories ──────────────────────────────────────────────────────────

describe('categories CRUD', () => {
  let id;

  it('lista vacía al inicio', async () => {
    const res = await request(app).get('/api/collections/categories/records');
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.totalItems).toBe(0);
  });

  it('crea una categoría', async () => {
    const res = await request(app)
      .post('/api/collections/categories/records')
      .send({ name: 'Comida', icon: '🍔', color: '#f00' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    expect(res.body.name).toBe('Comida');
    expect(res.body.icon).toBe('🍔');
    id = res.body.id;
  });

  it('la lista contiene la categoría creada', async () => {
    const res = await request(app).get('/api/collections/categories/records');
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].id).toBe(id);
  });

  it('actualiza la categoría', async () => {
    const res = await request(app)
      .patch(`/api/collections/categories/records/${id}`)
      .send({ name: 'Alimentación' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Alimentación');
    expect(res.body.icon).toBe('🍔');
  });

  it('elimina la categoría', async () => {
    const res = await request(app).delete(`/api/collections/categories/records/${id}`);
    expect(res.status).toBe(204);
  });

  it('lista vacía tras eliminar', async () => {
    const res = await request(app).get('/api/collections/categories/records');
    expect(res.body.items).toHaveLength(0);
  });
});

// ─── Filtros y ordenamiento ───────────────────────────────────────────────────

describe('expenses — filtros y ordenamiento', () => {
  const gastos = [
    { amount: 100, description: 'Supermercado', date: '2024-03-05' },
    { amount: 200, description: 'Renta',        date: '2024-03-15' },
    { amount: 50,  description: 'Café',          date: '2024-04-01' },
  ];

  beforeAll(async () => {
    for (const g of gastos) {
      await request(app).post('/api/collections/expenses/records').send(g);
    }
  });

  it('filtra por rango de fechas', async () => {
    const res = await request(app)
      .get('/api/collections/expenses/records')
      .query({ filter: "(date>='2024-03-01' && date<='2024-03-31')" });
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.items.every(e => e.date.startsWith('2024-03'))).toBe(true);
  });

  it('ordena por monto descendente', async () => {
    const res = await request(app)
      .get('/api/collections/expenses/records')
      .query({ sort: '-amount' });
    const amounts = res.body.items.map(e => e.amount);
    expect(amounts).toEqual([...amounts].sort((a, b) => b - a));
  });

  it('ordena por fecha ascendente', async () => {
    const res = await request(app)
      .get('/api/collections/expenses/records')
      .query({ sort: 'date' });
    const dates = res.body.items.map(e => e.date);
    expect(dates).toEqual([...dates].sort());
  });
});

// ─── Filtro mes/año en budgets ─────────────────────────────────────────────────

describe('budgets — filtro mes/año', () => {
  let catId;

  beforeAll(async () => {
    const cat = await request(app)
      .post('/api/collections/categories/records')
      .send({ name: 'Transporte', icon: '🚌', color: '#00f' });
    catId = cat.body.id;

    await request(app).post('/api/collections/budgets/records')
      .send({ category_id: catId, amount: 1000, month: 3, year: 2024 });
    await request(app).post('/api/collections/budgets/records')
      .send({ category_id: catId, amount: 1500, month: 4, year: 2024 });
  });

  it('filtra correctamente por mes y año', async () => {
    const res = await request(app)
      .get('/api/collections/budgets/records')
      .query({ filter: '(month=3 && year=2024)' });
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].amount).toBe(1000);
  });
});

// ─── Seguridad: columnas no permitidas se ignoran ──────────────────────────────

describe('seguridad — columnas no permitidas', () => {
  it('ignora campos fuera de TABLE_COLS en POST', async () => {
    const res = await request(app)
      .post('/api/collections/categories/records')
      .send({ name: 'Test', malicious: "'; DROP TABLE categories;--" });
    expect(res.status).toBe(201);
    expect(res.body).not.toHaveProperty('malicious');
  });

  it('PATCH sin campos válidos devuelve 400', async () => {
    const res = await request(app)
      .patch('/api/collections/categories/records/nonexistent')
      .send({ malicious: 'x' });
    expect(res.status).toBe(400);
  });
});
