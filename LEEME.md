# Quiniela Mundial 2026 — Guía de instalación

App web compartida: tú actualizas resultados y los 16 participantes ven lo mismo.
Todo gratis: Supabase (base de datos) + Vercel (hosting).

Tiempo estimado: 30–45 min. No necesitas saber programar, solo seguir la receta.

---

## Paso 1 — Crear la base de datos en Supabase (gratis)

1. Entra a https://supabase.com y crea una cuenta (puedes usar GitHub o correo).
2. Click en "New project". Ponle nombre (ej. `quiniela-2026`), elige una contraseña
   para la base de datos y la región más cercana (East US sirve). Espera ~2 min.
3. En el menú izquierdo ve a "SQL Editor" → "New query", pega esto y dale "Run":

```sql
create table quiniela (
  id integer primary key,
  data jsonb
);

-- Permitir lectura y escritura pública (suficiente para una quiniela de amigos).
alter table quiniela enable row level security;

create policy "lectura publica" on quiniela
  for select using (true);

create policy "escritura publica" on quiniela
  for all using (true) with check (true);
```

4. Activa tiempo real: menú izquierdo "Database" → "Replication" (o "Publications")
   → asegúrate de que la tabla `quiniela` esté incluida en la publicación.
   Si no encuentras la opción, la app igual funciona; solo habrá que refrescar
   el navegador para ver cambios en lugar de verlos en vivo.

5. Copia tus dos claves: menú "Project Settings" (engrane) → "API":
   - **Project URL** (algo como `https://abcd.supabase.co`)
   - **anon public** key (una cadena larga)
   Las necesitas en el Paso 3.

---

## Paso 2 — Subir el código a GitHub

1. Crea una cuenta en https://github.com si no tienes.
2. Crea un repositorio nuevo (botón "New"), nómbralo `quiniela-2026`, déjalo público
   o privado, sin README.
3. Sube esta carpeta completa. La forma más fácil sin terminal:
   en la página del repo vacío, click "uploading an existing file" y arrastra
   TODOS los archivos de esta carpeta (menos `node_modules` si existe).
   Asegúrate de incluir las carpetas `src`, y los archivos `package.json`,
   `index.html`, `vite.config.js`, etc.

   (Si prefieres terminal: `git init && git add . && git commit -m "init" &&
   git branch -M main && git remote add origin TU_URL && git push -u origin main`)

---

## Paso 3 — Publicar en Vercel (gratis)

1. Entra a https://vercel.com y regístrate con tu cuenta de GitHub.
2. "Add New" → "Project" → importa tu repo `quiniela-2026`.
3. Vercel detecta Vite automáticamente. Antes de dar Deploy, abre
   "Environment Variables" y agrega estas dos (las del Paso 1.5):

   | Name                     | Value                          |
   |--------------------------|--------------------------------|
   | VITE_SUPABASE_URL        | tu Project URL                 |
   | VITE_SUPABASE_ANON_KEY   | tu clave anon public           |

4. Click "Deploy". En ~1 min tendrás una URL pública tipo
   `https://quiniela-2026.vercel.app`. Esa es la liga que compartes con tus amigos.

---

## Uso

- Cualquiera con la liga ve standings, reglas, equipos y pagos (solo lectura).
- Para editar: pestaña "Admin" → PIN **2026** → activa modo admin.
  Cambia el PIN en `src/App.jsx` (constante `DEFAULT_PIN`) si quieres.
- Sortea equipos, marca pagos y captura avances en la pestaña "Resultados".
  Cada cambio se guarda en Supabase y los demás lo ven al instante (o al refrescar).

## Notas

- El PIN es solo una barrera básica; el código corre en el navegador. Para una
  quiniela de amigos es suficiente. No pongas dinero real en riesgo confiando en él.
- La pestaña Resultados usa datos manuales (mock). La función `fetchWorldCupResults()`
  en `src/App.jsx` ya está estructurada para conectar una API real de futbol después.
- Capas gratuitas de Supabase y Vercel sobran para 16 personas.
