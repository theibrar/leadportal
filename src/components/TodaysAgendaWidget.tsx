'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Phone,
  Mail,
  Users,
  FileText,
  AlertCircle,
  Plus,
  Trash2,
  ArrowRight,
  ChevronRight,
  Check,
  X,
} from 'lucide-react';
import { playLeadSound } from '@/lib/notificationSound';

interface TodaysAgendaWidgetProps {
  role?: 'ADMIN' | 'CLIENT';
  onOpenLead?: (lead: any) => void;
}

export function TodaysAgendaWidget({ role = 'CLIENT', onOpenLead }: TodaysAgendaWidgetProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'overdue' | 'upcoming' | 'completed'>('today');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState('CALL');
  const [newTaskDueDate, setNewTaskDueDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [newTaskDueTime, setNewTaskDueTime] = useState('14:00');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [submittingTask, setSubmittingTask] = useState(false);

  const apiBasePath = role === 'ADMIN' ? '/api/admin/tasks' : '/api/client/tasks';

  const fetchTasks = async () => {
    try {
      const res = await fetch(apiBasePath);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Classify tasks
  const todayStr = new Date().toISOString().split('T')[0];

  const overdueTasks = tasks.filter((t) => {
    if (t.isCompleted) return false;
    const taskDate = new Date(t.dueDate).toISOString().split('T')[0];
    return taskDate < todayStr;
  });

  const todayTasks = tasks.filter((t) => {
    if (t.isCompleted) return false;
    const taskDate = new Date(t.dueDate).toISOString().split('T')[0];
    return taskDate === todayStr;
  });

  const upcomingTasks = tasks.filter((t) => {
    if (t.isCompleted) return false;
    const taskDate = new Date(t.dueDate).toISOString().split('T')[0];
    return taskDate > todayStr;
  });

  const completedTasks = tasks.filter((t) => t.isCompleted);

  // Toggle completion
  const handleToggleTask = async (task: any) => {
    const newStatus = !task.isCompleted;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, isCompleted: newStatus } : t))
    );

    try {
      const res = await fetch(`${apiBasePath}/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: newStatus }),
      });
      if (res.ok) {
        if (newStatus) {
          playLeadSound(); // Subtle celebratory sound on task complete
        }
      } else {
        // Revert
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, isCompleted: task.isCompleted } : t))
        );
      }
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, isCompleted: task.isCompleted } : t))
      );
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await fetch(`${apiBasePath}/${taskId}`, { method: 'DELETE' });
    } catch {
      fetchTasks();
    }
  };

  // Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setSubmittingTask(true);
    try {
      const res = await fetch(apiBasePath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          taskType: newTaskType,
          dueDate: newTaskDueDate,
          dueTime: newTaskDueTime,
          notes: newTaskNotes.trim() || undefined,
        }),
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        setNewTaskTitle('');
        setNewTaskNotes('');
        fetchTasks();
      }
    } catch {
      // ignore
    } finally {
      setSubmittingTask(false);
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'CALL':
        return <Phone className="w-3.5 h-3.5 text-blue-600" />;
      case 'EMAIL':
        return <Mail className="w-3.5 h-3.5 text-purple-600" />;
      case 'MEETING':
        return <Users className="w-3.5 h-3.5 text-amber-600" />;
      case 'QUOTE':
        return <FileText className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />;
    }
  };

  const displayedTasks =
    activeTab === 'today'
      ? todayTasks
      : activeTab === 'overdue'
      ? overdueTasks
      : activeTab === 'upcoming'
      ? upcomingTasks
      : completedTasks;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Widget Header */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gradient-to-r from-slate-50/70 to-blue-50/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 tracking-tight">Today&apos;s Action Agenda & Tasks</h3>
              {overdueTasks.length > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                  <AlertCircle className="w-3 h-3" /> {overdueTasks.length} Overdue
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Scheduled customer call-backs, follow-ups, and pending sales actions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Schedule Action
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="px-5 pt-3 border-b border-slate-100 flex gap-2 overflow-x-auto text-xs font-bold scrollbar-none">
        <button
          onClick={() => setActiveTab('today')}
          className={`pb-2.5 px-2 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'today'
              ? 'border-blue-600 text-blue-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Due Today</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800">
            {todayTasks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`pb-2.5 px-2 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'overdue'
              ? 'border-rose-600 text-rose-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Overdue</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            overdueTasks.length > 0 ? 'bg-rose-100 text-rose-800 font-black' : 'bg-slate-100 text-slate-600'
          }`}>
            {overdueTasks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-2.5 px-2 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'upcoming'
              ? 'border-indigo-600 text-indigo-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Upcoming</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600">
            {upcomingTasks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-2.5 px-2 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'completed'
              ? 'border-emerald-600 text-emerald-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Completed</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-50 text-emerald-700">
            {completedTasks.length}
          </span>
        </button>
      </div>

      {/* Task List */}
      <div className="p-4 divide-y divide-slate-100 max-h-72 overflow-y-auto">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400 font-medium">Loading agenda...</div>
        ) : displayedTasks.length === 0 ? (
          <div className="py-8 text-center space-y-1">
            <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto opacity-70" />
            <p className="text-xs font-bold text-slate-700">All clear in this section!</p>
            <p className="text-[11px] text-slate-400">
              {activeTab === 'today'
                ? 'No follow-ups due today. Click "Schedule Action" to set a callback.'
                : activeTab === 'overdue'
                ? 'Great job! Zero overdue follow-up tasks.'
                : 'No scheduled actions found.'}
            </p>
          </div>
        ) : (
          displayedTasks.map((t) => {
            const taskDate = new Date(t.dueDate).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={t.id}
                className="py-3 flex items-center justify-between gap-3 group hover:bg-slate-50/70 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Complete Checkbox */}
                  <button
                    onClick={() => handleToggleTask(t)}
                    className="flex-shrink-0 text-slate-400 hover:text-blue-600 transition-colors"
                    title={t.isCompleted ? 'Mark as Incomplete' : 'Mark as Done'}
                  >
                    {t.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-50" />
                    ) : (
                      <Circle className="w-5 h-5 hover:border-blue-600" />
                    )}
                  </button>

                  {/* Task details */}
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-slate-100 flex-shrink-0">
                        {getTaskIcon(t.taskType)}
                      </span>
                      <p
                        className={`text-xs font-bold truncate ${
                          t.isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {t.title}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {taskDate} {t.dueTime && `@ ${t.dueTime}`}
                      </span>

                      {/* Associated Lead Link */}
                      {t.lead && (
                        <button
                          type="button"
                          onClick={() => onOpenLead && onOpenLead(t.lead)}
                          className="font-bold text-blue-600 hover:underline flex items-center gap-0.5 truncate max-w-[160px]"
                        >
                          Lead: {t.lead.firstName} {t.lead.lastName || ''}
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      )}

                      {/* Client info for admin view */}
                      {role === 'ADMIN' && t.client && (
                        <span className="text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-bold">
                          {t.client.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleDeleteTask(t.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Add Task */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900">Schedule Follow-up Action</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Action Description / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Call back regarding solar estimate"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Action Type</label>
                  <select
                    value={newTaskType}
                    onChange={(e) => setNewTaskType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-blue-600"
                  >
                    <option value="CALL">Phone Call</option>
                    <option value="EMAIL">Email Outreach</option>
                    <option value="FOLLOW_UP">General Follow-Up</option>
                    <option value="MEETING">Demo / Meeting</option>
                    <option value="QUOTE">Send Proposal / Quote</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Scheduled Time</label>
                  <input
                    type="time"
                    value={newTaskDueTime}
                    onChange={(e) => setNewTaskDueTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Due Date *</label>
                <input
                  type="date"
                  required
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Internal Reminder Note (optional)</label>
                <textarea
                  rows={2}
                  placeholder="Key talking points or customer questions..."
                  value={newTaskNotes}
                  onChange={(e) => setNewTaskNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTask}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/20"
                >
                  {submittingTask ? 'Scheduling...' : 'Save to Agenda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
