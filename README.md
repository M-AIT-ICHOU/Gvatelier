Atelier — Site & Dashboard

Ce dépôt contient une version de travail du dashboard (front-end statique dans `index.html`, CSS et JS dans `static/`) et une collection de documents administratifs et commerciaux dans le dossier `Entreprise/`.

Aperçu rapide
- Ouvrir localement : ouvrez `index.html` dans un navigateur (développement léger) ou lancez `app_v2.py` pour servir l'application (si vous utilisez le serveur local).
- Installer dépendances Python (si vous utilisez le serveur) :

```powershell
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app_v2.py
```

Contenu important — dossier `Entreprise/`
- `Entreprise/docs/presentation_entreprise.md` : présentation de l'entreprise, mission, services et contact principal.
- `Entreprise/legal/mentions_legales.md` : mentions légales et informations légales à compléter (SIRET, siège, hébergeur...).
- `Entreprise/tarrification/tarifs.md` : grille tarifaire détaillée, frais complémentaires et procédure de mise à jour. Contient aussi la recommandation d'utiliser Git LFS pour gros jeux de données (> 500 MB).
- `Entreprise/contacts/key_contacts.md` : contacts clés pour les rôles internes et facturation.
- `Entreprise/Charte graphique/` : directives graphiques, couleurs et typographie (voir les fichiers `assets.md`, `colors.md`, `typography.md` pour détails).
- `Entreprise/templates/` : modèles (propositions, factures, etc.) à réutiliser pour les livrables.

Comment maintenir la documentation `Entreprise/`
- Les fichiers sont des fichiers Markdown (UTF-8). Pour modifier : éditez le fichier correspondant dans `Entreprise/` et poussez la branche.
- Pour toute modification tarifaire, mettez à jour `Entreprise/tarrification/tarifs.md` et ajoutez une ligne dans la section "Historique des mises à jour" avec la date, l'auteur et le motif.

Notes techniques & bonnes pratiques
- Données volumineuses : si vous ajoutez des jeux de données > 50 MB, utilisez Git LFS ou stockez-les hors dépôt (serveur d'objets, bucket S3, ou dossier partagé). Le fichier `tarifs.md` recommande Git LFS pour les livrables volumineux.
- Prévisualisation : pour vérifier l'affichage des pages et du dashboard, ouvrez `index.html` localement ou servez le projet avec `python app_v2.py`.

Contacts
- Responsable principal du dépôt / contact facturation : Thomas Damore — thomas.damore974@gmail.com

Contribuer
- Ouvrez une branche, apportez vos modifications (respectez le format Markdown pour les documents), puis soumettez une Pull Request avec un résumé des changements.

Atelier — Site & Dashboard

Ce dépôt contient la version de travail du dashboard web et la documentation commerciale/administrative.

Aperçu
------
- Front-end statique : `index.html`, styles et scripts dans `static/`.
- Données et ressources : `static/data/` et `static/lib/`.
- Documents d'entreprise : le dossier `Entreprise/` contient la présentation, mentions légales, tarifs, gabarits et contacts.

Prévisualiser localement
------------------------
Option 1 — ouvrir rapidement (développement simple) :
- Ouvrez `index.html` dans votre navigateur.

Option 2 — servir localement via Python (recommandé si vous utilisez `app_v2.py`)

```powershell
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app_v2.py
```

Bonnes pratiques
----------------
- Données volumineuses (> 50 MB) : utilisez Git LFS ou stockez hors dépôt (S3, bucket, serveur d'artefacts).
- Tarifs et mentions légales : éditez les fichiers dans `Entreprise/tarrification/` et `Entreprise/legal/`, puis ajoutez une entrée dans l'historique du fichier modifié.

Contenu important (`Entreprise/`)
--------------------------------
- `Entreprise/docs/presentation_entreprise.md` — présentation, mission, services.
- `Entreprise/legal/mentions_legales.md` — mentions légales à compléter.
- `Entreprise/tarrification/tarifs.md` — grille tarifaire et procédure de mise à jour.
- `Entreprise/contacts/key_contacts.md` — contacts principaux.
- `Entreprise/Charte graphique/` — chartes couleurs, typographies et usages.
- `Entreprise/templates/` — modèles (propositions, factures, templates de livrables).

Objectif de professionalisation
--------------------------------
- Améliorer la hiérarchie visuelle (header, sidebar compacte, cartes, espacement).
- S'assurer que la carte occupe une zone cohérente pour toutes les vues (Visualisation/Resume/Analytics/A propos).
- Fournir un rendu lisible sur desktop (hauteur et largeur web) et une expérience responsive.

Contribuer
----------
1. Créez une branche nommée `feature/descr`.
2. Effectuez vos modifications (respectez la structure Markdown pour la documentation).
3. Testez localement en ouvrant `index.html` ou en lançant `app_v2.py`.
4. Ouvrez une Pull Request avec un descriptif clair des changements et l'impact visuel.

Contact
-------
- Responsable du dépôt / facturation : Thomas Damore — thomas.damore974@gmail.com

Licence
-------
- Contenus et documents : propriété d'Atelier. Indiquez toute reproduction autorisée explicitement.

README mis à jour pour accompagner la mise en production d'un rendu professionnel du dashboard.
