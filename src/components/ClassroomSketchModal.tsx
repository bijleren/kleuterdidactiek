import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Pen, Square, Minus, RotateCcw, Trash2, Download, Save, Circle, Type, Eraser, Minus as LineIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type Tool = 'pen' | 'rect' | 'circle' | 'line' | 'eraser' | 'text';

interface ClassroomSketchModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolId: string;
  groupId: string | null;
  onMapSaved: () => void;
}

const COLORS = [
  '#1a1a2e', '#4A4A6A', '#FF6B6B', '#45B7D1', '#4ECDC4',
  '#96CEB4', '#FFEAA7', '#DDA0DD', '#F7DC6F', '#6B8CFF',
  '#FF8E8E', '#888', '#fff',
];

const STROKE_WIDTHS = [2, 4, 8, 14];

const ROOM_TEMPLATES = [
  { label: 'Leeg', draw: null },
  { label: 'Rechthoek', draw: 'rect' },
];

export default function ClassroomSketchModal({
  isOpen,
  onClose,
  schoolId,
  groupId,
  onMapSaved,
}: ClassroomSketchModalProps) {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#1a1a2e');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [mapName, setMapName] = useState('Mijn Klaslokaal Schets');
  const [notification, setNotification] = useState<string | null>(null);

  const startPoint = useRef<{ x: number; y: number } | null>(null);
  const snapshotRef = useRef<ImageData | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null);
  const [textValue, setTextValue] = useState('');

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const getCtx = () => canvasRef.current?.getContext('2d', { willReadFrequently: true }) ?? null;

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const snap = canvas.toDataURL();
    setHistory(prev => [...prev.slice(-19), snap]);
  }, []);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw subtle grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
    setHistory([]);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(initCanvas, 50);
    }
  }, [isOpen, initCanvas]);

  const getPos = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const onPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (tool === 'text') {
      const pos = getPos(e);
      setTextPos(pos);
      setTextValue('');
      setTimeout(() => textInputRef.current?.focus(), 50);
      return;
    }
    const ctx = getCtx();
    if (!ctx) return;
    saveHistory();
    const pos = getPos(e);
    startPoint.current = pos;
    snapshotRef.current = ctx.getImageData(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    setIsDrawing(true);

    ctx.strokeStyle = tool === 'eraser' ? '#f8f9fa' : color;
    ctx.lineWidth = tool === 'eraser' ? strokeWidth * 3 : strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'pen' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const onPointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !startPoint.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);

    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else {
      // Restore snapshot and redraw shape preview
      if (snapshotRef.current) ctx.putImageData(snapshotRef.current, 0, 0);
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.fillStyle = color + '22';

      const { x: sx, y: sy } = startPoint.current;
      const w = pos.x - sx;
      const h = pos.y - sy;

      if (tool === 'rect') {
        ctx.beginPath();
        ctx.rect(sx, sy, w, h);
        ctx.fill();
        ctx.stroke();
      } else if (tool === 'circle') {
        const rx = Math.abs(w) / 2;
        const ry = Math.abs(h) / 2;
        ctx.beginPath();
        ctx.ellipse(sx + w / 2, sy + h / 2, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
    }
  };

  const onPointerUp = () => {
    setIsDrawing(false);
    startPoint.current = null;
    snapshotRef.current = null;
    const ctx = getCtx();
    if (ctx && (tool === 'pen' || tool === 'eraser')) ctx.closePath();
  };

  const commitText = () => {
    if (!textPos || !textValue.trim()) { setTextPos(null); return; }
    const ctx = getCtx();
    if (!ctx) return;
    saveHistory();
    ctx.fillStyle = color;
    ctx.font = `${strokeWidth * 4 + 8}px sans-serif`;
    ctx.fillText(textValue, textPos.x, textPos.y);
    setTextPos(null);
    setTextValue('');
  };

  const undo = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!ctx || !canvas || history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    const img = new Image();
    img.onload = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0); };
    img.src = prev;
  };

  const clearCanvas = () => { saveHistory(); initCanvas(); };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !user) return;
    setSaving(true);
    canvas.toBlob(async (blob) => {
      if (!blob) { setSaving(false); notify('Kon afbeelding niet maken'); return; }
      try {
        const path = `${user.id}/${Date.now()}-sketch.png`;
        const { error: uploadError } = await supabase.storage
          .from('classroom-maps')
          .upload(path, blob, { contentType: 'image/png', upsert: true });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('classroom-maps').getPublicUrl(path);

        const { error } = await supabase.from('classroom_maps').insert({
          school_id: schoolId,
          created_by: user.id,
          group_id: groupId || null,
          name: mapName || 'Klaslokaal Schets',
          image_url: urlData.publicUrl,
          storage_path: path,
        });
        if (error) throw error;

        notify('Schets opgeslagen!');
        onMapSaved();
        setTimeout(onClose, 800);
      } catch (err) {
        console.error(err);
        notify('Opslaan mislukt');
      }
      setSaving(false);
    }, 'image/png');
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.download = `${mapName || 'klaslokaal'}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-blue to-[#7EDCD5] flex items-center justify-center">
              <Pen className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800 text-base">Schets je klaslokaal</h2>
              <p className="text-xs text-gray-500">Teken een eenvoudige plattegrond en sla op als kaart</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
          {/* Tools */}
          <div className="flex items-center gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-200">
            {([
              { id: 'pen', icon: Pen, label: 'Tekenen' },
              { id: 'rect', icon: Square, label: 'Rechthoek' },
              { id: 'circle', icon: Circle, label: 'Cirkel' },
              { id: 'line', icon: LineIcon, label: 'Lijn' },
              { id: 'text', icon: Type, label: 'Tekst' },
              { id: 'eraser', icon: Eraser, label: 'Gum' },
            ] as { id: Tool; icon: React.ElementType; label: string }[]).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setTool(id)}
                title={label}
                className={`p-2 rounded-lg transition-all ${tool === id ? 'bg-sky-blue text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          {/* Stroke widths */}
          <div className="flex items-center gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-200">
            {STROKE_WIDTHS.map(w => (
              <button
                key={w}
                onClick={() => setStrokeWidth(w)}
                title={`${w}px`}
                className={`p-2 rounded-lg transition-all flex items-center justify-center ${strokeWidth === w ? 'bg-sky-blue/10' : 'hover:bg-gray-100'}`}
              >
                <div
                  className="rounded-full"
                  style={{ width: w + 4, height: w + 4, backgroundColor: strokeWidth === w ? '#45B7D1' : '#888' }}
                />
              </button>
            ))}
          </div>

          {/* Colors */}
          <div className="flex items-center gap-1 flex-wrap">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`rounded-full transition-all flex-shrink-0 ${color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : 'hover:scale-110'}`}
                style={{ width: 20, height: 20, backgroundColor: c, border: c === '#fff' ? '1px solid #ccc' : 'none' }}
              />
            ))}
          </div>

          <div className="ml-auto flex items-center gap-1">
            <button onClick={undo} disabled={history.length === 0} title="Ongedaan maken" className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-40">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={clearCanvas} title="Alles wissen" className="p-2 rounded-xl hover:bg-red-50 text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto p-3 bg-gray-100 relative">
          {notification && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-grass-green text-white text-sm font-bold px-4 py-2 rounded-xl shadow-lg">
              {notification}
            </div>
          )}
          <div className="relative inline-block w-full">
            <canvas
              ref={canvasRef}
              width={1200}
              height={700}
              className="w-full rounded-2xl shadow-lg border border-gray-200 touch-none"
              style={{ cursor: tool === 'text' ? 'text' : tool === 'eraser' ? 'cell' : 'crosshair', userSelect: 'none' }}
              onMouseDown={onPointerDown}
              onMouseMove={onPointerMove}
              onMouseUp={onPointerUp}
              onMouseLeave={onPointerUp}
              onTouchStart={onPointerDown}
              onTouchMove={onPointerMove}
              onTouchEnd={onPointerUp}
            />
            {/* Floating text input */}
            {textPos && (
              <input
                ref={textInputRef}
                value={textValue}
                onChange={e => setTextValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') commitText(); if (e.key === 'Escape') setTextPos(null); }}
                onBlur={commitText}
                className="absolute bg-white/90 border-2 border-sky-blue rounded px-2 py-0.5 text-sm outline-none shadow-lg"
                style={{
                  left: `${(textPos.x / 1200) * 100}%`,
                  top: `${(textPos.y / 700) * 100}%`,
                  color,
                  fontSize: strokeWidth * 4 + 8,
                  minWidth: 80,
                }}
                placeholder="Typ tekst..."
              />
            )}
          </div>

          {/* Quick shapes legend */}
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
            <span className="bg-white rounded-lg px-2 py-1 border border-gray-200">Rechthoek = tafel/bureau</span>
            <span className="bg-white rounded-lg px-2 py-1 border border-gray-200">Cirkel = stoel/hoek</span>
            <span className="bg-white rounded-lg px-2 py-1 border border-gray-200">Tekst = labels</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100 flex-wrap">
          <input
            value={mapName}
            onChange={e => setMapName(e.target.value)}
            placeholder="Naam van de kaart"
            className="flex-1 min-w-32 px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-sky-blue outline-none text-sm"
          />
          <button
            onClick={handleDownload}
            className="px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 hover:border-sky-blue hover:text-sky-blue transition-colors text-sm font-semibold flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download PNG
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-sky-blue text-white font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Opslaan...' : 'Opslaan als kaart'}
          </button>
        </div>
      </div>
    </div>
  );
}
