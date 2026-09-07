import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Stepper } from '@/components/Stepper';
import { decimalsOf } from '@/lib/math';

function Harness({ step, initial }: { step: number; initial: number }) {
  const [value, setValue] = useState(initial);
  return <Stepper label="Carga" value={value} onChange={setValue} step={step} unit="kg" />;
}

describe('Stepper', () => {
  it('shows one decimal for 2,5 kg steps and keeps the half kilo when nudging', async () => {
    const user = userEvent.setup();
    render(<Harness step={2.5} initial={70} />);
    const input = screen.getByLabelText('Carga');
    expect(input).toHaveValue('70,0');
    await user.click(screen.getByRole('button', { name: 'Sumar 2.5 a Carga' }));
    expect(input).toHaveValue('72,5');
    await user.click(screen.getByRole('button', { name: 'Restar 2.5 a Carga' }));
    expect(input).toHaveValue('70,0');
  });

  it('derives decimals from the step', () => {
    expect(decimalsOf(1)).toBe(0);
    expect(decimalsOf(5)).toBe(0);
    expect(decimalsOf(2.5)).toBe(1);
    expect(decimalsOf(0.5)).toBe(1);
    expect(decimalsOf(0.1)).toBe(1);
    expect(decimalsOf(0.25)).toBe(2);
  });
});
