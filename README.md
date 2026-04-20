# Nudget

> Aplicación web de finanzas personales — ligera, sin instalación, mobile-first.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![HTML](https://img.shields.io/badge/Stack-HTML%2FJS%2FCSupabase-blue)](#tecnologías)
[![Security Policy](https://img.shields.io/badge/Security-Policy-red)](SECURITY.md)

---

## Características

- **Gastos e ingresos** — registra movimientos con categoría, proyecto y notas
- **Presupuestos** — define límites mensuales por categoría con barras de progreso
- **Resumen mensual** — balance, métricas y gráficas (dona + barras) con Chart.js
- **Historial** — filtra por mes, elimina registros, exporta CSV con BOM UTF-8
- **Configuración** — crea categorías, fuentes de ingreso y proyectos con colores personalizados
- **Sin instalación** — un solo archivo `index.html`, abre directamente en el navegador
- **Diseño dark mobile-first** — optimizado para pantallas de 520 px o menos

## Demo rápida

Abre `index.html` en cualquier navegador moderno. La app conecta automáticamente al backend Supabase configurado.

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5 + CSS3 + JavaScript vanilla |
| Gráficas | [Chart.js 4.4](https://www.chartjs.org/) (CDN) |
| Backend | [PocketBase](https://pocketbase.io/) (SQLite + REST API, self-hosted) |
| Fuentes | DM Sans & DM Mono (Google Fonts) |

## Estructura de base de datos

```
categories       — id, name, icon, color
projects         — id, name, description, color
income_sources   — id, name, color
expenses         — id, amount, description, date, category_id, project_id, notes
incomes          — id, amount, description, date, source_id, notes
budgets          — id, category_id, amount, month, year  (unique: category_id+month+year)
```

## Configuración

### 1. Instalar PocketBase

Descarga el binario para tu sistema desde [pocketbase.io/docs](https://pocketbase.io/docs):

```bash
# Ejemplo en macOS/Linux
./pocketbase serve
# Abre http://127.0.0.1:8090/_/ para el panel de administración
```

### 2. Crear las colecciones

En el panel de administración (`/_/`), crea las siguientes colecciones con campos de tipo **Text** salvo indicación:

| Colección | Campos |
|-----------|--------|
| `categories` | `name`, `icon`, `color` |
| `projects` | `name`, `description`, `color` |
| `income_sources` | `name`, `color` |
| `expenses` | `amount` (Number), `description`, `date`, `category_id`, `project_id`, `notes` |
| `incomes` | `amount` (Number), `description`, `date`, `source_id`, `notes` |
| `budgets` | `category_id`, `amount` (Number), `month` (Number), `year` (Number) |

### 3. Configurar la URL

En `index.html`, ajusta si PocketBase corre en otro host/puerto:

```js
const PB_URL = 'http://127.0.0.1:8090';
```

### 4. Abrir la app

Abre `index.html` en el navegador. La app se conecta a tu instancia local de PocketBase.

> **Nota:** Para exponer la app en producción, cambia `PB_URL` al dominio público de tu servidor y habilita reglas de acceso en las colecciones desde el panel de administración.

## Seguridad

Consulta [SECURITY.md](SECURITY.md) para la política de reporte de vulnerabilidades.

## Licencia

Distribuido bajo la licencia [MIT](LICENSE). Úsalo, modifícalo y compártelo libremente.
