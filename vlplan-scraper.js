/**
 * THWS Vorlesungsplan URL Scraper
 * Diese Datei enthält Funktionen zum Anzeigen von Vorlesungsplan-Links
 * Die Daten werden von einem Python-Backend geladen
 */

const apiBaseUrl = 'http://localhost:5000'; // Basis-URL für das Python-Backend

// Der aktuelle ausgewählte Link
let selectedVorlesungsplanUrl = null;

// Hauptfunktion zum Laden der Vorlesungsplan-Daten vom Python-Backend
async function initVorlesungsplanScraper() {
    try {
        // Lade-Anzeige einblenden
        document.getElementById('vlplan-loader').style.display = 'flex';
        
        let programsData;
        
        try {
            // Vorlesungspläne vom Python-Backend laden
            const response = await fetch(`${apiBaseUrl}/api/vorlesungsplaene`);
            
            if (!response.ok) {
                throw new Error(`HTTP-Fehler: ${response.status}`);
            }
            
            programsData = await response.json();
            
            if (response.status === 200 && programsData) {
                // Daten erfolgreich geladen
                renderVorlesungsplanLinks(programsData);
            } else {
                throw new Error('Daten konnten nicht geladen werden');
            }
        } catch (error) {
            console.error('Fehler beim Laden der Vorlesungspläne:', error);
            // Fallback zu Demo-Daten bei Fehler
            renderMockVorlesungsplanLinks();
        }
    } catch (error) {
        console.error('Initialisierungsfehler:', error);
        showVlPlanError('Ein Fehler ist aufgetreten: ' + error.message);
    }
}

// Funktion zum Anzeigen von Fehlermeldungen
function showVlPlanError(message) {
    document.getElementById('vlplan-loader').style.display = 'none';
    const errorElement = document.getElementById('vlplan-error');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

// Fallback-Funktion: Rendert Mock-Daten, wenn keine Daten geladen werden können
function renderMockVorlesungsplanLinks() {
    const mockPrograms = [
        {
            name: "Bachelor Betriebswirtschaft (BBW)",
            shortName: "BBW",
            semesters: [
                {
                    name: "1. Semester",
                    links: [
                        {
                            text: "Vorlesungsplan",
                            code: "BBW 1 SS 25",
                            fullUrl: "https://business.thws.de/fileadmin/share/vlplan/BBW%201%20SS%2025.html"
                        }
                    ]
                },
                {
                    name: "2. Semester",
                    links: [
                        {
                            text: "Gr. A",
                            code: "BBW 2A SS 25",
                            fullUrl: "https://business.thws.de/fileadmin/share/vlplan/BBW%202A%20SS%2025.html"
                        },
                        {
                            text: "Gr. B",
                            code: "BBW 2B SS 25",
                            fullUrl: "https://business.thws.de/fileadmin/share/vlplan/BBW%202B%20SS%2025.html"
                        }
                    ]
                }
            ]
        },
        {
            name: "Bachelor Business Analytics (BBA)",
            shortName: "BBA",
            semesters: [
                {
                    name: "2. Semester",
                    links: [
                        {
                            text: "Vorlesungsplan",
                            code: "BBA 2 SS 25",
                            fullUrl: "https://business.thws.de/fileadmin/share/vlplan/BBA%202%20SS%2025.html"
                        }
                    ]
                },
                {
                    name: "6. Semester",
                    links: [
                        {
                            text: "Vorlesungsplan",
                            code: "BBA 6 SS 25",
                            fullUrl: "https://business.thws.de/fileadmin/share/vlplan/BBA%206%20SS%2025.html"
                        }
                    ]
                }
            ]
        }
    ];
    
    document.getElementById('vlplan-loader').style.display = 'none';
    renderVorlesungsplanLinks(mockPrograms);
}

// Funktion zum Anzeigen der extrahierten Links in einer benutzerfreundlichen Oberfläche
function renderVorlesungsplanLinks(programs) {
    const container = document.getElementById('vlplan-programs-container');
    container.innerHTML = '';
    
    if (programs.length === 0) {
        container.innerHTML = '<div class="vlplan-no-data">Keine Vorlesungspläne gefunden.</div>';
        return;
    }
    
    programs.forEach(program => {
        const programDiv = document.createElement('div');
        programDiv.classList.add('vlplan-program-item');
        
        // Programmüberschrift
        const programHeader = document.createElement('div');
        programHeader.classList.add('vlplan-program-header');
        programHeader.innerHTML = `<h3>${program.name}</h3>`;
        programDiv.appendChild(programHeader);
        
        // Container für Semester
        const semestersDiv = document.createElement('div');
        semestersDiv.classList.add('vlplan-semesters-container');
        
        program.semesters.forEach(semester => {
            const semesterDiv = document.createElement('div');
            semesterDiv.classList.add('vlplan-semester-item');
            
            const semesterHeader = document.createElement('div');
            semesterHeader.classList.add('vlplan-semester-header');
            semesterHeader.textContent = semester.name;
            semesterDiv.appendChild(semesterHeader);
            
            const linksDiv = document.createElement('div');
            linksDiv.classList.add('vlplan-links-container');
            
            semester.links.forEach(link => {
                const linkItem = document.createElement('div');
                linkItem.classList.add('vlplan-link-item');
                
                // Anzeigename für den Link erstellen
                const displayName = `${program.shortName} ${link.code.replace(`${program.shortName} `, '')}`;
                
                linkItem.innerHTML = `
                    <div class="vlplan-link-content">
                        <span class="vlplan-link-text">${displayName}</span>
                        <div class="vlplan-link-actions">
                            <button class="vlplan-select-button" data-url="${link.fullUrl}" title="Auswählen">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </button>
                            <button class="vlplan-copy-button" data-url="${link.fullUrl}" title="URL kopieren">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="vlplan-link-details">
                        <span class="vlplan-label-info">${link.text}</span>
                    </div>
                `;
                
                // Event-Listener für Kopier-Button hinzufügen
                const copyButton = linkItem.querySelector('.vlplan-copy-button');
                copyButton.addEventListener('click', function(event) {
                    event.stopPropagation();
                    const url = this.getAttribute('data-url');
                    copyToClipboard(url, this);
                });
                
                // Event-Listener für Auswahl-Button hinzufügen
                const selectButton = linkItem.querySelector('.vlplan-select-button');
                selectButton.addEventListener('click', function(event) {
                    event.stopPropagation();
                    const url = this.getAttribute('data-url');
                    selectVorlesungsplan(url, displayName);
                });
                
                linksDiv.appendChild(linkItem);
            });
            
            semesterDiv.appendChild(linksDiv);
            semestersDiv.appendChild(semesterDiv);
        });
        
        programDiv.appendChild(semestersDiv);
        container.appendChild(programDiv);
    });
    
    // Lade-Animation ausblenden und Inhalte anzeigen
    document.getElementById('vlplan-loader').style.display = 'none';
    container.style.display = 'block';
}

// Funktion zum Kopieren einer URL in die Zwischenablage
function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(
        function() {
            // Kurze visuelle Bestätigung anzeigen
            const originalHTML = button.innerHTML;
            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="green" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            `;
            button.classList.add('copied');
            
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.classList.remove('copied');
            }, 1500);
        },
        function() {
            // Fehlerfall
            alert('Fehler beim Kopieren in die Zwischenablage');
        }
    );
}

// Funktion zur Auswahl eines Vorlesungsplans
function selectVorlesungsplan(url, displayName) {
    selectedVorlesungsplanUrl = url;
    
    // Ausgewählten Plan anzeigen
    const selectedPlanElement = document.getElementById('selected-vlplan');
    selectedPlanElement.innerHTML = `<strong>${displayName}</strong>`;
    selectedPlanElement.setAttribute('title', url);
    
    // Container für ausgewählten Plan anzeigen
    document.getElementById('vlplan-selection-container').style.display = 'block';
    
    // Button zum Zurücksetzen der Auswahl aktivieren
    const resetButton = document.getElementById('reset-vlplan-selection');
    resetButton.style.display = 'inline-block';
    
    // URL in das versteckte Feld eintragen
    document.getElementById('vlplan-url-input').value = url;
    
    // Wenn wir uns im Ausklapp-Modus befinden, das Panel einklappen
    if (document.getElementById('vlplan-config').classList.contains('expanded')) {
        toggleVlPlanSection();
    }
}

// Funktion zum Zurücksetzen der Vorlesungsplan-Auswahl
function resetVorlesungsplanSelection() {
    selectedVorlesungsplanUrl = null;
    
    // Ausgewählten Plan zurücksetzen
    document.getElementById('selected-vlplan').innerHTML = 'Kein Vorlesungsplan ausgewählt';
    document.getElementById('selected-vlplan').removeAttribute('title');
    
    // Reset-Button ausblenden
    document.getElementById('reset-vlplan-selection').style.display = 'none';
    
    // URL aus dem versteckten Feld entfernen
    document.getElementById('vlplan-url-input').value = '';
}

// Suchfunktion für die Vorlesungspläne
function searchVorlesungsplaene() {
    const searchTerm = document.getElementById('vlplan-search-input').value.trim().toLowerCase();
    const programItems = document.querySelectorAll('.vlplan-program-item');
    
    programItems.forEach(program => {
        const programName = program.querySelector('h3').textContent.toLowerCase();
        const hasMatch = programName.includes(searchTerm);
        
        program.style.display = hasMatch || searchTerm === '' ? 'block' : 'none';
    });
}

// Funktion zum Ein-/Ausklappen des Vorlesungsplan-Bereichs
function toggleVlPlanSection() {
    const configSection = document.getElementById('vlplan-config');
    const toggleButton = document.getElementById('vlplan-toggle-button');
    
    if (configSection.classList.contains('expanded')) {
        configSection.classList.remove('expanded');
        configSection.classList.add('collapsed');
        toggleButton.textContent = 'Vorlesungspläne anzeigen';
    } else {
        configSection.classList.remove('collapsed');
        configSection.classList.add('expanded');
        toggleButton.textContent = 'Vorlesungspläne ausblenden';
        
        // Bei erstem Öffnen den Scraper initialisieren
        if (!document.getElementById('vlplan-programs-container').hasChildNodes()) {
            initVorlesungsplanScraper();
        }
    }
}

// Event-Listener für die Suche hinzufügen
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('vlplan-search-input')) {
        document.getElementById('vlplan-search-input').addEventListener('input', searchVorlesungsplaene);
    }
    
    if (document.getElementById('reset-vlplan-selection')) {
        document.getElementById('reset-vlplan-selection').addEventListener('click', resetVorlesungsplanSelection);
    }
    
    if (document.getElementById('vlplan-toggle-button')) {
        document.getElementById('vlplan-toggle-button').addEventListener('click', toggleVlPlanSection);
    }
});
