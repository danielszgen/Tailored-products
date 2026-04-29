import React from 'react';
import {
	AbsoluteFill,
	Sequence,
	useCurrentFrame,
	useVideoConfig,
	interpolate,
	spring,
	random,
} from 'remotion';

// ── Brand Colors ──
const COLORS = {
	red: '#E40000',
	redGlow: '#FF2020',
	darkCharcoal: '#1A1A2E',
	deepBlack: '#0D0D1A',
	white: '#FFFFFF',
	lightGray: '#F9F9F9',
	silver: '#B0B0C0',
	redAlpha: 'rgba(228, 0, 0, 0.15)',
	redAlpha2: 'rgba(228, 0, 0, 0.08)',
};

// ── Infinite Grid Background ──
const InfiniteGrid: React.FC = () => {
	const frame = useCurrentFrame();
	const offsetY = (frame * 1.2) % 80;
	const offsetX = (frame * 0.6) % 80;

	return (
		<AbsoluteFill style={{overflow: 'hidden'}}>
			<svg width="100%" height="100%" style={{position: 'absolute'}}>
				<defs>
					<pattern
						id="grid"
						width="80"
						height="80"
						patternUnits="userSpaceOnUse"
						patternTransform={`translate(${offsetX}, ${offsetY})`}
					>
						<path
							d="M 80 0 L 0 0 0 80"
							fill="none"
							stroke="rgba(228, 0, 0, 0.06)"
							strokeWidth="1"
						/>
					</pattern>
				</defs>
				<rect width="100%" height="100%" fill="url(#grid)" />
			</svg>
		</AbsoluteFill>
	);
};

// ── Floating Particles ──
const Particle: React.FC<{
	seed: string;
	size: number;
	speed: number;
	color: string;
	startX: number;
	startY: number;
}> = ({seed, size, speed, color, startX, startY}) => {
	const frame = useCurrentFrame();
	const wobble = Math.sin((frame + random(seed) * 100) * 0.03) * 30;
	const y = startY - frame * speed;
	const x = startX + wobble;
	const opacity = interpolate(
		y,
		[-100, 200, 900, 1100],
		[0, 0.6, 0.6, 0],
		{extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
	);

	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y % 1200 < 0 ? (y % 1200) + 1200 : y % 1200,
				width: size,
				height: size,
				borderRadius: '50%',
				background: color,
				opacity,
				filter: `blur(${size > 8 ? 0 : 1}px)`,
				boxShadow: `0 0 ${size * 2}px ${color}`,
			}}
		/>
	);
};

const FloatingParticles: React.FC = () => {
	const particles = Array.from({length: 25}, (_, i) => ({
		seed: `p-${i}`,
		size: 3 + random(`size-${i}`) * 8,
		speed: 0.3 + random(`speed-${i}`) * 1.2,
		color:
			random(`color-${i}`) > 0.6
				? COLORS.red
				: `rgba(180, 180, 220, ${0.3 + random(`alpha-${i}`) * 0.4})`,
		startX: random(`x-${i}`) * 1920,
		startY: random(`y-${i}`) * 1200,
	}));

	return (
		<AbsoluteFill style={{overflow: 'hidden'}}>
			{particles.map((p) => (
				<Particle key={p.seed} {...p} />
			))}
		</AbsoluteFill>
	);
};

// ── Flying Gear Shape ──
const GearShape: React.FC<{
	delay: number;
	x: number;
	y: number;
	size: number;
	rotSpeed: number;
	color: string;
}> = ({delay, x, y, size, rotSpeed, color}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const scaleSpring = spring({
		fps,
		frame: frame - delay,
		config: {damping: 14, stiffness: 120},
	});

	const rotation = frame * rotSpeed;
	const floatY = Math.sin(frame * 0.04) * 10;

	const teeth = 8;
	const outerR = size / 2;
	const innerR = outerR * 0.7;
	const holeR = outerR * 0.3;

	let path = '';
	for (let i = 0; i < teeth * 2; i++) {
		const angle = (i * Math.PI) / teeth;
		const r = i % 2 === 0 ? outerR : innerR;
		const px = outerR + r * Math.cos(angle);
		const py = outerR + r * Math.sin(angle);
		path += i === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`;
	}
	path += ' Z';

	return (
		<div
			style={{
				position: 'absolute',
				left: x - size / 2,
				top: y - size / 2 + floatY,
				width: size,
				height: size,
				transform: `scale(${scaleSpring}) rotate(${rotation}deg)`,
				opacity: scaleSpring * 0.25,
			}}
		>
			<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
				<path d={path} fill="none" stroke={color} strokeWidth="1.5" />
				<circle
					cx={outerR}
					cy={outerR}
					r={holeR}
					fill="none"
					stroke={color}
					strokeWidth="1"
				/>
			</svg>
		</div>
	);
};

// ── Horizontal Line Accent ──
const AccentLine: React.FC<{
	delay: number;
	y: number;
	fromLeft?: boolean;
	color?: string;
}> = ({delay, y, fromLeft = true, color = COLORS.red}) => {
	const frame = useCurrentFrame();
	const width = interpolate(frame - delay, [0, 30], [0, 400], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const opacity = interpolate(frame - delay, [0, 10, 80, 100], [0, 0.8, 0.8, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<div
			style={{
				position: 'absolute',
				top: y,
				left: fromLeft ? 0 : undefined,
				right: fromLeft ? undefined : 0,
				height: 2,
				width,
				background: `linear-gradient(${fromLeft ? '90deg' : '270deg'}, ${color}, transparent)`,
				opacity,
			}}
		/>
	);
};

// ── Animated Text Block ──
const RevealText: React.FC<{
	text: string;
	fontSize: number;
	color?: string;
	fontWeight?: number;
	letterSpacing?: number;
	textTransform?: 'uppercase' | 'none';
	maxWidth?: number;
	textAlign?: 'center' | 'left';
	lineHeight?: number;
}> = ({
	text,
	fontSize,
	color = COLORS.white,
	fontWeight = 700,
	letterSpacing = 0,
	textTransform = 'none',
	maxWidth,
	textAlign = 'center',
	lineHeight = 1.2,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const s = spring({fps, frame, config: {damping: 18, stiffness: 90}});
	const opacity = interpolate(frame, [0, 15], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const y = interpolate(s, [0, 1], [50, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<div
			style={{
				fontSize,
				fontWeight,
				color,
				fontFamily: "'Montserrat', Arial, Helvetica, sans-serif",
				textAlign,
				opacity,
				transform: `translateY(${y}px)`,
				letterSpacing,
				textTransform,
				maxWidth,
				lineHeight,
			}}
		>
			{text}
		</div>
	);
};

// ── Stat Counter ──
const StatBlock: React.FC<{
	value: string;
	label: string;
	index: number;
}> = ({value, label, index}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const s = spring({
		fps,
		frame: frame - index * 8,
		config: {damping: 16, stiffness: 100},
	});

	const opacity = interpolate(frame - index * 8, [0, 15], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				opacity,
				transform: `scale(${s})`,
				padding: '0 50px',
			}}
		>
			<div
				style={{
					fontSize: 72,
					fontWeight: 800,
					color: COLORS.red,
					fontFamily: "'Montserrat', Arial, sans-serif",
					lineHeight: 1,
				}}
			>
				{value}
			</div>
			<div
				style={{
					fontSize: 18,
					color: COLORS.silver,
					fontFamily: "'Montserrat', Arial, sans-serif",
					textTransform: 'uppercase',
					letterSpacing: 3,
					marginTop: 12,
				}}
			>
				{label}
			</div>
		</div>
	);
};

// ── Market Sector Pill ──
const MarketPill: React.FC<{
	label: string;
	index: number;
	x: number;
	y: number;
}> = ({label, index, x, y}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const s = spring({
		fps,
		frame: frame - index * 4,
		config: {damping: 14, stiffness: 80},
	});

	const floatY = Math.sin((frame + index * 20) * 0.05) * 6;

	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y + floatY,
				transform: `scale(${s})`,
				padding: '14px 28px',
				borderRadius: 50,
				border: `1.5px solid ${COLORS.red}`,
				background: 'rgba(228, 0, 0, 0.08)',
				color: COLORS.white,
				fontSize: 16,
				fontWeight: 600,
				fontFamily: "'Montserrat', Arial, sans-serif",
				letterSpacing: 1,
				whiteSpace: 'nowrap',
				backdropFilter: 'blur(4px)',
			}}
		>
			{label}
		</div>
	);
};

// ── Product Card ──
const ProductCard: React.FC<{
	title: string;
	desc: string;
	index: number;
}> = ({title, desc, index}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const s = spring({
		fps,
		frame: frame - index * 10,
		config: {damping: 16, stiffness: 90},
	});

	const x = interpolate(s, [0, 1], [120, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<div
			style={{
				opacity: s,
				transform: `translateX(${x}px)`,
				padding: '30px 36px',
				borderRadius: 16,
				border: `1px solid rgba(228, 0, 0, 0.2)`,
				background:
					'linear-gradient(135deg, rgba(228, 0, 0, 0.06) 0%, rgba(26, 26, 46, 0.8) 100%)',
				marginBottom: 20,
				width: 500,
				backdropFilter: 'blur(8px)',
			}}
		>
			<div
				style={{
					fontSize: 26,
					fontWeight: 700,
					color: COLORS.white,
					fontFamily: "'Montserrat', Arial, sans-serif",
					marginBottom: 8,
				}}
			>
				{title}
			</div>
			<div
				style={{
					fontSize: 15,
					color: COLORS.silver,
					fontFamily: "'Montserrat', Arial, sans-serif",
					lineHeight: 1.5,
				}}
			>
				{desc}
			</div>
		</div>
	);
};

// ── Pulsing Ring ──
const PulsingRing: React.FC<{x: number; y: number; delay: number; size: number}> = ({
	x,
	y,
	delay,
	size,
}) => {
	const frame = useCurrentFrame();
	const cycle = (frame - delay) % 90;
	const scale = interpolate(cycle, [0, 90], [0.5, 2.5], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const opacity = interpolate(cycle, [0, 60, 90], [0.4, 0.1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<div
			style={{
				position: 'absolute',
				left: x - size / 2,
				top: y - size / 2,
				width: size,
				height: size,
				borderRadius: '50%',
				border: `2px solid ${COLORS.red}`,
				transform: `scale(${scale})`,
				opacity: frame > delay ? opacity : 0,
			}}
		/>
	);
};

// ══════════════════════════════════════════════
// ██ MAIN COMPOSITION
// ══════════════════════════════════════════════

export const MyComp: React.FC = () => {
	const frame = useCurrentFrame();

	// Global background gradient shift
	const bgShift = interpolate(frame, [0, 600], [0, 20], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<AbsoluteFill
			style={{
				background: `radial-gradient(ellipse at 50% 40%, hsl(${240 + bgShift}, 30%, 12%) 0%, ${COLORS.deepBlack} 70%)`,
				overflow: 'hidden',
			}}
		>
			{/* ── LAYER 0: Infinite Grid ── */}
			<InfiniteGrid />
			<FloatingParticles />

			{/* ── LAYER 1: Decorative Gears (always visible, rotating) ── */}
			<AbsoluteFill>
				<GearShape delay={0} x={150} y={200} size={180} rotSpeed={0.3} color={COLORS.red} />
				<GearShape delay={5} x={1780} y={150} size={140} rotSpeed={-0.4} color={COLORS.silver} />
				<GearShape delay={10} x={1650} y={850} size={200} rotSpeed={0.2} color={COLORS.red} />
				<GearShape delay={15} x={250} y={800} size={120} rotSpeed={-0.5} color={COLORS.silver} />
				<GearShape delay={8} x={960} y={60} size={100} rotSpeed={0.6} color="rgba(228,0,0,0.5)" />
				<GearShape delay={20} x={500} y={950} size={160} rotSpeed={-0.25} color="rgba(180,180,220,0.3)" />
			</AbsoluteFill>

			{/* ── LAYER 2: Pulsing Rings ── */}
			<AbsoluteFill>
				<PulsingRing x={960} y={540} delay={0} size={80} />
				<PulsingRing x={300} y={400} delay={30} size={50} />
				<PulsingRing x={1600} y={600} delay={60} size={60} />
			</AbsoluteFill>

			{/* ═══════════════════════════════════════
			    SCENE 1: HERO — "When Performance Meets Precision"
			    Frames 0–120 (0–4s)
			    ═══════════════════════════════════════ */}
			<Sequence from={0} durationInFrames={120}>
				<AbsoluteFill
					style={{justifyContent: 'center', alignItems: 'center'}}
				>
					{/* DOGA wordmark */}
					<Sequence from={5}>
						<AbsoluteFill
							style={{
								justifyContent: 'center',
								alignItems: 'center',
								marginTop: -180,
							}}
						>
							<RevealText
								text="DOGA"
								fontSize={28}
								color={COLORS.red}
								fontWeight={800}
								letterSpacing={14}
								textTransform="uppercase"
							/>
						</AbsoluteFill>
					</Sequence>

					{/* Main headline */}
					<Sequence from={15}>
						<AbsoluteFill
							style={{
								justifyContent: 'center',
								alignItems: 'center',
								marginTop: -40,
							}}
						>
							<RevealText
								text="When Performance"
								fontSize={82}
								fontWeight={800}
								letterSpacing={-2}
							/>
						</AbsoluteFill>
					</Sequence>

					<Sequence from={25}>
						<AbsoluteFill
							style={{
								justifyContent: 'center',
								alignItems: 'center',
								marginTop: 70,
							}}
						>
							<RevealText
								text="Meets Precision"
								fontSize={82}
								color={COLORS.red}
								fontWeight={800}
								letterSpacing={-2}
							/>
						</AbsoluteFill>
					</Sequence>

					{/* Subtitle */}
					<Sequence from={45}>
						<AbsoluteFill
							style={{
								justifyContent: 'center',
								alignItems: 'center',
								marginTop: 200,
							}}
						>
							<RevealText
								text="DRIVE SYSTEMS DIVISION"
								fontSize={20}
								color={COLORS.silver}
								fontWeight={500}
								letterSpacing={10}
								textTransform="uppercase"
							/>
						</AbsoluteFill>
					</Sequence>

					{/* Accent lines */}
					<AccentLine delay={30} y={480} fromLeft />
					<AccentLine delay={35} y={600} fromLeft={false} />
				</AbsoluteFill>
			</Sequence>

			{/* ═══════════════════════════════════════
			    SCENE 2: VALUE PROP
			    Frames 120–240 (4–8s)
			    ═══════════════════════════════════════ */}
			<Sequence from={120} durationInFrames={120}>
				<AbsoluteFill
					style={{justifyContent: 'center', alignItems: 'center'}}
				>
					<Sequence from={5}>
						<AbsoluteFill
							style={{
								justifyContent: 'center',
								alignItems: 'center',
								marginTop: -120,
							}}
						>
							<RevealText
								text="Electric DC Motors"
								fontSize={64}
								fontWeight={800}
								letterSpacing={-1}
							/>
						</AbsoluteFill>
					</Sequence>

					<Sequence from={18}>
						<AbsoluteFill
							style={{
								justifyContent: 'center',
								alignItems: 'center',
								marginTop: 0,
							}}
						>
							<RevealText
								text="Engineered for Infinite Possibilities"
								fontSize={36}
								color={COLORS.silver}
								fontWeight={400}
								letterSpacing={1}
							/>
						</AbsoluteFill>
					</Sequence>

					{/* Divider line */}
					<Sequence from={30}>
						<AbsoluteFill
							style={{justifyContent: 'center', alignItems: 'center'}}
						>
							<DividerLine />
						</AbsoluteFill>
					</Sequence>

					<Sequence from={40}>
						<AbsoluteFill
							style={{
								justifyContent: 'center',
								alignItems: 'center',
								marginTop: 140,
							}}
						>
							<RevealText
								text="Over 60 years manufacturing precision DC motors — customizable, sustainable, intelligent."
								fontSize={22}
								color="rgba(255,255,255,0.7)"
								fontWeight={400}
								maxWidth={800}
								lineHeight={1.7}
							/>
						</AbsoluteFill>
					</Sequence>

					<AccentLine delay={25} y={350} fromLeft />
					<AccentLine delay={28} y={720} fromLeft={false} />
				</AbsoluteFill>
			</Sequence>

			{/* ═══════════════════════════════════════
			    SCENE 3: STATS
			    Frames 240–360 (8–12s)
			    ═══════════════════════════════════════ */}
			<Sequence from={240} durationInFrames={120}>
				<AbsoluteFill
					style={{justifyContent: 'center', alignItems: 'center'}}
				>
					<Sequence from={0}>
						<AbsoluteFill
							style={{
								justifyContent: 'center',
								alignItems: 'center',
								marginTop: -60,
							}}
						>
							<div style={{display: 'flex', gap: 80}}>
								<StatBlock value="60+" label="Years of Expertise" index={0} />
								<StatBlock value="1500W" label="Max Power Output" index={1} />
								<StatBlock value="12" label="Market Sectors" index={2} />
								<StatBlock value="308:1" label="Gear Ratios" index={3} />
							</div>
						</AbsoluteFill>
					</Sequence>

					<Sequence from={50}>
						<AbsoluteFill
							style={{
								justifyContent: 'center',
								alignItems: 'center',
								marginTop: 120,
							}}
						>
							<RevealText
								text="Motors Built for the Future, Designed for the Planet"
								fontSize={26}
								color={COLORS.silver}
								fontWeight={400}
								letterSpacing={1}
							/>
						</AbsoluteFill>
					</Sequence>
				</AbsoluteFill>
			</Sequence>

			{/* ═══════════════════════════════════════
			    SCENE 4: MARKETS
			    Frames 360–480 (12–16s)
			    ═══════════════════════════════════════ */}
			<Sequence from={360} durationInFrames={120}>
				<AbsoluteFill>
					<Sequence from={0}>
						<AbsoluteFill
							style={{
								justifyContent: 'center',
								alignItems: 'center',
								marginTop: -280,
							}}
						>
							<RevealText
								text="Powering Every Industry"
								fontSize={52}
								fontWeight={800}
								letterSpacing={-1}
							/>
						</AbsoluteFill>
					</Sequence>

					<Sequence from={15}>
						<AbsoluteFill>
							<MarketPill label="Precision Farming" index={0} x={180} y={380} />
							<MarketPill label="Accessibility" index={1} x={520} y={350} />
							<MarketPill label="Energy" index={2} x={800} y={390} />
							<MarketPill label="Automotive" index={3} x={1020} y={355} />
							<MarketPill label="Marine" index={4} x={1320} y={380} />
							<MarketPill label="Robotics" index={5} x={1540} y={355} />
							<MarketPill label="Special Vehicles" index={6} x={240} y={480} />
							<MarketPill label="Industrial Systems" index={7} x={580} y={500} />
							<MarketPill label="Medical & Lab" index={8} x={920} y={485} />
							<MarketPill label="Building & Security" index={9} x={1220} y={500} />
							<MarketPill label="Lifestyle" index={10} x={360} y={590} />
							<MarketPill label="Reduced Mobility" index={11} x={660} y={600} />
						</AbsoluteFill>
					</Sequence>
				</AbsoluteFill>
			</Sequence>

			{/* ═══════════════════════════════════════
			    SCENE 5: PRODUCTS
			    Frames 480–600 (16–20s)
			    ═══════════════════════════════════════ */}
			<Sequence from={480} durationInFrames={120}>
				<AbsoluteFill>
					<Sequence from={0}>
						<AbsoluteFill
							style={{
								justifyContent: 'center',
								alignItems: 'flex-start',
								paddingLeft: 160,
								marginTop: -200,
							}}
						>
							<RevealText
								text="Product Ecosystem"
								fontSize={52}
								fontWeight={800}
								letterSpacing={-1}
								textAlign="left"
							/>
						</AbsoluteFill>
					</Sequence>

					<Sequence from={10}>
						<AbsoluteFill
							style={{
								justifyContent: 'center',
								paddingLeft: 160,
								marginTop: 40,
							}}
						>
							<div style={{display: 'flex', gap: 30}}>
								<div>
									<ProductCard
										title="Brushed DC Motors"
										desc="Permanent magnet — 2.5W to 1,500W, 12V to 110V"
										index={0}
									/>
									<ProductCard
										title="Brushless BLDC"
										desc="High efficiency, low maintenance, intelligent control"
										index={1}
									/>
								</div>
								<div>
									<ProductCard
										title="Planetary Gearboxes"
										desc="Ratios from 4:1 to 308:1 — higher torque, smoother motion"
										index={2}
									/>
									<ProductCard
										title="Encoders & Brakes"
										desc="Precision positioning with holding torque up to 1.5Nm"
										index={3}
									/>
								</div>
							</div>
						</AbsoluteFill>
					</Sequence>
				</AbsoluteFill>
			</Sequence>

			{/* ═══════════════════════════════════════
			    SCENE 6: CLOSING — "Future in Motion"
			    Frames 600–720 (20–24s)
			    ═══════════════════════════════════════ */}
			<Sequence from={600} durationInFrames={120}>
				<AbsoluteFill
					style={{justifyContent: 'center', alignItems: 'center'}}
				>
					<Sequence from={10}>
						<AbsoluteFill
							style={{
								justifyContent: 'center',
								alignItems: 'center',
								marginTop: -60,
							}}
						>
							<RevealText
								text="Future in Motion"
								fontSize={96}
								fontWeight={800}
								letterSpacing={-3}
							/>
						</AbsoluteFill>
					</Sequence>

					<Sequence from={30}>
						<AbsoluteFill
							style={{
								justifyContent: 'center',
								alignItems: 'center',
								marginTop: 80,
							}}
						>
							<CtaButton />
						</AbsoluteFill>
					</Sequence>

					<Sequence from={20}>
						<AbsoluteFill
							style={{
								justifyContent: 'center',
								alignItems: 'center',
								marginTop: 220,
							}}
						>
							<RevealText
								text="doga.es"
								fontSize={20}
								color={COLORS.silver}
								fontWeight={400}
								letterSpacing={4}
								textTransform="uppercase"
							/>
						</AbsoluteFill>
					</Sequence>

					<AccentLine delay={20} y={400} fromLeft color={COLORS.red} />
					<AccentLine delay={25} y={680} fromLeft={false} color={COLORS.red} />
				</AbsoluteFill>
			</Sequence>

			{/* ── Scene transition overlays (fade between scenes) ── */}
			<SceneFade at={110} />
			<SceneFade at={230} />
			<SceneFade at={350} />
			<SceneFade at={470} />
			<SceneFade at={590} />

			{/* ── Top/Bottom subtle vignette ── */}
			<AbsoluteFill style={{pointerEvents: 'none'}}>
				<div
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						height: 200,
						background:
							'linear-gradient(to bottom, rgba(13,13,26,0.7), transparent)',
					}}
				/>
				<div
					style={{
						position: 'absolute',
						bottom: 0,
						left: 0,
						right: 0,
						height: 200,
						background:
							'linear-gradient(to top, rgba(13,13,26,0.7), transparent)',
					}}
				/>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// ── Divider Line ──
const DividerLine: React.FC = () => {
	const frame = useCurrentFrame();
	const width = interpolate(frame, [0, 30], [0, 120], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<div
			style={{
				width,
				height: 3,
				backgroundColor: COLORS.red,
				borderRadius: 2,
				marginTop: 60,
				boxShadow: `0 0 20px ${COLORS.red}`,
			}}
		/>
	);
};

// ── CTA Button ──
const CtaButton: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const s = spring({fps, frame, config: {damping: 16, stiffness: 80}});
	const glowPulse = 0.6 + Math.sin(frame * 0.1) * 0.4;

	return (
		<div
			style={{
				padding: '20px 60px',
				borderRadius: 8,
				background: COLORS.red,
				color: COLORS.white,
				fontSize: 22,
				fontWeight: 700,
				fontFamily: "'Montserrat', Arial, sans-serif",
				letterSpacing: 3,
				textTransform: 'uppercase',
				transform: `scale(${s})`,
				boxShadow: `0 0 ${40 * glowPulse}px ${COLORS.red}80, 0 0 ${80 * glowPulse}px ${COLORS.red}40`,
			}}
		>
			Discover Products
		</div>
	);
};

// ── Scene Fade Transition ──
const SceneFade: React.FC<{at: number}> = ({at}) => {
	const frame = useCurrentFrame();
	const opacity = interpolate(frame, [at, at + 10, at + 20, at + 30], [0, 1, 1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<AbsoluteFill
			style={{
				backgroundColor: COLORS.deepBlack,
				opacity,
				pointerEvents: 'none',
			}}
		/>
	);
};
