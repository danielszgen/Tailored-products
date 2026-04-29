import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile} from 'remotion';
import {CinematicTitles} from './CinematicTitles';
import {Title} from './presenterTitleData';

interface CinematicTitlesWithVideoProps {
	titles: Title[];
	videoFile: string;
}

// Preview composition — video + cinematic title overlay.
// For final export, render the transparent `CinematicTitles` comp.

export const CinematicTitlesWithVideo: React.FC<CinematicTitlesWithVideoProps> = ({
	titles,
	videoFile,
}) => {
	return (
		<AbsoluteFill style={{backgroundColor: '#000'}}>
			<AbsoluteFill>
				<OffthreadVideo
					src={staticFile(videoFile)}
					style={{width: '100%', height: '100%', objectFit: 'cover'}}
				/>
			</AbsoluteFill>
			<CinematicTitles titles={titles} />
		</AbsoluteFill>
	);
};
