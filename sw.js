// Service worker : un petit programme que le téléphone garde en arrière-plan pour faire marcher l'application sans connexion.

const NOM_CACHE = 'budget-neon-v1';
// Nom de la boîte de stockage des fichiers ; changer ce numéro de version force la mise à jour chez l'utilisateur.

const FICHIERS = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
// Liste des fichiers à mémoriser dès l'installation pour pouvoir ouvrir l'application hors ligne.

self.addEventListener('install', function (evenement) {
// Définit ce qui se passe à l'installation du service worker (la toute première fois, ou après une nouvelle version).
  evenement.waitUntil(
  // Demande au navigateur d'attendre la fin de cette opération avant de considérer l'installation terminée.
    caches.open(NOM_CACHE).then(function (cache) {
    // Ouvre (ou crée) la boîte de stockage portant notre nom.
      return cache.addAll(FICHIERS);
      // Télécharge tous les fichiers de la liste et les range dans la boîte.
    })
    // Fin de l'ouverture du cache.
  );
  // Fin de l'attente.
  self.skipWaiting();
  // Active tout de suite cette version, sans attendre la fermeture des anciennes pages.
});
// Fin du gestionnaire d'installation.

self.addEventListener('activate', function (evenement) {
// Définit ce qui se passe quand ce service worker prend le relais.
  evenement.waitUntil(
  // Demande au navigateur d'attendre la fin du nettoyage.
    caches.keys().then(function (noms) {
    // Récupère les noms de toutes les boîtes de stockage existantes.
      return Promise.all(
      // Attend que toutes les suppressions ci-dessous soient terminées.
        noms
        // Part de la liste des noms de boîtes.
          .filter(function (nom) { return nom !== NOM_CACHE; })
          // Garde uniquement les anciennes boîtes, c'est-à-dire celles dont le nom est différent du nôtre.
          .map(function (nom) { return caches.delete(nom); })
          // Supprime chacune de ces anciennes boîtes.
      );
      // Fin de l'attente des suppressions.
    })
    // Fin du traitement de la liste des noms.
  );
  // Fin de l'attente du nettoyage.
  self.clients.claim();
  // Prend le contrôle des pages déjà ouvertes sans devoir les recharger.
});
// Fin du gestionnaire d'activation.

self.addEventListener('fetch', function (evenement) {
// Définit ce qui se passe à chaque fois que la page demande un fichier (page, image, police...).
  if (evenement.request.method !== 'GET') return;
  // Ignore les demandes qui ne sont pas de simples lectures : on ne s'en occupe pas.
  evenement.respondWith(
  // Fournit nous-mêmes la réponse à cette demande.
    caches.match(evenement.request).then(function (enCache) {
    // Cherche d'abord le fichier demandé dans nos boîtes de stockage.
      if (enCache) return enCache;
      // S'il est déjà mémorisé, le renvoie immédiatement, même sans connexion.
      return fetch(evenement.request).then(function (reponse) {
      // Sinon, le télécharge depuis Internet.
        const copie = reponse.clone();
        // Fait une copie de la réponse, car une réponse ne peut être lue qu'une seule fois.
        caches.open(NOM_CACHE).then(function (cache) { cache.put(evenement.request, copie); });
        // Range la copie dans la boîte de stockage pour la prochaine fois (par exemple les polices Google).
        return reponse;
        // Renvoie la réponse d'origine à la page.
      });
      // Fin du téléchargement.
    })
    // Fin de la recherche dans le cache.
  );
  // Fin de la réponse fournie.
});
// Fin du gestionnaire de demandes de fichiers.
