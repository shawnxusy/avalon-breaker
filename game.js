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
var cancelButton;

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
        cancelButton = $("#cancel-button");
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

                    // Run deduction for so far
                    runDeduction();
                    proposerSelectionState();
            }
        });

        $(actionButton2).click(function() {
            // The game state should be at "mission" now
            mission = new Mission(missionNumber, propose.proposee, "FAILED");
            missions.push(mission);
            missionNumber++;
            $(actionButton2).hide();

            // Run deduction for so far
            runDeduction();
            proposerSelectionState();
        });

        // The cancel button cancels the current selections
        $(cancelButton).click(function() {
            currentlySelected = [];
            currentlySelectedCount = 0;
            $(".player").removeClass("disabled");
        });
    }

/*
    ---------------------------
    Game manager
    ---------------------------
 */
    preGameState();  // Kicks everything off

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
        noOfPlayers = 8;
        noOfVillains = 3;
        noOfHeroes = 2;
        noOfInnos = 3;
        myRole = "merlin";
        myPosition = 0;
        dummyInGame = false;

        // In this test case:
        // 0: Merlin (me), 2: Assasin; 3: Percival; 4: Mordred; 5: Morgana; 1/6/7: Innocents;

        // Mission 1
        var propose1 = new Propose(0, 0, [0,1,6]);
        var vote1 = new Vote(0, [0,1,6], [0,6], [1,2,3,4,5,7]);
        var propose2 = new Propose(0, 1, [0,1,2]);
        var vote2 = new Vote(0, [0,1,2], [1,2], [0,3,4,5,6,7]);
        var propose3 = new Propose(0, 2, [1,2,6]);
        var vote3 = new Vote(0, [1,2,6], [2,6], [0,1,3,4,5,7]);
        var propose4 = new Propose(0, 3, [0,1,3]);
        var vote4 = new Vote(0, [0,1,3], [0,1,3,6,7], [2,4,5]);

        var mission1 = new Mission(1, [0,1,3], 'SUCCEEDED');

        // Mission 2
        var propose5 = new Propose(1, 4, [0,1,3,4]);
        var vote5 = new Vote(1, [0,1,3,4], [2,4], [0,1,3,5,6,7]);
        var propose6 = new Propose(1, 5, [0,1,3,5]);
        var vote6 = new Vote(1, [0,1,3,5], [4,5], [0,1,2,3,6,7]);
        var propose7 = new Propose(1, 6, [0,1,3,6]);
        var vote7 = new Vote(1, [0,1,3,6], [0,1,3,6], [2,4,5,7]);
        var propose8 = new Propose(1, 7, [0,1,5,7]);
        var vote8 = new Vote(1, [0,1,5,7], [2,4,5,6,7], [0,1,3]);

        var mission2 = new Mission(1, [0,1,5,7], 'FAILED');

        // Mission 3
        var propose9 = new Propose(2, 0, [0,1,3,6]);
        var vote9 = new Vote(2, [0,1,3,6], [0,1,3,6], [2,4,5,7]);
        var propose10 = new Propose(2, 1, [0,1,4,6]);
        var vote10 = new Vote(2, [0,1,4,6], [2,4,5], [0,1,3,6,7]);
        var propose11 = new Propose(2, 2, [0,1,2,6]);
        var vote11 = new Vote(2, [0,1,2,6], [2,4,5,7], [0,1,3,6]);
        var propose12 = new Propose(2, 3, [0,1,3,6]);
        var vote12 = new Vote(2, [0,1,3,6], [0,1,3,6,7], [2,4,5]);

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
        proposes.push(propose9);
        proposes.push(propose10);
        proposes.push(propose11);
        proposes.push(propose12);

        votes.push(vote1);
        votes.push(vote2);
        votes.push(vote3);
        votes.push(vote4);
        votes.push(vote5);
        votes.push(vote6);
        votes.push(vote7);
        votes.push(vote8);
        votes.push(vote9);
        votes.push(vote10);
        votes.push(vote11);
        votes.push(vote12);

        runDeduction();
    }
