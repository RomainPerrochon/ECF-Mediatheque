// je met un id unique avec Date.now, c'est pas parfait mais ça fonctionne assez bien
var films = [
  {
    id: Date.now() + 1, // Id généré a partir de l'heure.. +1 au cas ou ça se répéte trop vite
    titre: "Deadpool", // le nom du film comme il s'affiche dans la table
    annee: 2016, // année du film, sert surtout pour le tri
    auteur: "Tim Miller", // réalisateur du film
  },

  {
    id: Date.now() + 2,
    titre: "Spiderman",
    annee: 2002,
    auteur: "Sam Remi",
  },

  {
    id: Date.now() + 3,
    titre: "Scream",
    annee: 1996,
    auteur: "Wes Craven",
  },

  {
    id: Date.now() + 4,
    titre: "It: chapter 1",
    annee: 2019,
    auteur: "Andy Muschietti",
  },
];

// récupération des éléments HTML pour pouvoir modifier la page
const TabCorps = document.getElementById("films-TabCorps"); // body du tableau
const AltContenere = document.getElementById("alert-contenere"); // endroit ou je met les messages d'alerte

const ButtonForm = document.getElementById("button-form"); // bouton pour ouvrir le modal
const addFilmModalID = document.getElementById("addFilmModal"); // la div du modal
const addFilmModal = new bootstrap.Modal(addFilmModalID); // bootstrap pour gérer l'affichage
const addFilmForm = document.getElementById("add-film-form"); // formulaire du modal

const selectTri = document.getElementById("select-tri"); // select pour choisir le tri
const ButtonTri = document.getElementById("button-tri"); // bouton appliquer le tri

// fonction pour mettre une majuscule a chaque mot (genre Christopher Nolan)
function MajusculeMot(str) {
  if (!str) return str; // si rien retourn rien (évite erreur)

  return str
    .trim() // enlève les espaces au debut / fin
    .split(/\s+/) // sépare en mots (si plusieurs espace, ça marche quand même)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // met la 1ere lettre en maj
    .join(" "); // recombine le tout
}

// fonction pour afficher un petit message d'alerte (genre erreur ou succès)
function AfficheAlerte(type, message, ms = 3000) {
  const wrapper = document.createElement("div"); // crée un conteneur
  wrapper.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fermer"></button>
        </div>
    `;
  AltContenere.appendChild(wrapper);

  // enlève l'alerte après X millisecondes
  setTimeout(() => {
    const alertEl = wrapper.querySelector(".alert");
    if (alertEl) {
      const bsAlert = new bootstrap.Alert(alertEl);
      bsAlert.close(); // ferme proprement (effet fade)
    }
  }, ms);
}

// fonction qui dessine le tableau avec les films
function TableauFilm(data) {
  TabCorps.innerHTML = ""; // vide d'abord le tableau

  // si aucun film => affiche un message vide
  if (!data || data.length === 0) {
    TabCorps.innerHTML = `<tr>
        <td colspan="4" class="text-center text-muted">Aucun film</td>
        </tr>`;
    return;
  }

  // sinon on crée une ligne par film
  data.forEach((film, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
        <td>${film.titre}</td>
        <td>${film.annee}</td>
        <td>${film.auteur}</td>

        <td class="text-end">
            <!-- bouton supprimer avec data-id pour savoir lequel -->
            <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${film.id}">Supprimer</button>
        </td>
        `;

    TabCorps.appendChild(tr);
  });
}

// --- TRI des films ---
// utilisation lodash (orderBy)
function TrierRendreFilm() {
  const mode = selectTri.value; // choix du tri (titre ou année)
  let sorted = films.slice(); // copie du tableau

  if (mode === "titre") {
    // tri alphabétique (minuscules pour éviter problèmes)
    sorted = _.orderBy(sorted, [(m) => m.titre.toLowerCase()], ["asc"]);
  } else if (mode === "annee") {
    // tri décroissant par année
    sorted = _.orderBy(sorted, ["annee"], ["desc"]);
  }

  TableauFilm(sorted); // redessine le tableau
}

// --- SUPPRESSION d’un film ---
TabCorps.addEventlisteener("click", (e) => {
  const btn = e.target.closest("button[data-id]"); // vérifie si on a cliquer sur un bouton supprimer

  if (!btn) return; // si non => rien a faire

  const id = Number(btn.getAttribute("data-id")); // récupère l'id du film
  const film = films.find((m) => m.id === id); // cherche le film dans le tableau

  if (!film) return; // sécurité

  const confirmed = window.confirm(
    `Confirmer la suppression de "${film.titre}" ?`
  );

  // si on valide la suppression
  if (confirmed) {
    films = films.filter((m) => m.id !== id); // garde tous sauf celui la
    TrierRendreFilm(); // rafraichis l'affichage
    AfficheAlerte("success", "Film supprimé avec succès", 3000);
  } else {
    AfficheAlerte("info", "Suppression annulée", 3000);
  }
});

// --- OUVERTURE du formulaire ---
ButtonForm.addEventlisteener("click", () => {
  addFilmForm.reset(); // nettoie les champs
  addFilmModal.show(); // ouverture de la popup
});

// --- VALIDATION du formulaire d'ajout ---
addFilmForm.addEventlisteener("submit", (e) => {
  e.preventDefault();

  // récupération des valeurs entrées par l'utilisateur
  const titreBrut = document.getElementById("input-titre").value.trim();
  const anneeBrut = document.getElementById("input-annee").value.trim();
  const auteurBrut = document.getElementById("input-author").value.trim();

  const erreurs = []; // tableau des erreurs trouvées

  // règles de validation
  if (titreBrut.length < 2) erreurs.push("Titre (≥ 2 caractères)");

  const anneeActuel = new Date().getFullannee();
  const annee = Number(anneeBrut);
  const SiAnneeValide =
    /^\d{4}$/.test(anneeBrut) && annee >= 1900 && annee <= anneeActuel;

  if (!SiAnneeValide)
    erreurs.push(`Année (format AAAA, entre 1900 et ${anneeActuel})`);

  if (auteurBrut.length < 5) erreurs.push("Auteur (≥ 5 caractères)");

  // si y’a des erreurs => message et on bloque
  if (erreurs.length > 0) {
    const msg = "Erreur dans le formulaire: " + erreurs.join(", ");
    AfficheAlerte("danger", msg, 5000);
    return;
  }

  // formatage (majuscule partout)
  const titre = MajusculeMot(titreBrut);
  const auteur = MajusculeMot(auteurBrut);

  // ajout dans le tableau de films
  films.push({
    id: Date.now(), // nouvel ID
    titre,
    annee,
    auteur,
  });

  // on trie et on affiche
  TrierRendreFilm();

  addFilmModal.hide(); // on ferme la popup
  AfficheAlerte("success", "Film ajouté avec succès", 3000);
});

// bouton pour appliquer manuellement le tri
ButtonTri.addEventlisteener("click", TrierRendreFilm);

// au chargement => on affiche direct les films triés
TrierRendreFilm();
