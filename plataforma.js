/* ═══════════════════════════════════════════════
   NEXUS DIGITAL — plataforma.js
   Integração Google Sheets como CMS
   ═══════════════════════════════════════════════

   COMO CONFIGURAR:
   ─────────────────────────────────────────────
   1. Crie uma planilha no Google Sheets com
      as colunas abaixo (linha 1 = cabeçalho):

      A: ordem      → número da etapa (1, 2, 3...)
      B: titulo     → nome da etapa
      C: subtitulo  → ex: "Introdução", "PDF", "Links"
      D: tipo       → text | pdf | links
      E: descricao  → frase curta que aparece abaixo do título
      F: conteudo   → o conteúdo (veja abaixo por tipo)

   COLUNA F por tipo:
   ─────────────────────────────────────────────
   tipo = text:
     Escreva o texto livremente. Formatação aceita:
       **texto**     → negrito
       ## Título     → subtítulo
       - item        → item de lista

   tipo = pdf:
     Um PDF por linha, separado por |
     Formato: Nome do arquivo | link do Google Drive
     Exemplo:
       Script de Prospecção | https://drive.google.com/...
       Checklist de Cliente | https://drive.google.com/...
     (separe múltiplos PDFs com quebra de linha Alt+Enter)

   tipo = links:
     Um link por linha, separado por |
     Formato: Nome do link | URL | url-curta
     Exemplo:
       Notion — Organização | https://notion.so | notion.so
     (separe múltiplos links com quebra de linha Alt+Enter)

   2. Vá em Arquivo → Compartilhar → Publicar na web
      → Planilha inteira → Valores separados por vírgula (CSV)
      → Publicar → copie o link gerado

   3. Cole o link em SHEETS_CSV_URL abaixo

   4. Troque a SENHA abaixo

   ═══════════════════════════════════════════════ */

const CONFIG = {
    // Senha de acesso
    password: 'nexus2025',

    // Cole aqui o link CSV da planilha publicada
    // Arquivo → Compartilhar → Publicar na web → CSV
    sheetsUrl: 'COLE_AQUI_O_LINK_CSV_DA_PLANILHA',

    // Fallback: conteúdo de exemplo enquanto a planilha não está configurada
    fallback: [
        {
            ordem: 1,
            titulo: 'Bem-vindo à Nexus',
            subtitulo: 'Introdução',
            tipo: 'text',
            descricao: 'Tudo começa com clareza. Antes de qualquer estratégia, entenda onde você está e onde precisa chegar.',
            conteudo: `## O que você vai encontrar aqui\nA trilha foi estruturada para ser seguida do início ao fim, em ordem. Cada etapa constrói sobre a anterior.\n- Materiais práticos com aplicação imediata\n- Scripts prontos para usar nas suas abordagens\n- Checklists para cada fase do processo\n## Como usar esta plataforma\nNavegue pelas etapas no menu lateral. Ao concluir cada uma, clique em **"Marcar como concluído"** para acompanhar seu progresso. Não existe atalho — existe execução consistente.`
        },
        {
            ordem: 2,
            titulo: 'Lista de Leitura Nexus Digital',
            subtitulo: 'Nexus Digital',
            tipo: 'links',
            descricao: 'Acesse a biblioteca completa de materiais selecionados para sua jornada.',
            conteudo: `Lista de Leitura Nexus Digital | https://drive.google.com/drive/folders/18B-GGe6-zx1qkwgs8Arkm2C6FVJSea1h | drive.google.com`
        },
        {
            ordem: 3,
            titulo: 'Ferramentas Essenciais',
            subtitulo: 'Links & Recursos',
            tipo: 'links',
            descricao: 'Recursos externos selecionados para otimizar sua operação desde o início.',
            conteudo: `Calculadora de Metas Nexus Digital | https://1drv.ms/x/c/824c0aeacea1a699/IQC07gO3Eei-TaaowGP029MfAaA6DFaEYTJnGcY_kPk-XUg?e=oeSju2 | onedrive.com\nNotion — Organização de Clientes | https://notion.so | notion.so\nApollo.io — Prospecção e Leads | https://apollo.io | apollo.io\nLoom — Gravação de Propostas | https://loom.com | loom.com`
        }
    ]
};

/* ══════════════════════════════════════════════
   STATE
   ══════════════════════════════════════════════ */
let state = {
    currentStep: 0,
    completed: [],
    trail: []
};

/* ══════════════════════════════════════════════
   GOOGLE SHEETS — buscar e parsear CSV
   ══════════════════════════════════════════════ */
async function fetchTrail() {
    // Se URL não configurada, usa fallback
    if (!CONFIG.sheetsUrl || CONFIG.sheetsUrl.includes('COLE_AQUI')) {
        return CONFIG.fallback;
    }

    try {
        const res = await fetch(CONFIG.sheetsUrl);
        if (!res.ok) throw new Error('Falha ao buscar planilha');
        const csv = await res.text();
        return parseCSV(csv);
    } catch (e) {
        console.warn('Erro ao carregar planilha, usando fallback:', e);
        return CONFIG.fallback;
    }
}

function parseCSV(csv) {
    const lines = csv.trim().split('\n');
    // Remove cabeçalho (linha 1)
    const rows = lines.slice(1);

    const trail = [];
    for (const row of rows) {
        // CSV com possíveis campos entre aspas
        const cols = parseCSVRow(row);
        if (!cols[0] || !cols[1]) continue; // pula linhas vazias

        trail.push({
            ordem:     parseInt(cols[0]) || trail.length + 1,
            titulo:    (cols[1] || '').trim(),
            subtitulo: (cols[2] || '').trim(),
            tipo:      (cols[3] || 'text').trim().toLowerCase(),
            descricao: (cols[4] || '').trim(),
            conteudo:  (cols[5] || '').trim()
        });
    }

    // Ordena por coluna "ordem"
    trail.sort((a, b) => a.ordem - b.ordem);
    return trail;
}

function parseCSVRow(row) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === '"') {
            if (inQuotes && row[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current);
    return result;
}

/* ══════════════════════════════════════════════
   FORMATAÇÃO DE TEXTO (mini markdown)
   ══════════════════════════════════════════════ */
function parseContent(raw) {
    if (!raw) return '';

    // Normaliza quebras de linha (Sheets usa \n ou \r\n)
    const text = raw.replace(/\r\n/g, '\n').replace(/\\n/g, '\n');
    const lines = text.split('\n');

    let html = '<div class="lesson-text">';
    let inList = false;

    for (let line of lines) {
        line = line.trim();
        if (!line) {
            if (inList) { html += '</ul>'; inList = false; }
            continue;
        }

        // ## Subtítulo
        if (line.startsWith('## ')) {
            if (inList) { html += '</ul>'; inList = false; }
            html += `<h3>${formatInline(line.slice(3))}</h3>`;

        // - Lista
        } else if (line.startsWith('- ')) {
            if (!inList) { html += '<ul>'; inList = true; }
            html += `<li>${formatInline(line.slice(2))}</li>`;

        // Parágrafo normal
        } else {
            if (inList) { html += '</ul>'; inList = false; }
            html += `<p>${formatInline(line)}</p>`;
        }
    }

    if (inList) html += '</ul>';
    html += '</div>';
    return html;
}

function formatInline(text) {
    // **negrito**
    return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

/* ══════════════════════════════════════════════
   PARSEAR PDFs (formato: Nome | URL por linha)
   ══════════════════════════════════════════════ */
function parsePDFs(raw) {
    if (!raw) return [];
    const text = raw.replace(/\r\n/g, '\n').replace(/\\n/g, '\n');
    return text.split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .map(line => {
            const parts = line.split('|').map(p => p.trim());
            return {
                name: parts[0] || 'Arquivo',
                url:  convertDriveLink(parts[1] || '#')
            };
        });
}

// Converte links do Drive para o formato correto de abertura
function convertDriveLink(url) {
    if (!url || url === '#') return '#';

    // Pasta: /drive/folders/ID → mantém como está
    if (url.includes('/drive/folders/')) return url;

    // Arquivo: /file/d/ID → garante abertura no viewer
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
        return `https://drive.google.com/file/d/${match[1]}/view`;
    }

    return url;
}

/* ══════════════════════════════════════════════
   PARSEAR LINKS (formato: Nome | URL | curta)
   ══════════════════════════════════════════════ */
function parseLinks(raw) {
    if (!raw) return [];
    const text = raw.replace(/\r\n/g, '\n').replace(/\\n/g, '\n');
    return text.split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .map(line => {
            const parts = line.split('|').map(p => p.trim());
            return {
                name:    parts[0] || 'Link',
                url:     parts[1] || '#',
                display: parts[2] || parts[1] || '#'
            };
        });
}

/* ══════════════════════════════════════════════
   AUTH
   ══════════════════════════════════════════════ */
function doLogin() {
    const val = document.getElementById('passwordInput').value.trim();
    const err = document.getElementById('loginError');

    if (!val) { showError('Digite a senha de acesso.'); return; }
    if (val !== CONFIG.password) {
        showError('Senha incorreta. Verifique e tente novamente.');
        document.getElementById('passwordInput').value = '';
        return;
    }

    err.textContent = '';
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('platformScreen').classList.add('active');
    initPlatform();
}

function showError(msg) {
    const err = document.getElementById('loginError');
    err.textContent = msg;
    err.style.animation = 'none';
    requestAnimationFrame(() => { err.style.animation = 'fadeIn 0.3s ease'; });
}

function doLogout() {
    document.getElementById('platformScreen').classList.remove('active');
    document.getElementById('loginScreen').classList.add('active');
    document.getElementById('passwordInput').value = '';
    state = { currentStep: 0, completed: [], trail: [] };
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('passwordInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doLogin();
    });
});

/* ══════════════════════════════════════════════
   PLATFORM INIT
   ══════════════════════════════════════════════ */
async function initPlatform() {
    showLoading(true);

    const trail = await fetchTrail();
    state.trail = trail;

    showLoading(false);
    buildTrail();
    loadStep(0);
    updateProgress();
}

function showLoading(on) {
    const main = document.getElementById('mainContent');
    if (on) {
        main.innerHTML = `
            <div class="loading-state">
                <div class="loading-diamond"></div>
                <span>Carregando conteúdo...</span>
            </div>
        `;
    }
}

/* ══════════════════════════════════════════════
   SIDEBAR TRAIL
   ══════════════════════════════════════════════ */
function buildTrail() {
    const list = document.getElementById('trailList');
    list.innerHTML = '';

    state.trail.forEach((step, i) => {
        const item = document.createElement('div');
        item.className = [
            'trail-item',
            i === state.currentStep ? 'active' : '',
            state.completed.includes(i) ? 'done' : ''
        ].join(' ').trim();
        item.dataset.index = i;
        item.onclick = () => loadStep(i);

        item.innerHTML = `
            <div class="trail-item-inner">
                <div class="trail-step-num">
                    <span class="trail-num-inner">${i + 1}</span>
                </div>
                <div class="trail-item-text">
                    <div class="trail-item-name">${step.titulo}</div>
                    <div class="trail-item-type">${step.subtitulo}</div>
                </div>
                <div class="trail-type-icon">${getTypeIcon(step.tipo)}</div>
            </div>
        `;
        list.appendChild(item);
    });
}

function getTypeIcon(type) {
    const icons = {
        text:  `<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
        pdf:   `<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
        links: `<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>`
    };
    return icons[type] || icons.text;
}

/* ══════════════════════════════════════════════
   CONTENT RENDER
   ══════════════════════════════════════════════ */
function loadStep(index) {
    state.currentStep = index;
    const step = state.trail[index];
    if (!step) return;

    const main = document.getElementById('mainContent');
    closeSidebar();
    main.scrollTo(0, 0);

    document.querySelectorAll('.trail-item').forEach((el, i) => {
        el.classList.toggle('active', i === index);
    });

    const isDone  = state.completed.includes(index);
    const hasPrev = index > 0;
    const hasNext = index < state.trail.length - 1;

    let bodyHTML = '';

    if (step.tipo === 'text') {
        bodyHTML = parseContent(step.conteudo);

    } else if (step.tipo === 'pdf') {
        const files = parsePDFs(step.conteudo);
        bodyHTML = files.map(f => `
            <a href="${f.url}" target="_blank" rel="noopener" class="pdf-card">
                <div class="pdf-icon">
                    <svg viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                    </svg>
                </div>
                <div class="pdf-info">
                    <div class="pdf-name">${f.name}</div>
                    <div class="pdf-meta">PDF · Google Drive</div>
                </div>
                <div class="pdf-arrow">→</div>
            </a>
        `).join('');

    } else if (step.tipo === 'links') {
        const links = parseLinks(step.conteudo);
        bodyHTML = links.map(l => `
            <a href="${l.url}" target="_blank" rel="noopener" class="link-card">
                <div class="link-card-icon">
                    <svg viewBox="0 0 24 24">
                        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                    </svg>
                </div>
                <div class="link-card-text">
                    <div class="link-card-name">${l.name}</div>
                    <div class="link-card-url">${l.display}</div>
                </div>
                <div class="link-card-arrow">→</div>
            </a>
        `).join('');
    }

    main.innerHTML = `
        <div class="fade-in">
            <div class="content-header">
                <div class="content-step-label">Etapa ${index + 1} de ${state.trail.length}</div>
                <h1 class="content-title">${formatTitle(step.titulo)}</h1>
                <p class="content-desc">${step.descricao || ''}</p>
            </div>
            <div class="content-body">
                ${bodyHTML}
            </div>
            <div class="content-nav">
                <button class="btn-nav" onclick="loadStep(${index - 1})" ${!hasPrev ? 'disabled' : ''}>
                    <span>← Anterior</span>
                </button>
                <button class="btn-complete ${isDone ? 'done' : ''}" onclick="markDone(${index})" ${isDone ? 'disabled' : ''}>
                    <span>${isDone ? '✓ Concluído' : 'Marcar como concluído'}</span>
                </button>
                <button class="btn-nav" onclick="loadStep(${index + 1})" ${!hasNext ? 'disabled' : ''}>
                    <span>Próximo →</span>
                </button>
            </div>
        </div>
    `;
}

function formatTitle(title) {
    const words = title.split(' ');
    if (words.length <= 1) return title;
    const last = words.pop();
    return words.join(' ') + ' <em>' + last + '</em>';
}

/* ══════════════════════════════════════════════
   PROGRESS
   ══════════════════════════════════════════════ */
function markDone(index) {
    if (!state.completed.includes(index)) state.completed.push(index);
    buildTrail();
    loadStep(index);
    updateProgress();
}

function updateProgress() {
    const total = state.trail.length;
    const done  = state.completed.length;
    const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
    document.getElementById('progressLabel').textContent = `${done} / ${total}`;
    document.getElementById('progressFill').style.width  = pct + '%';
}

/* ══════════════════════════════════════════════
   SIDEBAR MOBILE
   ══════════════════════════════════════════════ */
function toggleSidebar() {
    const sb   = document.getElementById('sidebar');
    const ov   = document.getElementById('sidebarOverlay');
    const open = sb.classList.toggle('open');
    ov.classList.toggle('open', open);
}
function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
}