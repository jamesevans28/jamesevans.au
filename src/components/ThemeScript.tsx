/**
 * Runs before first paint to set data-theme from localStorage (or the system
 * preference), preventing a flash of the wrong theme. Rendered in <head>.
 */
const script = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored === 'light' || stored === 'dark' ? stored : null;
    if (theme) {
      document.documentElement.setAttribute('data-theme', theme);
    }
  } catch (e) {}
})();
`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
