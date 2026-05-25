import { useState, useEffect } from "react";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import jsPDF from 'jspdf';

function App() {
  const [tasks, setTasks] = useState([
    { id: 1, text: "Tomar medicación", done: false, date: null },
    { id: 2, text: "Revisión médica semanal", done: false, date: null }
  ]);
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [newDate, setNewDate] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [queryResponse, setQueryResponse] = useState("");
  const [auditText, setAuditText] = useState("");
  const [auditResult, setAuditResult] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientAddress, setPatientAddress] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientCity, setPatientCity] = useState("");
  const [patientPostalCode, setPatientPostalCode] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [editingPatient, setEditingPatient] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("app-clinica-tasks");
      if (stored) {
        setTasks(JSON.parse(stored));
      }
      const patientData = localStorage.getItem("app-clinica-patient");
      if (patientData) {
        const data = JSON.parse(patientData);
        setPatientName(data.name || "");
        setPatientAddress(data.address || "");
        setPatientPhone(data.phone || "");
        setPatientCity(data.city || "");
        setPatientPostalCode(data.postalCode || "");
        setPatientEmail(data.email || "");
      }
    } catch (e) {
      console.error("No se pudo cargar datos desde localStorage", e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("app-clinica-tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("app-clinica-patient", JSON.stringify({
      name: patientName,
      address: patientAddress,
      phone: patientPhone,
      city: patientCity,
      postalCode: patientPostalCode,
      email: patientEmail,
    }));
  }, [patientName, patientAddress, patientPhone, patientCity, patientPostalCode, patientEmail]);

  const toggleTask = (id) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, done: !task.done } : task
    ));
  };

  const addTask = () => {
    if (newTask.trim()) {
      const task = {
        id: tasks.length + 1,
        text: newTask.trim(),
        done: false,
        date: newDate || null,
      };
      setTasks([...tasks, task]);
      setNewTask("");
      setNewDate("");
    }
  };

  const startEdit = (id, text) => {
    setEditingId(id);
    setEditText(text);
  };

  const saveEdit = () => {
    setTasks(tasks.map(task =>
      task.id === editingId ? { ...task, text: editText } : task
    ));
    setEditingId(null);
    setEditText("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const getSuggestion = async () => {
    setLoading(true);
    const taskTexts = tasks.map(task => task.text).join(", ");
    const prompt = `Basado en estas tareas de seguimiento de tratamiento: ${taskTexts}.

Sugiere una nueva tarea relevante para el paciente. La sugerencia debe ser detallada y estructurada, incluyendo:
- Una descripción clara de la tarea
- Beneficios para el paciente y proveedores médicos
- Información adicional que podría incluirse
- Cómo esta tarea mejora el seguimiento del tratamiento

Proporciona la sugerencia en formato estructurado con viñetas y explicaciones.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout

    try {
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3.2:1b",
          prompt: prompt,
          stream: false,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      console.log("Respuesta de Ollama:", data);
      setSuggestion(data.response || "No se pudo generar una sugerencia.");
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("Error al obtener sugerencia:", error);
      if (error.name === 'AbortError') {
        setSuggestion("Tiempo de espera agotado. Verifica que Ollama esté ejecutándose.");
      } else {
        setSuggestion("Error al conectar con Ollama. Asegúrate de que esté ejecutándose.");
      }
    }
    setLoading(false);
  };

  const addSuggestion = () => {
    if (suggestion) {
      const newTask = {
        id: tasks.length + 1,
        text: suggestion,
        done: false,
        date: null,
      };
      setTasks([...tasks, newTask]);
      setSuggestion("");
    }
  };

  const askQuestion = async () => {
    if (!userQuery.trim()) {
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout

    const prompt = `Eres un asistente de salud. Responde solo con información relacionada con salud, tratamiento médico, seguimiento de pacientes o bienestar. Si la pregunta no trata de temas médicos o de salud, responde: "Solo puedo responder preguntas relacionadas con la salud y el tratamiento médico." Pregunta del usuario: ${userQuery}`;

    try {
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3.2:1b",
          prompt,
          stream: false,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      console.log("Respuesta de Ollama a consulta:", data);
      setQueryResponse(data.response || "No se pudo generar una respuesta.");
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("Error al procesar consulta:", error);
      if (error.name === 'AbortError') {
        setQueryResponse("Tiempo de espera agotado. Verifica que Ollama esté ejecutándose.");
      } else {
        setQueryResponse("Error al conectar con Ollama. Asegúrate de que esté ejecutándose.");
      }
    }
    setLoading(false);
  };

  const runAudit = async () => {
    if (!auditText.trim()) {
      setAuditResult("Ingrese texto de auditoría para evaluar.");
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const prompt = `Revisa el siguiente texto clínico para privacidad de datos, pero sin exponer datos sensibles fuera del ordenador. Indica riesgos y recomendaciones:

${auditText}`;

    try {
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3.2:1b",
          prompt,
          stream: false,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      setAuditResult(data.response || "No se obtuvo resultado de auditoría.");
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("Error en auditoría de texto:", error);
      if (error.name === 'AbortError') {
        setAuditResult("Tiempo de espera agotado. Verifica que Ollama esté ejecutándose.");
      } else {
        setAuditResult("Error al conectar con Ollama. Asegura que el servicio esté disponible localmente.");
      }
    }
    setLoading(false);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Reporte de Seguimiento Médico', 20, 20);

    doc.setFontSize(12);
    doc.text('Datos del Paciente:', 20, 40);
    doc.text(`Nombre: ${patientName || 'No especificado'}`, 20, 50);
    doc.text(`Dirección: ${patientAddress || 'No especificada'}`, 20, 60);
    doc.text(`Localidad: ${patientCity || 'No especificada'}`, 20, 70);
    doc.text(`Código Postal: ${patientPostalCode || 'No especificado'}`, 20, 80);
    doc.text(`Teléfono: ${patientPhone || 'No especificado'}`, 20, 90);
    doc.text(`Email: ${patientEmail || 'No especificado'}`, 20, 100);

    doc.text('Tareas de Tratamiento:', 20, 120);
    let y = 130;
    tasks.forEach((task, index) => {
      const status = task.done ? 'Completada' : 'Pendiente';
      const date = task.date ? ` (${new Date(task.date).toLocaleDateString()})` : '';
      doc.text(`${index + 1}. ${task.text} - ${status}${date}`, 20, y);
      y += 10;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save('reporte-tratamiento.pdf');
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dayTasks = tasks.filter(task => task.date && new Date(task.date).toDateString() === date.toDateString());
      if (dayTasks.length > 0) {
        return (
          <div className="text-xs text-blue-600">
            {dayTasks.length} tarea{dayTasks.length > 1 ? 's' : ''}
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="p-5 max-w-4xl mx-auto bg-white text-black">
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-4 text-center">Seguimiento de Tratamiento Médico</h1>
        <p className="text-sm text-gray-600 mb-4 text-center" role="note">
          Esta aplicación es para seguimiento personal. Las sugerencias de IA no reemplazan el consejo médico profesional.
        </p>
      </header>

      <section aria-labelledby="patient-section" className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h2 id="patient-section" className="text-lg font-semibold mb-3">Datos del Paciente</h2>
        {!editingPatient ? (
          <div className="space-y-2">
            <p><strong>Nombre:</strong> {patientName || "No especificado"}</p>
            <p><strong>Dirección:</strong> {patientAddress || "No especificada"}</p>
            <p><strong>Localidad:</strong> {patientCity || "No especificada"}</p>
            <p><strong>Código Postal:</strong> {patientPostalCode || "No especificado"}</p>
            <p><strong>Teléfono:</strong> {patientPhone || "No especificado"}</p>
            <p><strong>Email:</strong> {patientEmail || "No especificado"}</p>
            <button
              onClick={() => setEditingPatient(true)}
              className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Editar datos del paciente"
            >
              Editar Datos
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label htmlFor="patient-name" className="block text-sm font-medium mb-1">Nombre</label>
              <input
                id="patient-name"
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Nombre completo"
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="patient-address" className="block text-sm font-medium mb-1">Dirección</label>
              <input
                id="patient-address"
                type="text"
                value={patientAddress}
                onChange={(e) => setPatientAddress(e.target.value)}
                placeholder="Calle, número, ciudad"
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="patient-phone" className="block text-sm font-medium mb-1">Teléfono</label>
              <input
                id="patient-phone"
                type="tel"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="Número de teléfono"
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="patient-city" className="block text-sm font-medium mb-1">Localidad</label>
              <input
                id="patient-city"
                type="text"
                value={patientCity}
                onChange={(e) => setPatientCity(e.target.value)}
                placeholder="Ciudad o localidad"
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="patient-postal-code" className="block text-sm font-medium mb-1">Código Postal</label>
              <input
                id="patient-postal-code"
                type="text"
                value={patientPostalCode}
                onChange={(e) => setPatientPostalCode(e.target.value)}
                placeholder="Código postal"
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="patient-email" className="block text-sm font-medium mb-1">Email</label>
              <input
                id="patient-email"
                type="email"
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingPatient(false)}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                aria-label="Guardar datos"
              >
                Guardar
              </button>
              <button
                onClick={() => setEditingPatient(false)}
                className="flex-1 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400"
                aria-label="Cancelar edición"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section aria-labelledby="add-task-section">
          <h2 id="add-task-section" className="sr-only">Agregar Nueva Tarea</h2>
          <div className="mb-4">
            <label htmlFor="new-task-input" className="sr-only">Nueva tarea</label>
            <input
              id="new-task-input"
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Nueva tarea..."
              className="w-full p-2 border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-describedby="new-task-help"
            />
            <span id="new-task-help" className="sr-only">Ingresa el texto de la nueva tarea a agregar</span>
            <label htmlFor="new-date-input" className="block text-sm font-medium mb-1">Fecha (opcional)</label>
            <input
              id="new-date-input"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addTask}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Agregar nueva tarea"
            >
              Agregar Tarea
            </button>
          </div>
        </section>

        <section aria-labelledby="calendar-section">
          <h2 id="calendar-section" className="text-lg font-semibold mb-2">Calendario</h2>
          <Calendar
            tileContent={tileContent}
            className="w-full"
          />
        </section>
      </div>

      <section aria-labelledby="tasks-section">
        <h2 id="tasks-section" className="sr-only">Lista de Tareas</h2>
        <ul className="space-y-2 mb-4" role="list">
          {tasks.map(task => (
            <li key={task.id} className="flex items-center justify-between p-3 bg-gray-100 rounded" role="listitem">
              {editingId === task.id ? (
                <>
                  <label htmlFor={`edit-input-${task.id}`} className="sr-only">Editar tarea {task.id}</label>
                  <input
                    id={`edit-input-${task.id}`}
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="flex-1 p-1 border border-gray-300 rounded mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-describedby={`edit-help-${task.id}`}
                  />
                  <span id={`edit-help-${task.id}`} className="sr-only">Edita el texto de la tarea</span>
                </>
              ) : (
                <span className={`flex-1 ${task.done ? "line-through text-gray-500" : ""}`} aria-label={`Tarea: ${task.text}, ${task.done ? "completada" : "pendiente"} ${task.date ? `, fecha: ${task.date}` : ""}`}>
                  {task.text} {task.date && <span className="text-sm text-gray-500">({new Date(task.date).toLocaleDateString()})</span>}
                </span>
              )}
              <div className="flex space-x-1">
                {editingId === task.id ? (
                  <>
                    <button
                      onClick={saveEdit}
                      className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      aria-label="Guardar cambios en la tarea"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                      aria-label="Cancelar edición de la tarea"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEdit(task.id, task.text)}
                      className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                      aria-label={`Editar tarea: ${task.text}`}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      aria-label={task.done ? `Marcar como pendiente: ${task.text}` : `Marcar como completada: ${task.text}`}
                    >
                      {task.done ? "Deshacer" : "Completar"}
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                      aria-label={`Eliminar tarea: ${task.text}`}
                    >
                      Eliminar
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="ai-section">
        <h2 id="ai-section" className="sr-only">Sugerencias de IA</h2>
        <div className="mb-4">
          <button
            onClick={getSuggestion}
            disabled={loading}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            aria-label="Obtener sugerencia de IA basada en las tareas actuales"
          >
            {loading ? "Generando..." : "Obtener Sugerencia de IA"}
          </button>
          <p className="text-xs text-gray-500 mt-1" role="note">
            Las sugerencias se generan localmente con IA. No se envían datos externos.
          </p>
        </div>

        {suggestion && (
          <div className="p-3 bg-yellow-100 rounded mb-4" role="alert">
            <p className="mb-2"><strong>Sugerencia de IA:</strong></p>
            <div className="whitespace-pre-wrap text-sm mb-3">{suggestion}</div>
          </div>
        )}
      </section>

      <section aria-labelledby="query-section">
        <h2 id="query-section" className="text-lg font-semibold mb-3">Consultar a la IA</h2>
        <p className="text-sm text-gray-600 mb-2">Haz cualquier pregunta relacionada con tu salud o tratamiento. Las respuestas son informativas, no reemplazan el consejo médico profesional.</p>
        <div className="mb-4">
          <label htmlFor="user-query-input" className="sr-only">Tu pregunta para la IA</label>
          <textarea
            id="user-query-input"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="Escribe tu pregunta aquí... (Ejemplo: ¿Cuáles son los efectos secundarios comunes del paracetamol?)"
            className="w-full p-2 border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
            aria-describedby="query-help"
          />
          <span id="query-help" className="sr-only">Ingresa tu pregunta sobre salud o tratamiento</span>
          <button
            onClick={askQuestion}
            disabled={loading || !userQuery.trim()}
            className="w-full px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Enviar pregunta a la IA"
          >
            {loading ? "Procesando..." : "Enviar Pregunta"}
          </button>
          <p className="text-xs text-gray-500 mt-1" role="note">
            Tu pregunta se procesa localmente. Tu privacidad está protegida.
          </p>
        </div>

        {queryResponse && (
          <div className="p-3 bg-blue-100 rounded mb-4" role="status">
            <p className="mb-2"><strong>Respuesta de IA:</strong></p>
            <p className="whitespace-pre-wrap text-sm">{queryResponse}</p>
            <button
              onClick={() => setQueryResponse("")}
              className="mt-2 px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
              aria-label="Limpiar respuesta"
            >
              Limpiar
            </button>
            <p className="text-xs text-gray-600 mt-2">
              ⚠️ <strong>Descargo de responsabilidad:</strong> Esta información es generada por IA y es solo informativa. Siempre consulta con un profesional médico para diagnóstico y tratamiento.
            </p>
          </div>
        )}
      </section>

      <section aria-labelledby="audit-section">
        <h2 id="audit-section" className="text-lg font-semibold mb-3">Auditoría de Texto (Ollama Local)</h2>
        <p className="text-sm text-gray-600 mb-2">
          Copia y pega allí un texto del protocolo o comunicación clínica. El modelo auditará riesgos de privacidad y estilo. Todo se procesa localmente.
        </p>
        <div className="mb-4">
          <label htmlFor="audit-text" className="sr-only">Texto para auditoría</label>
          <textarea
            id="audit-text"
            value={auditText}
            onChange={(e) => setAuditText(e.target.value)}
            placeholder="Texto clínico a auditar..."
            className="w-full p-2 border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 h-28"
          />
          <button
            onClick={runAudit}
            disabled={loading}
            className="w-full px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Ejecutar auditoría de texto"
          >
            {loading ? "Auditoría en curso..." : "Ejecutar Auditoría"}
          </button>
        </div>

        {auditResult && (
          <div className="p-3 bg-emerald-100 rounded mb-4" role="status">
            <p className="mb-2"><strong>Resultado de Auditoría:</strong></p>
            <p className="whitespace-pre-wrap text-sm">{auditResult}</p>
            <button
              onClick={() => setAuditResult("")}
              className="mt-2 px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
              aria-label="Limpiar resultado de auditoría"
            >
              Limpiar
            </button>
          </div>
        )}
      </section>

      <div className="mt-6 text-center">
        <button
          onClick={generatePDF}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Generar reporte en PDF"
        >
          Generar Reporte PDF
        </button>
        <p className="text-xs text-gray-500 mt-2">El PDF se genera localmente y se descarga automáticamente.</p>
      </div>
    </div>
  );
}

export default App;