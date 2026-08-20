import { useState, useEffect, useRef } from 'react';
import { Plus, X, Check, Search, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Modal from './Modal';
import { getActivityIcon } from '../lib/activityIcons';
import { uploadHoekenIcon } from '../utils/iconUpload';

interface ActivityPreset {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  max_students: number | null;
  goal_codes: string[];
}

interface TemplateItem {
  activity_preset_id: string;
  sort_order: number;
  max_students_override: number | null;
  preset: ActivityPreset;
}

interface HoekenTemplate {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  custom_icon_id?: string | null;
  custom_icon_url?: string | null;
  items: {
    id: string;
    activity_preset_id: string;
    sort_order: number;
    max_students_override: number | null;
  }[];
}

interface HoekenTemplateBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  schoolId: string;
  editingTemplate?: HoekenTemplate | null;
}

const TEMPLATE_ICONS = [
  'LayoutGrid', 'Layers', 'Grid3x3', 'Palette', 'BookOpen', 'Star', 'Heart', 'Sun', 'Cloud', 'Flower2',
  'Pencil', 'Scissors', 'Ruler', 'Calculator', 'Music', 'Blocks', 'Puzzle',
  'TreePine', 'Rabbit', 'Fish', 'Bug', 'Apple', 'Cherry', 'Leaf',
  'Globe', 'Map', 'Compass', 'Microscope', 'FlaskConical',
  'PaintBucket', 'Brush', 'Theater',
  'Dumbbell', 'Bike', 'Trophy', 'Medal',
  'Users', 'Handshake', 'Smile',
  'Clock', 'Bell', 'Backpack', 'Building2', 'Home',
];

export default function HoekenTemplateBuilder({
  isOpen,
  onClose,
  onSaved,
  schoolId,
  editingTemplate,
}: HoekenTemplateBuilderProps) {
  const { user } = useAuth();
  const [presets, setPresets] = useState<ActivityPreset[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('LayoutGrid');
  const [customIconId, setCustomIconId] = useState<string | null>(null);
  const [customIconUrl, setCustomIconUrl] = useState<string | null>(null);
  const [iconUploading, setIconUploading] = useState(false);
  const iconFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedItems, setSelectedItems] = useState<TemplateItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPresets();
      if (editingTemplate) {
        setName(editingTemplate.name);
        setDescription(editingTemplate.description || '');
        setIcon(editingTemplate.icon);
        setCustomIconId(editingTemplate.custom_icon_id ?? null);
        setCustomIconUrl(editingTemplate.custom_icon_url ?? null);
      } else {
        setName('');
        setDescription('');
        setIcon('LayoutGrid');
        setCustomIconId(null);
        setCustomIconUrl(null);
        setSelectedItems([]);
      }
    }
  }, [isOpen, editingTemplate]);

  useEffect(() => {
    if (editingTemplate && presets.length > 0) {
      const items: TemplateItem[] = editingTemplate.items
        .map((item) => {
          const preset = presets.find((p) => p.id === item.activity_preset_id);
          if (!preset) return null;
          return {
            activity_preset_id: item.activity_preset_id,
            sort_order: item.sort_order,
            max_students_override: item.max_students_override,
            preset,
          };
        })
        .filter(Boolean) as TemplateItem[];
      setSelectedItems(items.sort((a, b) => a.sort_order - b.sort_order));
    }
  }, [editingTemplate, presets]);

  const loadPresets = async () => {
    const { data } = await supabase
      .from('activity_presets')
      .select('*')
      .or(`school_id.is.null,school_id.eq.${schoolId}`)
      .order('name');
    setPresets(data || []);
  };

  const togglePreset = (preset: ActivityPreset) => {
    const exists = selectedItems.find((i) => i.activity_preset_id === preset.id);
    if (exists) {
      setSelectedItems(selectedItems.filter((i) => i.activity_preset_id !== preset.id));
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          activity_preset_id: preset.id,
          sort_order: selectedItems.length,
          max_students_override: null,
          preset,
        },
      ]);
    }
  };

  const updateItemOverride = (presetId: string, value: number | null) => {
    setSelectedItems(
      selectedItems.map((item) =>
        item.activity_preset_id === presetId
          ? { ...item, max_students_override: value }
          : item
      )
    );
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= selectedItems.length) return;
    const newItems = [...selectedItems];
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    setSelectedItems(newItems.map((item, i) => ({ ...item, sort_order: i })));
  };

  const handleIconFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    e.target.value = '';
    setIconUploading(true);
    try {
      const uploaded = await uploadHoekenIcon(file, schoolId, user.id);
      setCustomIconId(uploaded.id);
      setCustomIconUrl(uploaded.public_url);
    } catch (err) {
      console.error('Icon upload failed:', err);
    } finally {
      setIconUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || selectedItems.length === 0 || !user) return;
    setSaving(true);

    try {
      if (editingTemplate) {
        await supabase
          .from('hoekenwerk_templates')
          .update({ name, description: description || null, icon, custom_icon_id: customIconId ?? null, updated_at: new Date().toISOString() })
          .eq('id', editingTemplate.id);

        await supabase
          .from('hoekenwerk_template_items')
          .delete()
          .eq('template_id', editingTemplate.id);

        await supabase.from('hoekenwerk_template_items').insert(
          selectedItems.map((item, i) => ({
            template_id: editingTemplate.id,
            activity_preset_id: item.activity_preset_id,
            sort_order: i,
            max_students_override: item.max_students_override,
          }))
        );
      } else {
        const { data: template, error } = await supabase
          .from('hoekenwerk_templates')
          .insert({
            school_id: schoolId,
            name,
            description: description || null,
            icon,
            custom_icon_id: customIconId ?? null,
            created_by: user.id,
          })
          .select('id')
          .single();

        if (error) throw error;

        await supabase.from('hoekenwerk_template_items').insert(
          selectedItems.map((item, i) => ({
            template_id: template.id,
            activity_preset_id: item.activity_preset_id,
            sort_order: i,
            max_students_override: item.max_students_override,
          }))
        );
      }

      onSaved();
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setSaving(false);
    }
  };

  const renderIcon = (iconName: string, className: string = 'w-5 h-5', customUrl?: string | null) => {
    if (customUrl) {
      return <img src={customUrl} alt="" className={`object-cover rounded ${className}`} />;
    }
    if (iconName && /^[A-Z]/.test(iconName)) {
      const IconComponent = getActivityIcon(iconName);
      if (IconComponent) return <IconComponent className={className} />;
    }
    return <span className={className}>{iconName}</span>;
  };

  const filteredPresets = presets.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isSelected = (presetId: string) => selectedItems.some((i) => i.activity_preset_id === presetId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTemplate ? 'Template Bewerken' : 'Nieuw Hoekenwerk Template'}
      size="lg"
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Naam *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-sky-blue focus:outline-none text-sm"
              placeholder="Bijv. Ochtend hoekenwerk"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Icoon</label>
            <div className="flex gap-1.5 flex-wrap">
              {TEMPLATE_ICONS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => { setIcon(ic); setCustomIconId(null); setCustomIconUrl(null); }}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                    icon === ic && !customIconUrl
                      ? 'bg-deep-purple text-white scale-110 shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {renderIcon(ic, 'w-5 h-5')}
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              {customIconUrl ? (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg overflow-hidden ring-4 ring-deep-purple ring-offset-2 flex-shrink-0">
                    <img src={customIconUrl} alt="Eigen icoon" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs text-deep-purple font-semibold">Eigen icoon</span>
                  <button
                    onClick={() => { setCustomIconId(null); setCustomIconUrl(null); }}
                    className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors"
                    title="Verwijder eigen icoon"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => iconFileInputRef.current?.click()}
                disabled={iconUploading}
                className="flex items-center gap-2 px-3 py-1.5 border-2 border-dashed border-gray-300 rounded-lg text-xs text-gray-600 hover:border-deep-purple hover:text-deep-purple transition-colors disabled:opacity-50"
              >
                {iconUploading ? (
                  <div className="w-3.5 h-3.5 border-2 border-deep-purple border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                {iconUploading ? 'Uploaden...' : 'Upload eigen foto'}
              </button>
              <input
                ref={iconFileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleIconFileChange}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Beschrijving</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-sky-blue focus:outline-none text-sm"
            placeholder="Optioneel"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Kies hoeken ({selectedItems.length} geselecteerd) *
          </label>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border-2 border-gray-200 focus:border-sky-blue focus:outline-none text-sm"
              placeholder="Zoek hoeken..."
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-52 overflow-y-auto p-1">
            {filteredPresets.map((preset) => {
              const selected = isSelected(preset.id);
              return (
                <button
                  key={preset.id}
                  onClick={() => togglePreset(preset)}
                  className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                    selected
                      ? 'border-deep-purple bg-deep-purple/5 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  {selected && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-deep-purple rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white mb-1.5"
                    style={{ backgroundColor: preset.color }}
                  >
                    {renderIcon(preset.icon, 'w-4 h-4 text-white')}
                  </div>
                  <div className="text-xs font-semibold text-gray-800 truncate">{preset.name}</div>
                  {preset.max_students && (
                    <div className="text-[10px] text-gray-500">max {preset.max_students}</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {selectedItems.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Volgorde en instellingen
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedItems.map((item, index) => (
                <div
                  key={item.activity_preset_id}
                  className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl"
                >
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveItem(index, -1)}
                      disabled={index === 0}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs leading-none"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveItem(index, 1)}
                      disabled={index === selectedItems.length - 1}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs leading-none"
                    >
                      ▼
                    </button>
                  </div>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                    style={{ backgroundColor: item.preset.color }}
                  >
                    {renderIcon(item.preset.icon, 'w-4 h-4 text-white')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-800 truncate">{item.preset.name}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-gray-500 whitespace-nowrap">Max:</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={item.max_students_override ?? item.preset.max_students ?? ''}
                      onChange={(e) =>
                        updateItemOverride(
                          item.activity_preset_id,
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      className="w-14 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-sky-blue"
                      placeholder={String(item.preset.max_students || '∞')}
                    />
                  </div>
                  <button
                    onClick={() => togglePreset(item.preset)}
                    className="p-1 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-baloo hover:bg-gray-50 transition-colors"
          >
            Annuleren
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || selectedItems.length === 0 || saving}
            className="flex-1 bg-gradient-to-r from-sky-blue to-[#7EDCD5] text-white px-6 py-3 rounded-full font-baloo shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Opslaan...' : editingTemplate ? 'Bijwerken' : 'Opslaan'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
