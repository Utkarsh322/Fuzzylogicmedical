// Simple SPA Router Configuration
const routes = {
    'home': 'tmpl-home',
    'diagnosis': 'tmpl-diagnosis',
    'how': 'tmpl-how',
    'about': 'tmpl-about'
};

document.addEventListener('DOMContentLoaded', () => {
    initRouter();
    
    // Fallback to home if no hash
    if(!window.location.hash) window.location.hash = '#home';
});

// History array length
const MAX_HISTORY = 5;

// Global chart instance
let fuzzyChart = null;

function initRouter() {
    window.addEventListener('hashchange', renderPage);
    renderPage();
}

function renderPage() {
    let hash = window.location.hash.substring(1) || 'home';
    let templateId = routes[hash];
    if(!templateId) {
        hash = 'home';
        templateId = routes['home'];
    }

    // Update Nav
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if(link.getAttribute('href') === `#${hash}`) link.classList.add('active');
    });

    // Render Content
    const root = document.getElementById('app-root');
    const tmpl = document.getElementById(templateId);
    root.innerHTML = '';
    
    if (tmpl) {
        root.appendChild(tmpl.content.cloneNode(true));
        
        // Execute page specific logic
        if (hash === 'diagnosis') {
            initDiagnosisPage();
        }
    }
}

// ------------------------------------
// DIAGNOSIS PAGE LOGIC
// ------------------------------------
function initDiagnosisPage() {
    // 1. Initial State
    const inputs = {
        age: document.getElementById('input-age'),
        bmi: document.getElementById('input-bmi'),
        bp: document.getElementById('input-bp'),
        sugar: document.getElementById('input-sugar')
    };

    const vals = {
        age: document.getElementById('val-age'),
        bmi: document.getElementById('val-bmi'),
        bp: document.getElementById('val-bp'),
        sugar: document.getElementById('val-sugar')
    };

    renderCustomRules();
    loadHistory();

    // Event listeners
    Object.keys(inputs).forEach(key => {
        inputs[key].addEventListener('input', () => {
            updateValueReadouts(inputs, vals);
            runDiagnosis(inputs);
        });
        inputs[key].addEventListener('change', () => {
            saveToHistory(inputs);
        });
    });

    // Default chart
    initChart('age');
    document.getElementById('chart-select').addEventListener('change', (e) => {
        initChart(e.target.value);
    });

    // Rule Editor Events
    document.getElementById('btn-add-rule').addEventListener('click', () => {
        let rule = {
            age: document.getElementById('rule-age').value,
            bmi: document.getElementById('rule-bmi').value,
            bp: document.getElementById('rule-bp').value,
            sugar: document.getElementById('rule-sugar').value,
            out: document.getElementById('rule-risk').value
        };
        // Ensure at least one condition
        if(rule.age==='*' && rule.bmi==='*' && rule.bp==='*' && rule.sugar==='*') return alert('Please set at least one IF condition.');
        
        let rules = window.NeuroFuzzy.getRules();
        rules.unshift(rule);
        window.NeuroFuzzy.saveRules(rules);
        renderCustomRules();
        runDiagnosis(inputs);
    });

    document.getElementById('btn-reset-rules').addEventListener('click', () => {
        window.NeuroFuzzy.resetRules();
        renderCustomRules();
        runDiagnosis(inputs);
    });

    // Initial run
    updateValueReadouts(inputs, vals);
    runDiagnosis(inputs);
}

function updateValueReadouts(inputs, vals) {
    vals.age.textContent = `${inputs.age.value} yrs`;
    vals.bmi.textContent = `${inputs.bmi.value} kg/m²`;
    vals.bp.textContent = `${inputs.bp.value} mmHg`;
    vals.sugar.textContent = `${inputs.sugar.value} mg/dL`;
}

function runDiagnosis(inputs) {
    let age = parseFloat(inputs.age.value);
    let bmi = parseFloat(inputs.bmi.value);
    let bp = parseFloat(inputs.bp.value);
    let sugar = parseFloat(inputs.sugar.value);

    let result = window.NeuroFuzzy.evaluate(age, bmi, bp, sugar);
    updateUI(result);
}

function updateUI(res) {
    const scoreEl = document.getElementById('risk-score');
    const levelEl = document.getElementById('risk-level');
    const ringEl = document.getElementById('ring-fill');
    
    // UI Colors
    let color = "var(--risk-low)";
    let text = "Low Risk";
    if (res.score >= 0.4 && res.score < 0.7) {
        color = "var(--risk-medium)";
        text = "Medium Risk";
    } else if (res.score >= 0.7) {
        color = "var(--risk-high)";
        text = "High Risk";
    }

    scoreEl.textContent = res.score.toFixed(2);
    scoreEl.style.color = color;
    levelEl.textContent = text;
    levelEl.style.color = color;

    // Gauge Update
    let dashOffset = 125.6 - (res.score * 125.6);
    ringEl.style.strokeDashoffset = dashOffset;
    ringEl.style.stroke = color;
    ringEl.style.filter = `drop-shadow(0 0 10px ${color})`;

    // XAI Logic Update
    updateXAI(res);
}

function updateXAI(res) {
    const verdict = document.getElementById('xai-verdict');
    const activeList = document.getElementById('active-rules');
    
    activeList.innerHTML = '';
    if(res.triggeredRules.length === 0) {
        activeList.innerHTML = '<li>No specific rules met.</li>';
    } else {
        res.triggeredRules.slice(0, 4).forEach(r => {
            activeList.innerHTML += `<li><strong>W: ${r.weight.toFixed(2)}</strong> ${r.text}</li>`;
        });
    }

    // XAI Verdict generator
    if (res.score > 0.7) {
        verdict.innerHTML = `High probability of disease due to <strong>${res.triggeredRules[0]?.raw?.bmi === 'High' ? 'elevated BMI' : 'critical factors'}</strong> aligning with strong trigger rules. Immediate medical review suggested.`;
    } else if (res.score > 0.4) {
        verdict.innerHTML = `Moderate risk identified. Multiple parameters are showing intermediate values. Monitoring advised.`;
    } else {
        verdict.innerHTML = `Overall biometric inputs fall within predominantly safe linguistic bounds. Risk is minimal.`;
    }
}

// ------------------------------------
// RULE EDITOR
// ------------------------------------
function renderCustomRules() {
    const list = document.getElementById('custom-rules-list');
    let rules = window.NeuroFuzzy.getRules();
    list.innerHTML = '';
    rules.forEach((r, idx) => {
        let conds = [];
        if(r.age !== '*') conds.push(`Age=${r.age}`);
        if(r.bmi !== '*') conds.push(`BMI=${r.bmi}`);
        if(r.bp !== '*') conds.push(`BP=${r.bp}`);
        if(r.sugar !== '*') conds.push(`Sug=${r.sugar}`);
        
        let div = document.createElement('div');
        div.className = 'custom-rule';
        div.innerHTML = `
            <span>IF ${conds.join(' & ')} &rarr; Risk=${r.out}</span>
            <button onclick="removeRule(${idx})">&times;</button>
        `;
        list.appendChild(div);
    });
}

window.removeRule = function(idx) {
    let rules = window.NeuroFuzzy.getRules();
    rules.splice(idx, 1);
    window.NeuroFuzzy.saveRules(rules);
    renderCustomRules();
    // Re-run diagnosis
    let iElements = {
        age: document.getElementById('input-age'),
        bmi: document.getElementById('input-bmi'),
        bp: document.getElementById('input-bp'),
        sugar: document.getElementById('input-sugar')
    };
    runDiagnosis(iElements);
}

// ------------------------------------
// HISTORY
// ------------------------------------
function saveToHistory(inputs) {
    let age = parseFloat(inputs.age.value);
    let bmi = parseFloat(inputs.bmi.value);
    let bp = parseFloat(inputs.bp.value);
    let sugar = parseFloat(inputs.sugar.value);

    let res = window.NeuroFuzzy.evaluate(age, bmi, bp, sugar);
    let level = res.score >= 0.7 ? "High" : res.score >= 0.4 ? "Medium" : "Low";

    let history = JSON.parse(localStorage.getItem('neurodx-history') || '[]');
    
    // Prevent spam if very similar score
    if(history.length > 0 && Math.abs(history[0].score - res.score) < 0.05) return;

    history.unshift({
        date: new Date().toLocaleString(),
        inputs: `Age: ${age}, BMI: ${bmi}`,
        score: res.score.toFixed(2),
        level: level
    });

    if(history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
    localStorage.setItem('neurodx-history', JSON.stringify(history));
    loadHistory();
}

function loadHistory() {
    let history = JSON.parse(localStorage.getItem('neurodx-history') || '[]');
    const container = document.getElementById('history-container');
    container.innerHTML = '';
    
    if(history.length === 0) {
        container.innerHTML = '<span style="color:var(--text-muted); font-size:0.9rem">No history available.</span>';
        return;
    }

    history.forEach(h => {
        container.innerHTML += `
            <div class="history-item">
                <div class="date">${h.date}</div>
                <div class="res">Score: ${h.score} (${h.level})</div>
            </div>
        `;
    });
}

// ------------------------------------
// CHART.JS Integration
// ------------------------------------
function initChart(varName) {
    const ctx = document.getElementById('fuzzyChart').getContext('2d');
    if (fuzzyChart) fuzzyChart.destroy();

    let sets = window.NeuroFuzzy.sets[varName];
    
    // Determine min/max for plotting
    let minStr = 0, maxStr = 100;
    if(varName==='bmi') { minStr=10; maxStr=50; }
    else if(varName==='bp') { minStr=80; maxStr=200; }
    else if(varName==='sugar') { minStr=50; maxStr=300; }
    else if(varName==='risk') { minStr=0; maxStr=1.0; }

    let dataPoints = [];
    for(let i=minStr; i<=maxStr; i+=(maxStr-minStr)/50) {
        dataPoints.push(i);
    }

    let datasets = Object.keys(sets).map(key => {
        let color = key==='Low' ? '#10b981' : key==='Medium' ? '#f59e0b' : '#ef4444';
        let data = dataPoints.map(x => sets[key].mf(x, sets[key].params));
        return {
            label: sets[key].label || key,
            data: data,
            borderColor: color,
            backgroundColor: color + '20',
            fill: true,
            tension: 0.1,
            pointRadius: 0
        };
    });

    fuzzyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dataPoints.map(v => v.toFixed(varName==='risk'?2:0)),
            datasets: datasets
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            animation: { duration: 400 },
            plugins: {
                legend: { labels: { color: '#f8fafc' } }
            },
            scales: {
                x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
                y: { min: 0, max: 1.05, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
        }
    });
}
