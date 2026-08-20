import { useState } from 'react';
import { Clock, Plus } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  items?: any[];
}

interface DayTemplateBlock {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  block_type: string;
  title: string;
  subject?: { title: string };
}

interface WeekCalendarViewProps {
  currentWeekStart: Date;
  lessons: Lesson[];
  templateBlocks: DayTemplateBlock[];
  onLessonClick: (lesson: Lesson) => void;
  onSlotClick: (date: Date, time: string, templateBlock?: DayTemplateBlock) => void;
  itemTypeIcons: Record<string, any>;
  itemTypeColors: Record<string, string>;
}

const PIXELS_PER_MINUTE = 1.5;
const HOUR_HEIGHT = 60 * PIXELS_PER_MINUTE;

/* Klikken rondt af op een kwartierlijn van vijf minuten; een les duurt standaard 50 minuten. */
const SNAP_MINUTEN = 5;
const STANDAARD_LESDUUR = 50;

export default function WeekCalendarView({
  currentWeekStart,
  lessons,
  templateBlocks,
  onLessonClick,
  onSlotClick,
  itemTypeIcons,
  itemTypeColors
}: WeekCalendarViewProps) {
  /** Waar de muis staat in een lege dag, als minuut sinds middernacht. */
  const [zweef, setZweef] = useState<{ dag: number; minuut: number } | null>(null);

  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const getDurationInMinutes = (start: string, end: string): number => {
    return timeToMinutes(end) - timeToMinutes(start);
  };

  const getTimeSlots = () => {
    const lessonBlocks = templateBlocks
      .filter(block => block.block_type === 'lesson')
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    if (lessonBlocks.length === 0) {
      return {
        startTime: '07:00:00',
        endTime: '18:00:00',
        firstLessonTime: null,
        lastLessonTime: null
      };
    }

    const firstLesson = lessonBlocks[0];
    const lastLesson = lessonBlocks[lessonBlocks.length - 1];

    return {
      startTime: '07:00:00',
      endTime: '18:00:00',
      firstLessonTime: firstLesson.start_time,
      lastLessonTime: lastLesson.end_time
    };
  };

  const generateTimeMarkers = () => {
    const markers = [];
    const { startTime, endTime } = getTimeSlots();
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);

    for (let hour = startHour; hour <= endHour; hour++) {
      markers.push({
        time: `${hour.toString().padStart(2, '0')}:00:00`,
        display: `${hour.toString().padStart(2, '0')}:00`
      });
    }

    return markers;
  };

  const getLessonsForDay = (dayIndex: number) => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + dayIndex);

    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    return lessons.filter(lesson => {
      const lessonDate = new Date(lesson.start_time);
      return lessonDate.getFullYear() === year &&
             lessonDate.getMonth() === month &&
             lessonDate.getDate() === day;
    });
  };

  const getTemplateBlocksForDay = (dayOfWeek: number) => {
    return templateBlocks.filter(
      block => block.day_of_week === dayOfWeek && block.block_type === 'lesson'
    );
  };

  const { startTime, firstLessonTime, lastLessonTime } = getTimeSlots();
  const timeMarkers = generateTimeMarkers();
  const startMinutes = timeToMinutes(startTime);

  /* Van pixels naar een minuut op het rooster, afgerond op SNAP_MINUTEN. */
  const snapMinuut = (offsetY: number): number => {
    const ruw = startMinutes + offsetY / PIXELS_PER_MINUTE;
    const afgerond = Math.round(ruw / SNAP_MINUTEN) * SNAP_MINUTEN;
    const laatste = timeToMinutes('18:00:00') - STANDAARD_LESDUUR;
    return Math.min(Math.max(afgerond, startMinutes), laatste);
  };

  const minuutNaarTijd = (m: number): string =>
    `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}:00`;

  const minuutNaarLabel = (m: number): string =>
    `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-8 gap-0 border border-gray-200 rounded-lg overflow-hidden">
      <div className="hidden md:block border-r border-gray-200 bg-gray-50">
        <div className="h-16 border-b border-gray-200"></div>

        <div className="relative">
          {timeMarkers.map((marker, index) => {
            const markerMinutes = timeToMinutes(marker.time);
            const topPosition = (markerMinutes - startMinutes) * PIXELS_PER_MINUTE;

            return (
              <div
                key={marker.time}
                className="absolute right-0 pr-2 text-xs text-gray-500 font-medium"
                style={{ top: `${topPosition}px`, transform: 'translateY(-50%)' }}
              >
                {marker.display}
              </div>
            );
          })}
          <div style={{ height: `${(timeToMinutes('18:00:00') - startMinutes) * PIXELS_PER_MINUTE}px` }}></div>
        </div>
      </div>

      {['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'].map((day, index) => {
        const date = new Date(currentWeekStart);
        date.setDate(date.getDate() + index);
        const dayLessons = getLessonsForDay(index);
        const isToday = date.toDateString() === new Date().toDateString();
        const dayOfWeek = index + 1;
        const dayTemplateBlocks = getTemplateBlocksForDay(dayOfWeek);

        return (
          <div key={day} className="border-r border-gray-200 last:border-r-0">
            <div className={`h-16 border-b border-gray-200 flex flex-col items-center justify-center ${isToday ? 'bg-sky-blue text-white' : 'bg-white'}`}>
              <div className={`text-xs font-semibold ${isToday ? 'text-white' : 'text-gray-600'}`}>
                {day}
              </div>
              <div className={`text-lg font-baloo ${isToday ? 'text-white' : 'text-deep-purple'}`}>
                {date.getDate()}
              </div>
            </div>

            <div className="relative bg-white" style={{ height: `${(timeToMinutes('18:00:00') - startMinutes) * PIXELS_PER_MINUTE}px` }}>
              {timeMarkers.map((marker) => {
                const markerMinutes = timeToMinutes(marker.time);
                const topPosition = (markerMinutes - startMinutes) * PIXELS_PER_MINUTE;

                return (
                  <div
                    key={marker.time}
                    className="absolute w-full border-t border-gray-100"
                    style={{ top: `${topPosition}px` }}
                  ></div>
                );
              })}

              {firstLessonTime && (
                <div
                  className="absolute w-full bg-blue-50/30 border-t-2 border-b-2 border-blue-200 border-dashed cursor-pointer hover:bg-blue-50 transition-colors group"
                  style={{
                    top: 0,
                    height: `${(timeToMinutes(firstLessonTime) - startMinutes) * PIXELS_PER_MINUTE}px`
                  }}
                  onClick={() => onSlotClick(date, '07:00:00')}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Voor school
                  </div>
                </div>
              )}

              {lastLessonTime && (
                <div
                  className="absolute w-full bg-blue-50/30 border-t-2 border-b-2 border-blue-200 border-dashed cursor-pointer hover:bg-blue-50 transition-colors group"
                  style={{
                    top: `${(timeToMinutes(lastLessonTime) - startMinutes) * PIXELS_PER_MINUTE}px`,
                    height: `${(timeToMinutes('18:00:00') - timeToMinutes(lastLessonTime)) * PIXELS_PER_MINUTE}px`
                  }}
                  onClick={() => onSlotClick(date, lastLessonTime)}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Na school
                  </div>
                </div>
              )}

              {/*
                Zonder dagindeling was een lege dag helemaal niet aanklikbaar:
                de zones "voor school" en "na school" verschijnen alleen als er
                al een les staat. Daarom hier een vrij klikvlak over de hele dag,
                dat afrondt op vijf minuten. Zodra er wel blokken zijn, nemen die
                het over. Geen z-index, zodat lessen erboven klikbaar blijven.
              */}
              {dayTemplateBlocks.length === 0 && (
                <div
                  className="absolute inset-0 cursor-pointer group"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setZweef({ dag: index, minuut: snapMinuut(e.clientY - rect.top) });
                  }}
                  onMouseLeave={() => setZweef((z) => (z?.dag === index ? null : z))}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    onSlotClick(date, minuutNaarTijd(snapMinuut(e.clientY - rect.top)));
                  }}
                >
                  {zweef?.dag === index && (
                    <div
                      className="absolute w-full border-t-2 border-deep-purple/70 bg-deep-purple/5 pointer-events-none"
                      style={{
                        top: `${(zweef.minuut - startMinutes) * PIXELS_PER_MINUTE}px`,
                        height: `${STANDAARD_LESDUUR * PIXELS_PER_MINUTE}px`,
                      }}
                    >
                      <span className="absolute left-1 top-1 text-[11px] font-semibold text-deep-purple">
                        + {minuutNaarLabel(zweef.minuut)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {dayTemplateBlocks.map((block) => {
                const blockStartMinutes = timeToMinutes(block.start_time);
                const topPosition = (blockStartMinutes - startMinutes) * PIXELS_PER_MINUTE;
                const duration = getDurationInMinutes(block.start_time, block.end_time);
                const height = duration * PIXELS_PER_MINUTE;

                const blockLessons = dayLessons.filter(lesson => {
                  const lessonTime = new Date(lesson.start_time).toTimeString().substring(0, 8);
                  return lessonTime >= block.start_time && lessonTime < block.end_time;
                });

                if (blockLessons.length > 0) {
                  return null;
                }

                return (
                  <div
                    key={block.id}
                    className="absolute w-full px-1 cursor-pointer group"
                    style={{
                      top: `${topPosition}px`,
                      height: `${height}px`
                    }}
                    onClick={() => onSlotClick(date, block.start_time, block)}
                  >
                    <div className="h-full bg-gradient-to-br from-gray-100 to-gray-50 rounded border-l-4 border-gray-300 border-dashed p-2 group-hover:from-gray-200 group-hover:to-gray-100 transition-colors">
                      <div className="font-semibold text-gray-600 text-xs truncate">
                        {block.subject?.title || block.title}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {block.start_time.substring(0, 5)} - {block.end_time.substring(0, 5)}
                      </div>
                    </div>
                  </div>
                );
              })}

              {dayLessons.map((lesson) => {
                const lessonStartTime = new Date(lesson.start_time).toTimeString().substring(0, 8);
                const lessonEndTime = new Date(lesson.end_time).toTimeString().substring(0, 8);
                const lessonStartMinutes = timeToMinutes(lessonStartTime);
                const topPosition = (lessonStartMinutes - startMinutes) * PIXELS_PER_MINUTE;
                const duration = getDurationInMinutes(lessonStartTime, lessonEndTime);
                const height = duration * PIXELS_PER_MINUTE;

                return (
                  <div
                    key={lesson.id}
                    className="absolute w-full px-1 cursor-pointer z-10"
                    style={{
                      top: `${topPosition}px`,
                      height: `${height}px`
                    }}
                    onClick={() => onLessonClick(lesson)}
                  >
                    <div className="h-full bg-gradient-to-br from-lavender/90 to-sky-blue/90 rounded border-l-4 border-deep-purple p-2 hover:shadow-lg transition-shadow overflow-hidden">
                      <div className="font-semibold text-deep-purple text-xs truncate">
                        {lesson.title}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-700 mt-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {lessonStartTime.substring(0, 5)} - {lessonEndTime.substring(0, 5)}
                      </div>
                      {lesson.items && lesson.items.length > 0 && (
                        <div className="flex flex-wrap gap-0.5 mt-1">
                          {lesson.items.slice(0, 5).map((item, idx) => {
                            const Icon = itemTypeIcons[item.item_type];
                            return (
                              <div
                                key={idx}
                                className={`w-4 h-4 rounded-full ${itemTypeColors[item.item_type]} flex items-center justify-center`}
                                title={item.item_name}
                              >
                                <Icon className="w-2 h-2 text-white" />
                              </div>
                            );
                          })}
                          {lesson.items.length > 5 && (
                            <div className="w-4 h-4 rounded-full bg-gray-400 flex items-center justify-center text-white text-[8px] font-bold">
                              +{lesson.items.length - 5}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
