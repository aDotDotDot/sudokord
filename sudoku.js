const Discord = require('discord.io');
const logger = require('winston');
const fs = require('fs');
const auth = require('./auth.json');
const gd = require('node-gd');
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

//for GD text
const fontPath = './BebasNeue-Regular.ttf';

// Initialize Discord Bot
const bot = new Discord.Client({
    token: auth.token,
    autorun: true
});
var grilleVide = function(){
    var g = new Array();
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
var reverseGrille = function(gr){
    rev = grilleVide();
    for(var i=0; i<9; i++){
        for(var j=0; j<9; j++){
            rev[j][i] = gr[i][j];
        }
    }
    return rev;
};
/* Liste les valeurs possible pour une case */
var valeursPossibles = function(gr, ligne, colonne){
    var val = new Array();
    for(var i=1; i<=9; i++){
        if(testNouvelleValeur(gr, ligne, colonne, i))
            val.push(i);
    }
    return val;
};
/* Génère une grille de sudoku à résoudre */
var genererGrille = function(difficulte){
    var grilleG = grilleVide();
    var difficultes = [40,34,29,21,15];
    var nbCasesMax = difficultes[difficulte];
    while(nbCasesMax>0){
        for(var i=0; i<9; i++){
            for(var j=0; j<9; j++){
                var aRemplir = (Math.random() < 0.2) && nbCasesMax>0;//on remplit la case 1 fois sur deux, si on n'a pas atteint le maximum
                if(aRemplir){
                    var possible = valeursPossibles(grilleG, i, j);
                    grilleG[i][j] = possible[Math.floor(Math.random()*possible.length)];
                    nbCasesMax--;
                }
            }
        }
    }
    var copy = defineFromString(stringFromSudoku(grilleG));
    try{
        if(resoudreIntelligent(copy)[1]){//on veut une grille qui peut être résolue
            return grilleG;
        }else
            return genererGrille(difficulte);
    }catch(e){
        return genererGrille(difficulte);
    }

};

/*ajoute N chiffres à la grille */
/*var indiceGrille = function(grille, hints){
    var cv = casesVides();
    if(hints > cv.length)
        return resolve(grille)[1];
    else{
        caseR = Math.floor(Math.random()*cv.length);
        var possible = valeursPossibles(grilleG, i, j);
        var leRandom = Math.floor(Math.random()*possible.length);
        grille[caseR[0]][caseR[1]] = possible[leRandom];
        var canSolve = resoudre(defineFromString(stringFromSudoku(grille)))[1];
        while(!canSolve && possible.length > 1){
            array.splice(leRandom, 1);
            leRandom = Math.floor(Math.random()*possible.length)
            grille[caseR[0]][caseR[1]] = possible[leRandom];
            canSolve = resoudre(defineFromString(stringFromSudoku(grille)))[1];
        }
    }
    return grille;
};
*/
/*
Vérifie qu'une ligne est correcte : 
  - aucune chiffre n'est répété
  - certaines cases peuvent être vides
*/
var ligneCorrecte = function(ar){
    nbs = new Array();
    for(var i in ar){
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
var carre3x3Correct = function(gr, topLigne, leftColumn){
    var valeurs = new Array();
    for(var i=topLigne;i<topLigne+3;i++){
        for(var j=leftColumn;j<leftColumn+3;j++){
            if(valeurs.indexOf(gr[i][j]) != -1)
                return false;
            else
                (gr[i][j]!=0)?valeurs.push(gr[i][j]):"";
        }
    }
    return true;
};
/*vérifie que l'ensemble des carrés 3x3 sont corrects */
var grille3x3Correcte = function(gr){
    for(var topLigne=0; topLigne<9; topLigne+=3){
        for(var leftColumn=0; leftColumn<9; leftColumn+=3){
            if(!carre3x3Correct(gr, topLigne, leftColumn))
                return false;
        }
    }
    return true;
};


/*
Vérifie qu'une grille est complétée <=> il n'y a aucune case vide
*/
var isComplete = function(gr){
    for(var i=0; i<9; i++){
        for(var j=0; j<9; j++){
            if(gr[i][j] == 0)
                return false;
        }
    }
    return true;
};

/*
Vérifie si la grille est valable (peut être incomplète) <=> toutes les lignes et colonnes sont correctes 
*/
var isGoodIncompleteSudoku = function(gr){
    var rev = reverseGrille(gr);
    for(var i=0;i<9;i++){
        if(!ligneCorrecte(gr[i]) || !ligneCorrecte(rev[i]))
            return false;
    }
    return grille3x3Correcte(gr);
};

/*
Vérifie si la solution proposée est valable et que la grille est complète
*/
var isGoodSudoku = function(gr){
    return isComplete(gr) && isGoodIncompleteSudoku(gr);
};

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
var casesVides = function(gr){
    var cp=[];
    for(var i=0; i<9; i++){
        for(var j=0; j<9; j++){
            if(gr[i][j] == 0)
                cp.push([i,j]);
        }
    }
    return cp;
}

var casesVidesIntelligent = function(gr){
    var cp=[];
    for(var i=0; i<9; i++){
        for(var j=0; j<9; j++){
            if(gr[i][j] == 0){
                var v = valeursPossibles(gr, i, j);
                cp.push([i, j, v]);
            }
        }
    }
    return cp.sort(function(x, y) {
        return x[2].length - y[2].length;
    });
}

var updateCasesVidesIntelligent = function(gr,cv){
    for(var c in cv){
        var ligne = cv[c][0];
        var colonne = cv[c][1];
        cv[2] = valeursPossibles(gr, ligne, colonne);
    }
    return cv.sort(function(x, y) {
        return x[2].length - y[2].length;
    });
};

var solveForOne = function(grToWork, cv){
    var i = 0;
    var exit = false;
    while(i < cv.length && !exit){
        if(cv[i][2] && cv[i][2].length == 1){
            grToWork[cv[i][0]][cv[i][1]] = cv[i][2][0];
            cv = casesVidesIntelligent(grToWork);
        }
        i++;
        if(cv[i][2] && cv[i][2].length > 1)
            exit = true;
    }
    return grToWork;
}

var hiddenSingles = function(grToWork){
    /*On cherche les hidden singles, les nombres qui ne peuvent aller qu'à un seul endroit mais qui n'apparaissent pas comme uniques dans les valeurs possibles
    Le cas le plus courant : un chiffre est déjà dans les lignes et les colonnes autour de la positions
     0 7 0 | 0 0 0 | 0 0 0
     0 0 0 | 0 0 0 | 0 0 0
     0 0 0 | 0 0 0 | 0 0 0
     ---------------------
     7 0 0 | 0 0 0 | 0 0 0
     0 0 0 | 0 0 0 | 0 0 0
     0 0 0 | 0 0 0 | 0 0 0
     ---------------------
     0 0 X | 0 0 0 | 0 0 0
     0 0 0 | 7 0 0 | 0 0 0
     0 0 0 | 0 0 0 | 7 0 0
     ---------------------
    Le X ici est forcément un 7
    */
    var hiddenS = [];
    var rev = reverseGrille(grToWork);
    for(var ligne = 0; ligne <9; ligne ++){
        for(var colonne = 0; colonne < 9; colonne++){
            previousMultiple = Math.floor(ligne/3);
            lignesComplementaires = [previousMultiple*3 + ((ligne + 1)%3), previousMultiple*3 + ((ligne + 2)%3)];
            previousMultiple = Math.floor(colonne/3);
            colonnesComplementaires = [previousMultiple*3 + ((colonne + 1)%3), previousMultiple*3 + ((colonne + 2)%3)];
            for(var c = 1; c <= 9; c++){
                if(grToWork[lignesComplementaires[0]].indexOf(c) != -1
                   && grToWork[lignesComplementaires[1]].indexOf(c) != -1
                   && rev[colonnesComplementaires[0]].indexOf(c) != -1
                   && rev[colonnesComplementaires[1]].indexOf(c) != -1
                   && grToWork[ligne].indexOf(c) == -1
                   && rev[colonne].indexOf(c) == -1){
                       hiddenS.push([ligne, colonne, c]);
                   }
            }
        }
    }
    return hiddenS;
};

var solveForHidden = function(grToWork){
    var hid = hiddenSingles(grToWork);
    for(var i in hid){
        grToWork[hid[i][0]][hid[i][1]] = hid[i][2];
    }
    return grToWork;
};

var resoudreIntelligent = function(grToWork){
    var start = Date.now();
    //grToWork = solveForHidden(grToWork);
    var cv = casesVidesIntelligent(grToWork);//les cases à remplir
    grToWork = solveForOne(grToWork, cv);
    cv = casesVides(grToWork);
    var iter = 0;//pour garder une trace des itérations
    try{
        for(var i=0; i < cv.length;){//on va gérer nous mêmes nos itérations, donc pas de i++ dans la définition
        var limit = 9;//le max des nombres
        var ligne, colonne, valeur, good;
        good = false;
        ligne = cv[i][0];
        colonne = cv[i][1];
        var valeurs = cv[i][2];
        var cptValeurs = 0;
        /*valeur = valeurs[cptValeurs];//on teste la valeur suivante
        while(!good && cptValeurs <= valeurs.length){
            //tant qu'on n'a pas trouvé de valeur viable ici, et qu'on n'a pas atteint la limite, on continue
            if(testNouvelleValeur(grToWork, ligne, colonne, valeur)){//notre valeur serait possible ?
                good = true;//on peut finir notre while, on a une valeur possible
                grToWork[ligne][colonne] = valeur;//on l'ajoute à la grille
                i++;//on avance à la valeur suivante
            }else{//on teste une autre valeur
                cptValeurs++;
                valeur = valeurs[cptValeurs];
                iter++;
            }
        }
        if(!good){//on n'a aucune valeur possible, on a fait une erreur avant :/
            grToWork[ligne][colonne] = 0;//on annule cette valeur, en remttant la case comme vide
            i--;//du coup on repart en arrière dans le for
            if(i<0)
                throw "Bactkracking issue";
            iter++;
        }*/
        valeur = grToWork[ligne][colonne] + 1;//on teste la valeur suivante
        while(!good && valeur <=limit){
            //tant qu'on n'a pas trouvé de valeur viable ici, et qu'on n'a pas atteint la limite, on continue
            if(testNouvelleValeur(grToWork, ligne, colonne, valeur)){//notre valeur serait possible ?
                good = true;//on peut finir notre while, on a une valeur possible
                grToWork[ligne][colonne] = valeur;//on l'ajoute à la grille
                i++;//on avance à la valeur suivante
            }else{//on teste une autre valeur
                valeur++;
                iter++;
            }
        }
        if(!good){//on n'a aucune valeur possible, on a fait une erreur avant :/
            grToWork[ligne][colonne] = 0;//on annule cette valeur, en remettant la case comme vide
            i--;//du coup on repart en arrière dans le for
            iter++;
        }
        if(((Date.now() - start) / 1000) > 180)//more than 3 minutes
            throw "Too many iterations"; //console.log(valeur, valeurs, cv[i]);
        }
    }catch(e){
        logger.warn(e);
        return [iter,false, (Date.now() - start) / 1000];
    }
    return [iter,grToWork, (Date.now() - start) / 1000];
};
/* Tests d'ajout de valeur dans une case vide 
On vérifie avant d'ajouter une valeur qu'elle respecte les règles du sudoku : 
  - elle n'est pas en double sur la ligne
  - elle n'est pas en double sur la colonne
  - elle n'est pas en double dans le petit carré de 3x3 courant
*/

/*
Vérifie le carré 3x3 en vérifiant que  notre valeur n'y est pas déjà
*/
var testValeur3x3 = function(gr, ligne, colonne, valeur){
    var topLine, leftColumn;
    topLine = 3*Math.floor(ligne/3);
    leftColumn = 3*Math.floor(colonne/3);
    for(var i=topLine;i<topLine+3;i++){
        for(var j=leftColumn;j<leftColumn+3;j++){
            if(gr[i][j]==valeur)
                return false;
        }
    }
    return true;
};
/*Vérifie que la valeur n'est pas dans la ligne courante*/
var testValeurLigne = function(gr, ligne, valeur){
    for(var i=0; i<9; i++){
        if(gr[ligne][i] == valeur)
            return false;
    }
    return true;
};
/*Vérifie que la valeur n'est pas dans la colonne courante*/
var testValeurColonne = function(gr, colonne, valeur){
    for(var i=0; i<9; i++){
        if(gr[i][colonne] == valeur)
            return false;
    }
    return true;
};
/*Fais les 3 tests précédents, assurant que la valeur est possible*/
var testNouvelleValeur = function(gr, ligne, colonne, valeur){
    return testValeur3x3(gr, ligne, colonne, valeur) && testValeurLigne(gr, ligne, valeur) && testValeurColonne(gr, colonne, valeur);
}

/*Maintenant on peut résoudre notre grille*/
var resoudre = function(grToWork){
    var cv = casesVides(grToWork);//les cases à remplir
    var iter = 0;//pour garder une trace des itérations
    try{
        for(var i=0; i < cv.length;){//on va gérer nous mêmes nos itérations, donc pas de i++ dans la définition
        var limit = 9;//le max des nombres
        var ligne, colonne, valeur, good;
        good = false;
        ligne = cv[i][0];
        colonne = cv[i][1];
        valeur = grToWork[ligne][colonne] + 1;//on teste la valeur suivante
        while(!good && valeur <=limit){
            //tant qu'on n'a pas trouvé de valeur viable ici, et qu'on n'a pas atteint la limite, on continue
            if(testNouvelleValeur(grToWork, ligne, colonne, valeur)){//notre valeur serait possible ?
                good = true;//on peut finir notre while, on a une valeur possible
                grToWork[ligne][colonne] = valeur;//on l'ajoute à la grille
                i++;//on avance à la valeur suivante
            }else{//on teste une autre valeur
                valeur++;
                iter++;
            }
        }
        if(!good){//on n'a aucune valeur possible, on a fait une erreur avant :/
            grToWork[ligne][colonne] = 0;//on annule cette valeur, en remttant la case comme vide
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

/* Fonctions utilitaires */

/*
Crée une grille de sudoku à partir d'une string de la forme [0-9]|[0-9]|[0-9]|.....|[0-9]
Vérifie la taille et les valeurs entrées
Si la grille est possible, la retourne, retourne "false" sinon
*/
var defineFromString = function(stSudoku){
    var reg = /^[0-9|]+$/
    var sudoku;
    if(!reg.test(stSudoku))
        return false;
    else{
        sudoku = stSudoku.split("|");
        if(sudoku.length != 9)
            return false;
        else{
            for(var i=0;i<9;i++){
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
var stringFromSudoku = function(gr){
    var st = "";
    for(var i =0; i<9; i++){
        st+= gr[i].join('');
        if(i<8) st+='|';
    }
    return st;
}

/*Permet de dessiner une grille, en mettant les valeurs initiales avec une couleur différente si besoin*/
var dessinerSudokuResolu = function(gr, initGr){
    var name_now;
    //on charge l'image vierge d'un sudoku
    gd.openFile('./grille_sudoku_vierge.png', function(err, img) {
      if (err) {
        throw err;
      }
      if (err) {
        throw err;
      }
      var txtColor = img.colorAllocate(0, 0, 0);//du noir
      var txtColorRed = img.colorAllocate(255, 0, 0);//du rouge
      var txtColorBleu = img.colorAllocate(71, 93, 255);//du bleu pastel
      var onlyOne = (initGr == null); //si on n'a pas d'autre grille
      for(var i = 0; i< 9; i++){
          for(var j = 0; j < 9; j++){
              if(gr[j][i] != 0){
                  if(onlyOne || initGr[j][i] != 0){
                      //on a une image de 9*60 x 9*60 pixels, chaque chiffre va dans un carré de 60x60
                      //les coordonnées sont donc de j*60 i*60 pour le coin
                      // mais on veut centrer le texte, on préfère donc le bas de la case (j+1) puis remonter de quelques pixels (11 semble être correct avec la taille et la police)
                      //pour centrer verticalement même réflexion, avec i*60 et 21 pixels
                    img.stringFT(txtColor, fontPath, 40, 0, 21+60*i, ((j+1)*60)-11, ""+gr[j][i]); 
                  }else{
                    img.stringFT(txtColorBleu, fontPath, 40, 0, 21+60*i, ((j+1)*60)-11, ""+gr[j][i]);  
                  }
              }
                  
          }
      }
      name_now = './tmpimgs/grille_sudoku_'+Date.now()+'.png'
      img.saveFile(name_now, function(err) {
        img.destroy();
        if (err) {
          throw err;
        }
        
      });
    });
    return name_now;//on retourne le nom de l'image, pour l'upload et la supprimer ensuite
}

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
    bot.setPresence({
        status: 'dnd',
        game:{
            name: "Sudoku"//parce qu'on peut, pourquoi s'en priver
        }
    });

});
// Automatically reconnect if the bot disconnects due to inactivity
bot.on('disconnect', function(erMsg, code) {
    console.log('----- Bot disconnected from Discord with code', code, 'for reason:', erMsg, '-----');
    bot.connect();
});
bot.on('message', function (user, userID, channelID, message, evt) {
    // A chaque 'message' event, on vérifie si le bot doit faire quelque chose
    // On écoute donc les messages qui commencent par `$`
    if (message.substring(0, 1) == '$') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
        args = args.splice(1);
        switch(cmd) {
            case 'sudoku':
                var possibleCommands = ['solve', 'draw', 'check', 'generate'];
                if(args.length < 1){
                    bot.sendMessage({
                        to: channelID,
                        message: "Demandez moi de résoudre ou de dessiner un sudoku : \`\`\`$sudoku solve <lignes sans espaces séparées par |>\n$sudoku draw <lignes sans espaces séparées par |>\n$sudoku check <lignes sans espaces séparées par |>\n$sudoku generate <difficulté entre 1 et 5>\`\`\`"
                    });
                }else{
                    cmd2 = args[0];
                    args = args.splice(1);
                    if(possibleCommands.indexOf(cmd2) == -1){
                        bot.sendMessage({
                            to: channelID,
                            message: "Je ne connais pas cette commande, essayez plutôt : \`\`\`$sudoku solve <lignes sans espaces séparées par |>\n$sudoku draw <lignes sans espaces séparées par |>\n$sudoku check <lignes sans espaces séparées par |>\n$sudoku generate <difficulté entre 1 et 5>\`\`\`"
                        });
                    }else{
                        if(cmd2 != "generate"){
                            stUser = args[0];
                            grilleUser = defineFromString(stUser)
                        }
                        if((cmd2 != "generate") && (!grilleUser || !isGoodIncompleteSudoku(grilleUser))){
                            bot.sendMessage({
                                to: channelID,
                                message: "Essayez plutôt une grille valide, par exemple : \`\`\`$sudoku solve 530070000|600195000|098000060|800060003|400803001|700020006|060000280|000419000|000080079\`\`\`"
                            });
                        }else{//la commande et la grile passées sont valides, on peut bosser 
                            switch(cmd2){
                                case 'solve':
                                    solved = resoudreIntelligent(grilleUser);
                                    iter = solved[0]
                                    time = solved[2]
                                    if(!solved[1]){
                                        bot.sendMessage({
                                            to: channelID,
                                            message: "Une erreur s'est produite, cette grille est invalide, ou le bot n'a pas trouvé de solution dans un temps raisonnable ("+time+"s)"
                                        });
                                    }else{
                                        pathImg = dessinerSudokuResolu(solved[1], defineFromString(stUser));
                                        bot.uploadFile({
                                            to: channelID,
                                            message: "Voilà votre grille résolue en "+time+"s et "+iter+" itérations !",
                                            file: pathImg,
                                            filename: "grille.png"
                                        });
                                        fs.unlink(pathImg, function(err){
                                            if(err) throw err;
                                        });
                                    }
                                    break;
                                case 'draw':
                                    pathImg = dessinerSudokuResolu(grilleUser, null);
                                    bot.uploadFile({
                                        to: channelID,
                                        message: "Voilà votre grille !",
                                        file: pathImg,
                                        filename: "grille.png"
                                    });
                                    fs.unlink(pathImg, function(err){
                                        if(err) throw err;
                                    });
                                    break;
                                case 'check':
                                    var canSolve = resoudreIntelligent(defineFromString(stUser))[1];
                                    if(isGoodSudoku(grilleUser)){
                                        pathImg = dessinerSudokuResolu(grilleUser, null);
                                        bot.uploadFile({
                                            to: channelID,
                                            message: "Cette grille est valide !",
                                            file: pathImg,
                                            filename: "grille.png"
                                        });
                                        fs.unlink(pathImg, function(err){
                                            if(err) throw err;
                                        });
                                    }else if(isGoodIncompleteSudoku(grilleUser) && canSolve){
                                        pathImg = dessinerSudokuResolu(grilleUser, null);
                                        bot.uploadFile({
                                            to: channelID,
                                            message: "Cette grille est valide, incomplète, mais peut-être résolue, vous êtes sur la bonne voie !",
                                            file: pathImg,
                                            filename: "grille.png"
                                        });
                                        fs.unlink(pathImg, function(err){
                                            if(err) throw err;
                                        });
                                    }else if(isGoodIncompleteSudoku(grilleUser) && !canSolve){
                                        bot.sendMessage({
                                            to: channelID,
                                            message: "Cette grille est valide, incomplète, mais ne peut pas peut-être résolue, vous avez probablement fait une petite erreur"
                                        });
                                    }else{
                                        bot.sendMessage({
                                            to: channelID,
                                            message: "Cette grille est invalide"
                                        });
                                    }
                                    break;
                                case 'generate':
                                    var diff = parseInt(args[0])-1;
                                    var grG;
                                    if(diff && diff > 0 && diff < 5)
                                        grG = genererGrille(diff);
                                    else
                                        grG = genererGrille(2);
                                    //var solved = resoudre(grG);
                                    pathImg = dessinerSudokuResolu(grG, null);
                                    bot.uploadFile({
                                        to: channelID,
                                        message: "Voilà votre grille à résoudre :\n"+stringFromSudoku(grG),
                                        file: pathImg,
                                        filename: "grille.png"
                                    });
                                    fs.unlink(pathImg, function(err){
                                        if(err) throw err;
                                    });
                                    break;
                                default:
                                    bot.sendMessage({
                                        to: channelID,
                                        message: "Demandez moi de résoudre ou de dessiner un sudoku : \`\`\`$sudoku solve <lignes sans espaces séparées par |>\n$sudoku draw <lignes sans espaces séparées par |>\`\`\`"
                                    });
                                break;    
                            }
                            
                            
                        }
                        
                    }
                }
                break;
            case 'embed':
                /*
                embed=discord.Embed(title="test embed", url="http://ribt.fr", description="hey !", color=0xee28cb)
                embed.set_author(name="DotDotDot", url="https://github.com/aDotDotDot")
                embed.add_field(name=coucou, value=ça va ?, inline=True)
                embed.add_field(name=c'est cool un embed, value=42, inline=True)
                embed.add_field(name=, value=\o/, inline=False)
                embed.set_footer(text="oh ! un footer")
                await self.bot.say(embed=embed)
                */
                /*var embed = {   color: 0xee28cb,
                                footer: {
                                    text: "oh ! un footer"
                                },
                                fields: [{
                                    name: "coucou",
                                    value: "ça va ?",
                                    inline : true
                                }, {
                                    name: "c'est cool un embed",
                                    value: "**Oo**",
                                    inline : true
                                }, {
                                    name: "on peut aller à la ligne aussi ???",
                                    value: "\o/",
                                    inline : false
                                }
                                ],
                                title: 'test embed',
                                description: 'hey ! ',
                                url: 'http://ribt.fr',
                                author: {name:"DotDotDot"},
                                
                                
                            };
                bot.sendMessage({
                    to: channelID,
                    message: "test",
                    embed: embed
                });
                break;*/
            // Si on veut ajouter d'autres commandes
        }
    }
});