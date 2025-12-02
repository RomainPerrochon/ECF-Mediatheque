// recupere chaque element du HTML dont j'ai besoin pour bosser
const alertContainer = document.getElementById("alert-container"); // là ou on met les messages d'alerte
const form = document.getElementById("search-form"); // le formulaire de recherche
const inputTitre = document.getElementById("search-titre");  // zone pour taper le titre du film
const inputAnnee = document.getElementById("search-annee"); // année du film (optionel)
const selectType = document.getElementById("search-type"); // type : movie / series / episode etc
const results = document.getElementById("results"); // zone ou s'affiche les films sous forme de cartes
const pagination = document.getElementById("pagination"); // zone avec les numeros de pages
const btnReset = document.getElementById("btn-reset"); // bouton pour remettre la recherche a zero

// la clé API OMDB (à ne pas partager publiquement en vrai !)
const OMDB_API_KEY = "4d5ded75";

// petite fonction pour afficher un message d'alerte (genre erreur, warning, succes, etc)
function showAlert(type, message, ms = 3000)
{
    const wrapper = document.createElement("div"); // crée un bloc qui va contenir l'alerte

    // composant bootstrap + message
    wrapper.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fermer"></button>
    </div>
  `;

    alertContainer.appendChild(wrapper); // affiche l'alerte

    // enleve automatiquement après X millisecondes
    setTimeout(() =>
    {
        const alertEl = wrapper.querySelector(".alert");
        if (alertEl)
        {
            const bsAlert = new bootstrap.Alert(alertEl);
            bsAlert.close(); // anim de fermeture
        }
    }, ms);
}

// fonction qui construit l'URL pour appeler l'API OMDB
function buildQuery({ title, year, type, page })
{
    const url = new URL("https://www.omdbapi.com/"); // URL de base OMDB
    url.searchParams.set("apikey", OMDB_API_KEY); // la clé obligatoire
    url.searchParams.set("s", title); // "s" pour search (recherche rapide par titre)

    if (year) url.searchParams.set("y", year); // si année fournie, je l'ajoute
    if (type) url.searchParams.set("type", type); // type de contenu
    if (page) url.searchParams.set("page", page); // pagination

    return url.toString(); // je renvoi l'URL complète
}

// fonction asyncrone qui appelle l'API et affiche les résultats
async function fetchResults(params)
{
    const url = buildQuery(params); // je récupère l'URL construite
    try
    {
        const res = await fetch(url); // appel API (peut être long)
        const data = await res.json(); // conversion en JSON

        // si OMDB renvoie une erreur
        if (data.Response === "False")
        {
            results.innerHTML = ""; // efface les résultats
            pagination.innerHTML = ""; // efface la pagination
            showAlert("warning", data.Error || "Aucun résultat trouvé.", 4000);
            return { list: [], total: 0 };
        }

        // si on a bien des films
        const list = Array.isArray(data.Search) ? data.Search : [];
        const total = Number(data.totalResults || 0);

        renderResults(list); // affichage
        renderPagination(total, params); // pagination auto

        return { list, total };
    }
    catch (err)
    {
        console.error(err); // juste pour debug si souci
        showAlert("danger", "Erreur réseau. Réessayez plus tard.", 5000);
        return { list: [], total: 0 };
    }
}

// fonction qui affiche les cartes des films
function renderResults(items)
{
    results.innerHTML = ""; // efface le précédent affichage

    if (!items || items.length === 0) return; // si pas de film => rien à afficher

    items.forEach((item) =>
    {
        const col = document.createElement("div"); // colonne bootstrap
        col.className = "col-12 col-sm-6 col-md-4 col-lg-3";

        // si OMDB n'a pas d'image, mettre image 'fallback'
        const poster =
            item.Poster && item.Poster !== "N/A"
                ? item.Poster
                : "/img/fallback-poster.jpg";

        // carte bootstrap pour le film
        col.innerHTML = `
        <div class="card h-100">
            <img src="${poster}" class="card-img-top" alt="Poster ${item.Title}">

            <div class="card-body">
                <h3 class="h6 card-title mb-1">${item.Title}</h3>
                <p class="card-text text-muted mb-0">Année: ${item.Year}</p>
                ${item.Type ? `<span class="badge bg-secondary mt-2">${item.Type}</span>` : ""}
            </div>
        </div>
    `;

        results.appendChild(col); // ajoute dans la grille
    });
}

// fonction qui affiche la pagination
function renderPagination(total, params)
{
    pagination.innerHTML = ""; // efface la pagination précédente

    const pages = Math.ceil(total / 10); // OMDB renvoi 10 films par page
    if (pages <= 1) return; // si 1 seule page => inutile

    const currentPage = Number(params.page || 1);

    // petite fonction pour créer un bouton de page
    const createPageItem = (pageNum, label = pageNum, disabled = false, active = false) =>
    {
        const li = document.createElement("li");
        li.className = `page-item ${disabled ? "disabled" : ""} ${active ? "active" : ""}`;

        const a = document.createElement("a");
        a.className = "page-link";
        a.href = "#";
        a.textContent = label;

        // changement de page
        a.addEventListener("click", (e) =>
        {
            e.preventDefault();
            if (disabled) return;

            doSearch({ ...params, page: pageNum }); // réaffiche la page choisie
            window.scrollTo({ top: 0, behavior: "smooth" }); // scroll vers le haut
        });

        li.appendChild(a);
        return li;
    };

    // bouton précédent
    pagination.appendChild(
        createPageItem(currentPage - 1, "«", currentPage <= 1)
    );

    const maxToShow = 7; // limite le nombre de pages affichées
    let start = Math.max(1, currentPage - 3);
    let end = Math.min(pages, start + maxToShow - 1);

    if (end - start + 1 < maxToShow)
    {
        start = Math.max(1, end - maxToShow + 1);
    }

    // boucle sur les pages affichées
    for (let p = start; p <= end; p++)
    {
        pagination.appendChild(createPageItem(p, String(p), false, p === currentPage));
    }

    // bouton suivant
    pagination.appendChild(
        createPageItem(currentPage + 1, "»", currentPage >= pages)
    );
}

// fonction principale de recherche (appelée quand on soumet le formulaire)
function doSearch({ title, year, type, page = 1 })
{
    const q = {
        title: title ? title.trim() : "",
        year: year ? String(year).trim() : "",
        type: type ? type.trim() : "",
        page,
    };

    // titre min 2 lettres, sinon OMDB répond rien
    if (!q.title || q.title.length < 2)
    {
        showAlert("warning", "Le titre doit contenir au moins 2 caractères.", 4000);
        return;
    }

    fetchResults(q); // lance la recherche
}

// -- ÉVÉNEMENTS --

// quand valide le formulaire
form.addEventListener("submit", (e) =>
{
    e.preventDefault(); // empêche le rafraîchissement de la page
    doSearch({
        title: inputTitre.value,
        year: inputYear.value,
        type: selectType.value,
        page: 1, // toujours premiere page au début
    });
});

// bouton reset => efface les résultats
btnReset.addEventListener("click", () =>
{
    form.reset();
    results.innerHTML = "";
    pagination.innerHTML = "";
});
