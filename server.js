import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import { createApp, SCHEMA } from './app.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, 'nudget.db'));

db.pragma('journal_mode = WAL');
db.exec(SCHEMA);

const app = createApp(db);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Nudget en http://localhost:${PORT}`));
