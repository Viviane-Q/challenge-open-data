# Présentation

Ce dépôt contient les sources du Challenge Open Data effectué dans le cadre d'un projet de l'ENSIMAG.

Le site est aussi déployé à l'adresse suivante : https://hocuspocuscitrus.github.io/challenge-open-data/

# Lancer le projet

## Prérequis
Avoir installé :
-   Node.js
-   npm

## Installation de dépendances pour minifier le code

```bash
npm install
```

## Minification du code et copie des fichiers de données

```bash
npx html-minifier --input-dir ./src --output-dir ./dist --file-ext html
npx postcss src/*.css --base src --dir dist
npx uglifyjs-folder src -eo dist -x .js
mkdir dist/Data
cp -r Data/*json dist/Data/
mkdir dist/Images
cp -r Images/* dist/Images/
```

## Lancement du serveur web

```bash
npx serve dist
```