import React from 'react';
import {
	AbsoluteFill,
	Sequence,
	useCurrentFrame,
	useVideoConfig,
	interpolate,
	spring,
} from 'remotion';
import {Title, titles as defaultTitles, Side} from './presenterTitleData';

interface PresenterTitlesProps {
	titles: Title[];
	showSafeZone?: boolean; // visualizes center exclusion area during editing
}

// ── Single animated title card ──

const TitleCard: React.FC<{
	title: Title;
}> = ({title}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {side, category, keyword, sublabel, durationInFrames} = title;

	// Gentle didactic spring — slow and clean
	const inSpring = spring({
		fps,
		frame,
		config: {damping: 22, stiffness: 90, mass: 1},
	});

	// Smooth fade in/out
	const fadeIn = interpolate(frame, [0, 18], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	const fadeOut = interpolate(
		frame,
		[durationInFrames - 15, durationInFrames],
		[1, 0],
		{extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
	);

	const opacity = fadeIn * fadeOut;

	// Subtle slide from edge (translucent, didactic feel)
	const slideDistance = 30;
	const translateX = interpolate(inSpring, [0, 1], [side === 'left' ? -slideDistance : slideDistance, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// Staggered internal reveal for category → keyword → sublabel → line
	const categoryOpacity = interpolate(frame, [2, 14], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const keywordOpacity = interpolate(frame, [8, 22], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const keywordY = interpolate(
		spring({fps, frame: frame - 8, config: {damping: 20, stiffness: 110}}),
		[0, 1],
		[12, 0],
		{extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
	);
	const sublabelOpacity = interpolate(frame, [16, 28], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const lineScale = interpolate(frame, [6, 24], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	const textAlign = side === 'left' ? 'left' : 'right';
	const transformOrigin = side === 'left' ? 'left center' : 'right center';

	return (
		<div
			style={{
				opacity,
				transform: `translateX(${translateX}px)`,
				textAlign,
				fontFamily:
					"'Inter', 'Helvetica Neue', 'Helvetica', Arial, sans-serif",
				color: '#FFFFFF',
				maxWidth: 520,
				marginLeft: side === 'right' ? 'auto' : undefined,
			}}
		>
			{/* Category label */}
			{category ? (
				<div
					style={{
						fontSize: 14,
						fontWeight: 600,
						letterSpacing: 4,
						textTransform: 'uppercase',
						opacity: categoryOpacity * 0.7,
						marginBottom: 10,
						color: 'rgba(255, 255, 255, 0.65)',
					}}
				>
					{category}
				</div>
			) : null}

			{/* Thin accent line */}
			<div
				style={{
					height: 1,
					background:
						'linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.15) 100%)',
					transform: `scaleX(${lineScale})`,
					transformOrigin,
					marginBottom: 18,
					width: 80,
					marginLeft: side === 'right' ? 'auto' : 0,
				}}
			/>

			{/* Main keyword */}
			<div
				style={{
					fontSize: 48,
					fontWeight: 800,
					letterSpacing: -0.5,
					lineHeight: 1.05,
					opacity: keywordOpacity,
					transform: `translateY(${keywordY}px)`,
					textShadow:
						'0 2px 20px rgba(0, 0, 0, 0.6), 0 1px 4px rgba(0, 0, 0, 0.8)',
				}}
			>
				{keyword}
			</div>

			{/* Sublabel */}
			{sublabel ? (
				<div
					style={{
						fontSize: 18,
						fontWeight: 400,
						letterSpacing: 0.5,
						opacity: sublabelOpacity * 0.82,
						marginTop: 12,
						color: 'rgba(255, 255, 255, 0.82)',
						fontStyle: 'italic',
						textShadow: '0 1px 6px rgba(0, 0, 0, 0.7)',
					}}
				>
					{sublabel}
				</div>
			) : null}
		</div>
	);
};

// ── Title container that positions left or right ──

const TitleSlot: React.FC<{title: Title}> = ({title}) => {
	const isLeft = title.side === 'left';

	return (
		<AbsoluteFill
			style={{
				justifyContent: 'center',
				alignItems: isLeft ? 'flex-start' : 'flex-end',
				paddingLeft: isLeft ? 90 : 0,
				paddingRight: isLeft ? 0 : 90,
			}}
		>
			<TitleCard title={title} />
		</AbsoluteFill>
	);
};

// ── Main composition ──

export const PresenterTitles: React.FC<PresenterTitlesProps> = ({
	titles = defaultTitles,
	showSafeZone = false,
}) => {
	return (
		<AbsoluteFill style={{backgroundColor: 'transparent'}}>
			{/* Safe zone visualization (editor only) */}
			{showSafeZone ? (
				<AbsoluteFill
					style={{
						justifyContent: 'center',
						alignItems: 'center',
					}}
				>
					<div
						style={{
							width: 640,
							height: '100%',
							border: '2px dashed rgba(255, 200, 0, 0.3)',
							background: 'rgba(255, 200, 0, 0.05)',
						}}
					/>
				</AbsoluteFill>
			) : null}

			{/* Render each title in its time slot */}
			{titles.map((title, i) => (
				<Sequence
					key={i}
					from={title.startFrame}
					durationInFrames={title.durationInFrames}
				>
					<TitleSlot title={title} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
