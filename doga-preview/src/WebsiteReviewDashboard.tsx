import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  RotateCcw,
  Copy,
  Check,
} from 'lucide-react';

type PhaseStatus = 'completed' | 'in_progress' | 'pending';

interface Phase {
  id: number;
  name: string;
  status: PhaseStatus;
  responsible: string;
  participants: string[];
  meetingMinutes?: string;
  document?: string;
  notes?: string;
}

interface PageData {
  pageName: string;
  department: string;
  owner: string;
  lastUpdate: string;
  phases: Phase[];
  nextAction?: string;
  category: 'product' | 'corporate' | 'engineering';
}

const DEFAULT_PAGES: PageData[] = [
  {
    pageName: 'Home',
    department: 'Global / Marketing',
    owner: 'Marketing Lead',
    lastUpdate: '2026-05-04',
    category: 'corporate',
    nextAction: 'Complete final copy review with Management.',
    phases: [
      { id: 1, name: 'Feedback collected', status: 'completed', responsible: 'Marketing Lead', participants: ['Management', 'Marketing'], meetingMinutes: 'MOM-HOME-001', notes: 'Global messaging and hero section aligned with brand strategy.' },
      { id: 2, name: 'Structure + UI visual layer', status: 'completed', responsible: 'UX/UI Team', participants: ['Marketing', 'Design'], document: 'FIGMA-HOME-V3', notes: 'Hero, value props, product showcase and CTA sections defined.' },
      { id: 3, name: 'Final text and detail review', status: 'in_progress', responsible: 'Management', participants: ['Marketing'], notes: 'Pending final validation of hero copy and CTA messaging.' },
    ],
  },
  {
    pageName: 'Wiper Systems',
    department: 'Wiper Systems',
    owner: 'Department Owner',
    lastUpdate: '2026-05-04',
    category: 'product',
    nextAction: 'Schedule final review meeting with Wiper Systems department.',
    phases: [
      { id: 1, name: 'Feedback collected', status: 'completed', responsible: 'Department Owner', participants: ['Wiper Systems Team'], meetingMinutes: 'MOM-WS-001', notes: 'Product range, applications and key differentiators documented.' },
      { id: 2, name: 'Structure + UI visual layer', status: 'completed', responsible: 'UX/UI Team', participants: ['Marketing', 'Product Team'], document: 'FIGMA-WS-V2', notes: 'Product catalog, specs table and application gallery structured.' },
      { id: 3, name: 'Final text and detail review', status: 'pending', responsible: 'Department Owner', participants: [], notes: 'Pending final validation of technical specs and product descriptions.' },
    ],
  },
  {
    pageName: 'Plastics',
    department: 'Plastics',
    owner: 'Department Owner',
    lastUpdate: '2026-05-04',
    category: 'product',
    nextAction: 'Complete UI structure and visual layer with design team.',
    phases: [
      { id: 1, name: 'Feedback collected', status: 'completed', responsible: 'Department Owner', participants: ['Plastics Team'], meetingMinutes: 'MOM-PL-001', notes: 'Injection molding capabilities and quality certifications reviewed.' },
      { id: 2, name: 'Structure + UI visual layer', status: 'in_progress', responsible: 'UX/UI Team', participants: ['Marketing'], document: 'FIGMA-PL-DRAFT', notes: 'Page structure in progress, pending visual assets from department.' },
      { id: 3, name: 'Final text and detail review', status: 'pending', responsible: 'Department Owner', participants: [], notes: 'Pending final validation of copy, technical claims and final web details.' },
    ],
  },
  {
    pageName: 'Drive Systems',
    department: 'Drive Systems',
    owner: 'Department Owner',
    lastUpdate: '2026-05-04',
    category: 'product',
    nextAction: 'Schedule final review meeting with Drive Systems department.',
    phases: [
      { id: 1, name: 'Feedback collected', status: 'completed', responsible: 'Department Owner', participants: ['Drive Systems Team'], meetingMinutes: 'MOM-DS-001', notes: 'Motor types, applications and performance data collected.' },
      { id: 2, name: 'Structure + UI visual layer', status: 'completed', responsible: 'UX/UI Team', participants: ['Marketing', 'Engineering'], document: 'FIGMA-DS-V2', notes: 'Product pages, comparison tools and specs layout defined.' },
      { id: 3, name: 'Final text and detail review', status: 'pending', responsible: 'Department Owner', participants: [], notes: 'Pending final validation of motor specs and application data.' },
    ],
  },
  {
    pageName: 'Electronics',
    department: 'Electronics',
    owner: 'Department Owner',
    lastUpdate: '2026-05-04',
    category: 'product',
    nextAction: 'Complete final text review with Electronics team.',
    phases: [
      { id: 1, name: 'Feedback collected', status: 'completed', responsible: 'Department Owner', participants: ['Electronics Team'], meetingMinutes: 'MOM-EL-001', notes: 'PCB capabilities, firmware features and integration specs documented.' },
      { id: 2, name: 'Structure + UI visual layer', status: 'completed', responsible: 'UX/UI Team', participants: ['Marketing', 'Engineering'], document: 'FIGMA-EL-V2', notes: 'Technical showcase, capability matrix and use cases structured.' },
      { id: 3, name: 'Final text and detail review', status: 'in_progress', responsible: 'Department Owner', participants: ['Electronics Team'], notes: 'Review in progress, validating firmware specs and integration details.' },
    ],
  },
  {
    pageName: 'R&D',
    department: 'R&D / Engineering',
    owner: 'R&D Lead',
    lastUpdate: '2026-05-04',
    category: 'engineering',
    nextAction: 'Schedule final review with R&D Lead.',
    phases: [
      { id: 1, name: 'Feedback collected', status: 'completed', responsible: 'R&D Lead', participants: ['R&D Team', 'Engineering'], meetingMinutes: 'MOM-RD-001', notes: 'Innovation pipeline, lab capabilities and patent portfolio reviewed.' },
      { id: 2, name: 'Structure + UI visual layer', status: 'completed', responsible: 'UX/UI Team', participants: ['Marketing', 'R&D'], document: 'FIGMA-RD-V2', notes: 'Innovation showcase, lab tour section and technology roadmap structured.' },
      { id: 3, name: 'Final text and detail review', status: 'pending', responsible: 'R&D Lead', participants: [], notes: 'Pending final validation of technical claims and patent references.' },
    ],
  },
  {
    pageName: 'About Us',
    department: 'Corporate',
    owner: 'Management / HR',
    lastUpdate: '2026-05-04',
    category: 'corporate',
    nextAction: 'Complete UI structure and schedule management review.',
    phases: [
      { id: 1, name: 'Feedback collected', status: 'completed', responsible: 'Management', participants: ['Management', 'HR'], meetingMinutes: 'MOM-AU-001', notes: 'Company history, values, team structure and milestones compiled.' },
      { id: 2, name: 'Structure + UI visual layer', status: 'in_progress', responsible: 'UX/UI Team', participants: ['Marketing'], document: 'FIGMA-AU-DRAFT', notes: 'Timeline layout, team section and values block in design phase.' },
      { id: 3, name: 'Final text and detail review', status: 'pending', responsible: 'Management', participants: [], notes: 'Pending final management approval of company narrative.' },
    ],
  },
  {
    pageName: 'Careers',
    department: 'HR',
    owner: 'HR Lead',
    lastUpdate: '2026-05-04',
    category: 'corporate',
    nextAction: 'Initiate feedback collection with HR department.',
    phases: [
      { id: 1, name: 'Feedback collected', status: 'pending', responsible: 'HR Lead', participants: [], notes: 'Pending: need to schedule initial feedback meeting with HR.' },
      { id: 2, name: 'Structure + UI visual layer', status: 'pending', responsible: 'UX/UI Team', participants: [], notes: 'Blocked by Phase 1 completion.' },
      { id: 3, name: 'Final text and detail review', status: 'pending', responsible: 'HR Lead', participants: [], notes: 'Blocked by Phase 1 and 2 completion.' },
    ],
  },
  {
    pageName: 'Sustainability',
    department: 'Sustainability / Corporate',
    owner: 'Sustainability Lead',
    lastUpdate: '2026-05-04',
    category: 'corporate',
    nextAction: 'Begin UI structure design with collected feedback.',
    phases: [
      { id: 1, name: 'Feedback collected', status: 'completed', responsible: 'Sustainability Lead', participants: ['Sustainability Team', 'Marketing'], meetingMinutes: 'MOM-SU-001', notes: 'ESG goals, certifications and sustainability initiatives documented.' },
      { id: 2, name: 'Structure + UI visual layer', status: 'pending', responsible: 'UX/UI Team', participants: [], notes: 'Pending: visual layer not started yet.' },
      { id: 3, name: 'Final text and detail review', status: 'pending', responsible: 'Sustainability Lead', participants: [], notes: 'Blocked by Phase 2 completion.' },
    ],
  },
];

const STORAGE_KEY = 'doga-review-state-v1';

function loadState(): PageData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PAGES;
    const saved = JSON.parse(raw) as PageData[];
    return DEFAULT_PAGES.map((def) => {
      const found = saved.find((s) => s.pageName === def.pageName);
      if (!found) return def;
      return {
        ...def,
        lastUpdate: found.lastUpdate,
        phases: def.phases.map((ph) => {
          const savedPh = found.phases.find((p) => p.id === ph.id);
          return savedPh ? { ...ph, status: savedPh.status } : ph;
        }),
      };
    });
  } catch {
    return DEFAULT_PAGES;
  }
}

function saveState(pages: PageData[]) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      pages.map((p) => ({
        pageName: p.pageName,
        lastUpdate: p.lastUpdate,
        phases: p.phases.map((ph) => ({ id: ph.id, status: ph.status })),
      }))
    )
  );
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

function PhaseTimeline({
  phases,
  editMode,
  onUpdatePhase,
}: {
  phases: Phase[];
  editMode: boolean;
  onUpdatePhase?: (phaseId: number, status: PhaseStatus) => void;
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
                    <span className="text-[9px] text-gray-400 italic">click to advance →</span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-700 mb-2">{phase.name}</p>
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
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DetailPanel({
  page,
  onClose,
  editMode,
  onUpdatePhase,
}: {
  page: PageData;
  onClose: () => void;
  editMode: boolean;
  onUpdatePhase: (pageName: string, phaseId: number, status: PhaseStatus) => void;
}) {
  const progress = computeProgress(page.phases);
  const status = getStatusInfo(page.phases);
  const completedCount = page.phases.filter((p) => p.status === 'completed').length;
  const pendingPhases = page.phases.filter((p) => p.status !== 'completed');

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-white shadow-2xl overflow-y-auto animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
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

        <div className="p-6 space-y-6">
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
              <div>
                <p className="text-xs text-gray-400">Owner</p>
                <p className="font-medium">{page.owner}</p>
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

          {page.nextAction && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="text-sm font-bold text-blue-800 mb-1 flex items-center gap-2">
                <ArrowRight size={14} />
                Next Action
              </h4>
              <p className="text-xs text-blue-700">{page.nextAction}</p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-2">All Participants</h4>
            <div className="flex flex-wrap gap-1.5">
              {Array.from(new Set(page.phases.flatMap((p) => [p.responsible, ...p.participants]).filter(Boolean))).map((name) => (
                <span key={name} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{name}</span>
              ))}
            </div>
          </div>
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
        <p className="text-[7px] text-gray-400 font-medium">{completedCount}/3</p>
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
  const json = JSON.stringify(
    pages.map((p) => ({
      pageName: p.pageName,
      phases: p.phases.map((ph) => ({ id: ph.id, name: ph.name, status: ph.status })),
    })),
    null,
    2
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Export Current State</h2>
            <p className="text-xs text-gray-400 mt-0.5">Copy and share with your team to sync progress</p>
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
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition-all">
            Close
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

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setPages(DEFAULT_PAGES);
    setSelectedPage(null);
    setShowResetConfirm(false);
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
    return { total, avgProgress, completed, pendingFinal };
  }, [pages]);

  const hasLocalChanges = useMemo(() => {
    return JSON.stringify(pages.map(p => p.phases.map(ph => ph.status))) !==
           JSON.stringify(DEFAULT_PAGES.map(p => p.phases.map(ph => ph.status)));
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
                <p className="text-[10px] text-gray-400 mt-0.5">Concept map of page review progress across departments</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasLocalChanges && (
                <span className="hidden sm:flex text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-2 py-1 rounded-full font-medium items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Local changes saved
                </span>
              )}
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
          Edit mode is active — open any page and click the phase icons to update their status. Changes are saved automatically in your browser.
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
        />
      )}

      {showExport && <ExportModal pages={pages} onClose={() => setShowExport(false)} />}

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowResetConfirm(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 mb-2">Reset to defaults?</h3>
            <p className="text-sm text-gray-500 mb-4">This will discard all local changes and restore the original data. This cannot be undone.</p>
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
