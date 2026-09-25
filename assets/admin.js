/* Painel da loja (beta): pedidos e catálogo. Os dados ficam no localStorage deste navegador —
   no MVP isso vira banco (Supabase), com login de verdade e os pedidos chegando do gateway. */
(() => {
  const { L, $, $$, brl, esc, mem, produtos, I, toast } = window.Loja;
  const SENHA = 'zync';
  const STATUS = { aguardando: 'Aguardando pagamento', pago: 'Pago', separando: 'Separando', enviado: 'Enviado / retirado', cancelado: 'Cancelado' };
  const COR = { aguardando: '#B7791F', pago: '#1F8A4C', separando: '#2B6CB0', enviado: '#555', cancelado: '#C53030' };
  let aba = 'pedidos';

  function entrar() {
    $('#app').innerHTML = `<div class="painel-ok" style="max-width:420px">
      <h1>Painel da loja</h1><p>Área do lojista: pedidos, produtos e preços.</p>
      <form id="login" class="campos" style="text-align:left;margin-top:18px">
        <div class="campo"><label for="senha">Senha</label><input id="senha" type="password" autocomplete="current-password"><span class="msg" hidden></span></div>
        <div class="campo"><button class="btn cheio">Entrar</button></div>
      </form>
      <div class="aviso-demo">Senha da demonstração: <b>${SENHA}</b></div></div>`;
    $('#login').onsubmit = e => {
      e.preventDefault();
      if ($('#senha').value.trim().toLowerCase() === SENHA) { sessionStorage.setItem(L.slug + ':adm', '1'); painel(); }
      else { const m = $('[data-campo] .msg') || $('.msg'); m.textContent = 'Senha incorreta'; m.hidden = false; }
    };
  }

  function painel() {
    const ped = mem.get('pedidos', []);
    const pagos = ped.filter(p => ['pago', 'separando', 'enviado'].includes(p.status));
    $('#app').innerHTML = `
      <div class="wrap" style="padding:28px 0 80px">
        <div class="secao-topo" style="margin-bottom:18px"><div><p class="olho">Painel da loja</p><h1 class="titulo" style="font-size:34px">${esc(L.nome)}</h1></div>
</div>
        <div class="vantagens" style="grid-template-columns:repeat(3,1fr);border-radius:var(--raio);overflow:hidden;border:1px solid var(--line);margin-bottom:22px">
          <div><div><b style="font-size:24px">${ped.length}</b>pedidos</div></div>
          <div><div><b style="font-size:24px">${brl(pagos.reduce((s, p) => s + p.total, 0))}</b>vendido (pago)</div></div>
          <div><div><b style="font-size:24px">${ped.filter(p => p.status === 'aguardando').length}</b>aguardando pagamento</div></div>
        </div>
        <div class="chips" style="margin-bottom:20px">
          <button class="chip" data-aba="pedidos" aria-pressed="${aba === 'pedidos'}">Pedidos</button>
          <button class="chip" data-aba="produtos" aria-pressed="${aba === 'produtos'}">Produtos (${produtos().length})</button>
        </div>
        <div id="conteudo">${aba === 'pedidos' ? htmlPedidos(ped) : htmlProdutos()}</div>
      </div>
      <dialog class="modal" id="editor" style="max-width:640px"></dialog>`;
  }

  function htmlPedidos(ped) {
    if (!ped.length) return `<div class="co-bloco" style="text-align:center;color:var(--muted)">Nenhum pedido ainda. Faça uma compra de teste no site — ela aparece aqui.</div>`;
    return ped.map(p => `<div class="co-bloco">
      <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:start">
        <div><b style="font-size:18px">#${p.id}</b> · ${new Date(p.data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}<br>
          <span>${esc(p.cliente.nome)} · ${esc(p.cliente.zap)}</span><br>
          <small style="color:var(--muted)">${p.pagamento.metodo === 'pix' ? 'Pix' : `Cartão ${esc(p.pagamento.bandeira || '')} final ${esc(p.pagamento.final)} · ${p.pagamento.parcelas}x`} ·
          ${p.entrega.tipo === 'retirada' ? 'Retirada na loja' : `Entrega: ${esc(p.entrega.endereco.rua)}, ${esc(p.entrega.endereco.numero)} — ${esc(p.entrega.endereco.bairro)}`}</small></div>
        <div style="text-align:right"><b style="font-size:20px">${brl(p.total)}</b><br>
          <select data-status="${p.id}" style="margin-top:6px;height:40px;border-radius:8px;border:2px solid ${COR[p.status]};color:${COR[p.status]};font-weight:700;background:var(--bg);padding:0 8px">
            ${Object.entries(STATUS).map(([k, t]) => `<option value="${k}" ${k === p.status ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
      </div>
      <div style="margin-top:10px;font-size:14px">${p.itens.map(i => `${i.qtd}x ${esc(i.nome)}${i.cor ? ' — ' + esc(i.cor) : ''}${i.tam && i.tam !== 'Único' ? ' — ' + esc(i.tam) : ''}`).join('<br>')}</div>
      <a class="btn zap" style="min-height:40px;margin-top:12px;font-size:14px" target="_blank" rel="noopener" href="https://wa.me/55${p.cliente.zap.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá, ${p.cliente.nome.split(' ')[0]}! Aqui é da ${L.nome}, sobre o seu pedido #${p.id}.`)}">${I.zap} Falar com o cliente</a>
    </div>`).join('');
  }

  function htmlProdutos() {
    return `<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">
        <button class="btn" data-novo>${I.mais} Novo produto</button>
        <button class="btn sec" data-restaurar>Restaurar catálogo original</button></div>
      <div class="grade">${produtos().map(p => `<div class="card${p.esgotado ? ' esgotado' : ''}">
        <button class="card-foto" data-editar="${p.id}" aria-label="Editar ${esc(p.nome)}"><img src="${esc(p.fotos[0])}" alt="">${p.esgotado ? '<span class="selo">Esgotado</span>' : ''}</button>
        <div><span class="card-cat">${esc(p.categoria)}</span><h3>${esc(p.nome)}</h3><div class="preco"><strong>${brl(p.preco)}</strong></div>
        <button class="btn sec" data-editar="${p.id}" style="min-height:38px;font-size:14px;margin-top:8px">Editar</button></div></div>`).join('')}</div>`;
  }

  function salvarLista(l) { if (!mem.set('produtos', l)) toast('Sem espaço no navegador — use fotos menores'); }

  function editor(id) {
    const p = produtos().find(x => x.id === id) || { id: 'p' + Date.now().toString(36), nome: '', categoria: L.categorias[0], preco: 0, precoDe: 0, tamanhos: ['P', 'M', 'G', 'GG'], fotos: [], descricao: '' };
    const d = $('#editor');
    const cats = [...new Set([...L.categorias, ...produtos().map(x => x.categoria)])];
    d.innerHTML = `<form id="fp" class="co-bloco" style="margin:0;border:0">
      <h2 style="justify-content:space-between">${p.nome ? 'Editar produto' : 'Novo produto'} <button type="button" class="fechar" data-fechar style="position:static;box-shadow:none">${I.x}</button></h2>
      <div class="campos">
        <div class="campo"><label>Nome</label><input name="nome" required value="${esc(p.nome)}"></div>
        <div class="campo c3"><label>Categoria</label><input name="categoria" list="cats" value="${esc(p.categoria)}"><datalist id="cats">${cats.map(c => `<option value="${esc(c)}">`).join('')}</datalist></div>
        <div class="campo c3"><label>Tamanhos <small>(separados por vírgula)</small></label><input name="tamanhos" value="${esc(p.tamanhos.join(', '))}"></div>
        <div class="campo c3"><label>Preço (R$)</label><input name="preco" inputmode="decimal" value="${String(p.preco).replace('.', ',')}"></div>
        <div class="campo c3"><label>Preço "de" <small>(opcional, mostra desconto)</small></label><input name="precoDe" inputmode="decimal" value="${p.precoDe ? String(p.precoDe).replace('.', ',') : ''}"></div>
        <div class="campo"><label>Cores <small>(opcional, separadas por vírgula)</small></label><input name="cores" value="${esc((p.cores || []).join(', '))}"></div>
        <div class="campo"><label>Descrição</label><input name="descricao" value="${esc(p.descricao || '')}"></div>
        <div class="campo"><label>Fotos</label>
          <div id="fotos" style="display:flex;gap:8px;flex-wrap:wrap">${p.fotos.map((f, i) => `<div style="position:relative"><img src="${esc(f)}" style="width:72px;height:90px;object-fit:cover;border-radius:8px"><button type="button" data-tirar="${i}" style="position:absolute;top:-6px;right:-6px;width:24px;height:24px;border-radius:50%;border:0;background:#C53030;color:#fff">×</button></div>`).join('')}</div>
          <input type="file" id="upl" accept="image/*" multiple style="height:auto;padding:10px"></div>
        <label class="escolha campo"><input type="checkbox" name="esgotado" ${p.esgotado ? 'checked' : ''}><div><b>Esgotado</b><small>Continua na vitrine, sem botão de compra</small></div></label>
        <label class="escolha campo"><input type="checkbox" name="destaque" ${p.destaque ? 'checked' : ''}><div><b>Destaque</b><small>Aparece primeiro na vitrine</small></div></label>
        <div class="campo" style="display:flex;gap:10px;flex-direction:row">
          <button class="btn" style="flex:1">Salvar</button>
          ${produtos().some(x => x.id === p.id) ? '<button type="button" class="btn sec" data-apagar>Excluir</button>' : ''}</div>
      </div></form>`;
    d.showModal();
    const fotos = [...p.fotos];
    const redesenhar = () => { $('#fotos').innerHTML = fotos.map((f, i) => `<div style="position:relative"><img src="${esc(f)}" style="width:72px;height:90px;object-fit:cover;border-radius:8px"><button type="button" data-tirar="${i}" style="position:absolute;top:-6px;right:-6px;width:24px;height:24px;border-radius:50%;border:0;background:#C53030;color:#fff">×</button></div>`).join(''); };
    d.onclick = e => {
      const t = e.target.closest('[data-tirar]'); if (t) { fotos.splice(+t.dataset.tirar, 1); redesenhar(); }
      if (e.target.closest('[data-apagar]') && confirm('Excluir este produto da vitrine?')) { salvarLista(produtos().filter(x => x.id !== p.id)); d.close(); painel(); toast('Produto excluído'); }
    };
    $('#upl').onchange = async e => { for (const f of e.target.files) fotos.push(await reduzir(f)); redesenhar(); };
    $('#fp').onsubmit = e => {
      e.preventDefault();
      const f = new FormData(e.target), num = s => Number(String(s || '').replace(/\./g, '').replace(',', '.')) || 0;
      const lista = s => String(s || '').split(',').map(x => x.trim()).filter(Boolean);
      if (!fotos.length) return toast('Adicione pelo menos uma foto');
      const novo = { ...p, nome: f.get('nome').trim(), categoria: f.get('categoria').trim() || 'Outros', tamanhos: lista(f.get('tamanhos')).length ? lista(f.get('tamanhos')) : ['Único'],
        preco: num(f.get('preco')), precoDe: num(f.get('precoDe')), cores: lista(f.get('cores')), descricao: f.get('descricao').trim(), fotos, esgotado: !!f.get('esgotado'), destaque: !!f.get('destaque') };
      const l = produtos(), i = l.findIndex(x => x.id === p.id);
      i >= 0 ? l[i] = novo : l.unshift(novo);
      salvarLista(l); d.close(); painel(); toast('Produto salvo ✓');
    };
  }

  function reduzir(file) {
    return new Promise(res => {
      const img = new Image(), r = new FileReader();
      r.onload = () => { img.src = r.result; };
      img.onload = () => { const k = Math.min(1, 800 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = img.width * k; c.height = img.height * k; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', .8)); };
      r.readAsDataURL(file);
    });
  }

  document.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.aba) { aba = b.dataset.aba; painel(); }
    else if (b.dataset.editar) editor(b.dataset.editar);
    else if ('novo' in b.dataset) editor(null);
    else if ('restaurar' in b.dataset && confirm('Voltar ao catálogo original? As edições feitas aqui serão perdidas.')) { localStorage.removeItem(L.slug + ':produtos'); painel(); }
  });
  document.addEventListener('change', e => {
    const s = e.target.dataset.status; if (!s) return;
    const l = mem.get('pedidos', []), p = l.find(x => x.id === s); p.status = e.target.value; mem.set('pedidos', l); painel(); toast('Status atualizado');
  });
  document.addEventListener('DOMContentLoaded', () => sessionStorage.getItem(L.slug + ':adm') ? painel() : entrar());
})();
