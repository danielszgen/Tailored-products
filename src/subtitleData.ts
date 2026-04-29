// Subtitle data for TEST_video_humor_1.mov
// Video: 24fps, timecode offset 01:00:00:00 (subtracted)

const t = (seconds: number): number => Math.round(seconds * 24);

interface WordToken {
	text: string;
	emphasis?: boolean;
}

interface SubtitleLine {
	words: WordToken[];
	startFrame: number;
	durationInFrames: number;
}

// Helper to parse "word *emphasis* word" format
const parse = (text: string): WordToken[] => {
	const tokens: WordToken[] = [];
	const regex = /\*([^*]+)\*|(\S+)/g;
	let match;
	while ((match = regex.exec(text)) !== null) {
		if (match[1]) {
			tokens.push({text: match[1], emphasis: true});
		} else if (match[2]) {
			tokens.push({text: match[2]});
		}
	}
	return tokens;
};

const sub = (start: number, end: number, text: string): SubtitleLine => ({
	words: parse(text),
	startFrame: t(start),
	durationInFrames: t(end - start),
});

export const subtitles: SubtitleLine[] = [
	sub(0.125, 2.5, 'Tatuarse en *Manresa*'),
	sub(1.5, 4.0, 'pues un poco como hacer la *declaración* de la *renta*'),
	sub(4.0, 6.2, 'O te cuesta una *pasta*'),
	sub(6.208, 7.208, 'o te *acosan* hasta metertela bien *duro*'),
	sub(7.458, 10.158, '*Joder,* es que escoger *tatuador*'),
	sub(10.333, 11.933, 'es más *difícil* que escoger bando *político*'),
	sub(12.125, 14.225, 'Solo hace falta ver las *manifestaciones*'),
	sub(14.25, 15.75, 'de *vecinos* contra *inmigrantes*'),
	sub(15.708, 18.708, 'y las de los *inmigrantes* contra los *vecinos*'),
	sub(19.708, 22.408, 'Con el punt lila en el medio haciendo de *árbitro* *confundido*'),
	sub(22.625, 26.025, 'Lo *mejor* de todo es que los tatuadores te piden *fidelidad*'),
	sub(27.041, 28.891, '*Fidelidad* en *Manresa*'),
	sub(28.875, 30.875, 'que estáis cada *sábado* en *Sielu*'),
	sub(30.833, 33.033, 'luego cada *domingo* colgando *instastories*'),
	sub(33.041, 34.541, 'con la *churri* a la bandera de *Collbaix*'),
	sub(34.916, 36.016, 'Ahora en *serio,*'),
	sub(36.0, 37.25, '¿qué es más *caro?*'),
	sub(37.25, 40.0, 'Tatuarse en *Manresa* o pagar la *zona* *azul* mientras te lo hacen?'),
	sub(40.208, 43.308, 'En *resumen,* queda *igual* con quien te tatúes'),
	sub(43.833, 45.883, 'Pero al menos *elígeme* a *mí,*'),
	sub(45.875, 47.525, 'que yo también tengo *mierdas* en el *Sielu*'),
	sub(48.166, 49.366, 'Y de aquí no sale *nada*'),
];
