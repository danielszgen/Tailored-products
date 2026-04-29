// Title data for the presenter video about direct-drive hub motors
// Video: Test_1_with_captions.mp4 — 1920x1080, 25fps, 144s
// Transcript markers: 0:00, 1:01, 2:09

const f = (seconds: number): number => Math.round(seconds * 25);

export type Side = 'left' | 'right';

export interface Title {
	side: Side;
	category: string; // small label — e.g. "01 / INTRO"
	keyword: string; // main large word(s)
	sublabel?: string; // optional context line
	startFrame: number;
	durationInFrames: number;
}

// Total video duration ~2:30 (4500 frames at 30fps)
export const titles: Title[] = [
	// ── Section 1: Intro (0:00 – 0:25) ──
	{
		side: 'left',
		category: '01 / THE QUESTION',
		keyword: 'HUB MOTOR',
		sublabel: 'Not all are created equal',
		startFrame: f(2),
		durationInFrames: f(6),
	},
	{
		side: 'right',
		category: 'FOCUS',
		keyword: 'DIRECT-DRIVE',
		sublabel: 'A different architecture',
		startFrame: f(9),
		durationInFrames: f(7),
	},
	{
		side: 'left',
		category: 'BUILT FOR',
		keyword: 'URBAN · CARGO',
		sublabel: 'Commercial e-bike platforms',
		startFrame: f(17),
		durationInFrames: f(7),
	},

	// ── Section 2: Definition (0:25 – 0:45) ──
	{
		side: 'right',
		category: '02 / DEFINITION',
		keyword: 'GEARLESS',
		sublabel: 'Integrated into the wheel hub',
		startFrame: f(26),
		durationInFrames: f(7),
	},
	{
		side: 'left',
		category: 'KEY PRINCIPLE',
		keyword: 'NO REDUCTION GEARS',
		sublabel: 'Between motor and wheel',
		startFrame: f(34),
		durationInFrames: f(7),
	},
	{
		side: 'right',
		category: 'DELIVERY',
		keyword: 'DIRECT POWER',
		sublabel: 'Simpler by design',
		startFrame: f(42),
		durationInFrames: f(6),
	},

	// ── Section 3: Characteristics (0:45 – 1:00) ──
	{
		side: 'left',
		category: '03 / CHARACTER',
		keyword: 'SMOOTHER',
		startFrame: f(50),
		durationInFrames: f(4),
	},
	{
		side: 'right',
		category: '',
		keyword: 'QUIETER',
		startFrame: f(53),
		durationInFrames: f(4),
	},
	{
		side: 'left',
		category: '',
		keyword: 'MECHANICALLY SIMPLER',
		startFrame: f(56),
		durationInFrames: f(4),
	},
	{
		side: 'right',
		category: 'EXCLUSIVE FEATURE',
		keyword: 'REGENERATIVE BRAKING',
		sublabel: 'Hard to achieve in geared systems',
		startFrame: f(60),
		durationInFrames: f(7),
	},

	// ── Section 4: Why it matters (0:55 – 1:01) ──
	{
		side: 'left',
		category: '04 / WHY IT MATTERS',
		keyword: 'NEVER JUST POWER',
		sublabel: 'Motor choice shapes everything',
		startFrame: f(68),
		durationInFrames: f(7),
	},

	// ── Section 5: Factors (1:01 – 1:20) ──
	{
		side: 'right',
		category: 'IT AFFECTS',
		keyword: 'MAINTENANCE',
		startFrame: f(77),
		durationInFrames: f(4),
	},
	{
		side: 'left',
		category: '',
		keyword: 'RIDE FEEL',
		startFrame: f(80),
		durationInFrames: f(4),
	},
	{
		side: 'right',
		category: '',
		keyword: 'INTEGRATION',
		startFrame: f(83),
		durationInFrames: f(4),
	},
	{
		side: 'left',
		category: 'LONG-TERM',
		keyword: 'DURABILITY',
		sublabel: 'Customer experience, daily use',
		startFrame: f(86),
		durationInFrames: f(6),
	},

	// ── Section 6: Urban mobility (1:20 – 1:50) ──
	{
		side: 'right',
		category: '05 / REAL-WORLD USE',
		keyword: 'FLEETS',
		startFrame: f(95),
		durationInFrames: f(4),
	},
	{
		side: 'left',
		category: '',
		keyword: 'DELIVERY BIKES',
		startFrame: f(98),
		durationInFrames: f(4),
	},
	{
		side: 'right',
		category: '',
		keyword: 'HEAVY-DUTY PLATFORMS',
		startFrame: f(101),
		durationInFrames: f(5),
	},
	{
		side: 'left',
		category: 'DEMANDS',
		keyword: 'CONSISTENT PERFORMANCE',
		sublabel: 'Fewer wear components',
		startFrame: f(106),
		durationInFrames: f(7),
	},
	{
		side: 'right',
		category: 'OVER TIME',
		keyword: 'PREDICTABLE BEHAVIOR',
		sublabel: 'Serious engineering option',
		startFrame: f(114),
		durationInFrames: f(7),
	},

	// ── Section 7: Conclusion (1:50 – 2:09) ──
	{
		side: 'left',
		category: '06 / THE RIGHT CHOICE',
		keyword: 'DEPENDS ON CONTEXT',
		sublabel: 'Product · rider · environment',
		startFrame: f(122),
		durationInFrames: f(7),
	},
	{
		side: 'right',
		category: 'IF YOU PRIORITIZE',
		keyword: 'SIMPLICITY',
		startFrame: f(130),
		durationInFrames: f(4),
	},
	{
		side: 'left',
		category: '',
		keyword: 'LOW COMPLEXITY',
		startFrame: f(133),
		durationInFrames: f(4),
	},
	{
		side: 'right',
		category: '',
		keyword: 'SMOOTH SUPPORT',
		startFrame: f(136),
		durationInFrames: f(4),
	},

	// ── Section 8: Final (2:09 – end) ──
	{
		side: 'left',
		category: '07 / THE KEY POINT',
		keyword: 'DIFFERENT PHILOSOPHY',
		sublabel: 'Not just another motor type',
		startFrame: f(142),
		durationInFrames: f(8),
	},
	{
		side: 'right',
		category: 'UNLOCK',
		keyword: 'MAJOR ADVANTAGES',
		sublabel: 'For the right e-bike platform',
		startFrame: f(151),
		durationInFrames: f(8),
	},
];
