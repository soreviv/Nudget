import { describe, it, expect } from 'vitest';
import { parseFilter, parseSort } from '../app.js';

describe('parseFilter', () => {
  it('retorna where vacío con input vacío', () => {
    expect(parseFilter('')).toEqual({ where: '', params: [] });
    expect(parseFilter(null)).toEqual({ where: '', params: [] });
    expect(parseFilter(undefined)).toEqual({ where: '', params: [] });
  });

  it('parsea rango de fechas', () => {
    const { where, params } = parseFilter("(date>='2024-01-01' && date<='2024-01-31')");
    expect(where).toBe('WHERE date >= ? AND date <= ?');
    expect(params).toEqual(['2024-01-01', '2024-01-31']);
  });

  it('parsea igualdades numéricas (mes y año)', () => {
    const { where, params } = parseFilter('(month=4 && year=2024)');
    expect(where).toBe('WHERE month = ? AND year = ?');
    expect(params).toEqual([4, 2024]);
  });

  it('parsea combinación de string y números', () => {
    const { where, params } = parseFilter("(category_id='abc123' && month=4 && year=2024)");
    expect(where).toBe('WHERE category_id = ? AND month = ? AND year = ?');
    expect(params).toEqual(['abc123', 4, 2024]);
  });

  it('ignora condiciones malformadas sin romper las válidas', () => {
    const { where, params } = parseFilter("(month=4 && invalid condition)");
    expect(where).toBe('WHERE month = ?');
    expect(params).toEqual([4]);
  });

  it('parsea operadores >= y <=', () => {
    const { where, params } = parseFilter('(amount>=100 && amount<=500)');
    expect(where).toBe('WHERE amount >= ? AND amount <= ?');
    expect(params).toEqual([100, 500]);
  });
});

describe('parseSort', () => {
  it('retorna vacío con input vacío', () => {
    expect(parseSort('')).toBe('');
    expect(parseSort(null)).toBe('');
    expect(parseSort(undefined)).toBe('');
  });

  it('ordena ascendente sin prefijo', () => {
    expect(parseSort('name')).toBe('ORDER BY name ASC');
  });

  it('ordena descendente con prefijo -', () => {
    expect(parseSort('-date')).toBe('ORDER BY date DESC');
  });

  it('rechaza caracteres inválidos (protección SQL injection)', () => {
    expect(parseSort('name; DROP TABLE--')).toBe('');
    expect(parseSort('col UNION SELECT')).toBe('');
  });

  it('acepta campos con underscore', () => {
    expect(parseSort('category_id')).toBe('ORDER BY category_id ASC');
    expect(parseSort('-source_id')).toBe('ORDER BY source_id DESC');
  });
});
