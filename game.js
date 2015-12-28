var missionNumber = 0;
var proposes = [];
var votes = [];
var missions = [];
var requiredProposee;
var myRole;
var myPosition;
var globalState = [proposes, votes, missions]; // This is for better debugging

// Game state and reusable classes
var gameState;
var propose;
var vote;
var mission;
var testify;

var currentlySelectedCount = 0;
var currentlySelected = [];
var completeUserArray = [];

var votedRounds = 0;

// For easier Display
var actionButton;
var actionButton2;

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

    // Game start
    function gameStartState(playerCount) {
        $(".pre-game").hide();
        $(".game").show();

        // Generate players UI
        for (var i = 0; i < playerCount; i++) {
            var playerButton = $("<a class='player btn btn-primary' id='player-" + i + "'>" + i + "</div>");
            $(".game-board-players").append($(playerButton));
            completeUserArray.push(i);
        }
        // Get the action button
        actionButton = $("#action-button");
        actionButton2 = $("#action-button-2");
        $("#action-button-2").hide();

        activateControlCallBack();
        proposerSelectionState();
    }

    function proposerSelectionState() {
        gameState = "proposer-selection";
        $(actionButton).text("Selecting proposer");
        // Do cleaning
        $(".player").removeClass("disabled");
        currentlySelected = [];
        currentlySelectedCount = 0;
        console.log(globalState);
    }

    function proposeeSelectionState() {
        gameState = "proposee-selection";
        $(actionButton).text("Selecting proposee");
    }

    function voteState() {
        gameState = "vote";
        $(actionButton).text("Voting (select agreed)");
        // Do cleaning
        $(".player").removeClass("disabled");
        currentlySelected = [];
        currentlySelectedCount = 0;
        // Initialize the vote
        vote = new Vote(missionNumber, propose.proposee, null, null);
    }

    function missionState() {
        gameState = "mission";
        $(actionButton).text("Mission succeeded");
        $(actionButton2).show();
        $(actionButton2).text("Mission Failed");
        // Do cleaning
        $(".player").removeClass("disabled");
        currentlySelected = [];
        currentlySelectedCount = 0;
        votedRounds = 0;
    }


/*
    ---------------------------
    Callback handlers
    ---------------------------
 */
    $("#game-start").click(function() {
        var noOfPlayers = $("#no-of-players").val();
        myRole = $("#my-role").val();
        myPosition = 0;
        dummyInGame = $("#dummy-in-game").prop("checked");
        if (!isNaN(noOfPlayers) && (noOfPlayers >= 7) && (noOfPlayers <= 10)) {
            gameStart(noOfPlayers);
        }
    });

    function activateControlCallBack() {
        $(".player").click(function() {
            // Get the player number
            var playerId = parseInt($(this).text());
            switch (gameState) {
                case "proposer-selection":
                    propose = new Propose(missionNumber, playerId, null);
                    proposeeSelectionState();
                    break;
                case "proposee-selection":
                    currentlySelected.push(playerId);
                    $(this).addClass("disabled");
                    currentlySelectedCount++;
                    if (currentlySelectedCount === requiredProposee[missionNumber]) {
                        propose.proposee = currentlySelected;
                        proposes.push(propose);
                        if (votedRounds === 4) { // If current round is the 5th round, go straight to mission
                            missionState();
                        } else {
                            voteState();
                        }
                    }
                    break;
                case "vote":
                    currentlySelected.push(playerId);
                    $(this).addClass("disabled");
                    currentlySelectedCount++;
                    break;
            }
        });

        $(actionButton).click(function() {
            switch (gameState) {
                case "vote":
                    vote.agreed = currentlySelected;
                    vote.disagreed = _.difference(completeUserArray, vote.agreed);
                    votes.push(vote);

                    if (vote.agreed.length > (noOfPlayers / 2)) {
                        // Proceed with mission
                        missionState();
                    } else {
                        // Go back to vote state
                        votedRounds++;
                        proposerSelectionState();
                    }
                    break;
                case "mission":
                    mission = new Mission(missionNumber, propose.proposee, "SUCCEEDED");
                    missions.push(mission);
                    missionNumber++;
                    $(actionButton2).hide();
                    proposerSelectionState();
            }
        });

        $(actionButton2).click(function() {
            // The game state should be at "mission" now
            mission = new Mission(missionNumber, propose.proposee, "FAILED");
            missions.push(mission);
            missionNumber++;
            $(actionButton2).hide();
            proposerSelectionState();
        });
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
        // Game Stuff Initialization
        noOfPlayers = playerCount;
        noOfHeroes = 2;
        noOfVillains = (noOfPlayers === 7) ? 3 : 4;
        noOfInnos = noOfPlayers - noOfHeroes - noOfVillains;
        requiredProposee = (noOfPlayers <= 7) ? [2, 3, 3, 4, 4] : [3, 4, 4, 5, 5];
        // Display stuff
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
        myRole = "merlin";
        myPosition = 1;
        dummyInGame = false;

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
