from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import re
import urllib.parse

app = Flask(__name__)
CORS(app)  # Erlaubt Cross-Origin-Anfragen

@app.route('/api/vorlesungsplaene', methods=['GET'])
def get_vorlesungsplaene():
    """
    Extrahiert alle Vorlesungsplan-Links von der THWS-Webseite
    und gibt sie als strukturierte JSON-Daten zurück
    """
    try:
        # THWS-Webseite laden
        response = requests.get('https://business.thws.de/studierende/vorlesungs-und-belegungsplaene/')
        
        if not response.ok:
            return jsonify({'error': 'Webseite konnte nicht geladen werden'}), 500
        
        # HTML-Inhalt der Webseite mit BeautifulSoup parsen
        soup = BeautifulSoup(response.text, 'html.parser')
        
        programs = []
        
        # Alle Accordion-Elemente finden (die Studiengänge enthalten)
        accordions = soup.select('div.accordion')
        
        for accordion in accordions:
            # Name des Studiengangs extrahieren
            heading = accordion.select_one('h2 a')
            if not heading:
                continue
                
            program_name = heading.text.strip()
            
            # Kurzbezeichnung extrahieren (z.B. "BBW" aus "Bachelor Betriebswirtschaft (BBW)")
            short_name_match = re.search(r'\(([^)]+)\)', program_name)
            short_name = short_name_match.group(1) if short_name_match else ''
            
            semesters = []
            
            # Alle Tabellen im Accordion finden
            tables = accordion.select('table')
            
            for table in tables:
                # Durch alle Zeilen der Tabelle iterieren
                rows = table.select('tbody tr')
                
                for row in rows:
                    cells = row.select('td')
                    if len(cells) < 2:
                        continue
                    
                    # Semester aus erster Zelle extrahieren
                    semester = cells[0].text.strip()
                    
                    # Links aus zweiter Zelle extrahieren
                    links_cell = cells[1]
                    links = []
                    
                    for link in links_cell.select('a'):
                        href = link.get('href')
                        text = link.text.strip()
                        
                        # Nur Links zu Vorlesungsplänen berücksichtigen
                        if href and '/fileadmin/share/vlplan/' in href:
                            # Kürzel aus der URL extrahieren
                            code_match = re.search(r'vlplan/(.*?)\.html', href)
                            code = urllib.parse.unquote(code_match.group(1)) if code_match else ''
                            
                            # Vollständige URL erstellen
                            full_url = f"https://business.thws.de{href}" if href.startswith('/') else href
                            
                            links.append({
                                'text': text,
                                'url': href,
                                'code': code,
                                'fullUrl': full_url
                            })
                    
                    if links:
                        semesters.append({
                            'name': semester,
                            'links': links
                        })
            
            if semesters:
                programs.append({
                    'name': program_name,
                    'shortName': short_name,
                    'semesters': semesters
                })
        
        return jsonify(programs)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
