Projet : ECF Mediatheque 
Gestion de Videotheque + Recherche de Films via IMDB

Ce projet est deux page web permettant :

- d’ajouter, trier et supprimer des films dans une vidéothèque locale
- Rechercher des films via l’API IMDB
- D’afficher les résultats sous forme de cartes Bootstrap.

Il utilise HTML, CSS, JavaScript, Bootstrap et la librairie Lodash pour améliorer le tri.

Structure du projet:
/css
  normalize.css
  style.css
  
/html
  IMDB.html
  index.html
  
/img
  billet.png
  clap.png
  fallback-poster.jpg
  pellicule-left.png
  pellicule-right.png
  popcorn.png
  projecteur.png

/js
  app.js
  IMDB.js

README.md



HTML5 :
Structure des pages index.html (videotheque) et IMDB.html (recherche).

CSS3:
Styles des pages.

JavaScript:
Utilise DOM, formulaires, gestion des films.

Bootstrap:

Pour les modals, les boutons, les alerts, la pagination, la barre de navigation,

Lodash: (bibloitheque)
Utilisé pour le tri de la liste des films en local.
La librairie permet de :

- faire du tri
- manipuler des tableaux
- cloner, assembler et grouper les elements
- des fonctions pour chaînes de caractères
