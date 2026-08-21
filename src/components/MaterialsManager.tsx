import { useState, useEffect } from 'react';
import DoelChips from './DoelChips';
import { supabase } from '../lib/supabase';
import DoelSelector from './DoelSelector';
import { BookOpen, Plus, CheckCircle, Trash2, Search, CreditCard as Edit, ExternalLink, FileText, Globe, Book, Upload } from 'lucide-react';
import Modal from './Modal';
import { logActivityToCalendar } from '../utils/calendarLogger';

interface EducationalMaterial {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  isbn: string | null;
  material_type: 'website' | 'book' | 'document' | 'other';
  is_global: boolean;
  school_id: string | null;
  created_at: string;
  goal_codes?: string[];
  session_count?: number;
}

interface MaterialsManagerProps {
  groupId: string;
  schoolId: string;
  goalFilter?: string;
}

const materialTypeIcons = {
  website: Globe,
  book: Book,
  document: FileText,
  other: BookOpen,
};

const materialTypeLabels = {
  website: 'Website',
  book: 'Boek',
  document: 'Document',
  other: 'Overig',
};

export default function MaterialsManager({ groupId, schoolId: propSchoolId, goalFilter }: MaterialsManagerProps) {
  const [materials, setMaterials] = useState<EducationalMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<EducationalMaterial | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    isbn: '',
    material_type: 'website' as 'website' | 'book' | 'document' | 'other',
    goal_codes: [] as string[],
  });
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesMaterialId, setNotesMaterialId] = useState<string | null>(null);
  const [practiceNotes, setPracticeNotes] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadSchoolId();
  }, [groupId]);

  useEffect(() => {
    if (schoolId) {
      loadMaterials();
    }
  }, [schoolId]);

  useEffect(() => {
    if (showAddModal) {
    }
  }, [showAddModal]);

  const loadSchoolId = async () => {
    const { data } = await supabase
      .from('groups')
      .select('school_id')
      .eq('id', groupId)
      .maybeSingle();

    if (data) {
      setSchoolId(data.school_id);
    }
  };

  const loadMaterials = async () => {
    if (!schoolId) return;

    try {
      const { data: materialsData, error: materialsError } = await supabase
        .from('educational_materials')
        .select('*')
        .or(`is_global.eq.true,school_id.eq.${schoolId}`)
        .order('created_at', { ascending: false });

      if (materialsError) throw materialsError;

      const materialIds = materialsData?.map((m) => m.id) || [];

      const [goalsData, sessionsData] = await Promise.all([
        supabase
          .from('educational_material_goals')
          .select('material_id, goal_code')
          .in('material_id', materialIds),
        supabase
          .from('educational_material_sessions')
          .select('material_id')
          .in('material_id', materialIds)
          .eq('group_id', groupId),
      ]);

      const goalsMap = new Map<string, string[]>();
      goalsData.data?.forEach((g) => {
        if (!goalsMap.has(g.material_id)) {
          goalsMap.set(g.material_id, []);
        }
        goalsMap.get(g.material_id)!.push(g.goal_code);
      });

      const sessionCountMap = new Map<string, number>();
      sessionsData.data?.forEach((s) => {
        sessionCountMap.set(s.material_id, (sessionCountMap.get(s.material_id) || 0) + 1);
      });

      const enrichedMaterials = materialsData?.map((m) => ({
        ...m,
        goal_codes: goalsMap.get(m.id) || [],
        session_count: sessionCountMap.get(m.id) || 0,
      })) || [];

      setMaterials(enrichedMaterials);
    } catch (error) {
      console.error('Error loading materials:', error);
    } finally {
      setLoading(false);
    }
  };


  const uploadDocument = async (file: File): Promise<string | null> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user || !schoolId) return null;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${schoolId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('educational-materials')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('educational-materials')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading document:', error);
      return null;
    }
  };

  const handleAddMaterial = async () => {
    if (!formData.title.trim() || !schoolId) return;

    try {
      setUploading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      let finalUrl = formData.url;

      if (formData.material_type === 'document' && uploadedFiles.length > 0) {
        const uploadUrl = await uploadDocument(uploadedFiles[0]);
        if (uploadUrl) {
          finalUrl = uploadUrl;
        }
      }

      const { data: newMaterial, error: materialError } = await supabase
        .from('educational_materials')
        .insert({
          title: formData.title,
          description: formData.description || null,
          url: finalUrl || null,
          isbn: formData.isbn || null,
          material_type: formData.material_type,
          is_global: false,
          school_id: schoolId,
          created_by: userData.user.id,
        })
        .select()
        .single();

      if (materialError) throw materialError;

      if (formData.goal_codes.length > 0 && newMaterial) {
        const goalInserts = formData.goal_codes.map((code) => ({
          material_id: newMaterial.id,
          goal_code: code,
        }));

        const { error: goalsError } = await supabase
          .from('educational_material_goals')
          .insert(goalInserts);

        if (goalsError) throw goalsError;
      }

      await loadMaterials();
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error adding material:', error);
      alert('Er is een fout opgetreden bij het toevoegen van het materiaal');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateMaterial = async () => {
    if (!editingMaterialId || !formData.title.trim()) return;

    try {
      setUploading(true);
      let finalUrl = formData.url;

      if (formData.material_type === 'document' && uploadedFiles.length > 0) {
        const uploadUrl = await uploadDocument(uploadedFiles[0]);
        if (uploadUrl) {
          finalUrl = uploadUrl;
        }
      }

      const { error: updateError } = await supabase
        .from('educational_materials')
        .update({
          title: formData.title,
          description: formData.description || null,
          url: finalUrl || null,
          isbn: formData.isbn || null,
          material_type: formData.material_type,
        })
        .eq('id', editingMaterialId);

      if (updateError) throw updateError;

      const { error: deleteError } = await supabase
        .from('educational_material_goals')
        .delete()
        .eq('material_id', editingMaterialId);

      if (deleteError) throw deleteError;

      if (formData.goal_codes.length > 0) {
        const goalInserts = formData.goal_codes.map((code) => ({
          material_id: editingMaterialId,
          goal_code: code,
        }));

        const { error: goalsError } = await supabase
          .from('educational_material_goals')
          .insert(goalInserts);

        if (goalsError) throw goalsError;
      }

      await loadMaterials();
      setShowAddModal(false);
      setEditingMaterialId(null);
      resetForm();
    } catch (error) {
      console.error('Error updating material:', error);
      alert('Er is een fout opgetreden bij het bijwerken van het materiaal');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMaterial = (materialId: string) => {
    setMaterialToDelete(materialId);
    setShowDeleteModal(true);
  };

  const confirmDeleteMaterial = async () => {
    if (!materialToDelete) return;

    try {
      const { error } = await supabase
        .from('educational_materials')
        .delete()
        .eq('id', materialToDelete);

      if (error) throw error;
      await loadMaterials();
      setShowDeleteModal(false);
      setMaterialToDelete(null);
    } catch (error) {
      console.error('Error deleting material:', error);
      alert('Er is een fout opgetreden bij het verwijderen van het materiaal');
    }
  };

  const handleLogPractice = (materialId: string) => {
    setNotesMaterialId(materialId);
    setPracticeNotes('');
    setShowNotesModal(true);
  };

  const submitLogPractice = async () => {
    if (!notesMaterialId) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const material = materials.find(m => m.id === notesMaterialId);

      const { error } = await supabase
        .from('educational_material_sessions')
        .insert({
          material_id: notesMaterialId,
          group_id: groupId,
          notes: practiceNotes.trim() || null,
          created_by: userData.user.id,
        });

      if (error) throw error;

      if (material && propSchoolId) {
        await logActivityToCalendar({
          itemType: 'material',
          itemId: material.id,
          itemName: material.title,
          groupId,
          schoolId: propSchoolId,
          userId: userData.user.id,
          durationMinutes: 30,
        });
      }

      await loadMaterials();
      setShowMaterialModal(false);
      setSelectedMaterial(null);
      setShowNotesModal(false);
      setNotesMaterialId(null);
      setPracticeNotes('');
    } catch (error) {
      console.error('Error logging practice:', error);
      alert('Er is een fout opgetreden bij het registreren van de sessie');
    }
  };

  const handleEditMaterial = (material: EducationalMaterial) => {
    setEditingMaterialId(material.id);
    setFormData({
      title: material.title,
      description: material.description || '',
      url: material.url || '',
      isbn: material.isbn || '',
      material_type: material.material_type,
      goal_codes: material.goal_codes || [],
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      url: '',
      isbn: '',
      material_type: 'website',
      goal_codes: [],
    });
    setUploadedFiles([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFiles(Array.from(e.target.files));
    }
  };


  const filteredMaterials = materials.filter((material) => {
    const matchesSearch = material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.description?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (goalFilter && material.goal_codes) {
      return material.goal_codes.includes(goalFilter);
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deep-purple"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-baloo text-deep-purple flex items-center gap-2">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
              Educatief Materiaal
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Materialen gekoppeld aan kleuterdoelen
            </p>
          </div>
          <button
            onClick={() => {
              setEditingMaterialId(null);
              resetForm();
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-deep-purple text-white rounded-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg text-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Nieuw materiaal
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Zoek materialen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-deep-purple focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaterials.map((material) => {
          const Icon = materialTypeIcons[material.material_type];
          return (
            <div
              key={material.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-deep-purple to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1 truncate">
                        {material.title}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {materialTypeLabels[material.material_type]}
                      </span>
                    </div>
                  </div>
                  {!material.is_global && (
                    <div className="flex gap-2 ml-2">
                      <button
                        onClick={() => handleEditMaterial(material)}
                        className="text-grass-green hover:bg-grass-green/10 rounded-lg p-1 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMaterial(material.id)}
                        className="text-red-500 hover:bg-red-50 rounded-lg p-1 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {material.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {material.description}
                  </p>
                )}

                {material.isbn && (
                  <p className="text-xs text-gray-500 mb-2">
                    ISBN: {material.isbn}
                  </p>
                )}

                {material.url && (
                  <a
                    href={material.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-deep-purple hover:underline flex items-center gap-1 mb-4"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Bezoek link
                  </a>
                )}

                {material.goal_codes && material.goal_codes.length > 0 && (
                  <div className="mb-4">
                    <DoelChips codes={material.goal_codes} max={3} klein />
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-600">
                    {material.session_count || 0}x gebruikt
                  </span>
                  <button
                    onClick={() => {
                      setSelectedMaterial(material);
                      setShowMaterialModal(true);
                    }}
                    className="px-3 py-1.5 bg-grass-green text-white rounded-lg hover:bg-opacity-90 transition-colors text-sm font-medium"
                  >
                    Bekijk
                  </button>
                </div>

                {material.is_global && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      Globaal materiaal
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredMaterials.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchQuery ? 'Geen materialen gevonden' : 'Nog geen materialen toegevoegd'}
            </p>
          </div>
        )}
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingMaterialId(null);
          resetForm();
        }}
        title={editingMaterialId ? 'Materiaal bewerken' : 'Nieuw materiaal toevoegen'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titel *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-purple focus:border-transparent"
              placeholder="Titel van het materiaal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type *
            </label>
            <select
              value={formData.material_type}
              onChange={(e) => setFormData({ ...formData, material_type: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-purple focus:border-transparent"
            >
              <option value="website">Website</option>
              <option value="book">Boek</option>
              <option value="document">Document</option>
              <option value="other">Overig</option>
            </select>
          </div>

          {formData.material_type === 'book' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ISBN nummer
              </label>
              <input
                type="text"
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-purple focus:border-transparent"
                placeholder="978-0-123456-78-9"
              />
            </div>
          )}

          {formData.material_type === 'document' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload document
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-deep-purple transition-colors">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.ppt,.pptx"
                  className="hidden"
                  id="file-upload"
                  multiple
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Klik om bestand te uploaden
                  </span>
                </label>
                {uploadedFiles.length > 0 && (
                  <div className="mt-2">
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="text-sm text-deep-purple flex items-center justify-center gap-2">
                        <FileText className="w-4 h-4" />
                        {file.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {formData.material_type !== 'document' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-purple focus:border-transparent"
                placeholder="https://..."
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beschrijving
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-purple focus:border-transparent resize-none"
              placeholder="Beschrijving van het materiaal"
            />
          </div>

          <DoelSelector
            waarde={formData.goal_codes}
            onChange={(codes) => setFormData({ ...formData, goal_codes: codes })}
            label="Gekoppelde doelen"
          />

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowAddModal(false);
                setEditingMaterialId(null);
                resetForm();
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={uploading}
            >
              Annuleren
            </button>
            <button
              onClick={editingMaterialId ? handleUpdateMaterial : handleAddMaterial}
              disabled={!formData.title.trim() || uploading}
              className="flex-1 px-4 py-2 bg-deep-purple text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploaden...' : editingMaterialId ? 'Bijwerken' : 'Toevoegen'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showMaterialModal}
        onClose={() => {
          setShowMaterialModal(false);
          setSelectedMaterial(null);
        }}
        title={selectedMaterial?.title || ''}
      >
        <div className="space-y-4">
          {selectedMaterial && (
            <>
              <div className="flex items-center gap-3 pb-4 border-b">
                {(() => {
                  const Icon = materialTypeIcons[selectedMaterial.material_type];
                  return (
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-deep-purple to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  );
                })()}
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedMaterial.title}</h3>
                  <p className="text-sm text-gray-500">
                    {materialTypeLabels[selectedMaterial.material_type]}
                  </p>
                </div>
              </div>

              {selectedMaterial.description && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Beschrijving</h4>
                  <p className="text-gray-600">{selectedMaterial.description}</p>
                </div>
              )}

              {selectedMaterial.isbn && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">ISBN</h4>
                  <p className="text-gray-600">{selectedMaterial.isbn}</p>
                </div>
              )}

              {selectedMaterial.url && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Link</h4>
                  <a
                    href={selectedMaterial.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-deep-purple hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {selectedMaterial.url}
                  </a>
                </div>
              )}

              {selectedMaterial.goal_codes && selectedMaterial.goal_codes.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Gekoppelde doelen</h4>
                  <DoelChips codes={selectedMaterial.goal_codes} />
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">
                  Dit materiaal is {selectedMaterial.session_count || 0} keer gebruikt in de les
                </p>
              </div>

              <button
                onClick={() => {
                  handleLogPractice(selectedMaterial.id);
                }}
                className="w-full px-6 py-3 bg-grass-green text-white rounded-xl font-semibold hover:scale-105 transition-transform flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Gebruikt in de les
              </button>
            </>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showNotesModal}
        onClose={() => {
          setShowNotesModal(false);
          setNotesMaterialId(null);
          setPracticeNotes('');
        }}
        title="Notities toevoegen"
      >
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            Voeg optionele notities toe over deze lessessie:
          </p>
          <textarea
            value={practiceNotes}
            onChange={(e) => setPracticeNotes(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-deep-purple resize-none"
            placeholder="Notities over de les..."
          />
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowNotesModal(false);
                setNotesMaterialId(null);
                setPracticeNotes('');
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={submitLogPractice}
              className="flex-1 px-4 py-2 bg-grass-green text-white rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Opslaan
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setMaterialToDelete(null);
        }}
        title="Materiaal verwijderen"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Weet je zeker dat je dit materiaal wilt verwijderen? Deze actie kan niet ongedaan gemaakt worden.
          </p>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setMaterialToDelete(null);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={confirmDeleteMaterial}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Verwijderen
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
