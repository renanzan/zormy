/**
 * Estilos globais injetados no preview do Sandpack (CodeExample).
 * Permite que exemplos sem classes tenham aparência consistente.
 */

export const SANDPACK_PREVIEW_STYLES = `/* Estilos globais padrão para o preview dos exemplos (Sandpack)
1. Baseado no modern-normalize (https://github.com/sindresorhus/modern-normalize)
2. Ajustes opinativos do Tailwind CSS
*/

/* ==== RESET GLOBAL ==== */
*, ::before, ::after {
  box-sizing: border-box;
  border-width: 0;
  border-style: solid;
  border-color: currentColor;
}

html {
  line-height: 1.5;
  -webkit-text-size-adjust: 100%;
  -moz-tab-size: 4;
  tab-size: 4;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
}

body {
  margin: 0;
  line-height: inherit;
}

/* ==== TIPOGRAFIA ===== */
hr {
  height: 0;
  color: inherit;
  border-top-width: 1px;
}

abbr:where([title]) {
  text-decoration: underline dotted;
}

h1, h2, h3, h4, h5, h6 {
  font-size: inherit;
  font-weight: inherit;
  margin: 0;
}

a {
  color: inherit;
  text-decoration: inherit;
}

b, strong {
  font-weight: bolder;
}

code, kbd, samp, pre {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 1em;
}

small {
  font-size: 80%;
}

sub, sup {
  font-size: 75%;
  line-height: 0;
  position: relative;
  vertical-align: baseline;
}
sub { bottom: -0.25em; }
sup { top: -0.5em; }

/* ==== LISTAS ==== */
ol, ul, menu {
  list-style: none;
  margin: 0;
  padding: 0;
}

/* ==== FORMULÁRIOS (Reseta/aparência base) ==== */
button, input, optgroup, select, textarea {
  font-family: inherit;
  font-size: 100%;
  font-weight: inherit;
  line-height: inherit;
  color: inherit;
  margin: 0;
  padding: 0;
}

button, select {
  text-transform: none;
}

button,
[type='button'],
[type='reset'],
[type='submit'] {
  -webkit-appearance: button;
  background-color: transparent;
  background-image: none;
}

textarea {
  resize: vertical;
}

/* ==== MÍDIA ==== */
img, svg, video, canvas, audio, iframe, embed, object {
  display: block;
  vertical-align: middle;
}

img, video {
  max-width: 100%;
  height: auto;
}

/* ==== FORM (container) ==== */
form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 28rem;
  padding: 1.25rem;
  margin: 1.25rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
}

/* ==== LABELS ==== */
label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.25rem;
}

/* ==== INPUTS ==== */
input:not([type="checkbox"]):not([type="radio"]) {
  display: block;
  width: 100%;
  max-width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #111827;
  background-color: #fff;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

input::placeholder {
  color: #9ca3af;
}

/* ==== MENSAGEM DE ERRO ==== */
span.error,
.error {
  display: block;
  font-size: 0.75rem;
  color: #dc2626;
  margin-top: 0.25rem;
}

/* ==== BOTÕES ==== */
button {
  width: fit-content;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
  border: 1px solid transparent;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s, color 0.15s;
}

/* --- Botão primary --- */
button.primary,
button[type="submit"]:not(.secondary) {
  background-color: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
}

button.primary:hover,
button[type="submit"]:not(.secondary):hover {
  background-color: #2563eb;
  border-color: #2563eb;
}

/* --- Botão secondary --- */
button.secondary {
  background-color: #f3f4f6;
  color: #374151;
  border-color: #d1d5db;
}

button.secondary:hover {
  background-color: #e5e7eb;
  border-color: #9ca3af;
}
`;
