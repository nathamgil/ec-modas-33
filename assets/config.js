/* Dados da EC Modas 33. Preços, taxas e descontos marcados "A CONFIRMAR" são de exemplo (ver README). */
window.LOJA = {
  slug: 'ecmodas33',
  nome: 'EC Modas 33',
  slogan: 'Vestindo sua moda',
  prefixoPedido: 'EC',
  whatsapp: '5571988187412',
  instagram: 'ecmodas33oficial_',
  endereco: 'Rua Sérgio de Carvalho, Av. Vasco da Gama — Salvador, BA',
  mapa: 'Rua Sérgio de Carvalho, Engenho Velho da Federação, Salvador - BA',
  horario: '', // A CONFIRMAR
  msgZap: 'Olá! Vim pelo site da EC Modas 33 e quero tirar uma dúvida.',
  categorias: ['Polos', 'Bonés', 'Perfumes'],
  pixDesconto: 5,        // A CONFIRMAR
  parcelasSemJuros: 3,   // A CONFIRMAR
  entrega: { taxa: 10, texto: 'Entrega por motoboy em Salvador' }, // taxa A CONFIRMAR
  textoEntrega: 'Retire na loja ou receba em casa em Salvador',
  pix: { chave: '', nome: 'EC MODAS 33', cidade: 'SALVADOR' }, // chave vazia = modo demonstração
};

window.PRODUTOS = [
  { id: 'polo-tricolor-verde', nome: 'Polo Piquet Tricolor Verde', categoria: 'Polos', preco: 119.9, precoDe: 149.9, tamanhos: ['P', 'M', 'G', 'GG'], fotos: ['fotos/05.jpg', 'fotos/01.jpg'], destaque: true,
    descricao: 'Malha piquet com recortes em verde-escuro e branco nos ombros. Gola polo com botões e caimento regular.' },
  { id: 'polo-tricolor-offwhite', nome: 'Polo Piquet Tricolor Off-White', categoria: 'Polos', preco: 119.9, precoDe: 149.9, tamanhos: ['P', 'M', 'G', 'GG'], fotos: ['fotos/06.jpg', 'fotos/02.jpg'], destaque: true,
    descricao: 'Base off-white com mangas em azul-marinho e ombros em azul-claro. Combina com bermuda de sarja e jeans.' },
  { id: 'polo-tricolor-preta', nome: 'Polo Piquet Tricolor Preta', categoria: 'Polos', preco: 119.9, precoDe: 149.9, tamanhos: ['P', 'M', 'G', 'GG'], fotos: ['fotos/04.jpg', 'fotos/03.jpg'], destaque: true,
    descricao: 'Preta com mangas azul-céu e ombros brancos. A mais pedida da coleção.' },
  { id: 'bone-branco', nome: 'Boné Aba Curva Branco', categoria: 'Bonés', preco: 79.9, tamanhos: ['Único'], fotos: ['fotos/07.jpg'], novo: true,
    descricao: 'Boné branco com aba em preto e branco e regulagem traseira.' },
  { id: 'bone-marinho', nome: 'Boné Aba Curva Marinho', categoria: 'Bonés', preco: 79.9, tamanhos: ['Único'], fotos: ['fotos/08.jpg'], novo: true,
    descricao: 'Azul-marinho com aba contrastante em branco e regulagem traseira.' },
  { id: 'bone-cores', nome: 'Boné Aba Curva — Cores', categoria: 'Bonés', preco: 79.9, tamanhos: ['Único'], cores: ['Preto', 'Branco', 'Azul-claro', 'Verde'], fotos: ['fotos/09.jpg'],
    descricao: 'Mesmo modelo em quatro cores. Escolha a sua.' },
  { id: 'perfume-212-heroes', nome: 'Perfume 212 Men Heroes', categoria: 'Perfumes', preco: 189.9, tamanhos: ['Único'], fotos: ['fotos/10.jpg'],
    descricao: 'Fragrância masculina. Consulte a disponibilidade de volumes no WhatsApp.' },
  { id: 'perfume-malbec', nome: 'Perfume Malbec', categoria: 'Perfumes', preco: 199.9, tamanhos: ['Único'], fotos: ['fotos/11.jpg'],
    descricao: 'Fragrância masculina amadeirada.' },
  { id: 'perfume-la-vie-est-belle', nome: 'Perfume La Vie Est Belle', categoria: 'Perfumes', preco: 249.9, tamanhos: ['Único'], fotos: ['fotos/12.jpg'],
    descricao: 'Fragrância feminina. Uma boa opção de presente.' },
];
