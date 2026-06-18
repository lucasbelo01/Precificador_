// CONFIGURAÇÃO DE TAXAS (MERCADO LIVRE ATUALIZADO E SHOPEE)
const FEES = {
    'Classico': { percent: 0.12 },
    'Premium':  { percent: 0.17 },
    'Shopee':   { percent: 0.20 },
    'Direta':   { percent: 0.05, fixo: 0 }
};

// Lógica de Taxas por Canal e Preço (Corrigida 2026 - ML sem Tarifa Fixa)
function getFeeStructure(canal, price) {
    if (canal === 'Direta') return { percent: FEES.Direta.percent, fixed: FEES.Direta.fixo, dynFix: 0 };
    
    let perc = FEES[canal].percent;
    let fixed = 0;
    let dynFix = 0;

    if (canal === 'Classico' || canal === 'Premium') {
        // ML Atualizado: Custo puramente percentual. 
        // Os custos de tabela de peso entram no campo 'Frete' de forma operacional.
        fixed = 0;
        dynFix = 0;
    }
    
    if (canal === 'Shopee') {
        if (price < 8.00) { dynFix = price * 0.50; }
        else if (price < 80.00) { fixed = 4.00; }
        else if (price < 100.00) { perc = 0.14; fixed = 16.00; }
        else if (price < 200.00) { perc = 0.14; fixed = 20.00; }
        else { perc = 0.14; fixed = 26.00; }
    }
    
    return { percent: perc, fixed: fixed, dynFix: dynFix };
}

// Matemática de Busca do Preço Ideal (Engenharia Reversa das Taxas)
function calcIdealPrice(custo, frete, impostoPerc, margemPerc, canal) {
    let imp = impostoPerc / 100;
    let marg = margemPerc / 100;
    let candidatos = [];

    const addCandidato = (txPerc, txFixa, minP, maxP, dynFix = 0) => {
        let divisor = 1 - imp - txPerc - marg - dynFix;
        if (divisor <= 0) return; 
        let p = (custo + frete + txFixa) / divisor;
        if (p >= minP && p <= maxP) candidatos.push(p);
    };

    if (canal === 'Direta') {
        addCandidato(FEES.Direta.percent, 0, 0, Infinity);
    } else if (canal === 'Classico' || canal === 'Premium') {
        let p = FEES[canal].percent;
        // Mercado Livre sem degraus de tarifa fixa, apenas comissão percentual contínua
        addCandidato(p, 0, 0.01, Infinity);
    } else if (canal === 'Shopee') {
        addCandidato(0.20, 0, 0.01, 7.99, 0.50);
        addCandidato(0.20, 4.00, 8.00, 79.99);
        addCandidato(0.14, 16.00, 80.00, 99.99);
        addCandidato(0.14, 20.00, 100.00, 199.99);
        addCandidato(0.14, 26.00, 200.00, Infinity);
    }

    if (candidatos.length > 0) return Math.min(...candidatos);
    return 0; // Fallback se impossível
}

// Controladores de UI
function updateReversa() {
    let canal = document.getElementById('r_canal').value;
    let venda = parseFloat(document.getElementById('r_venda').value) || 0;
    let custo = parseFloat(document.getElementById('r_custo').value) || 0;
    let frete = parseFloat(document.getElementById('r_frete').value) || 0;
    let impostoP = parseFloat(document.getElementById('r_imposto').value) || 0;

    let feeStr = getFeeStructure(canal, venda);
    let taxaVenda = (venda * feeStr.percent) + feeStr.fixed + feeStr.dynFix;
    let valImposto = venda * (impostoP / 100);
    
    let lucro = venda - custo - frete - valImposto - taxaVenda;
    let margem = venda > 0 ? (lucro / venda) * 100 : 0;

    const resLucro = document.getElementById('r_res_lucro');
    const resMargem = document.getElementById('r_res_margem');
    
    resLucro.innerText = `R$ ${lucro.toFixed(2)}`;
    resMargem.innerText = `${margem.toFixed(2)}%`;
    document.getElementById('r_res_imposto').innerText = `R$ ${valImposto.toFixed(2)}`;
    document.getElementById('r_res_taxa').innerText = `R$ ${taxaVenda.toFixed(2)}`;

    // Estilização condicional
    resLucro.className = `result-value highlight ${lucro >= 0 ? 'positive' : 'negative'}`;
    resMargem.className = `result-value highlight ${lucro >= 0 ? 'positive' : 'negative'}`;
}

function updateIdeal() {
    let canal = document.getElementById('i_canal').value;
    let margemAlvo = parseFloat(document.getElementById('i_margem_alvo').value) || 0;
    let custo = parseFloat(document.getElementById('i_custo').value) || 0;
    let frete = parseFloat(document.getElementById('i_frete').value) || 0;
    let impostoP = parseFloat(document.getElementById('i_imposto').value) || 0;

    let precoIdeal = calcIdealPrice(custo, frete, impostoP, margemAlvo, canal);
    
    // Recalcular para exibir na tela o detalhamento exato
    let feeStr = getFeeStructure(canal, precoIdeal);
    let taxaVenda = (precoIdeal * feeStr.percent) + feeStr.fixed + feeStr.dynFix;
    let lucroEsperado = precoIdeal * (margemAlvo / 100);

    document.getElementById('i_res_preco').innerText = `R$ ${precoIdeal.toFixed(2)}`;
    document.getElementById('i_res_margem_txt').innerText = `${margemAlvo.toFixed(2)}%`;
    document.getElementById('i_res_lucro').innerText = `R$ ${lucroEsperado.toFixed(2)}`;
    document.getElementById('i_res_taxa').innerText = `R$ ${taxaVenda.toFixed(2)}`;
}

function updateComparador() {
    let margemAlvo = parseFloat(document.getElementById('c_margem_alvo').value) || 0;
    let custoTotal = parseFloat(document.getElementById('c_custo').value) || 0;
    let impostoP = parseFloat(document.getElementById('c_imposto').value) || 0;
    let container = document.getElementById('compare-container');
    container.innerHTML = '';

    const canais = [
        { id: 'Classico', name: 'ML Clássico' },
        { id: 'Premium', name: 'ML Premium' },
        { id: 'Shopee', name: 'Shopee' },
        { id: 'Direta', name: 'V. Direta' }
    ];

    canais.forEach(c => {
        let preco = calcIdealPrice(custoTotal, 0, impostoP, margemAlvo, c.id);
        let lucro = preco * (margemAlvo / 100);
        let fees = getFeeStructure(c.id, preco);
        let taxaTotal = (preco * fees.percent) + fees.fixed + fees.dynFix;

        let card = document.createElement('div');
        card.className = 'channel-card';
        card.innerHTML = `
            <h4>${c.name}</h4>
            <div class="channel-price">R$ ${preco.toFixed(2)}</div>
            <div class="channel-detail"><span>Lucro:</span> <span style="color:var(--success)">R$ ${lucro.toFixed(2)}</span></div>
            <div class="channel-detail"><span>Taxas:</span> <span>R$ ${taxaTotal.toFixed(2)}</span></div>
        `;
        container.appendChild(card);
    });
}

// Navegação de Abas e Eventos
document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(tab.dataset.target).classList.add('active');
        });
    });

    // Listeners de Input para recalcular em tempo real
    document.querySelectorAll('#tab-reversa input, #tab-reversa select').forEach(el => el.addEventListener('input', updateReversa));
    document.querySelectorAll('#tab-ideal input, #tab-ideal select').forEach(el => el.addEventListener('input', updateIdeal));
    document.querySelectorAll('#tab-compare input').forEach(el => el.addEventListener('input', updateComparador));

    // Inicialização da interface
    updateReversa();
    updateIdeal();
    updateComparador();
});
