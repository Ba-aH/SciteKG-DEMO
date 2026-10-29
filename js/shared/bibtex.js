// Cite button: copies a BibTeX entry for a paper. Used by the recommendation list and the graph's detail panel.
import { apiPaperDetail } from './api.js';
import { copyText, el, toast } from './ui.js';

/* ---------------------------------------------------------
   BIBTEX — built from the metadata the KG has (title, authors, venue, year)
--------------------------------------------------------- */
const TITLE_STOPWORDS = new Set(['the', 'a', 'an', 'on', 'of', 'for', 'and', 'in', 'to', 'with', 'from', 'by', 'at', 'as']);

const plainAscii = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const escapeBibtex = (text) => text.replace(/([&%$#_])/g, '\\$1');

// "Peter McBurney" -> "McBurney, Peter"; names already written "Last, First" are kept
function bibtexAuthor(name){
  if (name.includes(',')) return name;
  const parts = name.trim().split(/\s+/);
  return parts.length < 2 ? name : `${parts.at(-1)}, ${parts.slice(0, -1).join(' ')}`;
}

// key like mcburney2001intelligent: first author + year + first meaningful title word
function bibtexKey({ authors, year, title }){
  const lastName = authors?.[0] ? plainAscii(bibtexAuthor(authors[0]).split(',')[0]) : '';
  const firstWord = (title ?? '').split(/\s+/).map(plainAscii).find(w => w.length > 2 && !TITLE_STOPWORDS.has(w)) ?? '';
  return `${lastName}${year ?? ''}${firstWord}` || 'reference';
}

export function toBibtex(paper){
  const title = paper.title === '(no title)' ? null : paper.title;
  const venue = paper.venue && !/^https?:/.test(paper.venue) ? paper.venue : null; // skip venue URIs
  const fields = [
    ['title', title],
    ['author', paper.authors?.map(bibtexAuthor).join(' and ')],
    ['journal', venue],
    ['year', paper.year]
  ].filter(([, value]) => value); // fields the KG doesn't have are left out
  const body = fields.map(([name, value]) => `  ${name}={${escapeBibtex(value)}}`).join(',\n');
  return `@${venue ? 'article' : 'misc'}{${bibtexKey({ ...paper, title })},\n${body}\n}`;
}

export async function copyBibtex(uri){
  try {
    await copyText(toBibtex(await apiPaperDetail(uri)), 'BibTeX');
  } catch (err){
    console.error(err);
    toast('Could not load the paper metadata');
  }
}

export function citeButton(uri){
  return el('button', {
    className: 'btn btn-ghost btn-sm cite-btn',
    title: 'Copy BibTeX',
    onclick: () => copyBibtex(uri)
  }, el('span', { className: 'icon-quote' }), 'Cite');
}
