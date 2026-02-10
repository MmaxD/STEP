import { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Clock, Plus, Trash2, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';

interface Class {
  id: string;
  subject: string;
  teacher: string;
  room: string;
  grade: string;
  color: string;
}

interface TimeSlot {
  time: string;
  label: string;
}

const timeSlots: TimeSlot[] = [
  { time: '08:00', label: '8:00 - 9:00 AM' },
  { time: '09:00', label: '9:00 - 10:00 AM' },
  { time: '10:00', label: '10:00 - 11:00 AM' },
  { time: '11:00', label: '11:00 AM - 12:00 PM' },
  { time: '12:00', label: '12:00 - 1:00 PM' },
  { time: '13:00', label: '1:00 - 2:00 PM' },
  { time: '14:00', label: '2:00 - 3:00 PM' },
  { time: '15:00', label: '3:00 - 4:00 PM' },
];

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const availableClasses: Class[] = [
  { id: 'math-1', subject: 'Mathematics', teacher: 'Mr. Chen', room: 'A101', grade: 'Grade 11', color: '#3b82f6' },
  { id: 'phys-1', subject: 'Physics', teacher: 'Dr. Smith', room: 'B205', grade: 'Grade 11', color: '#8b5cf6' },
  { id: 'chem-1', subject: 'Chemistry', teacher: 'Ms. Johnson', room: 'B203', grade: 'Grade 11', color: '#ec4899' },
  { id: 'eng-1', subject: 'English', teacher: 'Mrs. Davis', room: 'C102', grade: 'Grade 11', color: '#10b981' },
  { id: 'hist-1', subject: 'History', teacher: 'Mr. Brown', room: 'C105', grade: 'Grade 11', color: '#f59e0b' },
  { id: 'art-1', subject: 'Art', teacher: 'Ms. Wilson', room: 'D201', grade: 'Grade 11', color: '#06b6d4' },
];

interface ClassCardProps {
  classInfo: Class;
  isDragging?: boolean;
}

const ClassCard = ({ classInfo, isDragging }: ClassCardProps) => {
  const [{ opacity }, drag] = useDrag(
    () => ({
      type: 'class',
      item: classInfo,
      collect: (monitor) => ({
        opacity: monitor.isDragging() ? 0.4 : 1,
      }),
    }),
    []
  );

  return (
    <div
      ref={drag}
      style={{ opacity, borderLeftColor: classInfo.color }}
      className="bg-white border-l-4 border border-gray-200 rounded p-2 cursor-move hover:shadow-md transition-shadow text-xs"
    >
      <div className="font-semibold text-gray-900 mb-0.5">{classInfo.subject}</div>
      <div className="text-gray-600 text-[10px]">{classInfo.teacher}</div>
      <div className="flex items-center gap-1 mt-1">
        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">{classInfo.room}</Badge>
        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">{classInfo.grade}</Badge>
      </div>
    </div>
  );
};

interface TimetableSlotProps {
  day: string;
  time: string;
  classInfo: Class | null;
  onDrop: (day: string, time: string, classInfo: Class) => void;
  onRemove: (day: string, time: string) => void;
}

const TimetableSlot = ({ day, time, classInfo, onDrop, onRemove }: TimetableSlotProps) => {
  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: 'class',
      drop: (item: Class) => onDrop(day, time, item),
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }),
    [day, time]
  );

  return (
    <div
      ref={drop}
      className={`min-h-[80px] border border-gray-200 p-2 transition-all ${
        isOver ? 'bg-blue-50 border-blue-400 border-2' : 'bg-white'
      } ${!classInfo ? 'hover:bg-gray-50' : ''}`}
    >
      {classInfo ? (
        <div
          style={{ borderLeftColor: classInfo.color }}
          className="bg-gradient-to-r from-gray-50 to-white border-l-4 border border-gray-200 rounded p-2 h-full relative group"
        >
          <button
            onClick={() => onRemove(day, time)}
            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="h-3 w-3 text-red-500 hover:text-red-700" />
          </button>
          <div className="text-xs font-semibold text-gray-900 mb-0.5">{classInfo.subject}</div>
          <div className="text-[10px] text-gray-600">{classInfo.teacher}</div>
          <div className="flex items-center gap-1 mt-1">
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">{classInfo.room}</Badge>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-300">
          <Plus className="h-4 w-4" />
        </div>
      )}
    </div>
  );
};

export function TimetableBuilder() {
  const [timetable, setTimetable] = useState<Record<string, Record<string, Class | null>>>(() => {
    const initial: Record<string, Record<string, Class | null>> = {};
    days.forEach((day) => {
      initial[day] = {};
      timeSlots.forEach((slot) => {
        initial[day][slot.time] = null;
      });
    });
    return initial;
  });

  const handleDrop = (day: string, time: string, classInfo: Class) => {
    setTimetable((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [time]: classInfo,
      },
    }));
  };

  const handleRemove = (day: string, time: string) => {
    setTimetable((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [time]: null,
      },
    }));
  };

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Interactive Timetable Builder</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">
                Drag and drop classes to create the weekly schedule
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Template
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              Save Schedule
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Available Classes Pool */}
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            Available Classes - Drag to Schedule
          </div>
          <div className="grid grid-cols-6 gap-3">
            {availableClasses.map((classInfo) => (
              <ClassCard key={classInfo.id} classInfo={classInfo} />
            ))}
          </div>
        </div>

        {/* Timetable Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            {/* Header Row */}
            <div className="grid grid-cols-[120px_repeat(5,1fr)] gap-px bg-gray-200 border border-gray-200">
              <div className="bg-gray-100 p-3 font-semibold text-xs text-gray-700">Time</div>
              {days.map((day) => (
                <div key={day} className="bg-gray-100 p-3 font-semibold text-xs text-gray-700 text-center">
                  {day}
                </div>
              ))}
            </div>

            {/* Time Slots */}
            <div className="grid grid-cols-[120px_repeat(5,1fr)] gap-px bg-gray-200 border-l border-r border-b border-gray-200">
              {timeSlots.map((slot) => (
                <>
                  <div key={`time-${slot.time}`} className="bg-gray-50 p-3 text-xs text-gray-600">
                    <div className="font-semibold">{slot.time}</div>
                    <div className="text-[10px] text-gray-500">{slot.label.split(' - ')[1]}</div>
                  </div>
                  {days.map((day) => (
                    <TimetableSlot
                      key={`${day}-${slot.time}`}
                      day={day}
                      time={slot.time}
                      classInfo={timetable[day][slot.time]}
                      onDrop={handleDrop}
                      onRemove={handleRemove}
                    />
                  ))}
                </>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-200 border border-gray-300 rounded"></div>
            <span>Empty Slot</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-50 border border-blue-400 rounded"></div>
            <span>Drop Zone Active</span>
          </div>
          <div className="ml-auto text-gray-600">
            Total Classes Scheduled: {Object.values(timetable).reduce(
              (acc, day) => acc + Object.values(day).filter(Boolean).length,
              0
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
