import { getThemeColors } from '@/constants/theme';

// Raw CSS exception to the styling boundary: app/+html.tsx renders <head> in Node during static
// rendering, so `body` exists before any ui component could paint it.
const WEB_ROOT_CSS = `
body {
  background-color: ${getThemeColors('light').background};
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: ${getThemeColors('dark').background};
  }
}`;

export default WEB_ROOT_CSS;
