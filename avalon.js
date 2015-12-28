

/*
    Game resolver for Avalon, a card game similar to resistance, mafia, werewolve.
    Basic logic is, for every round of action (proposing, voting), use brutal force to:
        - Assume each person is each roled character, calculate possibility
        - Once possibility is lower than threshold, stop and calculate next character setting
        - "My" role is 100% certain, and I may also know roles of others, reducing some efforts
        - Calculation is not cumulative. Every round calculate from beginning
        - Still, optimization would be good
 */

    /*
     ---------------------------
     Global constants and setttings
     ---------------------------
    */
    var slope = {
        low: 0.9,
        medium: 1,
        high: 1.1
    };

    var possibleThreshold = 0.1;

    /*
        ---------------------------
        General class (role) settings
        ---------------------------
     */
        function Player() {
            this.id = null;
            this.isHero = 0; // Possibility of being morgana, same below
            this.isVillain = 0;
            this.isInnocent = 0;
            this.isMorgana = 0;
            this.isAssasin = 0;
            this.isMordred = 0;
            this.isMerlin = 0;
            this.isPercival = 0;
            this.isDummy = 0;

            this.identity = null;
        }

        function Hero() {
            this.type = "hero";
        }

        function Villain() {
            this.type = "villain";
        }

        function Morgana() {
            Villain.call(this);
            this.role = "morgana";
        }
        Morgana.prototype = _.create(Villain.prototype);

        function Assasin() {
            Villain.call(this);
            this.role = "assasin";
        }
        Assasin.prototype = _.create(Villain.prototype);

        function Mordred() {
            Villain.call(this);
            this.role = "mordred";
        }
        Mordred.prototype = _.create(Villain.prototype);

        function Dummy() {
            Villain.call(this);
            this.role = "dummy";
        }
        Dummy.prototype = _.create(Villain.prototype);

        function Merlin() {
            Hero.call(this);
            this.role = "merlin";
        }
        Merlin.prototype = _.create(Hero.prototype);

        function Percival() {
            Hero.call(this);
            this.role = "percival";
        }
        Percival.prototype = _.create(Hero.prototype);

        function Innocent() {
            this.type = "innocent";
            this.role = "innocent";
        }

    /*
        ---------------------------
        Game specific settings
        Common set (5 roles): 1 Morgana (morg), 1 Assasin (assa), 1 Mordred (modr), 1 Merlin (merl), 1 Percival (perc)
        6 players: + 1 villager (inno).
        7 players: + 2 villager (inno).
        8 players: + 2 villager (inno), + 1 dummy (dumm)
        ---------------------------
     */
        var noOfPlayers, noOfVillains, noOfHeroes, noOfInnos, dummyInGame; // noOfPlayers = sum(rest);

        var players = [];


    /*
        ---------------------------
        Device to record game rounds
        !important: missionNumber starts at 0 (round 1 -> missionNumber : 0)
        ---------------------------
     */
        function Propose(missionNumber, proposer, proposee) {
            this.missionNumber = missionNumber;
            this.proposer = proposer;
            this.proposee = proposee; // []
        }

        function Vote(missionNumber, proposee, agreed, disagreed) {
            this.missionNumber = missionNumber;
            this.proposee = proposee; // []
            this.agreed = agreed; // []
            this.disagreed = disagreed; // []
        }

        function Mission(missionNumber, team, result) {
            this.missionNumber = missionNumber;
            this.team = team;
            this.result = result; //FAILED || SUCCEEDED
        }

        function Testify(missionNumber, direction, accuser, accusee) {
            this.missionNumber = missionNumber;
            this.direction = direction; // "positive" / "negative"
            this.accuser = accuser;
            this.accusee = accusee; // []
        }
    /*
        ---------------------------
        Rules for deduction
        ---------------------------
     */

        /*
            Rule 1: Merlin should not approve any villain except Mordred in a vote
            - Likelihood: Decreasing by the number of villains in votes (base *30%)
            - Edge case: Game 4, where villain tolerance is increased by 1
            - Edge case: Mordred's existence.
         */
        function merlinApproveVillainInVote(votes, assumption) {
            var likelihood = 1;

            _.each(votes, function(vote) {
                if (vote.missionNumber != 3) {
                    if (_.indexOf(vote.agreed, assumption.merlin) !== -1) {
                            var villainCount = _.intersection(vote.proposee, assumption.visibleVillains).length;
                            if (villainCount > 0) {
                                likelihood *= calcDeduction(0.3, "non-linear", villainCount, null, "high");
                            }
                        }
                }
            });

            return likelihood;
        }

        /*
            Rule 2: As the game advances, it is less likely that Merlin proposes villains
            - Likelihood: Decreasing by each round (base *80%), and each number of villain
            - Edge case: Game 4, where there is a slightly higher chance
            - Edge case: Mordred's existence
         */
        function merlinProposeVillains(proposes, assumption) {
            var likelihood = 1;

            _.each(proposes, function(propose) {
                if (propose.proposer === assumption.merlin) {
                    var villainCount = _.intersection(propose.proposee, assumption.visibleVillains).length;

                    if (villainCount > 0) {
                        likelihood *= calcDeduction(0.8, "non-linear", villainCount, propose.missionNumber, "high");
                    }
                }
            });

            return likelihood;
        }

        /*
            Rule 3: In proposal 4, a villain is tend to propose another villain(s)
            - Likelihood: * 120%
            - Edge case: null
         */
        function villainProposeAnotherInRoundFour(proposes, assumption) {
            var likelihood = 1;

            _.each(proposes, function(propose) {
                if (propose.missionNumber == 3) { // Round 4 only
                    if (_.indexOf(assumption.villains, propose.proposer) !== -1) {
                        var otherVillainCount = _.intersection(propose.proposee, assumption.villains).length - 1;

                        if (otherVillainCount > 0) {
                            likelihood *= (otherVillainCount > 0) ? 1.2 : 1;
                        }
                    }
                }
            });
            return likelihood;
        }

        /*
            Rule 4: In a mission that fails, there can't be no villains
            - Likelihood: * 0
            - Edge case: if mission 4 fails, there must be 2 villains
         */
        function villainsInFailedMissions(missions, assumption) {
            var likelihood = 1;

            _.each(missions, function(mission) {
                if ((mission.missionNumber !== 3) && (mission.result === "FAILED")) {
                    if (_.intersection(mission.team, assumption.villains).length < 1) {
                        likelihood *= 0;
                    }
                } else if ((mission.missionNumber === 3) && (mission.result === "FAILED")) {
                    if (_.intersection(mission.team, assumption.villains).length < 2) {
                        likelihood *= 0;
                    }
                }
            });

            return likelihood;
        }

        /*
            Rule 5: Villains tend to not agree with missions without villains in
            - Likelihood: Decreasing by each round (base: 80%) and by number of villains agreed
            - Edge case: null
         */
         function villainsRejectProposesWithoutVillains(votes, assumption) {
             var likelihood = 1;

             _.each(votes, function(vote) {
                 var villainsInMissionCount = _.intersection(vote.proposee, assumption.villains).length;
                 var villainsInAgreed = _.intersection(vote.agreed, assumption.villains).length;

                 if ((villainsInMissionCount === 0) && (villainsInAgreed > 0)) {
                     likelihood *= calcDeduction(0.8, "non-linear", villainsInAgreed, vote.missionNumber, "medium");
                 }
             });

             return likelihood;
         }

         /*
            Rule 6: "My role" is certain, so get rid of all other permutations
            - Likelihood: *0
            - This is not the most efficient.. but will do for now
          */
         function myRoleCertain(myRole, myPosition, assumption) {
             var imMerlin = (assumption.merlin === myPosition) && (myRole === "merlin");
             var imPercival = (assumption.percival === myPosition) && (myRole === "percival");
             var imMorgana = (assumption.morgana === myPosition) && (myRole === "morgana");
             var imAssasin = (assumption.assasin === myPosition) && (myRole === "assasin");
             var imMordred = (assumption.mordred === myPosition) && (myRole === "mordred");
             var imDummy = (assumption.dummy === myPosition) && (myRole === "dummy");

             if (imMerlin || imPercival || imMorgana || imAssasin || imMordred || imDummy) {
                 return 1;
             } else {
                 return 0;
             }
         }



    /*
        ---------------------------
        Assumption
        ---------------------------
     */
        /*
            Assumption class to store assumptions for running deduction
            @example var assumption = new Assumption(1,3,6,2,4,7);
            @param playerIds
         */
        function Assumption(merlin, percival, morgana, assasin, mordred, dummy) {
            this.merlin = merlin;
            this.percival = percival;
            this.morgana = morgana;
            this.assasin = assasin;
            this.mordred = mordred;
            this.dummy = dummy;
            this.villains = (dummyInGame) ? [morgana, assasin, mordred, dummy] : [morgana, assasin, mordred];
            this.visibleVillains = (dummyInGame) ? [morgana, assasin, dummy] : [morgana, assasin];
            this.heroes = [merlin, percival];
        }

    /*
        ---------------------------
        Main deduction (main)
        ---------------------------
     */

        /*
            Generate possible assumptions and calculate likelihood for each.
            It's possible to do optimization here: instead of generating all patterns,
            only generate those with a higher possibility.
         */
        function runDeduction() {
            players = [];
            for (var i = 0; i < noOfPlayers; i++) {
                var player = new Player();
                players.push(player);
            }
            var initialArray = []; // [0,1,2,3,4,...]
            for (var j = 0; j < noOfPlayers; j++) {
                initialArray.push(j);
            }
            // Permutation for [0,1,2,3] -> [ [0,1,2,3], [1,0,2,3], [0,1,3,2],... ]
            var permutations = initialArray.reduce(function permute(res, item, key, arr) {
                return res.concat(arr.length > 1 && arr.slice(0, key).concat(arr.slice(key + 1)).reduce(permute, []).map(function(perm) {
                    return [item].concat(perm); }) || item);
                }, []);

            _.each(permutations, function(permutation) {
                // function Assumption(merlin, percival, morgana, assasin, mordred, dummy)
                // OMG this is ugly
                var merlin = permutation[0];
                var percival = permutation[1];
                var morgana = permutation[2];
                var assasin = permutation[3];
                var mordred = permutation[4];
                var dummy = dummyInGame ? permutation[5] : null;
                var assumption = new Assumption(merlin, percival, morgana, assasin, mordred, dummy);

                // chain each validator and calculate the likelihood
                var likelihood = 1 * merlinApproveVillainInVote(votes, assumption) *
                                    merlinProposeVillains(proposes, assumption) *
                                    villainProposeAnotherInRoundFour(proposes, assumption) *
                                    villainsInFailedMissions(missions, assumption) *
                                    villainsRejectProposesWithoutVillains(votes, assumption) *
                                    myRoleCertain(myRole, myPosition, assumption);

                if (likelihood >= possibleThreshold) {
                    players[merlin].isMerlin += likelihood;
                    players[merlin].isHero += likelihood;

                    players[percival].isPercival += likelihood;
                    players[percival].isHero += likelihood;

                    players[morgana].isMorgana += likelihood;
                    players[morgana].isVillain += likelihood;

                    players[assasin].isAssasin += likelihood;
                    players[assasin].isVillain += likelihood;

                    players[mordred].isMordred += likelihood;
                    players[mordred].isVillain += likelihood;

                    if (dummyInGame) {
                        players[dummy].isDummy += likelihood;
                        players[dummy].isVillain += likelihood;
                    }
                }
            });
            console.log(players);
        }


    /*
        ---------------------------
        Helper methods
        ---------------------------
    */

        /*
            Helper to calculate deduction of possibilities
            @param base: the base percentage given all the rest default
            @method: specify "linear" or "non-linear"
            @climb: turns / rounds
            @steepness: "high", "medium", "low"
            @example:
                base = 0.3, method = "non-linear" , climbUno = 3, climbDos = 1, steepness = "high"
                -> output: 0.3 / (4 * 2 * 1.2)
                base = null, method = null, climbUno = null, climbDos = null, steepness = null
                -> output: 1 / (1 * 1 * 1)
                base = 0.5, method = "linear", climbUno = 2, climbDos = 1, steepness = "low"
                -> output: 0.5 * (10 - 2 - 1 - 2) / 10 * 0.9
       */
      function calcDeduction(base, method, climbUno, climbDos, steepness) {
          var deducted = 1;
          if ((!climbUno) && (!climbDos)) return 1;

          // Normalize input
          base = base || 1;
          method = method || "non-linear";
          climbUno = climbUno || 0;
          climbDos = climbDos || 0;
          steepness = slope[(steepness || "medium")];

          // Non linear deduction
          if (method === "non-linear") {
              deducted = base / ((climbUno + 1) * (climbDos + 1) * (steepness));
          }

          // Linear deduction
          // In all cases for the game, count of villain + count of rounds <= 7 (both start at 0). Otherwise this function would not work
          if (method === "linear") {
              deducted = base * ((10 - climbUno - climbDos - 2) / 10) * steepness;
          }

          return deducted;
      }
