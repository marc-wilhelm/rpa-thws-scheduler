// Hauptfunktion zum Laden und Analysieren der HTML-Datei
async function initVorlesungsplanScraper() {
    try {
        // Lade-Anzeige einblenden
        document.getElementById('vlplan-loader').style.display = 'flex';
        
        // HTML-Datei direkt von der Quelle laden
        let response;
        try {
            // Versuche zuerst, die lokal gespeicherte Datei zu laden
            response = await fetch('quelle.html')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Lokale Datei nicht gefunden');
                    }
                    return response.text();
                });
        } catch (localError) {
            // Bei Fehler versuche direkt auf die Webseite zuzugreifen
            // (Dies könnte aufgrund von CORS-Einschränkungen fehlschlagen)
            try {
                response = await fetch('https://business.thws.de/studierende/vorlesungs-und-belegungsplaene/')
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Netzwerkantwort war nicht ok');
                        }
                        return response.text();
                    });
            } catch (remoteError) {
                // Wenn beides fehlschlägt, verwenden wir Mock-Daten als Fallback
                console.warn('Konnte weder lokale noch Remote-Daten laden, verwende Fallback-Daten');
                renderMockVorlesungsplanLinks();
                return;
            }
        }
        
        if (!response) {
            showVlPlanError('Die Vorlesungsplan-Daten konnten nicht geladen werden.');
            return;
        }
