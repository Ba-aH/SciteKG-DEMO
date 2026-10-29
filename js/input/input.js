// Input processing: the whole left panel. Hands a validated query to onSubmit; knows nothing about results.
import { $, setStatus } from '../shared/ui.js';
import { apiExample } from './api.js';
import { getContext, initContextEditor, setContext, showContextError, validateContext } from './context-editor.js';

let expectedUri = null; // cited paper of the loaded example (ground truth), if any

// onSubmit({context, title, abstract, expectedUri}) is called with a validated query
export function initInput({ onSubmit }){
  const submitBtn = $('btn-submit');

  async function submit(){
    const context = getContext();
    const error = validateContext(context);
    showContextError(error);
    if (error){
      setStatus('Fix the context before submitting', true);
      return;
    }

    const useExtra = $('toggle-extra').checked;
    const title = useExtra ? $('title-input').value.trim() : '';
    const abstract = useExtra ? $('abstract-input').value.trim() : '';

    submitBtn.disabled = true;
    try {
      await onSubmit({ context, title, abstract, expectedUri });
    } finally {
      submitBtn.disabled = false;
    }
  }

  initContextEditor({
    onEdit: () => { expectedUri = null; }, // user edited the text: the example's ground truth no longer applies
    onSubmitShortcut: submit
  });

  $('toggle-extra').addEventListener('change', (e) => {
    $('extra-fields').hidden = !e.target.checked;
  });

  // "Generate example" — asks the backend for one random example context.
  // If the checkbox is checked, the backend also resolves the cited
  // paper's title/abstract via SPARQL and returns everything in one call.
  $('btn-example').addEventListener('click', async () => {
    const titleInput = $('title-input');
    const abstractInput = $('abstract-input');

    // Always clear stale title/abstract from a previous example first.
    titleInput.value = '';
    abstractInput.value = '';

    try {
      const row = await apiExample($('toggle-extra').checked);
      setContext(row.context);

      // Backend only resolves title/abstract when with_details was true,
      // i.e. when the checkbox was checked — so just fill whatever comes back.
      titleInput.value = row.title || '';
      abstractInput.value = row.abstract || '';

      expectedUri = row.cited_uri ?? null;
      setStatus('Example loaded');
    } catch (err){
      console.error(err);
      setStatus('Failed to load example — check console / backend logs', true);
    }
  });

  submitBtn.addEventListener('click', submit);
}
