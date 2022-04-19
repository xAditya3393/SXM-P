/*
  Mars Rover
  
  You are to build the backing logic behind an API to navigate a bidirectional rover along a two dimensional cartesian plain (x,y) representation of the planet Mars. Each point will include a topographical label designating the terrain at that location.
  
  Map Example:

  (0,0)
   	['P', 'P', 'P', 'C', 'P'],
	  ['P', 'M', 'P', 'C', 'P'],
	  ['P', 'M', 'P', 'C', 'P'],
	  ['P', 'M', 'P', 'P', 'P'],
	  ['P', 'M', 'P', 'P', 'P']
                          (4,4)

  Details:
  
  - The rover when initialized will be provided an initial starting point (x, y) as well as a starting direction (N, S, E, W) that the rover is facing
  - The rover should receive its commands as a string array. e.g. ['F', 'B', 'L', R']
  - The rover may move forward and backward with the (F, B) character commands
  - The rover may turn left and right with the (L, R) character commands
  - The rover should execute all given commands in sequence
    - If: The rover is given a valid command
      - Then: Update the rovers direction or location
    - If: All commands have been executed 
      - Then: return an OK status along with the location and direction
    - If: The rover is provided a command that would result in the rover entering terrain that is an obstacle
      - Then: return an OBSTACLE status code along with the last successful location and direction of the rover
    - If: The rover is provided an invalid command
      - Then: return an INVALID_COMMAND status code along with the last successful location and direction of the rover
    - If: The rover is given a command that would result in leaving the edge of the world
      - Then: return an OBSTACLE status code along with the last successful location and direction of the rover
  
  Further Instructions:
  
  - Implement your code to make the below tests pass
  - Feel free to modify any code you wish to suit your preference. Also, don't feel limited to methods provided feel free add more (encouraged)
  - If you modify exercise code (i.e use functional instead of class based Rover) you'll need to modify the tests accordingly
  - Read the tests! They have helpful in better understanding the requirements
  
  Extra Credit:

  The below extra credit is optional (really).
  
  - add a moveTo() method that takes the (x,y) coordinates to move the rover along the most optimal path bypassing obstacles
  - https://en.wikipedia.org/wiki/A*_search_algorithm
  - https://en.wikipedia.org/wiki/Dijkstra's_algorithm
*/

const TERRAIN_TYPES = {
	'P': {
  	obstacle: false,
    description: 'plains'
  },
  'M': {
  	obstacle: true,
    description: 'mountains'
  },
  'C': {
  	obstacle: true,
    description: 'crevasse'
  }
};


const STATUS_CODES = ['OK', 'OBSTACLE', 'INVALID_COMMAND'];

// top left corner is (X:0, Y:0)
// bottom right is (X:4, Y:4)
const WORLD = [
	['P', 'P', 'P', 'C', 'P'],
	['P', 'M', 'P', 'C', 'P'],
	['P', 'M', 'P', 'C', 'P'],
	['P', 'M', 'P', 'P', 'P'],
	['P', 'M', 'P', 'P', 'P']
];

const DIRECTIONS = ['N', 'S', 'E', 'W'];
const COMMANDS = ['L', 'R', 'F', 'B'];

// Start: Exercise Code (Your Code)

// YOUR CODE BELOW
// NOTE: cntrl + enter to run tests
// Note: integrated firebug for console logs


/*

Looking through test case, I have based the code on the following additional requirements:
1. Commands forward and backward -> change rover location, but doesn't change rover direction
2. Commands left and right change -> change rover direction, but doesn't change rover location


Following are some assumptions made while building logic:
1. North, South, East and West directions 

            N
            |
            |
            |
  W ----------------- E
            |
            |
            |
            S


2. X-Y axis on world

const WORLD = [
          
      C1   C2   C3   C4   C5
  R1 ['P', 'P', 'P', 'C', 'P'],
	R2 ['P', 'M', 'P', 'C', 'P'],
	R3 ['P', 'M', 'P', 'C', 'P'],
	R4 ['P', 'M', 'P', 'P', 'P'],
	R5 ['P', 'M', 'P', 'P', 'P']
  
  Y
  
  ^
  |
  |
  ------> X
];


3. The commands are to be executed from rover's frame of reference  
eg: left command in south direction from main frame of reference(anyone viewing the code) -> west
left command in south direction from rover's frame of reference -> east

4. If the rover is initialized with invalid direction -> if not, assigning random direction from available directions

5. Commands are always provided as an array object -> if not, provided some input validating test cases

6. World has same dimensions for both width(x-axis) and length(y-axis) ie. nxn matrix 
*/


const WORLD_WIDTH = 5;
const WORLD_LENGTH = 5;

//numbers represent rows in roverCommandMovement
var directionMap = new Map();
directionMap.set('N', 0);
directionMap.set('S', 1);
directionMap.set('E', 2);
directionMap.set('W', 3);

//numbers represent columns in roverCommandMovement
var commandMap = new Map();
commandMap.set('F', 0);
commandMap.set('B', 1);
commandMap.set('R', 2);
commandMap.set('L', 3);

//2-D array representing rover's change in direction and location per cell
//eg: rover direction - South, command - Backward => row 1 (from directionMap), column 1 (from commandMap)] 
//roverCommandMovement[1][1] = [[0,1], 'S'] -> change in location - [0,1], change in direction - 'S'  
var roverCommandMovement = [

  [ [[-1,0], 'N'] , [[1,0], 'N'] , [[0,0], 'E'] , [[0,0], 'W'] ],
  [ [[1,0], 'S'] , [[-1,0], 'S'] , [[0,0], 'W'] , [[0,0], 'E'] ],
  [ [[0,1], 'E'] , [[0,-1], 'E'] , [[0,0], 'S'] , [[0,0], 'N'] ],
  [ [[0,-1], 'W'] , [[0,1], 'W'] , [[0,0], 'N'] , [[0,0], 'S'] ]
   
];



class Rover {  

  constructor(location, direction) {
    this.location = location;
    this.direction = directionMap.has(direction) ? direction : directionMap.has(Math.floor(Math.random()));
    this.status = this.validateLocation(location);
  }

  //Stores commands and returns state of rover after all commands are executed
  command(commands) {
    this.commands = Array.isArray(commands) ? commands: [];
    const executionStatus = this.executeCommands();
    return executionStatus;
  }

  
  //returns status code, based on whether location is plain, mountain, crevasse or out of world
  validateLocation(location){

    let xCoordinateValidity = (location[0] >= 0 && location[0] < WORLD_WIDTH);
    let yCoordinateValidity = (location[1] >= 0 && location[1] < WORLD_LENGTH);

    if(xCoordinateValidity && yCoordinateValidity){

      let terrainType = Object.keys(TERRAIN_TYPES).find(key => TERRAIN_TYPES[key].description === 'plains');

      if(WORLD[location[0]][location[1]] == terrainType) {
        return STATUS_CODES[0];
      }

    }

    return STATUS_CODES[1];

  }

  //validates single command 
  validateCommand(commandIndex){
      
    let result = STATUS_CODES[0];
    
    let command = this.commands[commandIndex]; 
    if(!commandMap.has(command)){
      result = STATUS_CODES[2];
    }

    return result;
  }
  


  //Executes all the commands and returns rover state upon executing valid commands  
  //picks each command, validates it and updates rover state only if resulting position is valid
  //stops on last valid rover state, if invalid command is encountered
  executeCommands(){

    let commandLength = this.commands.length;

    for (let commandindex = 0; commandindex < commandLength; commandindex++) {

      let currentCommand = this.commands[commandindex];
      let checkValidCommand = this.validateCommand(commandindex);

      if(checkValidCommand === STATUS_CODES[0]){
      
        let commandMapIndex = commandMap.get(currentCommand);
        let directionMapIndex = directionMap.get(this.direction);

        let updateLocationAndDirection = roverCommandMovement[directionMapIndex][commandMapIndex];

        let [updateLocation, updateDirection] = updateLocationAndDirection;

        let newLocation = [this.location[0] + updateLocation[0], this.location[1] + updateLocation[1]];
        let newDirection = updateDirection;
        
        let newLocationStatus = this.validateLocation(newLocation);

        if(newLocationStatus === STATUS_CODES[0]){
          this.location = newLocation;
          this.direction = newDirection;
          this.status = newLocationStatus;
        }
        else{
          this.status = newLocationStatus;
          break;
        }

      }
      else{
          this.status = STATUS_CODES[2];
          break;
      }
    }

  
    return {
      status: this.status,
      loc: this.location,
      dir: this.direction
    };
  }



  //Extra credit
  moveTo(destination){
    let source = this.location;
    let computationObject = new shortestPathComputation(source, destination);
    let result = computationObject.shortestPathAlgorithm();
    return result;
  }


}


//Setting up mapping for tile and list of all possible adjacent tiles for which rover can move
//Since rover cannot be initialized to obstacle -> there is no adjacent list of tiles
//Furthermore, no tile can have an obstacle tile as their adjacent tile
const ADJACENCY_LIST = [

  [ [ [1,0], [0,1] ] , [ [0,0] , [0,2] ] , [ [1,2], [0,1] ] , [ ], [ [1,4] ] ],
  [ [ [0,0], [2,0] ] , [ ] , [ [0,2], [2,2] ] , [ ], [ [0,4], [2,4] ] ],
  [ [ [1,0], [3,0] ] , [ ] , [ [1,2], [3,2] ],[ ], [ [1,4], [3,4] ] ],
  [ [ [2,0], [4,0] ] , [ ] , [ [2,2], [4,2], [3,3] ] , [ [4,3], [3,2], [3,4] ],  [ [2,4], [4,4], [3,3] ] ],
  [ [ [3,0] ], [ ], [ [3,2], [4,3] ], [ [3,3], [4,2], [4,4] ], [ [3,4], [4,3] ]]
   
];




//Source -> starting tile of rover
//destination -> ending tile of rover

//Function to validate destination tile - same as validateLocation in rover class
//can reuse one common function for both classes, but validateLocation is part of rover functionality (just personal preference)
//considering validating destination as a non integral function to shortestPathComputation class
const validateDestination = (location) => {

  let xCoordinateValidity = (location[0] >= 0 && location[0] < WORLD_WIDTH) ? true : false;
  let yCoordinateValidity = (location[1] >= 0 && location[1] < WORLD_LENGTH) ? true : false;

  if(xCoordinateValidity && yCoordinateValidity){

    let terrainType = Object.keys(TERRAIN_TYPES).find(key => TERRAIN_TYPES[key].description === 'plains');

    if(WORLD[location[0]][location[1]] == terrainType) {
      return STATUS_CODES[0];
    }

  }

  return STATUS_CODES[1];

}
 
//Dijkstra's algorithm with bfs traversal
//Computes shortest path using breath first seach algorithm using queue
//we can consider all tiles in the world as a connected graph with uniform weighted edges (1 unit in this case)
//Queue data structure is used over a priority queue as we have uniform weighted edges -> every adjacent tile has equal priority
class shortestPathComputation{

  constructor(source, destination){
    this.source = source;
    this.destination = destination;


    //MINIMUM_DISTANCE_FROM_SOURCE -> 2-D Matrix storing minimum distance from source to (i,j)th tile 
    //VERTICES_WITH_UNEXPLORED_EDGES -> Queue data structure storing nodes who's adjacency list is unevaluated
    //NEAREST_PARENT -> 2-D Matrix storing nearest tile used to reach any (i,j)th tile   
    this.MINIMUM_DISTANCE_FROM_SOURCE = [];
    this.VERTICES_WITH_UNEXPLORED_EDGES = [];
    this.NEAREST_PARENT = [];
  }

  //Initializes minimum distance matrix
  //distance from starting tile to itself -> 0
  //rest all are marked -> Infinity, as we aren't aware initially on how each tile can be reached with minimum distance (initial value denoting unknown result)  
  initializeMinimumDistance(){

    let source = this.source;

    for(let row = 0; row < WORLD_WIDTH; row++){
      this.MINIMUM_DISTANCE_FROM_SOURCE.push([0]);
      for(let col = 0; col < WORLD_LENGTH; col++){
        if(WORLD[row][col] == 'P' && (row == source[0] && col == source[1])){
          this.MINIMUM_DISTANCE_FROM_SOURCE[row][col] = 0;
        }
        else{
          this.MINIMUM_DISTANCE_FROM_SOURCE[row][col] = Infinity;
        }
      }
    }
  }
  
  //Initializes nearest parent matrix
  //rover starts from starting tile -> -1, as it hasn't travelled through any tile to reach here
  //rest all are marked -> [Infinity,Infinity], as we aren't aware initially on how they will be approached (initial value denoting unknown result)
  initializeNearestParent(){

    let source = this.source;

    for(let row = 0; row < WORLD_WIDTH; row++){
      this.NEAREST_PARENT.push([0]);
      for(let col = 0; col < WORLD_LENGTH; col++){
        
        if(WORLD[row][col] == 'P' && (row == source[0] && col == source[1])){
          this.NEAREST_PARENT[row][col] = -1;
        }
        else{
          this.NEAREST_PARENT[row][col] = [Infinity,Infinity];
        }
          
      }
    }
  }


  shortestPathAlgorithm() { 
	  this.initializeMinimumDistance();
    this.initializeNearestParent();


    //Creating result object to store minimum tiles travelled and path taken to reach 
    let roverStatus = { };
    roverStatus.tilesToReachDestination = Infinity;
    roverStatus.roverMovementToDestination = Infinity; 

    //Validating destination status -> return if destination is mountain, crevasse or out of world 
    let destination = this.destination;
    let destinationValidity = validateDestination(destination);


    if(destinationValidity != STATUS_CODES[0]){
      return roverStatus;
    }
    

    this.VERTICES_WITH_UNEXPLORED_EDGES.push(this.source); 
    let queueLength = this.VERTICES_WITH_UNEXPLORED_EDGES.length;


    while(queueLength != 0) 
    { 
      //remove first element to be processed and decrease queue lenght 
      let currentTile = this.VERTICES_WITH_UNEXPLORED_EDGES.shift();  
      queueLength--;

      //get the list of all adjacent tiles
      let adjacentTiles = ADJACENCY_LIST[currentTile[0]][currentTile[1]];
          
      //for each adjacent tile in list -> evaluate the minimum distance and nearest parent from current tile
      for(let adjtileIndex = 0; adjtileIndex < adjacentTiles.length; adjtileIndex++){

        let adjacentTile = adjacentTiles[adjtileIndex];
        let distance_between_source_to_currentTile = this.MINIMUM_DISTANCE_FROM_SOURCE[currentTile[0]][currentTile[1]];
        let current_minimum_distance_between_source_to_adjacentTile = this.MINIMUM_DISTANCE_FROM_SOURCE[adjacentTile[0]][adjacentTile[1]];

        //Updates minimum distance and nearest parent only if current tile can be reached faster from source
        //Also inserts the adjacent tile for evaluation in the queue as a possible candidate for shortest path  
        if(distance_between_source_to_currentTile + 1 < current_minimum_distance_between_source_to_adjacentTile){
          this.MINIMUM_DISTANCE_FROM_SOURCE[adjacentTile[0]][adjacentTile[1]] = distance_between_source_to_currentTile + 1;
          this.NEAREST_PARENT[adjacentTile[0]][adjacentTile[1]][0] = currentTile[0];
          this.NEAREST_PARENT[adjacentTile[0]][adjacentTile[1]][1] = currentTile[1];
          this.VERTICES_WITH_UNEXPLORED_EDGES.push(adjacentTile);
          queueLength++;
          
        }

      }

    }

    //setting calculated distance and path into the result object
    if(this.MINIMUM_DISTANCE_FROM_SOURCE[destination[0]][destination[1]] != Infinity){
        roverStatus.tilesToReachDestination = this.MINIMUM_DISTANCE_FROM_SOURCE[destination[0]][destination[1]];
        roverStatus.roverMovementToDestination = this.roverPathToDestination(); 
    }

    return roverStatus;
  } 

  roverPathToDestination(){
    
    let path = [];
    let destination = this.destination;

    path.push(destination);
    let currentParent = this.NEAREST_PARENT[destination[0]][destination[1]];

    while(currentParent != -1){
        path.unshift(currentParent);
        currentParent = this.NEAREST_PARENT[currentParent[0]][currentParent[1]];
    }

    return path;
  }

}

/*

As an extension -> If we were to directly add heuristic distances and change edge distance between tiles from 1 to (1 + euclidian distance)
1. This would change uniform wieghted grapth to a non-uniform weighted graph, as it would penalize a geographically father distanced tile from destination
2. Implementation would change queue data structure to a priority queue(minimum heap), prioritizing adjacent tile with minimum edge distance 

A* search algorithm
we can use the euclidian distance from source to any tile as a sorting criteria by using priority queue for adjacent tiles with uniform weighted edges  
   
*/



// End: Exersize Code (Your code)

// Test Specs
// Adding and Changing test cases based on the additional requiremnts and assumptions listed above  

mocha.setup('bdd');

const expect = chai.expect;

describe('Mars Rover', function() {
  let rover1 = null, rover2 = null;
  beforeEach(function() {
    rover1 = new Rover([2,2], 'N');
    rover2 = new Rover([6,6], 'X');
  });


	describe('When the Mars Rover is initialized', function() {
  	it('should set the starting location', function() {
      expect(rover1.location).to.deep.equal([2,2]);
    });
    it('should set the starting direction', function() {
    	expect(rover1.direction).to.equal('N');
    });
    
    // Added cases for invalid initialization
    it('should check status if initialized to out of world', function() {
      expect(rover2.status).to.equal('OBSTACLE');
    });
    it('should check direction if initialized to invalid direction', function() {
      let random_direction = rover2.direction;
      expect(rover2.direction).to.equal(random_direction);
    });
    it('should set required status if initialized to mountain [or] crevasse', function() {
      let rover = new Rover([2,1], 'N') 
      expect(rover.status).to.equal('OBSTACLE');
    });
  });

  describe('When the rover receives commands', function() {
  	it('should store the commands', function() {
      const status = rover1.command(['F', 'F', 'B']);
      expect(rover1.commands).to.deep.equal(['F', 'F', 'B']);
    });
    it('should handle invalid commands', function() {
    	const status = rover1.command(['X']);
      expect(status).to.deep.equal({
      	status: 'INVALID_COMMAND',
        loc: [2,2],
        dir: 'N'
      });
    });

    //Added case for command input validation
    it('should handle invalid commands -> command = null', function() {
      const status = rover2.command(null);
      expect(rover2.commands).to.deep.equal([]);
    });
    it('should handle invalid commands -> command = undefined', function() {
      const status = rover2.command(undefined);
      expect(rover2.commands).to.deep.equal([]);
    });
    it('should handle invalid commands -> command = String', function() {
      const status = rover2.command("N");
      expect(rover2.commands).to.deep.equal([]);
    });
    it('should handle invalid commands -> command = jsonObject', function() {
      const status = rover2.command({'command1': 'N', 'command2': 'E'});
      expect(rover2.commands).to.deep.equal([]);
    });
    it('should handle invalid commands -> command = object', function() {
      const status = rover2.command({command1: 'N', command2: 'E'});
      expect(rover2.commands).to.deep.equal([]);
      
    });
    it('should handle invalid commands -> command = nan', function() {
      const status = rover2.command(NaN);
      expect(rover2.commands).to.deep.equal([]);
    });
    it('should handle invalid commands -> command = number', function() {
      const status = rover2.command(3);
      expect(rover2.commands).to.deep.equal([]);
    });
    it('should handle invalid commands -> command = boolean', function() {
      const status = rover2.command(true);
      expect(rover2.commands).to.deep.equal([]);
    });
    it('should handle invalid commands -> command = bigInt', function() {
      const status = rover2.command(BigInt);
      expect(rover2.commands).to.deep.equal([]);
    });
    it('should handle invalid commands -> command = Symbol', function() {
    	const status = rover2.command(Symbol('N'));
      expect(rover2.commands).to.deep.equal([]);
    });
  });


  describe('When the rover executes valid commands', function() {
  	describe('When facing north', function() {
    	describe('When moving forward', function() {
      	it('should move north one tile', function() {
          const status = rover1.command(['F']);
          expect(status).to.deep.equal({
            status: 'OK',
            loc:[1,2], //loc: [2,1],
            dir: 'N'
          });
        });
      });
      describe('When moving backward', function() {
      	it('should move south one tile', function() {
          const status = rover1.command(['B']);
          expect(status).to.deep.equal({
            status: 'OK',
            loc:[3,2], //loc: [2,3],
            dir: 'N'
          });
        });
      });
      describe('When turning left', function() {
      	it('should be facing west', function() {
          const status = rover1.command(['L']);
          expect(status).to.deep.equal({
            status: 'OK',
            loc: [2,2],
            dir: 'W'
          });
        });
      });
      describe('When turning right', function() {
      	it('should be facing east', function() {
          const status = rover1.command(['R']);
          expect(status).to.deep.equal({
            status: 'OK',
            loc: [2,2],
            dir: 'E'
          });
        });
      });
    });
  });
  describe('When the rover encounters obstacles', function() {
  	describe('When encountering a mountain', function() {
    	it('should stop and return status', function() {
      	const status = rover1.command(['L', 'F']);
        expect(status).to.deep.equal({
          status: 'OBSTACLE',
          loc: [2,2],
          dir: 'W'
        });
      });
    });
    describe('When encountering a crevasse', function() {
    	it('should stop and return status', function() {
      	const status = rover1.command(['F', 'F', 'R', 'F']);
        expect(status).to.deep.equal({
          status: 'OBSTACLE',
          loc: [0,2], 
          dir: 'E'
        });
      });
    })
    describe('When encountering the edge of the world', function() {
    	it('should stop and return status', function() {
      	const status = rover1.command(['F', 'F', 'F']);
        expect(status).to.deep.equal({
          status: 'OBSTACLE',
          loc: [0,2], //loc: [2,0],
          dir: 'N'
        });
      });
    });
  });


  //moveTo() test cases when destination can be reached
  describe('Shortest Path Computation - Path Available', function() {
  	describe('Straight path from source to destination', function() {
    	it('return number of tiles moved and resulting path of tiles as an object', function() {
      	const status = rover1.moveTo([0,2]);
        expect(status).to.deep.equal({
          tilesToReachDestination: 2,
          roverMovementToDestination: [[2,2], [1,2], [0,2]] 
        });
      });
    });
    describe('Going around Obstacle from source to destination', function() {
    	it('return number of tiles moved and resulting path of tiles as an object', function() {
      	const status = rover1.moveTo([0,4]);
        expect(status).to.deep.equal({
          tilesToReachDestination: 6,
          roverMovementToDestination: [[2,2], [3,2], [3,3], [3,4], [2,4], [1,4], [0,4] ] 
        });
      });
    });
    describe('Multiple paths from source to destination', function() {
    	it('return number of tiles moved', function() {
      	const status = rover1.moveTo([4,4]);

        expect(status.tilesToReachDestination).to.deep.equal(4);
      });
      it('return resulting path of tiles', function() {
      	const status = rover1.moveTo([4,4]);

        let resultingPaths = new Set();
        resultingPaths.add([[2,2], [3,2], [4,2], [4,3], [4,4] ].toString());
        resultingPaths.add([[2,2], [3,2], [3,3], [3,4], [4,4] ].toString());
        
        let answerContainsInresultingPaths =  resultingPaths.has(status.roverMovementToDestination.toString());

        expect(answerContainsInresultingPaths).to.deep.equal(true);
      });
    });
  });

  //moveTo() test cases when destination cannot be reached
  describe('Shortest Path Computation - No Path Available', function() {
  	describe('Destination is Crevasse', function() {
    	it('should return object with no result', function() {
      	const status = rover1.moveTo([0,3]);
        expect(status).to.deep.equal({
          tilesToReachDestination: Infinity,
          roverMovementToDestination: Infinity 
        });
      });
    })
    describe('Destination is Mountain', function() {
    	it('should return object with no result', function() {
      	const status = rover1.moveTo([1,1]);
        expect(status).to.deep.equal({
          tilesToReachDestination: Infinity,
          roverMovementToDestination: Infinity 
        });
      });
    });
    describe('Destination is out of the world', function() {
    	it('should return object with no result', function() {
      	const status = rover1.moveTo([-6,-6]);
        expect(status).to.deep.equal({
          tilesToReachDestination: Infinity,
          roverMovementToDestination: Infinity 
        });
      });
    });
  });

});

mocha.run();