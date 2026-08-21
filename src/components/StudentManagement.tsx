import { useEffect, useState } from 'react';
import { X, Plus, User, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_number: string | null;
  grade_level: string | null;
  date_of_birth: string | null;
  is_active: boolean;
}

interface StudentManagementProps {
  schoolId: string;
  onClose: () => void;
}

export default function StudentManagement({ schoolId, onClose }: StudentManagementProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newStudent, setNewStudent] = useState({
    first_name: '',
    last_name: '',
    student_number: '',
    grade_level: '',
    date_of_birth: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadStudents();
  }, [schoolId]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredStudents(students);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = students.filter(
        (student) =>
          student.first_name.toLowerCase().includes(term) ||
          student.last_name.toLowerCase().includes(term) ||
          student.student_number?.toLowerCase().includes(term)
      );
      setFilteredStudents(filtered);
    }
  }, [searchTerm, students]);

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('last_name', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
      setFilteredStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const { data, error } = await supabase
        .from('students')
        .insert({
          school_id: schoolId,
          first_name: newStudent.first_name.trim(),
          last_name: newStudent.last_name.trim(),
          student_number: newStudent.student_number.trim() || null,
          grade_level: newStudent.grade_level.trim() || null,
          date_of_birth: newStudent.date_of_birth || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setStudents([...students, data]);
      setNewStudent({
        first_name: '',
        last_name: '',
        student_number: '',
        grade_level: '',
        date_of_birth: '',
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating student:', error);
      alert('Er is een fout opgetreden bij het aanmaken van de student');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-sky-blue to-[#B5E9F7] p-6 flex items-center justify-between">
          <h2 className="text-2xl font-baloo text-white">Studenten Beheer</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-auto">
          <div className="mb-6 flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Zoek studenten..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-gray-200 focus:border-sky-blue focus:outline-none"
              />
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-grass-green text-white px-6 py-3 rounded-full font-baloo flex items-center gap-2 shadow-lg hover:scale-105 transition-transform"
            >
              <Plus className="w-5 h-5" />
              Nieuwe Student
            </button>
          </div>

          {showCreateForm && (
            <div className="bg-lavender/20 rounded-2xl p-6 mb-6">
              <h3 className="text-xl font-baloo text-deep-purple mb-4">
                Nieuwe Student Toevoegen
              </h3>
              <form onSubmit={handleCreateStudent} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Voornaam *
                    </label>
                    <input
                      type="text"
                      required
                      value={newStudent.first_name}
                      onChange={(e) =>
                        setNewStudent({ ...newStudent, first_name: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-sky-blue focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Achternaam *
                    </label>
                    <input
                      type="text"
                      required
                      value={newStudent.last_name}
                      onChange={(e) =>
                        setNewStudent({ ...newStudent, last_name: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-sky-blue focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Studentnummer
                    </label>
                    <input
                      type="text"
                      value={newStudent.student_number}
                      onChange={(e) =>
                        setNewStudent({ ...newStudent, student_number: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-sky-blue focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Groepsniveau
                    </label>
                    <input
                      type="text"
                      value={newStudent.grade_level}
                      onChange={(e) =>
                        setNewStudent({ ...newStudent, grade_level: e.target.value })
                      }
                      placeholder="Bijv. K1, K2, K3"
                      className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-sky-blue focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Geboortedatum
                    </label>
                    <input
                      type="date"
                      value={newStudent.date_of_birth}
                      onChange={(e) =>
                        setNewStudent({ ...newStudent, date_of_birth: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-sky-blue focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 py-2 rounded-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="bg-grass-green text-white px-6 py-2 rounded-full font-baloo shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {creating ? 'Aanmaken...' : 'Student Aanmaken'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-xl font-baloo text-deep-purple">Laden...</div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gradient-to-br from-sky-blue/20 to-grass-green/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-sky-blue" />
              </div>
              <h3 className="text-xl font-baloo text-deep-purple mb-2">
                {searchTerm ? 'Geen studenten gevonden' : 'Nog geen studenten'}
              </h3>
              <p className="text-gray-600">
                {searchTerm
                  ? 'Probeer een andere zoekopdracht'
                  : 'Voeg je eerste student toe om te beginnen'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-4">
                {filteredStudents.length} student{filteredStudents.length !== 1 ? 'en' : ''}{' '}
                gevonden
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="bg-gradient-to-br from-white to-lavender/10 rounded-2xl p-4 border-2 border-lavender/30 hover:border-sky-blue transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-gradient-to-br from-sky-blue to-[#B5E9F7] p-3 rounded-xl">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-baloo text-deep-purple text-lg">
                          {student.first_name} {student.last_name}
                        </h4>
                        {student.student_number && (
                          <p className="text-sm text-gray-600">
                            Nr: {student.student_number}
                          </p>
                        )}
                        {student.grade_level && (
                          <span className="inline-block text-xs bg-lavender/30 text-deep-purple px-2 py-1 rounded-full font-semibold mt-1">
                            {student.grade_level}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
