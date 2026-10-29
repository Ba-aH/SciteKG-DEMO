// Small helpers every area uses: DOM lookups, the status pill, toasts and the clipboard.

export const $ = (id) => document.getElementById(id);

// Tiny DOM builder: el('div', {className: 'x'}, child1, child2)
export function el(tag, props = {}, ...children){
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

export const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export function setStatus(text, isError = false){
  const status = $('status');
  status.textContent = text;
  status.classList.toggle('error', isError);
}

let toastTimer;
export function toast(message){
  const node = $('toast');
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('show'), 1800);
}

export async function copyText(text, label){
  await navigator.clipboard.writeText(text);
  toast(`${label} copied`);
}
