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
- **Replanificación controlada** a mitad de sprint (burndown): **H11.4 (pagos)** y **H12.4–H12.10 (colaboración/roles/permisos/compartir + pruebas/demo)** se movieron a **Sprint 6** para asegurar un incremento estable y demostrable.
- **Evidencias** por historia: capturas/gif y PRs aceptados por el PO.

**Resultado:** incremento **funcional y aceptado por el PO**, con planes operativos y carga masiva activa. Compromiso final cumplido tras ajuste de alcance.

---

## Estructura del repositorio
mi-lista-inteligente/  
├─ frontend/  # Aplicación web (Vite + React + Supabase)  
├─ docs/  
│  ├─ actividad-2.2/   # Entregables Sprint 1  
│  ├─ actividad-2.3/   # Entregables Sprint 2  
│  ├─ actividad-3.1/   # Entregables Sprint 3  
│  ├─ actividad-3.2/   # Entregables Sprint 4  
│  └─ actividad-3.3/   # Entregables Sprint 5  
└─ README.md

---

## Próximos pasos
- **Sprint 6:** completar **H11.4 (pagos)** y **H12.4–H12.10 (colaboración/roles/permisos/compartir + pruebas/demo)**; pulir demo y evidencias finales.  
- **Sprint 7 (Buffer):** hardening, CSS/UX/UI, correcciones menores y empaquetado de la entrega final (release/tag, documentación).

---

## Créditos
Proyecto desarrollado en el marco de la materia Proyecto VII (UDGVirtual) por el equipo:  
- **Luis Enrique – Product Owner**  
- **Alicia – Scrum Master / QA**  
- **Luis Yasmani – Backend / DevOps**  
- **Eduardo Alejandro – Frontend**
