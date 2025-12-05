// recupere chaque element du html
const altContenere = document.getElementById("alert-contenere"); // mettre les messages d'alerte
const form = document.getElementById("search-form"); // formulaire de recherche
const inputTitre = document.getElementById("search-titre"); // zone pour taper le titre du film
const inputAnnee = document.getElementById("search-annee"); // année du film
const selectionType = document.getElementById("search-type"); // type : filme / series / episode etc
const results = document.getElementById("results"); // zone ou s'affiche les films sous forme de cartes
const pagination = document.getElementById("pagination"); // zone avec les numeros de pages
const bouttonReset = document.getElementById("btn-reset"); // bouton pour remettre la recherche a zero

// la clé API IMDB (ne pas partager)
const CLE_API_IMDB = "4d5ded75";

// pour afficher un message d'alerte (warning, succes)
function AfficheAlerte(type, message, ms = 3000) {
  const wrapper = document.createElement("div"); // bloc qui va contenir l'alerte

  // bootstrap + message
  wrapper.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fermer"></button>
    </div>
  `;

  altContenere.appendChild(wrapper); // affiche l'alerte

  // enleve automatiquement apres X ms
  setTimeout(() => {
    const alertEl = wrapper.querySelector(".alert");
    if (alertEl) {
      const bsAlert = new bootstrap.Alert(alertEl);
      bsAlert.close(); // animation de fermeture
    }
  }, ms);
}

// construit l'URL pour appeler l'API IMDB
function ContAddMail({ titre, annee, type, page }) {
  const url = new URL("https://www.omdbapi.com/"); // URL de base IMDB
  url.searchParams.set("apikey", CLE_API_IMDB); // la clé obligatoire sinon bug
  url.searchParams.set("s", titre); // "s" pour search (recherche rapide par titre)

  if (annee) url.searchParams.set("y", annee); // si année fournie => je l'ajoute
  if (type) url.searchParams.set("type", type); // type de contenu
  if (page) url.searchParams.set("page", page); // pagination

  return url.toString(); // renvoi l'URL complète
}

// asynchrone qui appelle l'API et affiche les résultats
async function ResultatFletch(params) {
  const url = ContAddMail(params); // récupere l'URL construit
  try {
    const res = await fetch(url); // appel API (peut être long limitation a 10000)
    const data = await res.json(); // conversion en json

    // si IMDB renvoie une erreur
    if (data.Response === "False") {
      results.innerHTML = ""; // efface les résultats
      pagination.innerHTML = ""; // efface la pagination
      AfficheAlerte("warning", data.Error || "Aucun résultat trouvé.", 4000);
      return { liste: [], totale: 0 };
    }

    // si on a bien des films
    const liste = Array.isArray(data.Search) ? data.Search : [];
    const totale = Number(data.totaleResults || 0);

    ResultaztRenvoyer(liste); // affichage
    PaginationRenvoyer(totale, params); // pagination auto

    return { liste, totale };
  } catch (err) {
    console.error(err); // debug si souci
    AfficheAlerte("/!\n ALLERT /!\n", "Erreur réseau. Réessayez plus tard.", 5000);
    return { liste: [], totale: 0 };
  }
}

// affiche les cartes des films
function ResultaztRenvoyer(items) {
  results.innerHTML = ""; // efface le précédent affichage

  if (!items || items.length === 0) return; // si pas de film => rien à afficher

  items.forEach((item) => {
    const col = document.createElement("div"); // colonne bootstrap ??
    col.className = "col-12 col-sm-6 col-md-4 col-lg-3";

    // si IMDB n'a pas d'image => mettre image 'fallback'
    const poster =
      item.Poster && item.Poster !== "N/A"
        ? item.Poster
        : "/img/fallback-poster.jpg";

    // carte bootstrap pour le film
    col.innerHTML = `
        <div class="card h-100">
            <img src="${poster}" class="card-img-top" alt="Poster ${
      item.Title
    }">

            <div class="card-body">
                <h3 class="h6 card-titre mb-1">${item.Title}</h3>
                <p class="card-text text-muted mb-0">Année: ${item.Year}</p>
                ${
                  item.Type
                    ? `<span class="badge bg-secondary mt-2">${item.Type}</span>`
                    : ""
                }
            </div>
        </div>
    `;

    results.appendChild(col); // ajoute dans la grille
  });
}

// affiche la pagination
function PaginationRenvoyer(totale, params) {
  pagination.innerHTML = ""; // efface la pagination précédente

  const pages = Math.ceil(totale / 10); // IMDB renvoi max 10 films par page
  if (pages <= 1) return; // si 1 seule page => inutile

  const PageActive = Number(params.page || 1);

  // créer un bouton de page (si besoin)
  const CreationPageObjet = (
    pageNum,
    label = pageNum,
    disabled = false,
    active = false
  ) => {
    const li = document.createElement("li");
    li.className = `page-item ${disabled ? "disabled" : ""} ${
      active ? "active" : ""
    }`;

    const a = document.createElement("a");
    a.className = "page-link";
    a.href = "#";
    a.textContent = label;

    // changement de page
    a.addEventListener("click", (e) => {
      e.preventDefault();
      if (disabled) return;

      RechercheDe({ ...params, page: pageNum }); // réaffiche la page choisie
      window.scrollTo({ top: 0, behavior: "smooth" }); // scroll vers le haut
    });

    li.appendChild(a);
    return li;
  };

  // bouton précédent
  pagination.appendChild(
    CreationPageObjet(PageActive - 1, "«", PageActive <= 1)
  );

  const MaxEnvoyer = 7; // limite le nombre de pages affichées pour faciliter la vitésse
  let start = Math.max(1, PageActive - 3);
  let end = Math.min(pages, start + MaxEnvoyer - 1);

  if (end - start + 1 < MaxEnvoyer) {
    start = Math.max(1, end - MaxEnvoyer + 1);
  }

  // boucle sur les pages affichés
  for (let p = start; p <= end; p++) {
    pagination.appendChild(
      CreationPageObjet(p, String(p), false, p === PageActive)
    );
  }

  // bouton suivant
  pagination.appendChild(
    CreationPageObjet(PageActive + 1, "»", PageActive >= pages)
  );
}

// fonction principale de recherche (quand on soumet le formulaire)
function RechercheDe({ titre, annee, type, page = 1 }) {
  const q = {
    titre: titre ? titre.trim() : "",
    annee: annee ? String(annee).trim() : "",
    type: type ? type.trim() : "",
    page,
  };

  // titre min 2 lettres, sinon IMDB renvoie rien
  if (!q.titre || q.titre.length < 2) {
    AfficheAlerte(
      "warning",
      "Le titre doit contenir au moins 2 caracteres.",
      4000
    );
    return;
  }

  ResultatFletch(q); // lycos lance la recherche
}

// quand valide le formulaire
form.addEventListener("submit", (e) => {
  e.preventDefault(); // empeche le rafraichissement de la page
  RechercheDe({
    titre: inputTitre.value,
    annee: inputAnnee.value,
    type: selectionType.value,
    page: 1, // toujours premiere page au début
  });
});

// bouton reset => efface les résultats
bouttonReset.addEventListener("click", () => {
  form.reset();
  results.innerHTML = "";
  pagination.innerHTML = "";
});
