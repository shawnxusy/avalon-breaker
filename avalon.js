(function() {
'use strict';

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

    /*
        ---------------------------
        General class (role) settings
        ---------------------------
     */
        function Player() {
            this.isHero = 0; // Possibility of being morgana, same below
            this.isVillain = 0;
            this.isInnocent = 1;
            this.isMorgana = 0;
            this.isAssasin = 0;
            this.isMordred = 0;
            this.isMerlin = 0;
            this.isPercival = 0;
            this.isDummy = 0;
            this.identity = new Innocent();
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
        var noOfPlayers, noOfVillains, noOfHeroes, noOfInnos; // noOfPlayers = sum(rest);

        var players = _.fill(Array(noOfPlayers), new Player()); //jshint ignore:line


    /*
        ---------------------------
        Device to record game rounds
        !important: missionNumber starts at 0 (round 1 -> missionNumber : 0)
        ---------------------------
     */
        function Propose() {
            this.missionNumber = 0;
            this.proposer = null;
            this.proposee = [];
        }

        function Vote() {
            this.missionNumber = 0;
            this.proposee = [];
            this.agreed = [];
            this.disagreed = [];
        }

        function Mission() {
            this.missionNumber = 0;
            this.team = [];
            this.result = null;
        }
    /*
        ---------------------------
        Rules for deduction
        ---------------------------
     */

    /*
        Rule 1: Merlin should not approve any villain except Mordred in a vote
        - Likelihood: Increased by the number of villains in votes (base 30%)
        - Edge case: Game 4, where villain tolerance is increased by 1
        - Edge case: Mordred's existence.
     */
        function merlinApproveVillainInVote(votes, assumption) {
            var likelihood = 1;

            _.each(votes, function(vote) {
                if (vote.missionNumber != 4) {
                    if (_.indexOf(vote.agreed, assumption.merlin) !== -1) {
                            var villainCount = _.intersection(vote.proposee, assumption.visibleVillains).length;
                            likelihood *= calcDeduction(0.3, "non-linear", villainCount, null, "high");
                            console.log("Merlin approved " + villainCount + " villains in vote number " +
                                        vote.missionNumber + ". Likelihood *= " + likelihood);
                        }
                }
            });

            return likelihood;
        }

    /*
        Rule 2: As the game advances, it is less likely that Merlin proposes villains
        - Likelihood: Increasing by each round (base 80%), and each number of villain
        - Edge case: Game 4, where there is a slightly higher chance
        - Edge case: Mordred's existence
     */
        function merlinProposeVillains(proposes, assumption) {
            var likelihood = 1;

            _.each(proposes, function(propose) {
                if (propose.proposer === assumption.merlin) {
                    var villainCount = _.intersection(propose.proposee, assumption.visibleVillains).length;
                    likelihood *= calcDeduction(0.8, "non-linear", villainCount, propose.missionNumber, "high");
                    console.log("Merlin proposed " + villainCount + " villains in propose number " +
                                propose.missionNumber + ". Likelihood *= " + likelihood);
                }
            });

            return likelihood;
        }

    /*
        Rule 3: 
        - Likelihood:
        - Edge case:
     */

    /*
        ---------------------------
        Assumption + deduction
        ---------------------------
     */
     // assumption {merlin: 1; mordred: 3; ...}

     /*
        ---------------------------
        Recording actual game progress
        ---------------------------
      */
      function Progress() {
          this.proposes = [];
          this.votes = [];
          this.missions = [];
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

})();
