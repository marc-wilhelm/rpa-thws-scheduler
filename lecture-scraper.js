/**
 * THWS Vorlesungsplan Scraper
 * Diese Datei stellt Funktionen zum Extrahieren und Anzeigen von Vorlesungsplan-Links bereit.
 */

let lecturePrograms = [];

// Funktion zum Laden der Vorlesungspläne
async function loadLecturePlans() {
    try {
        document.getElementById('plan-loading').style.display = 'flex';
        document.getElementById('plan-error').style.display = 'none';

        // Fetch-Anfrage an die THWS-Webseite
        const response = await fetch('https://business.thws.de/studierende/vorlesungs-und-belegungsplaene/', {
            method: 'GET',
            headers: {
                'Accept': 'text/html'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP-Fehler: ${response.status}`);
        }

        const htmlContent = await response.text();
        
        // Extrahiere alle Vorlesungsplan-Links aus dem HTML
        lecturePrograms = extractLectureLinks(htmlContent);
        
        // Zeige die extrahierten Links an
        renderProgramLinks(lecturePrograms);
        
        document.getElementById('plan-loading').style.display = 'none';
        document.getElementById('plans-container').style.display = 'block';
        
        return lecturePrograms;
    } catch (error) {
        console.error('Fehler beim Laden der Vorlesungspläne:', error);
        document.getElementById('plan-loading').style.display = 'none';
        document.getElementById('plan-error').style.display = 'block';
        document.getElementById('plan-error').textContent = `Fehler: ${error.message}`;
        return [];
    }
}

// Funktion zum Extrahieren der Vorlesungsplan-Links aus dem HTML-Inhalt
function extractLectureLinks(htmlContent) {
    const programs = [];
    
    // Regex-Muster, um Accordion-Elemente zu finden
    const accordionPattern = /<div class="accordion".*?id="([^"]+)".*?>([\s\S]*?)<\/div><\/section><\/div>/g;
    let accordionMatch;
    
    // Alle Accordion-Elemente durchsuchen
    while ((accordionMatch = accordionPattern.exec(htmlContent)) !== null) {
        const accordionContent = accordionMatch[0];
        
        // Studiengangsname extrahieren
        const titlePattern = /<h2[^>]*>\s*<a[^>]*>(.*?)<\/a>\s*<\/h2>/;
        const titleMatch = titlePattern.exec(accordionContent);
        if (!titleMatch) continue;
        
        const programName = titleMatch[1].trim();
        
        // Alle Tabellen im Accordion-Inhalt finden
        const tablePattern = /<table[^>]*>([\s\S]*?)<\/table>/g;
        let tableMatch;
        
        let semesters = [];
        
        while ((tableMatch = tablePattern.exec(accordionContent)) !== null) {
            const tableContent = tableMatch[0];
            
            // Tabellenzeilen extrahieren
            const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
            let rowMatch;
            
            while ((rowMatch = rowPattern.exec(tableContent)) !== null) {
                const rowContent = rowMatch[0];
                
                // Zellen in der Zeile extrahieren
                const cellPattern = /<td[^>]*>([\s\S]*?)<\/td>/g;
                const cells = [];
                let cellMatch;
                
                while ((cellMatch = cellPattern.exec(rowContent)) !== null) {
                    cells.push(cellMatch[1]);
                }
                
                if (cells.length < 2) continue;
                
                // Semester aus erster Zelle
                let semester = cells[0].replace(/<[^>]*>/g, '').trim();
                
                // Links aus zweiter Zelle
                const linksCell = cells[1];
                const linkPattern = /<a href="([^"]+)"[^>]*>(.*?)<\/a>/g;
                
                let links = [];
                let linkMatch;
                
                while ((linkMatch = linkPattern.exec(linksCell)) !== null) {
                    const url = linkMatch[1];
                    let text = linkMatch[2].replace(/<[^>]*>/g, '').trim();
                    
                    // Nur Links zu Vorlesungsplänen berücksichtigen
                    if (url.includes('/fileadmin/share/vlplan/')) {
                        // Kürzel aus der URL extrahieren
                        const urlMatch = url.match(/vlplan\/(.*?)\.html/);
                        const code = urlMatch ? decodeURIComponent(urlMatch[1]) : '';
                        
                        links.push({
                            text: text,
                            url: url,
                            code: code,
                            fullUrl: url.startsWith('/') ? 'https://business.thws.de' + url : url
                        });
                    }
                }
                
                if (links.length > 0) {
                    semesters.push({
                        name: semester,
                        links: links
                    });
                }
            }
        }
        
        if (semesters.length > 0) {
            programs.push({
                name: programName,
                shortName: extractShortName(programName),
                semesters: semesters
            });
        }
    }
    
    return programs;
}

// Funktion zum Extrahieren der Kurzbezeichnung aus dem Programmnamen
function extractShortName(programName) {
    // Beispiel: "Bachelor Betriebswirtschaft (BBW)" -> "BBW"
    const match = programName.match(/\(([^)]+)\)/);
    return match ? match[1] : '';
}

// Funktion zum Anzeigen der extrahierten Links in einer benutzerfreundlichen Oberfläche
function renderProgramLinks(programs) {
    const container = document.getElementById('plans-list');
    container.innerHTML = '';
    
    if (programs.length === 0) {
        container.innerHTML = '<div class="no-data">Keine Vorlesungspläne gefunden.</div>';
        return;
    }
    
    programs.forEach(program => {
        const programDiv = document.createElement('div');
        programDiv.classList.add('program-item');
        
        // Programmüberschrift
        const programHeader = document.createElement('div');
        programHeader.classList.add('program-header');
        programHeader.innerHTML = `<h3>${program.name}</h3>`;
        programDiv.appendChild(programHeader);
        
        // Container für Semester
        const semestersDiv = document.createElement('div');
        semestersDiv.classList.add('semesters-container');
        
        program.semesters.forEach(semester => {
            const semesterDiv = document.createElement('div');
            semesterDiv.classList.add('semester-item');
            
            const semesterHeader = document.createElement('div');
            semesterHeader.classList.add('semester-header');
            semesterHeader.textContent = semester.name;
            semesterDiv.appendChild(semesterHeader);
            
            const linksDiv = document.createElement('div');
            linksDiv.classList.add('links-container');
            
            semester.links.forEach(link => {
                const linkItem = document.createElement('div');
                linkItem.classList.add('link-item');
                
                // Anzeigename für den Link erstellen
                const displayName = `${program.shortName} ${link.code.replace(`${program.shortName} `, '')}`;
                
                linkItem.innerHTML = `
                    <div class="link-content">
                        <span class="link-text">${displayName}</span>
                        <button class="copy-button" data-url="${link.fullUrl}" title="URL kopieren">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="link-details">
                        <span class="label-info">${link.text}</span>
                        <button class="add-plan-link" data-url="${link.fullUrl}" title="Als Plan hinzufügen">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="16"></line>
                                <line x1="8" y1="12" x2="16" y2="12"></line>
                            </svg>
                        </button>
                    </div>
                `;
                
                // Event-Listener für Kopier-Button hinzufügen
                const copyButton = linkItem.querySelector('.copy-button');
                copyButton.addEventListener('click', function() {
                    const url = this.getAttribute('data-url');
                    copyToClipboard(url, this);
                });
                
                // Event-Listener für "Als Plan hinzufügen"-Button
                const addButton = linkItem.querySelector('.add-plan-link');
                addButton.addEventListener('click', function() {
                    const url = this.getAttribute('data-url');
                    addToPlannedList(url, displayName, link.text);
                });
                
                linksDiv.appendChild(linkItem);
            });
            
            semesterDiv.appendChild(linksDiv);
            semestersDiv.appendChild(semesterDiv);
        });
        
        programDiv.appendChild(semestersDiv);
        container.appendChild(programDiv);
    });
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

// Funktion zum Hinzufügen eines Plans zur strukturierten Eingabe
function addToPlannedList(url, displayName, groupInfo) {
    // Zugriff auf den bestehenden Plan-Container aus deinem ursprünglichen Code
    const plansContainer = document.getElementById('plans-container');
    
    // Wenn wir im strukturierten Eingabe-Modus sind
    if (document.getElementById('structured-input').style.display !== 'none') {
        // Extrahiere das Kürzel aus der URL, z.B. "BBW 2A SS 25"
        const urlMatch = url.match(/vlplan\/(.*?)\.html/);
        if (!urlMatch) return;
        
        const planCode = decodeURIComponent(urlMatch[1]);
        
        // Add Plan-Button anklicken, um ein neues Plan-Element hinzuzufügen
        if (typeof addPlan === 'function') {
            addPlan();
            
            // Das neueste Plan-Element auswählen (es sollte das letzte sein)
            const planItems = document.querySelectorAll('.plan-item');
            const newPlanItem = planItems[planItems.length - 1];
            
            if (newPlanItem) {
                // URL-Feld ausfüllen
                const urlInput = newPlanItem.querySelector('.plan-url');
                if (urlInput) urlInput.value = url;
                
                // Label-Feld ausfüllen
                const labelInput = newPlanItem.querySelector('.plan-label');
                if (labelInput) labelInput.value = displayName;
                
                // Filter-Feld hinzufügen (leer lassen oder nach Bedarf füllen)
                const filterInput = newPlanItem.querySelector('.plan-filter');
                if (filterInput) filterInput.value = "";
                
                // Kurze Animation als Feedback
                newPlanItem.style.backgroundColor = '#e6f7e6';  // leichtes Grün
                setTimeout(() => {
                    newPlanItem.style.backgroundColor = '';
                }, 1000);
            }
        }
    } else {
        // Wenn wir im RAW-JSON-Modus sind, fügen wir den Plan zur JSON-Struktur hinzu
        const jsonInput = document.getElementById('json-input');
        if (jsonInput) {
            let jsonData;
            try {
                jsonData = JSON.parse(jsonInput.value);
                if (!jsonData.plans) jsonData.plans = [];
            } catch (e) {
                // Falls noch kein gültiges JSON vorhanden ist, erstellen wir eine neue Struktur
                jsonData = { plans: [] };
            }
            
            // Neuen Plan hinzufügen
            jsonData.plans.push({
                url: url,
                label: displayName,
                filter: []
            });
            
            // Aktualisiertes JSON in das Textfeld schreiben
            jsonInput.value = JSON.stringify(jsonData, null, 2);
            
            // JSON validieren
            if (typeof validateJsonInput === 'function') {
                validateJsonInput();
            }
        }
    }
}

// Suchfunktion für die Filter-Funktionalität
function searchLecturePlans() {
    const searchTerm = document.getElementById('plan-search-input').value.trim().toLowerCase();
    const programItems = document.querySelectorAll('.program-item');
    
    programItems.forEach(program => {
        const programName = program.querySelector('h3').textContent.toLowerCase();
        const hasMatch = programName.includes(searchTerm);
        
        program.style.display = hasMatch || searchTerm === '' ? 'block' : 'none';
    });
}
