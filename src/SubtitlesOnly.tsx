import React from 'react';
import {
	AbsoluteFill,
	Sequence,
	useCurrentFrame,
	useVideoConfig,
	interpolate,
	spring,
} from 'remotion';

// ── Types ──

interface WordToken {
	text: string;
	emphasis?: boolean;
}

interface SubtitleLine {
	words: WordToken[];
	startFrame: number;
	durationInFrames: number;
}

interface SubtitlesOnlyProps {
	subtitles: SubtitleLine[];
}

// ── Dramatic IG Word ──

const IGWord: React.FC<{
	token: WordToken;
	index: number;
	totalWords: number;
	lineDuration: number;
}> = ({token, index, lineDuration}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const staggerDelay = index * 2;

	const s = spring({
		fps,
		frame: frame - staggerDelay,
		config: token.emphasis
			? {damping: 8, stiffness: 260, mass: 0.7}
			: {damping: 12, stiffness: 200, mass: 0.8},
	});

	const popScale = spring({
		fps,
		frame: frame - staggerDelay,
		config: {damping: 8, stiffness: 300, mass: 0.6},
	});

	const scale = token.emphasis
		? interpolate(popScale, [0, 1], [0.2, 1], {
				extrapolateLeft: 'clamp',
				extrapolateRight: 'clamp',
			})
		: interpolate(s, [0, 1], [0.6, 1], {
				extrapolateLeft: 'clamp',
				extrapolateRight: 'clamp',
			});

	const y = token.emphasis
		? interpolate(s, [0, 1], [40, 0], {
				extrapolateLeft: 'clamp',
				extrapolateRight: 'clamp',
			})
		: interpolate(s, [0, 1], [15, 0], {
				extrapolateLeft: 'clamp',
				extrapolateRight: 'clamp',
			});

	const opacity = interpolate(frame - staggerDelay, [0, 3], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	const exitStart = lineDuration - 5;
	const exitOpacity = interpolate(frame, [exitStart, lineDuration], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const exitScale = interpolate(frame, [exitStart, lineDuration], [1, 0.8], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	const glow = token.emphasis
		? 0.8 + Math.sin((frame - staggerDelay) * 0.12) * 0.2
		: 0;

	const styles: React.CSSProperties = token.emphasis
		? {
				fontSize: 100,
				fontWeight: 900,
				fontStyle: 'italic',
				color: '#FFFFFF',
				textShadow: [
					`0 0 ${25 * glow}px rgba(255, 255, 255, 0.95)`,
					`0 0 ${50 * glow}px rgba(255, 220, 80, 0.7)`,
					`0 0 ${80 * glow}px rgba(255, 150, 0, 0.35)`,
					'0 6px 20px rgba(0, 0, 0, 1)',
					'3px 3px 0 rgba(0,0,0,0.9)',
					'-3px -3px 0 rgba(0,0,0,0.9)',
					'3px -3px 0 rgba(0,0,0,0.9)',
					'-3px 3px 0 rgba(0,0,0,0.9)',
				].join(', '),
				letterSpacing: -3,
				lineHeight: 0.95,
				padding: '0 4px',
			}
		: {
				fontSize: 32,
				fontWeight: 700,
				fontStyle: 'normal',
				color: 'rgba(255, 255, 255, 0.92)',
				textShadow:
					'0 3px 10px rgba(0,0,0,1), 2px 2px 0 rgba(0,0,0,0.9), -2px -2px 0 rgba(0,0,0,0.9), 2px -2px 0 rgba(0,0,0,0.9), -2px 2px 0 rgba(0,0,0,0.9)',
				letterSpacing: 1,
				lineHeight: 1.1,
			};

	return (
		<span
			style={{
				display: 'inline-block',
				fontFamily: "'Montserrat', 'Arial Black', Impact, sans-serif",
				opacity: opacity * exitOpacity,
				transform: `translateY(${y}px) scale(${scale * exitScale})`,
				marginRight: token.emphasis ? 12 : 8,
				verticalAlign: 'middle',
				...styles,
			}}
		>
			{token.text}
		</span>
	);
};

// ── Subtitle Block ──

const IGSubtitleBlock: React.FC<{
	words: WordToken[];
	durationInFrames: number;
}> = ({words, durationInFrames}) => {
	const frame = useCurrentFrame();

	const containerOpacity = interpolate(
		frame,
		[0, 3, durationInFrames - 5, durationInFrames],
		[0, 1, 1, 0],
		{extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
	);

	return (
		<div
			style={{
				position: 'absolute',
				bottom: 400,
				left: 40,
				right: 40,
				display: 'flex',
				justifyContent: 'center',
				opacity: containerOpacity,
			}}
		>
			<div
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					justifyContent: 'center',
					alignItems: 'center',
					maxWidth: 980,
					textAlign: 'center',
					gap: '2px 0',
				}}
			>
				{words.map((token, i) => (
					<IGWord
						key={i}
						token={token}
						index={i}
						totalWords={words.length}
						lineDuration={durationInFrames}
					/>
				))}
			</div>
		</div>
	);
};

// ── Main — transparent background ──

export const SubtitlesOnly: React.FC<SubtitlesOnlyProps> = ({subtitles}) => {
	return (
		<AbsoluteFill style={{backgroundColor: 'transparent'}}>
			{subtitles.map((sub, i) => (
				<Sequence
					key={i}
					from={sub.startFrame}
					durationInFrames={sub.durationInFrames}
				>
					<IGSubtitleBlock
						words={sub.words}
						durationInFrames={sub.durationInFrames}
					/>
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
