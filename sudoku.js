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
const grilleVide = [[0,0,0,0,0,0,0,0,0],
             [0,0,0,0,0,0,0,0,0],
             [0,0,0,0,0,0,0,0,0],
             [0,0,0,0,0,0,0,0,0],
             [0,0,0,0,0,0,0,0,0],
             [0,0,0,0,0,0,0,0,0],
             [0,0,0,0,0,0,0,0,0],
             [0,0,0,0,0,0,0,0,0],
             [0,0,0,0,0,0,0,0,0]];
//permet de faire la symétrie d'une grille, passant les colonnes en lignes et inversement
var reverseGrille = function(gr){
    rev = [[0,0,0,0,0,0,0,0,0],
             [0,0,0,0,0,0,0,0,0],
             [0,0,0,0,0,0,0,0,0],
             [0,0,0,0,0,0,0,0,0],
             [0,0,0,0,0,0,0,0,0],
             [0,0,0,0,0,0,0,0,0],
             [0,0,0,0,0,0,0,0,0],
             [0,0,0,0,0,0,0,0,0],
             [0,0,0,0,0,0,0,0,0]];
    for(var i=0; i<9; i++){
        for(var j=0; j<9; j++){
            rev[j][i] = gr[i][j];
        }
    }
    return rev;
};

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
    return true;
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
      for(var i = 0; i< 9; i++){
          for(var j = 0; j < 9; j++){
              if(gr[j][i] != 0){
                  if(initGr[j][i] != 0){
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
                var possibleCommands = ['solve', 'draw'];
                if(args.length < 1){
                    bot.sendMessage({
                        to: channelID,
                        message: "Demandez moi de résoudre ou de dessiner un sudoku : \`\`\`$sudoku solve <lignes sans espaces séparées par |>\n$sudoku draw <lignes sans espaces séparées par |>\`\`\`"
                    });
                }else{
                    cmd2 = args[0];
                    args = args.splice(1);
                    if(possibleCommands.indexOf(cmd2) == -1){
                        bot.sendMessage({
                            to: channelID,
                            message: "Je ne connais pas cette commande, essayez plutôt : \`\`\`$sudoku solve <lignes sans espaces séparées par |>\n$sudoku draw <lignes sans espaces séparées par |>\`\`\`"
                        });
                    }else{
                        stUser = args[0];
                        grilleUser = defineFromString(stUser)
                        if(!grilleUser || !isGoodIncompleteSudoku(grilleUser)){
                            bot.sendMessage({
                                to: channelID,
                                message: "Essayez plutôt une grille valide, par exemple : \`\`\`$sudoku solve 530070000|600195000|098000060|800060003|400803001|700020006|060000280|000419000|000080079\`\`\`"
                            });
                        }else{//la commande et la grile passées sont valides, on peut bosser 
                            switch(cmd2){
                                case 'solve':
                                    solved = resoudre(grilleUser);
                                    iter = solved[0]
                                    pathImg = dessinerSudokuResolu(solved[1], defineFromString(stUser));
                                    bot.uploadFile({
                                        to: channelID,
                                        message: "Voilà votre grille résolue en "+iter+" itérations !",
                                        file: pathImg,
                                        filename: "grille.png"
                                    });
                                    fs.unlink(pathImg, function(err){
                                        if(err) throw err;
                                    });
                                    break;
                                case 'draw':
                                    pathImg = dessinerSudokuResolu(grilleUser, grilleVide);
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
            
            // Si on veut ajouter d'autres commandes
        }
    }
});