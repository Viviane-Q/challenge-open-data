# Présentation

Ce dépôt contient les sources du Challenge Open Data effectué dans le cadre d'un projet de l'ENSIMAG.

Le site est aussi déployé à l'adresse suivante : https://hocuspocuscitrus.github.io/challenge-open-data/

# Organisation du dépôt
```bash
.
├── Extractor.py # Script python pour extraire les données
├── package.json
├── package-lock.json
├── postcss.config.js
├── README.md
└── src # Sources du site
    ├── Data # Données brutes (csv) et extraites (json)
    │   └── ...
    ├── Images
    │   └── ...
    ├── curve.js # Courbe de consommation
    ├── index.html # Page d'accueil
    ├── map.js # Carte
    ├── mix.js # Mix énergétique
    ├── picoCustom.css
    ├── pie_chart.js # Diagramme en camembert
    ├── rapport.html # Rapport du projet
    └── style.css
```

# Lancer le projet en mode développement

## Prérequis 
- Python

## Lancement du serveur
```bash
python3 -m http.server
```
Le site sera accessible sur http://localhost:8000/src.
