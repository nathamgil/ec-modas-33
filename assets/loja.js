/* Motor da loja: catálogo, produto, sacola. Os dados da loja ficam em config.js (LOJA e PRODUTOS).
   Mudanças feitas no admin.html ficam no localStorage deste navegador e sobrepõem o config.js. */
(() => {
  const L = window.LOJA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const brl = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const mem = {
    get(k, d) { try { const v = localStorage.getItem(L.slug + ':' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(L.slug + ':' + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  };
  const produtos = () => mem.get('produtos', null) || window.PRODUTOS;
  const produto = id => produtos().find(p => p.id === id);
  const precoPix = v => Math.round(v * (1 - (L.pixDesconto || 0) / 100) * 100) / 100;
  const parcela = v => brl(v / L.parcelasSemJuros);
  const zap = (msg, num = L.whatsapp) => `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;

  const I = {
    sacola: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l1 13H5L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>',
    mais: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    zap: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.9 11.9 0 0 0 4.5 4c1.7.7 2.4.8 3.2.6.5 0 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>',
    pix: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.3 16.8a2.8 2.8 0 0 1-2-.8l-2.9-2.9a.6.6 0 0 0-.8 0L8.7 16a2.8 2.8 0 0 1-2 .8h-.6l3.7 3.7a3 3 0 0 0 4.2 0l3.7-3.7h-.4ZM6.7 7.2a2.8 2.8 0 0 1 2 .8l2.9 2.9a.6.6 0 0 0 .8 0L15.3 8a2.8 2.8 0 0 1 2-.8h.4l-3.7-3.7a3 3 0 0 0-4.2 0L6.1 7.2h.6Zm13.8 2.7-2.2-2.2h-1a1.9 1.9 0 0 0-1.3.6l-2.9 2.9a1.5 1.5 0 0 1-2.1 0L8 8.3a1.9 1.9 0 0 0-1.3-.5H5.5L3.5 9.9a3 3 0 0 0 0 4.2l2 2h1.2a1.9 1.9 0 0 0 1.3-.5l2.9-2.9a1.5 1.5 0 0 1 2.1 0l2.9 2.9a1.9 1.9 0 0 0 1.3.6h1l2.3-2.3a3 3 0 0 0 0-4Z"/></svg>',
    cartao: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6 15h4"/></svg>',
    loja: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 10v10h16V10M3 10l2-6h14l2 6H3Z"/><path d="M10 20v-5h4v5"/></svg>',
    moto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M9 17h6l-3-7h-3M14 6h3l1 4-3 7"/></svg>',
    escudo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>',
    busca: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
  };

  let toastT;
  function toast(msg) {
    // dentro do dialog aberto, senão o fundo escuro do modal cobre o aviso
    const pai = $('dialog[open]') || document.body;
    let t = $('.toast', pai);
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); pai.append(t); }
    t.textContent = msg; t.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2600);
  }

  /* ---------- sacola ---------- */
  const Sacola = {
    itens() { return mem.get('sacola', []).filter(i => produto(i.id)); },
    salvar(l) { mem.set('sacola', l); Sacola.atualizar(); },
    add(id, tam, qtd = 1, cor = '') {
      const l = Sacola.itens();
      const it = l.find(i => i.id === id && i.tam === tam && (i.cor || '') === cor);
      if (it) it.qtd += qtd; else l.push({ id, tam, cor, qtd });
      Sacola.salvar(l);
    },
    mudar(idx, q) { const l = Sacola.itens(); if (q <= 0) l.splice(idx, 1); else l[idx].qtd = Math.min(q, 20); Sacola.salvar(l); },
    limpar() { Sacola.salvar([]); },
    linhas() { return Sacola.itens().map(i => { const p = produto(i.id); return { ...i, p, total: p.preco * i.qtd }; }); },
    subtotal() { return Sacola.linhas().reduce((s, l) => s + l.total, 0); },
    contagem() { return Sacola.itens().reduce((s, i) => s + i.qtd, 0); },
    atualizar() {
      const n = Sacola.contagem();
      $$('[data-contagem]').forEach(e => { e.textContent = n; e.hidden = !n; });
      if ($('#gaveta')) renderGaveta();
      document.dispatchEvent(new Event('sacola'));
    },
  };

  function variante(l) { return [l.cor, l.tam && l.tam !== 'Único' ? 'Tam. ' + l.tam : ''].filter(Boolean).join(' · '); }

  function linhaItem(l, idx, editavel) {
    return `<div class="item">
      <img src="${esc(l.p.fotos[0])}" alt="">
      <div><h4>${esc(l.p.nome)}</h4><small>${esc(variante(l)) || '&nbsp;'}</small>
        ${editavel ? `<div class="qtd"><button data-q="${idx}" data-d="-1" aria-label="Menos">−</button><span>${l.qtd}</span><button data-q="${idx}" data-d="1" aria-label="Mais">+</button></div>` : `<small>Qtd: ${l.qtd}</small>`}
      </div>
      <div class="item-preco">${brl(l.total)}${editavel ? `<button class="remover" data-q="${idx}" data-d="rm">Remover</button>` : ''}</div>
    </div>`;
  }

  function renderGaveta() {
    const g = $('#gaveta'), linhas = Sacola.linhas(), sub = Sacola.subtotal();
    g.innerHTML = `
      <div class="gaveta-topo"><h2>Sua sacola (${Sacola.contagem()})</h2><button class="fechar" data-fechar aria-label="Fechar">${I.x}</button></div>
      ${linhas.length ? `
        <div class="gaveta-itens">${linhas.map((l, i) => linhaItem(l, i, true)).join('')}</div>
        <div class="gaveta-rodape">
          <div class="soma total"><span>Subtotal</span><span>${brl(sub)}</span></div>
          ${L.pixDesconto ? `<div class="soma"><span>No Pix (${L.pixDesconto}% off)</span><span class="pix">${brl(precoPix(sub))}</span></div>` : ''}
          <div class="soma"><span>No cartão</span><span>até ${L.parcelasSemJuros}x de ${parcela(sub)} sem juros</span></div>
          <a class="btn cheio" href="checkout.html">Finalizar compra</a>
          <button class="btn sec cheio" data-fechar>Continuar comprando</button>
        </div>` : `
        <div class="gaveta-vazia">${I.sacola}<p><b>Sua sacola está vazia.</b><br>Escolha uma peça na vitrine.</p>
          <button class="btn" data-fechar>Ver a vitrine</button></div>`}`;
  }

  /* ---------- vitrine ---------- */
  let filtroCat = 'Tudo', filtroTexto = '';
  function selo(p) {
    if (p.esgotado) return '<span class="selo">Esgotado</span>';
    if (p.precoDe > p.preco) return `<span class="selo oferta">-${Math.round((1 - p.preco / p.precoDe) * 100)}%</span>`;
    if (p.novo) return '<span class="selo">Novo</span>';
    return '';
  }
  function card(p) {
    return `<article class="card${p.esgotado ? ' esgotado' : ''}">
      <button class="card-foto" data-abrir="${p.id}" aria-label="Ver ${esc(p.nome)}">
        ${selo(p)}
        <img src="${esc(p.fotos[0])}" alt="${esc(p.nome)}" loading="lazy">
        ${p.fotos[1] ? `<img class="alt" src="${esc(p.fotos[1])}" alt="" loading="lazy">` : ''}
        ${p.esgotado ? '' : `<span class="card-rapido" aria-hidden="true">${I.mais}</span>`}
      </button>
      <div>
        <span class="card-cat">${esc(p.categoria)}</span>
        <h3><button data-abrir="${p.id}">${esc(p.nome)}</button></h3>
        <div class="preco">${p.precoDe > p.preco ? `<s>${brl(p.precoDe)}</s>` : ''}<strong>${brl(p.preco)}</strong></div>
        <p class="parc">${L.parcelasSemJuros}x de ${parcela(p.preco)}${L.pixDesconto ? ` · <b>${brl(precoPix(p.preco))} no Pix</b>` : ''}</p>
      </div>
    </article>`;
  }
  function renderVitrine() {
    const v = $('#vitrine'); if (!v) return;
    const t = filtroTexto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const lista = produtos()
      .filter(p => filtroCat === 'Tudo' || p.categoria === filtroCat)
      .filter(p => !t || (p.nome + ' ' + p.categoria).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().includes(t))
      .sort((a, b) => (a.esgotado - b.esgotado) || ((b.destaque ? 1 : 0) - (a.destaque ? 1 : 0)));
    v.innerHTML = lista.length ? lista.map(card).join('') : '<p class="vazio">Nenhuma peça encontrada. Fale com a gente no WhatsApp que a gente procura pra você.</p>';
  }
  function renderChips() {
    const c = $('#chips'); if (!c) return;
    const usadas = new Set(produtos().map(p => p.categoria));
    const cats = ['Tudo', ...L.categorias.filter(x => usadas.has(x)), ...[...usadas].filter(x => !L.categorias.includes(x))];
    c.innerHTML = cats.map(x => `<button class="chip" data-cat="${esc(x)}" aria-pressed="${x === filtroCat}">${esc(x)}</button>`).join('');
  }
  function filtrar(cat) {
    filtroCat = cat; renderChips(); renderVitrine();
  }

  /* ---------- produto ---------- */
  let atual = null;
  function abrirProduto(id) {
    const p = produto(id); if (!p) return;
    atual = { p, tam: p.tamanhos.length === 1 ? p.tamanhos[0] : '', cor: p.cores && p.cores.length === 1 ? p.cores[0] : '', qtd: 1, foto: 0 };
    renderProduto();
    const d = $('#produto'); if (!d.open) d.showModal();
    history.replaceState(null, '', '#p=' + id);
  }
  function renderProduto(aviso) {
    const { p, tam, cor, qtd, foto } = atual;
    $('#produto').innerHTML = `
      <button class="fechar" data-fechar aria-label="Fechar">${I.x}</button>
      <div class="modal-corpo">
        <div class="galeria">
          <img class="galeria-principal" src="${esc(p.fotos[foto])}" alt="${esc(p.nome)}">
          ${p.fotos.length > 1 ? `<div class="miniaturas">${p.fotos.map((f, i) => `<button data-foto="${i}" aria-current="${i === foto}" aria-label="Foto ${i + 1}"><img src="${esc(f)}" alt=""></button>`).join('')}</div>` : ''}
        </div>
        <div class="modal-info">
          <div><span class="card-cat">${esc(p.categoria)}</span><h2>${esc(p.nome)}</h2></div>
          <div class="preco modal-preco">${p.precoDe > p.preco ? `<s>${brl(p.precoDe)}</s>` : ''}<strong>${brl(p.preco)}</strong></div>
          <div>
            ${L.pixDesconto ? `<div class="pix-linha">${I.pix.replace('<svg', '<svg width="20" height="20"')} ${brl(precoPix(p.preco))} no Pix (${L.pixDesconto}% off)</div>` : ''}
            <p class="parc" style="margin-top:8px">ou ${L.parcelasSemJuros}x de ${parcela(p.preco)} sem juros no cartão</p>
          </div>
          ${p.cores && p.cores.length > 1 ? `<div><p class="rotulo">Cor${cor ? ': ' + esc(cor) : ''}</p><div class="opcoes-tam">${p.cores.map(c => `<button data-cor="${esc(c)}" aria-pressed="${c === cor}">${esc(c)}</button>`).join('')}</div></div>` : ''}
          <div><p class="rotulo">${p.tamanhos.length === 1 && p.tamanhos[0] === 'Único' ? 'Tamanho único' : 'Tamanho'}</p>
            ${p.tamanhos.length === 1 && p.tamanhos[0] === 'Único' ? '' : `<div class="opcoes-tam">${p.tamanhos.map(t => `<button data-tam="${esc(t)}" aria-pressed="${t === tam}" ${p.esgotado ? 'disabled' : ''}>${esc(t)}</button>`).join('')}</div>`}
            ${aviso ? `<p class="aviso-tam">${aviso}</p>` : ''}
          </div>
          ${p.descricao ? `<p class="desc">${esc(p.descricao)}</p>` : ''}
          <div class="modal-acoes">
            ${p.esgotado ? `<a class="btn zap cheio" target="_blank" rel="noopener" href="${zap(`Olá! Vi no site que "${p.nome}" está esgotado. Quando volta?`)}">${I.zap} Avise-me quando chegar</a>` : `
            <div class="linha-compra">
              <div class="qtd"><button data-qtd="-1" aria-label="Menos">−</button><span>${qtd}</span><button data-qtd="1" aria-label="Mais">+</button></div>
              <button class="btn" data-comprar="sacola">${I.sacola} Adicionar</button>
            </div>
            <button class="btn sec cheio" data-comprar="agora" style="margin-top:10px">Comprar agora</button>`}
          </div>
          <div class="selos-confianca">
            <span>${I.pix} Pix${L.pixDesconto ? ` com ${L.pixDesconto}% de desconto` : ''} ou cartão em até ${L.parcelasSemJuros}x</span>
            <span>${I.moto} ${esc(L.textoEntrega)}</span>
            <span>${I.zap} <a href="${zap(`Olá! Tenho uma dúvida sobre "${p.nome}".`)}" target="_blank" rel="noopener">Tirar dúvida no WhatsApp</a></span>
            <span>${I.link} <a href="#" data-copiar-link>Copiar link da peça</a></span>
          </div>
        </div>
      </div>`;
  }
  function comprar(modo) {
    const { p, tam, cor, qtd } = atual;
    if (p.cores && p.cores.length > 1 && !cor) return renderProduto('Escolha a cor.');
    if (!tam) return renderProduto('Escolha o tamanho.');
    Sacola.add(p.id, tam, qtd, cor);
    if (modo === 'agora') { location.href = 'checkout.html'; return; }
    $('#produto').close();
    toast('Adicionado à sacola ✓');
    abrirSacola();
  }
  function abrirSacola() { const g = $('#gaveta'); if (!g) { location.href = 'checkout.html'; return; } renderGaveta(); if (!g.open) g.showModal(); }

  /* ---------- eventos ---------- */
  document.addEventListener('click', e => {
    const b = e.target.closest('button, a'); if (!b) return;
    const d = b.dataset;
    if (d.abrir) { e.preventDefault(); abrirProduto(d.abrir); }
    else if (d.cat) filtrar(d.cat);
    else if ('abrirSacola' in d) { e.preventDefault(); abrirSacola(); }
    else if ('fechar' in d) { b.closest('dialog').close(); }
    else if (d.foto) { atual.foto = +d.foto; renderProduto(); }
    else if (d.tam) { atual.tam = d.tam; renderProduto(); }
    else if (d.cor) { atual.cor = d.cor; renderProduto(); }
    else if (d.qtd) { atual.qtd = Math.max(1, Math.min(20, atual.qtd + +d.qtd)); renderProduto(); }
    else if (d.comprar) comprar(d.comprar);
    else if (d.q) { const l = Sacola.itens(); d.d === 'rm' ? Sacola.mudar(+d.q, 0) : Sacola.mudar(+d.q, l[+d.q].qtd + +d.d); }
    else if ('copiarLink' in d) {
      e.preventDefault();
      const url = location.href.split('#')[0] + '#p=' + atual.p.id;
      navigator.clipboard?.writeText(url).then(() => toast('Link copiado ✓'), () => prompt('Copie o link:', url));
    }
    else if (d.ir) { e.preventDefault(); filtrar(d.ir); $('#colecao').scrollIntoView(); }
  });
  document.addEventListener('close', e => {
    if (e.target.id === 'produto' && location.hash.startsWith('#p=')) history.replaceState(null, '', location.pathname);
  }, true);
  // clique no fundo escuro fecha o modal
  document.addEventListener('mousedown', e => { if (e.target.tagName === 'DIALOG') e.target.close(); });

  function iniciar() {
    document.title = document.title || L.nome;
    const busca = $('#busca');
    if (busca) busca.addEventListener('input', () => { filtroTexto = busca.value; renderVitrine(); });
    $$('[data-zap]').forEach(a => { a.href = zap(a.dataset.zap || L.msgZap); a.target = '_blank'; a.rel = 'noopener'; });
    $$('[data-ano]').forEach(a => a.textContent = new Date().getFullYear());
    renderChips(); renderVitrine(); Sacola.atualizar();
    const m = location.hash.match(/^#p=(.+)$/); if (m) abrirProduto(decodeURIComponent(m[1]));
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', iniciar) : iniciar();

  window.Loja = { L, $, $$, brl, esc, mem, produtos, produto, precoPix, parcela, zap, I, toast, Sacola, linhaItem, variante };
})();
