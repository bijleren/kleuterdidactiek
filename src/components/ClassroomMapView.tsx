import { useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { MapPin, Plus, Trash2, Upload, CreditCard as Edit2, Check, X, Image as ImageIcon, Move, Users, ChevronDown, Settings, PenLine } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ClassroomSketchModal from './ClassroomSketchModal';
import { getActivityIcon } from '../lib/activityIcons';

interface ActivityOption {
  id: string;
  name: string;
  color: string;
  icon: string;
  max_students: number | null;
  custom_icon_url?: string | null;
}

interface Hotspot {
  id: string;
  map_id: string;
  activity_option_id: string | null;
  label: string;
  x_percent: number;
  y_percent: number;
  color: string;
  max_students: number;
  sort_order: number;
  activity_option?: ActivityOption | null;
}

interface ClassroomMap {
  id: string;
  name: string;
  image_url: string;
  storage_path: string;
  group_id: string | null;
}

interface ActivityOptionWithBoard extends ActivityOption {
  board_name?: string;
}

interface ActivityBoard {
  id: string;
  name: string;
}

interface ClassroomMapViewProps {
  schoolId: string;
  groupId: string | null;
  groupName: string | null;
  activeBoardId?: string | null;
}

const HOTSPOT_COLORS = [
  '#4ECDC4', '#FF6B6B', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
];

export default function ClassroomMapView({ schoolId, groupId, groupName, activeBoardId }: ClassroomMapViewProps) {
  const { user } = useAuth();
  const [maps, setMaps] = useState<ClassroomMap[]>([]);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [activityOptions, setActivityOptions] = useState<ActivityOptionWithBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [addingHotspot, setAddingHotspot] = useState(false);
  const [editingHotspot, setEditingHotspot] = useState<Hotspot | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [editingMapName, setEditingMapName] = useState(false);
  const [mapNameInput, setMapNameInput] = useState('');
  const [showSketchModal, setShowSketchModal] = useState(false);

  const imageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragOffset = useRef<{ x: number; y: number } | null>(null);

  const selectedMap = maps.find(m => m.id === selectedMapId) ?? null;

  useEffect(() => {
    loadMaps();
  }, [schoolId, groupId]);

  useEffect(() => {
    if (selectedMapId) loadHotspots(selectedMapId);
    else setHotspots([]);
  }, [selectedMapId]);

  useEffect(() => {
    loadAllActivityOptions();
  }, [schoolId, groupId]);

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadMaps = async () => {
    setLoading(true);
    const query = supabase
      .from('classroom_maps')
      .select('*')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false });
    if (groupId) query.eq('group_id', groupId);

    const { data } = await query;
    const result = data || [];
    setMaps(result);
    if (result.length > 0 && !selectedMapId) {
      setSelectedMapId(result[0].id);
    }
    setLoading(false);
  };

  const loadHotspots = async (mapId: string) => {
    const { data } = await supabase
      .from('classroom_hotspots')
      .select('*')
      .eq('map_id', mapId)
      .order('sort_order');
    setHotspots(data || []);
  };

  const loadAllActivityOptions = async () => {
    const boardQuery = supabase
      .from('activity_boards')
      .select('id, name')
      .eq('school_id', schoolId)
      .is('archived_at', null)
      .order('name');
    if (groupId) boardQuery.eq('group_id', groupId);

    const { data: boards } = await boardQuery;
    if (!boards || boards.length === 0) return;

    const boardIds = boards.map((b: ActivityBoard) => b.id);
    const boardNameMap = Object.fromEntries(boards.map((b: ActivityBoard) => [b.id, b.name]));

    const { data } = await supabase
      .from('activity_options')
      .select('*, school_hoekenwerk_icons(public_url)')
      .in('board_id', boardIds)
      .eq('is_active', true)
      .order('sort_order');

    const mapped = (data || []).map((o: any) => ({
      ...o,
      custom_icon_url: o.school_hoekenwerk_icons?.public_url ?? null,
      board_name: boardNameMap[o.board_id] ?? '',
    }));
    setActivityOptions(mapped);
  };

  const handleImageUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('classroom-maps')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('classroom-maps').getPublicUrl(path);
      const imageUrl = urlData.publicUrl;

      const { data, error } = await supabase
        .from('classroom_maps')
        .insert({
          school_id: schoolId,
          created_by: user.id,
          group_id: groupId || null,
          name: 'Mijn Klaslokaal',
          image_url: imageUrl,
          storage_path: path,
        })
        .select()
        .single();
      if (error) throw error;

      setMaps(prev => [data, ...prev]);
      setSelectedMapId(data.id);
      setEditMode(true);
      notify('Klaslokaal afbeelding geüpload!');
    } catch (err) {
      console.error(err);
      notify('Upload mislukt', 'error');
    }
    setUploading(false);
  };

  const handleDeleteMap = async () => {
    if (!selectedMap) return;
    await supabase.storage.from('classroom-maps').remove([selectedMap.storage_path]);
    await supabase.from('classroom_maps').delete().eq('id', selectedMap.id);
    setMaps(prev => prev.filter(m => m.id !== selectedMap.id));
    setSelectedMapId(maps.find(m => m.id !== selectedMap.id)?.id ?? null);
    notify('Klaslokaal verwijderd');
  };

  const handleSaveMapName = async () => {
    if (!selectedMap || !mapNameInput.trim()) return;
    await supabase.from('classroom_maps').update({ name: mapNameInput.trim() }).eq('id', selectedMap.id);
    setMaps(prev => prev.map(m => m.id === selectedMap.id ? { ...m, name: mapNameInput.trim() } : m));
    setEditingMapName(false);
  };

  const getPercentFromEvent = (e: React.MouseEvent | MouseEvent): { x: number; y: number } | null => {
    if (!imageRef.current) return null;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return {
      x: Math.max(2, Math.min(98, x)),
      y: Math.max(2, Math.min(98, y)),
    };
  };

  const handleImageClick = async (e: React.MouseEvent) => {
    if (!addingHotspot || !selectedMapId || draggingId) return;
    const pos = getPercentFromEvent(e);
    if (!pos) return;

    const newHotspot = {
      map_id: selectedMapId,
      activity_option_id: null,
      label: `Hoek ${hotspots.length + 1}`,
      x_percent: pos.x,
      y_percent: pos.y,
      color: HOTSPOT_COLORS[hotspots.length % HOTSPOT_COLORS.length],
      max_students: 4,
      sort_order: hotspots.length,
    };

    const { data, error } = await supabase
      .from('classroom_hotspots')
      .insert(newHotspot)
      .select()
      .single();
    if (!error && data) {
      setHotspots(prev => [...prev, data]);
      setEditingHotspot(data);
      setAddingHotspot(false);
    }
  };

  const handleDragStart = (e: React.MouseEvent, hotspotId: string) => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    setDraggingId(hotspotId);

    const rect = imageRef.current?.getBoundingClientRect();
    const hotspot = hotspots.find(h => h.id === hotspotId);
    if (!rect || !hotspot) return;

    const hotspotPixelX = (hotspot.x_percent / 100) * rect.width + rect.left;
    const hotspotPixelY = (hotspot.y_percent / 100) * rect.height + rect.top;
    dragOffset.current = {
      x: e.clientX - hotspotPixelX,
      y: e.clientY - hotspotPixelY,
    };

    const onMove = (me: MouseEvent) => {
      if (!imageRef.current) return;
      const r = imageRef.current.getBoundingClientRect();
      const offsetX = dragOffset.current?.x ?? 0;
      const offsetY = dragOffset.current?.y ?? 0;
      const x = Math.max(2, Math.min(98, ((me.clientX - offsetX - r.left) / r.width) * 100));
      const y = Math.max(2, Math.min(98, ((me.clientY - offsetY - r.top) / r.height) * 100));
      setHotspots(prev => prev.map(h => h.id === hotspotId ? { ...h, x_percent: x, y_percent: y } : h));
    };

    const onUp = async () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      const hs = hotspots.find(h => h.id === hotspotId);
      if (hs) {
        // Read latest from state via ref pattern — use final value from setHotspots
        setHotspots(prev => {
          const updated = prev.find(h => h.id === hotspotId);
          if (updated) {
            supabase.from('classroom_hotspots').update({
              x_percent: updated.x_percent,
              y_percent: updated.y_percent,
            }).eq('id', hotspotId).then(() => {});
          }
          return prev;
        });
      }
      setDraggingId(null);
      dragOffset.current = null;
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const handleDeleteHotspot = async (id: string) => {
    await supabase.from('classroom_hotspots').delete().eq('id', id);
    setHotspots(prev => prev.filter(h => h.id !== id));
    if (editingHotspot?.id === id) setEditingHotspot(null);
  };

  const handleSaveHotspot = async (hs: Hotspot) => {
    const { error } = await supabase
      .from('classroom_hotspots')
      .update({
        label: hs.label,
        activity_option_id: hs.activity_option_id,
        color: hs.color,
        max_students: hs.max_students,
      })
      .eq('id', hs.id);
    if (!error) {
      setHotspots(prev => prev.map(h => h.id === hs.id ? hs : h));
      setEditingHotspot(null);
    }
  };

  const getActivityForHotspot = useCallback((hs: Hotspot) => {
    if (!hs.activity_option_id) return null;
    return activityOptions.find(a => a.id === hs.activity_option_id) ?? null;
  }, [activityOptions]);

  const renderIcon = (iconName: string, className = 'w-4 h-4') => {
    const Icon = getActivityIcon(iconName);
    if (Icon) return <Icon className={className} />;
    return <span className="text-sm">{iconName}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-sky-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-semibold transition-all ${notification.type === 'success' ? 'bg-grass-green' : 'bg-red-500'}`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-sky-blue" />
          <div>
            {editingMapName && selectedMap ? (
              <div className="flex items-center gap-2">
                <input
                  value={mapNameInput}
                  onChange={e => setMapNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveMapName(); if (e.key === 'Escape') setEditingMapName(false); }}
                  className="text-lg font-bold text-gray-800 border-b-2 border-sky-blue outline-none bg-transparent"
                  autoFocus
                />
                <button onClick={handleSaveMapName} className="text-grass-green hover:scale-110 transition-transform"><Check className="w-4 h-4" /></button>
                <button onClick={() => setEditingMapName(false)} className="text-red-400 hover:scale-110 transition-transform"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-800">
                  {selectedMap ? selectedMap.name : 'Klaslokaal Kaart'}
                </h2>
                {selectedMap && editMode && (
                  <button onClick={() => { setMapNameInput(selectedMap.name); setEditingMapName(true); }} className="text-gray-400 hover:text-sky-blue transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
            <p className="text-sm text-gray-500">
              {groupName ? `${groupName} · ` : ''}
              {selectedMap ? `${hotspots.length} hotspot${hotspots.length !== 1 ? 's' : ''}` : 'Geen kaart geselecteerd'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Map selector */}
          {maps.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowMapPicker(!showMapPicker)}
                className="px-3 py-2 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:border-sky-blue transition-colors flex items-center gap-1.5"
              >
                <ImageIcon className="w-4 h-4" />
                Wissel kaart
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {showMapPicker && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 min-w-48 py-2">
                  {maps.map(m => (
                    <button
                      key={m.id}
                      onClick={() => { setSelectedMapId(m.id); setShowMapPicker(false); }}
                      className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors ${m.id === selectedMapId ? 'text-sky-blue font-bold' : 'text-gray-700'}`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upload new map */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-3 py-2 rounded-xl bg-sky-blue text-white text-sm font-semibold hover:scale-105 transition-transform flex items-center gap-1.5 shadow-md disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploaden...' : maps.length === 0 ? 'Afbeelding uploaden' : 'Nieuwe kaart'}
          </button>
          <button
            onClick={() => setShowSketchModal(true)}
            className="px-3 py-2 rounded-xl bg-deep-purple text-white text-sm font-semibold hover:scale-105 transition-transform flex items-center gap-1.5 shadow-md"
          >
            <PenLine className="w-4 h-4" />
            Schets
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />

          {selectedMap && (
            <>
              {/* Edit toggle */}
              <button
                onClick={() => { setEditMode(!editMode); setAddingHotspot(false); setEditingHotspot(null); }}
                className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${editMode ? 'bg-deep-purple text-white shadow-md' : 'border-2 border-gray-200 text-gray-700 hover:border-deep-purple'}`}
              >
                <Settings className="w-4 h-4" />
                {editMode ? 'Klaar' : 'Bewerken'}
              </button>

              {editMode && (
                <>
                  <button
                    onClick={() => setAddingHotspot(!addingHotspot)}
                    className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${addingHotspot ? 'bg-amber-400 text-white shadow-md' : 'bg-amber-50 text-amber-600 border-2 border-amber-200 hover:border-amber-400'}`}
                  >
                    <Plus className="w-4 h-4" />
                    {addingHotspot ? 'Klik op kaart...' : 'Hotspot toevoegen'}
                  </button>
                  <button
                    onClick={handleDeleteMap}
                    className="px-3 py-2 rounded-xl text-sm font-semibold text-red-500 border-2 border-red-100 hover:border-red-300 hover:bg-red-50 transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    Verwijder kaart
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* No map state */}
      {!selectedMap && (
        <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 bg-sky-blue/10 rounded-2xl flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-sky-blue" />
          </div>
          <div className="text-center">
            <p className="font-bold text-gray-700 text-lg">Nog geen klaslokaal kaart</p>
            <p className="text-gray-500 text-sm mt-1">Upload een plattegrond of teken zelf een eenvoudige schets van je klas</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-6 py-3 rounded-xl bg-sky-blue text-white font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              <Upload className="w-5 h-5" />
              {uploading ? 'Uploaden...' : 'Afbeelding uploaden'}
            </button>
            <button
              onClick={() => setShowSketchModal(true)}
              className="px-6 py-3 rounded-xl bg-deep-purple text-white font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg"
            >
              <PenLine className="w-5 h-5" />
              Schets tekenen
            </button>
          </div>
        </div>
      )}

      {/* Map with hotspots */}
      {selectedMap && (
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Active board info */}
          {!activeBoardId && activityOptions.length > 0 && (
            <div className="bg-blue-50 border-b border-blue-100 px-4 py-2.5 flex items-center gap-2 text-sm text-blue-700">
              <Users className="w-4 h-4 flex-shrink-0" />
              <span>Activeer een hoekenwerk bord om bezetting per hotspot te tonen</span>
            </div>
          )}

          <div
            ref={imageRef}
            className={`relative select-none overflow-hidden ${addingHotspot ? 'cursor-crosshair' : ''}`}
            onClick={handleImageClick}
            style={{ touchAction: 'none' }}
          >
            <img
              src={selectedMap.image_url}
              alt={selectedMap.name}
              className="w-full h-auto block max-h-[70vh] object-contain bg-gray-50"
              draggable={false}
            />

            {/* Hotspots */}
            {hotspots.map(hs => {
              const activity = getActivityForHotspot(hs);
              const isDragging = draggingId === hs.id;
              const isSelf = editingHotspot?.id === hs.id;

              return (
                <div
                  key={hs.id}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all ${isDragging ? 'scale-110 z-20' : 'z-10'} ${editMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
                  style={{ left: `${hs.x_percent}%`, top: `${hs.y_percent}%` }}
                  onMouseDown={e => handleDragStart(e, hs.id)}
                  onClick={e => { e.stopPropagation(); if (!isDragging) setEditingHotspot(isSelf ? null : hs); }}
                >
                  {/* Pin */}
                  <div
                    className={`flex flex-col items-center gap-0.5 group`}
                    title={hs.label}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white transition-all ${isSelf ? 'ring-4 ring-deep-purple scale-110' : ''}`}
                      style={{ backgroundColor: activity?.color ?? hs.color }}
                    >
                      {activity ? (
                        activity.custom_icon_url ? (
                          <img src={activity.custom_icon_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          renderIcon(activity.icon, 'w-6 h-6 text-white')
                        )
                      ) : (
                        <MapPin className="w-6 h-6 text-white" />
                      )}
                    </div>

                    {/* Label + capacity pill */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-lg px-2 py-0.5 shadow-md border border-gray-100 pointer-events-none">
                      <div className="text-xs font-bold text-gray-800 whitespace-nowrap max-w-24 truncate text-center">
                        {activity?.name ?? hs.label}
                      </div>
                      {activeBoardId && activity && (
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <Users className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-600 font-semibold">
                            {activity.max_students ?? hs.max_students}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Edit indicator */}
                    {editMode && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Move className="w-3 h-3 text-white drop-shadow" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add hotspot hint */}
            {addingHotspot && (
              <div className="absolute inset-0 bg-sky-blue/5 flex items-center justify-center pointer-events-none">
                <div className="bg-sky-blue/90 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-xl">
                  Klik op de kaart om een hotspot te plaatsen
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hotspot editor panel */}
      {editingHotspot && (
        <HotspotEditor
          hotspot={editingHotspot}
          activityOptions={activityOptions}
          activeBoardId={activeBoardId}
          onChange={setEditingHotspot}
          onSave={handleSaveHotspot}
          onDelete={handleDeleteHotspot}
          onClose={() => setEditingHotspot(null)}
          renderIcon={renderIcon}
        />
      )}

      {/* Legend / hotspot list when not editing */}
      {!editMode && hotspots.length > 0 && (
        <div className="bg-white rounded-3xl shadow-xl p-4 sm:p-6">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-sky-blue" />
            Hoeken overzicht
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {hotspots.map(hs => {
              const activity = getActivityForHotspot(hs);
              return (
                <div
                  key={hs.id}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-100 bg-gray-50"
                >
                  <div
                    className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: activity?.color ?? hs.color }}
                  >
                    {activity ? (
                      activity.custom_icon_url ? (
                        <img src={activity.custom_icon_url} alt="" className="w-4 h-4 rounded-full object-cover" />
                      ) : (
                        renderIcon(activity.icon, 'w-4 h-4 text-white')
                      )
                    ) : (
                      <MapPin className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-gray-800 truncate">{activity?.name ?? hs.label}</div>
                    {activeBoardId && (
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{activity?.max_students ?? hs.max_students} max</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sketch Modal */}
      <ClassroomSketchModal
        isOpen={showSketchModal}
        onClose={() => setShowSketchModal(false)}
        schoolId={schoolId}
        groupId={groupId}
        onMapSaved={() => { loadMaps(); }}
      />
    </div>
  );
}

interface HotspotEditorProps {
  hotspot: Hotspot;
  activityOptions: ActivityOptionWithBoard[];
  activeBoardId?: string | null;
  onChange: (hs: Hotspot) => void;
  onSave: (hs: Hotspot) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  renderIcon: (icon: string, className?: string) => ReactNode;
}

function HotspotEditor({ hotspot, activityOptions, activeBoardId, onChange, onSave, onDelete, onClose, renderIcon }: HotspotEditorProps) {
  return (
    <div className="bg-white rounded-3xl shadow-xl p-4 sm:p-6 border-2 border-deep-purple/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Edit2 className="w-4 h-4 text-deep-purple" />
          Hotspot bewerken
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Label */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Label</label>
          <input
            value={hotspot.label}
            onChange={e => onChange({ ...hotspot, label: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-deep-purple outline-none text-sm"
            placeholder="Naam van de hoek"
          />
        </div>

        {/* Max students */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Max. leerlingen</label>
          <input
            type="number"
            min={1}
            max={30}
            value={hotspot.max_students}
            onChange={e => onChange({ ...hotspot, max_students: parseInt(e.target.value) || 1 })}
            className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-deep-purple outline-none text-sm"
          />
        </div>

        {/* Activity link */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Koppel aan hoek
            {activityOptions.length === 0 && (
              <span className="text-gray-400 font-normal"> (maak eerst een hoekenwerk bord aan)</span>
            )}
          </label>
          <select
            value={hotspot.activity_option_id ?? ''}
            onChange={e => onChange({ ...hotspot, activity_option_id: e.target.value || null })}
            className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-deep-purple outline-none text-sm bg-white disabled:bg-gray-50 disabled:text-gray-400"
            disabled={activityOptions.length === 0}
          >
            <option value="">— Geen koppeling —</option>
            {(() => {
              const boards = [...new Set(activityOptions.map(o => o.board_name))].filter(Boolean);
              if (boards.length <= 1) {
                return activityOptions.map(ao => (
                  <option key={ao.id} value={ao.id}>{ao.name}</option>
                ));
              }
              return boards.map(boardName => (
                <optgroup key={boardName} label={boardName ?? ''}>
                  {activityOptions.filter(ao => ao.board_name === boardName).map(ao => (
                    <option key={ao.id} value={ao.id}>{ao.name}</option>
                  ))}
                </optgroup>
              ));
            })()}
          </select>
        </div>

        {/* Color picker */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-2">Kleur hotspot</label>
          <div className="flex gap-2 flex-wrap">
            {HOTSPOT_COLORS.map(c => (
              <button
                key={c}
                onClick={() => onChange({ ...hotspot, color: c })}
                className={`w-8 h-8 rounded-full transition-all ${hotspot.color === c ? 'scale-125 ring-4 ring-offset-1 ring-gray-400' : 'hover:scale-110'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
        <button
          onClick={() => onSave(hotspot)}
          className="flex-1 px-4 py-2.5 rounded-xl bg-deep-purple text-white font-semibold text-sm hover:scale-105 transition-transform flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          Opslaan
        </button>
        <button
          onClick={() => onDelete(hotspot.id)}
          className="px-4 py-2.5 rounded-xl border-2 border-red-200 text-red-500 hover:bg-red-50 transition-colors text-sm font-semibold flex items-center gap-1.5"
        >
          <Trash2 className="w-4 h-4" />
          Verwijder
        </button>
      </div>
    </div>
  );
}
