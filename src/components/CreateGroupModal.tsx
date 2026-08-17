import { useState, useEffect } from 'react';
import { X, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  grade_level: string | null;
}

interface CreateGroupModalProps {
  schoolId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateGroupModal({
  schoolId,
  onClose,
  onSuccess,
}: CreateGroupModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    grade_level: '',
    description: '',
    school_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);

  useEffect(() => {
    loadStudents();
  }, [schoolId]);

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, grade_level')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('last_name', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleToggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          school_id: schoolId,
          name: formData.name.trim(),
          grade_level: formData.grade_level.trim() || null,
          description: formData.description.trim() || null,
          school_year: formData.school_year.trim() || null,
          is_active: true,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      if (selectedStudents.size > 0 && group) {
        const studentGroupRecords = Array.from(selectedStudents).map((studentId) => ({
          group_id: group.id,
          student_id: studentId,
        }));

        const { error: studentGroupError } = await supabase
          .from('student_groups')
          .insert(studentGroupRecords);

        if (studentGroupError) throw studentGroupError;
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Er is een fout opgetreden bij het aanmaken van de groep');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-grass-green to-[#B5F0BE] p-6 flex items-center justify-between">
          <h2 className="text-2xl font-baloo text-white">Nieuwe Groep Aanmaken</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Groepsnaam *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Bijv. K1A, Regenbooggroep, Zonnestraaltjes"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-grass-green focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Groepsniveau
                </label>
                <input
                  type="text"
                  value={formData.grade_level}
                  onChange={(e) =>
                    setFormData({ ...formData, grade_level: e.target.value })
                  }
                  placeholder="Bijv. K1, K2, K3"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-grass-green focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Schooljaar
                </label>
                <input
                  type="text"
                  value={formData.school_year}
                  onChange={(e) =>
                    setFormData({ ...formData, school_year: e.target.value })
                  }
                  placeholder="2024-2025"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-grass-green focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Beschrijving
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optionele beschrijving van de groep"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-grass-green focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Studenten toevoegen (optioneel)
              </label>
              <div className="bg-lavender/10 rounded-xl p-4 max-h-64 overflow-y-auto border-2 border-lavender/30">
                {loadingStudents ? (
                  <div className="text-center py-4 text-gray-500">Studenten laden...</div>
                ) : students.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    Geen studenten beschikbaar
                  </div>
                ) : (
                  <div className="space-y-2">
                    {students.map((student) => (
                      <label
                        key={student.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-lavender/20 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudents.has(student.id)}
                          onChange={() => handleToggleStudent(student.id)}
                          className="w-5 h-5 rounded border-2 border-gray-300 text-grass-green focus:ring-grass-green"
                        />
                        <div className="flex-1">
                          <span className="font-semibold text-deep-purple">
                            {student.first_name} {student.last_name}
                          </span>
                          {student.grade_level && (
                            <span className="ml-2 text-sm text-gray-600">
                              ({student.grade_level})
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {selectedStudents.size > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  {selectedStudents.size} student{selectedStudents.size !== 1 ? 'en' : ''}{' '}
                  geselecteerd
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-grass-green to-[#B5F0BE] text-white px-8 py-3 rounded-full font-baloo shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
            >
              <Users className="w-5 h-5" />
              {loading ? 'Aanmaken...' : 'Groep Aanmaken'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
