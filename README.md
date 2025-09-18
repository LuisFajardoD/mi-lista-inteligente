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

## Estructura del repositorio
mi-lista-inteligente/
├─ frontend/ # Aplicación web (Vite + React + Supabase)
├─ docs/
│ ├─ actividad-2.2/ # Entregables Sprint 1 (planeación y actividades)
│ └─ actividad-2.3/ # Entregables Sprint 2
└─ README.md

---

## Próximos pasos
- **Sprint 3:** integración de alertas de precio e histórico de productos por proveedor.  
- **Sprint 4:** generación de reportes PDF con detalle de listas, comparaciones y ahorros obtenidos.  
- **Sprint 5:** optimización de rendimiento, validación con usuarios y pruebas de usabilidad.  
- **Sprint 6:** despliegue final del sistema en un entorno de producción y presentación de resultados académicos.  


---

## Créditos

Proyecto desarrollado en el marco de la materia Proyecto VII (UDGVirtual) por el equipo:
- **Luis Enrique – Product Owner**
- **Alicia – Scrum Master / QA**
- **Luis Yasmani Fajardo Durán – Backend / DevOps**
- **Eduardo Alejandro – Frontend**
