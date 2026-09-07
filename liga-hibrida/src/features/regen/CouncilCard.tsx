// Entry to the Consejo de la Liga from REGEN: current week summary and the last report.
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button, Card, Eyebrow } from '@/components';
import { getAdjustment } from '@/data';
import { BLOCK_WEEKS } from '@/domain/content/block';
import type { TodayModel } from '@/features/today/useToday';
import { formatShort } from '@/lib/date';
import { councilAdjustmentId } from './councilId';

export function CouncilCard({ model }: { model: TodayModel }) {
  const navigate = useNavigate();
  const { weekOfBlock, weekStart, dayIndex } = model;
  const last = useLiveQuery(() => getAdjustment(councilAdjustmentId(weekStart)), [weekStart]);
  const inBlock = weekOfBlock !== null && weekOfBlock >= 1 && weekOfBlock <= BLOCK_WEEKS;

  return (
    <Card
      eyebrow="Consejo de la Liga"
      title={dayIndex === 6 ? 'Hoy es domingo' : 'Domingo, o cuando quieras'}
    >
      <p className="text-sm text-ink2 mb-3">
        Scorecard de la semana, 7 pasos y el informe para El Rival. Genera la semana siguiente.
      </p>
      {last && (
        <Eyebrow className="block mb-2">Consejo cerrado el {formatShort(last.date)} ✓</Eyebrow>
      )}
      <Button full onClick={() => navigate('/regen/consejo')} disabled={!inBlock}>
        {inBlock ? `Abrir el Consejo · semana ${weekOfBlock}/${BLOCK_WEEKS}` : 'Fuera del Bloque 1'}
      </Button>
    </Card>
  );
}
