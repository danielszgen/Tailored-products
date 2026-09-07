import { Screen } from './Screen';
import { EmptyState } from './EmptyState';

/** Placeholder for tabs whose full content lands in a later stage (SPEC §9). */
export function ComingSoon({
  title,
  stage,
  detail,
}: {
  title: string;
  stage: string;
  detail?: string;
}) {
  return (
    <Screen title={title}>
      <EmptyState
        title={`Disponible en la ${stage}`}
        description={detail ?? 'Esta pantalla se construye en una etapa posterior del roadmap.'}
      />
    </Screen>
  );
}
