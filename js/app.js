// je met un id unique avec Date.now, c'est pas parfait mais ça fonctionne assez bien
var movies = [
    {
        id: Date.now() + 1, // Id généré a partir de l'heure.. +1 au cas ou ça se répéte trop vite
        titre: "Deadpool", // le nom du film comme il s'affiche dans la table
        annee: 2016,       // année du film, sert surtout pour le tri
        auteur: "Tim Miller" // réalisateur du film
    },

    {
        id: Date.now() + 2,
        titre: "Spiderman",
        annee: 2002,
        auteur: "Sam Remi"
    },

    {
        id: Date.now() + 3,
        titre: "Scream",
        annee: 1996,
        auteur: "Wes Craven"
    },

    {
        id: Date.now() + 4,
        titre: "It: chapter 1",
        annee: 2019,
        auteur: "Andy Muschietti"
    },
];

// récupération des éléments HTML pour pouvoir modifier la page
const tbody = document.getElementById("movies-tbody"); // body du tableau
const alertContainer = document.getElementById("alert-container"); // endroit ou je met les messages d'alerte

const btnOpenForm = document.getElementById("btn-open-form"); // bouton pour ouvrir le modal
const addMovieModalEl = document.getElementById("addMovieModal"); // la div du modal
const addMovieModal = new bootstrap.Modal(addMovieModalEl); // bootstrap pour gérer l'affichage
const addMovieForm = document.getElementById("add-movie-form"); // formulaire du modal

const selectTri = document.getElementById("select-tri"); // select pour choisir le tri
const btnApplySort = document.getElementById("btn-apply-sort"); // bouton appliquer le tri

// fonction pour mettre une majuscule a chaque mot (genre Christopher Nolan)
function capitalizeWords(str)
{
    if (!str) return str; // si rien retourn rien (évite erreur)

    return str
        .trim()     // enlève les espaces au debut / fin
        .split(/\s+/) // sépare en mots (si plusieurs espace, ça marche quand même)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // met la 1ere lettre en maj
        .join(" "); // recombine le tout
}

// fonction pour afficher un petit message d'alerte (genre erreur ou succès)
function showAlert(type, message, ms = 3000)
{
    const wrapper = document.createElement("div"); // crée un conteneur
    wrapper.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fermer"></button>
        </div>
    `;
    alertContainer.appendChild(wrapper);

    // enlève l'alerte après X millisecondes
    setTimeout(() =>
    {
        const alertEl = wrapper.querySelector(".alert");
        if (alertEl)
        {
            const bsAlert = new bootstrap.Alert(alertEl);
            bsAlert.close(); // ferme proprement (effet fade)
        }
    }, ms);
}

// fonction qui dessine le tableau avec les films
function renderTable(data)
{
    tbody.innerHTML = ""; // vide d'abord le tableau

    // si aucun film => affiche un message vide
    if (!data || data.length === 0)
    {
        tbody.innerHTML = `<tr>
        <td colspan="4" class="text-center text-muted">Aucun film</td>
        </tr>`;
        return;
    }

    // sinon on crée une ligne par film
    data.forEach((movie, index) =>
    {
        const tr = document.createElement("tr");

        tr.innerHTML = `
        <td>${movie.titre}</td>
        <td>${movie.annee}</td>
        <td>${movie.auteur}</td>

        <td class="text-end">
            <!-- bouton supprimer avec data-id pour savoir lequel -->
            <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${movie.id}">Supprimer</button>
        </td>
        `;

        tbody.appendChild(tr);
    });
}

// --- TRI des films ---
// utilisation lodash (orderBy)
function sortMoviesAndRender()
{
    const mode = selectTri.value; // choix du tri (titre ou année)
    let sorted = movies.slice(); // copie du tableau

    if (mode === "titre")
    {
        // tri alphabétique (minuscules pour éviter problèmes)
        sorted = _.orderBy(sorted, [m => m.titre.toLowerCase()], ["asc"]);
    }
    else if (mode === "annee")
    {
        // tri décroissant par année
        sorted = _.orderBy(sorted, ["annee"], ["desc"]);
    }

    renderTable(sorted); // redessine le tableau
}

// --- SUPPRESSION d’un film ---
tbody.addEventListener("click", (e) =>
{
    const btn = e.target.closest("button[data-id]"); // vérifie si on a cliquer sur un bouton supprimer

    if (!btn) return; // si non => rien a faire

    const id = Number(btn.getAttribute("data-id")); // récupère l'id du film
    const movie = movies.find(m => m.id === id); // cherche le film dans le tableau

    if (!movie) return; // sécurité

    const confirmed = window.confirm(`Confirmer la suppression de "${movie.titre}" ?`);

    // si on valide la suppression
    if (confirmed)
    {
        movies = movies.filter(m => m.id !== id); // garde tous sauf celui la
        sortMoviesAndRender(); // rafraichis l'affichage
        showAlert("success", "Film supprimé avec succès", 3000);
    }
    else
    {
        showAlert("info", "Suppression annulée", 3000);
    }
});

// --- OUVERTURE du formulaire ---
btnOpenForm.addEventListener("click", () =>
{
    addMovieForm.reset(); // nettoie les champs
    addMovieModal.show(); // ouverture de la popup
});

// --- VALIDATION du formulaire d'ajout ---
addMovieForm.addEventListener("submit", (e) =>
{
    e.preventDefault();

    // récupération des valeurs entrées par l'utilisateur
    const titreRaw = document.getElementById("input-title").value.trim();
    const anneeRaw = document.getElementById("input-year").value.trim();
    const auteurRaw = document.getElementById("input-author").value.trim();

    const errors = []; // tableau des erreurs trouvées

    // règles de validation
    if (titreRaw.length < 2) errors.push("Titre (≥ 2 caractères)");

    const currentYear = new Date().getFullYear();
    const annee = Number(anneeRaw);
    const isYearValid = /^\d{4}$/.test(anneeRaw) && annee >= 1900 && annee <= currentYear;

    if (!isYearValid)
        errors.push(`Année (format AAAA, entre 1900 et ${currentYear})`);

    if (auteurRaw.length < 5)
        errors.push("Auteur (≥ 5 caractères)");

    // si y’a des erreurs => message et on bloque
    if (errors.length > 0)
    {
        const msg = "Erreur dans le formulaire: " + errors.join(", ");
        showAlert("danger", msg, 5000);
        return;
    }

    // formatage (majuscule partout)
    const titre = capitalizeWords(titreRaw);
    const auteur = capitalizeWords(auteurRaw);

    // ajout dans le tableau de films
    movies.push(
    {
        id: Date.now(), // nouvel ID
        titre,
        annee,
        auteur
    });

    // on trie et on affiche
    sortMoviesAndRender();

    addMovieModal.hide(); // on ferme la popup
    showAlert("success", "Film ajouté avec succès", 3000);
});

// bouton pour appliquer manuellement le tri
btnApplySort.addEventListener("click", sortMoviesAndRender);

// au chargement => on affiche direct les films triés
sortMoviesAndRender();
