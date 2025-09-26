'use client';
import React, { useState, useRef, useEffect } from 'react';

function StatCard({ title, value, delta, color }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-4">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-2 flex items-end gap-2">
        <div className="text-2xl font-semibold text-gray-900">{value}</div>
        {delta && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color || 'bg-green-100 text-green-700'}`}>{delta}</span>
        )}
      </div>
      <div className="mt-3 h-2 w-full bg-gray-100 rounded-full">
        <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-sky-500" style={{ width: '60%' }}></div>
      </div>
    </div>
  );
}

function ServerRunsListInner({ items }) {
  if (!items || items.length === 0) {
    return <div className="text-xs text-gray-500">No server runs yet.</div>;
  }
  return (
    <ul className="grid md:grid-cols-2 gap-4">
      {items.map((run) => (
        <li key={run._id} className="border rounded-lg bg-white overflow-hidden">
          {/* Images row */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 border-b">
            {(run.images || []).slice(0,3).map((img, idx) => (
              <div key={idx} className="aspect-square bg-white rounded border overflow-hidden">
                {img?.preview ? (
                  <img
                    src={`data:${img.mimetype};base64,${img.preview}`}
                    alt={`run-img-${idx}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">no preview</div>
                )}
              </div>
            ))}
          </div>
          <div className="p-4 text-sm">
            <div className="text-gray-500">{new Date(run.createdAt).toLocaleString()}</div>
            <div className="mt-2">
              <div className="font-semibold text-gray-800 mb-1">Prompt</div>
              <div className="line-clamp-5 whitespace-pre-wrap break-words text-gray-800 text-sm">{run.prompt || ''}</div>
            </div>
            <div className="mt-3">
              <div className="font-semibold text-gray-800 mb-1">Output</div>
              <pre className="whitespace-pre-wrap break-words text-gray-800 bg-gray-50 p-3 rounded border max-h-60 overflow-auto text-sm">{run.resultText || ''}</pre>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function AdminPage() {
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [history, setHistory] = useState([]); // [{id, time, prompt, result}]
  const [serverRuns, setServerRuns] = useState([]);

  // Load last prompt and history on mount
  useEffect(() => {
    try {
      const last = localStorage.getItem('admin_last_prompt');
      if (last) setPrompt(last);
      const rawHist = localStorage.getItem('admin_prompt_history');
      if (rawHist) {
        const parsed = JSON.parse(rawHist);
        if (Array.isArray(parsed)) setHistory(parsed);
      }
    } catch (_) {}
  }, []);

  // Persist last prompt
  useEffect(() => {
    try { localStorage.setItem('admin_last_prompt', prompt || ''); } catch (_) {}
  }, [prompt]);

  const handleFiles = (e) => {
    const incoming = Array.from(e.target.files || []);
    const merged = [...files, ...incoming].slice(0, 3);
    setFiles(merged);
    setPreviewUrls(merged.map(f => URL.createObjectURL(f)));
  };

  const removeImage = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviewUrls(newFiles.map(f => URL.createObjectURL(f)));
  };

  const openFileDialog = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    setResult(null);
    try {
      const form = new FormData();
      if (prompt) form.append('prompt', prompt);
      files.forEach(f => form.append('images', f));

      // Determine API base (dev: backend on :4000, prod: same origin)
      const apiBase = typeof window !== 'undefined' && (window.location.port === '3000' || window.location.hostname === 'localhost')
        ? 'http://localhost:4000'
        : '';

      const res = await fetch(`${apiBase}/test-prompt`, { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '요청 실패');
      }
      // Try to pretty-print JSON if the model returned JSON-like text
      const text = data.text || '';
      let pretty = text;
      const s = text.indexOf('{');
      const e = text.lastIndexOf('}');
      if (s !== -1 && e !== -1 && e > s) {
        try {
          const obj = JSON.parse(text.substring(s, e + 1));
          pretty = JSON.stringify(obj, null, 2);
        } catch (_) {}
      }
      setResult(pretty);

      // Save history (limit 20)
      const entry = {
        id: Date.now(),
        time: new Date().toISOString(),
        prompt,
        result: pretty
      };
      const nextHistory = [entry, ...history].slice(0, 20);
      setHistory(nextHistory);
      try { localStorage.setItem('admin_prompt_history', JSON.stringify(nextHistory)); } catch (_) {}
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8 bg-white/80 backdrop-blur rounded-xl border px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-sky-500 shadow"></div>
            <div>
              <div className="text-2xl leading-none font-extrabold tracking-tight text-gray-900">Able Admin</div>
              <div className="text-[11px] text-gray-500 -mt-0.5">Prompt Lab</div>
            </div>
            <span className="ml-1 text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">v0.1</span>
          </div>
          <div className="flex items-center gap-3">
            <input className="hidden md:block w-72 rounded-lg border bg-white/80 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" placeholder="Search (⌘K)" />
            <div className="w-8 h-8 rounded-full bg-white border shadow-sm" />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="hidden md:block col-span-3 xl:col-span-2">
            <div className="bg-white rounded-xl border shadow-sm p-4 sticky top-6">
              {/* Profile */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-blue-100" />
                <div>
                  <div className="text-sm font-semibold text-gray-900">Admin</div>
                  <div className="text-xs text-gray-500">Administrator</div>
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-5">
                <div>
                  <div className="px-3 mb-2 text-[11px] font-semibold tracking-wide uppercase text-gray-500">Navigation</div>
                  <nav className="space-y-1 text-sm">
                    <a className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 font-medium border border-blue-100">
                      <span>🏠</span>
                      <span>Dashboard</span>
                    </a>
                    <a className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
                      <span>📈</span>
                      <span>Analytics</span>
                    </a>
                    <a className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
                      <span>🧪</span>
                      <span>Prompts</span>
                    </a>
                  </nav>
                </div>

                <div>
                  <div className="px-3 mb-2 text-[11px] font-semibold tracking-wide uppercase text-gray-500">Admin Panel</div>
                  <nav className="space-y-1 text-sm">
                    <a className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
                      <span>⚙️</span>
                      <span>Settings</span>
                    </a>
                    <a className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
                      <span>👤</span>
                      <span>Members</span>
                    </a>
                  </nav>
                </div>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="col-span-12 md:col-span-9 xl:col-span-10 space-y-6">
            {/* Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 text-white p-6 shadow">
              <div className="text-xl md:text-2xl font-semibold">Explore Redesigned Admin</div>
              <div className="mt-2 text-sm text-white/90 max-w-lg">Test prompts with images, preview results and iterate faster.</div>
              <button className="mt-4 inline-flex items-center gap-2 bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-medium shadow hover:shadow-md">Get Started</button>
              <div className="absolute -right-6 -bottom-6 w-40 h-40 rounded-full bg-white/20" />
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-2">
              <StatCard title="All Earnings" value="$3,020" delta="+30.6%" />
              <StatCard title="Page Views" value="290K+" delta="+20.1%" color="bg-blue-100 text-blue-700" />
              <StatCard title="Total Tasks" value="839" delta="New" color="bg-emerald-100 text-emerald-700" />
              <StatCard title="Runs" value="2,067" delta="-3.2%" color="bg-red-100 text-red-700" />
            </div>

            {/* Prompt tester panel */}
            <div className="bg-white rounded-2xl border shadow-sm p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Prompt Tester</h2>
                <div className="text-xs text-gray-600">Upload up to 3 images</div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
                {/* Left: inputs */}
                <div className="xl:col-span-3 space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">Images</label>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />

                    {/* Dropzone / selector */}
                    <div
                      className={`w-full border-2 border-dashed rounded-xl transition-colors cursor-pointer p-4 ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
                      onClick={openFileDialog}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const dtFiles = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith('image/'));
                        if (dtFiles.length) {
                          const merged = [...files, ...dtFiles].slice(0, 3);
                          setFiles(merged);
                          setPreviewUrls(merged.map(f => URL.createObjectURL(f)));
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">Click to select images or drag and drop (max 3)</div>
                        <button type="button" className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg">Add images</button>
                      </div>
                    </div>

                    {/* Previews with delete and add tile */}
                    <div className="grid grid-cols-3 gap-5 mt-4">
                      {previewUrls.map((url, i) => (
                        <div key={i} className="relative group">
                          <img src={url} alt={`preview-${i}`} className="w-full h-60 object-cover rounded-lg border" />
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white text-xs leading-6 text-center shadow opacity-90 group-hover:opacity-100"
                            aria-label="Remove image"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {previewUrls.length < 3 && (
                        <button
                          type="button"
                          onClick={openFileDialog}
                          className="h-60 w-full border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-base text-gray-600 bg-white hover:bg-gray-50"
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">Prompt</label>
                    <textarea
                      className="w-full border rounded-lg p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      rows={10}
                      placeholder="Enter your prompt here..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {isLoading ? 'Running…' : 'Run Prompt'}
                    </button>
                    <button
                      onClick={() => { setFiles([]); setPreviewUrls([]); setPrompt(''); setResult(null); setError(''); }}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Right: output */}
                <div className="xl:col-span-2">
                  <div className="h-full bg-gray-50 rounded-xl border p-0 overflow-hidden">
                    <div className="px-6 py-5 border-b bg-white">
                    <div className="text-sm font-semibold text-gray-800 mb-1">Output</div>
                    {error && (
                      <div className="text-red-600 text-xs">{error}</div>
                    )}
                    </div>
                    <pre className="whitespace-pre-wrap text-xs text-gray-800 p-6 min-h-[400px]">
                      {result !== null ? result : 'Run the prompt to see results here.'}
                    </pre>
                  </div>
                </div>
              </div>

              {/* History (local) */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900">Run History</h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setHistory([]);
                        try { localStorage.removeItem('admin_prompt_history'); } catch (_) {}
                      }}
                      className="text-xs px-2 py-1 rounded border bg-white hover:bg-gray-50 text-gray-700"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {history.length === 0 ? (
                  <div className="text-xs text-gray-500">No runs yet. Your runs will appear here.</div>
                ) : (
                  <ul className="divide-y border rounded-lg bg-white">
                    {history.map(item => (
                      <li key={item.id} className="p-3 text-xs flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-gray-500">{new Date(item.time).toLocaleString()}</div>
                          <div className="text-gray-900 mt-1 line-clamp-2 break-words">{item.prompt}</div>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPrompt(item.prompt)}
                            className="px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100"
                          >
                            Use
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(item.result || '');
                            }}
                            className="px-2 py-1 rounded bg-gray-100 text-gray-800 hover:bg-gray-200"
                          >
                            Copy
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Server history (Mongo) */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900">Server History</h3>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const apiBase = typeof window !== 'undefined' && (window.location.port === '3000' || window.location.port === '3001' || window.location.hostname === 'localhost')
                          ? 'http://localhost:4000'
                          : '';
                        const res = await fetch(`${apiBase}/admin/runs?limit=20`);
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || '불러오기 실패');
                        setServerRuns(data.items || []);
                      } catch (e) {
                        alert(e.message);
                      }
                    }}
                    className="text-xs px-2 py-1 rounded border bg-white hover:bg-gray-50 text-gray-700"
                  >
                    Refresh
                  </button>
                </div>
                <div className="text-xs text-gray-500 mb-2">Server persistence is enabled when the backend has MONGODB_URI set.</div>

                {/* Server run items */}
                <ServerRunsListInner items={serverRuns} />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;


