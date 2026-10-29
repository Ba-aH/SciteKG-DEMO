// The context textarea: [cite] highlighting, counters, validation and the "Insert [cite]" helper.
import { $, el } from '../shared/ui.js';

const CITE_MARKER = /\[cite?\]/g; // accepts [cite] and [cit]
const HAS_MARKER = /\[cite?\]/;   // no g flag: a global regex remembers lastIndex between test() calls

const contextInput = $('context-input');
const contextError = $('context-error');
const MAX_CHARS = contextInput.maxLength;

export const getContext = () => contextInput.value.trim();

export function setContext(text){
  contextInput.value = text;
  refreshContextUI();
  showContextError(null);
}

// Returns null if valid, or an error message string if not.
export function validateContext(text){
  if (!text) return 'Enter a citation context first.';
  if (!HAS_MARKER.test(text)){
    return 'Missing citation marker — add at least one [cite] where a reference belongs.';
  }
  return null;
}

export function showContextError(message){
  contextError.textContent = message ?? '';
  contextError.hidden = !message;
  contextInput.classList.toggle('invalid', Boolean(message));
}

// Repaint the mirror div behind the textarea so [cite] markers are highlighted.
function updateHighlight(text){
  const parts = text.split(/(\[cite?\])/);
  const nodes = parts.map((part, i) => i % 2 ? el('mark', { textContent: part }) : part);
  // trailing space keeps a final empty line the same height as in the textarea
  $('context-highlight').replaceChildren(...nodes, ' ');
}

function refreshContextUI(){
  const text = contextInput.value;
  const markers = text.match(CITE_MARKER)?.length ?? 0;

  $('counter').textContent = `${markers} marker${markers === 1 ? '' : 's'} · ${text.length} / ${MAX_CHARS}`;
  $('counter').classList.toggle('limit', text.length > MAX_CHARS * 0.9);

  updateHighlight(text);
  contextInput.style.height = 'auto'; // auto-grow so the textarea never scrolls internally
  contextInput.style.height = `${contextInput.scrollHeight}px`;
}

// onEdit runs when the user types; onSubmitShortcut on Ctrl/Cmd+Enter
export function initContextEditor({ onEdit, onSubmitShortcut }){
  contextInput.addEventListener('input', () => {
    refreshContextUI();
    showContextError(null);
    onEdit();
  });

  contextInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) onSubmitShortcut();
  });

  $('btn-cite').addEventListener('click', () => {
    contextInput.setRangeText('[cite]', contextInput.selectionStart, contextInput.selectionEnd, 'end');
    contextInput.focus();
    contextInput.dispatchEvent(new Event('input'));
  });

  refreshContextUI();
}
