import { useState, useEffect } from 'react';
import { X, Shield, UserX, Plus, Trash2, Users, Globe, LayoutGrid as Layout } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  color: string | null;
  profile_picture_url: string | null;
  symbol_url: string | null;
}

interface ActivityOption {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  preset_id?: string | null;
}

interface ActivityPreset {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface PairRestriction {
  id: string;
  student_id_a: string;
  student_id_b: string;
}

interface ActivityBlock {
  id: string;
  activity_option_id: string | null;
  activity_preset_id: string | null;
  student_id: string;
}

interface Props {
  groupId: string;
  students: Student[];
  activities: ActivityOption[];
  presets: ActivityPreset[];
  onClose: () => void;
  onRulesChanged: () => void;
}

const StudentChip = ({ student }: { student: Student }) => {
  const bg = student.color || '#6B7280';
  if (student.profile_picture_url) {
    return (
      <img
        src={student.profile_picture_url}
        alt={student.first_name}
        className="w-7 h-7 rounded-lg object-cover flex-shrink-0 ring-2 ring-white"
      />
    );
  }
  const initials = `${student.first_name[0]}${student.last_name[0]}`.toUpperCase();
  return (
    <div
      className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ring-2 ring-white"
      style={{ backgroundColor: bg }}
    >
      {initials}
    </div>
  );
};

export default function GroupBoardRulesModal({ groupId, students, activities, presets, onClose, onRulesChanged }: Props) {
  const { user } = useAuth();
  const [tab, setTab] = useState<'pairs' | 'blocks'>('pairs');
  const [blockScope, setBlockScope] = useState<'all' | 'this'>('all');
  const hasBoardContext = activities.length > 0;

  const [pairRestrictions, setPairRestrictions] = useState<PairRestriction[]>([]);
  const [activityBlocks, setActivityBlocks] = useState<ActivityBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const [newPairA, setNewPairA] = useState('');
  const [newPairB, setNewPairB] = useState('');
  const [savingPair, setSavingPair] = useState(false);

  const [newBlockPreset, setNewBlockPreset] = useState('');
  const [newBlockStudentAll, setNewBlockStudentAll] = useState('');
  const [savingBlockAll, setSavingBlockAll] = useState(false);

  const [newBlockActivity, setNewBlockActivity] = useState('');
  const [newBlockStudent, setNewBlockStudent] = useState('');
  const [savingBlock, setSavingBlock] = useState(false);

  useEffect(() => {
    loadRules();
  }, [groupId]);

  const loadRules = async () => {
    setLoading(true);
    const [pairRes, blockRes] = await Promise.all([
      supabase
        .from('group_student_pair_restrictions')
        .select('id, student_id_a, student_id_b')
        .eq('group_id', groupId),
      supabase
        .from('group_activity_student_blocks')
        .select('id, activity_option_id, activity_preset_id, student_id')
        .eq('group_id', groupId),
    ]);
    setPairRestrictions(pairRes.data || []);
    setActivityBlocks(blockRes.data || []);
    setLoading(false);
  };

  const addPairRestriction = async () => {
    if (!newPairA || !newPairB || newPairA === newPairB || !user) return;
    setSavingPair(true);
    const [a, b] = newPairA < newPairB ? [newPairA, newPairB] : [newPairB, newPairA];
    const already = pairRestrictions.find(r => r.student_id_a === a && r.student_id_b === b);
    if (!already) {
      await supabase.from('group_student_pair_restrictions').insert({
        group_id: groupId,
        student_id_a: a,
        student_id_b: b,
        created_by: user.id,
      });
    }
    setNewPairA('');
    setNewPairB('');
    setSavingPair(false);
    await loadRules();
    onRulesChanged();
  };

  const removePairRestriction = async (id: string) => {
    await supabase.from('group_student_pair_restrictions').delete().eq('id', id);
    await loadRules();
    onRulesChanged();
  };

  const addPresetBlock = async () => {
    if (!newBlockPreset || !newBlockStudentAll || !user) return;
    setSavingBlockAll(true);
    const already = activityBlocks.find(
      b => b.activity_preset_id === newBlockPreset && b.student_id === newBlockStudentAll
    );
    if (!already) {
      await supabase.from('group_activity_student_blocks').insert({
        group_id: groupId,
        activity_preset_id: newBlockPreset,
        student_id: newBlockStudentAll,
        created_by: user.id,
      });
    }
    setNewBlockPreset('');
    setNewBlockStudentAll('');
    setSavingBlockAll(false);
    await loadRules();
    onRulesChanged();
  };

  const addActivityBlock = async () => {
    if (!newBlockActivity || !newBlockStudent || !user) return;
    setSavingBlock(true);
    const already = activityBlocks.find(
      b => b.activity_option_id === newBlockActivity && b.student_id === newBlockStudent
    );
    if (!already) {
      await supabase.from('group_activity_student_blocks').insert({
        group_id: groupId,
        activity_option_id: newBlockActivity,
        student_id: newBlockStudent,
        created_by: user.id,
      });
    }
    setNewBlockActivity('');
    setNewBlockStudent('');
    setSavingBlock(false);
    await loadRules();
    onRulesChanged();
  };

  const removeActivityBlock = async (id: string) => {
    await supabase.from('group_activity_student_blocks').delete().eq('id', id);
    await loadRules();
    onRulesChanged();
  };

  const findStudent = (id: string) => students.find(s => s.id === id);

  const availablePairBStudents = students.filter(s => {
    if (!newPairA || s.id === newPairA) return false;
    const [a, b] = newPairA < s.id ? [newPairA, s.id] : [s.id, newPairA];
    return !pairRestrictions.find(r => r.student_id_a === a && r.student_id_b === b);
  });

  const presetBlocks = activityBlocks.filter(b => b.activity_preset_id != null);
  const optionBlocks = activityBlocks.filter(b => b.activity_option_id != null);

  const presetBlocksGrouped = presets
    .map(preset => ({ preset, blocks: presetBlocks.filter(b => b.activity_preset_id === preset.id) }))
    .filter(g => g.blocks.length > 0);

  const optionBlocksGrouped = activities
    .map(activity => ({ activity, blocks: optionBlocks.filter(b => b.activity_option_id === activity.id) }))
    .filter(g => g.blocks.length > 0);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-deep-purple to-[#8B6CE0] p-2.5 rounded-xl">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-baloo text-deep-purple">Groepsregels</h2>
              <p className="text-xs text-gray-500">
                {hasBoardContext ? 'Groepsregels + regels voor dit bord' : 'Standaard regels voor alle borden'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Main tabs */}
        <div className="flex gap-1 p-3 bg-gray-50 border-b border-gray-100 flex-shrink-0">
          <button
            onClick={() => setTab('pairs')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
              tab === 'pairs' ? 'bg-white shadow text-deep-purple' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Koppelverbod
            {pairRestrictions.length > 0 && (
              <span className="bg-deep-purple/10 text-deep-purple text-xs px-1.5 py-0.5 rounded-full">
                {pairRestrictions.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('blocks')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
              tab === 'blocks' ? 'bg-white shadow text-deep-purple' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <UserX className="w-4 h-4" />
            Blokkades
            {activityBlocks.length > 0 && (
              <span className="bg-deep-purple/10 text-deep-purple text-xs px-1.5 py-0.5 rounded-full">
                {activityBlocks.length}
              </span>
            )}
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="text-center py-10 text-gray-400 font-baloo">Laden...</div>
          ) : tab === 'pairs' ? (
            <>
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                <p className="text-sm font-semibold text-gray-700">Voeg koppelverbod toe</p>
                <div className="flex gap-2">
                  <select
                    value={newPairA}
                    onChange={e => { setNewPairA(e.target.value); setNewPairB(''); }}
                    className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-deep-purple focus:outline-none"
                  >
                    <option value="">Leerling A</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                    ))}
                  </select>
                  <select
                    value={newPairB}
                    onChange={e => setNewPairB(e.target.value)}
                    disabled={!newPairA}
                    className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-deep-purple focus:outline-none disabled:opacity-50"
                  >
                    <option value="">Leerling B</option>
                    {availablePairBStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                    ))}
                  </select>
                  <button
                    onClick={addPairRestriction}
                    disabled={!newPairA || !newPairB || savingPair}
                    className="px-4 py-2 bg-deep-purple text-white rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-40 disabled:scale-100 flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {pairRestrictions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nog geen koppelverboden ingesteld</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pairRestrictions.map(restriction => {
                    const sA = findStudent(restriction.student_id_a);
                    const sB = findStudent(restriction.student_id_b);
                    if (!sA && !sB) return null;
                    const nameA = sA ? `${sA.first_name} ${sA.last_name}` : 'Onbekende leerling';
                    const nameB = sB ? `${sB.first_name} ${sB.last_name}` : 'Onbekende leerling';
                    return (
                      <div key={restriction.id} className="flex items-center gap-3 bg-red-50 border-2 border-red-100 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {sA && <StudentChip student={sA} />}
                          <span className="text-sm font-medium text-gray-700 truncate">{nameA}</span>
                          <span className="text-xs text-red-400 font-bold flex-shrink-0">+ niet met</span>
                          {sB && <StudentChip student={sB} />}
                          <span className="text-sm font-medium text-gray-700 truncate">{nameB}</span>
                        </div>
                        <button onClick={() => removePairRestriction(restriction.id)} className="p-1.5 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Scope toggle — only visible when inside an active board */}
              {hasBoardContext && (
                <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl">
                  <button
                    onClick={() => setBlockScope('all')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                      blockScope === 'all' ? 'bg-white shadow text-deep-purple' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Alle borden
                    {presetBlocks.length > 0 && (
                      <span className="bg-deep-purple/10 text-deep-purple text-[10px] px-1.5 py-0.5 rounded-full">{presetBlocks.length}</span>
                    )}
                  </button>
                  <button
                    onClick={() => setBlockScope('this')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                      blockScope === 'this' ? 'bg-white shadow text-deep-purple' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Layout className="w-3.5 h-3.5" />
                    Dit bord
                    {optionBlocks.length > 0 && (
                      <span className="bg-deep-purple/10 text-deep-purple text-[10px] px-1.5 py-0.5 rounded-full">{optionBlocks.length}</span>
                    )}
                  </button>
                </div>
              )}

              {blockScope === 'all' ? (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-700 leading-relaxed">
                    Geldt voor <strong>alle keuzeborden</strong> van deze groep. Kies een activiteitstype (preset).
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                    <p className="text-sm font-semibold text-gray-700">Voeg blokkade toe (alle borden)</p>
                    <div className="flex gap-2">
                      <select
                        value={newBlockPreset}
                        onChange={e => { setNewBlockPreset(e.target.value); setNewBlockStudentAll(''); }}
                        className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-deep-purple focus:outline-none"
                      >
                        <option value="">Activiteitstype</option>
                        {presets.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <select
                        value={newBlockStudentAll}
                        onChange={e => setNewBlockStudentAll(e.target.value)}
                        disabled={!newBlockPreset}
                        className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-deep-purple focus:outline-none disabled:opacity-50"
                      >
                        <option value="">Leerling</option>
                        {students
                          .filter(s => !presetBlocks.find(b => b.activity_preset_id === newBlockPreset && b.student_id === s.id))
                          .map(s => (
                            <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                          ))}
                      </select>
                      <button
                        onClick={addPresetBlock}
                        disabled={!newBlockPreset || !newBlockStudentAll || savingBlockAll}
                        className="px-4 py-2 bg-deep-purple text-white rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-40 disabled:scale-100 flex-shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {presetBlocksGrouped.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Globe className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Nog geen groepsbrede blokkades</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {presetBlocksGrouped.map(({ preset, blocks }) => (
                        <div key={preset.id}>
                          <div
                            className="flex items-center gap-2 px-3 py-1.5 rounded-t-xl text-white text-sm font-semibold"
                            style={{ backgroundColor: preset.color }}
                          >
                            <div className="w-2 h-2 rounded-full bg-white/50" />
                            {preset.name}
                            <span className="ml-auto text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">alle borden</span>
                          </div>
                          <div className="border-2 border-t-0 rounded-b-xl overflow-hidden divide-y divide-gray-100" style={{ borderColor: preset.color }}>
                            {blocks.map(block => {
                              const student = findStudent(block.student_id);
                              const name = student ? `${student.first_name} ${student.last_name}` : 'Onbekende leerling';
                              return (
                                <div key={block.id} className="flex items-center gap-3 px-4 py-2.5 bg-white">
                                  {student && <StudentChip student={student} />}
                                  <span className="text-sm font-medium text-gray-700 flex-1">{name}</span>
                                  <button onClick={() => removeActivityBlock(block.id)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="bg-sky-50 border border-sky-200 rounded-xl px-3 py-2.5 text-xs text-sky-700 leading-relaxed">
                    Geldt alleen voor <strong>dit specifieke bord</strong>. Kies een activiteit uit het huidige bord.
                  </div>

                  {activities.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Layout className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Dit bord heeft nog geen activiteiten</p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                        <p className="text-sm font-semibold text-gray-700">Voeg blokkade toe (dit bord)</p>
                        <div className="flex gap-2">
                          <select
                            value={newBlockActivity}
                            onChange={e => { setNewBlockActivity(e.target.value); setNewBlockStudent(''); }}
                            className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-deep-purple focus:outline-none"
                          >
                            <option value="">Activiteit</option>
                            {activities.map(a => (
                              <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                          </select>
                          <select
                            value={newBlockStudent}
                            onChange={e => setNewBlockStudent(e.target.value)}
                            disabled={!newBlockActivity}
                            className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-deep-purple focus:outline-none disabled:opacity-50"
                          >
                            <option value="">Leerling</option>
                            {students
                              .filter(s => !optionBlocks.find(b => b.activity_option_id === newBlockActivity && b.student_id === s.id))
                              .map(s => (
                                <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                              ))}
                          </select>
                          <button
                            onClick={addActivityBlock}
                            disabled={!newBlockActivity || !newBlockStudent || savingBlock}
                            className="px-4 py-2 bg-deep-purple text-white rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-40 disabled:scale-100 flex-shrink-0"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {optionBlocksGrouped.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <UserX className="w-10 h-10 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">Nog geen bord-specifieke blokkades</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {optionBlocksGrouped.map(({ activity, blocks }) => (
                            <div key={activity.id}>
                              <div
                                className="flex items-center gap-2 px-3 py-1.5 rounded-t-xl text-white text-sm font-semibold"
                                style={{ backgroundColor: activity.color ?? '#6B7280' }}
                              >
                                <div className="w-2 h-2 rounded-full bg-white/50" />
                                {activity.name}
                              </div>
                              <div className="border-2 border-t-0 rounded-b-xl overflow-hidden divide-y divide-gray-100" style={{ borderColor: activity.color ?? '#6B7280' }}>
                                {blocks.map(block => {
                                  const student = findStudent(block.student_id);
                                  const name = student ? `${student.first_name} ${student.last_name}` : 'Onbekende leerling';
                                  return (
                                    <div key={block.id} className="flex items-center gap-3 px-4 py-2.5 bg-white">
                                      {student && <StudentChip student={student} />}
                                      <span className="text-sm font-medium text-gray-700 flex-1">{name}</span>
                                      <button onClick={() => removeActivityBlock(block.id)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
