const Discord = require('discord.js');
const logger = require('winston');
const fs = require('fs');
const auth = require('./auth.json');
const gd = require('node-gd');
const sudoku = require('./sudoku/sudoku.js');
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

// Initialize Discord Bot
var bot = new Discord.Client();

/* Bot stuff, creating ready event*/
bot.on('ready', () => {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.user.username + ' - (' + bot.user.id + ')');
});

bot.on('message', function (message) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `prefix`
    var prefix = '$sudoku ';
    if(message.author.id == bot.user.id)
        return;
    if (message.content.substring(0, prefix.length) == prefix) {   
        var args = message.content.substring(prefix.length).split(' ');
        var cmd = args[0];
        args = args.splice(1);
        let paramUser = {stUser:'', gridUser:[], error:false};
        if(['solve', 'draw', 'check'].includes(cmd)){
            if(args.length > 0)
                paramUser.stUser = args[0];
            else
                paramUser.error = true;
            if(!paramUser.error){
                let grid = sudoku.defineFromString(paramUser.stUser);
                if(grid)
                    paramUser.gridUser = grid;
                else
                    paramUser.error = true;
            }
        }
        switch(cmd) {
            case 'solve':
                if(paramUser.error){
                    message.channel.send("Essayez plutôt une grille valide, par exemple : \`\`\`$sudoku solve 530070000|600195000|098000060|800060003|400803001|700020006|060000280|000419000|000080079\`\`\`");
                }else{
                    solved = sudoku.solve(paramUser.gridUser);
                    iter = solved[0]
                    //time = solved[2]
                    if(!solved[1]){
                        message.channel.send("Une erreur s'est produite, cette grille est invalide, ou le bot n'a pas trouvé de solution dans un temps raisonnable ("+time+"s)");
                    }else{
                        pathImg = sudoku.drawSudoku(solved[1], sudoku.defineFromString(paramUser.stUser));
                        message.channel.send(`Voilà votre grille résolue en ${iter} itérations !`,
                        {files:[{
                            attachment: pathImg,
                            name: 'grille.png'
                        }]}).then(()=>{
                            fs.unlink(pathImg, function(err){
                                if(err) throw err;
                            });
                        }).catch((err)=>{
                            console.log(err);
                        })
                    }
                }
                break;
            case 'draw':
                pathImg = sudoku.drawSudoku(paramUser.gridUser, null);
                message.channel.send(`Voilà votre grille !`,
                        {files:[{
                            attachment: pathImg,
                            name: 'grille.png'
                        }]}).then(()=>{
                            fs.unlink(pathImg, function(err){
                                if(err) throw err;
                            });
                        }).catch((err)=>{
                            console.log(err);
                        });
                break;
            case 'check':
                var canSolve = sudoku.solve(sudoku.defineFromString(paramUser.stUser))[1];
                if(sudoku.isGoodSudoku(paramUser.gridUser)){
                    pathImg = sudoku.drawSudoku(paramUser.gridUser, null);
                    message.channel.send(`Votre grille est complète, bravo !`,
                    {files:[{
                        attachment: pathImg,
                        name: 'grille.png'
                    }]}).then(()=>{
                        fs.unlink(pathImg, function(err){
                            if(err) throw err;
                        });
                    }).catch((err)=>{
                        console.log(err);
                    });
                }else if(sudoku.isGoodIncompleteSudoku(paramUser.gridUser) && canSolve){
                    pathImg = sudoku.drawSudoku(paramUser.gridUser, null);
                    message.channel.send(`Votre grille est incomplète, mais vous êtes sur la bonne voie !`,
                    {files:[{
                        attachment: pathImg,
                        name: 'grille.png'
                    }]}).then(()=>{
                        fs.unlink(pathImg, function(err){
                            if(err) throw err;
                        });
                    }).catch((err)=>{
                        console.log(err);
                    });
                }else if(sudoku.isGoodIncompleteSudoku(paramUser.gridUser) && !canSolve){
                    message.channel.send("Cette grille est valide, incomplète, mais ne peut pas peut-être résolue, vous avez probablement fait une petite erreur");
                }else{
                    message.channel.send("Cette grille est invalide");
                }
                break;
            case 'generate':
                
                break;


            case 'help':
            default:
                message.channel.send("Demandez moi de résoudre ou de dessiner un sudoku : \`\`\`$sudoku solve <lignes sans espaces séparées par |>\n$sudoku draw <lignes sans espaces séparées par |>\n$sudoku check <lignes sans espaces séparées par |>\`\`\`");
        }
    }
});

bot.login(auth.token);