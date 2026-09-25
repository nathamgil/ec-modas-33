/* Checkout: dados → entrega → pagamento (Pix ou cartão) → pedido confirmado.

   PAGAMENTO — como ligar o gateway depois da reunião:
   Tudo passa pelo objeto Pagamento abaixo. Hoje ele roda em modo "demo" (nada é cobrado).
   - Pix estático: preencha LOJA.pix.chave no config.js e o QR Code passa a ser pagável de verdade
     (a loja confere o recebimento no app do banco e marca "Pago" no admin).
   - Gateway (Mercado Pago, Asaas, Pagar.me, InfinitePay...): criar uma função no servidor
     (Supabase Edge Function ou Cloudflare Worker) que guarda a chave secreta e cria a cobrança;
     aqui só troca criarPix() e cobrarCartao() por um fetch para essa função, e o cartão passa
     a ser tokenizado pelo SDK do gateway (o número nunca toca o nosso servidor). */
(() => {
  const { L, $, brl, esc, mem, precoPix, zap, I, toast, Sacola, linhaItem, variante } = window.Loja;
  const so = s => String(s || '').replace(/\D/g, '');
  const demo = !L.pix || !L.pix.chave;

  /* ---------- Pix (BR Code do Banco Central, com CRC16) ---------- */
  const tlv = (id, v) => id + String(v.length).padStart(2, '0') + v;
  const limpa = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9 ]/g, '').toUpperCase().trim();
  function crc16(s) {
    let c = 0xFFFF;
    for (let i = 0; i < s.length; i++) {
      c ^= s.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) c = c & 0x8000 ? (c << 1) ^ 0x1021 : c << 1;
      c &= 0xFFFF;
    }
    return c.toString(16).toUpperCase().padStart(4, '0');
  }
  function brcode({ chave, nome, cidade, valor, txid }) {
    let p = tlv('00', '01') + tlv('26', tlv('00', 'br.gov.bcb.pix') + tlv('01', chave)) + tlv('52', '0000') + tlv('53', '986')
      + tlv('54', valor.toFixed(2)) + tlv('58', 'BR') + tlv('59', limpa(nome).slice(0, 25)) + tlv('60', limpa(cidade).slice(0, 15))
      + tlv('62', tlv('05', limpa(txid).replace(/ /g, '').slice(0, 25) || '***')) + '6304';
    return p + crc16(p);
  }

  const Pagamento = {
    provedor: demo ? 'demo' : 'pix-estatico',
    async criarPix(pedido) {
      const chave = demo ? 'demonstracao@zynchub.com.br' : L.pix.chave;
      return { copiaECola: brcode({ chave, nome: demo ? L.nome : L.pix.nome, cidade: (L.pix && L.pix.cidade) || 'SALVADOR', valor: pedido.total, txid: pedido.id }), expiraEm: Date.now() + 30 * 60e3 };
    },
    async cobrarCartao(pedido, cartao) {
      await new Promise(r => setTimeout(r, 1800));
      if (cartao.numero.endsWith('0002')) return { aprovado: false, motivo: 'Cartão recusado pelo banco emissor. Tente outro cartão ou pague com Pix.' };
      return { aprovado: true };
    },
  };

  /* ---------- validações ---------- */
  function cpfOk(v) {
    const c = so(v); if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
    for (let t = 9; t < 11; t++) { let s = 0; for (let i = 0; i < t; i++) s += c[i] * (t + 1 - i); if (((s * 10) % 11) % 10 != c[t]) return false; }
    return true;
  }
  function luhn(n) { let s = 0, alt = false; for (let i = n.length - 1; i >= 0; i--) { let d = +n[i]; if (alt) { d *= 2; if (d > 9) d -= 9; } s += d; alt = !alt; } return n.length >= 13 && s % 10 === 0; }
  function bandeira(n) {
    if (/^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(n)) return 'elo';
    if (/^3[47]/.test(n)) return 'amex'; if (/^(606282|3841)/.test(n)) return 'hipercard';
    if (/^4/.test(n)) return 'visa'; if (/^(5[1-5]|2[2-7])/.test(n)) return 'mastercard'; return '';
  }
  const mascaras = {
    zap: v => { const d = so(v).slice(0, 11); return d.length > 10 ? d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3') : d.replace(/(\d{2})(\d{0,4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, ''); },
    cpf: v => so(v).slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2'),
    cep: v => so(v).slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2'),
    cartao: v => so(v).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 '),
    validade: v => so(v).slice(0, 4).replace(/(\d{2})(\d)/, '$1/$2'),
    cvv: v => so(v).slice(0, 4),
  };

  /* ---------- estado e render ---------- */
  const salvo = mem.get('cliente', {});
  const st = { entrega: 'retirada', pagamento: 'pix', parcelas: 1 };

  function totais() {
    const sub = Sacola.subtotal();
    const frete = st.entrega === 'entrega' ? L.entrega.taxa : 0;
    const desc = st.pagamento === 'pix' ? Math.round((sub - precoPix(sub)) * 100) / 100 : 0;
    return { sub, frete, desc, total: Math.round((sub - desc + frete) * 100) / 100 };
  }

  function campo(id, rotulo, extra = '', cls = '') {
    return `<div class="campo ${cls}" data-campo="${id}"><label for="${id}">${rotulo}</label><input id="${id}" name="${id}" ${extra} value="${esc(salvo[id] || '')}"><span class="msg" hidden></span></div>`;
  }

  function render() {
    const main = $('#co');
    if (!Sacola.contagem()) {
      main.innerHTML = `<div class="painel-ok"><h1>Sua sacola está vazia</h1><p>Escolha suas peças na vitrine e volte aqui para pagar.</p><a class="btn" href="index.html">Ver a vitrine</a></div>`;
      return;
    }
    main.innerHTML = `
      <form class="co" id="form" novalidate>
        <div>
          <section class="co-bloco"><h2><i>1</i> Seus dados</h2>
            <div class="campos">
              ${campo('nome', 'Nome completo', 'autocomplete="name" required')}
              ${campo('zap', 'WhatsApp', 'inputmode="tel" autocomplete="tel" placeholder="(71) 90000-0000" required', 'c3')}
              ${campo('email', 'E-mail <small>(opcional)</small>', 'type="email" autocomplete="email"', 'c3')}
            </div>
          </section>
          <section class="co-bloco"><h2><i>2</i> Entrega</h2>
            <div class="escolhas">
              <label class="escolha"><input type="radio" name="entrega" value="retirada" ${st.entrega === 'retirada' ? 'checked' : ''}>
                <div><b>Retirar na loja</b><small>${esc(L.endereco)}</small></div><span class="val">Grátis</span></label>
              <label class="escolha"><input type="radio" name="entrega" value="entrega" ${st.entrega === 'entrega' ? 'checked' : ''}>
                <div><b>Receber em casa</b><small>${esc(L.entrega.texto)}</small></div><span class="val">${brl(L.entrega.taxa)}</span></label>
            </div>
            <div class="campos" id="endereco" style="margin-top:16px" ${st.entrega === 'entrega' ? '' : 'hidden'}>
              ${campo('cep', 'CEP', 'inputmode="numeric" autocomplete="postal-code" placeholder="00000-000"', 'c2 m3')}
              ${campo('rua', 'Rua', 'autocomplete="address-line1"', 'c4')}
              ${campo('numero', 'Número', 'inputmode="numeric"', 'c2 m3')}
              ${campo('complemento', 'Complemento <small>(opcional)</small>', '', 'c4')}
              ${campo('bairro', 'Bairro', '', 'c3')}
              ${campo('cidade', 'Cidade', 'value="Salvador"', 'c3')}
            </div>
          </section>
          <section class="co-bloco"><h2><i>3</i> Pagamento</h2>
            <div class="escolhas">
              <label class="escolha"><input type="radio" name="pagamento" value="pix" ${st.pagamento === 'pix' ? 'checked' : ''}>
                <div><b>Pix</b><small>Aprovação na hora</small></div>${L.pixDesconto ? `<span class="tag">${L.pixDesconto}% OFF</span>` : ''}</label>
              <label class="escolha"><input type="radio" name="pagamento" value="cartao" ${st.pagamento === 'cartao' ? 'checked' : ''}>
                <div><b>Cartão de crédito</b><small>Até ${L.parcelasSemJuros}x sem juros</small></div></label>
            </div>
            <div class="campos" id="cartao" style="margin-top:16px" ${st.pagamento === 'cartao' ? '' : 'hidden'}>
              <div class="campo" data-campo="cc" style="position:relative"><label for="cc">Número do cartão</label><input id="cc" inputmode="numeric" autocomplete="cc-number" placeholder="0000 0000 0000 0000"><span class="bandeira" id="band"></span><span class="msg" hidden></span></div>
              <div class="campo" data-campo="ccnome"><label for="ccnome">Nome impresso no cartão</label><input id="ccnome" autocomplete="cc-name"><span class="msg" hidden></span></div>
              <div class="campo c2 m3" data-campo="ccval"><label for="ccval">Validade</label><input id="ccval" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/AA"><span class="msg" hidden></span></div>
              <div class="campo c2 m3" data-campo="cccvv"><label for="cccvv">CVV</label><input id="cccvv" inputmode="numeric" autocomplete="cc-csc" placeholder="123"><span class="msg" hidden></span></div>
              ${campo('cpf', 'CPF do titular', 'inputmode="numeric" placeholder="000.000.000-00"', 'c2')}
              <div class="campo"><label for="parcelas">Parcelas</label><select id="parcelas"></select></div>
              ${demo ? `<div class="campo"><div class="aviso-demo" style="margin:0">Demonstração: nenhum valor é cobrado. <button type="button" id="teste">Preencher cartão de teste</button></div></div>` : ''}
            </div>
          </section>
        </div>
        <aside class="resumo co-bloco" id="resumo"></aside>
      </form>`;
    renderResumo();
    ligar();
  }

  function renderResumo() {
    const t = totais(), r = $('#resumo'); if (!r) return;
    const btn = st.pagamento === 'pix' ? `Gerar Pix de ${brl(t.total)}` : `Pagar ${brl(t.total)}`;
    r.innerHTML = `<h2 style="margin:0 0 6px">Resumo do pedido</h2>
      ${Sacola.linhas().map((l, i) => linhaItem(l, i, false)).join('')}
      <div style="display:grid;gap:8px;margin-top:16px">
        <div class="soma"><span>Subtotal</span><span>${brl(t.sub)}</span></div>
        ${t.desc ? `<div class="soma"><span>Desconto Pix</span><span class="pix">− ${brl(t.desc)}</span></div>` : ''}
        <div class="soma"><span>Entrega</span><span>${t.frete ? brl(t.frete) : 'Grátis'}</span></div>
        <div class="soma total" style="margin-top:6px"><span>Total</span><span>${brl(t.total)}</span></div>
        ${st.pagamento === 'cartao' && st.parcelas > 1 ? `<div class="soma"><span></span><span>${st.parcelas}x de ${brl(t.total / st.parcelas)}</span></div>` : ''}
      </div>
      <button class="btn cheio" type="submit" style="margin-top:18px">${btn}</button>
      <p class="co-seguro">${I.escudo} Pagamento seguro${demo ? ' · modo demonstração' : ''}</p>
      <a href="index.html" style="display:block;text-align:center;font-size:14px;margin-top:8px">← Continuar comprando</a>`;
    const sel = $('#parcelas');
    if (sel) {
      sel.innerHTML = Array.from({ length: L.parcelasSemJuros }, (_, i) => `<option value="${i + 1}" ${i + 1 === st.parcelas ? 'selected' : ''}>${i + 1}x de ${brl(t.total / (i + 1))} sem juros</option>`).join('');
    }
  }

  function ligar() {
    const f = $('#form');
    f.addEventListener('input', e => {
      const el = e.target, m = { zap: 'zap', cpf: 'cpf', cep: 'cep', cc: 'cartao', ccval: 'validade', cccvv: 'cvv' }[el.id];
      if (m) el.value = mascaras[m](el.value);
      if (el.id === 'cc') $('#band').textContent = bandeira(so(el.value));
      if (el.id === 'cep' && so(el.value).length === 8) buscaCep(so(el.value));
      marcarErro(el.id, '');
    });
    f.addEventListener('change', e => {
      if (e.target.name === 'entrega') { st.entrega = e.target.value; $('#endereco').hidden = st.entrega !== 'entrega'; renderResumo(); }
      if (e.target.name === 'pagamento') { st.pagamento = e.target.value; $('#cartao').hidden = st.pagamento !== 'cartao'; renderResumo(); }
      if (e.target.id === 'parcelas') { st.parcelas = +e.target.value; renderResumo(); }
    });
    const teste = $('#teste');
    if (teste) teste.onclick = () => {
      Object.entries({ cc: '4111 1111 1111 1111', ccnome: 'CLIENTE TESTE', ccval: '12/30', cccvv: '123', cpf: '529.982.247-25' }).forEach(([k, v]) => { $('#' + k).value = v; marcarErro(k, ''); });
      $('#band').textContent = 'visa';
    };
    f.addEventListener('submit', e => { e.preventDefault(); finalizar(); });
  }

  async function buscaCep(cep) {
    try {
      const r = await (await fetch(`https://viacep.com.br/ws/${cep}/json/`)).json();
      if (r.erro) return marcarErro('cep', 'CEP não encontrado');
      $('#rua').value = r.logradouro || ''; $('#bairro').value = r.bairro || ''; $('#cidade').value = r.localidade || '';
      $('#numero').focus();
    } catch (e) { /* sem internet: preenche à mão */ }
  }

  function marcarErro(id, msg) {
    const c = document.querySelector(`[data-campo="${id}"]`); if (!c) return;
    c.classList.toggle('erro', !!msg); const m = c.querySelector('.msg'); m.textContent = msg; m.hidden = !msg;
  }
  const v = id => ($('#' + id)?.value || '').trim();

  function validar() {
    const erros = [];
    const req = (id, ok, msg) => { if (!ok) { marcarErro(id, msg); erros.push(id); } };
    req('nome', v('nome').split(' ').filter(Boolean).length >= 2, 'Digite nome e sobrenome');
    req('zap', so(v('zap')).length >= 10, 'WhatsApp inválido');
    if (v('email')) req('email', /^\S+@\S+\.\S+$/.test(v('email')), 'E-mail inválido');
    if (st.entrega === 'entrega') {
      req('cep', so(v('cep')).length === 8, 'CEP inválido');
      ['rua', 'numero', 'bairro', 'cidade'].forEach(k => req(k, v(k), 'Obrigatório'));
    }
    if (st.pagamento === 'cartao') {
      const n = so(v('cc'));
      req('cc', luhn(n), 'Número de cartão inválido');
      req('ccnome', v('ccnome').length >= 3, 'Obrigatório');
      const [mm, aa] = v('ccval').split('/').map(Number), agora = new Date();
      req('ccval', mm >= 1 && mm <= 12 && aa && new Date(2000 + aa, mm) > agora, 'Validade inválida');
      req('cccvv', so(v('cccvv')).length >= 3, 'CVV inválido');
      req('cpf', cpfOk(v('cpf')), 'CPF inválido');
    }
    if (erros.length) document.querySelector(`[data-campo="${erros[0]}"] input`).focus();
    return !erros.length;
  }

  function novoId() { return (L.prefixoPedido || 'PD') + String(Date.now()).slice(-6); }

  async function finalizar() {
    if (!validar()) return;
    const cliente = { nome: v('nome'), zap: v('zap'), email: v('email') };
    const end = st.entrega === 'entrega' ? { cep: v('cep'), rua: v('rua'), numero: v('numero'), complemento: v('complemento'), bairro: v('bairro'), cidade: v('cidade') } : null;
    mem.set('cliente', { ...cliente, ...(end || {}) });
    const t = totais();
    const pedido = {
      id: novoId(), data: new Date().toISOString(), cliente, entrega: { tipo: st.entrega, endereco: end, taxa: t.frete },
      itens: Sacola.linhas().map(l => ({ id: l.id, nome: l.p.nome, tam: l.tam, cor: l.cor || '', qtd: l.qtd, preco: l.p.preco, foto: l.p.fotos[0] })),
      subtotal: t.sub, desconto: t.desc, total: t.total, status: 'aguardando', pagamento: { metodo: st.pagamento },
    };
    if (st.pagamento === 'cartao') {
      const n = so(v('cc'));
      pedido.pagamento = { metodo: 'cartao', parcelas: st.parcelas, bandeira: bandeira(n), final: n.slice(-4) };
      const ov = document.createElement('div'); ov.className = 'processando'; ov.innerHTML = '<div style="text-align:center"><div class="giro"></div>Processando pagamento…</div>'; document.body.append(ov);
      const r = await Pagamento.cobrarCartao(pedido, { numero: n, nome: v('ccnome'), validade: v('ccval'), cvv: v('cccvv'), cpf: v('cpf') });
      ov.remove();
      if (!r.aprovado) { marcarErro('cc', r.motivo); toast('Pagamento não aprovado'); return; }
      pedido.status = 'pago';
      salvarPedido(pedido); Sacola.limpar(); telaOk(pedido);
    } else {
      salvarPedido(pedido); Sacola.limpar(); telaPix(pedido, await Pagamento.criarPix(pedido));
    }
  }

  function salvarPedido(p) { const l = mem.get('pedidos', []); const i = l.findIndex(x => x.id === p.id); i >= 0 ? l[i] = p : l.unshift(p); mem.set('pedidos', l); }

  function textoPedido(p) {
    const itens = p.itens.map(i => `• ${i.qtd}x ${i.nome}${i.cor ? ' — ' + i.cor : ''}${i.tam && i.tam !== 'Único' ? ' — Tam. ' + i.tam : ''} (${brl(i.preco * i.qtd)})`).join('\n');
    const ent = p.entrega.tipo === 'entrega' ? `Entrega: ${p.entrega.endereco.rua}, ${p.entrega.endereco.numero}${p.entrega.endereco.complemento ? ' - ' + p.entrega.endereco.complemento : ''}, ${p.entrega.endereco.bairro} - ${p.entrega.endereco.cidade}` : 'Retirada na loja';
    const pg = p.pagamento.metodo === 'pix' ? 'Pix' : `Cartão ${p.pagamento.bandeira || ''} final ${p.pagamento.final} em ${p.pagamento.parcelas}x`;
    return `Olá! Fiz o pedido *#${p.id}* pelo site.\n\n${itens}\n\nTotal: *${brl(p.total)}* (${pg})\n${ent}\nNome: ${p.cliente.nome}`;
  }

  let relogio;
  function telaPix(p, pix) {
    window.scrollTo(0, 0);
    $('#co').innerHTML = `<div class="painel-pix">
      <p class="olho">Pedido #${p.id}</p><h1>Pague com Pix</h1>
      <p>Valor: <b style="font-size:22px">${brl(p.total)}</b></p>
      <div class="qr" id="qr"></div>
      <p style="margin:0">Abra o app do seu banco, escolha <b>Pix → Ler QR Code</b> ou use o código abaixo.</p>
      <div class="copia"><input id="cc-pix" readonly value="${esc(pix.copiaECola)}" aria-label="Pix copia e cola"><button class="btn" id="copiar" type="button">Copiar</button></div>
      <p style="font-size:14px;color:var(--muted)">O código expira em <span class="relogio" id="tempo">30:00</span></p>
      ${demo ? `<div class="aviso-demo">Demonstração: este QR Code não cobra nada. Quando a loja informar a chave Pix, ele passa a receber de verdade.</div>
        <button class="btn cheio" id="simular" style="margin-top:16px">Simular pagamento aprovado</button>`
        : `<a class="btn zap cheio" style="margin-top:16px" target="_blank" rel="noopener" href="${zap(textoPedido(p) + '\n\nSegue o comprovante do Pix:')}">${I.zap} Já paguei — enviar comprovante</a>`}
      <a href="index.html" style="display:block;margin-top:14px;font-size:14px">Voltar à loja</a>
    </div>`;
    const q = window.qrcode ? window.qrcode(0, 'M') : null;
    if (q) { q.addData(pix.copiaECola); q.make(); $('#qr').innerHTML = q.createSvgTag({ cellSize: 6, margin: 0, scalable: true }); }
    $('#copiar').onclick = () => navigator.clipboard?.writeText(pix.copiaECola).then(() => toast('Código Pix copiado ✓'), () => { $('#cc-pix').select(); document.execCommand('copy'); toast('Código Pix copiado ✓'); });
    clearInterval(relogio);
    relogio = setInterval(() => {
      const s = Math.max(0, Math.round((pix.expiraEm - Date.now()) / 1000));
      $('#tempo') ? $('#tempo').textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` : clearInterval(relogio);
    }, 1000);
    const sim = $('#simular');
    if (sim) sim.onclick = () => { clearInterval(relogio); p.status = 'pago'; salvarPedido(p); telaOk(p); };
  }

  function telaOk(p) {
    window.scrollTo(0, 0);
    const pg = p.pagamento.metodo === 'pix' ? 'Pix' : `Cartão${p.pagamento.bandeira ? ' ' + p.pagamento.bandeira : ''} final ${p.pagamento.final} · ${p.pagamento.parcelas}x`;
    $('#co').innerHTML = `<div class="painel-ok">
      <div class="check">${I.check}</div>
      <p class="olho">Pedido #${p.id}</p><h1>Pagamento aprovado!</h1>
      <p>Obrigado, ${esc(p.cliente.nome.split(' ')[0])}. ${p.entrega.tipo === 'retirada' ? 'Avisamos no seu WhatsApp quando o pedido estiver separado para retirada.' : 'Avisamos no seu WhatsApp quando o pedido sair para entrega.'}</p>
      <div style="margin:18px 0">${p.itens.map(i => `<div class="item"><img src="${esc(i.foto)}" alt=""><div><h4>${esc(i.nome)}</h4><small>${esc(variante(i))} · Qtd: ${i.qtd}</small></div><div class="item-preco">${brl(i.preco * i.qtd)}</div></div>`).join('')}</div>
      <div class="soma total"><span>Total pago</span><span>${brl(p.total)}</span></div>
      <div class="soma" style="margin-top:6px"><span>Pagamento</span><span>${esc(pg)}</span></div>
      <div class="soma" style="margin:6px 0 22px"><span>Entrega</span><span>${p.entrega.tipo === 'retirada' ? 'Retirada na loja' : esc(p.entrega.endereco.bairro)}</span></div>
      <a class="btn zap cheio" target="_blank" rel="noopener" href="${zap(textoPedido(p))}">${I.zap} Acompanhar pelo WhatsApp</a>
      <a class="btn sec cheio" href="index.html" style="margin-top:10px">Voltar à loja</a>
    </div>`;
  }

  document.addEventListener('DOMContentLoaded', render);
  document.addEventListener('sacola', () => { if ($('#resumo')) renderResumo(); });
})();
