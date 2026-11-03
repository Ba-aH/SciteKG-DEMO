import { apiPaperDetail } from '../shared/api.js';
import { copyBibtex } from '../shared/bibtex.js';
import { $, el } from '../shared/ui.js';
// import { copyText } from '../shared/ui.js';
import { apiAuthorDetail } from './api.js';

/* ---------------------------------------------------------
   DETAIL PANEL — one panel, three kinds of node (paper, author, context)
--------------------------------------------------------- */
const paperPanel = $('paper-panel');
const shortId = (uri) => uri.split('/').pop().slice(0, 8);

let panelUri = null; // node shown in the detail panel
let getSelectedUri = () => null;
let onExplore = () => {};
const PANEL_SECTIONS = ['authors', 'abstract', 'papers', 'context'];

function beginPanel({ kind, title, meta = '', uri, /* copyLabel, */ sections }){
  panelUri = uri;
  paperPanel.classList.add('open');
  $('pp-kind').textContent = kind;
  $('pp-title').textContent = title;
  $('pp-meta').textContent = meta;
  // $('pp-copy-uri').onclick = () => copyText(uri, 'URI');
  // $('pp-copy-title').textContent = `Copy ${copyLabel}`;
  // $('pp-copy-title').onclick = () => copyText($('pp-title').textContent, copyLabel);
  $('pp-cite').hidden = true;
  // $('pp-copy-journal').hidden = true;
  $('pp-explore').hidden = true;
  PANEL_SECTIONS.forEach(name => { $(`pp-${name}-section`).hidden = !sections.includes(name); });
}

function fillContext(ctx, heading){
  const section = $('pp-context-section');
  section.hidden = !ctx?.text;
  if (section.hidden) return;
  $('pp-context-heading').textContent = heading;
  $('pp-context-marker').textContent = [ctx.marker, ctx.type].filter(Boolean).join(' · ');
  $('pp-context-before').textContent = ctx.before ? `${ctx.before} ` : '';
  $('pp-context-text').textContent = ctx.text;
  $('pp-context-after').textContent = ctx.after ? ` ${ctx.after}` : '';
}

export async function openPaperPanel(uri, citationContext, role){
  beginPanel({ kind: 'Paper', title: 'Loading…', uri, /* copyLabel: 'title', */ sections: ['authors', 'abstract', 'context'] });
  $('pp-authors').textContent = '—';
  $('pp-abstract').textContent = '—';
  fillContext(null);

  let meta;
  try {
    meta = await apiPaperDetail(uri);
  } catch (err){
    $('pp-title').textContent = 'Failed to load paper';
    console.error(err);
    return;
  }
  if (panelUri !== uri) return; // the user clicked another node meanwhile

  $('pp-title').textContent = meta.title || '(no title)';
  // $('pp-meta').textContent = [meta.year, meta.venue].filter(Boolean).join(' · ') || shortId(uri);
  $('pp-authors').textContent = meta.authors?.length ? meta.authors.join(', ') : '—';
  $('pp-abstract').textContent = meta.abstract || '(no abstract available)';

  $('pp-cite').hidden = false;
  $('pp-cite').onclick = () => copyBibtex(uri);
  // if (meta.venue && !/^https?:/.test(meta.venue)){
  //   $('pp-copy-journal').hidden = false;
  //   $('pp-copy-journal').onclick = () => copyText(meta.venue, 'Journal');
  // }

  // re-center the graph on any neighbor to keep exploring the KG
  $('pp-explore').hidden = uri === getSelectedUri();
  $('pp-explore').onclick = () => {
    closePanel();
    onExplore(uri, meta.title);
  };

  fillContext(citationContext, role === 'references'
    ? 'Citation contexts where the selected paper cites this paper'
    : 'Citation contexts where this paper cites the selected paper');
}

export async function openAuthorPanel(uri, name){
  beginPanel({ kind: 'Author', title: name, uri, /* copyLabel: 'name', */ sections: ['papers'] });
  const list = $('pp-papers');
  list.replaceChildren(el('li', { textContent: 'Loading…' }));

  let author;
  try {
    author = await apiAuthorDetail(uri);
  } catch (err){
    list.replaceChildren(el('li', { textContent: 'Failed to load author' }));
    console.error(err);
    return;
  }
  if (panelUri !== uri) return;

  $('pp-title').textContent = author.name;
  $('pp-meta').textContent = `${author.papers.length} paper${author.papers.length === 1 ? '' : 's'}`;
  list.replaceChildren(...author.papers.map(p => el('li', { textContent: p.title })));
}

export function openContextPanel(ctx){
  beginPanel({
    kind: 'Citation context',
    title: ctx.marker || 'Citation context',
    meta: `Citing paper: ${ctx.citingTitle}\nCited paper: ${ctx.citedTitle}`,
    uri: ctx.uri,
    // copyLabel: 'passage',
    sections: ['context']
  });
  // $('pp-copy-title').onclick = () => copyText(ctx.text ?? '', 'Passage');
  fillContext(ctx, 'Citation Context');
}

export const closePanel = () => paperPanel.classList.remove('open');
export const isPanelOpen = () => paperPanel.classList.contains('open');

// getSelectedUri(): paper currently at the center of the graph; onExplore(uri, title): re-center on another one
export function initPanel(callbacks){
  getSelectedUri = callbacks.getSelectedUri;
  onExplore = callbacks.onExplore;
  $('paper-panel-close').addEventListener('click', closePanel);
}
