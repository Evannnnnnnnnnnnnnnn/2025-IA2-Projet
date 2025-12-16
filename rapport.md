# Rapport d'analyse du projet Solveur Wordle

Ce rapport détaille la structure du projet, l'emplacement des listes de mots et la signification des métriques de performance.

## Emplacement des listes de mots

Le projet utilise deux fichiers texte distincts pour gérer les mots :

1.  **Mots possibles comme réponse (`possible_words.txt`)** :
    *   **Chemin** : `3b1b-wordle-solver/data/wordle/possible_words.txt`
    *   **Description** : Ce fichier contient la liste restreinte de 2 316 mots qui peuvent être la solution secrète du jeu Wordle.

2.  **Mots autorisés pour les essais (`allowed_words.txt`)** :
    *   **Chemin** : `3b1b-wordle-solver/data/wordle/allowed_words.txt`
    *   **Description** : Ce fichier contient une liste beaucoup plus large de 12 973 mots qui sont considérés comme des essais valides, même s'ils ne peuvent pas être la réponse finale.

## Signification des métriques

Les métriques sont générées par le script `3b1b-wordle-solver/simulations.py`. Voici ce qu'elles représentent :

*   **Score** : Le nombre de tentatives nécessaires pour trouver le mot.
*   **Answer** : Le mot secret pour une partie donnée.
*   **Guesses** : La liste des mots que le solveur a essayés.
*   **Reductions** : Une liste indiquant le nombre de mots possibles restants après chaque tentative. Cela montre l'efficacité de chaque essai pour réduire l'ensemble des solutions possibles.
*   **Distribution** : Un histogramme montrant combien de parties ont été gagnées en 1, 2, 3... tentatives.
*   **Total guesses** : Le nombre total de tentatives sur l'ensemble des simulations.
*   **Average** : La moyenne du nombre de tentatives nécessaires pour résoudre le puzzle sur toutes les parties simulées.
