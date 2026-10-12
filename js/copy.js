/** Przyciski „kopiuj do schowka": każdy element z atrybutem data-copy="tekst". */
const RESET_MS = 1800;

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Rozwiązanie awaryjne dla starszych przeglądarek / połączeń bez HTTPS
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.cssText = 'position:fixed;top:-1000px;opacity:0;-webkit-user-select:text;user-select:text';
  document.body.append(area);
  area.select();
  try {
    if (!document.execCommand('copy')) throw new Error('copy failed');
  } finally {
    area.remove();
  }
}

export function initCopyButtons() {
  document.querySelectorAll('[data-copy]').forEach((button) => {
    const label = button.textContent;
    let timer;

    button.addEventListener('click', async () => {
      clearTimeout(timer);
      try {
        await copyText(button.dataset.copy);
        button.textContent = '✓ Skopiowano';
        button.classList.add('is-done');
      } catch {
        button.textContent = 'Nie udało się';
      }
      timer = setTimeout(() => {
        button.textContent = label;
        button.classList.remove('is-done');
      }, RESET_MS);
    });
  });
}
