import React from 'react';
import {
	AbsoluteFill,
	Sequence,
	useCurrentFrame,
	useVideoConfig,
	interpolate,
	spring,
	OffthreadVideo,
	staticFile,
} from 'remotion';

// ── Types ──

interface SubtitleLine {
	text: string;
	startFrame: number;
	durationInFrames: number;
}

interface AnimatedSubtitlesProps {
	videoSrc: string;
	subtitles: SubtitleLine[];
}

// ── Word-by-word animated subtitle ──

const AnimatedWord: React.FC<{
	word: string;
	index: number;
	totalWords: number;
	lineDuration: number;
}> = ({word, index, totalWords, lineDuration}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	// Stagger each word's entrance
	const staggerDelay = index * 3;

	const s = spring({
		fps,
		frame: frame - staggerDelay,
		config: {damping: 14, stiffness: 180},
	});

	const y = interpolate(s, [0, 1], [30, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	const opacity = interpolate(frame - staggerDelay, [0, 5], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// Highlight effect — the "active" word lights up as time progresses
	const wordMidpoint = staggerDelay + 5;
	const highlightWindow = lineDuration / totalWords;
	const activeProgress = interpolate(
		frame,
		[wordMidpoint, wordMidpoint + highlightWindow],
		[0, 1],
		{extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
	);

	const isActive = frame >= wordMidpoint && frame < wordMidpoint + highlightWindow;
	const scale = isActive
		? interpolate(activeProgress, [0, 0.3, 1], [1, 1.08, 1], {
				extrapolateLeft: 'clamp',
				extrapolateRight: 'clamp',
			})
		: 1;

	const color = isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.85)';

	// Exit animation
	const exitStart = lineDuration - 10;
	const exitOpacity = interpolate(frame, [exitStart, lineDuration], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	const exitY = interpolate(frame, [exitStart, lineDuration], [0, -15], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<span
			style={{
				display: 'inline-block',
				fontSize: 52,
				fontWeight: 800,
				fontFamily: "'Montserrat', Arial, Helvetica, sans-serif",
				opacity: opacity * exitOpacity,
				transform: `translateY(${y + exitY}px) scale(${scale})`,
				color,
				marginRight: 18,
				textShadow: isActive
					? '0 0 20px rgba(255,255,255,0.5), 0 2px 8px rgba(0,0,0,0.9)'
					: '0 2px 8px rgba(0,0,0,0.9), 0 0 30px rgba(0,0,0,0.7)',
				transition: 'color 0.1s',
			}}
		>
			{word}
		</span>
	);
};

const SubtitleBlock: React.FC<{
	text: string;
	durationInFrames: number;
}> = ({text, durationInFrames}) => {
	const frame = useCurrentFrame();
	const words = text.split(' ');

	// Background pill animation
	const bgOpacity = interpolate(frame, [0, 8, durationInFrames - 10, durationInFrames], [0, 1, 1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	const bgScale = interpolate(frame, [0, 8], [0.9, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<div
			style={{
				position: 'absolute',
				bottom: 380,
				left: 60,
				right: 60,
				display: 'flex',
				justifyContent: 'center',
			}}
		>
			<div
				style={{
					background: 'rgba(0, 0, 0, 0.55)',
					backdropFilter: 'blur(12px)',
					borderRadius: 20,
					padding: '32px 44px',
					opacity: bgOpacity,
					transform: `scale(${bgScale})`,
					display: 'flex',
					flexWrap: 'wrap',
					justifyContent: 'center',
					alignItems: 'center',
					maxWidth: 900,
				}}
			>
				{words.map((word, i) => (
					<AnimatedWord
						key={i}
						word={word}
						index={i}
						totalWords={words.length}
						lineDuration={durationInFrames}
					/>
				))}
			</div>
		</div>
	);
};

// ── Progress bar at bottom ──

const ProgressBar: React.FC = () => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();

	const progress = interpolate(frame, [0, durationInFrames], [0, 100], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<div
			style={{
				position: 'absolute',
				bottom: 0,
				left: 0,
				right: 0,
				height: 4,
				background: 'rgba(255, 255, 255, 0.15)',
			}}
		>
			<div
				style={{
					height: '100%',
					width: `${progress}%`,
					background: 'linear-gradient(90deg, #E40000, #FF4444)',
					borderRadius: 2,
				}}
			/>
		</div>
	);
};

// ── Main Composition ──

export const AnimatedSubtitles: React.FC<AnimatedSubtitlesProps> = ({
	videoSrc,
	subtitles,
}) => {
	return (
		<AbsoluteFill style={{backgroundColor: '#000'}}>
			{/* Video layer */}
			<AbsoluteFill>
				<OffthreadVideo
					src={videoSrc}
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
					}}
				/>
			</AbsoluteFill>

			{/* Gradient overlay at bottom for readability */}
			<AbsoluteFill>
				<div
					style={{
						position: 'absolute',
						bottom: 0,
						left: 0,
						right: 0,
						height: '50%',
						background:
							'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 40%, transparent 100%)',
					}}
				/>
			</AbsoluteFill>

			{/* Subtitle sequences */}
			{subtitles.map((sub, i) => (
				<Sequence
					key={i}
					from={sub.startFrame}
					durationInFrames={sub.durationInFrames}
				>
					<SubtitleBlock
						text={sub.text}
						durationInFrames={sub.durationInFrames}
					/>
				</Sequence>
			))}

			{/* Progress bar */}
			<ProgressBar />
		</AbsoluteFill>
	);
};
