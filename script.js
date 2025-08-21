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
    const productCostInput = document.getElementById('productCost');
    const taxValueInput = document.getElementById('taxValueInput');
    const commissionValueInput = document.getElementById('commissionValueInput');
    const commissionTypeToggle = document.getElementById('commissionTypeToggle');
    const fixedFeeDisplay = document.getElementById('fixedFeeDisplay');
    const promoDiscountInput = document.getElementById('promoDiscount');
    const marginValueDisplay = document.getElementById('marginValue');
    const marginPercentageDisplay = document.getElementById('marginPercentage');
    const themeToggleButton = document.getElementById('themeToggle');

    const commissionInputContainer = document.getElementById('commissionInputContainer');
    const commissionDisplayContainer = document.getElementById('commissionDisplayContainer');
    const commissionValueDisplay = document.getElementById('commissionValueDisplay');
    const commissionPercentageDisplay = document.getElementById('commissionPercentageDisplay');


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
        const productCost = parseFloat(productCostInput.value) || 0;
        const promoDiscount = parseFloat(promoDiscountInput.value) || 0;
        const taxPercentage = parseFloat(taxValueInput.value) || 0;

        const selectedExposure = exposureTypeSelect.value;
        const currentFees = MARKETPLACE_FEES[selectedExposure];

        if (selectedExposure === 'Offline') {
            commissionInputContainer.classList.remove('commission-input-hidden');
            commissionDisplayContainer.classList.add('commission-display-hidden');
        } else {
            commissionInputContainer.classList.add('commission-input-hidden');
            commissionDisplayContainer.classList.remove('commission-display-hidden');
        }

        const taxValue = (taxPercentage / 100) * saleValue;

        let commissionValue = 0;
        let commissionPercentage = 0;
        let fixedFee = 0;

        if (selectedExposure === 'Offline') {
            commissionValue = parseFloat(commissionValueInput.value) || 0;
            if (commissionTypeToggle.dataset.type === 'percent') {
                commissionValue = (commissionValue / 100) * saleValue;
            }
            fixedFee = 0;
        } else {
            commissionValue = (currentFees.commission_percentage / 100) * saleValue;
            commissionPercentage = currentFees.commission_percentage;
            fixedFee = currentFees.fixed_fee;
        }

        const effectiveSaleValue = saleValue * (1 - (promoDiscount / 100));
        const totalCosts = shippingCost + productCost + taxValue + commissionValue + fixedFee;
        const margin = effectiveSaleValue - totalCosts;

        const marginPercentage = (effectiveSaleValue > 0) ? (margin / effectiveSaleValue) * 100 : 0;

        fixedFeeDisplay.textContent = `+ Tarifa Fixa R$ ${fixedFee.toFixed(2)}`;
        
        commissionValueDisplay.textContent = `R$ ${commissionValue.toFixed(2)}`;
        commissionPercentageDisplay.textContent = `${commissionPercentage.toFixed(2)}%`;
        
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
        saleValueInput, shippingCostInput, productCostInput,
        taxValueInput, commissionValueInput, promoDiscountInput
    ];

    inputsToWatch.forEach(input => {
        input.addEventListener('input', calculateContributionMargin);
    });

    exposureTypeSelect.addEventListener('change', calculateContributionMargin);
    
    commissionTypeToggle.addEventListener('click', calculateContributionMargin);


    // --- 5. Inicialização da Aplicação ---
    applyTheme();
    calculateContributionMargin();
});