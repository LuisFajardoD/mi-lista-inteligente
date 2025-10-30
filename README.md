# Mi Lista Inteligente — Proyecto VII

## Descripción del proyecto
**Mi Lista Inteligente** es una aplicación web desarrollada como parte del curso **Proyecto VII** en UDGVirtual.  
El objetivo principal es apoyar a familias y pequeños negocios en la optimización de sus compras, permitiendo cargar listas de artículos, unificar productos repetidos y comparar precios entre diferentes proveedores.

La propuesta combina un enfoque académico con una visión práctica de aplicación real en el mercado, explorando posibles modelos de monetización mediante afiliaciones y servicios premium.

---

## Objetivos generales
- Desarrollar un prototipo funcional con base en metodologías ágiles (Scrum).
- Implementar un sistema de autenticación seguro para usuarios.
- Permitir la carga y unificación de listas de artículos en formato digital.
- Incorporar un comparador de precios con proveedores externos.
- Implementar alertas de precios e historial de productos.
- Documentar el avance del proyecto por sprints, de acuerdo con la planeación establecida.

---

## Tecnologías utilizadas
- **Frontend:** React + Vite + TypeScript  
- **Backend como servicio:** Supabase (autenticación y base de datos)  
- **Lenguaje:** JavaScript/TypeScript  
- **Control de versiones:** Git y GitHub  
- **Metodología:** Scrum

---

## Planeación y resultados por sprint

### 🟢 Sprint 1 (Finalizado)
**Periodo:** 8–21 septiembre 2025  
**Alcance logrado:**  
- **Autenticación de usuarios** (registro, inicio de sesión, recuperación) con Supabase.  
- **Carga de listas** (CSV/XLSX).  
- **Unificación de productos** repetidos (consolidación de cantidades).  
- Validaciones básicas y retroalimentación al usuario.  
**Resultado:** sistema inicial funcional para administrar listas de productos de manera unificada.

---

### 🟢 Sprint 2 (Finalizado)
**Periodo:** 22 septiembre – 5 octubre 2025  
**Alcance logrado:**  
- **Comparador de precios** con datos simulados para Amazon, Walmart y Mercado Libre.  
- Presentación de **precio + envío + disponibilidad** por proveedor.  
- Identificación de **mejor oferta por producto**.  
- Cálculo de **totales** considerando cantidad.  
**Resultado:** comparación visible entre proveedores que optimiza la decisión de compra.

---

### 🟢 Sprint 3 (Finalizado)
**Periodo:** 6–19 octubre 2025  
**Alcance logrado:**  
- **Cálculo de costo total** con envíos (pendiente de S2).  
- **Alertas automáticas**: PRICE_DROP (≥5%) y BACK_IN_STOCK.  
- Tabla **`price_history`** y persistencia de históricos.  
- Vista **/history** para consultar cambios.  
**Resultado:** comparador completo con alertas e histórico de precios consultable.

---

### 🟢 Sprint 4 (Finalizado)
**Periodo:** 20 octubre – 2 noviembre 2025  
**Alcance logrado:**  
- **Enlaces de afiliado** por proveedor con **tracking por usuario**.  
- Botón **“Comprar”** por producto.  
- **Exportación a PDF** del comparativo (jsPDF + Autotable): título, fecha, tabla completa y **total del carrito**.  
- Pruebas de integración con alertas e historial.  
**Resultado:** monetización inicial por afiliados y evidencia descargable del comparativo.  
Flujo principal: **Subir lista → Unificar → Comparar → Comprar/Descargar**.

---

### 🟢 Sprint 5 (Finalizado)
**Periodo:** 3–16 noviembre 2025  
**Alcance logrado:**  
- **Suscripciones (H11.1–H11.3, H11.5–H11.7)**: planes **Gratis/Premium/B2B** con restricciones por plan visibles en la UI.  
- **Carga masiva (H12.1–H12.3)**: importación **Excel/CSV** con validación básica y consolidación en la lista.  
- **Replanificación controlada** a mitad de sprint: **H11.4 (pagos)** y **H12.4–H12.10 (colaboración/roles/permisos/compartir + pruebas/demo)** se movieron a **Sprint 6**.  
**Resultado:** incremento **funcional y aceptado por el PO**.

---

### 🟢 Sprint 6 (Finalizado)
**Periodo:** 17–30 noviembre 2025  
**Alcance logrado (35 pts):**  
- **Pagos (H11.4)**: activación de plan **Gratis/Premium/B2B** desde la UI (sandbox), persistencia en **`user_plans`**, y reflejo inmediato de límites por plan.  
- **Colaboración (H12.4–H12.8, H12.9–H12.10)**:  
  - **Equipos y roles** (owner/editor/viewer) con **RLS** y políticas por tabla.  
  - **Permisos** de edición/solo lectura y **compartir listas** (interno por correo).  
  - **Enlace público de solo lectura con expiración/revocación (H12.11)**.  
  - **Pruebas integrales + demo y aceptación del PO**.  
- **Carrito Rápido (H9.2)**: exportación **CSV** con la **mejor oferta por producto** (precio+envío, cantidad, totales y enlace de compra).  
- **Estabilidad técnica**: tabla **`working_lists`** con **UNIQUE(user_id)** para **upsert** confiable; RLS activo en tablas nuevas.

**Resultado:** producto **estable y trazable**, listo para pulido visual y hardening en S7.  
**Lo reprogramado a S7 (buffer):** ajustes de **CSS/UX/UI**, observabilidad y micro-mejoras.

---

### 🟢 Sprint 7 (Finalizado)
**Periodo:** 1–14 diciembre 2025  
**Alcance logrado (12 pts):**  
- **Corrección de errores y hardening**: triggers `updated_at`, RLS mínimas y normalización de `working_lists` (UNIQUE por usuario).  
- **Rediseño de UI/UX**:  
  - Panel lateral, tarjetas y tablas con mejor legibilidad (clamp, anchos, alineación numérica).  
  - **Modales de confirmación** accesibles (claro/oscuro, foco visible, Esc).  
  - **Pagos**: tarjetas Premium/Free/B2B con **acento morado** para plan activo y botones coherentes.  
  - **Listas guardadas**: acciones alineadas (Abrir/Renombrar/Compartir/Borrar).  
- **Búsquedas reales**: SerpAPI operando como capa de búsqueda estable para la demo.  
- **Documentación y empaquetado**: README/entregables, smoke E2E de cierre (Login → Upload → Unificar → Comparar → Guardar/Compartir).

**Resultado:** incremento final **pulido y presentable**, con flujo completo de punta a punta y documentación lista para entrega.

---

## Estructura del repositorio
mi-lista-inteligente/  
├─ frontend/  # Aplicación web (Vite + React + Supabase)  
├─ docs/  
│  ├─ actividad-2.2/   # Entregables Sprint 1  
│  ├─ actividad-2.3/   # Entregables Sprint 2  
│  ├─ actividad-3.1/   # Entregables Sprint 3  
│  ├─ actividad-3.2/   # Entregables Sprint 4  
│  ├─ actividad-3.3/   # Entregables Sprint 5  
│  ├─ actividad-3.4/   # Entregables Sprint 6  
│  └─ actividad-3.5/   # Entregables Sprint 7  
└─ README.md

---

## Créditos
Proyecto desarrollado en el marco de la materia Proyecto VII (UDGVirtual) por el equipo:  
- **Luis Enrique – Product Owner**  
- **Alicia – Scrum Master / QA**  
- **Luis Yasmani – Backend / DevOps**  
- **Eduardo Alejandro – Frontend**