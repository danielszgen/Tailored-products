import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Calendar,
  FileText,
  ArrowRight,
  LayoutGrid,
  Filter,
  Activity,
  Globe,
  Zap,
  Cpu,
  Cog,
  Lightbulb,
  Building2,
  Briefcase,
  Leaf,
  Home,
  Edit3,
  Download,
  Upload,
  RotateCcw,
  Copy,
  Check,
  Plus,
  Trash2,
  ExternalLink,
  MessageSquare,
  Link,
  Save,
  Send,
} from 'lucide-react';

type PhaseStatus = 'completed' | 'in_progress' | 'pending';

interface DriveFile {
  name: string;
  url: string;
  addedAt: string;
}

interface FeedbackEntry {
  id: string;
  author: string;
  message: string;
  createdAt: string;
}

interface Phase {
  id: number;
  name: string;
  status: PhaseStatus;
  responsible: string;
  participants: string[];
  meetingMinutes?: string;
  document?: string;
  notes?: string;
  driveFiles: DriveFile[];
}

interface PageData {
  pageName: string;
  department: string;
  owner: string;
  lastUpdate: string;
  phases: Phase[];
  nextAction?: string;
  category: 'product' | 'corporate' | 'engineering';
  feedback: FeedbackEntry[];
  driveFiles: DriveFile[];
}

const DEFAULT_PAGES: PageData[] = [
  {
    pageName: 'Home',
    department: 'Global / Marketing',
    owner: 'Marketing Lead',
    lastUpdate: '2026-05-04',
    category: 'corporate',
    nextAction: 'Complete final copy review with Management.',
    feedback: [],
    driveFiles: [],
    phases: [
      { id: 1, name: 'Feedback collected', status: 'completed', responsible: 'Marketing Lead', participants: ['Management', 'Marketing'], meetingMinutes: 'MOM-HOME-001', notes: 'Global messaging and hero section aligned with brand strategy.', driveFiles: [] },
      { id: 2, name: 'Structure + UI visual layer', status: 'completed', responsible: 'UX/UI Team', participants: ['Marketing', 'Design'], document: 'FIGMA-HOME-V3', notes: 'Hero, value props, product showcase and CTA sections defined.', driveFiles: [] },
      { id: 3, name: 'Final text and detail review', status: 'in_progress', responsible: 'Management', participants: ['Marketing'], notes: 'Pending final validation of hero copy and CTA messaging.', driveFiles: [] },
    ],
  },
  {
    pageName: 'Wiper Systems',
    department: 'Wiper Systems',
    owner: 'Department Owner',
    lastUpdate: '2026-05-04',
    category: 'product',
    nextAction: 'Schedule final review meeting with Wiper Systems department.',
    feedback: [],
    driveFiles: [],
    phases: [
      { id: 1, name: 'Feedback collected', status: 'completed', responsible: 'Department Owner', participants: ['Wiper Systems Team'], meetingMinutes: 'MOM-WS-001', notes: 'Product range, applications and key differentiators documented.', driveFiles: [] },
      { id: 2, name: 'Structure + UI visual layer', status: 'completed', responsible: 'UX/UI Team', participants: ['Marketing', 'Product Team'], document: 'FIGMA-WS-V2', notes: 'Product catalog, specs table and application gallery structured.', driveFiles: [] },
      { id: 3, name: 'Final text and detail review', status: 'pending', responsible: 'Department Owner', participants: [], notes: 'Pending final validation of technical specs and product descriptions.', driveFiles: [] },
    ],
  },
  {
    pageName: 'Plastics',
    department: 'Plastics',
    owner: 'Department Owner',
    lastUpdate: '2026-05-04',
    category: 'product',
    nextAction: 'Complete UI structure and visual layer with design team.',
    feedback: [],
    driveFiles: [],
    phases: [
      { id: 1, name: 'Feedback collected', status: 'completed', responsible: 'Department Owner', participants: ['Plastics Team'], meetingMinutes: 'MOM-PL-001', notes: 'Injection molding capabilities and quality certifications reviewed.', driveFiles: [] },
      { id: 2, name: 'Structure + UI visual layer', status: 'in_progress', responsible: 'UX/UI Team', participants: ['Marketing'], document: 'FIGMA-PL-DRAFT', notes: 'Page structure in progress, pending visual assets from department.', driveFiles: [] },
      { id: 3, name: 'Final text and detail review', status: 'pending', responsible: 'Department Owner', participants: [], notes: 'Pending final validation of copy, technical claims and final web details.', driveFiles: [] },
    ],
  },
  {
    pageName: 'Drive Systems',
    department: 'Drive Systems',
    owner: 'Department Owner',
    lastUpdate: '2026-05-04',
    category: 'product',
    nextAction: 'Schedule final review meeting with Drive Systems department.',
    feedback: [],
    driveFiles: [],
    phases: [
      { id: 1, name: 'Feedback collected', status: 'completed', responsible: 'Department Owner', participants: ['Drive Systems Team'], meetingMinutes: 'MOM-DS-001', notes: 'Motor types, applications and performance data collected.', driveFiles: [] },
      { id: 2, name: 'Structure + UI visual layer', status: 'completed', responsible: 'UX/UI Team', participants: ['Marketing', 'Engineering'], document: 'FIGMA-DS-V2', notes: 'Product pages, comparison tools and specs layout defined.', driveFiles: [] },
      { id: 3, name: 'Final text and detail review', status: 'pending', responsible: 'Department Owner', participants: [], notes: 'Pending final validation of motor specs and application data.', driveFiles: [] },
    ],
  },
  {
    pageName: 'Electronics',
    department: 'Electronics',
    owner: 'Department Owner',
    lastUpdate: '2026-05-04',
    category: 'product',
    nextAction: 'Complete final text review with Electronics team.',
    feedback: [],
    driveFiles: [],
    phases: [
      { id: 1, name: 'Feedback collected', status: 'completed', responsible: 'Department Owner', participants: ['Electronics Team'], meetingMinutes: 'MOM-EL-001', notes: 'PCB capabilities, firmware features and integration specs documented.', driveFiles: [] },
      { id: 2, name: 'Structure + UI visual layer', status: 'completed', responsible: 'UX/UI Team', participants: ['Marketing', 'Engineering'], document: 'FIGMA-EL-V2', notes: 'Technical showcase, capability matrix and use cases structured.', driveFiles: [] },
      { id: 3, name: 'Final text and detail review', status: 'in_progress', responsible: 'Department Owner', participants: ['Electronics Team'], notes: 'Review in progress, validating firmware specs and integration details.', driveFiles: [] },
    ],
  },
  {
    pageName: 'R&D',
    department: 'R&D / Engineering',
    owner: 'R&D Lead',
    lastUpdate: '2026-05-04',
    category: 'engineering',
    nextAction: 'Schedule final review with R&D Lead.',
    feedback: [],
    driveFiles: [],
    phases: [
      { id: 1, name: 'Feedback collected', status: 'completed', responsible: 'R&D Lead', participants: ['R&D Team', 'Engineering'], meetingMinutes: 'MOM-RD-001', notes: 'Innovation pipeline, lab capabilities and patent portfolio reviewed.', driveFiles: [] },
      { id: 2, name: 'Structure + UI visual layer', status: 'completed', responsible: 'UX/UI Team', participants: ['Marketing', 'R&D'], document: 'FIGMA-RD-V2', notes: 'Innovation showcase, lab tour section and technology roadmap structured.', driveFiles: [] },
      { id: 3, name: 'Final text and detail review', status: 'pending', responsible: 'R&D Lead', participants: [], notes: 'Pending final validation of technical claims and patent references.', driveFiles: [] },
    ],
  },
  {
    pageName: 'About Us',
    department: 'Corporate',
    owner: 'Management / HR',
    lastUpdate: '2026-05-04',
    category: 'corporate',
    nextAction: 'Complete UI structure and schedule management review.',
    feedback: [],
    driveFiles: [],
    phases: [
      { id: 1, name: 'Feedback collected', status: 'completed', responsible: 'Management', participants: ['Management', 'HR'], meetingMinutes: 'MOM-AU-001', notes: 'Company history, values, team structure and milestones compiled.', driveFiles: [] },
      { id: 2, name: 'Structure + UI visual layer', status: 'in_progress', responsible: 'UX/UI Team', participants: ['Marketing'], document: 'FIGMA-AU-DRAFT', notes: 'Timeline layout, team section and values block in design phase.', driveFiles: [] },
      { id: 3, name: 'Final text and detail review', status: 'pending', responsible: 'Management', participants: [], notes: 'Pending final management approval of company narrative.', driveFiles: [] },
    ],
  },
  {
    pageName: 'Careers',
    department: 'HR',
    owner: 'HR Lead',
    lastUpdate: '2026-05-04',
    category: 'corporate',
    nextAction: 'Initiate feedback collection with HR department.',
    feedback: [],
    driveFiles: [],
    phases: [
      { id: 1, name: 'Feedback collected', status: 'pending', responsible: 'HR Lead', participants: [], notes: 'Pending: need to schedule initial feedback meeting with HR.', driveFiles: [] },
      { id: 2, name: 'Structure + UI visual layer', status: 'pending', responsible: 'UX/UI Team', participants: [], notes: 'Blocked by Phase 1 completion.', driveFiles: [] },
      { id: 3, name: 'Final text and detail review', status: 'pending', responsible: 'HR Lead', participants: [], notes: 'Blocked by Phase 1 and 2 completion.', driveFiles: [] },
    ],
  },
  {
    pageName: 'Sustainability',
    department: 'Sustainability / Corporate',
    owner: 'Sustainability Lead',
    lastUpdate: '2026-05-04',
    category: 'corporate',
    nextAction: 'Begin UI structure design with collected feedback.',
    feedback: [],
    driveFiles: [],
    phases: [
      { id: 1, name: 'Feedback collected', status: 'completed', responsible: 'Sustainability Lead', participants: ['Sustainability Team', 'Marketing'], meetingMinutes: 'MOM-SU-001', notes: 'ESG goals, certifications and sustainability initiatives documented.', driveFiles: [] },
      { id: 2, name: 'Structure + UI visual layer', status: 'pending', responsible: 'UX/UI Team', participants: [], notes: 'Pending: visual layer not started yet.', driveFiles: [] },
      { id: 3, name: 'Final text and detail review', status: 'pending', responsible: 'Sustainability Lead', participants: [], notes: 'Blocked by Phase 2 completion.', driveFiles: [] },
    ],
  },
];

const STORAGE_KEY = 'doga-review-state-v2';

function loadState(): PageData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PAGES;
    return JSON.parse(raw) as PageData[];
  } catch {
    return DEFAULT_PAGES;
  }
}

function saveState(pages: PageData[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
}

function computeProgress(phases: Phase[]): number {
  const completed = phases.filter((p) => p.status === 'completed').length;
  const inProgress = phases.filter((p) => p.status === 'in_progress').length;
  return Math.round((completed / 3) * 100) + inProgress * 15;
}

function getStatusInfo(phases: Phase[]): { label: string; color: string; bgColor: string; borderColor: string; dotColor: string } {
  const completed = phases.filter((p) => p.status === 'completed').length;
  const inProgress = phases.filter((p) => p.status === 'in_progress').length;
  if (completed === 3) return { label: 'Final review completed', color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', dotColor: 'bg-emerald-500' };
  if (inProgress > 0) return { label: 'In progress', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', dotColor: 'bg-blue-500' };
  if (completed === 2) return { label: 'Structure and UI defined', color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', dotColor: 'bg-amber-500' };
  if (completed === 1) return { label: 'Feedback collected', color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', dotColor: 'bg-orange-500' };
  return { label: 'Not started', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200', dotColor: 'bg-red-500' };
}

function getNodeColor(phases: Phase[]): string {
  const completed = phases.filter((p) => p.status === 'completed').length;
  const inProgress = phases.filter((p) => p.status === 'in_progress').length;
  if (completed === 3) return '#10b981';
  if (inProgress > 0) return '#3b82f6';
  if (completed === 2) return '#f59e0b';
  if (completed === 1) return '#f97316';
  return '#ef4444';
}

const PAGE_ICONS: Record<string, React.ReactNode> = {
  Home: <Home size={20} />,
  'Wiper Systems': <Zap size={20} />,
  Plastics: <Cog size={20} />,
  'Drive Systems': <Activity size={20} />,
  Electronics: <Cpu size={20} />,
  'R&D': <Lightbulb size={20} />,
  'About Us': <Building2 size={20} />,
  Careers: <Briefcase size={20} />,
  Sustainability: <Leaf size={20} />,
};

type FilterType = 'all' | 'product' | 'corporate' | 'engineering' | 'pending' | 'completed';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All Pages' },
  { key: 'product', label: 'Product' },
  { key: 'corporate', label: 'Corporate' },
  { key: 'engineering', label: 'R&D' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
];

interface NodePosition { x: number; y: number }

const NODE_POSITIONS: Record<string, NodePosition> = {
  Home: { x: 50, y: 45 },
  'Wiper Systems': { x: 18, y: 18 },
  Plastics: { x: 82, y: 72 },
  'Drive Systems': { x: 18, y: 72 },
  Electronics: { x: 50, y: 18 },
  'R&D': { x: 50, y: 72 },
  'About Us': { x: 82, y: 18 },
  Careers: { x: 82, y: 45 },
  Sustainability: { x: 18, y: 45 },
};

const CONNECTIONS: [string, string][] = [
  ['Home', 'Wiper Systems'], ['Home', 'Electronics'], ['Home', 'About Us'],
  ['Home', 'Careers'], ['Home', 'Sustainability'], ['Home', 'R&D'],
  ['R&D', 'Electronics'], ['R&D', 'Drive Systems'], ['R&D', 'Wiper Systems'],
  ['R&D', 'Plastics'], ['Home', 'Drive Systems'], ['Home', 'Plastics'],
];

const STATUS_CYCLE: PhaseStatus[] = ['pending', 'in_progress', 'completed'];

function isGoogleDriveUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname.includes('drive.google.com') || u.hostname.includes('docs.google.com');
  } catch {
    return false;
  }
}

function extractDriveFileName(url: string): string {
  try {
    const u = new URL(url);
    const pathParts = u.pathname.split('/');
    if (u.pathname.includes('/document/')) return 'Google Doc';
    if (u.pathname.includes('/spreadsheets/')) return 'Google Sheet';
    if (u.pathname.includes('/presentation/')) return 'Google Slides';
    if (u.pathname.includes('/file/')) return 'Google Drive File';
    if (u.pathname.includes('/folders/')) return 'Google Drive Folder';
    return 'Google Drive Link';
  } catch {
    return 'Link';
  }
}

function DriveFileList({
  files,
  editMode,
  onAdd,
  onRemove,
}: {
  files: DriveFile[];
  editMode: boolean;
  onAdd: (file: DriveFile) => void;
  onRemove: (index: number) => void;
}) {
  const [showInput, setShowInput] = useState(false);
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    if (!url.trim()) { setError('Paste a URL'); return; }
    const finalName = name.trim() || (isGoogleDriveUrl(url) ? extractDriveFileName(url) : 'Link');
    onAdd({ name: finalName, url: url.trim(), addedAt: new Date().toISOString().slice(0, 10) });
    setUrl('');
    setName('');
    setError('');
    setShowInput(false);
  };

  return (
    <div className="space-y-2">
      {files.map((f, i) => (
        <div key={i} className="flex items-center gap-2 text-xs bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          <Link size={12} className="text-blue-500 shrink-0" />
          <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate flex-1 font-medium">
            {f.name}
          </a>
          <span className="text-gray-400 shrink-0">{f.addedAt}</span>
          <ExternalLink size={10} className="text-blue-400 shrink-0" />
          {editMode && (
            <button onClick={() => onRemove(i)} className="text-red-400 hover:text-red-600 shrink-0">
              <Trash2 size={12} />
            </button>
          )}
        </div>
      ))}
      {editMode && (
        <>
          {showInput ? (
            <div className="space-y-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
              <input
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError(''); }}
                placeholder="Paste Google Drive or any URL..."
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 bg-white"
              />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="File name (optional — auto-detected for Drive links)"
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 bg-white"
              />
              {error && <p className="text-[10px] text-red-500">{error}</p>}
              <div className="flex gap-2">
                <button onClick={handleAdd} className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 font-medium">
                  Add Link
                </button>
                <button onClick={() => { setShowInput(false); setUrl(''); setName(''); setError(''); }} className="text-xs text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowInput(true)}
              className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700 font-medium py-1"
            >
              <Plus size={12} /> Add file link
            </button>
          )}
        </>
      )}
    </div>
  );
}

function EditableText({
  value,
  onChange,
  editMode,
  multiline,
  placeholder,
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  editMode: boolean;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
}) {
  if (!editMode) {
    return <span className={className}>{value || <span className="text-gray-300 italic">{placeholder || 'Empty'}</span>}</span>;
  }
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className={`w-full text-xs border border-blue-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 bg-blue-50/30 resize-y ${className || ''}`}
      />
    );
  }
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full text-xs border border-blue-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 bg-blue-50/30 ${className || ''}`}
    />
  );
}

function EditableParticipants({
  participants,
  onChange,
  editMode,
}: {
  participants: string[];
  onChange: (val: string[]) => void;
  editMode: boolean;
}) {
  const [newParticipant, setNewParticipant] = useState('');

  if (!editMode) {
    if (participants.length === 0) return null;
    return (
      <span className="flex items-center gap-1">
        <Users size={12} /> {participants.join(', ')}
      </span>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1">
        {participants.map((p, i) => (
          <span key={i} className="inline-flex items-center gap-1 text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {p}
            <button onClick={() => onChange(participants.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500">
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          value={newParticipant}
          onChange={(e) => setNewParticipant(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newParticipant.trim()) {
              onChange([...participants, newParticipant.trim()]);
              setNewParticipant('');
            }
          }}
          placeholder="Add participant (Enter)"
          className="flex-1 text-[10px] border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-400"
        />
      </div>
    </div>
  );
}

function FeedbackSection({
  feedback,
  editMode,
  onAdd,
  onRemove,
}: {
  feedback: FeedbackEntry[];
  editMode: boolean;
  onAdd: (entry: FeedbackEntry) => void;
  onRemove: (id: string) => void;
}) {
  const [author, setAuthor] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (!message.trim()) return;
    onAdd({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      author: author.trim() || 'Anonymous',
      message: message.trim(),
      createdAt: new Date().toISOString(),
    });
    setMessage('');
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
        <MessageSquare size={16} />
        Feedback & Comments
        {feedback.length > 0 && (
          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">{feedback.length}</span>
        )}
      </h4>

      {feedback.length === 0 && !editMode && (
        <p className="text-xs text-gray-400 italic">No feedback yet. Enable edit mode to add comments.</p>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {feedback.map((entry) => (
          <div key={entry.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-gray-700">{entry.author}</span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(entry.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{entry.message}</p>
              </div>
              {editMode && (
                <button onClick={() => onRemove(entry.id)} className="text-gray-300 hover:text-red-500 shrink-0 mt-0.5">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {editMode && (
        <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100 space-y-2">
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Your name"
            className="w-full text-xs border border-blue-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 bg-white"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your feedback or comment..."
            rows={3}
            className="w-full text-xs border border-blue-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 bg-white resize-y"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400">Ctrl+Enter to submit</span>
            <button
              onClick={handleSubmit}
              disabled={!message.trim()}
              className="flex items-center gap-1.5 text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={12} /> Add Feedback
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PhaseTimeline({
  phases,
  editMode,
  onUpdatePhase,
  onUpdatePhaseField,
}: {
  phases: Phase[];
  editMode: boolean;
  onUpdatePhase?: (phaseId: number, status: PhaseStatus) => void;
  onUpdatePhaseField?: (phaseId: number, field: string, value: any) => void;
}) {
  return (
    <div className="space-y-4">
      {phases.map((phase, idx) => {
        const isCompleted = phase.status === 'completed';
        const isInProgress = phase.status === 'in_progress';
        const nextStatus = STATUS_CYCLE[(STATUS_CYCLE.indexOf(phase.status) + 1) % STATUS_CYCLE.length];

        return (
          <div key={phase.id} className="relative">
            {idx < phases.length - 1 && (
              <div className={`absolute left-[15px] top-[32px] w-0.5 h-[calc(100%-8px)] ${isCompleted ? 'bg-emerald-300' : 'bg-gray-200'}`} />
            )}
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {editMode ? (
                  <button
                    onClick={() => onUpdatePhase?.(phase.id, nextStatus)}
                    title={`Click to set → ${nextStatus}`}
                    className={`w-[30px] h-[30px] rounded-full flex items-center justify-center transition-all hover:scale-110 ring-2 ${
                      isCompleted ? 'ring-emerald-300 bg-emerald-50' :
                      isInProgress ? 'ring-blue-300 bg-blue-50' :
                      'ring-gray-200 bg-gray-50'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 size={20} className="text-emerald-500" /> :
                     isInProgress ? <Clock size={20} className="text-blue-500" /> :
                     <AlertCircle size={20} className="text-gray-300" />}
                  </button>
                ) : (
                  isCompleted ? <CheckCircle2 size={30} className="text-emerald-500" /> :
                  isInProgress ? <Clock size={30} className="text-blue-500" /> :
                  <AlertCircle size={30} className="text-gray-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-gray-900">Phase {phase.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    isCompleted ? 'bg-emerald-100 text-emerald-700' :
                    isInProgress ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Pending'}
                  </span>
                  {editMode && (
                    <span className="text-[9px] text-gray-400 italic">click icon to advance</span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-700 mb-2">{phase.name}</p>

                {editMode ? (
                  <div className="space-y-2 mb-2">
                    <div>
                      <label className="text-[10px] text-gray-400 font-medium block mb-0.5">Notes</label>
                      <EditableText
                        value={phase.notes || ''}
                        onChange={(val) => onUpdatePhaseField?.(phase.id, 'notes', val)}
                        editMode={editMode}
                        multiline
                        placeholder="Add notes..."
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-medium block mb-0.5">Responsible</label>
                      <EditableText
                        value={phase.responsible}
                        onChange={(val) => onUpdatePhaseField?.(phase.id, 'responsible', val)}
                        editMode={editMode}
                        placeholder="Responsible person..."
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-medium block mb-0.5">Participants</label>
                      <EditableParticipants
                        participants={phase.participants}
                        onChange={(val) => onUpdatePhaseField?.(phase.id, 'participants', val)}
                        editMode={editMode}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-medium block mb-0.5">Meeting Minutes Ref</label>
                      <EditableText
                        value={phase.meetingMinutes || ''}
                        onChange={(val) => onUpdatePhaseField?.(phase.id, 'meetingMinutes', val)}
                        editMode={editMode}
                        placeholder="e.g. MOM-HOME-001"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-medium block mb-0.5">Document Ref</label>
                      <EditableText
                        value={phase.document || ''}
                        onChange={(val) => onUpdatePhaseField?.(phase.id, 'document', val)}
                        editMode={editMode}
                        placeholder="e.g. FIGMA-HOME-V3"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    {phase.notes && (
                      <p className="text-xs text-gray-500 mb-2 leading-relaxed">{phase.notes}</p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Users size={12} /> {phase.responsible}</span>
                      {phase.participants.length > 0 && (
                        <span className="flex items-center gap-1"><Users size={12} /> {phase.participants.join(', ')}</span>
                      )}
                      {phase.meetingMinutes && (
                        <span className="flex items-center gap-1"><FileText size={12} /> {phase.meetingMinutes}</span>
                      )}
                      {phase.document && (
                        <span className="flex items-center gap-1"><FileText size={12} /> {phase.document}</span>
                      )}
                    </div>
                  </>
                )}

                {(phase.driveFiles.length > 0 || editMode) && (
                  <div className="mt-2">
                    <label className="text-[10px] text-gray-400 font-medium block mb-1">Attached Files</label>
                    <DriveFileList
                      files={phase.driveFiles}
                      editMode={editMode}
                      onAdd={(file) => onUpdatePhaseField?.(phase.id, 'addDriveFile', file)}
                      onRemove={(index) => onUpdatePhaseField?.(phase.id, 'removeDriveFile', index)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

type DetailTab = 'overview' | 'files' | 'feedback';

function DetailPanel({
  page,
  onClose,
  editMode,
  onUpdatePhase,
  onUpdatePage,
  onUpdatePhaseField,
}: {
  page: PageData;
  onClose: () => void;
  editMode: boolean;
  onUpdatePhase: (pageName: string, phaseId: number, status: PhaseStatus) => void;
  onUpdatePage: (pageName: string, field: string, value: any) => void;
  onUpdatePhaseField: (pageName: string, phaseId: number, field: string, value: any) => void;
}) {
  const progress = computeProgress(page.phases);
  const status = getStatusInfo(page.phases);
  const completedCount = page.phases.filter((p) => p.status === 'completed').length;
  const pendingPhases = page.phases.filter((p) => p.status !== 'completed');
  const [tab, setTab] = useState<DetailTab>('overview');

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-white shadow-2xl overflow-y-auto animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: getNodeColor(page.phases) }}>
                {PAGE_ICONS[page.pageName]}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{page.pageName}</h2>
                <p className="text-xs text-gray-500">{page.department}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {editMode && (
                <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium border border-amber-200">
                  Edit mode
                </span>
              )}
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
          </div>
          <div className="flex gap-1">
            {([
              { key: 'overview', label: 'Overview', icon: <Activity size={12} /> },
              { key: 'files', label: `Files (${page.driveFiles.length + page.phases.reduce((s, p) => s + p.driveFiles.length, 0)})`, icon: <Link size={12} /> },
              { key: 'feedback', label: `Feedback (${page.feedback.length})`, icon: <MessageSquare size={12} /> },
            ] as { key: DetailTab; label: string; icon: React.ReactNode }[]).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                  tab === t.key ? 'bg-dogaBlue text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {tab === 'overview' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Progress</p>
                  <div className="flex items-end gap-1">
                    <span className="text-2xl font-bold text-gray-900">{progress}%</span>
                    <span className="text-xs text-gray-400 mb-1">{completedCount}/3 phases</span>
                  </div>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: getNodeColor(page.phases) }} />
                  </div>
                </div>
                <div className={`rounded-xl p-3 border ${status.borderColor} ${status.bgColor}`}>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${status.dotColor}`} />
                    <span className={`text-sm font-semibold ${status.color}`}>{status.label}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users size={16} className="text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400">Owner</p>
                    {editMode ? (
                      <EditableText value={page.owner} onChange={(val) => onUpdatePage(page.pageName, 'owner', val)} editMode={editMode} placeholder="Owner..." />
                    ) : (
                      <p className="font-medium">{page.owner}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={16} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Last Update</p>
                    <p className="font-medium">{page.lastUpdate}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity size={16} />
                  Review Phases
                </h3>
                <PhaseTimeline
                  phases={page.phases}
                  editMode={editMode}
                  onUpdatePhase={(phaseId, status) => onUpdatePhase(page.pageName, phaseId, status)}
                  onUpdatePhaseField={(phaseId, field, value) => onUpdatePhaseField(page.pageName, phaseId, field, value)}
                />
              </div>

              {pendingPhases.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-amber-800 mb-2">Pending Items</h4>
                  <ul className="space-y-1">
                    {pendingPhases.map((p) => (
                      <li key={p.id} className="text-xs text-amber-700 flex items-start gap-2">
                        <ChevronRight size={14} className="mt-0.5 flex-shrink-0" />
                        <span>Phase {p.id}: {p.name} — {p.status === 'in_progress' ? 'In progress' : 'Not started'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="text-sm font-bold text-blue-800 mb-1 flex items-center gap-2">
                  <ArrowRight size={14} />
                  Next Action
                </h4>
                {editMode ? (
                  <EditableText
                    value={page.nextAction || ''}
                    onChange={(val) => onUpdatePage(page.pageName, 'nextAction', val)}
                    editMode={editMode}
                    multiline
                    placeholder="Define the next action..."
                  />
                ) : (
                  <p className="text-xs text-blue-700">{page.nextAction || <span className="italic text-blue-400">No next action defined</span>}</p>
                )}
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2">All Participants</h4>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(new Set(page.phases.flatMap((p) => [p.responsible, ...p.participants]).filter(Boolean))).map((name) => (
                    <span key={name} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{name}</span>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === 'files' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Link size={16} />
                  Page-Level Files
                </h4>
                <DriveFileList
                  files={page.driveFiles}
                  editMode={editMode}
                  onAdd={(file) => onUpdatePage(page.pageName, 'addDriveFile', file)}
                  onRemove={(index) => onUpdatePage(page.pageName, 'removeDriveFile', index)}
                />
                {page.driveFiles.length === 0 && !editMode && (
                  <p className="text-xs text-gray-400 italic">No files attached. Enable edit mode to add links.</p>
                )}
              </div>

              {page.phases.map((phase) => (
                <div key={phase.id}>
                  <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      phase.status === 'completed' ? 'bg-emerald-500' :
                      phase.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                    Phase {phase.id}: {phase.name}
                  </h4>
                  <DriveFileList
                    files={phase.driveFiles}
                    editMode={editMode}
                    onAdd={(file) => onUpdatePhaseField(page.pageName, phase.id, 'addDriveFile', file)}
                    onRemove={(index) => onUpdatePhaseField(page.pageName, phase.id, 'removeDriveFile', index)}
                  />
                  {phase.driveFiles.length === 0 && !editMode && (
                    <p className="text-xs text-gray-400 italic ml-4">No files</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'feedback' && (
            <FeedbackSection
              feedback={page.feedback}
              editMode={editMode}
              onAdd={(entry) => onUpdatePage(page.pageName, 'addFeedback', entry)}
              onRemove={(id) => onUpdatePage(page.pageName, 'removeFeedback', id)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ConceptMapNodeAbs({
  page,
  onClick,
  isSelected,
  dimmed,
}: {
  page: PageData;
  onClick: () => void;
  isSelected: boolean;
  dimmed: boolean;
}) {
  const progress = computeProgress(page.phases);
  const completedCount = page.phases.filter((p) => p.status === 'completed').length;
  const nodeColor = getNodeColor(page.phases);
  const isHome = page.pageName === 'Home';
  const pos = NODE_POSITIONS[page.pageName];
  const size = isHome ? 110 : 90;
  const radius = size / 2;
  const circumference = 2 * Math.PI * (radius - 4);
  const dashLength = (progress / 100) * circumference;

  return (
    <div
      className={`absolute cursor-pointer transition-all duration-300 group ${dimmed ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}
      style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)', width: size, height: size }}
      onClick={onClick}
    >
      <svg width={size} height={size} className="absolute inset-0">
        <circle cx={radius} cy={radius} r={radius - 4} fill="white" stroke={isSelected ? nodeColor : '#e5e7eb'} strokeWidth={isSelected ? 2.5 : 1.5} />
        <circle cx={radius} cy={radius} r={radius - 4} fill="none" stroke={nodeColor} strokeWidth={3.5}
          strokeDasharray={`${dashLength} ${circumference}`} strokeLinecap="round"
          transform={`rotate(-90 ${radius} ${radius})`} className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none px-1">
        <div className="mb-0.5 transition-transform duration-200 group-hover:scale-110" style={{ color: nodeColor }}>
          {PAGE_ICONS[page.pageName]}
        </div>
        <p className="text-[10px] font-bold text-gray-800 text-center leading-tight whitespace-nowrap">{page.pageName}</p>
        <p className="text-[9px] font-bold mt-0.5" style={{ color: nodeColor }}>{progress}%</p>
        <div className="flex items-center gap-0.5 mt-0.5">
          <p className="text-[7px] text-gray-400 font-medium">{completedCount}/3</p>
          {page.feedback.length > 0 && (
            <MessageSquare size={7} className="text-blue-400" />
          )}
          {page.driveFiles.length > 0 && (
            <Link size={7} className="text-blue-400" />
          )}
        </div>
      </div>
    </div>
  );
}

function ConceptMapDiv({
  pages,
  filteredNames,
  onSelect,
  selectedPage,
}: {
  pages: PageData[];
  filteredNames: Set<string>;
  onSelect: (page: PageData) => void;
  selectedPage: string | null;
}) {
  return (
    <div className="w-full h-full min-h-[450px] relative">
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        {CONNECTIONS.map(([from, to]) => {
          const fp = NODE_POSITIONS[from];
          const tp = NODE_POSITIONS[to];
          const dimmed = !filteredNames.has(from) && !filteredNames.has(to);
          return (
            <line key={`${from}-${to}`}
              x1={`${fp.x}%`} y1={`${fp.y}%`} x2={`${tp.x}%`} y2={`${tp.y}%`}
              stroke={dimmed ? '#f1f5f9' : '#cbd5e1'} strokeWidth={dimmed ? 1 : 1.5}
              strokeDasharray={dimmed ? '4 4' : 'none'} className="transition-all duration-300"
            />
          );
        })}
      </svg>
      {pages.map((page) => (
        <ConceptMapNodeAbs
          key={page.pageName}
          page={page}
          onClick={() => onSelect(page)}
          isSelected={selectedPage === page.pageName}
          dimmed={!filteredNames.has(page.pageName)}
        />
      ))}
    </div>
  );
}

function ExportModal({ pages, onClose }: { pages: PageData[]; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(pages, null, 2);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doga-dashboard-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Export Current State</h2>
            <p className="text-xs text-gray-400 mt-0.5">Download or copy the full project state including files and feedback</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="p-4">
          <pre className="bg-gray-50 rounded-xl p-3 text-[10px] text-gray-600 overflow-auto max-h-80 font-mono border border-gray-100">{json}</pre>
        </div>
        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={handleCopy}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              copied ? 'bg-emerald-500 text-white' : 'bg-dogaBlue text-white hover:bg-blue-900'
            }`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy JSON'}
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
          >
            <Download size={16} /> Download .json
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ImportModal({ onImport, onClose }: { onImport: (data: PageData[]) => void; onClose: () => void }) {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleParse = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error('Expected an array of pages');
      if (parsed.length === 0) throw new Error('Empty array');
      if (!parsed[0].pageName || !parsed[0].phases) throw new Error('Invalid format — missing pageName or phases');
      onImport(parsed as PageData[]);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Invalid JSON');
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setJsonText(text);
      handleParse(text);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Import State</h2>
            <p className="text-xs text-gray-400 mt-0.5">Upload a .json file or paste JSON to restore a project state</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="p-4 space-y-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer"
          >
            <Upload size={24} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-600">Click to upload .json file</p>
            <p className="text-xs text-gray-400 mt-1">Or paste JSON below</p>
          </button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleFile} className="hidden" />
          <textarea
            value={jsonText}
            onChange={(e) => { setJsonText(e.target.value); setError(''); }}
            placeholder="Or paste exported JSON here..."
            rows={6}
            className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 font-mono resize-y"
          />
          {error && <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={() => handleParse(jsonText)}
            disabled={!jsonText.trim()}
            className="flex-1 py-2.5 bg-dogaBlue text-white rounded-xl text-sm font-semibold hover:bg-blue-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Import JSON
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WebsiteReviewDashboard() {
  const [pages, setPages] = useState<PageData[]>(loadState);
  const [selectedPage, setSelectedPage] = useState<PageData | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [editMode, setEditMode] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    saveState(pages);
    if (selectedPage) {
      const updated = pages.find((p) => p.pageName === selectedPage.pageName);
      if (updated) setSelectedPage(updated);
    }
  }, [pages]);

  const handleUpdatePhase = (pageName: string, phaseId: number, status: PhaseStatus) => {
    const today = new Date().toISOString().slice(0, 10);
    setPages((prev) =>
      prev.map((page) =>
        page.pageName !== pageName
          ? page
          : {
              ...page,
              lastUpdate: today,
              phases: page.phases.map((ph) => (ph.id === phaseId ? { ...ph, status } : ph)),
            }
      )
    );
  };

  const handleUpdatePage = (pageName: string, field: string, value: any) => {
    const today = new Date().toISOString().slice(0, 10);
    setPages((prev) =>
      prev.map((page) => {
        if (page.pageName !== pageName) return page;
        const updated = { ...page, lastUpdate: today };
        switch (field) {
          case 'owner': updated.owner = value; break;
          case 'nextAction': updated.nextAction = value; break;
          case 'addDriveFile': updated.driveFiles = [...page.driveFiles, value]; break;
          case 'removeDriveFile': updated.driveFiles = page.driveFiles.filter((_, i) => i !== value); break;
          case 'addFeedback': updated.feedback = [...page.feedback, value]; break;
          case 'removeFeedback': updated.feedback = page.feedback.filter((f) => f.id !== value); break;
        }
        return updated;
      })
    );
  };

  const handleUpdatePhaseField = (pageName: string, phaseId: number, field: string, value: any) => {
    const today = new Date().toISOString().slice(0, 10);
    setPages((prev) =>
      prev.map((page) => {
        if (page.pageName !== pageName) return page;
        return {
          ...page,
          lastUpdate: today,
          phases: page.phases.map((ph) => {
            if (ph.id !== phaseId) return ph;
            switch (field) {
              case 'notes': return { ...ph, notes: value };
              case 'responsible': return { ...ph, responsible: value };
              case 'participants': return { ...ph, participants: value };
              case 'meetingMinutes': return { ...ph, meetingMinutes: value };
              case 'document': return { ...ph, document: value };
              case 'addDriveFile': return { ...ph, driveFiles: [...ph.driveFiles, value] };
              case 'removeDriveFile': return { ...ph, driveFiles: ph.driveFiles.filter((_: any, i: number) => i !== value) };
              default: return ph;
            }
          }),
        };
      })
    );
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setPages(DEFAULT_PAGES);
    setSelectedPage(null);
    setShowResetConfirm(false);
  };

  const handleImport = (data: PageData[]) => {
    const normalized = data.map((p) => ({
      ...p,
      feedback: p.feedback || [],
      driveFiles: p.driveFiles || [],
      phases: p.phases.map((ph) => ({ ...ph, driveFiles: ph.driveFiles || [] })),
    }));
    setPages(normalized);
    setSelectedPage(null);
  };

  const filteredPages = useMemo(() => {
    return pages.filter((page) => {
      if (filter === 'all') return true;
      if (filter === 'product') return page.category === 'product';
      if (filter === 'corporate') return page.category === 'corporate';
      if (filter === 'engineering') return page.category === 'engineering';
      if (filter === 'pending') return page.phases.some((p) => p.status !== 'completed');
      if (filter === 'completed') return page.phases.every((p) => p.status === 'completed');
      return true;
    });
  }, [filter, pages]);

  const filteredNames = useMemo(() => new Set(filteredPages.map((p) => p.pageName)), [filteredPages]);

  const stats = useMemo(() => {
    const total = pages.length;
    const progresses = pages.map((p) => computeProgress(p.phases));
    const avgProgress = Math.round(progresses.reduce((a, b) => a + b, 0) / total);
    const completed = pages.filter((p) => p.phases.every((ph) => ph.status === 'completed')).length;
    const pendingFinal = pages.filter((p) => {
      const comp = p.phases.filter((ph) => ph.status === 'completed').length;
      return comp >= 2 && p.phases[2].status !== 'completed';
    }).length;
    const totalFiles = pages.reduce((s, p) => s + p.driveFiles.length + p.phases.reduce((s2, ph) => s2 + ph.driveFiles.length, 0), 0);
    const totalFeedback = pages.reduce((s, p) => s + p.feedback.length, 0);
    return { total, avgProgress, completed, pendingFinal, totalFiles, totalFeedback };
  }, [pages]);

  const hasLocalChanges = useMemo(() => {
    return JSON.stringify(pages) !== JSON.stringify(DEFAULT_PAGES);
  }, [pages]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slide-in { animation: slideIn 0.3s ease-out; }
      `}</style>

      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-dogaRed rounded-lg flex items-center justify-center">
                <Globe size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-dogaBlue leading-none">DOGA Website Review</h1>
                <p className="text-[10px] text-gray-400 mt-0.5">Project dashboard — track progress, files & feedback</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasLocalChanges && (
                <span className="hidden sm:flex text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-1 rounded-full font-medium items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Auto-saved
                </span>
              )}
              <button
                onClick={() => setShowImport(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-all border border-gray-200"
              >
                <Upload size={14} /> Import
              </button>
              <button
                onClick={() => setShowExport(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-all border border-gray-200"
              >
                <Download size={14} /> Export
              </button>
              {hasLocalChanges && (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all border border-gray-200"
                >
                  <RotateCcw size={14} /> Reset
                </button>
              )}
              <button
                onClick={() => setEditMode((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border ${
                  editMode
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <Edit3 size={14} />
                {editMode ? 'Editing...' : 'Edit'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {editMode && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-700 font-medium">
          Edit mode active — click any page to edit notes, attach Google Drive files, add feedback, and update phase status. All changes save automatically.
        </div>
      )}

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total Pages', value: stats.total, icon: <LayoutGrid size={18} />, color: 'text-dogaBlue', bg: 'bg-blue-50' },
            { label: 'Average Progress', value: `${stats.avgProgress}%`, icon: <Activity size={18} />, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Completed', value: stats.completed, icon: <CheckCircle2 size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Pending Final Review', value: stats.pendingFinal, icon: <Clock size={18} />, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center ${stat.color}`}>{stat.icon}</div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600"><Link size={18} /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalFiles}</p>
              <p className="text-xs text-gray-500">Files Attached</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600"><MessageSquare size={18} /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalFeedback}</p>
              <p className="text-xs text-gray-500">Feedback Comments</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-gray-400" />
              <div className="flex gap-1 flex-wrap">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                      filter === f.key ? 'bg-dogaBlue text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Not started</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Feedback</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Structure</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> In progress</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Completed</span>
            </div>
          </div>
          <div className="p-4" style={{ height: 480 }}>
            <ConceptMapDiv
              pages={pages}
              filteredNames={filteredNames}
              onSelect={setSelectedPage}
              selectedPage={selectedPage?.pageName ?? null}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredPages.map((page) => {
            const progress = computeProgress(page.phases);
            const status = getStatusInfo(page.phases);
            const fileCount = page.driveFiles.length + page.phases.reduce((s, p) => s + p.driveFiles.length, 0);
            return (
              <button
                key={page.pageName}
                onClick={() => setSelectedPage(page)}
                className="bg-white rounded-xl border border-gray-100 p-4 text-left shadow-sm hover:shadow-md hover:border-gray-200 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: getNodeColor(page.phases) }}>
                      {PAGE_ICONS[page.pageName]}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-dogaBlue transition-colors">{page.pageName}</h3>
                      <p className="text-[10px] text-gray-400">{page.department}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-dogaBlue transition-colors mt-1" />
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: getNodeColor(page.phases) }} />
                  </div>
                  <span className="text-xs font-bold text-gray-700">{progress}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${status.bgColor} ${status.color} ${status.borderColor}`}>
                    {status.label}
                  </div>
                  <div className="flex items-center gap-2">
                    {fileCount > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-blue-500">
                        <Link size={10} /> {fileCount}
                      </span>
                    )}
                    {page.feedback.length > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-indigo-500">
                        <MessageSquare size={10} /> {page.feedback.length}
                      </span>
                    )}
                    <div className="flex gap-1">
                      {page.phases.map((p) => (
                        <div key={p.id} className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          p.status === 'completed' ? 'bg-emerald-100' : p.status === 'in_progress' ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          {p.status === 'completed' ? <CheckCircle2 size={10} className="text-emerald-600" /> :
                           p.status === 'in_progress' ? <Clock size={10} className="text-blue-600" /> :
                           <AlertCircle size={10} className="text-gray-300" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {selectedPage && (
        <DetailPanel
          page={selectedPage}
          onClose={() => setSelectedPage(null)}
          editMode={editMode}
          onUpdatePhase={handleUpdatePhase}
          onUpdatePage={handleUpdatePage}
          onUpdatePhaseField={handleUpdatePhaseField}
        />
      )}

      {showExport && <ExportModal pages={pages} onClose={() => setShowExport(false)} />}
      {showImport && <ImportModal onImport={handleImport} onClose={() => setShowImport(false)} />}

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowResetConfirm(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 mb-2">Reset to defaults?</h3>
            <p className="text-sm text-gray-500 mb-4">This will discard all local changes, feedback, and attached files. This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={handleReset} className="flex-1 py-2 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-all">Reset</button>
              <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
