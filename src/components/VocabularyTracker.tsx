import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Plus, Trash2, X, FileDown, Eye, Volume2, BookOpen, Image, ChevronLeft, ChevronRight, Play, Video, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSchool } from '../contexts/SchoolContext';
import { logActivityToCalendar } from '../utils/calendarLogger';
import { exportVocabularyToPDF } from '../utils/vocabularyPdfExport';
import { getVideoEmbed } from '../utils/videoEmbed';
import NetLeeftijdFilter from './NetLeeftijdFilter';
import DoelSelector from './DoelSelector';
import DoelenPerNetModal from './DoelenPerNetModal';
import { WoordNetBadges } from './NetBadges';
import {
  NET_CODES,
  NET_LABELS,
  OVSG_GROEP_LABELS,
  loadWoordNetInfo,
  type NetCode,
  type WoordNetInfo,
} from '../lib/leerplandoelen';
import { useKlasFilter } from '../hooks/useKlasFilter';

interface VocabularyTrackerProps {
  groupId: string;
  schoolId: string;
  goalFilter?: string;
}

interface WordClickCount {
  [word: string]: number;
}

interface Word {
  word: string;
  goals: string[];
  isCustom?: boolean;
  customId?: string;
}

interface VocabularyCategory {
  id: string;
  /** Eigen categorie van de school, aangemaakt door een leerkracht. */
  isCustom?: boolean;
  /** Alleen gevuld bij een eigen categorie die tot één klas beperkt is. */
  groupId?: string | null;
  title: string;
  icon: string;
  categoryType: string;
  goalCodes: string;
  description: string;
  colorCode: string;
  words: Word[];
}

interface LinkedVideo {
  id: string;
  title: string;
  url: string;
  thumbnail_url: string | null;
}

interface WordImage {
  type: string;
  url: string;
  label: string | null;
}

const IMAGE_TYPE_LABELS: Record<string, string> = {
  isolated: 'Geïsoleerd',
  context: 'In context',
  general: 'Algemeen',
};

const categoryColors: Record<string, string> = {
  location: 'border-t-coral-pink',
  nature: 'border-t-grass-green',
  geography: 'border-t-sky-blue',
  body: 'border-t-soft-orange',
  math: 'border-t-lavender',
  time: 'border-t-sunny-yellow',
  animals: 'border-t-grass-green',
  art: 'border-t-lavender',
  writing: 'border-t-sky-blue',
};

type TimeFilter = 'all' | 'today' | 'hour';

export default function VocabularyTracker({ groupId, schoolId, goalFilter }: VocabularyTrackerProps) {
  const { user } = useAuth();
  const { selectedSchool } = useSchool();
  const [clickCounts, setClickCounts] = useState<WordClickCount>({});
  const [categories, setCategories] = useState<VocabularyCategory[]>([]);
  const [doelenMode, setDoelenMode] = useState(false);
  const [doelenVoorWoord, setDoelenVoorWoord] = useState<{ woord: string; codes: string[] } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('📚');
  const [newCategoryGoals, setNewCategoryGoals] = useState<string[]>([]);
  const [newCategoryOnlyGroup, setNewCategoryOnlyGroup] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<VocabularyCategory | null>(null);
  const [newWord, setNewWord] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [systemWords, setSystemWords] = useState<string[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ wordId: string; wordText: string } | null>(null);
  const [groupName, setGroupName] = useState<string>('');
  const [deleteMode, setDeleteMode] = useState(false);
  const [showDeleteInstructions, setShowDeleteInstructions] = useState(false);
  const [meaningMode, setMeaningMode] = useState(false);
  const [wordsWithImages, setWordsWithImages] = useState<Set<string>>(new Set());
  const [meaningModal, setMeaningModal] = useState<{
    word: string;
    audioFile: string | null;
    imageFile: string | null;
    wordImages: WordImage[];
    phonemes: { title: string; audio: string }[];
    videos: LinkedVideo[];
  } | null>(null);
  const [activeVideo, setActiveVideo] = useState<LinkedVideo | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [woordNetInfo, setWoordNetInfo] = useState<Map<string, WoordNetInfo>>(new Map());
  const {
    net: netFilter,
    leeftijd: leeftijdFilter,
    kiesNet,
    kiesLeeftijd,
    ovsgGroep,
    kiesOvsgGroep,
    toonAlles,
    setToonAlles,
    klasFilterActief,
    klasOmschrijving,
  } = useKlasFilter();
  const [toonAlleWoorden, setToonAlleWoorden] = useState(false);

  useEffect(() => {
    loadWoordNetInfo().then(setWoordNetInfo);
  }, []);

  /** Hoort dit woord bij het gekozen net en de gekozen leeftijdsgroep? */
  const woordVoldoet = (woord: string): boolean => {
    if (netFilter === 'all' && leeftijdFilter === 'all' && ovsgGroep === 'all') return true;
    const info = woordNetInfo.get(woord.toLowerCase());
    if (!info) return false;
    const netten: NetCode[] = netFilter === 'all' ? NET_CODES : [netFilter];
    return netten.some((n) => {
      const per = info.perNet[n];
      if (!per || per.leeftijden.length === 0) return false;
      /* Bij OVSG filteren we op hun eigen leerjaar in plaats van op de band. */
      if (n === 'OVSG' && ovsgGroep !== 'all') {
        return per.ovsgGroepen.includes(ovsgGroep);
      }
      return leeftijdFilter === 'all' || per.leeftijden.includes(leeftijdFilter);
    });
  };

  const filterActief = netFilter !== 'all' || leeftijdFilter !== 'all' || ovsgGroep !== 'all';
  const [directVideoUrl, setDirectVideoUrl] = useState('');
  const [directVideoTitle, setDirectVideoTitle] = useState('');
  const [addingVideo, setAddingVideo] = useState(false);
  const [isPlayingWord, setIsPlayingWord] = useState(false);
  const [isPlayingKlankteken, setIsPlayingKlankteken] = useState(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (groupId) {
      loadVocabularyData();
      loadClickCounts();
      loadGroupName();
    }
  }, [groupId, timeFilter]);

  useEffect(() => {
    loadWordsWithImages();
    checkAdminStatus();
  }, []);

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

  useEffect(() => {
    if (showAddModal) {
    }
  }, [showAddModal]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Close lightbox on Escape, navigate with arrow keys
  useEffect(() => {
    if (lightboxIndex === null) return;
    const allImages = getAllModalImages();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') setLightboxIndex((i) => i !== null ? Math.min(i + 1, allImages.length - 1) : null);
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => i !== null ? Math.max(i - 1, 0) : null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex, meaningModal]);

  const loadGroupName = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('name')
        .eq('id', groupId)
        .single();

      if (error) throw error;
      setGroupName(data?.name || 'Onbekende groep');
    } catch (error) {
      console.error('Error loading group name:', error);
      setGroupName('Onbekende groep');
    }
  };


  const loadWordsWithImages = async () => {
    try {
      const { data } = await supabase
        .from('kleuter_word_images')
        .select('word')
        .eq('is_active', true);

      if (data) {
        setWordsWithImages(new Set(data.map((r) => r.word)));
      }
    } catch (error) {
      console.error('Error loading words with images:', error);
    }
  };

  const loadVocabularyData = async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('vocabulary_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (categoriesError) throw categoriesError;

      const { data: wordsData, error: wordsError } = await supabase
        .from('vocabulary_words')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (wordsError) throw wordsError;

      const systemWordsList = wordsData?.map((w) => w.word.toLowerCase()) || [];
      setSystemWords(systemWordsList);

      let customWordsData = [];
      let customCategoriesData: any[] = [];
      if (selectedSchool?.id) {
        const { data, error: customWordsError } = await supabase
          .from('custom_vocabulary')
          .select('*')
          .eq('school_id', selectedSchool.id)
          .eq('is_deleted', false);

        if (customWordsError) throw customWordsError;
        customWordsData = data || [];

        /*
          Eigen categorieën van de school: die van de hele school plus die van
          deze klas. Categorieën van een andere klas blijven buiten beeld.
        */
        const { data: eigenCategorieen, error: eigenError } = await supabase
          .from('custom_vocabulary_categories')
          .select('*')
          .eq('school_id', selectedSchool.id)
          .eq('is_deleted', false)
          .or(`group_id.is.null,group_id.eq.${groupId}`)
          .order('created_at');

        /*
          Eigen categorieën zijn een aanvulling: gaat dit mis, dan blijft de
          woordenlijst zelf gewoon staan. Zonder deze afhandeling verdween bij
          een fout de hele lijst en las de leerkracht "geen woorden gevonden".
        */
        if (eigenError) {
          console.error('Eigen categorieën laden mislukt:', eigenError);
        }
        customCategoriesData = eigenCategorieen || [];
      }

      const formattedCategories: VocabularyCategory[] = categoriesData?.map((cat) => ({
        id: cat.id,
        title: cat.name,
        icon: cat.emoji,
        categoryType: cat.category_type,
        goalCodes: cat.goal_codes.join(', '),
        description: cat.goal_description,
        colorCode: cat.color_code || '#9CA3AF',
        words: [
          ...(wordsData
            ?.filter((w) => w.category_id === cat.id)
            .map((w) => ({
              word: w.word,
              goals: w.goal_codes,
              isCustom: false,
            })) || []),
          ...customWordsData
            .filter((w: any) => w.category_id === cat.id)
            .map((w: any) => ({
              word: w.word,
              goals: w.goal_codes,
              isCustom: true,
              customId: w.id,
            })),
        ],
      })) || [];

      const eigenCategorieen: VocabularyCategory[] = customCategoriesData.map((cat: any) => ({
        id: cat.id,
        isCustom: true,
        groupId: cat.group_id,
        title: cat.name,
        icon: cat.emoji,
        categoryType: 'custom',
        goalCodes: (cat.goal_codes || []).join(', '),
        description: cat.group_id ? 'Eigen categorie van deze klas' : 'Eigen categorie van de school',
        colorCode: cat.color_code || '#9CA3AF',
        words: customWordsData
          .filter((w: any) => w.custom_category_id === cat.id)
          .map((w: any) => ({
            word: w.word,
            goals: w.goal_codes,
            isCustom: true,
            customId: w.id,
          })),
      }));

      setCategories([...formattedCategories, ...eigenCategorieen]);
    } catch (error) {
      console.error('Error loading vocabulary data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const loadClickCounts = async () => {
    if (!groupId) return;

    try {
      // Server-side tellen in plaats van elke logregel ophalen: het aantal
      // klikken groeit onbeperkt, het aantal woorden niet. Zonder dit loopt een
      // actieve groep na een paar schooljaren tegen de rijlimiet aan en vallen
      // de oudste klikken stil uit de tellers.
      let vanaf: string | null = null;
      if (timeFilter === 'today') {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        vanaf = startOfDay.toISOString();
      } else if (timeFilter === 'hour') {
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);
        vanaf = oneHourAgo.toISOString();
      }

      const { data, error } = await supabase.rpc('woord_klikken', {
        p_group_id: groupId,
        p_vanaf: vanaf,
      } as never);

      if (error) {
        console.error('Error loading click counts:', error);
        return;
      }

      const counts: WordClickCount = {};
      for (const r of (data ?? []) as unknown as { word: string; aantal: number }[]) {
        counts[r.word] = Number(r.aantal);
      }

      setClickCounts(counts);
    } catch (error) {
      console.error('Error loading click counts:', error);
    }
  };

  const handleWordClick = async (word: string, goalCodes: string[], categoryId?: string) => {
    if (!user) return;

    if (meaningMode) {
      await openMeaningModal(word);
      // fall through to also log the click
    }

    if (doelenMode) {
      /*
        Alleen tonen, niet loggen: dit is opzoekwerk van de leerkracht, geen
        oefenbeurt van een kind. De betekenismodus logt wel, want daar wordt
        het woord met de klas behandeld.
      */
      setDoelenVoorWoord({ woord: word, codes: goalCodes || [] });
      return;
    }

    if (deleteMode) {
      await handleDeleteWordClick(word);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('vocabulary_practice_log').insert({
        group_id: groupId,
        word: word,
        goal_codes: goalCodes,
        created_by: user.id,
      });

      if (error) throw error;

      setClickCounts((prev) => ({
        ...prev,
        [word]: (prev[word] || 0) + 1,
      }));

      let wordItemId = word;
      if (categoryId) {
        const { data: wordRecord } = await supabase
          .from('vocabulary_words')
          .select('id')
          .eq('word', word)
          .eq('category_id', categoryId)
          .maybeSingle();
        if (wordRecord?.id) wordItemId = wordRecord.id;
      }

      await logActivityToCalendar({
        itemType: 'vocabulary_word',
        itemId: wordItemId,
        itemName: `Woordenschat: ${word}`,
        groupId,
        schoolId,
        userId: user.id,
        durationMinutes: 5,
      });

      const { error: sessionError } = await supabase.from('goal_tracking_sessions').insert({
        group_id: groupId,
        goal_codes: goalCodes,
        activity_type: 'vocabulary',
        activity_name: `Woordenschat: ${word}`,
        repetitions: 1,
        created_by: user.id,
      });

      if (sessionError) throw sessionError;
    } catch (error) {
      console.error('Error logging word click:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWordClick = async (word: string) => {
    if (!user || !groupId) return;

    const currentCount = clickCounts[word] || 0;
    if (currentCount === 0) return;

    setLoading(true);
    try {
      let query = supabase
        .from('vocabulary_practice_log')
        .select('id, clicked_at')
        .eq('group_id', groupId)
        .eq('word', word);

      if (timeFilter === 'today') {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        query = query.gte('clicked_at', startOfDay.toISOString());
      } else if (timeFilter === 'hour') {
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);
        query = query.gte('clicked_at', oneHourAgo.toISOString());
      }

      const { data, error: fetchError } = await query
        .order('clicked_at', { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        const { error: deleteError } = await supabase
          .from('vocabulary_practice_log')
          .delete()
          .eq('id', data[0].id);

        if (deleteError) throw deleteError;

        setClickCounts((prev) => {
          const newCount = Math.max(0, (prev[word] || 0) - 1);
          if (newCount === 0) {
            const { [word]: _, ...rest } = prev;
            return rest;
          }
          return {
            ...prev,
            [word]: newCount,
          };
        });

        setNotification({ message: `Klik verwijderd voor "${word}"`, type: 'success' });
      }
    } catch (error) {
      console.error('Error deleting word click:', error);
      setNotification({ message: 'Fout bij verwijderen van klik', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const toggleDeleteMode = () => {
    if (!deleteMode) {
      setShowDeleteInstructions(true);
      setMeaningMode(false);
      setDoelenMode(false);
    }
    setDeleteMode(!deleteMode);
  };

  const toggleMeaningMode = () => {
    setMeaningMode((prev) => !prev);
    setDeleteMode(false);
    setDoelenMode(false);
  };

  const toggleDoelenMode = () => {
    setDoelenMode((prev) => !prev);
    setDeleteMode(false);
    setMeaningMode(false);
  };

  const stopCurrentAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setIsPlayingWord(false);
    setIsPlayingKlankteken(false);
  };

  const openMeaningModal = async (word: string) => {
    const { data } = await supabase
      .from('wordfrequency')
      .select('audio_file, image_file, klankteken')
      .eq('word', word)
      .maybeSingle();

    let phonemes: { title: string; audio: string }[] = [];

    if (data?.klankteken) {
      const tokens = data.klankteken.split('-').filter(Boolean);
      if (tokens.length > 0) {
        const { data: klankData } = await supabase
          .from('klankteken')
          .select('title, audio')
          .in('title', tokens);

        phonemes = tokens
          .map((token) => {
            const match = klankData?.find((k) => k.title === token);
            return match && match.audio ? { title: token, audio: match.audio } : null;
          })
          .filter(Boolean) as { title: string; audio: string }[];
      }
    }

    // Fetch images from kleuter_word_images
    const { data: imageRows } = await supabase
      .from('kleuter_word_images')
      .select('image_type, storage_path, label, sort_order')
      .eq('word', word)
      .eq('is_active', true)
      .order('image_type')
      .order('sort_order');

    const wordImages: WordImage[] = (imageRows || []).map((row) => ({
      type: row.image_type,
      url: supabase.storage.from('images_kleuter').getPublicUrl(row.storage_path).data.publicUrl,
      label: row.label,
    }));

    // Fetch linked videos (catalogue + direct URLs)
    let linkedVideos: LinkedVideo[] = [];
    const { data: vocabLinks } = await supabase
      .from('educational_video_vocabulary')
      .select('video_id, direct_url, direct_title')
      .eq('word', word);

    if (vocabLinks && vocabLinks.length > 0) {
      // Direct-URL links (no catalogue video)
      const directLinks = vocabLinks.filter((v) => !v.video_id && v.direct_url);
      linkedVideos.push(...directLinks.map((v) => ({
        id: `direct-${v.direct_url}`,
        title: v.direct_title || v.direct_url!,
        url: v.direct_url!,
        thumbnail_url: null,
      })));

      // Catalogue links
      const catalogueLinks = vocabLinks.filter((v) => v.video_id);
      if (catalogueLinks.length > 0) {
        const videoIds = catalogueLinks.map((v) => v.video_id);
        const { data: videoRows } = await supabase
          .from('educational_videos')
          .select('id, title, url, thumbnail_url, is_global, school_id')
          .in('id', videoIds)
          .eq('is_active', true);

        if (videoRows) {
          const schoolId = selectedSchool?.id;
          linkedVideos.push(...videoRows
            .filter((v) => v.is_global || (schoolId && v.school_id === schoolId))
            .map((v) => ({
              id: v.id,
              title: v.title,
              url: v.url,
              thumbnail_url: v.thumbnail_url,
            })));
        }
      }
    }

    setMeaningModal({
      word,
      audioFile: data?.audio_file || null,
      imageFile: data?.image_file && data.image_file !== 'NONE.png' ? data.image_file : null,
      wordImages,
      phonemes,
      videos: linkedVideos,
    });
  };

  const playWordAudio = (audioFile: string) => {
    stopCurrentAudio();
    const audio = new Audio(`https://woordenschat.be/audio/${audioFile}`);
    currentAudioRef.current = audio;
    setIsPlayingWord(true);
    audio.onended = () => {
      setIsPlayingWord(false);
      currentAudioRef.current = null;
    };
    audio.onerror = () => {
      setIsPlayingWord(false);
      currentAudioRef.current = null;
    };
    audio.play().catch(() => setIsPlayingWord(false));
  };

  const playKlanktekenAudio = (phonemes: { title: string; audio: string }[]) => {
    stopCurrentAudio();
    if (phonemes.length === 0) return;
    setIsPlayingKlankteken(true);

    const playNext = (index: number) => {
      if (index >= phonemes.length) {
        setIsPlayingKlankteken(false);
        currentAudioRef.current = null;
        return;
      }
      const audio = new Audio(phonemes[index].audio);
      currentAudioRef.current = audio;
      audio.onended = () => playNext(index + 1);
      audio.onerror = () => playNext(index + 1);
      audio.play().catch(() => playNext(index + 1));
    };

    playNext(0);
  };

  const closeMeaningModal = () => {
    stopCurrentAudio();
    setMeaningModal(null);
    setLightboxIndex(null);
    setActiveVideo(null);
  };

  // Build the full ordered image list shown in the modal (legacy + new)
  const getAllModalImages = useCallback((): { url: string; type: string; label: string | null }[] => {
    if (!meaningModal) return [];
    const legacy = meaningModal.imageFile
      ? [{ url: `https://woordenschat.be/img/${meaningModal.imageFile}`, type: 'general', label: null }]
      : [];
    return [...legacy, ...meaningModal.wordImages];
  }, [meaningModal]);

  const handleAddCustomWord = async () => {
    if (!user || !selectedSchool || !newWord.trim() || !selectedCategoryId || selectedGoals.length === 0) {
      setNotification({ message: 'Vul alle velden in en selecteer minimaal één doel.', type: 'error' });
      return;
    }

    const trimmedWord = newWord.trim();

    if (systemWords.includes(trimmedWord.toLowerCase())) {
      setNotification({ message: 'Dit woord bestaat al in de standaard woordenlijst en kan niet worden toegevoegd als aangepast woord.', type: 'error' });
      return;
    }

    try {
      const gekozenCategorie = categories.find((c) => c.id === selectedCategoryId);

      const { error } = await supabase.from('custom_vocabulary').insert({
        school_id: selectedSchool.id,
        word: trimmedWord,
        // Een woord hangt aan een systeemcategorie óf aan een eigen categorie.
        category_id: gekozenCategorie?.isCustom ? null : selectedCategoryId,
        custom_category_id: gekozenCategorie?.isCustom ? selectedCategoryId : null,
        goal_codes: selectedGoals,
        created_by: user.id,
      });

      if (error) {
        if (error.message.includes('duplicate') || error.code === '23505') {
          setNotification({ message: 'Dit woord bestaat al in uw aangepaste woordenlijst voor deze categorie.', type: 'error' });
        } else {
          throw error;
        }
        return;
      }

      setNewWord('');
      setSelectedCategoryId('');
      setSelectedGoals([]);
      setShowAddModal(false);
      setNotification({ message: 'Woord succesvol toegevoegd!', type: 'success' });
      loadVocabularyData();
    } catch (error) {
      console.error('Error adding custom word:', error);
      setNotification({ message: 'Er is een fout opgetreden bij het toevoegen van het woord.', type: 'error' });
    }
  };

  const handleAddCategory = async () => {
    if (!user || !selectedSchool || !newCategoryName.trim()) {
      setNotification({ message: 'Geef de categorie een naam.', type: 'error' });
      return;
    }

    setSavingCategory(true);
    try {
      const { error } = await supabase.from('custom_vocabulary_categories').insert({
        school_id: selectedSchool.id,
        group_id: newCategoryOnlyGroup ? groupId : null,
        name: newCategoryName.trim(),
        emoji: newCategoryEmoji.trim() || '📚',
        goal_codes: newCategoryGoals,
        created_by: user.id,
      });

      if (error) {
        if (error.code === '23505') {
          setNotification({ message: 'Er bestaat al een categorie met deze naam.', type: 'error' });
          return;
        }
        throw error;
      }

      setNewCategoryName('');
      setNewCategoryEmoji('📚');
      setNewCategoryGoals([]);
      setNewCategoryOnlyGroup(false);
      setShowCategoryModal(false);
      setNotification({ message: 'Categorie toegevoegd!', type: 'success' });
      loadVocabularyData();
    } catch (error) {
      console.error('Error adding category:', error);
      setNotification({ message: 'Er is een fout opgetreden bij het toevoegen van de categorie.', type: 'error' });
    } finally {
      setSavingCategory(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!user || !categoryToDelete) return;

    // Een categorie met woorden verwijderen zou die woorden meenemen; eerst leegmaken.
    if (categoryToDelete.words.length > 0) {
      setNotification({
        message: 'Verwijder eerst de woorden in deze categorie.',
        type: 'error',
      });
      setCategoryToDelete(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('custom_vocabulary_categories')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
        })
        .eq('id', categoryToDelete.id);

      if (error) throw error;

      setCategoryToDelete(null);
      setNotification({ message: 'Categorie verwijderd.', type: 'success' });
      loadVocabularyData();
    } catch (error) {
      console.error('Error deleting category:', error);
      setNotification({ message: 'Er is een fout opgetreden bij het verwijderen van de categorie.', type: 'error' });
    }
  };

  const handleDeleteClick = (customId: string, wordText: string) => {
    setDeleteConfirmation({ wordId: customId, wordText });
  };

  const confirmDelete = async () => {
    if (!user || !deleteConfirmation) return;

    try {
      const { error } = await supabase
        .from('custom_vocabulary')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
        })
        .eq('id', deleteConfirmation.wordId);

      if (error) throw error;

      setDeleteConfirmation(null);
      setNotification({ message: 'Woord succesvol verwijderd!', type: 'success' });
      loadVocabularyData();
    } catch (error) {
      console.error('Error deleting custom word:', error);
      setNotification({ message: 'Er is een fout opgetreden bij het verwijderen van het woord.', type: 'error' });
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedFilter((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const selectAllCategories = () => {
    setSelectedFilter(categories.map(c => c.id));
  };

  const hideAllCategories = () => {
    setSelectedFilter([]);
  };

  const handleExportPDF = () => {
    // Mirror the per-category word filtering that the UI applies
    const categoriesForPdf = filteredCategories.map((category) => {
      let words = category.words;
      if (searchTerm) {
        words = words.filter((w) => w.word.toLowerCase().includes(searchTerm.toLowerCase()));
      }
      if (goalFilter) {
        words = words.filter((w) => w.goals && w.goals.includes(goalFilter));
      }
      // Zelfde net-/leeftijdsfilter als op het scherm: anders kwamen alle
      // leeftijden mee in de PDF. Grijze woorden ('alle woorden tonen') niet.
      words = words.filter((w) => woordVoldoet(w.word));
      return { ...category, words };
    }).filter((category) => !filterActief || category.words.length > 0);
    const filterLabel = [
      leeftijdFilter !== 'all' ? `${leeftijdFilter} jaar` : null,
      netFilter !== 'all' ? NET_LABELS[netFilter] : null,
      ovsgGroep !== 'all' ? OVSG_GROEP_LABELS[ovsgGroep] : null,
    ].filter(Boolean).join(' • ');
    exportVocabularyToPDF(categoriesForPdf, groupName, clickCounts, filterLabel);
  };

  const getWordClassName = (word: string, isCustom: boolean = false) => {
    const count = clickCounts[word] || 0;
    let baseClasses =
      'bg-gradient-to-br px-3 py-2 rounded-full text-sm font-medium cursor-pointer transition-all duration-200 border-2 border-transparent relative select-none hover:scale-105';

    if (deleteMode && count > 0) {
      baseClasses += ' ring-2 ring-red-500 ring-offset-2 animate-pulse';
    }

    if (meaningMode) {
      baseClasses += ' hover:ring-2 hover:ring-amber-400 hover:ring-offset-1';
    }

    if (isCustom) {
      if (count === 0) {
        return `${baseClasses} from-sky-100 to-sky-200 hover:border-sky-blue border-sky-300`;
      } else if (count === 1) {
        return `${baseClasses} from-sky-200 to-sky-300 border-sky-400`;
      } else if (count === 2) {
        return `${baseClasses} from-sky-300 to-sky-400 border-sky-500`;
      } else if (count === 3) {
        return `${baseClasses} from-sky-400 to-sky-500 border-sky-600 text-white`;
      } else {
        return `${baseClasses} from-sky-500 to-sky-600 border-sky-700 text-white`;
      }
    }

    if (count === 0) {
      return `${baseClasses} from-gray-100 to-gray-200 hover:border-sky-blue`;
    } else if (count === 1) {
      return `${baseClasses} from-green-50 to-green-100 border-green-400`;
    } else if (count === 2) {
      return `${baseClasses} from-green-100 to-green-200 border-green-500`;
    } else if (count === 3) {
      return `${baseClasses} from-green-200 to-green-300 border-green-600`;
    } else {
      return `${baseClasses} from-grass-green to-green-400 border-green-700 text-white`;
    }
  };

  const filteredCategories = categories.filter((category) => {
    if (selectedFilter.length > 0 && !selectedFilter.includes(category.id)) {
      return false;
    }
    if (goalFilter) {
      const hasMatchingWord = category.words.some(word =>
        word.goals && word.goals.includes(goalFilter)
      );
      if (!hasMatchingWord) return false;
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        category.title.toLowerCase().includes(searchLower) ||
        category.words.some((w) => w.word.toLowerCase().includes(searchLower))
      );
    }

    return true;
  });


  const totalClicks = Object.values(clickCounts).reduce((sum, count) => sum + count, 0);
  const uniqueWords = Object.keys(clickCounts).length;
  const uniqueGoals = new Set<string>();
  Object.keys(clickCounts).forEach((word) => {
    const category = categories.find((c) => c.words.some((w) => w.word === word));
    if (category) {
      const wordData = category.words.find((w) => w.word === word);
      wordData?.goals.forEach((g) => uniqueGoals.add(g));
    }
  });

  const allModalImages = getAllModalImages();

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-2xl font-baloo text-deep-purple">Woordenschat laden...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-4 shadow-lg">
        <div className="max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Zoek een woord..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sky-blue focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <NetLeeftijdFilter
          ovsgGroep={ovsgGroep}
          onOvsgGroepChange={kiesOvsgGroep}
          toonAlles={toonAlles}
          onToonAllesChange={setToonAlles}
          klasFilterActief={klasFilterActief}
          klasOmschrijving={klasOmschrijving}
            net={netFilter}
            leeftijd={leeftijdFilter}
            onNetChange={kiesNet}
            onLeeftijdChange={kiesLeeftijd}
          />

          {filterActief && (
            <label className="flex items-center gap-2 mt-3 text-sm text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={toonAlleWoorden}
                onChange={(e) => setToonAlleWoorden(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-deep-purple focus:ring-deep-purple"
              />
              Alle woorden tonen
              <span className="text-xs text-gray-400">
                (woorden buiten het filter blijven staan, maar grijs)
              </span>
            </label>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-xl">
        <div className="flex flex-wrap justify-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👆</span>
            <span className="text-gray-600">Klikken:</span>
            <span className="text-2xl font-baloo text-deep-purple">{totalClicks}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📝</span>
            <span className="text-gray-600">Woorden:</span>
            <span className="text-2xl font-baloo text-deep-purple">{uniqueWords}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <span className="text-gray-600">Doelen:</span>
            <span className="text-2xl font-baloo text-deep-purple">{uniqueGoals.size}</span>
          </div>
        </div>

        <div className="border-t-2 border-gray-100 pt-4">
          <div className="text-center mb-3">
            <span className="text-sm font-semibold text-gray-600">Tijdperiode:</span>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setTimeFilter('hour')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                timeFilter === 'hour'
                  ? 'bg-coral-pink text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Laatste uur
            </button>
            <button
              onClick={() => setTimeFilter('today')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                timeFilter === 'today'
                  ? 'bg-coral-pink text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Vandaag
            </button>
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                timeFilter === 'all'
                  ? 'bg-coral-pink text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Alles
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-lavender/20 to-sky-blue/20 rounded-3xl p-6 shadow-lg border-2 border-lavender/30">
        <div className="flex items-start gap-3">
          <div className="text-3xl">📚</div>
          <div>
            <h3 className="text-lg font-baloo text-deep-purple mb-2">
              Officiële Kleuteronderwijs Woordenschat
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Deze woorden zijn afkomstig uit de officiële{' '}
              <a
                href="https://onderwijsdoelen.be/resultaten?onderwijsstructuur=KO&version=V2_0&filters=onderwijsniveau%255B0%255D%255Bid%255D%3Df7dcdedc9e9c97a653c7dba05896ef57a333480b%26onderwijsniveau%255B0%255D%255Btitel%255D%3DBasisonderwijs%26onderwijsniveau%255B0%255D%255Bwaarde%255D%3DBasisonderwijs%26bo_onderwijs_subniveau%255B0%255D%255Bid%255D%3D34a77761b6bb8b9e691aec7c5ff36410d430cc6e%26bo_onderwijs_subniveau%255B0%255D%255Btitel%255D%3DBasisonderwijs%2520%253E%2520Kleuteronderwijs%26bo_onderwijs_subniveau%255B0%255D%255Bwaarde%255D%3DKleuteronderwijs%26versie%255B0%255D%255Bwaarde%255D%3D2.0"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-blue hover:text-deep-purple font-semibold underline transition-colors"
              >
                nieuwe minimumdoelen voor het kleuteronderwijs
              </a>
              . Dit zijn alle woorden die kinderen moeten kennen aan het einde van de kleuterschool.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="flex justify-start lg:justify-center gap-2 min-w-max px-4 lg:px-0">
              <button
                onClick={selectAllCategories}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all bg-deep-purple text-white hover:scale-105 shadow-md whitespace-nowrap"
              >
                Alles
              </button>
              {selectedFilter.length > 0 && (
                <button
                  onClick={hideAllCategories}
                  className="px-4 py-2 rounded-full text-sm font-semibold transition-all bg-gray-600 text-white hover:scale-105 shadow-md whitespace-nowrap"
                >
                  Niet selecteren
                </button>
              )}
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all bg-grass-green text-white hover:scale-105 shadow-md flex items-center gap-2 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Aangepast woord toevoegen
              </button>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all bg-lavender text-white hover:scale-105 shadow-md flex items-center gap-2 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Eigen categorie
              </button>
              <button
                onClick={toggleDeleteMode}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105 shadow-md flex items-center gap-2 whitespace-nowrap ${
                  deleteMode
                    ? 'bg-red-500 text-white ring-2 ring-red-300'
                    : 'bg-coral-pink text-white'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                {deleteMode ? 'Verwijder modus actief' : 'Klikken verwijderen'}
              </button>
              <button
                onClick={toggleMeaningMode}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105 shadow-md flex items-center gap-2 whitespace-nowrap ${
                  meaningMode
                    ? 'bg-amber-500 text-white ring-2 ring-amber-300'
                    : 'bg-amber-400 text-white'
                }`}
              >
                <Eye className="w-4 h-4" />
                {meaningMode ? 'Betekenis modus actief' : 'Betekenis tonen'}
              </button>
              <button
                onClick={toggleDoelenMode}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105 shadow-md flex items-center gap-2 whitespace-nowrap ${
                  doelenMode
                    ? 'bg-deep-purple text-white ring-2 ring-lavender'
                    : 'bg-deep-purple/80 text-white'
                }`}
              >
                <Target className="w-4 h-4" />
                {doelenMode ? 'Doelen modus actief' : 'Doelen tonen'}
              </button>
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all bg-sky-blue text-white hover:scale-105 shadow-md flex items-center gap-2 whitespace-nowrap"
              >
                <FileDown className="w-4 h-4" />
                Exporteer naar PDF
              </button>
            </div>
          </div>
          <div className="lg:hidden absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-white via-white to-transparent pointer-events-none flex items-center justify-end pr-2">
            <div className="text-gray-400 text-xs font-semibold animate-pulse">→</div>
          </div>
        </div>

        <div className="relative">
          <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="flex justify-start lg:justify-center gap-2 min-w-max px-4 lg:px-0 flex-wrap lg:flex-nowrap">
              {categories.map((category) => {
                const isActive = selectedFilter.includes(category.id);
                return (
                  <button
                    key={category.id}
                    onClick={() => toggleCategory(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-deep-purple text-white border-2 border-deep-purple shadow-md'
                        : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-deep-purple'
                    }`}
                  >
                    {isActive ? '✓ ' : ''}{category.icon} {category.title}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="lg:hidden absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-white via-white to-transparent pointer-events-none flex items-center justify-end pr-2">
            <div className="text-gray-400 text-xs font-semibold animate-pulse">→</div>
          </div>
        </div>
      </div>

      {meaningMode && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl px-5 py-3 flex items-center gap-3">
          <Eye className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-amber-800">
            Betekenis modus: klik op een woord om de afbeelding en uitspraak te zien.
          </p>
          <button
            onClick={toggleMeaningMode}
            className="ml-auto p-1 hover:bg-amber-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-amber-600" />
          </button>
        </div>
      )}

      {doelenMode && (
        <div className="bg-lavender/30 border-2 border-deep-purple/30 rounded-2xl px-5 py-3 flex items-center gap-3">
          <Target className="w-5 h-5 text-deep-purple flex-shrink-0" />
          <p className="text-sm font-semibold text-deep-purple">
            Doelen modus: klik op een woord om te zien welke doelen eraan hangen, per net.
          </p>
          <button
            onClick={toggleDoelenMode}
            className="ml-auto p-1 hover:bg-lavender/60 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-deep-purple" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category) => {
          let filteredWords = category.words;
          if (searchTerm) {
            filteredWords = filteredWords.filter((w) => w.word.toLowerCase().includes(searchTerm.toLowerCase()));
          }
          if (goalFilter) {
            filteredWords = filteredWords.filter((w) => w.goals && w.goals.includes(goalFilter));
          }
          // Buiten het filter: normaal weglaten, maar met 'alle woorden tonen'
          // blijven ze staan in grijstint zodat je kunt zien wat wegvalt.
          const buitenFilter = new Set(
            filteredWords.filter((w) => !woordVoldoet(w.word)).map((w) => w.word)
          );
          if (!toonAlleWoorden) {
            filteredWords = filteredWords.filter((w) => !buitenFilter.has(w.word));
          }
          if (filteredWords.length === 0 && filterActief) {
            return null;
          }

          return (
            <div
              key={category.id}
              className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-shadow border-t-4"
              style={{ borderTopColor: category.colorCode }}
            >
              <h3 className="text-xl font-baloo text-deep-purple mb-2 flex items-center gap-2">
                <span>{category.icon}</span>
                {category.title}
              </h3>
              <div className="text-xs text-gray-500 mb-4">
                {category.goalCodes} - {category.description}
              </div>
              <div className="flex flex-wrap gap-2">
                {filteredWords.map((word) => (
                  <div
                    key={`${category.id}-${word.word}`}
                    className={`relative group ${
                      buitenFilter.has(word.word) ? 'opacity-40 grayscale' : ''
                    }`}
                    title={
                      buitenFilter.has(word.word)
                        ? 'Valt buiten het gekozen net- en leeftijdsfilter'
                        : undefined
                    }
                  >
                    <button
                      onClick={() => handleWordClick(word.word, word.goals, category.id)}
                      disabled={loading}
                      className={getWordClassName(word.word, word.isCustom)}
                    >
                      {word.word}
                      {clickCounts[word.word] > 0 && (
                        <span className="absolute -top-2 -right-2 bg-coral-pink text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                          {clickCounts[word.word]}
                        </span>
                      )}
                      {wordsWithImages.has(word.word) && (
                        <span className="absolute -bottom-1.5 -right-1.5 bg-amber-400 rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                          <Image className="w-2.5 h-2.5 text-white" />
                        </span>
                      )}
                    </button>
                    {word.isCustom && word.customId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(word.customId!, word.word);
                        }}
                        className="absolute -top-1 -left-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        title="Verwijder aangepast woord"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-xl text-gray-500">Geen woorden gevonden voor "{searchTerm}"</p>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h3 className="text-2xl font-baloo text-deep-purple">Aangepast woord toevoegen</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewWord('');
                  setSelectedCategoryId('');
                  setSelectedGoals([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto min-h-0 flex-1 -mx-1 px-1">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Woord
                </label>
                <input
                  type="text"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="Nieuw woord..."
                  className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Categorie
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => {
                    setSelectedCategoryId(e.target.value);
                    const category = categories.find((c) => c.id === e.target.value);
                    if (category) {
                      const goals = category.goalCodes.split(', ').filter(Boolean);
                      setSelectedGoals(goals);
                    } else {
                      setSelectedGoals([]);
                    }
                  }}
                  className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none"
                >
                  <option value="">Selecteer een categorie...</option>
                  <optgroup label="Standaardcategorieën">
                    {categories.filter((cat) => !cat.isCustom).map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.title}
                      </option>
                    ))}
                  </optgroup>
                  {categories.some((cat) => cat.isCustom) && (
                    <optgroup label="Eigen categorieën">
                      {categories.filter((cat) => cat.isCustom).map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.title}{cat.groupId ? ' (deze klas)' : ''}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {selectedCategoryId && (
                <DoelSelector
                  waarde={selectedGoals}
                  onChange={setSelectedGoals}
                  label="Doelen"
                />
              )}
            </div>

            <div className="flex gap-3 pt-4 flex-shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleAddCustomWord();
                }}
                className="flex-1 bg-grass-green text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
              >
                Toevoegen
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowAddModal(false);
                  setNewWord('');
                  setSelectedCategoryId('');
                  setSelectedGoals([]);
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h3 className="text-2xl font-baloo text-deep-purple">Eigen categorie</h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto min-h-0 flex-1 -mx-1 px-1">
              <p className="text-sm text-gray-600">
                Maak een categorie voor een eigen thema. Daarna kan je er woorden aan toevoegen
                via <strong>Aangepast woord toevoegen</strong>.
              </p>

              <div className="flex gap-3">
                <div className="w-20">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Icoon</label>
                  <input
                    type="text"
                    value={newCategoryEmoji}
                    onChange={(e) => setNewCategoryEmoji(e.target.value)}
                    maxLength={4}
                    className="w-full px-3 py-2 text-center text-xl rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Naam</label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Bijvoorbeeld: Carnaval"
                    className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none"
                  />
                </div>
              </div>

              <label className="flex items-start gap-3 p-3 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-deep-purple/40 transition-colors">
                <input
                  type="checkbox"
                  checked={newCategoryOnlyGroup}
                  onChange={(e) => setNewCategoryOnlyGroup(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-deep-purple"
                />
                <span className="text-sm text-gray-700">
                  Alleen voor {groupName || 'deze klas'}
                  <span className="block text-xs text-gray-500">
                    Laat dit uit als de hele school deze categorie mag gebruiken.
                  </span>
                </span>
              </label>

              <div>
                <p className="text-sm text-gray-600 mb-2">
                  De doelen liggen bij de woorden zelf. Kies je hier toch doelen, dan staan die
                  alvast aangevinkt zodra je een woord aan deze categorie toevoegt — handig bij een
                  thema waar telkens dezelfde doelen terugkomen.
                </p>
                <DoelSelector
                  waarde={newCategoryGoals}
                  onChange={setNewCategoryGoals}
                  label="Doelen die je standaard voorstelt (optioneel)"
                />
              </div>

              {categories.some((cat) => cat.isCustom) && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Eigen categorieën</p>
                  <ul className="space-y-2">
                    {categories.filter((cat) => cat.isCustom).map((cat) => (
                      <li
                        key={cat.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200"
                      >
                        <span className="text-lg">{cat.icon}</span>
                        <span className="flex-1 text-sm text-gray-700">
                          {cat.title}
                          <span className="block text-xs text-gray-500">
                            {cat.groupId ? 'alleen deze klas' : 'hele school'} · {cat.words.length}{' '}
                            {cat.words.length === 1 ? 'woord' : 'woorden'}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setCategoryToDelete(cat)}
                          title="Categorie verwijderen"
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 flex-shrink-0">
              <button
                type="button"
                onClick={handleAddCategory}
                disabled={savingCategory}
                className="flex-1 bg-grass-green text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50"
              >
                {savingCategory ? 'Toevoegen...' : 'Toevoegen'}
              </button>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}

      {categoryToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-xl font-baloo text-deep-purple">Categorie verwijderen</h3>
            <p className="text-gray-700">
              Weet je zeker dat je <strong>{categoryToDelete.title}</strong> wilt verwijderen?
            </p>
            {categoryToDelete.words.length > 0 && (
              <p className="text-sm text-red-600">
                Deze categorie bevat nog {categoryToDelete.words.length}{' '}
                {categoryToDelete.words.length === 1 ? 'woord' : 'woorden'}. Verwijder die eerst.
              </p>
            )}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setCategoryToDelete(null)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-semibold"
              >
                Annuleren
              </button>
              <button
                onClick={confirmDeleteCategory}
                disabled={categoryToDelete.words.length > 0}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-xl font-semibold disabled:opacity-50"
              >
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meaning modal */}
      {meaningModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeMeaningModal}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-400 to-amber-500 p-5 flex items-center justify-between">
              <h2 className="text-2xl font-baloo text-white">{meaningModal.word}</h2>
              <button
                onClick={closeMeaningModal}
                className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Image gallery */}
              {allModalImages.length > 0 && (
                <div>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200">
                    {allModalImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setLightboxIndex(idx)}
                        className="flex-shrink-0 group relative rounded-2xl overflow-hidden border-2 border-gray-100 hover:border-amber-400 transition-colors shadow-sm hover:shadow-md"
                        style={{ width: 112, height: 112 }}
                      >
                        <img
                          src={img.url}
                          alt={img.label || meaningModal.word}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).closest('button')!.style.display = 'none';
                          }}
                        />
                        <div className="absolute bottom-0 inset-x-0 bg-black/40 px-1.5 py-0.5">
                          <p className="text-white text-[10px] font-semibold text-center truncate">
                            {img.label || IMAGE_TYPE_LABELS[img.type] || img.type}
                          </p>
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded-full p-1.5">
                            <Image className="w-4 h-4 text-gray-700" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5 text-center">Klik op een afbeelding om te vergroten</p>
                </div>
              )}

              {/* Audio buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => meaningModal.audioFile && playWordAudio(meaningModal.audioFile)}
                  disabled={!meaningModal.audioFile || isPlayingWord}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl font-semibold text-sm transition-all border-2 ${
                    isPlayingWord
                      ? 'bg-sky-100 border-sky-400 text-sky-700 animate-pulse'
                      : meaningModal.audioFile
                      ? 'bg-sky-50 border-sky-300 text-sky-700 hover:bg-sky-100 hover:scale-[1.02]'
                      : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Volume2 className={`w-7 h-7 ${isPlayingWord ? 'animate-bounce' : ''}`} />
                  <span>Speel woord</span>
                </button>

                <button
                  onClick={() => playKlanktekenAudio(meaningModal.phonemes)}
                  disabled={meaningModal.phonemes.length === 0 || isPlayingKlankteken}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl font-semibold text-sm transition-all border-2 ${
                    isPlayingKlankteken
                      ? 'bg-emerald-100 border-emerald-400 text-emerald-700 animate-pulse'
                      : meaningModal.phonemes.length > 0
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100 hover:scale-[1.02]'
                      : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <BookOpen className={`w-7 h-7 ${isPlayingKlankteken ? 'animate-bounce' : ''}`} />
                  <span>Speel klankteken</span>
                </button>
              </div>

              {/* Leerplandoelen: bij welk net en welke leeftijd hoort dit woord? */}
              {(() => {
                const info = woordNetInfo.get(meaningModal.word.toLowerCase());
                if (!info) return null;
                const heeftAfgeleid = NET_CODES.some(
                  (n) => info.perNet[n]?.precisie === 'afgeleid'
                );
                return (
                  <div className="pt-1">
                    <p className="text-xs font-semibold text-gray-500 mb-2 text-center">
                      In de leerplannen
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <WoordNetBadges info={info} />
                    </div>
                    {heeftAfgeleid && (
                      <p className="text-[11px] text-gray-400 mt-2 text-center">
                        Grijs met ~ is afgeleid uit de doelcodes van dit woord: een ruwe
                        schatting, geen uitspraak van het leerplan zelf.
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Phoneme chips */}
              {meaningModal.phonemes.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  {meaningModal.phonemes.map((p, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-sm font-bold font-baloo"
                    >
                      {p.title}
                    </span>
                  ))}
                </div>
              )}

              {/* Linked videos */}
              {meaningModal.videos.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Video className="w-5 h-5 text-deep-purple" />
                    <h3 className="text-sm font-bold text-gray-700 font-baloo">Video's bij dit woord</h3>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {meaningModal.videos.map((video) => {
                      const embed = getVideoEmbed(video.url);
                      const thumb = embed.thumbnailUrl || video.thumbnail_url || '';
                      return (
                        <button
                          key={video.id}
                          onClick={() => setActiveVideo(video)}
                          className="flex-shrink-0 w-40 group"
                        >
                          <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 border-2 border-transparent group-hover:border-deep-purple transition-colors">
                            {thumb ? (
                              <img src={thumb} alt={video.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-deep-purple/10 to-lavender/10">
                                <Video className="w-8 h-8 text-deep-purple/40" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 flex items-center justify-center transition-colors">
                              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Play className="w-5 h-5 text-deep-purple ml-0.5" fill="currentColor" />
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mt-1.5 line-clamp-2 text-left font-medium">{video.title}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Admin: add direct video link */}
              {isAdmin && meaningModal && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Plus className="w-4 h-4 text-deep-purple" />
                    <h3 className="text-sm font-bold text-gray-700 font-baloo">Video toevoegen (directe link)</h3>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={directVideoUrl}
                      onChange={(e) => setDirectVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=... of Vimeo link"
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-deep-purple text-sm"
                    />
                    <input
                      type="text"
                      value={directVideoTitle}
                      onChange={(e) => setDirectVideoTitle(e.target.value)}
                      placeholder="Titel (optioneel)"
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-deep-purple text-sm"
                    />
                    <button
                      onClick={async () => {
                        if (!directVideoUrl.trim() || !meaningModal) return;
                        setAddingVideo(true);
                        try {
                          const { error } = await supabase
                            .from('educational_video_vocabulary')
                            .insert({
                              word: meaningModal.word,
                              direct_url: directVideoUrl.trim(),
                              direct_title: directVideoTitle.trim() || null,
                            });
                          if (error) throw error;

                          setNotification({ message: 'Video toegevoegd!', type: 'success' });
                          setDirectVideoUrl('');
                          setDirectVideoTitle('');
                          await openMeaningModal(meaningModal.word);
                        } catch (error) {
                          console.error('Error adding direct video:', error);
                          setNotification({ message: 'Fout bij toevoegen video', type: 'error' });
                        } finally {
                          setAddingVideo(false);
                        }
                      }}
                      disabled={addingVideo || !directVideoUrl.trim()}
                      className="w-full px-4 py-2 bg-deep-purple text-white rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 text-sm flex items-center justify-center gap-2"
                    >
                      {addingVideo ? 'Toevoegen...' : 'Video koppelen'}
                    </button>
                  </div>
                </div>
              )}

              {!meaningModal.audioFile && meaningModal.phonemes.length === 0 && allModalImages.length === 0 && meaningModal.videos.length === 0 && !isAdmin && (
                <p className="text-center text-sm text-gray-500">Geen informatie beschikbaar voor dit woord.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video player popup */}
      {activeVideo && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="relative bg-white rounded-2xl overflow-hidden max-w-3xl w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            {(() => {
              const embed = getVideoEmbed(activeVideo.url);
              if (embed.embedUrl) {
                return (
                  <div className="aspect-video w-full">
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
                <div className="aspect-video w-full bg-gray-100 flex items-center justify-center">
                  <a
                    href={activeVideo.url}
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
            <div className="p-4">
              <h3 className="text-lg font-baloo text-gray-800">{activeVideo.title}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && meaningModal && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative flex flex-col items-center max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Image */}
            <img
              src={allModalImages[lightboxIndex].url}
              alt={allModalImages[lightboxIndex].label || meaningModal.word}
              className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl"
            />

            {/* Caption */}
            <div className="mt-4 text-center">
              <p className="text-white text-lg font-baloo">{meaningModal.word}</p>
              <p className="text-white/60 text-sm mt-0.5">
                {allModalImages[lightboxIndex].label || IMAGE_TYPE_LABELS[allModalImages[lightboxIndex].type] || allModalImages[lightboxIndex].type}
              </p>
              {allModalImages.length > 1 && (
                <p className="text-white/40 text-xs mt-1">{lightboxIndex + 1} / {allModalImages.length}</p>
              )}
            </div>

            {/* Navigation arrows */}
            {lightboxIndex > 0 && (
              <button
                onClick={() => setLightboxIndex((i) => (i !== null ? i - 1 : null))}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <ChevronLeft className="w-7 h-7 text-white" />
              </button>
            )}
            {lightboxIndex < allModalImages.length - 1 && (
              <button
                onClick={() => setLightboxIndex((i) => (i !== null ? i + 1 : null))}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <ChevronRight className="w-7 h-7 text-white" />
              </button>
            )}
          </div>
        </div>
      )}

      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
          <div
            className={`px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 ${
              notification.type === 'success'
                ? 'bg-grass-green text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            <span className="font-medium">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 hover:opacity-75"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Woord verwijderen?</h3>
            <p className="text-gray-600 mb-6">
              Weet je zeker dat je het woord "<span className="font-semibold">{deleteConfirmation.wordText}</span>" wilt verwijderen?
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors"
              >
                Verwijderen
              </button>
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-baloo text-deep-purple mb-2">Verwijder modus geactiveerd</h3>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 p-4 rounded-lg">
                <p className="text-gray-800 font-semibold mb-2">Hoe werkt het?</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm">
                  <li>Woorden met klikken hebben een <span className="font-semibold text-red-600">rode pulserende ring</span></li>
                  <li>Klik op een woord om de <span className="font-semibold">meest recente klik</span> te verwijderen</li>
                  <li>Elke klik verwijdert <span className="font-semibold">één klik</span> van de teller</li>
                  <li>Blijf klikken tot de teller op <span className="font-semibold">0</span> staat</li>
                </ol>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-500 p-4 rounded-lg">
                <p className="text-gray-800 font-semibold mb-2">Let op!</p>
                <p className="text-gray-700 text-sm">
                  Je moet de verwijder modus <span className="font-semibold">uitschakelen</span> om weer normale klikken toe te voegen. Klik opnieuw op de knop "Verwijder modus actief" om terug te keren naar normaal gebruik.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowDeleteInstructions(false)}
              className="w-full bg-deep-purple text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
            >
              Begrepen, start verwijderen
            </button>
          </div>
        </div>
      )}
      <DoelenPerNetModal
        isOpen={doelenVoorWoord !== null}
        onClose={() => setDoelenVoorWoord(null)}
        codes={doelenVoorWoord?.codes ?? []}
        woord={doelenVoorWoord?.woord}
        herkomst={doelenVoorWoord ? `"${doelenVoorWoord.woord}"` : undefined}
      />

    </div>
  );
}
