// 0: ship placement
// 1: player's turn
// 2: computer's turn
// 3: finished
let gameState = 0;

// get a random integer between 2 values
const getRandomInt = (min, max) => {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // maximum is exclusive and the minimum is inclusive
}

// get a random position on the 10x10 board that a ship can be placed
const generateShipPosition = (shipWidth, shipHeight, fillMatrix) => {
  let positionValid = false;
  let x, y = 0;

  while (!positionValid) {
    x = getRandomInt(0, 10);
    y = getRandomInt(0, 10);
    if (x + shipWidth <= 10 && y + shipHeight <= 10) {
      for (i = x; i < x + shipWidth; i++) {
        for (j = y; j < y + shipHeight; j++) {
          positionValid = fillMatrix[j][i] == 0;
        }
      }
    }
  }

  return new Vector2(x, y);
}

// get a random position on the 10x10 board that a bomb can be placed
const generateBombPosition = (fillMatrix) => {
  let positionValid = false;
  let x, y = 0;

  while (!positionValid) {
    x = getRandomInt(0, 10);
    y = getRandomInt(0, 10);
    positionValid = (fillMatrix[y][x] == 0 || fillMatrix[y][x] == 1);
  }

  return new Vector2(x, y);
}

class Vector2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Cell {
  constructor(element) {
    this.element = element;
    this.element.classList.add('cell');
    this.size = 30.0;
  }

  setId(id) {
    this.element.id = id;
  }

  setPosition(left, top) {
    this.position = new Vector2(left, top);
    this.element.style.position = 'absolute';
    this.element.style.left = `${left}px`;
    this.element.style.top = `${top}px`;
  }

  listen(event, callback) {
    this.element.addEventListener(event, callback);
  }
}

class Board {
  constructor(element) {
    this.element = element;
    this.id = element.id;

    this.position = new Vector2(element.style.left, element.style.top);
    this.size = 10;

    // How many cells of ships remaining
    this.shipsCellLeft = 20;

    // 10x10 2D array representing the board
    // 0: empty
    // 1: filled
    // 2: static (already clicked)
    this.fillMatrix = Array(this.size).fill().map(() => Array(this.size).fill(0));
  }

  // fill the board with cells
  populate() {
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        let cell = new Cell(document.createElement('div'));

        cell.setId(`${this.id}-cell${x}${y}`);
        cell.setPosition(this.position.x + x * cell.size, this.position.y + y * cell.size);

        cell.listen('mouseover', () => {
          if (this.fillMatrix[y][x] != 2) {
            cell.element.style.border = '2px solid #222f3e';
          }
        });
        cell.listen('mouseout', () => {
          if (this.fillMatrix[y][x] != 2) {
            cell.element.style.border = '1px solid #8395a7';
          }
        });

        // only run this code for player board
        if (this.id == 'player-board') {
          // handle drag n drop ships on board
          cell.listen('dragover', (event) => {
            event.preventDefault();
          });

          cell.listen('drop', (event) => {
            const shipId = event.dataTransfer.getData('shipId');
            const shipWidth = parseInt(event.dataTransfer.getData('shipWidth'));

            // ship position validation
            if (x + shipWidth > 10) return;
            for (let i = x; i < x + shipWidth; i++) {
              if (this.fillMatrix[y][i] == 1) return;
            }

            document.getElementById(shipId).style.position = 'absolute';
            document.getElementById(shipId).style.top = `${parseFloat(cell.position.y) - 30.0 - 10.0 - 300.0}px`;
            document.getElementById(shipId).style.left = `${parseFloat(cell.position.x) + 10.0}px`;

            // update fill matrix
            for (let i = x; i < x + shipWidth; i++) {
              this.fillMatrix[y][i] = 1;
            }
            // Update game when all player ships have been placed
            let fillCount = 0;
            this.fillMatrix.forEach((row) => {
              fillCount += row.filter(i => i == 1).length;
            });
            if (fillCount == 20) {
              document.getElementById('ready-button').style.visibility = 'visible';
              document.getElementById('state-text').innerHTML = 'Press "Ready" button to start';
            }
          });

        }
        // only run this code for computer board
        else if (this.id == 'computer-board') {
          // handle player bomb placement on board
          cell.listen('click', (event) => {
            if (gameState != 1) return;

            // if cell already clicked
            if (this.fillMatrix[y][x] == 2) {
              return;
            }
            // if cell is not a ship
            else if (this.fillMatrix[y][x] == 0) {
              cell.element.style.backgroundColor = '#222f3e';
            }
            // if cell is a ship
            else if (this.fillMatrix[y][x] == 1) {
              cell.element.style.backgroundColor = '#ee5253';
              this.shipsCellLeft--;

              // player wins
              if (this.shipsCellLeft <= 0) {
                alert('Player wins, press OK to restart');
                location.reload();
              }
            }

            // disable the cell afterwards
            this.fillMatrix[y][x] = 2;

            // switch to computer's turn
            gameState = 2;
            document.getElementById('state-text').innerHTML = 'Red\'s turn to place a bomb...';
            // delay, then computer place a bomb on player's board
            setTimeout(() => {
              playerBoard.placeBomb();
            }, 1000);
          });
        }

        this.element.appendChild(cell.element);
      }
    }
  }

  // place ships randomly on the board
  // used for generating the computer board
  generateShips() {
    // ship01
    let rotation = getRandomInt(0, 2);
    let size = new Vector2(rotation == 0 ? 4 : 1, rotation == 0 ? 1 : 4);
    let position = generateShipPosition(size.x, size.y, this.fillMatrix);
    for (let x = position.x; x < position.x + size.x; x++) {
      for (let y = position.y; y < position.y + size.y; y++) {
        this.fillMatrix[y][x] = 1;
      }
    }
    // ship02
    rotation = getRandomInt(0, 2);
    size = new Vector2(rotation == 0 ? 3 : 1, rotation == 0 ? 1 : 3);
    position = generateShipPosition(size.x, size.y, this.fillMatrix);
    for (let x = position.x; x < position.x + size.x; x++) {
      for (let y = position.y; y < position.y + size.y; y++) {
        this.fillMatrix[y][x] = 1;
      }
    }
    // ship03
    rotation = getRandomInt(0, 2);
    size = new Vector2(rotation == 0 ? 3 : 1, rotation == 0 ? 1 : 3);
    position = generateShipPosition(size.x, size.y, this.fillMatrix);
    for (let x = position.x; x < position.x + size.x; x++) {
      for (let y = position.y; y < position.y + size.y; y++) {
        this.fillMatrix[y][x] = 1;
      }
    }
    // ship04
    rotation = getRandomInt(0, 2);
    size = new Vector2(rotation == 0 ? 2 : 1, rotation == 0 ? 1 : 2);
    position = generateShipPosition(size.x, size.y, this.fillMatrix);
    for (let x = position.x; x < position.x + size.x; x++) {
      for (let y = position.y; y < position.y + size.y; y++) {
        this.fillMatrix[y][x] = 1;
      }
    }
    // ship05
    rotation = getRandomInt(0, 2);
    size = new Vector2(rotation == 0 ? 2 : 1, rotation == 0 ? 1 : 2);
    position = generateShipPosition(size.x, size.y, this.fillMatrix);
    for (let x = position.x; x < position.x + size.x; x++) {
      for (let y = position.y; y < position.y + size.y; y++) {
        this.fillMatrix[y][x] = 1;
      }
    }
    // ship06
    rotation = getRandomInt(0, 2);
    size = new Vector2(rotation == 0 ? 2 : 1, rotation == 0 ? 1 : 2);
    position = generateShipPosition(size.x, size.y, this.fillMatrix);
    for (let x = position.x; x < position.x + size.x; x++) {
      for (let y = position.y; y < position.y + size.y; y++) {
        this.fillMatrix[y][x] = 1;
      }
    }
    // ship07
    size = new Vector2(1, 1);
    position = generateShipPosition(size.x, size.y, this.fillMatrix);
    for (let x = position.x; x < position.x + size.x; x++) {
      for (let y = position.y; y < position.y + size.y; y++) {
        this.fillMatrix[y][x] = 1;
      }
    }
    // ship08
    size = new Vector2(1, 1);
    position = generateShipPosition(size.x, size.y, this.fillMatrix);
    for (let x = position.x; x < position.x + size.x; x++) {
      for (let y = position.y; y < position.y + size.y; y++) {
        this.fillMatrix[y][x] = 1;
      }
    }
    // ship09
    size = new Vector2(1, 1);
    position = generateShipPosition(size.x, size.y, this.fillMatrix);
    for (let x = position.x; x < position.x + size.x; x++) {
      for (let y = position.y; y < position.y + size.y; y++) {
        this.fillMatrix[y][x] = 1;
      }
    }
    // ship10
    size = new Vector2(1, 1);
    position = generateShipPosition(size.x, size.y, this.fillMatrix);
    for (let x = position.x; x < position.x + size.x; x++) {
      for (let y = position.y; y < position.y + size.y; y++) {
        this.fillMatrix[y][x] = 1;
      }
    }
  }

  // place a bomb on the board
  placeBomb() {
    let position = generateBombPosition(this.fillMatrix);

    // if generated cell is a ship
    if (this.fillMatrix[position.y][position.x] == 1) {
      this.color(position.x, position.y, '#ee5253');
  
      this.shipsCellLeft--;

      // computer wins
      if (this.shipsCellLeft <= 0) {
        alert('Computer wins, press OK to restart');
        location.reload();
      }
    }
    // if generated cell is not a ship
    else if (this.fillMatrix[position.y][position.x] == 0) {
      this.color(position.x, position.y, '#222f3e')
    }
    this.fillMatrix[position.y][position.x] = 2;
    document.getElementById(`${this.id}-cell${position.x}${position.y}`).style.zIndex = "10";

    // switch back to player's turn
    gameState = 1;
    document.getElementById('state-text').innerHTML = 'Place a bomb on the red board';
  }

  listen(event, callback) {
    this.element.addEventListener(event, callback);
  }

  // color a cell on the board
  color(x, y, color) {
    document.getElementById(`${this.id}-cell${x}${y}`).style.backgroundColor = color;
  }
}

class Ship {
  constructor(element) {
    this.element = element;
    this.width = element.style.width;
    this.height = element.style.height;
  }

  listen(event, callback) {
    this.element.addEventListener(event, callback);
  }
}

window.onload = () => {
  playerBoard = new Board(document.getElementById('player-board'));
  computerBoard = new Board(document.getElementById('computer-board'));
  let ship01 = new Ship(document.getElementById('ship01'));
  let ship02 = new Ship(document.getElementById('ship02'));
  let ship03 = new Ship(document.getElementById('ship03'));
  let ship04 = new Ship(document.getElementById('ship04'));
  let ship05 = new Ship(document.getElementById('ship05'));
  let ship06 = new Ship(document.getElementById('ship06'));
  let ship07 = new Ship(document.getElementById('ship07'));
  let ship08 = new Ship(document.getElementById('ship08'));
  let ship09 = new Ship(document.getElementById('ship09'));
  let ship10 = new Ship(document.getElementById('ship10'));

  playerBoard.populate();
  computerBoard.populate();
  computerBoard.generateShips();

  ship01.listen('dragstart', (event) => {
    event.srcElement.style.backgroundColor = '#2e86de';
    event.dataTransfer.setData('shipId', event.target.id);
    event.dataTransfer.setData('shipWidth', 4);
  });
  ship02.listen('dragstart', (event) => {
    event.srcElement.style.backgroundColor = '#2e86de';
    event.dataTransfer.setData('shipId', event.target.id);
    event.dataTransfer.setData('shipWidth', 3);
  });
  ship03.listen('dragstart', (event) => {
    event.srcElement.style.backgroundColor = '#2e86de';
    event.dataTransfer.setData('shipId', event.target.id);
    event.dataTransfer.setData('shipWidth', 3);
  });
  ship04.listen('dragstart', (event) => {
    event.srcElement.style.backgroundColor = '#2e86de';
    event.dataTransfer.setData('shipId', event.target.id);
    event.dataTransfer.setData('shipWidth', 2);
  });
  ship05.listen('dragstart', (event) => {
    event.srcElement.style.backgroundColor = '#2e86de';
    event.dataTransfer.setData('shipId', event.target.id);
    event.dataTransfer.setData('shipWidth', 2);
  });
  ship06.listen('dragstart', (event) => {
    event.srcElement.style.backgroundColor = '#2e86de';
    event.dataTransfer.setData('shipId', event.target.id);
    event.dataTransfer.setData('shipWidth', 2);
  });
  ship07.listen('dragstart', (event) => {
    event.srcElement.style.backgroundColor = '#2e86de';
    event.dataTransfer.setData('shipId', event.target.id);
    event.dataTransfer.setData('shipWidth', 1);
  });
  ship08.listen('dragstart', (event) => {
    event.srcElement.style.backgroundColor = '#2e86de';
    event.dataTransfer.setData('shipId', event.target.id);
    event.dataTransfer.setData('shipWidth', 1);
  });
  ship09.listen('dragstart', (event) => {
    event.srcElement.style.backgroundColor = '#2e86de';
    event.dataTransfer.setData('shipId', event.target.id);
    event.dataTransfer.setData('shipWidth', 1);
  });
  ship10.listen('dragstart', (event) => {
    event.srcElement.style.backgroundColor = '#2e86de';
    event.dataTransfer.setData('shipId', event.target.id);
    event.dataTransfer.setData('shipWidth', 1);
  });

  ship01.listen('dragend', (event) => {
    event.srcElement.style.backgroundColor = '#0abde3';
  });
  ship02.listen('dragend', (event) => {
    event.srcElement.style.backgroundColor = '#0abde3';
  });
  ship03.listen('dragend', (event) => {
    event.srcElement.style.backgroundColor = '#0abde3';
  });
  ship04.listen('dragend', (event) => {
    event.srcElement.style.backgroundColor = '#0abde3';
  });
  ship05.listen('dragend', (event) => {
    event.srcElement.style.backgroundColor = '#0abde3';
  });
  ship06.listen('dragend', (event) => {
    event.srcElement.style.backgroundColor = '#0abde3';
  });
  ship07.listen('dragend', (event) => {
    event.srcElement.style.backgroundColor = '#0abde3';
  });
  ship08.listen('dragend', (event) => {
    event.srcElement.style.backgroundColor = '#0abde3';
  });
  ship09.listen('dragend', (event) => {
    event.srcElement.style.backgroundColor = '#0abde3';
  });
  ship10.listen('dragend', (event) => {
    event.srcElement.style.backgroundColor = '#0abde3';
  });

  document.getElementById('ready-button').style.visibility = 'hidden';

  // on ready button clicked
  document.getElementById('ready-button').addEventListener('click', (event) => {
    gameState = 1;
    document.getElementById('state-text').innerHTML = 'Place a bomb on the red board';
    document.getElementById('ready-button').style.visibility = 'hidden';

    // disable ship drag n drop
    ship01.element.draggable = false;
    ship02.element.draggable = false;
    ship03.element.draggable = false;
    ship04.element.draggable = false;
    ship05.element.draggable = false;
    ship06.element.draggable = false;
    ship07.element.draggable = false;
    ship08.element.draggable = false;
    ship09.element.draggable = false;
    ship10.element.draggable = false;
  });
}
