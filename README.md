# Sudoku Solver Discord Bot
## Installation
Pour installer le bot, il faut :

- Créer un fichier auth.json à la racine avec le token de votre bot
- Lancer `npm install`

## Utilisation
Le bot peut ensuite être lancé, il répond aux commandes :

> $sudoku : affiche l'aide

> $sudoku draw <lignes sans espaces séparées par |> : dessine la grille demandée

> $sudoku solve <lignes sans espaces séparées par |> : résout la grille demandée

> $sudoku check <lignes sans espaces séparées par |> : vérifie si la grille est valide

> $sudoku generate <difficulté de 1 à 5> : génère une grille à résoudre

## Exemples
> $sudoku draw 530070000|600195000|098000060|800060003|400803001|700020006|060000280|000419000|000080079
![alt text](https://image.ibb.co/fHsF0T/grille_vierge_test.png)

> $sudoku solve 530070000|600195000|098000060|800060003|400803001|700020006|060000280|000419000|000080079
![alt text](https://image.ibb.co/kZ02fT/grille_resolue_bleu.png)
