const areas = {
  fila: document.getElementById("fila"),
  timeA: document.getElementById("timeA"),
  timeB: document.getElementById("timeB"),
  marcacao: document.getElementById("marcacao"),
  eliminados: document.getElementById("eliminados")
};

const lixeira = document.getElementById("lixeira");

const LIMITES = {
  timeA: 4,
  timeB: 4,
  marcacao: 4
};

const CHAVE_HISTORICO = "vilaDaBarra_historico";
const CHAVE_ESTADO = "vilaDaBarra_estado";

let scoreA = 0;
let scoreB = 0;
let contador = 1;
let jogadorSelecionado = null;
let saqueAtual = "A";
let modoSemEliminacao = false; // quando true, perdedor cai direto no final da fila (não vai pra eliminados)

// ===== CRIAR JOGADOR (número de camisa fixo, criado uma vez só) =====
function criarPlayerComNumero(nome, numero, jogando) {
  const el = document.createElement("div");
  el.className = "player";
  el.dataset.nome = nome.trim().toLowerCase();
  el.dataset.nomeOriginal = nome.trim();

  const numeroEl = document.createElement("span");
  numeroEl.className = "numero";
  numeroEl.textContent = numero;
  el.appendChild(numeroEl);
  el.appendChild(document.createTextNode(nome.trim()));

  if (jogando) el.classList.add("jogando");

  el.addEventListener("click", (e) => {
    e.stopPropagation();
    selecionarJogador(el);
  });

  return el;
}

function criarPlayer(nome) {
  return criarPlayerComNumero(nome, contador++, false);
}

function nomeJaExiste(nome) {
  const normalizado = nome.trim().toLowerCase();
  return [...document.querySelectorAll(".player")]
    .some(p => p.dataset.nome === normalizado);
}

function addPlayer() {
  const input = document.getElementById("nomeInput");
  const nome = input.value.trim();
  if (!nome) return;

  if (nomeJaExiste(nome)) {
    alert("Esse atleta já está cadastrado! Use outro nome.");
    return;
  }

  areas.fila.appendChild(criarPlayer(nome));
  input.value = "";
  atualizarFila();
  salvarEstado();
}

// ===== SELEÇÃO (clique pra selecionar, clique na área pra mover) =====
function selecionarJogador(el) {
  if (jogadorSelecionado === el) {
    el.classList.remove("selecionado");
    jogadorSelecionado = null;
    return;
  }

  if (jogadorSelecionado) {
    jogadorSelecionado.classList.remove("selecionado");
  }

  jogadorSelecionado = el;
  el.classList.add("selecionado");
}

Object.values(areas).forEach(area => {
  area.addEventListener("click", () => moverJogador(area));
});

function moverJogador(areaDestino) {
  if (!jogadorSelecionado) return;

  const limite = LIMITES[areaDestino.id];
  if (limite) {
    const ocupados = areaDestino.querySelectorAll(".player").length;
    if (ocupados >= limite) {
      alert(`Essa área já está no limite de ${limite} atletas!`);
      return;
    }
  }

  jogadorSelecionado.classList.remove("selecionado", "jogando");

  if (areaDestino.id === "timeA" || areaDestino.id === "timeB") {
    jogadorSelecionado.classList.add("jogando");
  }

  areaDestino.appendChild(jogadorSelecionado);
  jogadorSelecionado = null;

  atualizarFila();
  atualizarContadores();
  salvarEstado();
}

// ===== LIXEIRA (remove de vez, qualquer jogador, qualquer área) =====
lixeira.addEventListener("click", () => {
  if (!jogadorSelecionado) return;

  const nome = jogadorSelecionado.dataset.nomeOriginal;
  const confirmar = confirm(`Remover "${nome}" definitivamente?\n\nEssa ação não pode ser desfeita.`);
  if (!confirmar) return;

  jogadorSelecionado.remove();
  jogadorSelecionado = null;
  atualizarFila();
  atualizarContadores();
  salvarEstado();
});

// ===== DESTAQUE DO PRÓXIMO DA FILA (só visual) =====
function atualizarFila() {
  const jogadores = areas.fila.querySelectorAll(".player");
  jogadores.forEach((p, i) => p.classList.toggle("proximo", i === 0));
}

// ===== CONTADORES DE OCUPAÇÃO =====
function atualizarContadores() {
  document.getElementById("contTimeA").textContent =
    areas.timeA.querySelectorAll(".player").length + "/4";
  document.getElementById("contTimeB").textContent =
    areas.timeB.querySelectorAll(".player").length + "/4";
  document.getElementById("contMarcacao").textContent =
    areas.marcacao.querySelectorAll(".player").length + "/4";
  const contEliminados = document.getElementById("contEliminados");
  if (contEliminados) {
    contEliminados.textContent = areas.eliminados.querySelectorAll(".player").length;
  }
}

// ===== AÇÕES DA ÁREA DE ELIMINADOS =====

// botão 1: manda todo mundo que está em "Eliminados" de volta pro final da fila de espera
function reenviarEliminadosParaFila() {
  const jogadores = [...areas.eliminados.querySelectorAll(".player")];

  if (jogadores.length === 0) {
    alert("Não tem ninguém na área de Eliminados agora.");
    return;
  }

  const confirmar = confirm(
    `Enviar ${jogadores.length} atleta(s) de "Eliminados" de volta pro final da fila?`
  );
  if (!confirmar) return;

  jogadores.forEach(p => {
    p.classList.remove("jogando", "selecionado");
    areas.fila.appendChild(p);
  });

  jogadorSelecionado = null;
  atualizarFila();
  atualizarContadores();
  salvarEstado();
}

// botão 2: liga/desliga o modo onde o time perdedor não vai pra "Eliminados" —
// ele já cai direto no final da fila de espera (sem precisar mover manualmente)
function alternarModoSemEliminacao() {
  modoSemEliminacao = !modoSemEliminacao;
  atualizarBotaoModoSemEliminacao();
  salvarEstado();
}

function atualizarBotaoModoSemEliminacao() {
  const btn = document.getElementById("btnModoSemEliminacao");
  if (!btn) return;

  btn.classList.toggle("ativo", modoSemEliminacao);
  btn.textContent = modoSemEliminacao
    ? "🔒 Perdedor vai pra fila"
    : "🔓 Perdedor vai pra eliminados";
}

// ===== PLACAR =====
function atualizarPlacar() {
  document.getElementById("scoreA").innerText = scoreA;
  document.getElementById("scoreB").innerText = scoreB;
}

function addPonto(time) {
  if (time === "A") scoreA++;
  else scoreB++;
  definirSaque(time); // quem marca o ponto fica com o saque (regra do vôlei)
  atualizarPlacar();
  salvarEstado();
}

function removerPonto(time) {
  if (time === "A") { if (scoreA > 0) scoreA--; }
  else { if (scoreB > 0) scoreB--; }
  atualizarPlacar();
  salvarEstado();
}

// ===== INDICADOR DE SAQUE =====
function definirSaque(time) {
  saqueAtual = time;
  const bolinha = document.getElementById("saqueBolinha");
  const slot = document.getElementById(time === "A" ? "saqueSlotA" : "saqueSlotB");
  slot.appendChild(bolinha);
  salvarEstado();
}

function alternarSaqueManual() {
  definirSaque(saqueAtual === "A" ? "B" : "A");
}

// ===== CRONÔMETRO =====
let segundosPartida = 0;
let intervaloCronometro = null;

function iniciarPausarCronometro() {
  const btn = document.getElementById("btnCronometro");
  if (intervaloCronometro) {
    clearInterval(intervaloCronometro);
    intervaloCronometro = null;
    btn.textContent = "▶";
  } else {
    intervaloCronometro = setInterval(() => {
      segundosPartida++;
      atualizarCronometro();
      salvarEstado();
    }, 1000);
    btn.textContent = "⏸";
  }
}

function resetarCronometro() {
  clearInterval(intervaloCronometro);
  intervaloCronometro = null;
  segundosPartida = 0;
  atualizarCronometro();
  document.getElementById("btnCronometro").textContent = "▶";
  salvarEstado();
}

function atualizarCronometro() {
  document.getElementById("tempoPartida").textContent = tempoFormatado();
}

function tempoFormatado() {
  const m = String(Math.floor(segundosPartida / 60)).padStart(2, "0");
  const s = String(segundosPartida % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// ===== ESTADO DA PARTIDA ATUAL (jogadores, placar, cronômetro, saque) =====
function coletarJogadoresDeArea(areaId) {
  const area = areas[areaId];
  return [...area.querySelectorAll(".player")].map(p => ({
    nome: p.dataset.nomeOriginal,
    numero: p.querySelector(".numero").textContent,
    jogando: p.classList.contains("jogando")
  }));
}

function salvarEstado() {
  const estado = {
    contador,
    scoreA,
    scoreB,
    segundosPartida,
    saqueAtual,
    modoSemEliminacao,
    areas: {
      fila: coletarJogadoresDeArea("fila"),
      timeA: coletarJogadoresDeArea("timeA"),
      timeB: coletarJogadoresDeArea("timeB"),
      marcacao: coletarJogadoresDeArea("marcacao"),
      eliminados: coletarJogadoresDeArea("eliminados")
    }
  };
  try {
    localStorage.setItem(CHAVE_ESTADO, JSON.stringify(estado));
  } catch (err) {
    console.log("Erro ao salvar estado:", err);
  }
}

function restaurarEstado() {
  let estado = null;
  try {
    estado = JSON.parse(localStorage.getItem(CHAVE_ESTADO));
  } catch {
    estado = null;
  }

  if (!estado) {
    definirSaque("A");
    atualizarBotaoModoSemEliminacao();
    return;
  }

  contador = estado.contador || 1;
  scoreA = estado.scoreA || 0;
  scoreB = estado.scoreB || 0;
  segundosPartida = estado.segundosPartida || 0;
  modoSemEliminacao = estado.modoSemEliminacao || false;

  Object.entries(estado.areas || {}).forEach(([areaId, lista]) => {
    const area = areas[areaId];
    if (!area) return;
    lista.forEach(j => {
      area.appendChild(criarPlayerComNumero(j.nome, j.numero, j.jogando));
    });
  });

  atualizarPlacar();
  atualizarCronometro();
  atualizarFila();
  atualizarContadores();
  atualizarBotaoModoSemEliminacao();
  definirSaque(estado.saqueAtual || "A");
}

// ===== HISTÓRICO E RANKING (salvos no próprio celular, 100% offline) =====
function lerHistoricoLocal() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_HISTORICO)) || [];
  } catch {
    return [];
  }
}

function salvarHistoricoLocal(lista) {
  localStorage.setItem(CHAVE_HISTORICO, JSON.stringify(lista));
}

function salvarPartida(dados) {
  const historico = lerHistoricoLocal();
  historico.push({
    id: Date.now(),
    ...dados,
    data: new Date().toISOString()
  });
  salvarHistoricoLocal(historico);
}

function converterDuracaoParaSegundos(duracao) {
  if (!duracao) return 0;
  const [m, s] = duracao.split(":").map(Number);
  return (m || 0) * 60 + (s || 0);
}

function calcularRanking() {
  const historico = lerHistoricoLocal();
  const ranking = {};

  function getOuCriar(nome) {
    const chave = nome.trim().toLowerCase();
    if (!ranking[chave]) {
      ranking[chave] = { nome: nome.trim(), vitorias: 0, partidas: 0, tempoSegundos: 0 };
    }
    return ranking[chave];
  }

  historico.forEach(partida => {
    const segundos = typeof partida.duracaoSegundos === "number"
      ? partida.duracaoSegundos
      : converterDuracaoParaSegundos(partida.duracao);

    // tempo de quadra e partidas jogadas contam pra todo mundo que jogou, ganhando ou perdendo
    (partida.vencedoresNomes || []).forEach(nome => {
      const j = getOuCriar(nome);
      j.vitorias++;
      j.partidas++;
      j.tempoSegundos += segundos;
    });

    (partida.perdedoresNomes || []).forEach(nome => {
      const j = getOuCriar(nome);
      j.partidas++;
      j.tempoSegundos += segundos;
    });
  });

  return Object.values(ranking).sort((a, b) => b.vitorias - a.vitorias);
}

function formatarDuracaoLonga(segundos) {
  const total = Math.round(segundos || 0);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}min`;
  return `${m} min`;
}

// versão compacta, sem espaços, pra layouts apertados (ex: lista em duas colunas)
function formatarDuracaoCompacta(segundos) {
  const total = Math.round(segundos || 0);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}`;
  return `${m}min`;
}

// corta o texto com "…" se ele não couber na largura máxima (usa a fonte já definida no ctx)
function truncarTexto(ctx, texto, larguraMax) {
  if (ctx.measureText(texto).width <= larguraMax) return texto;
  let cortado = texto;
  while (cortado.length > 1 && ctx.measureText(cortado + "…").width > larguraMax) {
    cortado = cortado.slice(0, -1);
  }
  return cortado + "…";
}

function formatarData(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
  });
}

function formatarHora(isoString) {
  if (!isoString) return null;
  return new Date(isoString).toLocaleTimeString("pt-BR", {
    hour: "2-digit", minute: "2-digit"
  });
}

function renderHistorico() {
  const lista = document.getElementById("listaHistorico");
  const historico = lerHistoricoLocal();

  if (historico.length === 0) {
    lista.innerHTML = '<p class="vazio">Nenhuma partida finalizada ainda.</p>';
    return;
  }

  lista.innerHTML = historico
    .slice()
    .reverse()
    .map(p => {
      // partidas antigas (antes dessa atualização) não têm dados do time perdedor
      const temConfronto = p.perdedoresNomes !== undefined;

      const horaInicio = formatarHora(p.horaInicio);
      const horaFim = formatarHora(p.horaFim);
      const tempoJogo = (horaInicio && horaFim)
        ? `${horaInicio} x ${horaFim} (${p.duracao} de jogo)`
        : `${p.duracao} de jogo`;

      if (!temConfronto) {
        return `
          <div class="item-historico">
            <div class="placar-final">${p.placarA} x ${p.placarB} — Vitória Time ${p.vencedor}</div>
            <div class="meta">⏱ ${tempoJogo} · 📅 ${formatarData(p.data)}</div>
            <div class="meta">🏆 ${(p.vencedoresNomes || []).join(", ") || "—"}</div>
          </div>
        `;
      }

      return `
        <div class="item-historico">
          <div class="confronto">
            <div class="equipe-resultado vencedor">
              <div class="equipe-tag">🏆 Time ${p.vencedor}</div>
              <div class="equipe-placar">${p.placarVencedor}</div>
              <div class="equipe-jogadores">${(p.vencedoresNomes || []).join(", ") || "—"}</div>
            </div>
            <div class="confronto-x">x</div>
            <div class="equipe-resultado perdedor">
              <div class="equipe-tag">Time ${p.perdedorTime}</div>
              <div class="equipe-placar">${p.placarPerdedor}</div>
              <div class="equipe-jogadores">${(p.perdedoresNomes || []).join(", ") || "—"}</div>
            </div>
          </div>
          <div class="meta">⏱ ${tempoJogo}</div>
          <div class="meta">📅 ${formatarData(p.data)}</div>
        </div>
      `;
    })
    .join("");
}

function renderRanking() {
  const lista = document.getElementById("listaRanking");
  const ranking = calcularRanking();

  if (ranking.length === 0) {
    lista.innerHTML = '<p class="vazio">Ninguém venceu uma partida ainda.</p>';
    return;
  }

  lista.innerHTML = ranking
    .map((j, i) => `
      <div class="item-ranking">
        <span class="posicao">${i + 1}º</span>
        <span class="nome">${j.nome}</span>
        <span class="tempo-quadra">🎮 ${j.partidas} · ⏱ ${formatarDuracaoLonga(j.tempoSegundos)}</span>
        <span class="vitorias">${j.vitorias} ${j.vitorias === 1 ? "vitória" : "vitórias"}</span>
      </div>
    `)
    .join("");
}

// ===== EXPORTAR RANKING (imagem simples, pronta pra compartilhar no WhatsApp) =====
async function exportarHistorico() {
  const ranking = calcularRanking();

  if (ranking.length === 0) {
    alert("Ainda não há vitórias registradas para exportar.");
    return;
  }

  const canvas = await gerarImagemRanking(ranking);
  const blob = criarPDFapartirDoCanvas(canvas);
  const arquivo = new File([blob], "ranking-vila-da-barra.pdf", { type: "application/pdf" });

  if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
    try {
      await navigator.share({
        files: [arquivo],
        title: "Ranking Vila da Barra",
        text: "🏆 Ranking de vitórias da Vila da Barra"
      });
      return;
    } catch (err) {
      if (err.name === "AbortError") return; // usuário cancelou o compartilhamento
    }
  }

  // sem suporte a compartilhamento direto: baixa o PDF pra enviar manualmente
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "ranking-vila-da-barra.pdf";
  link.click();
  URL.revokeObjectURL(url);
}

// monta um PDF de página única a partir do canvas (imagem em alta resolução, qualidade de impressão)
function criarPDFapartirDoCanvas(canvas) {
  const LARGURA_PDF_PT = 595; // ~ largura A4, em pontos
  const ALTURA_PDF_PT = LARGURA_PDF_PT * (canvas.height / canvas.width);

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    unit: "pt",
    format: [LARGURA_PDF_PT, ALTURA_PDF_PT]
  });

  const dataUrl = canvas.toDataURL("image/png", 1.0);
  doc.addImage(dataUrl, "PNG", 0, 0, LARGURA_PDF_PT, ALTURA_PDF_PT);

  return doc.output("blob");
}

function desenharRetanguloArredondado(ctx, x, y, w, h, r) {
  const raio = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + raio, y);
  ctx.lineTo(x + w - raio, y);
  ctx.arcTo(x + w, y, x + w, y + raio, raio);
  ctx.lineTo(x + w, y + h - raio);
  ctx.arcTo(x + w, y + h, x + w - raio, y + h, raio);
  ctx.lineTo(x + raio, y + h);
  ctx.arcTo(x, y + h, x, y + h - raio, raio);
  ctx.lineTo(x, y + raio);
  ctx.arcTo(x, y, x + raio, y, raio);
  ctx.closePath();
}

// garante que as fontes do site (Bebas Neue / DM Sans) estejam prontas antes de desenhar no canvas
async function carregarFontesCanvas() {
  try {
    await Promise.all([
      document.fonts.load('400 60px "Bebas Neue"'),
      document.fonts.load('700 28px "DM Sans"'),
      document.fonts.load('400 22px "DM Sans"')
    ]);
    await document.fonts.ready;
  } catch (err) {
    console.log("Não foi possível carregar as fontes para a imagem:", err);
  }
}

async function gerarImagemRanking(ranking) {
  await carregarFontesCanvas();

  const CORES = {
    areia: "#F4E0B9",
    areiaEscura: "#E2C089",
    oceano: "#1C7C8C",
    oceanoProfundo: "#0B4650",
    coral: "#F2542D",
    brancoOsso: "#FFFBF2"
  };

  const top3 = ranking.slice(0, 3);
  const resto = ranking.slice(3);

  const LARGURA = 1080;
  const ALTURA_HEADER = 210;
  const ALTURA_PODIO_MAX = 270;
  const PODIO_TOP = ALTURA_HEADER + 30;
  const PODIO_BASELINE = PODIO_TOP + ALTURA_PODIO_MAX;
  const ALTURA_RODAPE = 70;

  const margemLateral = 50;

  // com muita gente (ex: 30 atletas em um dia), divide "demais colocações" em 2 colunas
  const usarDuasColunas = resto.length > 6;
  const colunas = usarDuasColunas ? 2 : 1;
  const linhasPorColuna = resto.length ? Math.ceil(resto.length / colunas) : 0;
  const alturaPill = 64;
  const gapPill = 14;
  const ALTURA_LINHA_RESTO = alturaPill + gapPill;
  const ALTURA_TITULO_RESTO = resto.length ? 56 : 20;

  const ALTURA = PODIO_BASELINE + 60
    + ALTURA_TITULO_RESTO
    + linhasPorColuna * ALTURA_LINHA_RESTO
    + ALTURA_RODAPE;

  // resolução mais alta (qualidade de impressão/PDF), sem mudar nenhuma coordenada do desenho
  const ESCALA = 3;
  const canvas = document.createElement("canvas");
  canvas.width = LARGURA * ESCALA;
  canvas.height = ALTURA * ESCALA;
  const ctx = canvas.getContext("2d");
  ctx.scale(ESCALA, ESCALA);

  // ===== FUNDO (areia pontilhada, igual o body do site) =====
  ctx.fillStyle = CORES.areia;
  ctx.fillRect(0, 0, LARGURA, ALTURA);

  ctx.fillStyle = "rgba(11, 70, 80, 0.07)";
  for (let y = ALTURA_HEADER; y < ALTURA; y += 28) {
    for (let x = 0; x < LARGURA; x += 28) {
      ctx.beginPath();
      ctx.arc(x, y, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ===== CABEÇALHO (gradiente oceano, igual o banner do site) =====
  const gradHeader = ctx.createLinearGradient(0, 0, LARGURA * 0.6, ALTURA_HEADER);
  gradHeader.addColorStop(0, CORES.oceano);
  gradHeader.addColorStop(1, CORES.oceanoProfundo);
  ctx.fillStyle = gradHeader;
  ctx.fillRect(0, 0, LARGURA, ALTURA_HEADER);

  ctx.textAlign = "center";

  ctx.font = '700 18px "DM Sans"';
  ctx.fillStyle = "rgba(244, 224, 185, 0.85)";
  ctx.fillText("QUADRA DE AREIA · VILA DA BARRA", LARGURA / 2, 46);

  ctx.font = '400 60px "Bebas Neue"';
  ctx.fillStyle = CORES.brancoOsso;
  ctx.fillText("🏐 Vila da Barra", LARGURA / 2, 112);

  ctx.font = '400 26px "DM Sans"';
  ctx.fillStyle = CORES.areia;
  ctx.fillText("Ranking de Vitórias & Tempo de Quadra", LARGURA / 2, 152);

  // ===== ONDA (transição header → fundo, igual o site — bem abaixo do texto) =====
  const centroOnda = ALTURA_HEADER - 8;
  const amplitudeOnda = 16;

  ctx.beginPath();
  ctx.moveTo(0, centroOnda);
  ctx.bezierCurveTo(LARGURA * 0.18, centroOnda - amplitudeOnda, LARGURA * 0.35, centroOnda + amplitudeOnda * 0.6, LARGURA * 0.5, centroOnda);
  ctx.bezierCurveTo(LARGURA * 0.65, centroOnda - amplitudeOnda, LARGURA * 0.82, centroOnda + amplitudeOnda * 0.6, LARGURA, centroOnda);
  ctx.lineTo(LARGURA, centroOnda + amplitudeOnda + 30);
  ctx.lineTo(0, centroOnda + amplitudeOnda + 30);
  ctx.closePath();
  ctx.fillStyle = CORES.areia;
  ctx.fill();

  // ===== PÓDIO (1º mais alto e no centro, como um pódio de verdade) =====
  const medalhas = ["🥇", "🥈", "🥉"];
  const coresMedalha = ["#FFD700", "#C0C0C0", "#CD7F32"];
  const alturas = [ALTURA_PODIO_MAX, 225, 190]; // 1º, 2º, 3º
  const ordemVisual = [1, 0, 2]; // esquerda = 2º · centro = 1º · direita = 3º

  const espacoEntre = 20;
  const larguraCard = (LARGURA - margemLateral * 2 - espacoEntre * 2) / 3;

  ordemVisual.forEach((indiceRanking, slot) => {
    const jogador = top3[indiceRanking];
    if (!jogador) return;

    const altura = alturas[indiceRanking];
    const x = margemLateral + slot * (larguraCard + espacoEntre);
    const yTopo = PODIO_BASELINE - altura;

    // bloco do pódio (estilo .card: areia-escura com borda branco-osso)
    desenharRetanguloArredondado(ctx, x, yTopo, larguraCard, altura, 16);
    ctx.fillStyle = CORES.areiaEscura;
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = CORES.brancoOsso;
    ctx.stroke();

    // faixa com a cor da medalha no topo do bloco
    desenharRetanguloArredondado(ctx, x, yTopo, larguraCard, 10, 5);
    ctx.fillStyle = coresMedalha[indiceRanking];
    ctx.fill();

    const cx = x + larguraCard / 2;
    let cy = yTopo + 48;

    ctx.textAlign = "center";
    ctx.font = "42px Arial";
    ctx.fillText(medalhas[indiceRanking], cx, cy);

    cy += 44;
    ctx.font = '400 28px "Bebas Neue"';
    ctx.fillStyle = CORES.oceanoProfundo;
    ctx.fillText(truncarTexto(ctx, jogador.nome, larguraCard - 24), cx, cy);

    cy += 40;
    ctx.font = '400 32px "Bebas Neue"';
    ctx.fillStyle = CORES.coral;
    ctx.shadowColor = "rgba(242, 84, 45, 0.45)";
    ctx.shadowBlur = 10;
    ctx.fillText(`${jogador.vitorias} ${jogador.vitorias === 1 ? "vitória" : "vitórias"}`, cx, cy);
    ctx.shadowBlur = 0;

    cy += 30;
    ctx.font = '700 15px "DM Sans"';
    ctx.fillStyle = CORES.oceano;
    ctx.fillText(`🎮 ${jogador.partidas} jogos · ⏱ ${formatarDuracaoLonga(jogador.tempoSegundos)}`, cx, cy);
  });

  // ===== DEMAIS COLOCAÇÕES (estilo .item-ranking: pílula, em 1 ou 2 colunas) =====
  let y = PODIO_BASELINE + 55;

  if (resto.length > 0) {
    ctx.textAlign = "left";
    ctx.font = '400 24px "Bebas Neue"';
    ctx.fillStyle = CORES.oceanoProfundo;
    ctx.fillText(`DEMAIS COLOCAÇÕES (${resto.length})`, margemLateral, y);
    y += ALTURA_TITULO_RESTO;

    const yInicioLista = y;
    const gapColunas = 20;
    const larguraColuna = colunas === 2
      ? (LARGURA - margemLateral * 2 - gapColunas) / 2
      : (LARGURA - margemLateral * 2);

    resto.forEach((j, i) => {
      const posicao = i + 4;
      const coluna = colunas === 2 ? Math.floor(i / linhasPorColuna) : 0;
      const linha = colunas === 2 ? i % linhasPorColuna : i;

      const colX = margemLateral + coluna * (larguraColuna + gapColunas);
      const linhaY = yInicioLista + linha * ALTURA_LINHA_RESTO;
      const meioY = linhaY + alturaPill / 2;

      // pílula de fundo
      desenharRetanguloArredondado(ctx, colX, linhaY, larguraColuna, alturaPill, alturaPill / 2);
      ctx.fillStyle = CORES.brancoOsso;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = CORES.oceano;
      ctx.stroke();

      // posição
      ctx.textAlign = "left";
      ctx.font = '400 20px "Bebas Neue"';
      ctx.fillStyle = CORES.coral;
      ctx.fillText(`${posicao}º`, colX + 16, meioY + 7);

      // pílula de vitórias (direita)
      const larguraPillVit = 60;
      const xPillVit = colX + larguraColuna - larguraPillVit - 12;
      desenharRetanguloArredondado(ctx, xPillVit, linhaY + 9, larguraPillVit, alturaPill - 18, (alturaPill - 18) / 2);
      ctx.fillStyle = CORES.oceanoProfundo;
      ctx.fill();
      ctx.textAlign = "center";
      ctx.font = '400 15px "Bebas Neue"';
      ctx.fillStyle = CORES.areia;
      ctx.fillText(`${j.vitorias}V`, xPillVit + larguraPillVit / 2, meioY + 5);

      // nome (truncado se precisar, deixando espaço pra pílula de vitórias)
      const xNome = colX + 56;
      const larguraMaxNome = xPillVit - xNome - 10;
      ctx.textAlign = "left";
      ctx.font = '700 18px "DM Sans"';
      ctx.fillStyle = CORES.oceanoProfundo;
      ctx.fillText(truncarTexto(ctx, j.nome, larguraMaxNome), xNome, meioY - 6);

      // stats compactas: partidas jogadas + tempo de quadra
      ctx.font = '400 12px "DM Sans"';
      ctx.fillStyle = CORES.oceano;
      ctx.fillText(`🎮 ${j.partidas} jogos · ⏱ ${formatarDuracaoCompacta(j.tempoSegundos)}`, xNome, meioY + 13);
    });

    y = yInicioLista + linhasPorColuna * ALTURA_LINHA_RESTO;
  }

  // ===== RODAPÉ =====
  ctx.textAlign = "center";
  ctx.font = '400 18px "DM Sans"';
  ctx.fillStyle = CORES.oceano;
  const dataAtual = new Date().toLocaleDateString("pt-BR");
  ctx.fillText(`Gerado em ${dataAtual} · ${ranking.length} atletas no total`, LARGURA / 2, ALTURA - 28);

  return canvas;
}

// ===== PÁGINA ISOLADA =====
function alternarPagina() {
  const overlay = document.getElementById("paginaHistorico");
  const aberto = document.getElementById("togglePagina").checked;
  const btn = document.getElementById("btnFinalizar");

  overlay.classList.toggle("aberta", aberto);

  if (aberto) {
    renderHistorico();
    renderRanking();
    btn.style.display = "none"; // 🔴 ESCONDE botão
    btn.classList.toggle("oculto", aberto);
  } else {
    btn.style.display = "block"; // 🟢 MOSTRA botão
  }
}

function fecharPagina() {
  document.getElementById("togglePagina").checked = false;
  document.getElementById("paginaHistorico").classList.remove("aberta");
}

function mostrarAba(aba) {
  const ehHistorico = aba === "historico";
  document.getElementById("abaHistorico").classList.toggle("oculta", !ehHistorico);
  document.getElementById("abaRanking").classList.toggle("oculta", ehHistorico);
  document.getElementById("abaHistoricoBtn").classList.toggle("ativa", ehHistorico);
  document.getElementById("abaRankingBtn").classList.toggle("ativa", !ehHistorico);
}

// ===== FINALIZAR PARTIDA =====
function finalizarPartida() {
  let perdedor, entrada, vencedorLabel, perdedorLabel;

  if (scoreA > scoreB) {
    perdedor = areas.timeB;
    entrada = areas.timeB;
    vencedorLabel = "A";
    perdedorLabel = "B";
  } else if (scoreB > scoreA) {
    perdedor = areas.timeA;
    entrada = areas.timeA;
    vencedorLabel = "B";
    perdedorLabel = "A";
  } else {
    alert("Empate! Ajuste o placar antes de finalizar.");
    return;
  }

  const vencedorArea = vencedorLabel === "A" ? areas.timeA : areas.timeB;
  const perdedorArea = perdedorLabel === "A" ? areas.timeA : areas.timeB;

  const vencedoresNomes = [...vencedorArea.querySelectorAll(".player")]
    .map(p => p.dataset.nomeOriginal);
  const perdedoresNomes = [...perdedorArea.querySelectorAll(".player")]
    .map(p => p.dataset.nomeOriginal);

  const placarVencedor = vencedorLabel === "A" ? scoreA : scoreB;
  const placarPerdedor = perdedorLabel === "A" ? scoreA : scoreB;

  const confirmar = confirm(
    `Finalizar partida?\n\n🏆 Time ${vencedorLabel}: ${placarVencedor}\n   Time ${perdedorLabel}: ${placarPerdedor}`
  );
  if (!confirmar) return;

  // horário real de início/fim, calculado a partir do cronômetro da partida
  const horaFim = new Date();
  const horaInicio = new Date(horaFim.getTime() - segundosPartida * 1000);

  salvarPartida({
    placarA: scoreA,
    placarB: scoreB,
    vencedor: vencedorLabel,
    perdedorTime: perdedorLabel,
    vencedoresNomes,
    perdedoresNomes,
    placarVencedor,
    placarPerdedor,
    duracao: tempoFormatado(),
    duracaoSegundos: segundosPartida,
    horaInicio: horaInicio.toISOString(),
    horaFim: horaFim.toISOString()
  });

  [...perdedor.querySelectorAll(".player")].forEach(p => {
    p.classList.remove("jogando", "selecionado");
    // modo "perdedor vai pra fila": pula a área de eliminados e já cai no final da fila
    if (modoSemEliminacao) {
      areas.fila.appendChild(p);
    } else {
      areas.eliminados.appendChild(p);
    }
  });
  jogadorSelecionado = null;

  [...areas.marcacao.querySelectorAll(".player")].forEach(p => {
    p.classList.add("jogando");
    entrada.appendChild(p);
  });

  scoreA = 0;
  scoreB = 0;
  atualizarPlacar();
  atualizarFila();
  atualizarContadores();
  resetarCronometro();
  salvarEstado();
}

// estado inicial: restaura jogadores/placar/cronômetro salvos, ou começa do zero
restaurarEstado();

// ===== REGISTRO DO SERVICE WORKER (deixa o app instalável e offline) =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .catch(err => console.log('Erro ao registrar service worker:', err));
  });
}

// ===== RESETAR RANKING (com confirmação) =====
function confirmarResetRanking() {
  const confirmar = confirm("Tem certeza que deseja zerar o ranking? Essa ação não pode ser desfeita.");

  if (confirmar) {
    const confirmar2 = confirm("Última chance! Isso vai apagar TODAS as vitórias registradas.");

    if (confirmar2) {
      zerarRanking();
    }
  }
}

function zerarRanking() {
  localStorage.removeItem(CHAVE_HISTORICO); // apaga todo histórico (base do ranking)

  renderRanking();
  renderHistorico();

  alert("Ranking e histórico apagados com sucesso!");
}
// BLOQUEAR F5 e Ctrl+R
document.addEventListener("keydown", function(e) {
  if (e.key === "F5" || (e.ctrlKey && e.key === "r")) {
    e.preventDefault();
  }
});

// BLOQUEAR PUXAR PRA RECARREGAR (mobile)
let startY = 0;

document.addEventListener("touchstart", function(e) {
  startY = e.touches[0].clientY;
});

document.addEventListener("touchmove", function(e) {
  let currentY = e.touches[0].clientY;

  if (window.scrollY === 0 && currentY > startY) {
    e.preventDefault();
  }
}, { passive: false });
function trocarLados() {
  const placar = document.getElementById("placar");
  const quadra = document.getElementById("quadra");

  placar.classList.toggle("invertido");
  quadra.classList.toggle("invertido");
}