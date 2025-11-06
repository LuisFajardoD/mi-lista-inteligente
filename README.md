# Mi Lista Inteligente — Proyecto VII

## Descripción del proyecto
**Mi Lista Inteligente** es una aplicación web desarrollada en el marco del curso **Proyecto VII** (UDGVirtual).  
Permite **cargar** listas de artículos (manual/CSV/XLSX), **unificar** duplicados, **comparar** precios entre proveedores y obtener el **costo total** de compra. Incluye **exportables** (PDF del comparativo y **CSV Carrito**), **historial de precios**, **alertas**, **colaboración por roles** y **planes/pagos en sandbox**.

---

## Estado actual y entregables
- Incremento final **aceptado** (S3–S7).
- Fuente de precios actual: **SerpAPI** (operativa). Las **APIs nativas por proveedor** quedan para la siguiente etapa.
- Evidencias:
  - **Actividad 3.6 – Sprint Review:** `/docs/actividad-3.6/Actividad 3.6. Sprint Review.pdf`
  - **Producto Integrador (PI):** `/docs/pi/PI-Producto-Integrador.pdf`

---

## Objetivos generales
- Desarrollar un prototipo funcional bajo **Scrum** con entregas incrementales.
- Implementar **autenticación** y **persistencia** seguras.
- Permitir **carga** y **unificación** de listas en formatos digitales.
- Incorporar un **comparador** multi-proveedor con **costo total**.
- Habilitar **exportables** (PDF comparativo, **CSV Carrito**), **historial** y **alertas**.
- Documentar el avance **por sprints** conforme a la planeación.

---

## Tecnologías utilizadas
- **Frontend:** React + Vite (TypeScript)
- **Servicios backend (BaaS):** Supabase (auth, BD, RLS)
- **Lenguajes:** TypeScript / JavaScript
- **Control de versiones:** Git + GitHub
- **Metodología:** Scrum

---

## Planeación y resultados por sprint

**semanas del curso**.

### 🟢 Sprint 1 (Finalizado) — Semana 1–2
**Alcance logrado**
- **Autenticación** (registro, inicio de sesión, recuperación) con Supabase.
- **Carga de listas** (CSV/XLSX) y captura manual.
- **Unificación** de productos repetidos (por nombre/SKU) con suma de cantidades.
- Validaciones de formato y retroalimentación en UI.  
**Resultado:** base funcional para administración de listas.

---

### 🟢 Sprint 2 (Finalizado) — Semana 3–4
**Alcance logrado**
- **Comparador de precios** (consulta a proveedores vía agregador).
- Visualización de **precio + envío + disponibilidad** por proveedor.
- Selección de **mejor oferta** por producto.  
**Resultado:** comparación visible; **H6 (total)** se reprograma para S3.

---

### 🟢 Sprint 3 (Finalizado) — Semana 5–6
**Alcance logrado**
- **Costo total** (mejor precio por renglón + total general).
- **Alertas** (PRICE_DROP, BACK_IN_STOCK).
- **Historial de precios** (`price_history`) y vista de consulta.  
**Resultado:** comparador + total con seguimiento (historial/alertas).

---

### 🟢 Sprint 4 (Finalizado) — Semana 7–8
**Alcance logrado**
- **PDF del comparativo** (jsPDF + autotable).
- **Afiliados** (enlaces de compra).  
**Resultado:** evidencia descargable y monetización inicial.

---

### 🟢 Sprint 5 (Finalizado) — Semana 9–10
**Alcance logrado**
- **Planes/Suscripciones** (Gratis/Premium/B2B) con restricciones visibles.
- Avances en **colaboración** (diseño y modelos).
- **Replanificación:** pagos y consolidación de colaboración se mueven a S6.  
**Resultado:** incremento funcional aceptado.

---

### 🟢 Sprint 6 (Finalizado) — Semana 11–12
**Alcance logrado (35 pts)**
- **Pagos (sandbox)**: activación de plan y persistencia (`user_plans`).
- **Colaboración**: **Equipos/Roles** (owner/editor/viewer), permisos y **enlace público** de solo lectura con **expiración/revocación** (**H12.11**).
- **CSV Carrito (H9.2)**: exportación con mejor oferta por producto (precio+envío, cantidad, totales y enlace).
- **Hardening**: mejoras de UX, estados y control de errores.  
**Resultado:** producto estable y listo para cierre.

---

### 🟢 Sprint 7 (Finalizado) — Semana 13–14
**Alcance logrado (12 pts)**
- **Hardening/UI** y documentación final de sprints.
- Ajustes de accesibilidad (foco visible, contraste) y modales coherentes.
- Revisión de RLS y normalización de tablas de trabajo.
- Confirmación de operación con **SerpAPI** para la demo.  
**Resultado:** incremento final pulido y presentable.

---

## Capacidades clave (resumen)
- **Auth/Registro** y persistencia de sesión.
- **Carga** (manual/CSV/XLSX) y **unificación** de duplicados.
- **Comparador** multi-proveedor + **costo total**.
- **PDF** del comparativo y **CSV Carrito**.
- **Listas guardadas**, **historial** por producto y **alertas**.
- **Equipos/Roles** y **enlace público** (solo lectura, con expiración).
- **Planes/Suscripciones** y **pagos en sandbox**.

---

## Estructura del repositorio
mi-lista-inteligente/
├─ frontend/ # Aplicación web (Vite + React + Supabase)
├─ docs/
│ ├─ actividad-2.2/ # Entregables Sprint 1
│ ├─ actividad-2.3/ # Entregables Sprint 2
│ ├─ actividad-3.1/ # Entregables Sprint 3
│ ├─ actividad-3.2/ # Entregables Sprint 4
│ ├─ actividad-3.3/ # Entregables Sprint 5
│ ├─ actividad-3.4/ # Entregables Sprint 6
│ ├─ actividad-3.5/ # Entregables Sprint 7
│ └─ actividad-3.6/ # Sprint Review (U3)
└─ README.md



---

## Créditos
Proyecto desarrollado en la materia **Proyecto VII (UDGVirtual)** por el equipo:
- **Luis Enrique — Product Owner**
- **Alicia — Scrum Master / QA**
- **Luis Yasmani — Desarrollador Backend / DevOps**
- **Eduardo Alejandro — Desarrollador Frontend**
