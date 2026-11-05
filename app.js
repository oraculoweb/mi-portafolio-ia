// Mi Portafolio IA: toda la tarjeta se construye en el navegador.
const canvas = document.getElementById('cardCanvas');
const ctx = canvas.getContext('2d');
const frame = document.getElementById('canvasFrame');
const imageInput = document.getElementById('imageInput');
const imageError = document.getElementById('imageError');
const formats = {
  landscape: { width: 1920, height: 1080, label: '1920 × 1080', ratio: 16 / 9 },
  portrait: { width: 1080, height: 1920, label: '1080 × 1920', ratio: 9 / 16 },
  square: { width: 1080, height: 1080, label: '1080 × 1080', ratio: 1 },
  social: { width: 1080, height: 1350, label: '1080 × 1350', ratio: 4 / 5 }
};
const themes = {
  dark: { bg: '#171722', panel: '#222230', text: '#f7f5fb', muted: '#bbb7c8', overlay: '#101018' },
  light: { bg: '#f3f0e9', panel: '#fffdf9', text: '#292638', muted: '#777383', overlay: '#16151a' },
  color: { bg: '#7357c9', panel: '#8c71dd', text: '#ffffff', muted: '#e6defd', overlay: '#292044' }
};
let artwork = null;
let theme = 'dark';
let level = 'Medio';
let format = 'landscape';
let accent = '#a78bfa';
let renderRequest = 0;

// Carga una imagen local y rechaza archivos que no sean del tipo solicitado.
function loadImage(file) {
  imageError.textContent = '';
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    imageError.textContent = 'Elige una imagen JPG, PNG o WEBP.';
    return;
  }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    if (artwork && artwork.src.startsWith('blob:')) URL.revokeObjectURL(artwork.src);
    artwork = img;
    document.getElementById('uploadTitle').textContent = file.name;
    document.getElementById('uploadSubtitle').textContent = `${img.naturalWidth} × ${img.naturalHeight} px · Lista para usar`;
    frame.classList.add('has-image');
    document.getElementById('downloadButton').disabled = false;
    drawCard();
    URL.revokeObjectURL(url);
  };
  img.onerror = () => { imageError.textContent = 'No se pudo abrir esa imagen. Prueba con otro archivo.'; URL.revokeObjectURL(url); };
  img.src = url;
}

// Dibuja una imagen cubriendo el área, con recorte centrado para el fondo borroso.
function drawCover(image, x, y, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const sw = width / scale, sh = height / scale;
  ctx.drawImage(image, (image.width - sw) / 2, (image.height - sh) / 2, sw, sh, x, y, width, height);
}

// Dibuja la imagen principal completa, sin deformarla ni recortar a las personas.
function drawContain(image, x, y, width, height) {
  const scale = Math.min(width / image.width, height / image.height);
  const w = image.width * scale, h = image.height * scale;
  ctx.drawImage(image, x + (width - w) / 2, y + (height - h) / 2, w, h);
}

function roundedRect(x, y, width, height, radius, color) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fillStyle = color;
  ctx.fill();
}

// Ajusta cada línea por palabras y devuelve las líneas para ajustar el alto del texto.
function wrapText(text, maxWidth, font) {
  ctx.font = font;
  const lines = [];
  for (const paragraph of text.split('\n')) {
    if (!paragraph.trim()) { lines.push(''); continue; }
    let line = '';
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(candidate).width > maxWidth) { lines.push(line); line = word; }
      else line = candidate;
    }
    if (line) lines.push(line);
  }
  return lines;
}

function drawCard() {
  if (!artwork) return;
  const current = formats[format];
  const request = ++renderRequest;
  canvas.width = current.width;
  canvas.height = current.height;
  document.getElementById('dimensionsLabel').textContent = current.label;
  const w = canvas.width, h = canvas.height;
  const palette = themes[theme];
  const vertical = current.ratio < 0.8;

  // Fondo continuo: imagen desenfocada y oscurecida para rellenar el formato.
  ctx.save();
  ctx.filter = 'blur(36px)';
  drawCover(artwork, -45, -45, w + 90, h + 90);
  ctx.restore();
  ctx.fillStyle = theme === 'light' ? 'rgba(248,245,238,.52)' : 'rgba(13,12,22,.48)';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = palette.bg;
  ctx.globalAlpha = theme === 'color' ? .28 : .22;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;

  const pad = Math.round(w * (vertical ? .075 : .065));
  const gap = Math.round(w * .035);
  const headerH = Math.round(h * .10);
  const footerH = Math.round(h * .07);
  const contentY = pad + headerH;
  const contentH = h - contentY - pad - footerH;
  const imageW = vertical ? w - pad * 2 : Math.round((w - pad * 2 - gap) * .57);
  const imageH = vertical ? Math.round(contentH * .55) : contentH;
  const imageX = pad;
  const imageY = vertical ? contentY : contentY;
  const radius = Math.round(w * .018);

  // Encabezado con nombre de la colección y un detalle de color.
  ctx.fillStyle = accent;
  ctx.beginPath(); ctx.arc(pad + 10, pad + headerH / 2, Math.round(w * .008), 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = palette.text;
  ctx.font = `700 ${Math.round(w * .022)}px Manrope, Arial, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.fillText('MI PORTAFOLIO IA', pad + Math.round(w * .032), pad + headerH / 2);
  ctx.fillStyle = palette.muted;
  ctx.font = `500 ${Math.round(w * .011)}px Arial, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText('CREADO CON INTELIGENCIA ARTIFICIAL', w - pad, pad + headerH / 2);
  ctx.textAlign = 'left';

  // La foto completa queda encima del fondo desenfocado para conservar el encuadre original.
  roundedRect(imageX, imageY, imageW, imageH, radius, palette.panel);
  ctx.save();
  ctx.beginPath(); ctx.roundRect(imageX, imageY, imageW, imageH, radius); ctx.clip();
  ctx.filter = 'blur(25px)'; drawCover(artwork, imageX - 20, imageY - 20, imageW + 40, imageH + 40);
  ctx.filter = 'none';
  ctx.fillStyle = theme === 'light' ? 'rgba(255,255,255,.25)' : 'rgba(13,12,20,.25)';
  ctx.fillRect(imageX, imageY, imageW, imageH);
  const inset = Math.round(Math.min(imageW, imageH) * .035);
  drawContain(artwork, imageX + inset, imageY + inset, imageW - inset * 2, imageH - inset * 2);
  ctx.restore();

  // El panel y el texto comparten un diseño que se adapta a formatos verticales y apaisados.
  const panelX = vertical ? pad : imageX + imageW + gap;
  const panelY = vertical ? imageY + imageH + gap : contentY;
  const panelW = vertical ? w - pad * 2 : w - panelX - pad;
  const panelH = vertical ? contentY + contentH - panelY : contentH;
  const panelPad = Math.round(panelW * .075);
  roundedRect(panelX, panelY, panelW, panelH, radius, palette.panel);
  ctx.fillStyle = accent;
  roundedRect(panelX + panelPad, panelY + panelPad, Math.round(panelW * .12), Math.max(6, Math.round(h * .008)), 5, accent);

  const title = document.getElementById('titleInput').value.trim() || 'Una idea hecha imagen';
  const prompt = document.getElementById('promptInput').value.trim() || 'Tu prompt aparecerá aquí. Escribe cómo imaginaste y creaste esta imagen.';
  const tool = document.getElementById('toolInput').value;
  const ratio = document.getElementById('ratioInput').value.trim();
  const availableW = panelW - panelPad * 2;
  let titleSize = Math.round(w * (vertical ? .062 : .040));
  const minTitleSize = Math.round(w * .025);
  let titleLines = wrapText(title, availableW, `700 ${titleSize}px Manrope, Arial, sans-serif`);
  while (titleLines.length > (vertical ? 3 : 3) && titleSize > minTitleSize) {
    titleSize -= 2;
    titleLines = wrapText(title, availableW, `700 ${titleSize}px Manrope, Arial, sans-serif`);
  }
  const titleLineH = Math.round(titleSize * 1.16);
  const titleY = panelY + panelPad + Math.round(h * .045);
  ctx.fillStyle = palette.text;
  ctx.font = `700 ${titleSize}px Manrope, Arial, sans-serif`;
  ctx.textBaseline = 'top';
  titleLines.slice(0, 3).forEach((line, index) => ctx.fillText(line, panelX + panelPad, titleY + index * titleLineH));

  const metaY = titleY + titleLineH * Math.min(titleLines.length, 3) + Math.round(h * .022);
  ctx.fillStyle = accent;
  ctx.font = `700 ${Math.round(w * .012)}px Arial, sans-serif`;
  ctx.fillText(`${tool.toUpperCase()}  ·  IA ${level.toUpperCase()}${ratio ? `  ·  ${ratio}` : ''}`, panelX + panelPad, metaY);

  const promptTop = metaY + Math.round(h * .045);
  const footerReserve = Math.round(h * (vertical ? .13 : .12));
  const promptMaxH = Math.max(40, panelY + panelH - footerReserve - promptTop - panelPad / 2);
  let promptSize = Math.round(w * (vertical ? .021 : .017));
  const minPromptSize = Math.max(12, Math.round(w * .010));
  let lineH = Math.round(promptSize * 1.5);
  let promptLines = wrapText(prompt, availableW, `500 ${promptSize}px Arial, sans-serif`);
  while (promptLines.length * lineH > promptMaxH && promptSize > minPromptSize) {
    promptSize -= 1;
    lineH = Math.round(promptSize * 1.5);
    promptLines = wrapText(prompt, availableW, `500 ${promptSize}px Arial, sans-serif`);
  }
  const maxLines = Math.max(1, Math.floor(promptMaxH / lineH));
  if (promptLines.length > maxLines) {
    promptLines = promptLines.slice(0, maxLines);
    let last = promptLines[maxLines - 1];
    ctx.font = `500 ${promptSize}px Arial, sans-serif`;
    while (last.length > 0 && ctx.measureText(`${last}…`).width > availableW) last = last.slice(0, -1);
    promptLines[maxLines - 1] = `${last.trimEnd()}…`;
  }
  ctx.fillStyle = palette.muted;
  ctx.font = `500 ${promptSize}px Arial, sans-serif`;
  promptLines.forEach((line, index) => ctx.fillText(line, panelX + panelPad, promptTop + index * lineH));

  // Pie de tarjeta con autoría y una línea de acento.
  const footY = h - pad - footerH / 2;
  ctx.fillStyle = accent;
  ctx.fillRect(pad, footY, Math.round(w * .045), Math.max(3, Math.round(h * .004)));
  ctx.fillStyle = palette.text;
  ctx.font = `600 ${Math.round(w * .013)}px Arial, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.fillText('MI PORTAFOLIO IA', pad, footY + Math.round(h * .022));
  ctx.fillStyle = palette.muted;
  ctx.textAlign = 'right';
  ctx.font = `500 ${Math.round(w * .010)}px Arial, sans-serif`;
  ctx.fillText('MI PROCESO CREATIVO', w - pad, footY + Math.round(h * .022));
  ctx.textAlign = 'left';
  // Evita que una renderización antigua pise la más reciente.
  if (request !== renderRequest) return;
}

imageInput.addEventListener('change', event => loadImage(event.target.files[0]));
const dropzone = document.getElementById('dropzone');
dropzone.addEventListener('dragover', event => { event.preventDefault(); dropzone.classList.add('dragover'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', event => { event.preventDefault(); dropzone.classList.remove('dragover'); loadImage(event.dataTransfer.files[0]); });

// Redibuja la tarjeta cuando cambian los campos de texto o la herramienta.
document.getElementById('cardForm').addEventListener('input', drawCard);
document.getElementById('cardForm').addEventListener('change', drawCard);
document.querySelectorAll('.choice').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.choice').forEach(item => item.classList.remove('selected'));
  button.classList.add('selected'); level = button.dataset.level; drawCard();
}));
document.querySelectorAll('.theme-card').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.theme-card').forEach(item => item.classList.remove('selected'));
  button.classList.add('selected'); theme = button.dataset.theme; drawCard();
}));
document.querySelectorAll('.format-button').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.format-button').forEach(item => item.classList.remove('selected'));
  button.classList.add('selected'); format = button.dataset.format;
  const selected = formats[format];
  frame.style.aspectRatio = `${selected.width} / ${selected.height}`;
  drawCard();
}));
document.getElementById('accentInput').addEventListener('input', event => {
  accent = event.target.value;
  document.getElementById('accentValue').textContent = accent.toUpperCase();
  drawCard();
});

// Copia el texto del prompt y da aviso visible al usuario.
document.getElementById('copyPrompt').addEventListener('click', async () => {
  const status = document.getElementById('copyStatus');
  const prompt = document.getElementById('promptInput').value;
  if (!prompt.trim()) { status.textContent = 'Escribe un prompt para copiarlo.'; return; }
  try {
    await navigator.clipboard.writeText(prompt);
    status.textContent = 'Copiado';
  } catch {
    const temporary = document.createElement('textarea');
    temporary.value = prompt; document.body.appendChild(temporary); temporary.select();
    const copied = document.execCommand('copy'); temporary.remove();
    status.textContent = copied ? 'Copiado' : 'No se pudo copiar';
  }
  window.setTimeout(() => { status.textContent = ''; }, 2200);
});

// Exporta el canvas actual en PNG usando las dimensiones exactas del formato elegido.
document.getElementById('downloadButton').addEventListener('click', () => {
  if (!artwork) return;
  drawCard();
  canvas.toBlob(blob => {
    if (!blob) return;
    const link = document.createElement('a');
    link.download = `mi-portafolio-ia-${format}.png`;
    link.href = URL.createObjectURL(blob);
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }, 'image/png');
});
