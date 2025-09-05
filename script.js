// --- Definição das Taxas de Marketplaces ---
const MARKETPLACE_FEES = {
    'Classico': {
        commission_percentage: 12,
        fixed_fee: 6.75
    },
    'Premium': {
        commission_percentage: 17,
        fixed_fee: 6.75
    },
    'Shopee': {
        commission_percentage: 20,
        fixed_fee: 4.00
    },
    'Offline': {
        commission_percentage: 0,
        fixed_fee: 0
    }
};

// --- Função Principal de Inicialização ---
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Referências aos Elementos do DOM ---
    const exposureTypeSelect = document.getElementById('exposureType');
    const saleValueInput = document.getElementById('saleValue');
    const shippingCostInput = document.getElementById('shippingCost');
    const unitCostInput = document.getElementById('unitCost');
    const quantityInput = document.getElementById('quantity');
    
    // Referências para o campo de imposto
    const taxInput = document.getElementById('taxInput');
    const taxTypeToggle = document.getElementById('taxTypeToggle');
    const taxValueDisplay = document.getElementById('taxValueDisplay');

    const commissionInput = document.getElementById('commissionInput');
    const commissionTypeToggle = document.getElementById('commissionTypeToggle');
    const fixedFeeDisplay = document.getElementById('fixedFeeDisplay');
    
    const commissionDiscountInput = document.getElementById('commissionDiscount');
    const promoDiscountInput = document.getElementById('promoDiscount');
    const marginValueDisplay = document.getElementById('marginValue');
    const marginPercentageDisplay = document.getElementById('marginPercentage');
    const themeToggleButton = document.getElementById('themeToggle');

    const commissionInputContainer = document.getElementById('commissionInputContainer');
    const commissionDisplayContainer = document.getElementById('commissionDisplayContainer');
    const commissionValueDisplay = document.getElementById('commissionValueDisplay');
    const commissionPercentageDisplay = document.getElementById('commissionPercentageDisplay');
    
    // Variáveis de estado para o tipo de entrada (R$ ou %)
    let taxInputType = 'percent';
    let commissionInputType = 'percent';

    // --- 2. Gerenciamento de Tema ---
    let isDarkMode = JSON.parse(localStorage.getItem('isDarkMode')) || false;

    function applyTheme() {
        document.body.classList.toggle('dark-mode', isDarkMode);
    }

    function toggleTheme() {
        isDarkMode = !isDarkMode;
        localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
        applyTheme();
    }

    // --- 3. Função Principal de Cálculo da Margem ---
    function calculateContributionMargin() {
        const saleValue = parseFloat(saleValueInput.value) || 0;
        const shippingCost = parseFloat(shippingCostInput.value) || 0;
        const unitCost = parseFloat(unitCostInput.value) || 0;
        const quantity = parseFloat(quantityInput.value) || 1;
        const promoDiscount = parseFloat(promoDiscountInput.value) || 0;
        const commissionDiscountValue = parseFloat(commissionDiscountInput.value) || 0;

        const selectedExposure = exposureTypeSelect.value;
        const currentFees = MARKETPLACE_FEES[selectedExposure];

        if (selectedExposure === 'Offline') {
            commissionInputContainer.classList.remove('commission-input-hidden');
            commissionDisplayContainer.classList.add('commission-display-hidden');
        } else {
            commissionInputContainer.classList.add('commission-input-hidden');
            commissionDisplayContainer.classList.remove('commission-display-hidden');
        }

        // --- Lógica do Imposto ---
        let taxValue = 0;
        let taxInputAsNumber = parseFloat(taxInput.value) || 0;
        if (taxInputType === 'percent') {
            taxValue = (taxInputAsNumber / 100) * saleValue;
        } else {
            taxValue = taxInputAsNumber;
        }

        // --- Lógica da Tarifa ---
        let commissionPercentage = 0;
        let fixedFee = 0;
        
        if (selectedExposure === 'Offline') {
            commissionValue = parseFloat(commissionInput.value) || 0;
            if (commissionInputType === 'percent') {
                commissionValue = (commissionValue / 100) * saleValue;
            }
            fixedFee = 0;
        } else {
            commissionValue = (currentFees.commission_percentage / 100) * saleValue;
            commissionPercentage = currentFees.commission_percentage;
            fixedFee = currentFees.fixed_fee;
        }
        
        // --- Aplicando o desconto em R$ na tarifa total ---
        const totalCommissionFee = commissionValue + fixedFee;
        const finalCommissionFee = totalCommissionFee - commissionDiscountValue;
        
        const effectiveSaleValue = saleValue * (1 - (promoDiscount / 100));
        const totalCosts = (unitCost * quantity) + shippingCost + taxValue + finalCommissionFee;
        const margin = effectiveSaleValue - totalCosts;

        const marginPercentage = (effectiveSaleValue > 0) ? (margin / effectiveSaleValue) * 100 : 0;

        // --- Atualizar a Interface ---
        taxValueDisplay.value = `R$ ${taxValue.toFixed(2)}`;

        fixedFeeDisplay.textContent = `+ Tarifa Fixa R$ ${fixedFee.toFixed(2)}`;
        
        commissionValueDisplay.textContent = `R$ ${(finalCommissionFee).toFixed(2)}`;
        commissionPercentageDisplay.textContent = `${(commissionPercentage).toFixed(2)}%`;
        
        marginValueDisplay.textContent = `R$ ${margin.toFixed(2)}`;
        marginPercentageDisplay.textContent = `${marginPercentage.toFixed(2)}%`;

        marginValueDisplay.classList.toggle('negative', margin < 0);
        marginPercentageDisplay.classList.toggle('negative', margin < 0);
        marginValueDisplay.classList.toggle('positive', margin >= 0);
        marginPercentageDisplay.classList.toggle('positive', margin >= 0);
    }

    // --- 4. Configuração dos Event Listeners ---
    themeToggleButton.addEventListener('click', toggleTheme);

    const inputsToWatch = [
        saleValueInput, shippingCostInput, unitCostInput, quantityInput,
        taxInput, commissionInput, promoDiscountInput, commissionDiscountInput
    ];

    inputsToWatch.forEach(input => {
        input.addEventListener('input', calculateContributionMargin);
    });

    exposureTypeSelect.addEventListener('change', calculateContributionMargin);
    
    taxTypeToggle.addEventListener('click', () => {
        taxInputType = (taxInputType === 'percent') ? 'value' : 'percent';
        taxTypeToggle.textContent = (taxInputType === 'percent') ? '%' : 'R$';
        taxInput.value = '';
        taxInput.placeholder = (taxInputType === 'percent') ? '12.60' : '0.00';
        calculateContributionMargin();
    });
    
    commissionTypeToggle.addEventListener('click', () => {
        commissionInputType = (commissionInputType === 'percent') ? 'value' : 'percent';
        commissionTypeToggle.textContent = (commissionInputType === 'percent') ? '%' : 'R$';
        commissionInput.placeholder = (commissionInputType === 'percent') ? '0.00' : '0.00';
        calculateContributionMargin();
    });


    // --- 5. Inicialização da Aplicação ---
    applyTheme();
    calculateContributionMargin();
});
