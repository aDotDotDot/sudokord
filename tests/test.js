const chai = require('chai');
const sudoku = require('../sudoku/sudoku');
let should = chai.should();


describe('Basic functions', () => {
    it('it should generate an empty grid', (done) => {
        sudoku.emptyGrid().should.be.eql([[0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0],
                                            [0,0,0,0,0,0,0,0,0]]);
        done();
    });
    it('it should reverse properly a grid', (done) => {
        let g = [[1,2,3,4,5,6,7,8,9],
        [0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0]]
        sudoku.reverseGrid(g).should.be.eql([[1,0,0,0,0,0,0,0,0],
                                            [2,0,0,0,0,0,0,0,0],
                                            [3,0,0,0,0,0,0,0,0],
                                            [4,0,0,0,0,0,0,0,0],
                                            [5,0,0,0,0,0,0,0,0],
                                            [6,0,0,0,0,0,0,0,0],
                                            [7,0,0,0,0,0,0,0,0],
                                            [8,0,0,0,0,0,0,0,0],
                                            [9,0,0,0,0,0,0,0,0]]);
        done();
    });
});

describe('Helper functions', () => {
    it('it should convert strings to grid', (done) => {
        let g =	"825471396|194326578|376985241|519743862|632598417|487612935|263159784|948267153|751834629";
        sudoku.defineFromString(g).should.be.eql([ [ 8, 2, 5, 4, 7, 1, 3, 9, 6 ],
                                                    [ 1, 9, 4, 3, 2, 6, 5, 7, 8 ],
                                                    [ 3, 7, 6, 9, 8, 5, 2, 4, 1 ],
                                                    [ 5, 1, 9, 7, 4, 3, 8, 6, 2 ],
                                                    [ 6, 3, 2, 5, 9, 8, 4, 1, 7 ],
                                                    [ 4, 8, 7, 6, 1, 2, 9, 3, 5 ],
                                                    [ 2, 6, 3, 1, 5, 9, 7, 8, 4 ],
                                                    [ 9, 4, 8, 2, 6, 7, 1, 5, 3 ],
                                                    [ 7, 5, 1, 8, 3, 4, 6, 2, 9 ] ]);
        sudoku.defineFromString(g.substr(12)).should.be.false;
        done();
    });
    it('it should convert grid to string', (done) => {
        let g =	[ [ 8, 2, 5, 4, 7, 1, 3, 9, 6 ],
        [ 1, 9, 4, 3, 2, 6, 5, 7, 8 ],
        [ 3, 7, 6, 9, 8, 5, 2, 4, 1 ],
        [ 5, 1, 9, 7, 4, 3, 8, 6, 2 ],
        [ 6, 3, 2, 5, 9, 8, 4, 1, 7 ],
        [ 4, 8, 7, 6, 1, 2, 9, 3, 5 ],
        [ 2, 6, 3, 1, 5, 9, 7, 8, 4 ],
        [ 9, 4, 8, 2, 6, 7, 1, 5, 3 ],
        [ 7, 5, 1, 8, 3, 4, 6, 2, 9 ] ];
        sudoku.stringFromSudoku(g).should.be.eql("825471396|194326578|376985241|519743862|632598417|487612935|263159784|948267153|751834629");
        done();
    });
});

describe('Verification functions', () => {
    it('it should find all possible values', (done) => {
        let g =[[1,2,3,4,5,6,7,8,9],
                [4,5,6,0,0,0,0,0,0],
                [7,8,9,0,0,0,0,0,0],
                [2,0,0,0,0,0,0,0,0],
                [5,0,0,0,0,0,0,0,0],
                [6,0,0,0,0,0,0,0,0],
                [3,0,0,0,0,0,0,0,0],
                [8,0,0,0,0,0,0,0,0],
                [9,0,0,0,0,0,0,0,0]];
        sudoku.testValue3x3(g,1,1,9).should.be.false;
        sudoku.testValue3x3(g,4,2,9).should.be.true;
        sudoku.testValue3x3(g,8,8,9).should.be.true;
        sudoku.testValueRow(g,0,9).should.be.false;
        sudoku.testValueRow(g,5,9).should.be.true;
        sudoku.testValueCol(g,0,9).should.be.false;
        sudoku.testValueCol(g,5,9).should.be.true;
        g[0][1] = 0;
        g[2][0] = 0;
        g[1][1] = 0;
        sudoku.possibleValues(g,0,1).should.be.eql([2]);
        sudoku.possibleValues(g,2,0).should.be.eql([7]);
        sudoku.possibleValues(g,1,1).should.be.eql([2,5,7]);
        sudoku.possibleValues(g,8,8).should.be.eql([1,2,3,4,5,6,7,8]);
        done();
    });
    it('it should only find valid grids', (done) => {
        let g =[[1,2,3,4,5,6,7,8,9],
                [4,5,6,6,6,6,0,0,0],
                [7,8,9,0,0,0,0,0,0],
                [2,0,0,0,0,0,0,0,0],
                [5,0,0,0,0,0,0,0,0],
                [6,0,0,0,0,0,0,0,0],
                [3,0,0,0,0,0,0,0,0],
                [8,0,0,0,0,0,0,0,0],
                [9,0,0,0,0,0,0,0,0]];
        sudoku.validRow(g[0]).should.be.true;
        sudoku.validRow(g[1]).should.be.false;
        sudoku.validRow(sudoku.reverseGrid(g)[0]).should.be.true;
        sudoku.validRow(sudoku.reverseGrid(g)[5]).should.be.false;
        sudoku.valid3x3square(g,0,0).should.be.true;
        sudoku.valid3x3square(g,0,3).should.be.false;

        done();
    });
});

describe('Completeness functions', () => {
    it('it should validate grids', (done) => {
        let g =[[1,2,3,4,5,6,7,8,9],
                [4,5,6,0,0,0,0,0,0],
                [7,8,9,0,0,0,0,0,0],
                [2,0,0,0,0,0,0,0,0],
                [5,0,0,0,0,0,0,0,0],
                [6,0,0,0,0,0,0,0,0],
                [3,0,0,0,0,0,0,0,0],
                [8,0,0,0,0,0,0,0,0],
                [9,0,0,0,0,0,0,0,0]];
        sudoku.isComplete(g).should.be.false;
        sudoku.isGoodIncompleteSudoku(g).should.be.true;
        sudoku.isGoodSudoku(g).should.be.false;
        let validS = sudoku.defineFromString("825471396|194326578|376985241|519743862|632598417|487612935|263159784|948267153|751834629");
        sudoku.isGoodSudoku(validS).should.be.true;
        done();
    });
});

describe('Resolution functions', () => {
    it('it should find all empty squares', (done) => {
        let g = sudoku.defineFromString("025471396|194326578|376985241|519743862|632598417|487612935|263159784|948267153|751834629");
        sudoku.emptySquares(g).should.be.eql([[0,0]]);
        done();
    });
    it('it should solve the grid', (done) => {
        let g = sudoku.defineFromString("025471396|194326578|376985241|519743862|632598417|487612935|263159784|948267153|751834629");
        let validS = sudoku.defineFromString("825471396|194326578|376985241|519743862|632598417|487612935|263159784|948267153|751834629");

        sudoku.solve(g)[1].should.be.eql(validS);
        done();
    });
});

describe('Image creation', () => {
    it('it should draw a grid to an image', (done) => {
        let g = sudoku.defineFromString("025471396|194326578|376985241|519743862|632598417|487612935|263159784|948267153|751834629");
        sudoku.drawSudoku(g).should.include('tmpimgs/grille_sudoku_');
        done();
    });
});

/*
describe('Unit tests - Model', () => {
    it('it should fail to remind me to write unit tests', (done) => {
        ''.should.be.eql('not');
        done();
    });
    it('it should sort correctly an array', (done) => {
        let arrayA = new Array();
        arrayA.push({'name':'London', score:0.29});
        arrayA.push({'name':'Paris', score:0.5667});
        arrayA.push({'name':'New-York', score:0.866});
        arrayA.push({'name':'Montréal', score:0.87});
        
        arrayA.sort(model.sort_cities).should.be.eql(arrayA.reverse());
        done();
    });
    it('it should match correctly the names', (done) => {       
        model.partial_match('Londo',{'name':'London', score:0.29}).should.be.eql(true);
        model.partial_match('*',{'name':'London', score:0.29}).should.be.eql(false);
        model.partial_match('Pari',{'name':'London', score:0.29}).should.be.eql(false);
        model.partial_match('L',{'name':'London', score:0.29}).should.be.eql(true);
        model.partial_match('\'*$',{'name':'London', score:0.29}).should.be.eql(false);
        done();
    });
    it('it should compute levenshtein correctly', (done) => {       
        model.levenshtein('Londo','London').should.be.eql(1);
        model.levenshtein('London','Londo').should.be.eql(1);
        model.levenshtein('Paris','London').should.be.eql(6);
        model.levenshtein('','London').should.be.eql(6);
        model.levenshtein('Paris','Prias').should.be.eql(2);
        done();
    });
    it('it should be able to calclate distances with coordinates', (done) => {       
        model.compute_distance(12,12,12,12).should.be.eql(0);
        model.compute_distance(12.3456,-34.5678,56.789,-78.90).toFixed(3).should.be.eql('6208.311');
        done();
    });
});*/