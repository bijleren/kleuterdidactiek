import { useState, useEffect } from 'react';
import DoelChips from './DoelChips';
import { supabase } from '../lib/supabase';
import DoelSelector from './DoelSelector';
import { Video, Plus, Play, CheckCircle, Trash2, X, Search, CreditCard as Edit } from 'lucide-react';
import Modal from './Modal';
import { logActivityToCalendar } from '../utils/calendarLogger';
import { getVideoEmbed } from '../utils/videoEmbed';

interface VocabWord {
  word: string;
  category_id: string;
  category_name: string;
  category_emoji: string;
}

interface EducationalVideo {
  id: string;
  title: string;
  description: string | null;
  url: string;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  is_global: boolean;
  group_id: string | null;
  school_id: string | null;
  created_at: string;
  goal_codes?: string[];
  vocab_words?: string[];
  session_count?: number;
}

interface VideosManagerProps {
  groupId: string;
  schoolId: string;
  goalFilter?: string;
}

/*
  Drie herkomsten in de bibliotheek:
  - bijleren : van het platform, voor iedereen
  - school   : door een collega toegevoegd voor de hele school
  - klas     : door iemand toegevoegd voor deze klas

  Ordening, geen afscherming: de RLS laat schoolleden alles van hun school
  lezen. Klasinhoud staat gewoon niet in de lijst van een andere klas.
*/
type Bron = 'bijleren' | 'school' | 'klas';

export default function VideosManager({ groupId, schoolId: propSchoolId, goalFilter }: VideosManagerProps) {
  const [videos, setVideos] = useState<EducationalVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<EducationalVideo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [bron, setBron] = useState<Bron | 'alle'>('alle');
  /* Waar nieuwe inhoud terechtkomt: bij deze klas of bij de hele school. */
  const [nieuwVoor, setNieuwVoor] = useState<'klas' | 'school'>('klas');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    duration_minutes: '',
    goal_codes: [] as string[],
    vocab_words: [] as string[],
  });
  const [vocabInput, setVocabInput] = useState('');
  const [availableVocab, setAvailableVocab] = useState<VocabWord[]>([]);
  const [showVocabSuggestions, setShowVocabSuggestions] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesVideoId, setNotesVideoId] = useState<string | null>(null);
  const [practiceNotes, setPracticeNotes] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<{ id: string; isGlobal: boolean } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadSchoolId();
  }, [groupId]);

  useEffect(() => {
    if (schoolId) {
      loadVideos();
      checkAdminStatus();
    }
  }, [schoolId]);

  useEffect(() => {
    if (showAddModal) {
      loadAvailableVocab();
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

  const checkAdminStatus = async () => {
    if (!schoolId) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('school_teammembers')
        .select('role')
        .eq('user_id', user.id)
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .maybeSingle();

      setIsAdmin(data?.role === 'admin');
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const loadVideos = async () => {
    if (!schoolId) return;

    try {
      const { data: videosData, error: videosError } = await supabase
        .from('educational_videos')
        .select('*')
        .or(`is_global.eq.true,school_id.eq.${schoolId}`)
        .order('created_at', { ascending: false });

      if (videosError) throw videosError;

      const videoIds = videosData?.map((v) => v.id) || [];

      const [goalsData, vocabData, sessionsData] = await Promise.all([
        supabase
          .from('educational_video_goals')
          .select('video_id, goal_code')
          .in('video_id', videoIds),
        supabase
          .from('educational_video_vocabulary')
          .select('video_id, word')
          .in('video_id', videoIds),
        supabase
          .from('educational_video_sessions')
          .select('video_id')
          .in('video_id', videoIds)
          .eq('group_id', groupId),
      ]);

      const goalsMap = new Map<string, string[]>();
      goalsData.data?.forEach((g) => {
        if (!goalsMap.has(g.video_id)) {
          goalsMap.set(g.video_id, []);
        }
        goalsMap.get(g.video_id)!.push(g.goal_code);
      });

      const vocabMap = new Map<string, string[]>();
      vocabData.data?.forEach((v) => {
        if (!vocabMap.has(v.video_id)) {
          vocabMap.set(v.video_id, []);
        }
        vocabMap.get(v.video_id)!.push(v.word);
      });

      const sessionsMap = new Map<string, number>();
      sessionsData.data?.forEach((s) => {
        sessionsMap.set(s.video_id, (sessionsMap.get(s.video_id) || 0) + 1);
      });

      const enrichedVideos: EducationalVideo[] = (videosData || []).map((v) => ({
        ...v,
        goal_codes: goalsMap.get(v.id) || [],
        vocab_words: vocabMap.get(v.id) || [],
        session_count: sessionsMap.get(v.id) || 0,
      }));

      setVideos(enrichedVideos);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };


  const loadAvailableVocab = async () => {
    try {
      const [catRes, wordsRes] = await Promise.all([
        supabase.from('vocabulary_categories').select('id, name, emoji').eq('is_active', true).order('sort_order'),
        supabase.from('vocabulary_words').select('word, category_id').eq('is_active', true).order('sort_order'),
      ]);

      if (catRes.error) throw catRes.error;
      if (wordsRes.error) throw wordsRes.error;

      const catMap = new Map<string, { name: string; emoji: string }>();
      (catRes.data || []).forEach((c) => catMap.set(c.id, { name: c.name, emoji: c.emoji || '' }));

      let customWords: Array<{ word: string; category_id: string }> = [];
      if (schoolId) {
        const { data, error } = await supabase
          .from('custom_vocabulary')
          .select('word, category_id')
          .eq('school_id', schoolId)
          .eq('is_deleted', false);
        if (!error && data) customWords = data;
      }

      const allWords: VocabWord[] = [
        ...(wordsRes.data || []).map((w) => {
          const cat = catMap.get(w.category_id);
          return {
            word: w.word,
            category_id: w.category_id,
            category_name: cat?.name || '',
            category_emoji: cat?.emoji || '',
          };
        }),
        ...customWords.map((w) => {
          const cat = catMap.get(w.category_id);
          return {
            word: w.word,
            category_id: w.category_id,
            category_name: cat?.name || '',
            category_emoji: cat?.emoji || '',
          };
        }),
      ];

      const seen = new Set<string>();
      const deduped = allWords.filter((w) => {
        const key = w.word.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setAvailableVocab(deduped);
    } catch (error) {
      console.error('Error loading vocabulary:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (editingVideoId) {
        const videoData = {
          title: formData.title,
          description: formData.description || null,
          url: formData.url,
          duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        };

        const { error: videoError } = await supabase
          .from('educational_videos')
          .update(videoData)
          .eq('id', editingVideoId);

        if (videoError) throw videoError;

        await supabase
          .from('educational_video_goals')
          .delete()
          .eq('video_id', editingVideoId);

        if (formData.goal_codes.length > 0) {
          const goalsToInsert = formData.goal_codes.map((code) => ({
            video_id: editingVideoId,
            goal_code: code,
          }));

          const { error: goalsError } = await supabase
            .from('educational_video_goals')
            .insert(goalsToInsert);

          if (goalsError) throw goalsError;
        }

        await supabase
          .from('educational_video_vocabulary')
          .delete()
          .eq('video_id', editingVideoId);

        if (formData.vocab_words.length > 0) {
          const vocabToInsert = formData.vocab_words.map((word) => {
            const match = availableVocab.find((v) => v.word === word);
            return {
              video_id: editingVideoId,
              word,
              category_id: match?.category_id || null,
            };
          });

          const { error: vocabError } = await supabase
            .from('educational_video_vocabulary')
            .insert(vocabToInsert);

          if (vocabError) throw vocabError;
        }
      } else {
        const videoData = {
          title: formData.title,
          description: formData.description || null,
          url: formData.url,
          duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
          is_global: false,
          school_id: schoolId,
          group_id: nieuwVoor === 'klas' ? groupId : null,
          created_by: user.id,
        };

        const { data: video, error: videoError } = await supabase
          .from('educational_videos')
          .insert(videoData)
          .select()
          .single();

        if (videoError) throw videoError;

        if (formData.goal_codes.length > 0) {
          const goalsToInsert = formData.goal_codes.map((code) => ({
            video_id: video.id,
            goal_code: code,
          }));

          const { error: goalsError } = await supabase
            .from('educational_video_goals')
            .insert(goalsToInsert);

          if (goalsError) throw goalsError;
        }

        if (formData.vocab_words.length > 0) {
          const vocabToInsert = formData.vocab_words.map((word) => {
            const match = availableVocab.find((v) => v.word === word);
            return {
              video_id: video.id,
              word,
              category_id: match?.category_id || null,
            };
          });

          const { error: vocabError } = await supabase
            .from('educational_video_vocabulary')
            .insert(vocabToInsert);

          if (vocabError) throw vocabError;
        }
      }

      await loadVideos();
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving video:', error);
      alert('Er is een fout opgetreden bij het opslaan van de video.');
    }
  };

  const handleDelete = (videoId: string, isGlobal: boolean) => {
    if (isGlobal) {
      alert('Admin video\'s kunnen niet worden verwijderd.');
      return;
    }

    setVideoToDelete({ id: videoId, isGlobal });
    setShowDeleteModal(true);
  };

  const confirmDeleteVideo = async () => {
    if (!videoToDelete) return;

    try {
      const { error } = await supabase
        .from('educational_videos')
        .delete()
        .eq('id', videoToDelete.id);

      if (error) throw error;

      await loadVideos();
      setShowDeleteModal(false);
      setVideoToDelete(null);
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Er is een fout opgetreden bij het verwijderen van de video.');
    }
  };

  const handleLogPractice = (videoId: string) => {
    setNotesVideoId(videoId);
    setPracticeNotes('');
    setShowNotesModal(true);
  };

  const submitLogPractice = async () => {
    if (!notesVideoId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const video = videos.find(v => v.id === notesVideoId);

      const { error } = await supabase
        .from('educational_video_sessions')
        .insert({
          video_id: notesVideoId,
          group_id: groupId,
          notes: practiceNotes.trim() || null,
          created_by: user.id,
        });

      if (error) throw error;

      if (video && propSchoolId) {
        await logActivityToCalendar({
          itemType: 'video',
          itemId: video.id,
          itemName: video.title,
          groupId,
          schoolId: propSchoolId,
          userId: user.id,
          durationMinutes: video.duration_minutes || 15,
        });
      }

      await loadVideos();
      setShowNotesModal(false);
      setNotesVideoId(null);
      setPracticeNotes('');
    } catch (error) {
      console.error('Error logging practice:', error);
      alert('Er is een fout opgetreden bij het loggen van de oefensessie.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      url: '',
      duration_minutes: '',
      goal_codes: [],
      vocab_words: [],
    });
    setVocabInput('');
    setShowVocabSuggestions(false);
    setEditingVideoId(null);
  };

  const handleEdit = (video: EducationalVideo) => {
    if (video.is_global) {
      alert('Admin video\'s kunnen niet worden bewerkt.');
      return;
    }

    setFormData({
      title: video.title,
      description: video.description || '',
      url: video.url,
      duration_minutes: video.duration_minutes ? video.duration_minutes.toString() : '',
      goal_codes: video.goal_codes || [],
      vocab_words: video.vocab_words || [],
    });
    setEditingVideoId(video.id);
    setShowAddModal(true);
  };

  const filteredVideos = videos.filter((video) => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (video.description && video.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (bron !== 'alle') {
      const herkomst: Bron = video.is_global ? 'bijleren' : video.group_id ? 'klas' : 'school';
      if (herkomst !== bron) return false;
    }

    if (goalFilter && video.goal_codes) {
      return video.goal_codes.includes(goalFilter);
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">Laden...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-baloo text-deep-purple flex items-center gap-2">
              <Video className="w-5 h-5 sm:w-6 sm:h-6" />
              Educatieve Video's
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Video's gekoppeld aan kleuterdoelen
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-deep-purple text-white rounded-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Video Toevoegen</span>
          </button>
        </div>

        {/* Herkomst van de inhoud: van Bijleren, van de school of van deze klas. */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {([
            ['alle', 'Alles'],
            ['bijleren', 'Van Bijleren'],
            ['school', 'Van de school'],
            ['klas', 'Van deze klas'],
          ] as [Bron | 'alle', string][]).map(([id, label]) => {
            const aantal = id === 'alle'
              ? videos.length
              : videos.filter((x) => (x.is_global ? 'bijleren' : x.group_id ? 'klas' : 'school') === id).length;
            return (
              <button
                key={id}
                onClick={() => setBron(id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  bron === id
                    ? 'bg-deep-purple text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label} <span className="opacity-70">({aantal})</span>
              </button>
            );
          })}
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Zoek video's..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-sky-blue text-sm sm:text-base"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos.map((video) => {
            const embed = getVideoEmbed(video.url);
            const thumbnailUrl = embed.thumbnailUrl || video.thumbnail_url || '';

            return (
              <div
                key={video.id}
                className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div
                  className="relative h-40 bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setSelectedVideo(video);
                    setShowVideoModal(true);
                  }}
                >
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Video className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center">
                    <Play className="w-12 h-12 text-white opacity-0 hover:opacity-100 transition-opacity" />
                  </div>
                  {video.is_global && (
                    <div className="absolute top-2 right-2 bg-sunny-yellow text-white px-2 py-1 rounded-full text-xs font-semibold">
                      Globaal
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h4 className="font-baloo text-lg text-deep-purple mb-2">{video.title}</h4>
                  {video.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{video.description}</p>
                  )}

                  {video.goal_codes && video.goal_codes.length > 0 && (
                    <div className="mb-2">
                      <DoelChips codes={video.goal_codes} max={3} klein />
                    </div>
                  )}

                  {video.vocab_words && video.vocab_words.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {video.vocab_words.slice(0, 4).map((word) => (
                        <span
                          key={word}
                          className="text-xs px-2 py-1 bg-coral-pink/10 text-coral-pink rounded-full"
                        >
                          {word}
                        </span>
                      ))}
                      {video.vocab_words.length > 4 && (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                          +{video.vocab_words.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLogPractice(video.id)}
                        className="px-3 py-1.5 bg-grass-green text-white rounded-lg text-sm font-semibold hover:scale-105 transition-transform flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span>Gebruikt in de les</span>
                      </button>
                      {video.session_count && video.session_count > 0 && (
                        <span className="text-xs text-gray-500">{video.session_count}x</span>
                      )}
                    </div>

                    {!video.is_global && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(video)}
                          className="p-1.5 text-sky-blue hover:bg-sky-blue/10 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(video.id, video.is_global)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredVideos.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Video className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>Geen video's gevonden.</p>
            <p className="text-sm mt-2">Voeg een video toe om te beginnen!</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
      >
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-baloo text-deep-purple mb-4">
              {editingVideoId ? 'Video Bewerken' : 'Video Toevoegen'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Titel *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-sky-blue"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Beschrijving
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-sky-blue"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Video URL * (YouTube, Vimeo, etc.)
                </label>
                <input
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-sky-blue"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Duur (minuten)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-sky-blue"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Zichtbaar voor
                </label>
                <div className="flex gap-2">
                  {([
                    ['klas', 'Alleen deze klas'],
                    ['school', 'De hele school'],
                  ] as ['klas' | 'school', string][]).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setNieuwVoor(id)}
                      className={`flex-1 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-colors ${
                        nieuwVoor === id
                          ? 'bg-deep-purple text-white border-deep-purple'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Collega's van andere klassen zien alleen wat voor de hele school staat.
                </p>
              </div>

              <DoelSelector
                waarde={formData.goal_codes}
                onChange={(codes) => setFormData({ ...formData, goal_codes: codes })}
              />

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Woordenschat
                </label>
                {!isAdmin ? (
                  <p className="text-xs text-gray-500 italic">
                    Alleen admins kunnen woordenschat koppelen aan video's.
                  </p>
                ) : (
                <div className="relative">
                  <div className="border-2 border-gray-200 rounded-xl p-3 focus-within:border-deep-purple transition-colors">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.vocab_words.map((word) => (
                        <span
                          key={word}
                          className="inline-flex items-center gap-1 bg-coral-pink text-white px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {word}
                          <button
                            onClick={() => {
                              setFormData({
                                ...formData,
                                vocab_words: formData.vocab_words.filter((w) => w !== word),
                              });
                            }}
                            className="hover:bg-white hover:bg-opacity-20 rounded-full p-0.5 transition-colors"
                            type="button"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={vocabInput}
                      onChange={(e) => {
                        setVocabInput(e.target.value);
                        setShowVocabSuggestions(true);
                      }}
                      onFocus={() => setShowVocabSuggestions(true)}
                      onBlur={() => {
                        setTimeout(() => setShowVocabSuggestions(false), 200);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          const trimmed = vocabInput.trim();
                          if (trimmed && !formData.vocab_words.includes(trimmed)) {
                            setFormData({
                              ...formData,
                              vocab_words: [...formData.vocab_words, trimmed],
                            });
                            setVocabInput('');
                            setShowVocabSuggestions(false);
                          }
                        } else if (e.key === 'Backspace' && vocabInput === '' && formData.vocab_words.length > 0) {
                          setFormData({
                            ...formData,
                            vocab_words: formData.vocab_words.slice(0, -1),
                          });
                        } else if (e.key === 'Escape') {
                          setShowVocabSuggestions(false);
                        }
                      }}
                      placeholder={formData.vocab_words.length === 0 ? "Type een woord en druk op Enter..." : "Type om meer woorden toe te voegen..."}
                      className="w-full outline-none text-sm"
                    />
                  </div>
                  {showVocabSuggestions && (
                    <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {availableVocab
                        .filter(
                          (w) =>
                            (vocabInput === '' ||
                              w.word.toLowerCase().includes(vocabInput.toLowerCase())) &&
                            !formData.vocab_words.includes(w.word)
                        )
                        .slice(0, 50)
                        .map((w) => (
                          <button
                            key={w.word}
                            type="button"
                            onClick={() => {
                              if (!formData.vocab_words.includes(w.word)) {
                                setFormData({
                                  ...formData,
                                  vocab_words: [...formData.vocab_words, w.word],
                                });
                                setVocabInput('');
                                setShowVocabSuggestions(false);
                              }
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-semibold text-deep-purple">{w.word}</div>
                            {w.category_name && (
                              <div className="text-xs text-gray-500">{w.category_emoji} {w.category_name}</div>
                            )}
                          </button>
                        ))}
                      {vocabInput && availableVocab.filter(
                        (w) =>
                          w.word.toLowerCase().includes(vocabInput.toLowerCase()) &&
                          !formData.vocab_words.includes(w.word)
                      ).length === 0 && (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          Geen woord gevonden. Druk op Enter om "{vocabInput}" toe te voegen.
                        </div>
                      )}
                    </div>
                  )}
                </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Type een woord en druk op Enter om toe te voegen, of selecteer uit de woordenschatlijst
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-grass-green text-white rounded-xl font-semibold hover:scale-105 transition-transform"
                >
                  {editingVideoId ? 'Video Opslaan' : 'Video Toevoegen'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Annuleren
                </button>
              </div>
            </form>
          </div>
        </Modal>

      <Modal
        isOpen={showVideoModal && selectedVideo !== null}
        onClose={() => {
          setShowVideoModal(false);
          setSelectedVideo(null);
        }}
      >
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {selectedVideo && (
              <>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-2xl font-baloo text-deep-purple">{selectedVideo.title}</h3>
              <button
                onClick={() => {
                  setShowVideoModal(false);
                  setSelectedVideo(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const embed = getVideoEmbed(selectedVideo.url);
              if (embed.embedUrl) {
                return (
                  <div className="aspect-video mb-4 rounded-xl overflow-hidden">
                    <iframe
                      src={embed.embedUrl}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                );
              }
              return (
                <div className="aspect-video mb-4 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                  <a
                    href={selectedVideo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-deep-purple text-white rounded-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Open Video
                  </a>
                </div>
              );
            })()}

            {selectedVideo.description && (
              <p className="text-gray-700 mb-4">{selectedVideo.description}</p>
            )}

            {selectedVideo.goal_codes && selectedVideo.goal_codes.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Gekoppelde doelen:</h4>
                <DoelChips codes={selectedVideo.goal_codes} />
              </div>
            )}

            {selectedVideo.vocab_words && selectedVideo.vocab_words.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Gekoppelde woordenschat:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedVideo.vocab_words.map((word) => (
                    <span
                      key={word}
                      className="px-3 py-1 bg-coral-pink/10 text-coral-pink rounded-full text-sm font-semibold"
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                handleLogPractice(selectedVideo.id);
                setShowVideoModal(false);
                setSelectedVideo(null);
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
          setNotesVideoId(null);
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
                setNotesVideoId(null);
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
          setVideoToDelete(null);
        }}
        title="Video verwijderen"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Weet je zeker dat je deze video wilt verwijderen? Deze actie kan niet ongedaan gemaakt worden.
          </p>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setVideoToDelete(null);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={confirmDeleteVideo}
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
