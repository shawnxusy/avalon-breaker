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
        ---------------------------
     */
        function Propose() {
            this.missionNumber = 1;
            this.proposer = null;
            this.proposee = [];
        }

        function Vote() {
            this.missionNumber = 1;
            this.proposee = [];
            this.agreed = [];
            this.disagreed = [];
        }

        function Mission() {
            this.missionNumber = 1;
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
        - Likelihood: Increased by the number of villains in votes
        - Edge case: Game 4, where villain tolerance is increased by 1
        - Edge case: Mordred's existence.
     */
        function merlinApproveVillainInVote(votes, assumption) {
            var likelihood = 1;

            _.each(votes, function(vote) {
                if (vote.missionNumber != 4) {
                    if (_.indexOf(vote.agreed, assumption.merlin) !== -1) {
                            var villainCount = _.intersection(vote.proposee, assumption.visibleVillains).length;
                            likelihood *= 0.3 / villainCount;
                            console.log("Merlin approved " + villainCount + " villains in vote number " +
                                        vote.missionNumber + ". Likelihood *= " + likelihood);
                        }
                }
            });

            return likelihood;
        }

    /*
        Rule 2: As the game advances, it is less likely that Merlin proposes villains
        - Likelihood: Increasing by each round
        - Edge case: Game 4, where villain tolerance is increased by 1
        - Edge case: Mordred's existence
     */
        function merlinProposeVillains(proposes, assumption) {
            var likelihood = 1;

            return likelihood;
        }

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

})();
