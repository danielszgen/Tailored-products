import React from 'react';
import {
	AbsoluteFill,
	Sequence,
	useCurrentFrame,
	useVideoConfig,
	interpolate,
	spring,
} from 'remotion';
import {Title, titles as defaultTitles} from './presenterTitleData';

interface CinematicTitlesAvenirProps {
	titles: Title[];
}

// ── Avenir variant of the cinematic pop-light title ──
// Same luminous halo + reveal pacing, but with the clean
// geometric Avenir family instead of italic serif.

const CinematicAvenirCard: React.FC<{title: Title}> = ({title}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {keyword, sublabel, durationInFrames} = title;

	const s = spring({
		fps,
		frame,
		config: {damping: 28, stiffness: 85, mass: 1},
	});

	const fadeIn = interpolate(frame, [0, 22], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const fadeOut = interpolate(
		frame,
		[durationInFrames - 20, durationInFrames],
		[1, 0],
		{extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
	);
	const opacity = fadeIn * fadeOut;

	const translateY = interpolate(s, [0, 1], [18, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	const basePulse = 0.85 + Math.sin(frame * 0.06) * 0.15;
	const glowIntro = interpolate(frame, [0, 30], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const glowOutro = interpolate(
		frame,
		[durationInFrames - 25, durationInFrames],
		[1, 0],
		{extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
	);
	const glow = basePulse * glowIntro * glowOutro;

	const letterReveal = interpolate(frame, [4, 28], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// Clean geometric sans stack — Avenir first, with graceful fallbacks
	const avenirStack =
		"'Avenir Next', 'Avenir', 'Nunito Sans', 'Montserrat', 'Helvetica Neue', Helvetica, Arial, sans-serif";

	return (
		<AbsoluteFill
			style={{
				justifyContent: 'center',
				alignItems: 'center',
				opacity,
			}}
		>
			{/* Radial pop-light halo behind text */}
			<div
				style={{
					position: 'absolute',
					width: 1400,
					height: 520,
					background:
						'radial-gradient(ellipse at center, rgba(255, 245, 220, 0.35) 0%, rgba(255, 230, 180, 0.18) 25%, rgba(255, 220, 160, 0.08) 50%, rgba(0,0,0,0) 75%)',
					filter: 'blur(40px)',
					opacity: glow,
					transform: `scale(${0.92 + glow * 0.08})`,
					pointerEvents: 'none',
				}}
			/>

			{/* Tighter glow core */}
			<div
				style={{
					position: 'absolute',
					width: 900,
					height: 280,
					background:
						'radial-gradient(ellipse at center, rgba(255, 255, 245, 0.45) 0%, rgba(255, 240, 210, 0.2) 40%, rgba(0,0,0,0) 75%)',
					filter: 'blur(25px)',
					opacity: glow,
					pointerEvents: 'none',
				}}
			/>

			{/* Keyword — Avenir, upright, wider letter-spacing for editorial feel */}
			<div
				style={{
					fontFamily: avenirStack,
					fontStyle: 'normal',
					fontWeight: 500,
					fontSize: 150,
					color: '#FFFFFF',
					letterSpacing: 2,
					lineHeight: 1.05,
					textAlign: 'center',
					transform: `translateY(${translateY}px)`,
					textShadow: [
						`0 0 ${30 * glow}px rgba(255, 255, 245, 0.95)`,
						`0 0 ${70 * glow}px rgba(255, 240, 210, 0.85)`,
						`0 0 ${140 * glow}px rgba(255, 225, 170, 0.55)`,
						`0 0 ${220 * glow}px rgba(255, 210, 140, 0.3)`,
						'0 4px 20px rgba(0, 0, 0, 0.45)',
					].join(', '),
					clipPath: `inset(0 ${(1 - letterReveal) * 100}% 0 0)`,
					padding: '0 60px',
					maxWidth: '90%',
					whiteSpace: 'nowrap',
					overflow: 'visible',
				}}
			>
				{keyword}
			</div>

			{/* Sublabel — lighter weight, wide tracking */}
			{sublabel ? (
				<div
					style={{
						marginTop: 32,
						fontFamily: avenirStack,
						fontWeight: 300,
						fontSize: 26,
						color: 'rgba(255, 255, 255, 0.82)',
						letterSpacing: 6,
						textTransform: 'uppercase',
						textAlign: 'center',
						opacity: interpolate(frame, [18, 36], [0, 1], {
							extrapolateLeft: 'clamp',
							extrapolateRight: 'clamp',
						}),
						transform: `translateY(${translateY * 0.5}px)`,
						textShadow:
							'0 0 20px rgba(255,245,220,0.6), 0 2px 12px rgba(0,0,0,0.6)',
					}}
				>
					{sublabel}
				</div>
			) : null}
		</AbsoluteFill>
	);
};

export const CinematicTitlesAvenir: React.FC<CinematicTitlesAvenirProps> = ({
	titles = defaultTitles,
}) => {
	return (
		<AbsoluteFill style={{backgroundColor: 'transparent'}}>
			{titles.map((title, i) => (
				<Sequence
					key={i}
					from={title.startFrame}
					durationInFrames={title.durationInFrames}
				>
					<CinematicAvenirCard title={title} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
