# Mi Lista Inteligente — Starter (Sprint 1)

MVP inicial con:
- Autenticación (registro/login/recuperación) via Supabase.
- Carga de listas en CSV/XLSX.
- Unificación de productos repetidos por `sku` o nombre normalizado.

## Requisitos
- Node 18+
- Cuenta en Supabase (gratis). Crea un proyecto y obtén URL y ANON KEY.

## Cómo correr
```bash
cd frontend
cp .env.example .env.local  # añade tus claves de Supabase
npm install
npm run dev
```

Abre http://localhost:5173

## Estructura
- `src/pages/Auth.tsx` → Registro / login / reset.
- `src/pages/UploadList.tsx` → Subir CSV/XLSX y unificar.
- `src/components/FileUpload.tsx` → Parser de CSV/XLSX.
- `src/components/ListTable.tsx` → Tabla con lista unificada.
- `src/lib/supabaseClient.ts` → Cliente Supabase.
- `src/types.ts` → Tipos TS.

## Siguientes pasos (Sprints)
- **Sprint 2**: módulo de búsqueda y comparador (APIs de Amazon/Walmart/ML — comenzaremos con mocks).
- **Sprint 3**: alertas e histórico de precios.
- **Sprint 4**: PDF + suscripciones.
