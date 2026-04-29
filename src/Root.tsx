import React from 'react';
import {Composition} from 'remotion';
import {MyComp} from './MyComp';
import {AnimatedSubtitles} from './AnimatedSubtitles';
import {InstagramSubtitles} from './InstagramSubtitles';
import {SubtitlesOnly} from './SubtitlesOnly';
import {PresenterTitles} from './PresenterTitles';
import {PresenterTitlesWithVideo} from './PresenterTitlesWithVideo';
import {CinematicTitles} from './CinematicTitles';
import {CinematicTitlesWithVideo} from './CinematicTitlesWithVideo';
import {CinematicTitlesAvenir} from './CinematicTitlesAvenir';
import {subtitles} from './subtitleData';
import {titles as presenterTitles} from './presenterTitleData';

export const Root: React.FC = () => {
	return (
		<>
			<Composition
				id="MyComp"
				component={MyComp}
				durationInFrames={720}
				width={1920}
				height={1080}
				fps={30}
				defaultProps={{}}
			/>
			<Composition
				id="Subtitles"
				component={AnimatedSubtitles}
				durationInFrames={600}
				width={1080}
				height={1920}
				fps={30}
				defaultProps={{
					videoSrc:
						'https://www.w3schools.com/html/mov_bbb.mp4',
					subtitles: [],
				}}
			/>
			<Composition
				id="IGSubtitles"
				component={InstagramSubtitles}
				durationInFrames={1416}
				width={1080}
				height={1920}
				fps={24}
				defaultProps={{
					subtitles,
				}}
			/>
			<Composition
				id="SubtitlesOnly"
				component={SubtitlesOnly}
				durationInFrames={1416}
				width={1080}
				height={1920}
				fps={24}
				defaultProps={{
					subtitles,
				}}
			/>
			{/* Preview: video + title overlay */}
			<Composition
				id="PresenterTitlesPreview"
				component={PresenterTitlesWithVideo}
				durationInFrames={3603}
				width={1920}
				height={1080}
				fps={25}
				defaultProps={{
					titles: presenterTitles,
					videoFile: 'Test_1_with_captions.mp4',
				}}
			/>
			{/* Export: transparent titles only for DaVinci composite */}
			<Composition
				id="PresenterTitles"
				component={PresenterTitles}
				durationInFrames={3603}
				width={1920}
				height={1080}
				fps={25}
				defaultProps={{
					titles: presenterTitles,
					showSafeZone: false,
				}}
			/>
			{/* Cinematic editorial style — italic serif with pop-light glow */}
			<Composition
				id="CinematicTitlesPreview"
				component={CinematicTitlesWithVideo}
				durationInFrames={3603}
				width={1920}
				height={1080}
				fps={25}
				defaultProps={{
					titles: presenterTitles,
					videoFile: 'Test_1_with_captions.mp4',
				}}
			/>
			<Composition
				id="CinematicTitles"
				component={CinematicTitles}
				durationInFrames={3603}
				width={1920}
				height={1080}
				fps={25}
				defaultProps={{
					titles: presenterTitles,
				}}
			/>
			{/* Avenir variant — same pop-light style, geometric sans */}
			<Composition
				id="CinematicTitlesAvenir"
				component={CinematicTitlesAvenir}
				durationInFrames={3603}
				width={1920}
				height={1080}
				fps={25}
				defaultProps={{
					titles: presenterTitles,
				}}
			/>
		</>
	);
};
