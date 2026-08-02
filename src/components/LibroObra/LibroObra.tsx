import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../Login/ProtectedRoute";
import { apiClient } from "../../api";
import { Project, ConstructionBookDocument, ConstructionBookFolder } from "../../backend/types";
import { BookOpen, Folder, Upload, FileText, Plus, X, Loader2, BrainCircuit, Wand2, AlertCircle, CheckSquare, Square, FileDown } from "lucide-react";
import Modal from "../Styles/Modal";

const FOLDERS: { id: ConstructionBookFolder; name: string; description: string }[] = [
  { id: "ley", name: "Ley de Obras Públicas", description: "Normativa aplicable a la obra y a los contratos públicos." },
  { id: "pliegos", name: "Pliegos de la Obra", description: "Especificaciones técnicas, condiciones generales y particulares." },
  { id: "orden", name: "Orden de Servicio", description: "Órdenes de servicio emitidas para la obra." },
  { id: "nota", name: "Nota de Pedido", description: "Notas de pedido generadas a partir de una orden de servicio." },
];

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ACCEPT_ORDER = ".pdf,.doc,.docx,.txt";
const ACCEPT_ANY = ".pdf,.doc,.docx,.txt,.xls,.xlsx,.jpg,.jpeg,.png";

export default function LibroObraComponent() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [documents, setDocuments] = useState<ConstructionBookDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFolder, setActiveFolder] = useState<ConstructionBookFolder>("orden");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [wantGenerate, setWantGenerate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [generateOpen, setGenerateOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);
  const [userPrompt, setUserPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiClient.projects.list();
        setProjects(data.filter((p) => p.isEnable !== false));
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      setDocuments([]);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiClient.constructionBook.list(Number(selectedProjectId));
        setDocuments(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedProjectId]);

  const activeDocuments = useMemo(
    () => documents.filter((d) => d.folder === activeFolder),
    [documents, activeFolder]
  );

  const orders = useMemo(() => documents.filter((d) => d.folder === "orden"), [documents]);
  const referenceDocs = useMemo(
    () => documents.filter((d) => d.folder === "ley" || d.folder === "pliegos"),
    [documents]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size > MAX_FILE_SIZE) {
      setFileError("El documento supera el límite de 100 MB.");
      setUploadFile(null);
      e.target.value = "";
    } else {
      setFileError(null);
      setUploadFile(file || null);
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!uploadFile || !selectedProjectId) return;
    setUploadLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      const created = await apiClient.constructionBook.create(fd);
      setDocuments((prev) => [created, ...prev]);
      setUploadOpen(false);
      setUploadFile(null);
      setFileError(null);
      setWantGenerate(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (created.folder === "orden" && wantGenerate) {
        openGenerate(created.id);
      }
    } catch (err: any) {
      alert(err.message || "Error al subir el documento");
    } finally {
      setUploadLoading(false);
    }
  };

  const openUpload = (folder: ConstructionBookFolder) => {
    setActiveFolder(folder);
    setUploadOpen(true);
    setUploadFile(null);
    setFileError(null);
    setWantGenerate(false);
  };

  const openGenerate = (orderId: number) => {
    setSelectedOrderId(String(orderId));
    setSelectedDocIds([]);
    setUserPrompt("");
    setGeneratedText("");
    setGenerateOpen(true);
  };

  const toggleDoc = (id: number) => {
    setSelectedDocIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleGenerate = async () => {
    if (!selectedOrderId) return alert("Seleccione una Orden de Servicio.");
    setGenerating(true);
    setGeneratedText("");
    try {
      const res = await apiClient.constructionBook.generateNote({
        orderId: Number(selectedOrderId),
        documentIds: selectedDocIds,
        prompt: userPrompt.trim(),
      });
      setGeneratedText(res.text || "");
    } catch (err: any) {
      alert(err.message || "Error al generar la nota de pedido");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-blue-600" /> Libro de Obra
        </h2>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="p-2 border rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 md:w-72"
        >
          <option value="">Seleccionar obra</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-sm text-slate-700">
        <p className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> ¿Cómo generar una Nota de Pedido?
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Seleccione una obra en el desplegable superior.</li>
          <li>En <strong>Orden de Servicio</strong> cargue la orden desde la que desea partir. Al subirla puede optar por generar la nota de pedido automáticamente.</li>
          <li>Para enriquecer el resultado, seleccione los documentos relevantes de <strong>Ley de Obras Públicas</strong> y <strong>Pliegos de la Obra</strong>.</li>
          <li>Escriba una descripción o instrucciones adicionales en el prompt para personalizar la respuesta.</li>
          <li>El resultado será solo texto. Copie y péguelo en un documento, edítelo si es necesario y guárdelo manualmente en <strong>Nota de Pedido</strong>.</li>
        </ul>
      </div>

      {!selectedProjectId && (
        <div className="text-center py-16 text-slate-400 text-sm">
          Seleccione una obra para ver su Libro de Obra.
        </div>
      )}

      {selectedProjectId && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {FOLDERS.map((f) => (
              <div
                key={f.id}
                onClick={() => setActiveFolder(f.id)}
                className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                  activeFolder === f.id ? "bg-blue-50 border-blue-300 ring-1 ring-blue-300" : "bg-white border-slate-100 hover:border-blue-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Folder className={`h-5 w-5 ${activeFolder === f.id ? "text-blue-600" : "text-slate-500"}`} />
                    <h3 className="font-semibold text-slate-800 text-sm">{f.name}</h3>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">
                    {documents.filter((d) => d.folder === f.id).length}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{f.description}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800">
                  {FOLDERS.find((f) => f.id === activeFolder)?.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {FOLDERS.find((f) => f.id === activeFolder)?.description}
                </p>
              </div>
              <button
                onClick={() => openUpload(activeFolder)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl flex items-center gap-2 text-sm shadow-lg shadow-blue-200 transition-all"
              >
                <Plus className="h-4 w-4" /> Subir documento
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cargado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Por</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activeDocuments.map((d) => (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-400" />
                            <span className="truncate max-w-[200px]" title={d.originalName}>{d.originalName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{d.createdByName ?? "—"}</td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <a
                              href={`/api/construction-book/documents/${d.fileName}`}
                              download={d.originalName}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                              title="Descargar"
                            >
                              <FileDown className="h-4 w-4" />
                            </a>
                            {activeFolder === "orden" && (
                              <button
                                onClick={() => openGenerate(d.id)}
                                className="text-emerald-600 hover:text-emerald-800"
                                title="Generar nota de pedido"
                              >
                                <Wand2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {activeDocuments.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-gray-400 text-sm">
                          No hay documentos en esta carpeta.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <Modal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} title="Subir documento" zIndex={50}>
        <form className="space-y-4" onSubmit={handleUpload}>
          <input type="hidden" name="projectId" value={selectedProjectId} />
          <input type="hidden" name="folder" value={activeFolder} />

          <div className="p-3 bg-slate-50 rounded-xl text-sm text-slate-700">
            Carpeta: <span className="font-semibold">{FOLDERS.find((f) => f.id === activeFolder)?.name}</span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Archivo</label>
            <input
              ref={fileInputRef}
              name="document"
              type="file"
              required
              accept={activeFolder === "orden" ? ACCEPT_ORDER : ACCEPT_ANY}
              onChange={handleFileChange}
              className="w-full p-2 border rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
            />
            {fileError && <p className="text-xs text-red-600">{fileError}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Detalle (opcional)</label>
            <input
              name="detail"
              type="text"
              className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej. Orden de servicio N° 1234"
            />
          </div>

          {activeFolder === "orden" && (
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={wantGenerate}
                onChange={(e) => setWantGenerate(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Quiero generar una Nota de Pedido después de subir este archivo.
            </label>
          )}

          <button
            type="submit"
            disabled={uploadLoading || !uploadFile}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-2 rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            {uploadLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Subir documento
          </button>
        </form>
      </Modal>

      <Modal isOpen={generateOpen} onClose={() => setGenerateOpen(false)} title="Generar Nota de Pedido" zIndex={60}>
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-slate-700">
            El resultado será solo texto. Podrá copiarlo y pegarlo en un documento para guardarlo manualmente en la carpeta <strong>Nota de Pedido</strong>.
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Orden de Servicio</label>
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="w-full p-2 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Seleccionar orden de servicio</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>{o.originalName}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase">Documentos de referencia (opcional)</p>
            <p className="text-xs text-slate-500">Seleccione Leyes y/o Pliegos que quiera incluir en el prompt.</p>
            <div className="max-h-40 overflow-y-auto border rounded-xl divide-y divide-slate-100">
              {referenceDocs.length === 0 && (
                <p className="p-3 text-sm text-slate-400">No hay documentos en Leyes ni Pliegos para esta obra.</p>
              )}
              {referenceDocs.map((d) => (
                <button
                  key={d.id}
                  onClick={() => toggleDoc(d.id)}
                  className="w-full flex items-center gap-2 p-2 text-left text-sm hover:bg-slate-50"
                >
                  {selectedDocIds.includes(d.id) ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Square className="h-4 w-4 text-slate-400" />}
                  <span className="flex-1 truncate">{d.originalName}</span>
                  <span className="text-xs text-slate-400">{d.folder === "ley" ? "Ley" : "Pliego"}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Descripción / instrucciones adicionales</label>
            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              rows={4}
              className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Ej. Redactar una nota de pedido formal dirigida al proveedor, incluyendo condiciones de entrega y forma de pago."
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || !selectedOrderId}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white py-2 rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
            Generar Nota de Pedido
          </button>

          {generatedText && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Resultado</label>
              <textarea
                readOnly
                value={generatedText}
                rows={10}
                className="w-full p-3 border rounded-xl bg-slate-50 text-sm text-slate-800 font-mono leading-relaxed"
              />
              <p className="text-xs text-slate-500">Copie el texto, péguelo en su documento y luego guárdelo en la carpeta Nota de Pedido.</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
