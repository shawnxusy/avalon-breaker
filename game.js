var missionNumber = 0;
var proposes = [];
var votes = [];
var missions = [];

/*
    ---------------------------
    Game state
    ---------------------------
 */
    // Init
    function preGameState() {
        $(".pre-game").show();
        $(".game").hide();
    }

    function gameStartState(playerCount) {
        $(".pre-game").hide();
        $(".game").show();

        // Generate players UI
        for (var i = 0; i < playerCount; i++) {
            var playerButton = $("<a class='player btn btn-primary'>" + i + "</div>");
            $(".game-board").append($(playerButton));
        }
    }

/*
    ---------------------------
    Callback handlers
    ---------------------------
 */
    $("#game-start").click(function() {
        var noOfPlayers = $("#no-of-players").val();
        if (!isNaN(noOfPlayers) && (noOfPlayers >= 7) && (noOfPlayers <= 10)) {
            gameStart(noOfPlayers);
        }
    });


    function onPropose(proposer, proposee) {
        var propose = new Propose(missionNumber, proposer, proposee);
        proposes.push(propose);
        runDeduction();
    }

    function onVote() {
        var vote = new Vote(missionNumber, proposee, agreed, disagreed);
        votes.push(vote);
        runDeduction();
    }

    function onMission() {
        var mission = new Mission(missionNumber, team, result);
        missions.push(mission);
        runDeduction();

        missionNumber++;
    }

/*
    ---------------------------
    Game manager
    ---------------------------
 */
    preGameState();

    function gameStart(playerCount) {
        // UI Stuff
        gameStartState(playerCount);
        // Game Stuff
        noOfPlayers = playerCount;
        noOfHeroes = 2;
        noOfVillains = (noOfPlayers === 7) ? 3 : 4;
        noOfInnos = noOfPlayers - noOfHeroes - noOfVillains;
        $("#status-no-of-players").text(noOfPlayers);
        $("#status-no-of-heroes").text(noOfHeroes);
        $("#status-no-of-villains").text(noOfVillains);
        $("#status-no-of-innos").text(noOfInnos);

    }


/*
    ---------------------------
    Test case
    ---------------------------
 */
    // Simple case: bad guy do bad things
    function t1() {
        noOfPlayers = 7;
        noOfVillains = 3;
        noOfHeroes = 2;
        noOfInnos = 2;

        for (var i = 0; i < noOfPlayers; i++) {
            var player = new Player();
            players.push(player);
        }
        // In this test case:
        // 1: Merlin, 2: Assasin; 3: Percival; 4: Mordred; 5: Morgana;

        // Round 1
        var propose1 = new Propose(0, 1, [3,4,6]);
        var vote1 = new Vote(0, [3,4,6], [1,6], [0,2,3,4,5]);
        var propose2 = new Propose(0, 2, [2,4,0]);
        var vote2 = new Vote(0, [2,4,0], [2,4,5], [1,3,6,0]);
        var propose3 = new Propose(0, 3, [1,3,4]);
        var vote3 = new Vote(0, [1,3,4], [1,2,3,4], [0,5,6]);
        var mission1 = new Mission(0, [1,3,4], 'FAILED');

        // Round 2
        var propose4 = new Propose(1, 4, [4,5,6]);
        var vote4 = new Vote(1, [4,5,6], [4,5], [0,1,2,3,6]);
        var propose5 = new Propose(1, 5, [3,5,6]);
        var vote5 = new Vote(1, [3,5,6], [2,5], [0,1,3,4,6]);
        var propose6 = new Propose(1, 6, [0,1,6]);
        var vote6 = new Vote(1, [0,1,6], [0,1,3,6], [2,4,5]);
        var mission2 = new Mission(1, [0,1,3,6], 'SUCCEEDED');

        // Round 3
        var propose7 = new Propose(2, 0, [0,2,3,6]);
        var vote7 = new Vote(2, [0,2,3,6], [2,0,5], [1,3,4,6]);
        var propose8 = new Propose(2, 1, [0,1,6,3]);
        var vote8 = new Vote(2, [0,1,6,3], [0,2,3,6], [2,4,5]);
        var mission3 = new Mission(2, [0,1,3,6], 'SUCCEEDED');

        missions.push(mission1);
        missions.push(mission2);
        missions.push(mission3);

        proposes.push(propose1);
        proposes.push(propose2);
        proposes.push(propose3);
        proposes.push(propose4);
        proposes.push(propose5);
        proposes.push(propose6);
        proposes.push(propose7);
        proposes.push(propose8);

        votes.push(vote1);
        votes.push(vote2);
        votes.push(vote3);
        votes.push(vote4);
        votes.push(vote5);
        votes.push(vote6);
        votes.push(vote7);
        votes.push(vote8);

        runDeduction();

        console.log(players);

    }
