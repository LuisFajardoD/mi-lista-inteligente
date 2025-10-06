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
- Implementación de **autenticación de usuarios** (registro, inicio de sesión y recuperación de contraseña) mediante Supabase.  
- Módulo para la **carga de listas en formato CSV/XLSX**.  
- Algoritmo de **unificación de productos repetidos**, consolidando cantidades y eliminando duplicados.  
- Validaciones básicas de entradas y retroalimentación al usuario.  

**Resultado:**  
Se obtuvo un sistema inicial funcional que permite a los usuarios registrarse, iniciar sesión y administrar listas de productos de manera unificada.  

---

### 🟢 Sprint 2 (Finalizado)
**Periodo:** 22 septiembre – 5 octubre 2025  

**Alcance logrado:**
- Desarrollo del módulo **comparador de precios**.  
- Integración de datos simulados (*mock data*) para tres proveedores: Amazon, Walmart y Mercado Libre.  
- Presentación de los precios por proveedor, incluyendo costos de envío y disponibilidad.  
- Identificación automática de la **mejor oferta por producto**.  
- Cálculo de **totales de compra** considerando precio unitario, cantidad y envío.  

**Resultado:**  
El sistema ahora permite a los usuarios visualizar y comparar precios entre diferentes proveedores, identificando las opciones más económicas y optimizando la decisión de compra.  

---

### 🟢 Sprint 3 (Finalizado)
**Periodo:** 6–19 octubre 2025  

**Alcance logrado:**
- Finalización del **cálculo de costo total con envíos**, pendiente del Sprint 2.  
- Implementación de **alertas automáticas**:  
  - **PRICE_DROP**: notificación cuando el precio baja ≥5%.  
  - **BACK_IN_STOCK**: notificación cuando un producto vuelve a estar disponible.  
- Creación de la tabla **`price_history`** en Supabase para almacenar registros de precios.  
- Implementación de lógica en backend para guardar históricos al momento de comparar.  
- Desarrollo de la vista **/history** en frontend para consultar registros anteriores.  

**Resultado:**  
El sistema ahora cuenta con un comparador completo, capaz de alertar al usuario sobre cambios relevantes y de mantener un historial de precios consultable en la interfaz.  

---

### 🟢 Sprint 4 (Finalizado)
**Periodo:** 20 octubre – 2 noviembre 2025  

**Alcance logrado:**
- Integración de **enlaces de afiliado por proveedor** con **tracking por usuario**.  
- Botón **“Comprar”** que redirige al proveedor usando el enlace de afiliado.  
- **Exportación a PDF** del comparativo (jsPDF + Autotable) con **título**, **fecha**, **tabla** (producto/proveedor/precio/envío/total (unidad)/cantidad/total (línea)/disponibilidad) y **total del carrito**.  
- Pruebas integrales para validar el funcionamiento conjunto de **alertas**, **historial** y **afiliados**.  

**Resultado:**  
Se habilitó la monetización inicial mediante afiliados y se incorporó evidencia descargable (PDF) del comparativo, manteniendo el flujo principal desde **Subir lista → Unificar → Comparar → Comprar/Descargar**.  

---

## Estructura del repositorio
mi-lista-inteligente/
├─ frontend/ # Aplicación web (Vite + React + Supabase)
├─ docs/
│ ├─ actividad-2.2/ # Entregables Sprint 1 (planeación y actividades)
│ ├─ actividad-2.3/ # Entregables Sprint 2
│ ├─ actividad-3.1/ # Entregables Sprint 3
│ └─ actividad-3.2/ # Entregables Sprint 4
└─ README.md

---

## Próximos pasos
- **Sprint 5:** métricas de afiliados (CTR por proveedor/producto), de-duplicación/rate limiting de clics y ajustes de PDF (branding/paginación).  
- **Sprint 6:** refuerzo de seguridad con **RLS** en Supabase, despliegue final en un entorno de producción y **documentación académica** final.  

---

## Créditos
Proyecto desarrollado en el marco de la materia Proyecto VII (UDGVirtual) por el equipo:  
- **Luis Enrique – Product Owner**  
- **Alicia – Scrum Master / QA**  
- **Luis Yasmani – Backend / DevOps**  
- **Eduardo Alejandro – Frontend**  

