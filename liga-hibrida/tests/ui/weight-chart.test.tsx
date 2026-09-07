import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeightChart } from '@/features/regen/WeightChart';
import { targetBand } from '@/features/regen/weightBand';

describe('WeightChart', () => {
  it('renders an accessible SVG with the moving-average path', () => {
    const points = Array.from({ length: 10 }, (_, i) => ({
      date: `2026-09-${String(7 + i).padStart(2, '0')}`,
      value: 79 + i * 0.05,
    }));
    const { container } = render(
      <WeightChart points={points} startWeightKg={79} blockStart="2026-09-07" days={28} />,
    );
    const img = screen.getByRole('img');
    expect(img.getAttribute('aria-label')).toContain('kg');
    expect(container.querySelectorAll('path').length).toBeGreaterThanOrEqual(2); // band + MA
    expect(container.querySelectorAll('circle')).toHaveLength(10);
  });

  it('shows an empty state without points', () => {
    render(<WeightChart points={[]} />);
    expect(screen.getByRole('status').textContent).toContain('Sin pesos');
  });

  it('computes the target band (+0,10 % / +0,25 % per week)', () => {
    expect(targetBand(80, 0)).toEqual([80, 80]);
    const [low, high] = targetBand(80, 4);
    expect(low).toBeCloseTo(80.32, 2);
    expect(high).toBeCloseTo(80.8, 1);
  });
});
