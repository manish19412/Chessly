let boardSquaresArray = []; // Array to hold data about each square on the chessboard
let positionArray = []; // Array to store positions of pieces
let moves = []; // Array to track all moves made in the game
const castlingSquares = ["g1", "g8", "c1", "c8"]; // Castling squares for both white and black
let isWhiteTurn = true; // Boolean to track which player's turn it is
let enPassantSquare = "blank"; // Tracks the en passant square if available
let allowMovement = true; // Boolean to allow or block piece movement
const boardSquares = document.getElementsByClassName("square"); // Gets all chessboard squares
const pieces = document.getElementsByClassName("piece"); // Gets all pieces on the board
const piecesImages = document.getElementsByTagName("img"); // Gets all piece images
const chessBoard = document.querySelector(".chessBoard"); // Selects the chessboard container
const topLines = document.getElementById("topLines"); // Gets the top lines element for display

setupBoardSquares(); // Initializes the chessboard squares
setupPieces(); // Places pieces on the board
fillBoardSquaresArray(); // Populates the boardSquaresArray with initial setup
let startingPosition = generateFEN(boardSquaresArray); // Generates FEN string for the initial position
getEvaluation(startingPosition, function (lines, evaluations, scoreString) {
  displayEvaluation(lines, evaluations, scoreString, true, 1); // Displays the board evaluation
});

// Populates boardSquaresArray with each square's details (piece, color, etc.)
function fillBoardSquaresArray() {
  const boardSquares = document.getElementsByClassName("square");
  for (let i = 0; i < boardSquares.length; i++) {
    let row = 8 - Math.floor(i / 8); // Calculate row number based on index
    let column = String.fromCharCode(97 + (i % 8)); // Calculate column letter (a-h)
    let square = boardSquares[i];
    square.id = column + row; // Assigns an ID to each square (e.g., 'a8', 'b8')
    
    // Initialize variables for piece details on the square
    let color = "";
    let pieceType = "";
    let pieceId = "";
    
    // If the square has a piece, get its color, type, and ID
    if (square.querySelector(".piece")) {
      color = square.querySelector(".piece").getAttribute("color");
      pieceType = square.querySelector(".piece").classList[1];
      pieceId = square.querySelector(".piece").id;
    } else {
      // If the square is empty, set piece details to "blank"
      color = "blank";
      pieceType = "blank";
      pieceId = "blank";
    }
    
    // Create an object with square details and add it to boardSquaresArray
    let arrayElement = {
      squareId: square.id,
      pieceColor: color,
      pieceType: pieceType,
      pieceId: pieceId,
    };
    boardSquaresArray.push(arrayElement);
  }
}




// Updates boardSquaresArray after a piece moves
function updateBoardSquaresArray(
  currentSquareId, // ID of the square the piece is moving from
  destinationSquareId, // ID of the square the piece is moving to
  boardSquaresArray, // Array of all squares on the board
  promotionOption = "blank" // Optional piece promotion (e.g., pawn promotion)
) 
{
  let currentSquare = boardSquaresArray.find(
    (element) => element.squareId === currentSquareId
  ); // Finds the current square in boardSquaresArray
  
  let destinationSquareElement = boardSquaresArray.find(
    (element) => element.squareId === destinationSquareId
  ); // Finds the destination square in boardSquaresArray
  
  // If no promotion, retain current piece type, else use promotion piece
  let pieceColor = currentSquare.pieceColor;
  let pieceType =
    promotionOption == "blank" ? currentSquare.pieceType : promotionOption;
    
  // If no promotion, retain current piece ID, else append promotion piece ID
  let pieceId =
    promotionOption == "blank"
      ? currentSquare.pieceId
      : promotionOption + currentSquare.pieceId;
  
  // Move piece to destination square
  destinationSquareElement.pieceColor = pieceColor;
  destinationSquareElement.pieceType = pieceType;
  destinationSquareElement.pieceId = pieceId;
  
  // Clear the piece from the current square
  currentSquare.pieceColor = "blank";
  currentSquare.pieceType = "blank";
  currentSquare.pieceId = "blank";
}



function displayMoveHistory() {
  const moveHistoryBody = document.getElementById("moveHistoryBody");
  moveHistoryBody.innerHTML = ""; // Clear previous entries

  moves.forEach((move, index) => {
    let row = document.createElement("tr");

    // Move Number Cell
    let moveNumberCell = document.createElement("td");
    moveNumberCell.textContent = index + 1; // Move number
    row.appendChild(moveNumberCell);

    // Piece & Color Cell
    let pieceColorCell = document.createElement("td");
    let pieceImg = document.createElement("img");
    
    // Link images based on piece color and type
    pieceImg.src = `${move.pieceColor}-${move.pieceType}.png`; // Assuming images are in the same directory
    pieceImg.alt = move.pieceType;
    pieceImg.style.width = "30px"; // Adjust the size as needed
    pieceImg.style.height = "30px"; // Adjust the size as needed

    pieceColorCell.appendChild(pieceImg);
    row.appendChild(pieceColorCell);

    // From Cell
    let fromCell = document.createElement("td");
    fromCell.textContent = move.from;
    row.appendChild(fromCell);

    // To Cell
    let toCell = document.createElement("td");
    toCell.textContent = move.to;
    row.appendChild(toCell);

    // Captured Cell
    let capturedCell = document.createElement("td");
    capturedCell.textContent = move.captured ? "Yes" : "No"; // Display if a piece was captured
    row.appendChild(capturedCell);

    // Promoted To Cell
    let promotedCell = document.createElement("td");
    promotedCell.textContent = move.promotedTo !== "blank" ? move.promotedTo : ""; // Show promotion type if any
    row.appendChild(promotedCell);

    moveHistoryBody.appendChild(row); // Add the row to the table body
  });
}



function makeMove(
  startingSquareId, 
  destinationSquareId, 
  pieceType, 
  pieceColor, 
  captured, // Captured piece, if any
  promotedTo = "blank" 
) {
  // Add move details to the moves array
  moves.push({
    from: startingSquareId,
    to: destinationSquareId,
    pieceType: pieceType,
    pieceColor: pieceColor,
    captured: captured ? { 
      pieceType: captured.pieceType, 
      pieceColor: captured.pieceColor,
      pieceId: captured.pieceId
    } : null, // Store captured piece's details if there was a capture
    promotedTo: promotedTo,
  });
  displayMoveHistory(); // Update the move history display
}



function generateFEN(boardSquares) {
  let fen = "";
  let rank = 8;
  
  // Loop through each rank (8 to 1)
  while (rank >= 1) {
    for (
      let file = "a";
      file <= "h";
      file = String.fromCharCode(file.charCodeAt(0) + 1) // Loop through each file (a to h)
    ) {
      const square = boardSquares.find(
        (element) => element.squareId === `${file}${rank}` // Find square by file and rank
      );
      if (square && square.pieceType) {
        let pieceNotation = ""; // Initialize piece notation
        switch (square.pieceType) { // Assign FEN notation for each piece type
          case "pawn":
            pieceNotation = "p";
            break;
          case "bishop":
            pieceNotation = "b";
            break;
          case "knight":
            pieceNotation = "n";
            break;
          case "rook":
            pieceNotation = "r";
            break;
          case "queen":
            pieceNotation = "q";
            break;
          case "king":
            pieceNotation = "k";
            break;
          case "blank":
            pieceNotation = "blank";
            break;
        }
        fen +=
          square.pieceColor === "white"
            ? pieceNotation.toUpperCase() // Capitalize for white pieces
            : pieceNotation; // Lowercase for black pieces
      }
    }
    if (rank > 1) {
      fen += "/"; // Add rank separator
    }
    rank--;
  }
  
  // Replace multiple blanks with corresponding numbers
  fen = fen.replace(
    new RegExp("blankblankblankblankblankblankblankblank", "g"),
    "8"
  );
  fen = fen.replace(
    new RegExp("blankblankblankblankblankblankblank", "g"),
    "7"
  );
  fen = fen.replace(new RegExp("blankblankblankblankblankblank", "g"), "6");
  fen = fen.replace(new RegExp("blankblankblankblankblank", "g"), "5");
  fen = fen.replace(new RegExp("blankblankblankblank", "g"), "4");
  fen = fen.replace(new RegExp("blankblankblank", "g"), "3");
  fen = fen.replace(new RegExp("blankblank", "g"), "2");
  fen = fen.replace(new RegExp("blank", "g"), "1");

  fen += isWhiteTurn ? " w " : " b "; // Add active color (white/black to move)

  let castlingString = "";

  // Check for castling possibilities
  let shortCastlePossibleForWhite =
    !kingHasMoved("white") && !rookHasMoved("white", "h1");
  let longCastlePossibleForWhite =
    !kingHasMoved("white") && !rookHasMoved("white", "a1");
  let shortCastlePossibleForBlack =
    !kingHasMoved("black") && !rookHasMoved("black", "h8");
  let longCastlePossibleForBlack =
    !kingHasMoved("black") && !rookHasMoved("black", "a8");

  // Add castling rights to FEN
  if (shortCastlePossibleForWhite) castlingString += "K";
  if (longCastlePossibleForWhite) castlingString += "Q";
  if (shortCastlePossibleForBlack) castlingString += "k";
  if (longCastlePossibleForBlack) castlingString += "q";
  if (castlingString == "") castlingString += "-"; // If no castling, use "-"
  castlingString += " ";
  fen += castlingString;

  fen += enPassantSquare == "blank" ? "-" : enPassantSquare; // Add en passant square or "-"

  let fiftyMovesRuleCount = getFiftyMovesRuleCount(); // Add halfmove clock (50-move rule)
  fen += " " + fiftyMovesRuleCount;
  
  let moveCount = Math.floor(moves.length / 2) + 1; // Add fullmove number
  fen += " " + moveCount;
  
  return fen; // Return FEN string
}

function performCastling(
  piece,
  pieceColor,
  startingSquareId,
  destinationSquareId,
  boardSquaresArray
) {
  let rookId, rookDestinationSquareId, checkSquareId;
  
  // Determine rook movement based on king's destination
  if (destinationSquareId == "g1") {
    rookId = "rookh1";
    rookDestinationSquareId = "f1";
    checkSquareId = "f1";
  } else if (destinationSquareId == "c1") {
    rookId = "rooka1";
    rookDestinationSquareId = "d1";
    checkSquareId = "d1";
  } else if (destinationSquareId == "g8") {
    rookId = "rookh8";
    rookDestinationSquareId = "f8";
    checkSquareId = "f8";
  } else if (destinationSquareId == "c8") {
    rookId = "rooka8";
    rookDestinationSquareId = "d8";
    checkSquareId = "d8";
  }

  // Check if castling puts the king in check
  if (isKingInCheck(checkSquareId, pieceColor, boardSquaresArray)) return;

  // Move rook to its destination
  let rook = document.getElementById(rookId);
  let rookDestinationSquare = document.getElementById(rookDestinationSquareId);
  rookDestinationSquare.appendChild(rook);
  updateBoardSquaresArray(
    rook.id.slice(-2),
    rookDestinationSquare.id,
    boardSquaresArray
  );

  // Move king to its destination
  const destinationSquare = document.getElementById(destinationSquareId);
  destinationSquare.appendChild(piece);
  isWhiteTurn = !isWhiteTurn; // Switch turns
  
  // Update board array and log the move
  updateBoardSquaresArray(
    startingSquareId,
    destinationSquareId,
    boardSquaresArray
  );
  let captured = false;
  makeMove(startingSquareId, destinationSquareId, "king", pieceColor, captured);
  checkForEndGame(); // Check if the game has ended after castling
  
  return;
}





function performEnPassant(piece,pieceColor,startingSquareId,destinationSquareId){

  let file = destinationSquareId[0];
  let rank = parseInt(destinationSquareId[1]);
  rank += (pieceColor === 'white') ? -1 : 1;
  let squareBehindId=file+rank;

  const squareBehindElement=document.getElementById(squareBehindId);
  while (squareBehindElement.firstChild) {
    squareBehindElement.removeChild(squareBehindElement.firstChild);
  }
  
let squareBehind = boardSquaresArray.find(
  (element) => element.squareId === squareBehindId
);
squareBehind.pieceColor = "blank";
squareBehind.pieceType = "blank";
squareBehind.pieceId = "blank";


const destinationSquare=document.getElementById(destinationSquareId);
destinationSquare.appendChild(piece);
isWhiteTurn = !isWhiteTurn;
updateBoardSquaresArray(
  startingSquareId,
  destinationSquareId,
  boardSquaresArray
);
let captured=true;
makeMove(startingSquareId,
  destinationSquareId,"pawn",pieceColor,captured)
checkForCheckMate();
return;
}








function displayPromotionChoices(
  pieceId,
  pieceColor,
  startingSquareId,
  destinationSquareId,
  captured
) {
  // Determine positions for placing promotion options
  let file = destinationSquareId[0];
  let rank = parseInt(destinationSquareId[1]);
  let rank1 = pieceColor === "white" ? rank - 1 : rank + 1;
  let rank2 = pieceColor === "white" ? rank - 2 : rank + 2;
  let rank3 = pieceColor === "white" ? rank - 3 : rank + 3;

  let squareBehindId1 = file + rank1;
  let squareBehindId2 = file + rank2;
  let squareBehindId3 = file + rank3;

  // Get the squares for promotion display
  const destinationSquare = document.getElementById(destinationSquareId);
  const squareBehind1 = document.getElementById(squareBehindId1);
  const squareBehind2 = document.getElementById(squareBehindId2);
  const squareBehind3 = document.getElementById(squareBehindId3);

  // Create promotion options (queen, knight, rook, bishop)
  let piece1 = createChessPiece("queen", pieceColor, "promotionOption");
  let piece2 = createChessPiece("knight", pieceColor, "promotionOption");
  let piece3 = createChessPiece("rook", pieceColor, "promotionOption");
  let piece4 = createChessPiece("bishop", pieceColor, "promotionOption");

  // Append promotion options to the board
  destinationSquare.appendChild(piece1);
  squareBehind1.appendChild(piece2);
  squareBehind2.appendChild(piece3);
  squareBehind3.appendChild(piece4);

  // Add click listeners for selecting promotion option
  let promotionOptions = document.getElementsByClassName("promotionOption");
  for (let i = 0; i < promotionOptions.length; i++) {
    let pieceType = promotionOptions[i].classList[1]; // Get the piece type
    promotionOptions[i].addEventListener("click", function () {
      performPromotion(
        pieceId,
        pieceType,
        pieceColor,
        startingSquareId,
        destinationSquareId,
        captured
      );
    });
  }
}



function createChessPiece(pieceType, color, pieceClass) {
  // Construct the image name for the piece (e.g., "White-Queen.png")
  let pieceName =
    color.charAt(0).toUpperCase() +
    color.slice(1) +
    "-" +
    pieceType.charAt(0).toUpperCase() +
    pieceType.slice(1) +
    ".png";

  // Create a div and img element for the chess piece
  let pieceDiv = document.createElement("div");
  pieceDiv.className = `${pieceClass} ${pieceType}`;
  pieceDiv.setAttribute("color", color);

  let img = document.createElement("img");
  img.src = pieceName;
  img.alt = pieceType;

  // Append the image to the div
  pieceDiv.appendChild(img);
  return pieceDiv;
}

// Event listener to clear promotion options when the board is clicked
chessBoard.addEventListener("click", clearPromotionOptions);

function clearPromotionOptions() {
  // Reset the background and opacity of all squares
  for (let i = 0; i < boardSquares.length; i++) {
    let style = getComputedStyle(boardSquares[i]);
    let backgroundColor = style.backgroundColor;
    let rgbaColor = backgroundColor.replace("0.5)", "1)");
    boardSquares[i].style.backgroundColor = rgbaColor;
    boardSquares[i].style.opacity = 1;

    // Reset the opacity of any pieces on the board
    if (boardSquares[i].querySelector(".piece"))
      boardSquares[i].querySelector(".piece").style.opacity = 1;
  }

  // Remove all promotion options from the board
  let elementsToRemove = chessBoard.querySelectorAll(".promotionOption");
  elementsToRemove.forEach(function (element) {
    element.parentElement.removeChild(element);
  });

  // Allow movement after clearing promotion options
  allowMovement = true;
}






function updateBoardSquaresOpacity(startingSquareId) {
  // Loop through all squares on the board
  for (let i = 0; i < boardSquares.length; i++) {
    // Hide the piece on the starting square (opacity 0)
    if (boardSquares[i].id == startingSquareId)
      boardSquares[i].querySelector(".piece").style.opacity = 0;

    // Dim the non-promotion option squares (opacity 0.5)
    if (!boardSquares[i].querySelector(".promotionOption")) {
      boardSquares[i].style.opacity = 0.5;
    } else {
      // Adjust promotion option square background to semi-transparent
      let style = getComputedStyle(boardSquares[i]);
      let backgroundColor = style.backgroundColor;
      let rgbaColor = backgroundColor
        .replace("rgb", "rgba")
        .replace(")", ",0.5)");
      boardSquares[i].style.backgroundColor = rgbaColor;

      // Hide pieces in promotion squares
      if (boardSquares[i].querySelector(".piece"))
        boardSquares[i].querySelector(".piece").style.opacity = 0;
    }
  }
}

function performPromotion(
  pieceId,
  pieceType,
  pieceColor,
  startingSquareId,
  destinationSquareId,
  captured
) {
  // Clear promotion options before promoting
  clearPromotionOptions();

  // Create the new promoted piece
  promotionPiece = pieceType;
  piece = createChessPiece(pieceType, pieceColor, "piece");

  // Make the new piece draggable
  piece.addEventListener("dragstart", drag);
  piece.setAttribute("draggable", true);
  piece.firstChild.setAttribute("draggable", false); // Disable dragging for child (image)
  piece.id = pieceType + pieceId; // Assign new ID to the promoted piece

  // Remove piece from starting square
  const startingSquare = document.getElementById(startingSquareId);
  while (startingSquare.firstChild) {
    startingSquare.removeChild(startingSquare.firstChild);
  }

  const destinationSquare = document.getElementById(destinationSquareId);

  // Remove captured piece if any
  if (captured) {
    let children = destinationSquare.children;
    for (let i = 0; i < children.length; i++) {
      if (!children[i].classList.contains("coordinate")) {
        destinationSquare.removeChild(children[i]);
      }
    }
  }

  // Append the promoted piece to the destination square
  destinationSquare.appendChild(piece);

  // Toggle the player's turn
  isWhiteTurn = !isWhiteTurn;

  // Update board state with the new piece
  updateBoardSquaresArray(
    startingSquareId,
    destinationSquareId,
    boardSquaresArray,
    pieceType
  );

  // Log the move and check for endgame conditions
  makeMove(
    startingSquareId,
    destinationSquareId,
    pieceType,
    pieceColor,
    captured,
    pieceType
  );
  checkForEndGame();
  return;
}

function deepCopyArray(array) {
  // Create a deep copy of an array (each element is cloned)
  let arrayCopy = array.map((element) => {
    return { ...element };
  });
  return arrayCopy;
}





function setupBoardSquares() {
  // Set up each square on the board
  for (let i = 0; i < boardSquares.length; i++) {
    boardSquares[i].addEventListener("dragover", allowDrop); // Allow pieces to be dragged over the square
    boardSquares[i].addEventListener("drop", drop); // Allow pieces to be dropped on the square
    let row = 8 - Math.floor(i / 8); // Determine row (1-8)
    let column = String.fromCharCode(97 + (i % 8)); // Determine column (a-h)
    boardSquares[i].id = column + row; // Assign square ID like "e4"
  }
}

function setupPieces() {
  // Set up each piece to be draggable
  for (let i = 0; i < pieces.length; i++) {
    pieces[i].addEventListener("dragstart", drag); // Enable drag functionality
    pieces[i].setAttribute("draggable", true);
    pieces[i].id = pieces[i].className.split(" ")[1] + pieces[i].parentElement.id; // Unique ID for each piece
  }
  // Prevent dragging of the piece's image (child element)
  for (let i = 0; i < piecesImages.length; i++) {
    piecesImages[i].setAttribute("draggable", false);
  }
}

function allowDrop(ev) {
  // Prevent default behavior to allow dropping
  ev.preventDefault();
}

function drag(ev) {
  if (!allowMovement) return; // Disable dragging if movement isn't allowed

  const piece = ev.target;
  const pieceColor = piece.getAttribute("color");
  const pieceType = piece.classList[1]; // Get piece type (king, queen, etc.)
  const pieceId = piece.id;

  // Allow dragging only if it's the player's turn
  if ((isWhiteTurn && pieceColor == "white") || (!isWhiteTurn && pieceColor == "black")) {
    const startingSquareId = piece.parentNode.id; // Get the square from which the piece is dragged
    ev.dataTransfer.setData("text", piece.id + "|" + startingSquareId); // Pass piece ID and starting square ID

    // Get possible legal moves for the dragged piece
    const pieceObject = { pieceColor: pieceColor, pieceType: pieceType, pieceId: pieceId };
    let legalSquares = getPossibleMoves(startingSquareId, pieceObject, boardSquaresArray);
    let legalSquaresJson = JSON.stringify(legalSquares); // Store legal moves in JSON format
    ev.dataTransfer.setData("application/json", legalSquaresJson); // Transfer legal moves
  }
}

function drop(ev) {
  ev.preventDefault(); // Allow dropping the piece

  // Retrieve piece ID and starting square from drag event
  let data = ev.dataTransfer.getData("text");
  let [pieceId, startingSquareId] = data.split("|");

  // Retrieve legal squares data
  let legalSquaresJson = ev.dataTransfer.getData("application/json");
  if (legalSquaresJson.length == 0) return; // No legal moves available
  let legalSquares = JSON.parse(legalSquaresJson); // Parse legal moves

  const piece = document.getElementById(pieceId); // Get the piece being moved
  const pieceColor = piece.getAttribute("color");
  const pieceType = piece.classList[1]; // Get piece type (pawn, king, etc.)

  const destinationSquare = ev.currentTarget; // Get destination square where the piece is dropped
  let destinationSquareId = destinationSquare.id;

  // Ensure the move is valid considering check
  legalSquares = isMoveValidAgainstCheck(legalSquares, startingSquareId, pieceColor, pieceType);

  // Additional check for king moves
  if (pieceType == "king") {
    let isCheck = isKingInCheck(destinationSquareId, pieceColor, boardSquaresArray);
    if (isCheck) return; // Prevent king from moving into check
  }

  // Check if destination square is empty and a valid move
  let squareContent = getPieceAtSquare(destinationSquareId, boardSquaresArray);
  if (squareContent.pieceColor == "blank" && legalSquares.includes(destinationSquareId)) {
    let isCheck = false;
    
    // Handle castling logic for the king
    if (pieceType == "king" && !kingHasMoved(pieceColor) && castlingSquares.includes(destinationSquareId) && !isCheck) {
      performCastling(piece, pieceColor, startingSquareId, destinationSquareId, boardSquaresArray);
      return;
    }

    // Handle en passant move for pawns
    if (pieceType == "pawn" && enPassantSquare == destinationSquareId) {
      performEnPassant(piece, pieceColor, startingSquareId, destinationSquareId);
      return;
    }

    enPassantSquare = "blank"; // Reset en passant square

    // Handle pawn promotion
    if (pieceType == "pawn" && (destinationSquareId.charAt(1) == 8 || destinationSquareId.charAt(1) == 1)) {
      allowMovement = false;
      displayPromotionChoices(pieceId, pieceColor, startingSquareId, destinationSquareId, false);
      updateBoardSquaresOpacity(startingSquareId); // Dim other squares during promotion
      return;
    }

    // Move the piece to the destination square
    destinationSquare.appendChild(piece);
    isWhiteTurn = !isWhiteTurn; // Toggle player's turn

    // Update the board state after the move
    updateBoardSquaresArray(startingSquareId, destinationSquareId, boardSquaresArray);
    let captured = false;
    makeMove(startingSquareId, destinationSquareId, pieceType, pieceColor, captured); // Log the move
    checkForEndGame(); // Check for game over
    return;
  }

  // Handle capture of opponent's piece
  if (squareContent.pieceColor != "blank" && legalSquares.includes(destinationSquareId)) {
    if (pieceType == "pawn" && (destinationSquareId.charAt(1) == 8 || destinationSquareId.charAt(1) == 1)) {
      allowMovement = false;
      displayPromotionChoices(pieceId, pieceColor, startingSquareId, destinationSquareId, true);
      updateBoardSquaresOpacity(startingSquareId);
      return;
    }

    // Remove the captured piece from the destination square
    let children = destinationSquare.children;
    for (let i = 0; i < children.length; i++) {
      if (!children[i].classList.contains("coordinate")) {
        destinationSquare.removeChild(children[i]);
      }
    }
  

    // while (destinationSquare.firstChild) {
    //   if(!destinationSquare.firstChild.classList.contains("coordinate"))
    //    destinationSquare.removeChild(destinationSquare.firstChild);
    // }
    destinationSquare.appendChild(piece);
    isWhiteTurn = !isWhiteTurn;
    updateBoardSquaresArray(
      startingSquareId,
      destinationSquareId,
      boardSquaresArray
    );
    let captured = true;
    makeMove(
      startingSquareId,
      destinationSquareId,
      pieceType,
      pieceColor,
      captured
    );
    checkForEndGame();
    return;
  }
}

function getPossibleMoves(startingSquareId, piece, boardSquaresArray) {
  const pieceColor = piece.pieceColor;
  const pieceType = piece.pieceType;
  let legalSquares = [];

  // Determine legal moves based on piece type
  if (pieceType == "rook") {
    legalSquares = getRookMoves(startingSquareId, pieceColor, boardSquaresArray);
  } else if (pieceType == "bishop") {
    legalSquares = getBishopMoves(startingSquareId, pieceColor, boardSquaresArray);
  } else if (pieceType == "queen") {
    legalSquares = getQueenMoves(startingSquareId, pieceColor, boardSquaresArray);
  } else if (pieceType == "knight") {
    legalSquares = getKnightMoves(startingSquareId, pieceColor, boardSquaresArray);
  } else if (pieceType == "pawn") {
    legalSquares = getPawnMoves(startingSquareId, pieceColor, boardSquaresArray);
  } else if (pieceType == "king") {
    legalSquares = getKingMoves(startingSquareId, pieceColor, boardSquaresArray);
  }
  
  return legalSquares; // Return the list of legal squares
}

function checkForCheckMate(){
  let kingSquare=isWhiteTurn ? getkingLastMove("white") : getkingLastMove("black");
  let pieceColor=isWhiteTurn ? "white" : "black";
  let boardSquaresArrayCopy=deepCopyArray(boardSquaresArray);
  let kingIsCheck=isKingInCheck(kingSquare,pieceColor,boardSquaresArrayCopy);
  if(!kingIsCheck)return;
  let possibleMoves=getAllPossibleMoves(boardSquaresArrayCopy,pieceColor);
  if(possibleMoves.length>0) return;
  let message="";
  isWhiteTurn ? (message="Black Wins!") : (message="White Wins!");
  showAlert(message);
}



function getPawnMoves(startingSquareId, pieceColor, boardSquaresArray) {
  // Get possible diagonal captures and forward moves for the pawn
  let diagonalSquares = checkPawnDiagonalCaptures(startingSquareId, pieceColor, boardSquaresArray);
  let forwardSquares = checkPawnForwardMoves(startingSquareId, pieceColor, boardSquaresArray);
  let legalSquares = [...diagonalSquares, ...forwardSquares]; // Combine both move types
  return legalSquares; // Return the legal squares
}

function checkPawnDiagonalCaptures(
  startingSquareId,
  pieceColor,
  boardSquaresArray
) {
  const file = startingSquareId.charAt(0);
  const rank = startingSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let legalSquares = [];
  let currentFile = file;
  let currentRank = rankNumber;
  let currentSquareId = currentFile + currentRank;

  const direction = pieceColor == "white" ? 1 : -1;
  if(!(rank==8 && direction==1) && !(rank==1 && direction==-1))
    currentRank += direction;
  for (let i = -1; i <= 1; i += 2) {
    currentFile = String.fromCharCode(file.charCodeAt(0) + i);
    if (currentFile >= "a" && currentFile <= "h" && currentRank<=8 && currentRank>=1) {
      currentSquareId = currentFile + currentRank;
      let currentSquare = boardSquaresArray.find(
        (element) => element.squareId === currentSquareId
      );
      let squareContent = currentSquare.pieceColor;
      if (squareContent != "blank" && squareContent != pieceColor)
        legalSquares.push(currentSquareId);
        if (squareContent == "blank"){
          currentSquareId = currentFile + rank;
          let pawnStartingSquareRank=rankNumber+direction*2;
          let pawnStartingSquareId=currentFile+pawnStartingSquareRank;
        
          if(enPassantPossible(currentSquareId,pawnStartingSquareId,direction))
          {
            let pawnStartingSquareRank=rankNumber+direction;
            let enPassantSquare=currentFile+pawnStartingSquareRank;
            legalSquares.push(enPassantSquare);
          }
  
        }
    }
  }
  return legalSquares;
}


function enPassantPossible(currentSquareId,pawnStartingSquareId,direction){
  if(moves.length==0) return false;
  let lastMove= moves[moves.length-1];
  if(!(lastMove.to===currentSquareId && lastMove.from===pawnStartingSquareId && lastMove.pieceType=="pawn")) return false;
  file=currentSquareId[0];
  rank=parseInt(currentSquareId[1]);
  rank+=direction;
  let squareBehindId=file+rank;
  enPassantSquare=squareBehindId;
  return true;
}


function checkPawnForwardMoves(startingSquareId, pieceColor, boardSquaresArray) {
  const file = startingSquareId.charAt(0);
  const rank = startingSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let legalSquares = [];

  let currentFile = file;
  let currentRank = rankNumber;
  currentRank += (pieceColor == "white" ? 1 : -1); // Move forward based on color
  let currentSquareId = currentFile + currentRank;
  let currentSquare = boardSquaresArray.find((element) => element.squareId === currentSquareId);
  let squareContent = currentSquare.pieceColor;

  // Check if the forward square is blank
  if (squareContent != "blank") return legalSquares;
  legalSquares.push(currentSquareId); // Add forward square to legal moves

  // Check for double move possibility from starting position
  if (!((rankNumber == 2 && pieceColor == "white") || (rankNumber == 7 && pieceColor == "black"))) 
    return legalSquares; // No double move allowed

  currentRank += (pieceColor == "white" ? 1 : -1); // Move again for double move
  currentSquareId = currentFile + currentRank;
  currentSquare = boardSquaresArray.find((element) => element.squareId === currentSquareId);
  squareContent = currentSquare.pieceColor;

  // Add second square if it's blank
  if (squareContent != "blank") return legalSquares; // No move if occupied
  legalSquares.push(currentSquareId); // Add second move
  return legalSquares; // Return legal forward moves
}


function getKnightMoves(startingSquareId, pieceColor, boardSquaresArray) {
  // Get file (column) and rank (row) of the starting square
  const file = startingSquareId.charCodeAt(0) - 97; // 'a' -> 0
  const rank = startingSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let currentFile = file;
  let currentRank = rankNumber;
  let legalSquares = [];

  // Possible knight moves (L-shape)
  const moves = [
    [-2, 1], [-1, 2], [1, 2], [2, 1],
    [2, -1], [1, -2], [-1, -2], [-2, -1],
  ];

  moves.forEach((move) => {
    currentFile = file + move[0]; // Calculate new file
    currentRank = rankNumber + move[1]; // Calculate new rank
    // Check if the new position is within bounds
    if (
      currentFile >= 0 &&
      currentFile <= 7 &&
      currentRank > 0 &&
      currentRank <= 8
    ) {
      let currentSquareId = String.fromCharCode(currentFile + 97) + currentRank; // Convert back to squareId
      let currentSquare = boardSquaresArray.find(
        (element) => element.squareId === currentSquareId
      );
      let squareContent = currentSquare.pieceColor;
      // Only add square if it is empty or occupied by opponent
      if (squareContent != "blank" && squareContent == pieceColor) return legalSquares;
      legalSquares.push(currentSquareId); // Add legal square to the list
    }
  });
  return legalSquares; // Return all possible knight moves
}

function getRookMoves(startingSquareId, pieceColor, boardSquaresArray) {
  // Get all possible moves in straight lines (ranks and files)
  let moveToEighthRankSquares = moveToEighthRank(
    startingSquareId,
    pieceColor,
    boardSquaresArray
  );
  let moveToFirstRankSquares = moveToFirstRank(
    startingSquareId,
    pieceColor,
    boardSquaresArray
  );
  let moveToAFileSquares = moveToAFile(
    startingSquareId,
    pieceColor,
    boardSquaresArray
  );
  let moveToHFileSquares = moveToHFile(
    startingSquareId,
    pieceColor,
    boardSquaresArray
  );
  let legalSquares = [
    ...moveToEighthRankSquares,
    ...moveToFirstRankSquares,
    ...moveToAFileSquares,
    ...moveToHFileSquares,
  ];
  return legalSquares; // Return all legal rook moves
}

function getBishopMoves(startingSquareId, pieceColor, boardSquaresArray) {
  // Get all diagonal moves (up-right, up-left, down-right, down-left)
  let moveToEighthRankHFileSquares = moveToEighthRankHFile(
    startingSquareId,
    pieceColor,
    boardSquaresArray
  );
  let moveToEighthRankAFileSquares = moveToEighthRankAFile(
    startingSquareId,
    pieceColor,
    boardSquaresArray
  );
  let moveToFirstRankHFileSquares = moveToFirstRankHFile(
    startingSquareId,
    pieceColor,
    boardSquaresArray
  );
  let moveToFirstRankAFileSquares = moveToFirstRankAFile(
    startingSquareId,
    pieceColor,
    boardSquaresArray
  );
  let legalSquares = [
    ...moveToEighthRankHFileSquares,
    ...moveToEighthRankAFileSquares,
    ...moveToFirstRankHFileSquares,
    ...moveToFirstRankAFileSquares,
  ];
  return legalSquares; // Return all legal bishop moves
}

function getQueenMoves(startingSquareId, pieceColor, boardSquaresArray) {
  // Queen combines rook and bishop moves
  let bishopMoves = getBishopMoves(
    startingSquareId,
    pieceColor,
    boardSquaresArray
  );
  let rookMoves = getRookMoves(startingSquareId, pieceColor, boardSquaresArray);
  let legalSquares = [...bishopMoves, ...rookMoves];
  return legalSquares; // Return all legal queen moves
}

function getKingMoves(startingSquareId, pieceColor, boardSquaresArray) {
  // Get file and rank for the king's position
  const file = startingSquareId.charCodeAt(0) - 97; // 'a' -> 0
  const rank = startingSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let legalSquares = [];
  
  // Possible king moves (one square in any direction)
  const moves = [
    [0, 1], [0, -1], [1, 1], [1, -1],
    [-1, 0], [-1, 1], [-1, -1], [1, 0],
  ];

  moves.forEach((move) => {
    let currentFile = file + move[0]; // Calculate new file
    let currentRank = rankNumber + move[1]; // Calculate new rank

    // Check if the new position is within bounds
    if (
      currentFile >= 0 &&
      currentFile <= 7 &&
      currentRank > 0 &&
      currentRank <= 8
    ) {
      let currentSquareId = String.fromCharCode(currentFile + 97) + currentRank; // Convert back to squareId
      let currentSquare = boardSquaresArray.find(
        (element) => element.squareId === currentSquareId
      );
      let squareContent = currentSquare.pieceColor;
      // Only add square if it is empty or occupied by opponent
      if (squareContent != "blank" && squareContent == pieceColor) {
        return legalSquares;
      }
      legalSquares.push(currentSquareId); // Add legal square to the list
    }
  });
  
  // Check for castling opportunities
  let shortCastleSquare = isShortCastlePossible(pieceColor, boardSquaresArray);
  let longCastleSquare = isLongCastlePossible(pieceColor, boardSquaresArray);
  if (shortCastleSquare != "blank") legalSquares.push(shortCastleSquare);
  if (longCastleSquare != "blank") legalSquares.push(longCastleSquare);

  return legalSquares; // Return all legal king moves
}

function isShortCastlePossible(pieceColor, boardSquaresArray) {
  // Check conditions for short castling
  let rank = pieceColor === "white" ? "1" : "8"; // Determine rank based on piece color
  let fSquare = boardSquaresArray.find(
    (element) => element.squareId === `f${rank}`
  );
  let gSquare = boardSquaresArray.find(
    (element) => element.squareId === `g${rank}`
  );
  
  // Conditions for castling: squares f and g must be empty, and neither king nor rook has moved
  if (
    fSquare.pieceColor !== "blank" ||
    gSquare.pieceColor !== "blank" ||
    kingHasMoved(pieceColor) ||
    rookHasMoved(pieceColor, `h${rank}`)
  ) {
    return "blank"; // Castling not possible
  }

  return `g${rank}`; // Return square for short castling
}




function isLongCastlePossible(pieceColor, boardSquaresArray) {
  let rank = pieceColor === "white" ? "1" : "8"; // Determine the rank based on piece color
  let dSquare = boardSquaresArray.find(
    (element) => element.squareId === `d${rank}`
  );
  let cSquare = boardSquaresArray.find(
    (element) => element.squareId === `c${rank}`
  );
  let bSquare = boardSquaresArray.find(
    (element) => element.squareId === `b${rank}`
  );

  // Check if the squares are occupied or if king/rook has moved
  if (
    dSquare.pieceColor !== "blank" ||
    cSquare.pieceColor !== "blank" ||
    bSquare.pieceColor !== "blank" ||
    kingHasMoved(pieceColor) ||
    rookHasMoved(pieceColor, `a${rank}`)
  ) {
    return "blank"; // Long castle not possible
  }

  return `c${rank}`; // Return square for long castling
}

function kingHasMoved(pieceColor) {
  // Check if the king has moved
  let result = moves.find(
    (element) =>
      element.pieceColor === pieceColor && element.pieceType === "king"
  );
  return result !== undefined; // Return true if king has moved
}

function rookHasMoved(pieceColor, startingSquareId) {
  // Check if the rook has moved from its starting position
  let result = moves.find(
    (element) =>
      element.pieceColor === pieceColor &&
      element.pieceType === "rook" &&
      element.from === startingSquareId
  );
  return result !== undefined; // Return true if rook has moved
}

function moveToEighthRank(startingSquareId, pieceColor, boardSquaresArray) {
  const file = startingSquareId.charAt(0); // Get file (column)
  const rank = startingSquareId.charAt(1); // Get rank (row)
  const rankNumber = parseInt(rank);
  let currentRank = rankNumber;
  let legalSquares = [];

  // Loop through ranks to the 8th rank
  while (currentRank != 8) {
    currentRank++;
    let currentSquareId = file + currentRank;
    let currentSquare = boardSquaresArray.find(
      (element) => element.squareId === currentSquareId
    );
    let squareContent = currentSquare.pieceColor;

    // Check if square is occupied by same color piece
    if (squareContent !== "blank" && squareContent === pieceColor)
      return legalSquares; // Stop if own piece is encountered

    legalSquares.push(currentSquareId); // Add square to legal moves
    // Stop if occupied by opposing piece
    if (squareContent !== "blank" && squareContent !== pieceColor)
      return legalSquares;
  }
  return legalSquares; // Return all legal squares
}

function moveToFirstRank(startingSquareId, pieceColor, boardSquaresArray) {
  const file = startingSquareId.charAt(0);
  const rank = startingSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let currentRank = rankNumber;
  let legalSquares = [];

  // Loop through ranks to the 1st rank
  while (currentRank != 1) {
    currentRank--;
    let currentSquareId = file + currentRank;
    let currentSquare = boardSquaresArray.find(
      (element) => element.squareId === currentSquareId
    );
    let squareContent = currentSquare.pieceColor;

    // Check if square is occupied by same color piece
    if (squareContent !== "blank" && squareContent === pieceColor)
      return legalSquares; // Stop if own piece is encountered

    legalSquares.push(currentSquareId); // Add square to legal moves
    // Stop if occupied by opposing piece
    if (squareContent !== "blank" && squareContent !== pieceColor)
      return legalSquares;
  }
  return legalSquares; // Return all legal squares
}

function moveToAFile(startingSquareId, pieceColor, boardSquaresArray) {
  const file = startingSquareId.charAt(0); // Get file (column)
  const rank = startingSquareId.charAt(1); // Get rank (row)
  let currentFile = file;
  let legalSquares = [];

  // Loop through files to the 'a' file
  while (currentFile !== "a") {
    currentFile = String.fromCharCode(
      currentFile.charCodeAt(currentFile.length - 1) - 1
    ); // Move to previous file
    let currentSquareId = currentFile + rank;
    let currentSquare = boardSquaresArray.find(
      (element) => element.squareId === currentSquareId
    );
    let squareContent = currentSquare.pieceColor;

    // Check if square is occupied by same color piece
    if (squareContent !== "blank" && squareContent === pieceColor)
      return legalSquares; // Stop if own piece is encountered

    legalSquares.push(currentSquareId); // Add square to legal moves
    // Stop if occupied by opposing piece
    if (squareContent !== "blank" && squareContent !== pieceColor)
      return legalSquares;
  }
  return legalSquares; // Return all legal squares
}




function moveToHFile(startingSquareId, pieceColor, boardSquaresArray) {
  // Get the starting file (column) and rank (row) from the square ID
  const file = startingSquareId.charAt(0);
  const rank = startingSquareId.charAt(1);
  let currentFile = file; // Initialize current file
  let legalSquares = []; // Array to hold legal squares

  // Move right until reaching file 'h'
  while (currentFile != "h") {
    currentFile = String.fromCharCode(currentFile.charCodeAt(currentFile.length - 1) + 1);
    let currentSquareId = currentFile + rank;
    let currentSquare = boardSquaresArray.find(
      (element) => element.squareId === currentSquareId
    );
    let squareContent = currentSquare.pieceColor;

    // If a friendly piece is found, stop and return legal squares
    if (squareContent != "blank" && squareContent == pieceColor)
      return legalSquares;

    legalSquares.push(currentSquareId); // Add current square to legal squares

    // Stop if an enemy piece is found
    if (squareContent != "blank" && squareContent != pieceColor)
      return legalSquares;
  }
  return legalSquares; // Return all legal squares found
}

function moveToEighthRankAFile(startingSquareId, pieceColor, boardSquaresArray) {
  // Get the starting file and rank
  const file = startingSquareId.charAt(0);
  const rank = startingSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let currentFile = file; // Initialize current file
  let currentRank = rankNumber; // Initialize current rank
  let legalSquares = []; // Array for legal squares

  // Move diagonally up-left until reaching file 'a' or rank '8'
  while (!(currentFile == "a" || currentRank == 8)) {
    currentFile = String.fromCharCode(currentFile.charCodeAt(currentFile.length - 1) - 1);
    currentRank++;
    let currentSquareId = currentFile + currentRank;
    let currentSquare = boardSquaresArray.find(
      (element) => element.squareId === currentSquareId
    );
    let squareContent = currentSquare.pieceColor;

    // If a friendly piece is found, stop and return legal squares
    if (squareContent != "blank" && squareContent == pieceColor)
      return legalSquares;

    legalSquares.push(currentSquareId); // Add current square to legal squares

    // Stop if an enemy piece is found
    if (squareContent != "blank" && squareContent != pieceColor)
      return legalSquares;
  }
  return legalSquares; // Return legal squares
}

function moveToEighthRankHFile(startingSquareId, pieceColor, boardSquaresArray) {
  // Get the starting file and rank
  const file = startingSquareId.charAt(0);
  const rank = startingSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let currentFile = file; // Initialize current file
  let currentRank = rankNumber; // Initialize current rank
  let legalSquares = []; // Array for legal squares

  // Move diagonally up-right until reaching file 'h' or rank '8'
  while (!(currentFile == "h" || currentRank == 8)) {
    currentFile = String.fromCharCode(currentFile.charCodeAt(currentFile.length - 1) + 1);
    currentRank++;
    let currentSquareId = currentFile + currentRank;
    let currentSquare = boardSquaresArray.find(
      (element) => element.squareId === currentSquareId
    );
    let squareContent = currentSquare.pieceColor;

    // If a friendly piece is found, stop and return legal squares
    if (squareContent != "blank" && squareContent == pieceColor)
      return legalSquares;

    legalSquares.push(currentSquareId); // Add current square to legal squares

    // Stop if an enemy piece is found
    if (squareContent != "blank" && squareContent != pieceColor)
      return legalSquares;
  }
  return legalSquares; // Return legal squares
}

function moveToFirstRankAFile(startingSquareId, pieceColor, boardSquaresArray) {
  // Get the starting file and rank
  const file = startingSquareId.charAt(0);
  const rank = startingSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let currentFile = file; // Initialize current file
  let currentRank = rankNumber; // Initialize current rank
  let legalSquares = []; // Array for legal squares

  // Move diagonally down-left until reaching file 'a' or rank '1'
  while (!(currentFile == "a" || currentRank == 1)) {
    currentFile = String.fromCharCode(currentFile.charCodeAt(currentFile.length - 1) - 1);
    currentRank--;
    let currentSquareId = currentFile + currentRank;
    let currentSquare = boardSquaresArray.find(
      (element) => element.squareId === currentSquareId
    );
    let squareContent = currentSquare.pieceColor;

    // If a friendly piece is found, stop and return legal squares
    if (squareContent != "blank" && squareContent == pieceColor)
      return legalSquares;

    legalSquares.push(currentSquareId); // Add current square to legal squares

    // Stop if an enemy piece is found
    if (squareContent != "blank" && squareContent != pieceColor)
      return legalSquares;
  }
  return legalSquares; // Return legal squares
}





// Moves pieces to the first rank in the H file
function moveToFirstRankHFile(startingSquareId, pieceColor, boardSquaresArray) {
  const file = startingSquareId.charAt(0);
  const rank = startingSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let currentFile = file;
  let currentRank = rankNumber;
  let legalSquares = [];

  // Loop until reaching the H file or first rank
  while (!(currentFile == "h" || currentRank == 1)) {
    currentFile = String.fromCharCode(
      currentFile.charCodeAt(currentFile.length - 1) + 1 // Move to next file
    );
    currentRank--; // Move down one rank
    let currentSquareId = currentFile + currentRank;
    let currentSquare = boardSquaresArray.find(
      (element) => element.squareId === currentSquareId
    );
    let squareContent = currentSquare.pieceColor;

    // Check if the square is occupied by the same color
    if (squareContent != "blank" && squareContent == pieceColor)
      return legalSquares; // End if same color found
    legalSquares.push(currentSquareId); // Add square to legal moves
    // Stop if an opponent's piece is found
    if (squareContent != "blank" && squareContent != pieceColor)
      return legalSquares;
  }
  return legalSquares; // Return all legal squares
}

// Retrieves piece properties at a given square
function getPieceAtSquare(squareId, boardSquaresArray) {
  let currentSquare = boardSquaresArray.find(
    (element) => element.squareId === squareId
  );
  const color = currentSquare.pieceColor;
  const pieceType = currentSquare.pieceType;
  const pieceId = currentSquare.pieceId;
  return { pieceColor: color, pieceType: pieceType, pieceId: pieceId };
}

// Checks if the king is in check based on possible attacks
function isKingInCheck(squareId, pieceColor, boardSquaresArray) {
  // Check for rook and queen threats
  let legalSquares = getRookMoves(squareId, pieceColor, boardSquaresArray);
  for (let squareId of legalSquares) {
    let pieceProperties = getPieceAtSquare(squareId, boardSquaresArray);
    if (
      (pieceProperties.pieceType == "rook" ||
        pieceProperties.pieceType == "queen") &&
      pieceColor != pieceProperties.pieceColor
    )
      return true; // King is in check
  }

  // Check for bishop and queen threats
  legalSquares = getBishopMoves(squareId, pieceColor, boardSquaresArray);
  for (let squareId of legalSquares) {
    let pieceProperties = getPieceAtSquare(squareId, boardSquaresArray);
    if (
      (pieceProperties.pieceType == "bishop" ||
        pieceProperties.pieceType == "queen") &&
      pieceColor != pieceProperties.pieceColor
    )
      return true; // King is in check
  }

  // Check for knight threats
  legalSquares = getKnightMoves(squareId, pieceColor, boardSquaresArray);
  for (let squareId of legalSquares) {
    let pieceProperties = getPieceAtSquare(squareId, boardSquaresArray);
    if (
      pieceProperties.pieceType == "knight" &&
      pieceColor != pieceProperties.pieceColor
    )
      return true; // King is in check
  }

  // Check for pawn threats
  legalSquares = checkPawnDiagonalCaptures(
    squareId,
    pieceColor,
    boardSquaresArray
  );
  for (let squareId of legalSquares) {
    let pieceProperties = getPieceAtSquare(squareId, boardSquaresArray);
    if (
      pieceProperties.pieceType == "pawn" &&
      pieceColor != pieceProperties.color
    )
      return true; // King is in check
  }

  // Check for threats from other kings
  legalSquares = getKingMoves(squareId, pieceColor, boardSquaresArray);
  for (let squareId of legalSquares) {
    let pieceProperties = getPieceAtSquare(squareId, boardSquaresArray);
    if (
      pieceProperties.pieceType == "king" &&
      pieceColor != pieceProperties.color
    )
      return true; // King is in check
  }
  return false; // No threats detected
}

// Retrieves the last move of the king of a specific color
function getkingLastMove(color) {
  let kingLastMove = moves.findLast(
    (element) => element.pieceType === "king" && element.pieceColor === color
  );
  if (kingLastMove == undefined) return isWhiteTurn ? "e1" : "e8"; // Default positions
  return kingLastMove.to; // Return the last move
}

// Validates if a move keeps the king safe from check
function isMoveValidAgainstCheck(
  legalSquares,
  startingSquareId,
  pieceColor,
  pieceType
) {
  let kingSquare = isWhiteTurn
    ? getkingLastMove("white")
    : getkingLastMove("black");
  let boardSquaresArrayCopy = deepCopyArray(boardSquaresArray);
  let legalSquaresCopy = legalSquares.slice();

  legalSquaresCopy.forEach((element) => {
    let destinationId = element;
    boardSquaresArrayCopy = deepCopyArray(boardSquaresArray); // Reset board copy
    updateBoardSquaresArray(
      startingSquareId,
      destinationId,
      boardSquaresArrayCopy // Update the board state for the move
    );

    // Check for non-king pieces
    if (
      pieceType != "king" &&
      isKingInCheck(kingSquare, pieceColor, boardSquaresArrayCopy)
    ) {
      legalSquares = legalSquares.filter((item) => item != destinationId); // Remove illegal move
    }
    // Check for king moves
    if (
      pieceType == "king" &&
      isKingInCheck(destinationId, pieceColor, boardSquaresArrayCopy)
    ) {
      legalSquares = legalSquares.filter((item) => item != destinationId); // Remove illegal move
    }
  });
  return legalSquares; // Return valid moves
}



function checkForEndGame() {
  // Check for checkmate or stalemate situations
  checkForCheckMateAndStaleMate();
  
  // Generate the current FEN position and move count
  let currentPosition = generateFEN(boardSquaresArray);
  let moveCount = Math.floor(moves.length / 2) + 1;

  // Get evaluation of the current position
  getEvaluation(currentPosition, function(lines, evaluations, scoreString) {
    displayEvaluation(lines, evaluations, scoreString, isWhiteTurn, moveCount);
  });

  // Store the current position for repetition checks
  positionArray.push(currentPosition);
  
  // Check for draw conditions
  let threeFoldRepetition = isThreefoldRepetition();
  let insufficientMaterial = hasInsufficientMaterial(currentPosition);
  let fiftyMovesRuleCount = currentPosition.split(" ")[4];
  let fiftyMovesRule = fiftyMovesRuleCount != 100 ? false : true;
  let isDraw = threeFoldRepetition || insufficientMaterial || fiftyMovesRule;

  if (isDraw) {
    // Prevent further moves and notify players of a draw
    allowMovement = false;
    showAlert("Draw");

    // Disable drag and drop for the pieces
    document.addEventListener("dragstart", function(event) {
      event.preventDefault();
    });
    document.addEventListener("drop", function(event) {
      event.preventDefault();
    });
  }
}

function checkForCheckMateAndStaleMate() {
  // Get the king's last position based on the current turn
  let kingSquare = isWhiteTurn ? getkingLastMove("white") : getkingLastMove("black");
  let pieceColor = isWhiteTurn ? "white" : "black";
  
  // Create a copy of the board for analysis
  let boardSquaresArrayCopy = deepCopyArray(boardSquaresArray);
  
  // Check if the king is in check
  let kingIsCheck = isKingInCheck(kingSquare, pieceColor, boardSquaresArrayCopy);
  
  // Get all possible moves for the current player
  let possibleMoves = getAllPossibleMoves(boardSquaresArrayCopy, pieceColor);
  
  // If there are possible moves, return without further checks
  if (possibleMoves.length > 0) return;
  
  // Determine if the game is a checkmate or stalemate
  let message = "";
  if (kingIsCheck) {
    message = isWhiteTurn ? "Black Wins!" : "White Wins!";
  } else {
    message = "Draw";
  }
  
  // Display the result in a popup
  showAlert(message);
}

function checkGameEndConditions() {
  let message = "";

  // Check for checkmate or stalemate
  checkForCheckMateAndStaleMate();

  // Check for the fifty-move rule
  if (getFiftyMovesRuleCount() >= 50) {
    message = "Draw by Fifty-Move Rule";
  }

  // Check for threefold repetition
  if (isThreefoldRepetition()) {
    message = "Draw by Threefold Repetition";
  }

  // Check for insufficient material
  if (hasInsufficientMaterial(getFEN())) {
    message = "Draw by Insufficient Material";
  }

  // If a message exists, display it as a popup
  if (message !== "") {
    showAlert(message);
  }
}

function showAlert(message) {
  // Create the popup element
  let popup = document.createElement("div");
  popup.style.position = "fixed";
  popup.style.left = "50%";
  popup.style.top = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.padding = "20px";
  popup.style.backgroundColor = "#f8f9fa";
  popup.style.border = "1px solid #333";
  popup.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.2)";
  popup.style.zIndex = "1000";
  popup.style.fontSize = "20px";
  popup.style.color = "#333";
  popup.innerText = message;

  // Add a close button
  let closeButton = document.createElement("button");
  closeButton.innerText = "Close";
  closeButton.style.marginTop = "10px";
  closeButton.style.padding = "5px 10px";
  closeButton.style.backgroundColor = "#007bff";
  closeButton.style.color = "#fff";
  closeButton.style.border = "none";
  closeButton.style.cursor = "pointer";
  closeButton.onclick = function() {
    document.body.removeChild(popup);
  };

  popup.appendChild(closeButton);
  document.body.appendChild(popup);
}

// Add these functions to handle FEN and other conditions
function getFEN() {
  // This function should return the current board state in FEN format
  // Assuming you have a function that generates FEN string from boardSquaresArray
  return generateFEN(boardSquaresArray);
}





function getSqaureColor(squareId) {
  // Get the square element by its ID and determine its color (white/black)
  let squareElement = document.getElementById(squareId);
  let squareColor = squareElement.classList.contains("white") ? "white" : "black";
  return squareColor;
}

function getAllPossibleMoves(squaresArray, color) {
  // Get all possible moves for the pieces of the specified color
  return squaresArray
    .filter((square) => square.pieceColor === color) // Filter squares based on color
    .flatMap((square) => {
      const { pieceColor, pieceType, pieceId } = getPieceAtSquare(square.squareId, squaresArray);
      if (pieceId === "blank") return []; // Skip empty squares

      let squaresArrayCopy = deepCopyArray(squaresArray); // Create a copy of the squares array
      const pieceObject = { pieceColor, pieceType, pieceId }; // Create a piece object

      // Get possible moves and validate against check
      let legalSquares = getPossibleMoves(square.squareId, pieceObject, squaresArrayCopy);
      legalSquares = isMoveValidAgainstCheck(legalSquares, square.squareId, pieceColor, pieceType);
      return legalSquares; // Return valid legal squares
    });
}
function showAlert(message) {
  // Display an alert message for a specified duration
  const alert = document.getElementById("alert");
  alert.innerHTML = message; // Set the alert message
  alert.style.display = "block"; // Show the alert

  setTimeout(function () {
    alert.style.display = "none"; // Hide the alert after 3 seconds
  }, 3000);
}

function getEvaluation(fen, callback) {
  // Initialize a Stockfish engine worker for evaluation
  let engine = new Worker("./node_modules/stockfish/src/stockfish-nnue-16.js");
  let evaluations = [];
  let lines = [];
  let possibleMoves = 3; // Number of possible moves to evaluate

  engine.onmessage = function (event) {
    let message = event.data;

    // Process only specific depth information
    if (message.startsWith("info depth 10")) { 
      let multipvIndex = message.indexOf("multipv");
      if (multipvIndex !== -1) {
        let multipvString = message.slice(multipvIndex).split(" ")[1]; // Get multipv index
        let multipv = parseInt(multipvString);
        let scoreIndex = message.indexOf("score cp");

        if (scoreIndex !== -1) {
          // Handle score from centipawns
          var scoreString = message.slice(scoreIndex).split(" ")[2];
          let evaluation = parseInt(scoreString) / 100; // Convert score to evaluation
          evaluation = isWhiteTurn ? evaluation : evaluation * -1; // Adjust for player turn
          evaluations[multipv - 1] = evaluation; // Store evaluation
        } else {
          // Handle score from checkmate
          scoreIndex = message.indexOf("score mate");
          scoreString = message.slice(scoreIndex).split(" ")[2];
          evaluation = parseInt(scoreString);
          evaluation = Math.abs(evaluation);
          evaluations[multipv - 1] = "#" + evaluation; // Store checkmate evaluation
        }

        let pvIndex = message.indexOf(" pv ");
        if (pvIndex !== -1) {
          // Get principal variation (best moves)
          let pvString = message.slice(pvIndex + 4).split(" ");
          lines[multipv - 1] = pvString.join(" "); // Store the principal variation
          // Check if evaluations for all possible moves are received
          if (evaluations.length === possibleMoves && lines.length === possibleMoves) {
            callback(lines, evaluations, scoreString); // Execute callback with results
          }
        }
      }
    }

    // Check if the message indicates the number of moves searched
    if (message.startsWith("Nodes searched:")) { 
      let parts = message.split(" ");
      let numberOfMoves = parseInt(parts[2]);
      if (numberOfMoves < 3) { // If fewer than 3 moves are found
        possibleMoves = numberOfMoves; // Update possible moves
        line1.innerHTML = ""; 
        line2.innerHTML = ""; 
        line3.innerHTML = "";
        eval1.innerHTML = ""; 
        eval2.innerHTML = ""; 
        eval3.innerHTML = "";
      }
    }
  };

  // Send commands to the Stockfish engine
  engine.postMessage("uci");
  engine.postMessage("isready");
  engine.postMessage("ucinewgame");
  engine.postMessage(`setoption name multipv value 3`); // Set multipv to 3
  engine.postMessage("position fen " + fen); // Set the position using FEN
  engine.postMessage("go perft 1"); // Go for perft 1 (performance test)
  engine.postMessage("go depth 10"); // Start evaluation to depth 10
}





function displayEvaluation(lines, evaluations, scoreString, whiteTurn = true, moveNumber = 1) {
  let blackBar = document.querySelector(".blackBar");
  
  // Calculate black bar height based on the evaluation
  let blackBarHeight = 50 - (evaluations[0] / 15) * 100; 
  blackBarHeight = blackBarHeight > 100 ? 100 : blackBarHeight; // Cap height at 100%
  blackBarHeight = blackBarHeight < 0 ? 0 : blackBarHeight; // Floor height at 0%
  blackBar.style.height = blackBarHeight + "%"; // Set the height of the black bar

  let evalNum = document.querySelector(".evalNum");
  evalNum.innerHTML = evaluations[0]; // Display the current evaluation

  for (let i = 0; i < lines.length; i++) {
    let eval = document.getElementById("eval" + (i + 1));
    let line = document.getElementById("line" + (i + 1));
    
    eval.innerHTML = evaluations[i]; // Display evaluation for each line
    line.innerHTML = convertStockfishToStandardNotation(lines[i], moveNumber, whiteTurn); // Convert and display the move

    document.getElementById("eval").innerHTML = evaluations[0]; // Display the main evaluation
    
    // Set evaluation text based on evaluation score
    if (Math.abs(evaluations[0]) < 0.5) 
      document.getElementById("evalText").innerHTML = "Equal";
    if (evaluations[0] < 1 && evaluations[0] >= 0.5) 
      document.getElementById("evalText").innerHTML = "White is slightly better";
    if (evaluations[0] > -1 && evaluations[0] <= -0.5) 
      document.getElementById("evalText").innerHTML = "Black is slightly better";
    if (evaluations[0] < 2 && evaluations[0] >= 1) 
      document.getElementById("evalText").innerHTML = "White is much better";
    if (evaluations[0] > -2 && evaluations[0] <= -1) 
      document.getElementById("evalText").innerHTML = "Black is much better";
    if (evaluations[0] > 2) 
      document.getElementById("evalText").innerHTML = "White is winning";
    if (evaluations[0] < -2) 
      document.getElementById("evalText").innerHTML = "Black is winning";

    // Check for checkmate indication in evaluation
    if (evaluations[0].toString().includes("#")) {
      const mateInMoves = evaluations[0].slice(1); // Extract moves to mate
      const isWhiteWinning = (parseInt(scoreString) > 0 && whiteTurn) || (parseInt(scoreString) < 0 && !whiteTurn);
      const winningColor = isWhiteWinning ? "White" : "Black";
      
      // Update evaluation text for checkmate scenario
      document.getElementById("evalText").innerHTML = `${winningColor} can mate in ${mateInMoves} moves`;
      blackBarHeight = isWhiteWinning ? 0 : 100; // Set black bar height for mate
      blackBar.style.height = blackBarHeight + "%"; // Update black bar height
    }
  }
}




function convertStockfishToStandardNotation(stockfishMoves, moveNumber, whiteTurn) {
  let standardMoves = ""; // Initialize an empty string for standard moves
  let moves = stockfishMoves.split(" "); // Split the stockfish moves into an array
  let boardSquaresArrayCopy = deepCopyArray(boardSquaresArray); // Create a deep copy of the board state

  for (let i = 0; i < moves.length; i++) {
    let move = moves[i];
    let from = move.substring(0, 2); // Get the starting square of the move
    let to = move.substring(2, 4); // Get the target square of the move
    let promotion = move.length > 4 ? move.charAt(4) : null; // Check for pawn promotion

    let fromSquare = boardSquaresArrayCopy.find(square => square.squareId === from); // Find the piece at the starting square
    let toSquare = getPieceAtSquare(to, boardSquaresArrayCopy); // Get the piece at the target square

    if (fromSquare && toSquare) {
      let fromPiece = fromSquare.pieceType; // Get the piece type at the starting square
      
      // Convert piece type to standard notation
      switch (fromPiece.toLowerCase()) {
        case "pawn": fromPiece = ""; break;
        case "knight": fromPiece = "N"; break;
        case "bishop": fromPiece = "B"; break;
        case "rook": fromPiece = "R"; break;   
        case "queen": fromPiece = "Q"; break;  
        case "king": fromPiece = "K"; break;
      }
      
      let captureSymbol = ""; // Initialize capture symbol
      // Determine if a capture is made
      if ((toSquare.pieceType !== "blank") || 
          (toSquare.pieceType === "blank" && fromSquare.pieceType.toLowerCase() === "pawn" && from.charAt(0) !== to.charAt(0))) {
        captureSymbol = "x"; // Set capture symbol
        if (fromSquare.pieceType.toLowerCase() === "pawn") {
          fromPiece = from.charAt(0); // Set pawn's file for capture
        }
      }
      
      let standardMove = `${fromPiece}${captureSymbol}${to}`; // Form the standard move notation
      
      // Handle promotion notation
      if (promotion) {
        switch (promotion.toLowerCase()) {
          case "q": standardMove += "=Q"; break;
          case "r": standardMove += "=R"; break;
          case "b": standardMove += "=B"; break;
          case "n": standardMove += "=N"; break;  
        }
      }

      // Get the color of the opponent's king
      let kingColor = fromSquare.pieceColor === "white" ? "black" : "white";
      let kingSquareId = getKingSquare(kingColor, boardSquaresArrayCopy); // Get opponent's king square
      updateBoardSquaresArray(from, to, boardSquaresArrayCopy); // Update board state with the move

      // Check if the king is in check after the move
      if (isKingInCheck(kingSquareId, kingColor, boardSquaresArrayCopy)) {
        standardMove += "+"; // Append check indication
      }

      // Handle castling for kingside
      if ((standardMove === "Kg8" && fromSquare.squareId === "e8") || 
          (standardMove === "Kg1" && fromSquare.squareId === "e1")) {
        if (standardMove === "Kg8") 
          updateBoardSquaresArray("h8", "f8", boardSquaresArrayCopy); // Update board for kingside castling
        else 
          updateBoardSquaresArray("h1", "f1", boardSquaresArrayCopy);
        standardMove = "O-O"; // Standard notation for kingside castling
      }

      // Handle castling for queenside
      if ((standardMove === "Kc8" && fromSquare.squareId === "e8") || 
          (standardMove === "Kc1" && fromSquare.squareId === "e1")) {
        if (standardMove === "Kc8") 
          updateBoardSquaresArray("a8", "d8", boardSquaresArrayCopy); // Update board for queenside castling
        else 
          updateBoardSquaresArray("a1", "d1", boardSquaresArrayCopy);
        standardMove = "O-O-O"; // Standard notation for queenside castling
      }

      // Add move number and standard move to the notation string
      standardMoves += `${(whiteTurn && i % 2 === 0) || (!whiteTurn && i % 2 === 1) ? " " + moveNumber++ + "." : " "}${standardMove}`;

      // Special handling for the first move in the game
      if (!whiteTurn && i === 0) 
        standardMoves = `${moveNumber + ". ... "}${standardMove} `;
    }
  }
  return standardMoves.trim(); // Return the final standard move notation
}

// Function to get the square ID of the king of a given color
function getKingSquare(color, squareArray) {
  let kingSquare = squareArray.find(square => square.pieceType.toLowerCase() === "king" && square.pieceColor === color);
  return kingSquare ? kingSquare.squareId : null; // Return the king's square ID or null if not found
}













function checkForCheckMate(){
  let kingSquare=isWhiteTurn ? getkingLastMove("white") : getkingLastMove("black");
  let pieceColor=isWhiteTurn ? "white" : "black";
  let boardSquaresArrayCopy=deepCopyArray(boardSquaresArray);
  let kingIsCheck=isKingInCheck(kingSquare,pieceColor,boardSquaresArrayCopy);
  if(!kingIsCheck)return;
  let possibleMoves=getAllPossibleMoves(boardSquaresArrayCopy,pieceColor);
  if(possibleMoves.length>0) return;
  let message="";
  isWhiteTurn ? (message="Black Wins!") : (message="White Wins!");
  showAlert(message);
}
function getAllPossibleMoves(squaresArray,color) {
  return squaresArray
  .filter((square)=>square.pieceColor===color).
  flatMap((square)=>{
    const {pieceColor,pieceType,pieceId} = getPieceAtSquare(square.squareId,squaresArray);
    if(pieceId==="blank") return [];
    let squaresArrayCopy=deepCopyArray(squaresArray);
    const pieceObject={pieceColor:pieceColor,pieceType:pieceType,pieceId:pieceId}
    let legalSquares=getPossibleMoves(square.squareId,pieceObject,squaresArrayCopy);
    legalSquares=isMoveValidAgainstCheck(legalSquares,square.squareId,pieceColor,pieceType);
    return legalSquares;
  })
}
function showAlert(message) {
  const alert= document.getElementById("alert");
  alert.innerHTML=message;
  alert.style.display="block";

  setTimeout(function(){
     alert.style.display="none";
  },3000);
}





function updateBoardDOM(currentSquareId, destinationSquareId, pieceType, pieceColor, capturedPiece) {
  // Find the current square element in the DOM
  let currentSquareElement = document.getElementById(currentSquareId);
  let destinationSquareElement = document.getElementById(destinationSquareId);

  // Move the piece back to its original position
  let pieceImg = document.createElement("img");
  pieceImg.src = `${pieceColor}-${pieceType}.png`; // Assuming piece images are in this format
  pieceImg.alt = pieceType;
  pieceImg.style.width = "100%"; // Make sure the image fills the square
  pieceImg.style.height = "100%";

  // Clear the current square
  currentSquareElement.innerHTML = "";

  // Place the piece back in the destination square
  destinationSquareElement.innerHTML = "";
  destinationSquareElement.appendChild(pieceImg);

  // If there was a captured piece, restore it to the current square
  if (capturedPiece) {
    let capturedImg = document.createElement("img");
    capturedImg.src = `${capturedPiece.pieceColor}-${capturedPiece.pieceType}.png`;
    capturedImg.alt = capturedPiece.pieceType;
    capturedImg.style.width = "100%";
    capturedImg.style.height = "100%";
    currentSquareElement.appendChild(capturedImg); // Put the captured piece back
  }
}



// Move function to handle captures
function movePiece(piece, fromSquareId, toSquareId) {
  const fromSquareElement = document.getElementById(fromSquareId);
  const toSquareElement = document.getElementById(toSquareId);

  // Store captured piece if any
  const capturedPiece = toSquareElement.querySelector("img");

  const moveDetails = {
    pieceId: piece.id,        // The ID of the moved piece
    from: fromSquareId,       // Original square
    to: toSquareId,           // Destination square
    captured: capturedPiece   // Store the captured piece if any
  };

  moves.push(moveDetails); // Store move details for undo functionality

  // Move piece visually
  fromSquareElement.removeChild(piece);
  toSquareElement.appendChild(piece);

  // If there's a captured piece, remove it visually from the board
  if (capturedPiece) {
    capturedPiece.remove();
  }

  // Apply any animation to the moved piece
  piece.classList.add("dropped");
  setTimeout(() => {
    piece.classList.remove("dropped");
  }, 500); // Duration of the animation
}




function undoArray(boardSquaresArray) {
  if (moves.length === 0) {
    console.log("No moves to undo.");
    return; // No moves to undo
  }

  // Step 1: Remove the last move from move history
  let lastMove = moves.pop();

  // Step 2: Find the source and destination squares for the undo
  let currentSquareId = lastMove.to;
  let destinationSquareId = lastMove.from;

  // Step 3: Move the piece back to its original position in the board array
  updateBoardSquaresArray(currentSquareId, destinationSquareId, boardSquaresArray, lastMove.pieceType);

  // Step 4: If a piece was captured, restore the captured piece at the destination square
  if (lastMove.captured) {
    let destinationSquareElement = boardSquaresArray.find(element => element.squareId === currentSquareId);

    // Restore the captured piece's details (pieceType, pieceColor, and pieceId)
    destinationSquareElement.pieceType = lastMove.captured.pieceType;
    destinationSquareElement.pieceColor = lastMove.captured.pieceColor;
    destinationSquareElement.pieceId = lastMove.captured.pieceId;
  }

  // Step 5: Update the DOM visually to reflect the undo
  updateBoardDOM(currentSquareId, destinationSquareId, lastMove.pieceType, lastMove.pieceColor, lastMove.captured);

  // Step 6: Update move history in the DOM
  displayMoveHistory();

  // Step 7: Reset game state to allow further moves
  resetGameStateForNextMove();
}


// Handle drag start
function handleDragStart(event) {
  const piece = event.target;
  piece.classList.add("dragging"); // Add the dragging class to the piece
}

// Handle drag end
function handleDragEnd(event) {
  const piece = event.target;
  piece.classList.remove("dragging"); // Remove the dragging class

  // Assuming you have logic to determine if the move was valid or not
  if (moveIsValid) {
    piece.classList.add("dropped"); // Add a class for smooth drop animation
  } else {
    piece.classList.add("invalid-drop"); // Add a class to snap it back
    setTimeout(() => {
      piece.classList.remove("invalid-drop");
    }, 300); // Remove class after animation ends
  }
}

// Event listeners for dragging
document.querySelectorAll('.chess-piece').forEach(piece => {
  piece.addEventListener('dragstart', handleDragStart);
  piece.addEventListener('dragend', handleDragEnd);
});





function movePiece(piece, fromSquare, toSquare) {
  const fromSquareElement = document.getElementById(fromSquare);
  const toSquareElement = document.getElementById(toSquare);

  // Remove piece from its original position
  fromSquareElement.removeChild(piece);

  // Add piece to the new square
  toSquareElement.appendChild(piece);

  // Apply the animation
  piece.classList.add("dropped");

  setTimeout(() => {
    piece.classList.remove("dropped"); // Remove class after animation ends
  }, 500); // Adjust time based on your animation duration
}


