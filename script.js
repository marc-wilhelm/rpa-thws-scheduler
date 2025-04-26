const webhookUrl = 'https://hook.eu2.make.com/fttyrd5bv8ah1q6xyrvvu5eg88kq1b13';
let selectedAction = null;

function selectOption(action) {
    selectedAction = action;

    document.querySelectorAll('.option-card').forEach(card => {
        card.classList.remove('selected');
    });

    document.querySelector(`.option-card:nth-child(${action === 'scrape' ? 1 : 2})`).classList.add('selected');

    document.getElementById('execute').disabled = false;
}

async function executeAction() {
    if (!selectedAction) return;

    const statusElement = document.getElementById('status');
    statusElement.style.display = 'block';
    statusElement.className = 'status loading';
    statusElement.innerHTML = '<div>Führe Aktion aus...</div>';

    document.getElementById('execute').disabled = true;

    try {
        const response = await fetch(`${webhookUrl}?action=${selectedAction}`);

        if (response.ok) {
            try {
                const responseData = await response.json();
                statusElement.className = 'status success';
                let statusHTML = `<div>${responseData.message || 'Aktion erfolgreich ausgeführt!'}</div>`;

                if (responseData.timestamp) {
                    const timestamp = new Date(responseData.timestamp * 1000).toLocaleString('de-DE');
                    statusHTML += `<div class="response-details">Zeitstempel: ${timestamp}</div>`;
                }

                statusElement.innerHTML = statusHTML;
            } catch (jsonError) {
                statusElement.className = 'status success';
                statusElement.innerHTML = `<div>Aktion erfolgreich abgeschlossen!</div>`;
            }
        } else {
            throw new Error(`HTTP-Fehler: ${response.status}`);
        }
    } catch (error) {
        statusElement.className = 'status error';
        statusElement.innerHTML = `<div>Fehler: ${error.message}</div>`;
    }

    document.getElementById('execute').disabled = false;
}
