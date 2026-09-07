import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  BrandMark,
  colors,
  FormSilhouette,
  GYM_COLORS,
  GymIcon,
  MedalIcon,
  StatusIcon,
  TypeGlyph,
} from '@/brand';
import type { Form, GymId, StatKey, Status } from '@/domain/types';

const TYPES: Array<StatKey | 'regen'> = ['masa', 'fuerza', 'motor', 'control', 'aventura', 'regen'];
const GYMS: GymId[] = ['cantera', 'yunque', 'resorte', 'vertigo'];
const STATUSES: Status[] = ['ok', 'cargado', 'ko'];
const FORMS: Form[] = [1, 2, 3, 4];
const LOCKED_STROKE = 'var(--c-ink3)';

function renderSvg(ui: ReactElement): SVGSVGElement {
  const { container } = render(ui);
  const svg = container.querySelector('svg');
  if (!svg) throw new Error('No <svg> rendered');
  return svg;
}

/** Every fill and stroke value used by the elements inside the svg. */
function paints(svg: SVGSVGElement): string[] {
  return Array.from(svg.querySelectorAll('*'))
    .flatMap((el) => [el.getAttribute('fill'), el.getAttribute('stroke')])
    .filter((v): v is string => v !== null);
}

function fills(svg: SVGSVGElement): string[] {
  return Array.from(svg.querySelectorAll('*'))
    .map((el) => el.getAttribute('fill'))
    .filter((v): v is string => v !== null);
}

const shapeCount = (svg: SVGSVGElement) =>
  svg.querySelectorAll('path, circle, rect, polygon, ellipse, line').length;

describe('icon contract (size, className, title / aria)', () => {
  const samples: Array<[string, (title?: string) => ReactElement]> = [
    ['TypeGlyph', (title) => <TypeGlyph type="masa" title={title} size={32} className="x" />],
    [
      'MedalIcon',
      (title) => <MedalIcon gym="cantera" state="earned" title={title} size={32} className="x" />,
    ],
    ['StatusIcon', (title) => <StatusIcon status="ok" title={title} size={32} className="x" />],
    [
      'FormSilhouette',
      (title) => <FormSilhouette form={2} title={title} size={32} className="x" />,
    ],
    ['GymIcon', (title) => <GymIcon gym="yunque" title={title} size={32} className="x" />],
    ['BrandMark', (title) => <BrandMark title={title} size={32} className="x" />],
  ];

  it.each(samples)('%s is decorative without a title', (_name, make) => {
    const svg = renderSvg(make());
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).not.toHaveAttribute('role');
    expect(svg.querySelector('title')).toBeNull();
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
    expect(svg).toHaveClass('x');
  });

  it.each(samples)('%s exposes role="img" and a <title> when titled', (name, make) => {
    const svg = renderSvg(make(`Icono ${name}`));
    expect(svg).toHaveAttribute('role', 'img');
    expect(svg).not.toHaveAttribute('aria-hidden');
    expect(svg.querySelector('title')).toHaveTextContent(`Icono ${name}`);
    expect(screen.getByRole('img', { name: `Icono ${name}` })).toBe(svg);
  });

  it('defaults to 24 px', () => {
    const svg = renderSvg(<TypeGlyph type="motor" />);
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
  });
});

describe('TypeGlyph', () => {
  it.each(TYPES)('renders the "%s" glyph in its token color', (type) => {
    const svg = renderSvg(<TypeGlyph type={type} />);
    expect(shapeCount(svg)).toBeGreaterThan(0);
    expect(paints(svg)).toContain(colors.types[type]);
  });

  it('renders six distinct drawings', () => {
    const drawings = new Set(TYPES.map((type) => renderSvg(<TypeGlyph type={type} />).innerHTML));
    expect(drawings.size).toBe(TYPES.length);
  });

  it('accepts a color override, including currentColor', () => {
    const svg = renderSvg(<TypeGlyph type="masa" color="currentColor" />);
    expect(paints(svg)).toContain('currentColor');
    expect(paints(svg)).not.toContain(colors.types.masa);
  });
});

describe('MedalIcon', () => {
  it('maps every gym to the token of the type it trains most', () => {
    expect(GYM_COLORS).toEqual({
      cantera: colors.types.fuerza,
      yunque: colors.types.masa,
      resorte: colors.types.aventura,
      vertigo: colors.types.control,
    });
  });

  it.each(GYMS)('%s · locked is a grey outline only (no fill besides "none")', (gym) => {
    const svg = renderSvg(<MedalIcon gym={gym} state="locked" />);
    const used = fills(svg);
    expect(used.length).toBeGreaterThan(0);
    expect(new Set(used)).toEqual(new Set(['none']));
    expect(paints(svg)).toContain(LOCKED_STROKE);
    expect(paints(svg)).not.toContain(GYM_COLORS[gym]);
    expect(svg.querySelector('[data-part="glint"]')).toBeNull();
  });

  it.each(GYMS)('%s · progress is the gym color at 50 % opacity', (gym) => {
    const svg = renderSvg(<MedalIcon gym={gym} state="progress" />);
    const dimmed = svg.querySelector('[opacity="0.5"]');
    expect(dimmed).not.toBeNull();
    expect(dimmed?.querySelector(`[fill="${GYM_COLORS[gym]}"]`)).not.toBeNull();
    expect(paints(svg)).not.toContain(LOCKED_STROKE);
    expect(svg.querySelector('[data-part="glint"]')).toBeNull();
  });

  it.each(GYMS)('%s · earned is full color with a glint', (gym) => {
    const svg = renderSvg(<MedalIcon gym={gym} state="earned" />);
    expect(svg.querySelector(`[fill="${GYM_COLORS[gym]}"]`)).not.toBeNull();
    expect(svg.querySelector('[opacity]')).toBeNull();
    expect(paints(svg)).not.toContain(LOCKED_STROKE);
    expect(svg.querySelector('[data-part="glint"]')).not.toBeNull();
  });

  it('renders four distinct medal shapes', () => {
    const drawings = new Set(
      GYMS.map((gym) => renderSvg(<MedalIcon gym={gym} state="earned" />).innerHTML),
    );
    expect(drawings.size).toBe(GYMS.length);
  });
});

describe('GymIcon', () => {
  it.each(GYMS)('%s · solid gym color, no state styling', (gym) => {
    const svg = renderSvg(<GymIcon gym={gym} />);
    expect(svg.querySelector(`[fill="${GYM_COLORS[gym]}"]`)).not.toBeNull();
    expect(svg.querySelector('[opacity]')).toBeNull();
    expect(svg.querySelector('[data-part="glint"]')).toBeNull();
    expect(paints(svg)).not.toContain(LOCKED_STROKE);
  });
});

describe('StatusIcon', () => {
  it.each(STATUSES)('renders "%s" in its status color', (status) => {
    const svg = renderSvg(<StatusIcon status={status} />);
    expect(shapeCount(svg)).toBeGreaterThan(0);
    expect(paints(svg)).toContain(colors.status[status]);
  });

  it('OK is a full circle, CARGADO a half circle, KO a circle with an X', () => {
    const ok = renderSvg(<StatusIcon status="ok" />);
    expect(ok.querySelector(`circle[fill="${colors.status.ok}"]`)).not.toBeNull();
    expect(ok.querySelector('path')).toBeNull();

    const cargado = renderSvg(<StatusIcon status="cargado" />);
    expect(cargado.querySelector('circle[fill="none"]')).not.toBeNull();
    expect(cargado.querySelector(`path[fill="${colors.status.cargado}"]`)).not.toBeNull();

    const ko = renderSvg(<StatusIcon status="ko" />);
    expect(ko.querySelector(`circle[fill="${colors.status.ko}"]`)).not.toBeNull();
    expect(ko.querySelector('path[stroke]')?.getAttribute('d')).toMatch(/l7 7/);
  });
});

describe('FormSilhouette', () => {
  it.each(FORMS)('Form %s is a monochrome currentColor figure', (form) => {
    const svg = renderSvg(<FormSilhouette form={form} />);
    expect(shapeCount(svg)).toBeGreaterThan(0);
    const used = new Set(paints(svg));
    expect(used.has('currentColor')).toBe(true);
    for (const value of used) expect(['currentColor', 'none']).toContain(value);
  });

  it('gains definition from Form I to Form IV', () => {
    const counts = FORMS.map((form) => shapeCount(renderSvg(<FormSilhouette form={form} />)));
    expect(counts[3]).toBeGreaterThan(counts[2]);
    expect(counts[2]).toBeGreaterThan(counts[0]);
    expect(
      new Set(FORMS.map((form) => renderSvg(<FormSilhouette form={form} />).innerHTML)).size,
    ).toBe(FORMS.length);
  });
});

describe('BrandMark', () => {
  it('is an accent + gold emblem with no text', () => {
    const svg = renderSvg(<BrandMark size={64} />);
    expect(svg).toHaveAttribute('viewBox', '0 0 64 64');
    expect(svg).toHaveAttribute('width', '64');
    expect(paints(svg)).toContain(colors.light.accent);
    expect(paints(svg)).toContain(colors.light.gold);
    expect(svg.querySelector('text')).toBeNull();
    expect(shapeCount(svg)).toBeGreaterThan(2);
  });
});
