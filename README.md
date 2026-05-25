# App Clínica - Seguimiento de Tratamiento Médico

Aplicación web para gestionar tratamientos médicos personales con enfoque en accesibilidad, privacidad y procesamiento local.

## 🚀 Qué hace

- Gestión de tareas médicas: crear, editar, completar y eliminar acciones de seguimiento.
- Calendario de tratamiento: visualizar tareas por fecha y planificar el cuidado diario.
- Consultas de IA local: preguntas de salud procesadas en el equipo sin transferir datos externos.
- Auditoría de texto clínico: revisión local de mensajes o protocolos para riesgos de privacidad.
- Generación de PDF: reporte descargable con datos del paciente y tareas pendientes.

## ⭐ Por qué es útil

- Privacidad total: la IA local se ejecuta con Ollama en el equipo del usuario.
- Accesibilidad: diseñada para ser usable por personas con diversas necesidades.
- Aplicación ligera: construida con React + Vite para un desarrollo rápido y una buena experiencia.

## 📁 Archivos clave para GitHub

Incluye estos archivos y carpetas en el repositorio:

- `README.md`
- `package.json`
- `vite.config.js`
- `.gitignore`
- `src/`
- `public/`
- `index.html`

> En GitHub, el `README.md` será la presentación principal del proyecto.

## 🧪 Cómo ejecutar la app

### Requisitos

- Node.js 14+ instalado
- Ollama instalado para la IA local

### Pasos

1. Instala dependencias:

```bash
cd /ruta/a/tu/proyecto/app-clinica
npm install
```

2. Inicia Ollama en otra terminal:

```bash
ollama serve
```

Si todavía no tienes el modelo:

```bash
ollama pull llama3.2:1b
```

3. Inicia la aplicación:

```bash
cd /ruta/a/tu/proyecto/app-clinica
npm run dev -- --host
```

4. Abre la app:

- Local: `http://localhost:5173/`
- Red: la URL que muestra Vite, por ejemplo `http://192.168.1.35:5173/`

## 🧩 Estructura del proyecto

```
app-clinica/
├── src/
│   ├── App.jsx
│   ├── index.css
│   ├── main.jsx
│   └── assets/
├── public/
├── package.json
├── vite.config.js
├── .gitignore
└── README.md
```

## 🛠️ Tecnologías usadas

- React
- Vite
- Tailwind CSS
- jsPDF
- html2canvas
- react-calendar
- Ollama

## 📌 Recomendación para LinkedIn

### Título
App Clínica - Seguimiento de Tratamiento Médico

### Descripción breve
Aplicación web para gestionar tratamientos médicos personales con calendario, tareas, PDF descargable y consultas de IA local.

### Tecnologías
React · Vite · Tailwind CSS · jsPDF · html2canvas · Ollama

### Valor agregado
Privacidad local, accesibilidad y soporte de IA sin depender de servicios externos.

## ⚠️ Avisos importantes

- No es un consejo médico. Las respuestas son informativas.
- La IA se ejecuta localmente con Ollama.
- Para funcionar correctamente, Ollama debe estar activo.

## 🐞 Solución de problemas

- Si la IA no responde: verifica que `ollama serve` esté corriendo.
- Si no puedes abrir desde otro dispositivo: usa la URL de red que muestra Vite.
- Si hay errores en el navegador: abre la consola (`F12`) para revisar logs.

## 📄 Licencia

Proyecto personal para uso de seguimiento médico y demostración técnica.

---

**Última actualización**: 25 de mayo de 2026

