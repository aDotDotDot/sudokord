
const fontPath = __dirname+'/BebasNeue-Regular.ttf';
const gd = require('node-gd');

exports.emptyGrid = () => {
    let g = new Array();
        g = [[0,0,0,0,0,0,0,0,0],
             [0,0,0,0,0,0,0,0,0],
             [0,0,0,0,0,0,0,0,0],
             [0,0,0,0,0,0,0,0,0],
             [0,0,0,0,0,0,0,0,0],
             [0,0,0,0,0,0,0,0,0],
             [0,0,0,0,0,0,0,0,0],
             [0,0,0,0,0,0,0,0,0],
             [0,0,0,0,0,0,0,0,0]];
    return g;
}
//permet de faire la symétrie d'une grille, passant les colonnes en lignes et inversement
exports.reverseGrid = gr => {
    let rev = exports.emptyGrid();
    for(let i=0; i<9; i++){
        for(let j=0; j<9; j++){
            rev[j][i] = gr[i][j];
        }
    }
    return rev;
};
/* Liste les valeurs possible pour une case */
exports.possibleValues = (gr, row, col) => {
    let val = new Array();
    for(let i=1; i<=9; i++){
        if(exports.testValue(gr, row, col, i))
            val.push(i);
    }
    return val;
};

/* Tests d'ajout de valeur dans une case vide 
On vérifie avant d'ajouter une valeur qu'elle respecte les règles du sudoku : 
  - elle n'est pas en double sur la ligne
  - elle n'est pas en double sur la colonne
  - elle n'est pas en double dans le petit carré de 3x3 courant
*/

/*
Vérifie le carré 3x3 en vérifiant que notre valeur n'y est pas déjà
*/
exports.testValue3x3 = (gr, row, col, val) => {
    let topLine, leftColumn;
    topLine = 3*Math.floor(row/3);
    leftColumn = 3*Math.floor(col/3);
    for(let i=topLine;i<topLine+3;i++){
        for(let j=leftColumn;j<leftColumn+3;j++){
            if(gr[i][j]==val)
                return false;
        }
    }
    return true;
};
/*Vérifie que la valeur n'est pas dans la ligne courante*/
exports.testValueRow = (gr, row, val) => {
    for(let i=0; i<9; i++){
        if(gr[row][i] == val)
            return false;
    }
    return true;
};
/*Vérifie que la valeur n'est pas dans la colonne courante*/
exports.testValueCol = (gr, col, val) => {
    for(let i=0; i<9; i++){
        if(gr[i][col] == val)
            return false;
    }
    return true;
};
/*Fais les 3 tests précédents, assurant que la valeur est possible*/
exports.testValue = (gr, row, col, val) => {
    return exports.testValue3x3(gr, row, col, val)
        && exports.testValueRow(gr, row, val)
        && exports.testValueCol(gr, col, val);
}


/*
Vérifie qu'une ligne est correcte : 
  - aucune chiffre n'est répété
  - certaines cases peuvent être vides
*/
exports.validRow = (ar) => {
    let nbs = new Array();
    for(let i in ar){
        if( ar[i]!= 0 && nbs.indexOf(ar[i]) != -1)
            return false;
        else{
            if(ar[i] != 0)
                nbs.push(ar[i]);
        }
    }
    return true;
};

/*vérifie qu'un carré 3x3 est correct*/
exports.valid3x3square = (gr, topLine, leftColumn) => {
    let values = new Array();
    for(let i=topLine;i<topLine+3;i++){
        for(let j=leftColumn;j<leftColumn+3;j++){
            if(values.indexOf(gr[i][j]) != -1)
                return false;
            else
                (gr[i][j]!=0)?values.push(gr[i][j]):"";
        }
    }
    return true;
};
/*vérifie que l'ensemble des carrés 3x3 sont corrects */
exports.allValid3x3 = (gr) => {
    for(let topLine=0; topLine<9; topLine+=3){
        for(let leftColumn=0; leftColumn<9; leftColumn+=3){
            if(!exports.valid3x3square(gr, topLine, leftColumn))
                return false;
        }
    }
    return true;
};



/*
Vérifie qu'une grille est complétée <=> il n'y a aucune case vide
*/
exports.isComplete = (gr) => {
    for(let i=0; i<9; i++){
        for(let j=0; j<9; j++){
            if(gr[i][j] == 0)
                return false;
        }
    }
    return true;
};

/*
Vérifie si la grille est valable (peut être incomplète) <=> toutes les lignes et colonnes sont correctes 
*/
exports.isGoodIncompleteSudoku = (gr) => {
    let rev = exports.reverseGrid(gr);
    for(let i=0;i<9;i++){
        if(!exports.validRow(gr[i]) || !exports.validRow(rev[i]))
            return false;
    }
    return exports.allValid3x3(gr);
};

/*
Vérifie si la solution proposée est valable et que la grille est complète
*/
exports.isGoodSudoku = gr => {
    return exports.isComplete(gr) && exports.isGoodIncompleteSudoku(gr);
};

/* Fonctions utilitaires */

/*
Crée une grille de sudoku à partir d'une string de la forme [0-9]|[0-9]|[0-9]|.....|[0-9]
Vérifie la taille et les valeurs entrées
Si la grille est possible, la retourne, retourne "false" sinon
*/
exports.defineFromString = (stSudoku) => {
    let reg = /^[0-9|]+$/
    let sudoku;
    if(!reg.test(stSudoku))
        return false;
    else{
        sudoku = stSudoku.split("|");
        if(sudoku.length != 9)
            return false;
        else{
            for(let i=0;i<9;i++){
                sudoku[i] = sudoku[i].split('');
                if(sudoku[i].length != 9){
                    return false;
                }else{
                    for(var j=0; j<9; j++){
                        sudoku[i][j] = parseInt(sudoku[i][j]);
                    }
                }
            }
        }
    }
    return sudoku;
};

/* Retourne la string correspondant à la grille */
exports.stringFromSudoku = (gr) => {
    let st = "";
    for(let i =0; i<9; i++){
        st+= gr[i].join('');
        if(i<8) st+='|';
    }
    return st;
}





/*Résolution du sudoku*/
/*
Principe : 
On va chercher les positions de toutes les cases vides
Pour chacune de ces cases, dans l'ordre, on va tester un solution puis continuer jusqu'à 2 posiibilités :
    - soit on est confrontés à une impossibilité (auncun des chiffres de 1 à 9 ne peut aller dans la case vide suivante) => on repart en arrière et on teste autre chose
    - soit on arrive à la fin de la grille, qui est donc théoriquement terminée

*/

/*
Retourne la liste des positions des cases vides
*/
exports.emptySquares = (gr) => {
    let cp=[];
    for(let i=0; i<9; i++){
        for(let j=0; j<9; j++){
            if(gr[i][j] == 0)
                cp.push([i,j]);
        }
    }
    return cp;
}
/*
exports.emptySquaresRanked = (gr) => {
    let cp=[];
    for(let i=0; i<9; i++){
        for(let j=0; j<9; j++){
            if(gr[i][j] == 0){
                let v = exports.emptySquares(gr, i, j);
                cp.push([i, j, v]);
            }
        }
    }
    return cp.sort((x, y) => {
        return x[2].length - y[2].length;
    });
}
*/

/*Maintenant on peut résoudre notre grille*/
exports.solve = (grToWork) => {
    let cv = exports.emptySquares(grToWork);//les cases à remplir
    let iter = 0;//pour garder une trace des itérations
    try{
        for(let i=0; i < cv.length;){//on va gérer nous mêmes nos itérations, donc pas de i++ dans la définition
            let limit = 9;//le max des nombres
            let row, col, val, good;
            good = false;
            row = cv[i][0];
            col = cv[i][1];
            val = grToWork[row][col] + 1;//on teste la valeur suivante
            while(!good && val <= limit){
                //tant qu'on n'a pas trouvé de valeur viable ici, et qu'on n'a pas atteint la limite, on continue
                if(exports.testValue(grToWork, row, col, val)){//notre valeur serait possible ?
                    good = true;//on peut finir notre while, on a une valeur possible
                    grToWork[row][col] = val;//on l'ajoute à la grille
                    i++;//on avance à la valeur suivante
                }else{//on teste une autre valeur
                    val++;
                    iter++;
                }
            }
            if(!good){//on n'a aucune valeur possible, on a fait une erreur avant :/
                grToWork[row][col] = 0;//on annule cette valeur, en remttant la case comme vide
                i--;//du coup on repart en arrière dans le for
                iter++;
            }
            if(iter>5000000)
                throw "Too many iterations";
        }
    }catch(e){
        logger.warn(e);
        return [iter,false];
    }
    return [iter,grToWork];
}






/*Permet de dessiner une grille, en mettant les valeurs initiales avec une couleur différente si besoin*/
exports.drawSudoku = (gr, initGr) => {
    let name_now;
    console.log(initGr);
    //on charge l'image vierge d'un sudoku
    gd.openFile(__dirname+'/sudoku_empty.png', (err, img) => {
        if (err)
            throw err;
        if(img === null)
            throw 'no image';
        let txtColor = img.colorAllocate(0, 0, 0);//du noir
        let txtColorRed = img.colorAllocate(255, 0, 0);//du rouge
        let txtColorBlue = img.colorAllocate(71, 93, 255);//du bleu pastel
        let onlyOne = (initGr == null); //si on n'a pas d'autre grille
        for(let i = 0; i< 9; i++){
            for(let j = 0; j < 9; j++){
                if(gr[j][i] != 0){
                    if(onlyOne || initGr[j][i] != 0){
                        //on a une image de 9*60 x 9*60 pixels, chaque chiffre va dans un carré de 60x60
                        //les coordonnées sont donc de j*60 i*60 pour le coin
                        // mais on veut centrer le texte, on préfère donc le bas de la case (j+1) puis remonter de quelques pixels (11 semble être correct avec la taille et la police)
                        //pour centrer verticalement même réflexion, avec i*60 et 21 pixels
                        img.stringFT(txtColor, fontPath, 40, 0, 21+60*i, ((j+1)*60)-11, ""+gr[j][i]); 
                    }else{
                        img.stringFT(txtColorBlue, fontPath, 40, 0, 21+60*i, ((j+1)*60)-11, ""+gr[j][i]);  
                    }
                }
                    
            }
        }
        name_now = __dirname+'/tmpimgs/grille_sudoku_'+Date.now()+'.png'
        img.saveFile(name_now, (err) => {
        img.destroy();
        if (err)
            throw err;
        });
    });
    return name_now;//on retourne le nom de l'image, pour l'upload et la supprimer ensuite
}

