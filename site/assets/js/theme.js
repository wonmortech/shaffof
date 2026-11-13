/* Runs in <head> before paint: marks JS and applies the stored or system theme (no inline script under the CSP). */
(function () {
  var d = document.documentElement, t = null;
  d.classList.add('js');
  try { t = localStorage.getItem('shaffof-theme'); } catch (e) { t = null; }
  if (t !== 'light' && t !== 'dark') t = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  d.setAttribute('data-theme', t);
})();
