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

interface CinematicTitlesProps {
	titles: Title[];
}

// ── Cinematic italic serif title with pop-light glow ──

const CinematicCard: React.FC<{title: Title}> = ({title}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {keyword, sublabel, durationInFrames} = title;

	// Soft entrance
	const s = spring({
		fps,
		frame,
		config: {damping: 28, stiffness: 85, mass: 1},
	});

	// Long editorial fades
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

	// Gentle rise
	const translateY = interpolate(s, [0, 1], [18, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// Pulsing pop-light behind text (subtle breathing glow)
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

	// Letter-by-letter reveal (very subtle)
	const letterReveal = interpolate(frame, [4, 28], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

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

			{/* Secondary tighter glow core */}
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

			{/* Keyword — large italic serif */}
			<div
				style={{
					fontFamily:
						"'Playfair Display', 'EB Garamond', 'Didot', 'Bodoni 72', Georgia, serif",
					fontStyle: 'italic',
					fontWeight: 500,
					fontSize: 180,
					color: '#FFFFFF',
					letterSpacing: -1,
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

			{/* Optional sublabel — quiet caption beneath */}
			{sublabel ? (
				<div
					style={{
						marginTop: 28,
						fontFamily:
							"'Playfair Display', 'EB Garamond', Georgia, serif",
						fontStyle: 'italic',
						fontWeight: 400,
						fontSize: 30,
						color: 'rgba(255, 255, 255, 0.78)',
						letterSpacing: 2,
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

// ── Main composition ──

export const CinematicTitles: React.FC<CinematicTitlesProps> = ({
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
					<CinematicCard title={title} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
