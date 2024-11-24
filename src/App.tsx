import { useEffect, useState } from "react";
import "./App.css";
import nintendo from "./images/nintendo.jpg";
import { BackgroundLines } from "./components/ui/background-lines";
import { Meteors } from "./components/ui/meteors";
import { clear } from "console";

type SliceImageResult = {
  x: number;
  y: number;
  dataUrl: string;
};

const sliceImageIntoGrid = async (
  imageSrc: string
): Promise<SliceImageResult[]> => {
  const image = new Image();
  image.src = imageSrc;

  // Wait for the image to load
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = (err) => reject(err);
  });

  const gridSize = 4; // 4x4 grid
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to create canvas context");
  }

  const sliceWidth = image.width / gridSize;
  const sliceHeight = image.height / gridSize;

  canvas.width = sliceWidth;
  canvas.height = sliceHeight;

  const slices: SliceImageResult[] = [];

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      ctx.clearRect(0, 0, sliceWidth, sliceHeight);
      ctx.drawImage(
        image,
        x * sliceWidth,
        y * sliceHeight,
        sliceWidth,
        sliceHeight,
        0,
        0,
        sliceWidth,
        sliceHeight
      );

      const dataUrl = canvas.toDataURL();
      slices.push({ x, y, dataUrl });
    }
  }

  return slices;
};

function App() {
  const gridSize = 4;
  const [puzzle, setPuzzle] = useState<string[][]>(
    Array.from({ length: gridSize }, () => Array(gridSize).fill(""))
  );
  const [emptySlot, setEmptySlot] = useState({ row: 3, col: 3 });
  const [isLoading, setIsLoading] = useState(false);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [originalPuzzle, setOriginalPuzzle] = useState<string[][]>(
    Array.from({ length: gridSize }, () => Array(gridSize).fill(""))
  );
  const [isSolved, setIsSolved] = useState(false);

  const getSeconds = (ms: number) => {
    return Math.floor(ms / 1000);
  };

  useEffect(() => {
    const processImage = async () => {
      const src = nintendo;
      const result = await sliceImageIntoGrid(src);

      // Initialize puzzle with image slices
      const initialPuzzle = Array.from({ length: gridSize }, (_, row) =>
        Array.from(
          { length: gridSize },
          (_, col) => result[row * gridSize + col]?.dataUrl || "" // Last slot will be empty
        )
      );
      initialPuzzle[gridSize - 1][gridSize - 1] = ""; // Set last slot as empty
      setOriginalPuzzle([...initialPuzzle]);
      shufflePuzzle([...initialPuzzle], { row: 3, col: 3 });
    };

    processImage();
  }, []);

  const shufflePuzzle = async (
    initialPuzzle: string[][],
    emptySlot: { row: number; col: number }
  ) => {
    const maxShuffles = 10; // Number of random moves to shuffle
    let currentPuzzle = [...initialPuzzle];
    let emptyPos = { ...emptySlot };
    setIsLoading(true);
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    for (let i = 0; i < maxShuffles; i++) {
      const validMoves = getValidMoves(emptyPos);
      const nextMove =
        validMoves[Math.floor(Math.random() * validMoves.length)];

      // Perform the swap
      const { row, col } = nextMove;
      currentPuzzle[emptyPos.row][emptyPos.col] = currentPuzzle[row][col];
      currentPuzzle[row][col] = "";

      // Update the empty position
      emptyPos = nextMove;

      // Set the puzzle state after each move
      setPuzzle(currentPuzzle);
      setEmptySlot(emptyPos);

      // Wait for half a second before the next move
      await delay(10);
    }
    setIsLoading(false);
  };

  const getValidMoves = ({ row, col }: { row: number; col: number }) => {
    const moves = [
      { row: row - 1, col }, // Up
      { row: row + 1, col }, // Down
      { row, col: col - 1 }, // Left
      { row, col: col + 1 }, // Right
    ];

    // Filter moves that are out of bounds
    return moves.filter(
      (move) =>
        move.row >= 0 &&
        move.row < gridSize &&
        move.col >= 0 &&
        move.col < gridSize
    );
  };

  const handleTileClick = (row: number, col: number) => {
    if (isLoading) return;
    const { row: emptyRow, col: emptyCol } = emptySlot;

    // Check if the clicked tile is adjacent to the empty slot
    const isAdjacent =
      (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
      (Math.abs(col - emptyCol) === 1 && row === emptyRow);

    if (isAdjacent) {
      // Swap the clicked tile with the empty slot
      const newPuzzle = [...puzzle];
      newPuzzle[emptyRow][emptyCol] = newPuzzle[row][col];
      newPuzzle[row][col] = "";

      setPuzzle(newPuzzle);
      setEmptySlot({ row, col });
      if (time === 0) {
        setStartTime(Date.now());
      }
      setMoves(moves + 1);
    }
  };

  useEffect(() => {
    if (startTime === 0) return;
    startTimer();
  }, [startTime]);

  const startTimer = () => {
    const interval = setInterval(() => {
      if (isSolved) {
        clearInterval(interval);
        return;
      }
      // console.log("Time: ", Date.now() - startTime);
      setTime(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  };

  const checkPuzzleComplete = () => {
    const isComplete = originalPuzzle.every((row, i) =>
      row.every((cell, j) => cell === puzzle[i][j])
    );
  
    if (isComplete) {
      console.log("Puzzle complete!");
      setIsSolved(true);
    }else{
      
    }
  };
  useEffect(() => {
    // checkPuzzleComplete();
  },[puzzle]);

  return (
    <BackgroundLines className="flex items-center justify-center w-full flex-col px-4 z-20 dark h-screen">
      <div className="flex flex-col items-center justify-center h-screen">
        {/* <h1 className="md:text-4xl text-3xl lg:text-6xl font-bold text-center text-white relative z-20 bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 py-3">Sliding Puzzle</h1> */}
        <div className="relative flex flex-col items-center justify-center h-screen">
          <div className="margin-auto w-2/3 z-40 max-w-4xl z-20 absolute">
            <img
              src={nintendo}
              alt="original"
              className="w-full h-full margin-auto"
            />
          </div>
          <div
            id="puzzle"
            className={
              isLoading
                ? " w-2/3 z-40 max-w-4xl opacity-10 cursor-wait z-40"
                : " w-2/3 z-40 max-w-4xl z-40"
            }
          >
            <div className="flex flex-col border-[0.5px] border-dashed border-sky-700 w-full m-auto rounded-md overflow-hidden">
              {puzzle.map((row, i) => (
                <div key={i} className="flex">
                  {row.map((cell, j) => (
                    <div
                      key={j}
                      className={
                        "w-1/4 h-1/4 min-w-4 min-h-4 bg-slate-950 border-[0.5px] border-dashed border-sky-700 aspect-square cursor-pointer" +
                        (cell ? "" : " cursor-help active:opacity-70")
                      }
                      onMouseDown={() => handleTileClick(i, j)}
                    >
                      {cell && (
                        <img src={cell} alt="slice" className="w-full h-full" />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="">
          <div className=" w-full relative max-w-xs mb-4">
            <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-blue-500 to-teal-500 transform scale-[0.80] bg-red-500 rounded-full blur-3xl" />
            <div className="relative shadow-xl bg-gray-900 border border-gray-800  px-8 py-8 h-full overflow-hidden rounded-2xl flex flex-col justify-center items-center">
              <h1 className="font-bold text-xl text-white mb-4 relative z-50">
                {moves} moves 
              </h1>
              <Meteors number={20} />
            </div>
          </div>
        </div>
      </div>
    </BackgroundLines>
  );
}

export default App;
