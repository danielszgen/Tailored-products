import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile} from 'remotion';
import {PresenterTitles} from './PresenterTitles';
import {Title} from './presenterTitleData';

interface PresenterTitlesWithVideoProps {
	titles: Title[];
	videoFile: string;
}

// Preview composition — video + title overlay
// Use this in the studio to verify timing against the footage.
// For final export to DaVinci, render the transparent `PresenterTitles` comp.

export const PresenterTitlesWithVideo: React.FC<PresenterTitlesWithVideoProps> = ({
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
			<PresenterTitles titles={titles} />
		</AbsoluteFill>
	);
};
