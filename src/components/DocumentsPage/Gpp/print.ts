// print.ts — печатная версия ГПП: весь документ (все строки раскрыты), светлая, А4 альбомная. Таблица слева,
// диаграмма справа; стрелки и линии плана рисуются одним SVG, а каждая строка показывает свой срез через <use>,
// поэтому разрыв страницы не режет полосы. Печать — через скрытый iframe; для PDF имя файла берётся из заголовка.
import type { GppRowDTO, GppType } from './types';
import { MONTHS, MONTHS_SHORT, monthYear, ruDateTime, ruDay } from './dates';
import { arrowHead, barGeometry, makeTimeline, monthTicks, planLines, routeLink } from './geometry';
import { buildLinks } from './schedule';
import { buildIndex, rowLabel } from './tree';
import { KIND_LABEL, TYPE_LABEL, barColor } from './theme';
import { formatQty } from './purchase';

const GANTT_W = 500;
const ROW_H = 24;
const BAR_H = 12;

const esc = (s: string): string => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Правила @font-face шрифта Inter со страницы — чтобы печать была тем же шрифтом без интернета */
const interFontFaces = (): string => {
  const out: string[] = [];
  Array.from(document.styleSheets).forEach(sheet => {
    try {
      Array.from(sheet.cssRules).forEach(rule => {
        if (rule instanceof CSSFontFaceRule && /inter/i.test(rule.style.getPropertyValue('font-family'))) out.push(rule.cssText);
      });
    } catch {
      /* чужая таблица стилей — правила недоступны */
    }
  });
  return out.join('\n');
};

interface PrintInput {
  title: string;
  rows: readonly GppRowDTO[];
  type: GppType;
  periodFrom: number;
  periodTo: number;
  periodText: string;
  updatedAt: string | null;
  updatedBy: string | null;
  showLinks: boolean;
}

export const buildPrintHtml = (input: PrintInput): string => {
  const { rows, type } = input;
  const index = buildIndex(rows);
  // Все строки в порядке дерева с глубиной
  const ordered: { row: GppRowDTO; depth: number }[] = [];
  const walk = (parent: string | null) =>
    (index.children.get(parent) ?? []).forEach(r => {
      ordered.push({ row: r, depth: index.depth.get(r.uid) ?? 0 });
      walk(r.uid);
    });
  walk(null);

  const t = makeTimeline(input.periodFrom, input.periodTo, 'months', GANTT_W);
  const scaleX = GANTT_W / t.width;
  const geom = new Map([...barGeometry(rows, t)].map(([uid, g]) => [uid, { x0: g.x0 * scaleX, x1: g.x1 * scaleX }]));
  const rowOf = new Map(ordered.map((o, i) => [o.row.uid, i]));
  const metrics = { rowHeight: ROW_H, barHeight: BAR_H };
  const height = ordered.length * ROW_H;
  const months = monthTicks(t).map(m => ({ ...m, x0: m.x0 * scaleX, x1: m.x1 * scaleX }));

  const parts: string[] = [];
  months.slice(1).forEach(m => parts.push(`<line x1="${m.x0}" x2="${m.x0}" y1="0" y2="${height}" stroke="#E6E9F2" stroke-width="0.8"/>`));
  planLines(geom, rowOf, index.productOf, metrics).forEach(l =>
    parts.push(`<line x1="${l.x}" x2="${l.x}" y1="${l.y0}" y2="${l.y1}" stroke="#9AA6C0" stroke-width="0.8"/>`),
  );
  if (input.showLinks) {
    buildLinks(rows, type).forEach(link => {
      const a = geom.get(link.from);
      const b = geom.get(link.to);
      const ra = rowOf.get(link.from);
      const rb = rowOf.get(link.to);
      if (!a || !b || ra === undefined || rb === undefined) return;
      const p = routeLink(link, a, b, ra, rb, metrics);
      if (!p) return;
      const color = link.violated ? '#FF3052' : '#8D99B3';
      parts.push(`<path d="${p.d}" fill="none" stroke="${color}" stroke-width="0.9" stroke-dasharray="2.5 2.5"/>`, `<path d="${arrowHead(p.tip, p.down)}" fill="${color}"/>`);
    });
  }
  ordered.forEach((o, i) => {
    const g = geom.get(o.row.uid);
    if (!g) return;
    const y = i * ROW_H + (ROW_H - BAR_H) / 2;
    parts.push(`<rect x="${g.x0.toFixed(1)}" y="${y}" width="${Math.max(2, g.x1 - g.x0).toFixed(1)}" height="${BAR_H}" rx="3" fill="${barColor(o.row.color, o.row.kind, i)}"/>`);
  });

  const headerMonths = months
    .map(m => {
      const { year, month } = monthYear(m.value);
      const w = m.x1 - m.x0;
      return `<div class="m" style="left:${m.x0}px;width:${w}px">${w >= 56 ? MONTHS[month] : MONTHS_SHORT[month]}<br>${year}</div>`;
    })
    .join('');

  const body = ordered
    .map((o, i) => {
      const r = o.row;
      const strong = r.kind !== 'MATERIAL';
      return `<tr>
<td class="c">${i + 1}</td>
<td class="c">${esc(r.opNumber ?? '')}</td>
<td class="n${strong ? ' b' : ''}" style="padding-left:${6 + o.depth * 12}px">${esc(rowLabel(r))}</td>
<td class="c">${KIND_LABEL[r.kind]}</td>
<td class="c">${formatQty(r.quantity)}</td>
<td class="g"><svg width="${GANTT_W}" height="${ROW_H}" viewBox="0 ${i * ROW_H} ${GANTT_W} ${ROW_H}"><use href="#gpp-all"/></svg></td>
</tr>`;
    })
    .join('\n');

  const saved = input.updatedAt ? ` · Сохранён ${ruDateTime(input.updatedAt)}${input.updatedBy ? `, ${esc(input.updatedBy)}` : ''}` : '';
  const printed = ruDateTime(new Date().toISOString());

  return `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><title>${esc(input.title)}</title>
<style>
${interFontFaces()}
@page { size: A4 landscape; margin: 10mm; }
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; font-family: 'Inter', 'Segoe UI', Arial, sans-serif; color: #2D4059; background: #fff; }
h1 { font-size: 16px; font-weight: 600; margin: 0 0 4px; }
.meta { font-size: 10px; color: #6B7A93; margin-bottom: 10px; }
table { border-collapse: collapse; table-layout: fixed; width: ${544 + GANTT_W}px; font-size: 9.5px; }
thead { display: table-header-group; }
th { background: #EEF0FF; color: #2D4059; font-weight: 600; height: 34px; border-bottom: 1px solid #C9CEF5; padding: 0 4px; }
tr { height: ${ROW_H}px; page-break-inside: avoid; break-inside: avoid; }
td { height: ${ROW_H}px; border-bottom: 1px solid #EEF1F6; padding: 0 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
td.c { text-align: center; }
td.b { font-weight: 600; }
td.g { padding: 0; border-left: 1px solid #DDE2EE; }
td.g svg { display: block; }
th.g { padding: 0; position: relative; border-left: 1px solid #DDE2EE; }
.m { position: absolute; top: 4px; text-align: center; font-size: 9px; line-height: 12px; }
</style></head>
<body>
<h1>${esc(input.title)}</h1>
<div class="meta">Тип ГПП: ${TYPE_LABEL[type]} · Период выборки: ${esc(input.periodText)} (${ruDay(input.periodFrom)} — ${ruDay(input.periodTo)})${saved} · Напечатан ${printed}</div>
<svg width="0" height="0" style="position:absolute"><defs><g id="gpp-all">${parts.join('')}</g></defs></svg>
<table>
<colgroup><col style="width:28px"><col style="width:58px"><col style="width:330px"><col style="width:72px"><col style="width:56px"><col style="width:${GANTT_W}px"></colgroup>
<thead><tr><th>№</th><th>Номер операции</th><th style="text-align:left;padding-left:6px">Наименование</th><th>Вид элемента</th><th>Кол-во</th><th class="g">${headerMonths}</th></tr></thead>
<tbody>
${body}
</tbody></table>
</body></html>`;
};

/** Печать через скрытый iframe; на время печати заголовок страницы — имя будущего PDF-файла */
export const printHtml = (html: string, title: string): void => {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.setAttribute('data-gpp-print', '1');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  const previousTitle = document.title;
  let done = false;
  const cleanup = () => {
    if (done) return;
    done = true;
    document.title = previousTitle;
    window.setTimeout(() => iframe.remove(), 500);
  };
  iframe.onload = async () => {
    const win = iframe.contentWindow;
    const doc = iframe.contentDocument;
    if (!win || !doc) {
      cleanup();
      return;
    }
    doc.title = title;
    document.title = title;
    try {
      await doc.fonts?.ready;
    } catch {
      /* шрифты не дождались — печатаем как есть */
    }
    win.addEventListener('afterprint', cleanup);
    win.focus();
    win.print();
    // Если браузер не прислал afterprint — убрать iframe позже
    window.setTimeout(cleanup, 120_000);
  };
  iframe.srcdoc = html;
  document.body.appendChild(iframe);
};
