const webhookUrl = 'https://hook.eu2.make.com/fttyrd5bv8ah1q6xyrvvu5eg88kq1b13';
let selectedAction = null;
let currentTab = 'structured';
let planCounter = 1;

function selectOption(action) {
    selectedAction = action;

    document.querySelectorAll('.option-card').forEach(card => {
        card.classList.remove('selected');
    });

    document.querySelector(`.option-card:nth-child(${action === 'scrape' ? 1 : 2})`).classList.add('selected');

    // Konfigurationsbereich anzeigen/ausblenden
    const configSection = document.getElementById('scrape-config');
    if (action === 'scrape') {
        configSection.style.display = 'block';
    } else {
        configSection.style.display = 'none';
    }

    document.getElementById('execute').disabled = false;
}

function switchTab(tab) {
    currentTab = tab;
    
    // Tab-Buttons aktualisieren
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    document.querySelector(`.tab-button:nth-child(${tab === 'structured' ? 1 : 2})`).classList.add('active');
    
    // Panels anzeigen/ausblenden
    document.getElementById('structured-input').style.display = tab === 'structured' ? 'block' : 'none';
    document.getElementById('raw-input').style.display = tab === 'raw' ? 'block' : 'none';
}

function addPlan() {
    const plansContainer = document.getElementById('plans-container');
    const planItem = document.createElement('div');
    planItem.className = 'plan-item';
    planItem.id = `plan-${planCounter}`;

    planItem.innerHTML = `
        <div class="input-group">
            <label for="plan-url-${planCounter}">URL:</label>
            <input type="text" id="plan-url-${planCounter}" class="plan-url" placeholder="z.B. https://business.thws.de/fileadmin/share/vlplan/BBA%206%20SS%2025.html">
        </div>
        <div class="input-group">
            <label for="plan-label-${planCounter}">Label:</label>
            <input type="text" id="plan-label-${planCounter}" class="plan-label" placeholder="z.B. BBA 6">
        </div>
        <div class="input-group">
            <label for="plan-filter-${planCounter}">Filter (durch Komma getrennt):</label>
            <input type="text" id="plan-filter-${planCounter}" class="plan-filter" placeholder="z.B. PBA1, SPBA">
        </div>
        <button class="remove-plan" onclick="removePlan(${planCounter})">Entfernen</button>
    `;

    plansContainer.appendChild(planItem);
    
    // "Entfernen"-Button für den ersten Plan anzeigen, wenn mehr als ein Plan vorhanden ist
    if (plansContainer.children.length > 1) {
        document.querySelector('.plan-item:first-child .remove-plan').style.display = 'block';
    }
    
    planCounter++;
}

function removePlan(id) {
    const planItem = document.getElementById(`plan-${id}`);
    if (planItem) {
        planItem.remove();
    }
    
    const plansContainer = document.getElementById('plans-container');
    // "Entfernen"-Button für den ersten Plan ausblenden, wenn nur noch ein Plan vorhanden ist
    if (plansContainer.children.length === 1) {
        document.querySelector('.plan-item:first-child .remove-plan').style.display = 'none';
    }
}

function validateJsonInput() {
    const jsonInput = document.getElementById('json-input').value;
    const jsonValidation = document.getElementById('json-validation');
    
    if (!jsonInput.trim()) {
        jsonValidation.innerHTML = '';
        return false;
    }
    
    try {
        const parsedJson = JSON.parse(jsonInput);
        if (!parsedJson.plans || !Array.isArray(parsedJson.plans)) {
            jsonValidation.innerHTML = '<div class="json-error">Fehler: Das JSON muss ein "plans"-Array enthalten.</div>';
            jsonValidation.querySelector('.json-error').style.display = 'block';
            return false;
        }
        
        for (const plan of parsedJson.plans) {
            if (!plan.url || !plan.label || !plan.filter) {
                jsonValidation.innerHTML = '<div class="json-error">Fehler: Jeder Plan muss "url", "label" und "filter" enthalten.</div>';
                jsonValidation.querySelector('.json-error').style.display = 'block';
                return false;
            }
        }
        
        jsonValidation.innerHTML = '';
        return parsedJson;
    } catch (error) {
        jsonValidation.innerHTML = `<div class="json-error">JSON-Fehler: ${error.message}</div>`;
        jsonValidation.querySelector('.json-error').style.display = 'block';
        return false;
    }
}

function getStructuredData() {
    const plansContainer = document.getElementById('plans-container');
    const planItems = plansContainer.querySelectorAll('.plan-item');
    
    const plans = [];
    
    for (const planItem of planItems) {
        const url = planItem.querySelector('.plan-url').value;
        const label = planItem.querySelector('.plan-label').value;
        const filterString = planItem.querySelector('.plan-filter').value;
        
        if (!url || !label) {
            return false;
        }
        
        const filter = filterString.split(',').map(item => item.trim()).filter(item => item);
        
        plans.push({
            url,
            label,
            filter
        });
    }
    
    if (plans.length === 0) {
        return false;
    }
    
    return { plans };
}

async function executeAction() {
    if (!selectedAction) return;

    const statusElement = document.getElementById('status');
    statusElement.style.display = 'block';
    statusElement.className = 'status loading';
    statusElement.innerHTML = '<div>Führe Aktion aus...</div>';

    document.getElementById('execute').disabled = true;

    try {
        let requestData = null;
        
        if (selectedAction === 'scrape') {
            if (currentTab === 'raw') {
                requestData = validateJsonInput();
                if (!requestData) {
                    throw new Error('Ungültige JSON-Eingabe');
                }
            } else {
                requestData = getStructuredData();
                if (!requestData) {
                    throw new Error('Bitte fülle alle erforderlichen Felder aus');
                }
            }
        }
        
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: selectedAction,
                requestData: requestData
            })
        };
        
        const response = await fetch(webhookUrl, requestOptions);

        if (response.ok) {
            try {
                const responseData = await response.json();
                statusElement.className = 'status success';
                let statusHTML = `<div>${responseData.message || ''}</div>`;

                if (responseData.timestamp) {
                    const timestamp = new Date(responseData.timestamp * 1000).toLocaleString('de-DE');
                    statusHTML += `<div class="response-details">Zeitstempel: ${timestamp}</div>`;
                }

                statusElement.innerHTML = statusHTML;
            } catch (jsonError) {
                // Wenn die Antwort nicht als JSON geparst werden kann, zeigen wir den Rohtext an
                const responseText = await response.text();
                statusElement.className = 'status success';
                statusElement.innerHTML = `<div>${responseText}</div>`;
            }
        } else {
            // Bei HTTP-Fehlern versuchen wir den Fehlertext auszulesen
            const errorText = await response.text();
            throw new Error(`HTTP-Fehler: ${response.status} - ${errorText}`);
        }
    } catch (error) {
        statusElement.className = 'status error';
        statusElement.innerHTML = `<div>Fehler: ${error.message}</div>`;
    }

    document.getElementById('execute').disabled = false;
}

// Event-Listener für JSON-Validierung
document.addEventListener('DOMContentLoaded', function() {
    const jsonInput = document.getElementById('json-input');
    jsonInput.addEventListener('input', function() {
        validateJsonInput();
    });
});
