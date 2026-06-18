// --- CONFIGURAÇÃO CENTRAL DE TAXAS (Atualizado 2026) ---
const CONFIG = {
    ML_CLASSICO_PERCENT: 12,
    ML_PREMIUM_PERCENT: 17,
    VENDA_DIRETA_PERCENT: 5 // Considerando taxa de cartão média
};

// Gerenciamento de Abas
function openTab(evt, tabName) {
    let i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) tabcontent[i].style.display = "none";
    tablinks = document.getElementsByClassName("tab-button");
    for (i = 0; i < tablinks.length; i++) tablinks[i].className = tablinks[i].className.replace(" active", "");
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
    updateCalculations();
}

// Lógica de Taxas do Marketplace Isolada
function getMarketplaceFees(channel, price) {
    if (channel === 'Offline') return { percentage: CONFIG.VENDA_DIRETA_PERCENT / 100, fixed: 0, dynamic_fixed: 0 };
    
    let perc = 0;
    let fixed = 0;
    let dynamic_fixed = 0; // Taxa de 50% em itens muito baratos

    if (channel === 'Classico' || channel === 'Premium') {
        perc = channel === 'Classico' ? CONFIG.ML_CLASSICO_PERCENT / 100 : CONFIG.ML_PREMIUM_PERCENT / 100;
        if (price < 12.50) dynamic_fixed = price * 0.50;
        else if (price < 29.00) fixed = 6.25;
        else if (price < 50.00) fixed = 6.50;
        else if (price < 79.00) fixed = 6.75;
        else fixed = 0.00;
    }
    
    if (channel === 'Shopee') {
        if (price < 8.00) { perc = 0.20; dynamic_fixed = price * 0.50; }
        else if (price <= 79.99) { perc = 0.20; fixed = 4.00; }
        else if (price <= 99.99) { perc = 0.14; fixed = 16.00; }
        else if (price <= 199.99) { perc = 0.14; fixed = 20.00; }
        else { perc = 0.14; fixed = 26.00; }
    }
    return { percentage: perc, fixed: fixed, dynamic_fixed: dynamic_fixed };
}

// Motor de Preço Reverso Algebraico
function calculateTargetPrice(cost, freight, taxPerc, targetMarginPerc, channel) {
    let candidates = [];
    taxPerc = taxPerc / 100;
    targetMarginPerc = targetMarginPerc / 100;

    const addCandidate = (c_perc, c_fixed, minP, maxP, dyn_fix = 0) => {
        let denominator = 1 - taxPerc - c_perc - targetMarginPerc - dyn_fix;
        if (denominator <= 0) return; // Impossível atingir margem nesta faixa
        let p = (cost + freight + c_fixed) / denominator;
        if (p >= minP && p <= maxP) candidates.push(p);
    };

    if (channel === 'Offline') {
        addCandidate(CONFIG.VENDA_DIRETA_PERCENT/100, 0, 0, Infinity);
    } else if (channel === 'Classico' || channel === 'Premium') {
        let p = channel === 'Classico' ? CONFIG.ML_CLASSICO_PERCENT/100 : CONFIG.ML_PREMIUM_PERCENT/100;
        addCandidate(p, 0, 0.01, 12.49, 0.50);
        addCandidate(p, 6.25, 12.50, 28.99);
        addCandidate(p, 6.50, 29.00, 49.99);
        addCandidate(p, 6.75, 50.00, 78.99);
        addCandidate(p, 0.00, 79.00, Infinity);
    } else if (channel === 'Shopee') {
        addCandidate(0.20, 0, 0.01, 7.99, 0.50);
        addCandidate(0.20, 4.00, 8.00, 79.99);
        addCandidate(0.14, 16.00, 80.00, 99.99);
        addCandidate(0.14, 20.00, 100.00, 199.99);
        addCandidate(0.14, 26.00, 200.00, Infinity);
    }

    if (candidates.length > 0) return Math.min(...candidates);
    
    // Tratamento de Gaps de Limite de Categoria
    let boundaries = channel === 'Shopee' ? [8.00, 80.00, 100.00, 200.00] : [12.50, 29.00, 50.00, 79.00];
    for (let b of boundaries) {
        let f = getMarketplaceFees(channel, b);
        let m = (b - cost - freight - (b*taxPerc) - (b*f.percentage) - f.fixed - f.dynamic_fixed) / b;
        if (m >= targetMarginPerc) return b; // Pula para o próximo valor viável
    }
    return 0; // Se nada for viável
}

// Atualização de UI
function updateCalculations() {
    // Aba Reversa
    let r_sale = parseFloat(document.getElementById('r_saleValue').value) || 0;
    let r_cost = parseFloat(document.getElementById('r_unitCost').value) || 0;
    let r_ship = parseFloat(document.getElementById('r_shipping').value) || 0;
    let r_taxP = parseFloat(document.getElementById('r_taxPerc').value) || 0;
    let r_chan = document.getElementById('exposureType').value;
    
    let r_fees = getMarketplaceFees(r_chan, r_sale);
    let r_taxVal = r_sale * (r_taxP / 100);
    let r_feeVal = (r_sale * r_fees.percentage) + r_fees.fixed + r_fees.dynamic_fixed;
    let r_profit = r_sale - r_cost - r_ship - r_taxVal - r_feeVal;
    let r_margin = r_sale > 0 ? (r_profit / r_sale) * 100 : 0;
    
    document.getElementById('r_channelFees').innerText = `R$ ${r_feeVal.toFixed(2)}`;
    document.getElementById('r_taxValue').innerText = `R$ ${r_taxVal.toFixed(2)}`;
    document.getElementById('r_marginValue').innerText = `R$ ${r_profit.toFixed(2)}`;
    document.getElementById('r_marginPerc').innerText = `${r_margin.toFixed(2)}%`;
    applyColors('r_marginValue', r_profit);
    applyColors('r_marginPerc', r_profit);

    // Aba Ideal
    let i_marg = parseFloat(document.getElementById('i_targetMargin').value) || 0;
    let i_cost = parseFloat(document.getElementById('i_unitCost').value) || 0;
    let i_ship = parseFloat(document.getElementById('i_shipping').value) || 0;
    let i_taxP = parseFloat(document.getElementById('i_taxPerc').value) || 0;
    let i_chan = document.getElementById('i_exposureType').value;
    
    let idealPrice = calculateTargetPrice(i_cost, i_ship, i_taxP, i_marg, i_chan);
    document.getElementById('i_suggestedPrice').innerText = `R$ ${idealPrice.toFixed(2)}`;
    document.getElementById('i_displayTarget').innerText = `${i_marg}%`;

    // Aba Comparativo
    let c_marg = parseFloat(document.getElementById('c_targetMargin').value) || 0;
    let c_cost = parseFloat(document.getElementById('c_unitCost').value) || 0;
    let channels = ['Offline', 'Classico', 'Premium', 'Shopee'];
    let tbody = document.querySelector('#comparisonTable tbody');
    tbody.innerHTML = '';
    
    channels.forEach(ch => {
        let p = calculateTargetPrice(c_cost, 0, 0, c_marg, ch);
        let fees = getMarketplaceFees(ch, p);
        let f_val = (p * fees.percentage) + fees.fixed + fees.dynamic_fixed;
        let profit = p - c_cost - f_val;
        
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${ch}</td>
            <td><strong>R$ ${p.toFixed(2)}</strong></td>
            <td>R$ ${f_val.toFixed(2)}</td>
            <td style="color: ${profit >= 0 ? '#28a745' : '#dc3545'};">R$ ${profit.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function applyColors(id, val) {
    let el = document.getElementById(id);
    el.classList.remove('positive', 'negative');
    el.classList.add(val >= 0 ? 'positive' : 'negative');
}

// Listeners
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('input', updateCalculations);
    });
    
    // Dark Mode simplificado
    const themeBtn = document.getElementById('themeToggle');
    let isDark = localStorage.getItem('isDarkMode') === 'true';
    if(isDark) document.body.classList.add('dark-mode');
    
    themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('isDarkMode', document.body.classList.contains('dark-mode'));
    });
    
    updateCalculations();
});
