import type { Status } from '@/domain/types';
import { colors } from '@/brand/tokens';
import { IconSvg, type IconBaseProps } from './TypeGlyph';

export interface StatusIconProps extends IconBaseProps {
  status: Status;
}

/** Daily status (SPEC §4.3): OK = full circle · CARGADO = half circle · KO = circle with an X. */
export function StatusIcon({ status, ...base }: StatusIconProps) {
  const c = colors.status[status];
  return (
    <IconSvg {...base}>
      {status === 'ok' && <circle cx="12" cy="12" r="9" fill={c} />}
      {status === 'cargado' && (
        <>
          <circle cx="12" cy="12" r="8" fill="none" stroke={c} strokeWidth={2} />
          <path d="M12 3a9 9 0 0 0 0 18z" fill={c} />
        </>
      )}
      {status === 'ko' && (
        <>
          <circle cx="12" cy="12" r="9" fill={c} />
          <path
            d="M8.5 8.5l7 7M15.5 8.5l-7 7"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </>
      )}
    </IconSvg>
  );
}
