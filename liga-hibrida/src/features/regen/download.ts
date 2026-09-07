// File export helpers: download via <a download> and share via the Web Share API when available.

export function downloadText(filename: string, text: string, mime = 'application/json'): boolean {
  try {
    if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return false;
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}

export function canShareFiles(): boolean {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false;
    if (typeof navigator.canShare !== 'function' || typeof File === 'undefined') return false;
    const probe = new File(['{}'], 'probe.json', { type: 'application/json' });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

export async function shareText(
  filename: string,
  text: string,
  title = 'Liga Híbrida',
  mime = 'application/json',
): Promise<boolean> {
  try {
    const file = new File([text], filename, { type: mime });
    await navigator.share({ files: [file], title });
    return true;
  } catch {
    return false;
  }
}
