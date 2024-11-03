// import React, { useRef, useEffect, useState } from 'react';
// import io from 'socket.io-client';

// interface MyBoard {
//     brushColor: string;
//     brushSize: number;
// }

// const Board: React.FC<MyBoard> = (props) => {

//     const { brushColor, brushSize } = props;
//     const canvasRef = useRef<HTMLCanvasElement>(null);

//     const [socket, setSocket] = useState(null);

//     useEffect(() => {
//         //const newSocket = io('http://localhost:5000');
//         const newSocket = io('http://192.168.1.174:5000');
//         console.log(newSocket, "Connected to socket");
//         setSocket(newSocket);
//     }, []);


//     useEffect(() => {

//         if (socket) {
//             // Event listener for receiving canvas data from the socket
//             socket.on('canvasImage', (data) => {
//                 // Create an image object from the data URL
//                 const image = new Image();
//                 image.src = data;

//                 const canvas = canvasRef.current;
//                 // eslint-disable-next-line react-hooks/exhaustive-deps
//                 const ctx = canvas.getContext('2d');
//                 // Draw the image onto the canvas
//                 image.onload = () => {
//                     ctx.drawImage(image, 0, 0);
//                 };
//             });
//         }
//     }, [socket]);


//     // Function to start drawing
//     useEffect(() => {

//         // Variables to store drawing state
//         let isDrawing = false;
//         let lastX = 0;
//         let lastY = 0;
//         const startDrawing = (e: { offsetX: number; offsetY: number; }) => {
//             isDrawing = true;

//             console.log(`drawing started`, brushColor, brushSize);
//             [lastX, lastY] = [e.offsetX, e.offsetY];
//         };

//         // Function to draw
//         const draw = (e: { offsetX: number; offsetY: number; }) => {
//             if (!isDrawing) return;

//             const canvas = canvasRef.current;
//             const ctx = canvas.getContext('2d');
//             if (ctx) {
//                 ctx.beginPath();
//                 ctx.moveTo(lastX, lastY);
//                 ctx.lineTo(e.offsetX, e.offsetY);
//                 ctx.stroke();
//             }

//             [lastX, lastY] = [e.offsetX, e.offsetY];
//         };

//         // Function to end drawing
//         const endDrawing = () => {
//             const canvas = canvasRef.current;
//             const dataURL = canvas.toDataURL(); // Get the data URL of the canvas content

//             // Send the dataURL or image data to the socket
//             // console.log('drawing ended')
//             if (socket) {
//                 socket.emit('canvasImage', dataURL);
//                 console.log('drawing ended')
//             }
//             isDrawing = false;
//         };

//         const canvas: HTMLCanvasElement | null = canvasRef.current;
//         const ctx = canvasRef.current?.getContext('2d');

//         // Set initial drawing styles
//         if (ctx) {
//             ctx.strokeStyle = brushColor;
//             ctx.lineWidth = brushSize;

//             ctx.lineCap = 'round';
//             ctx.lineJoin = 'round';

//         }
//         // Event listeners for drawing
//         canvas.addEventListener('mousedown', startDrawing);
//         canvas.addEventListener('mousemove', draw);
//         canvas.addEventListener('mouseup', endDrawing);
//         canvas.addEventListener('mouseout', endDrawing);

//         return () => {
//             // Clean up event listeners when component unmounts
//             canvas.removeEventListener('mousedown', startDrawing);
//             canvas.removeEventListener('mousemove', draw);
//             canvas.removeEventListener('mouseup', endDrawing);
//             canvas.removeEventListener('mouseout', endDrawing);
//         };
//     }, [brushColor, brushSize, socket]);


//     const [windowSize, setWindowSize] = useState([
//         window.innerWidth,
//         window.innerHeight,
//     ]);

//     useEffect(() => {
//         const handleWindowResize = () => {
//             setWindowSize([window.innerWidth, window.innerHeight]);
//         };

//         window.addEventListener('resize', handleWindowResize);

//         return () => {
//             window.removeEventListener('resize', handleWindowResize);
//         };
//     }, []);


//     return (
//         <canvas
//             ref={canvasRef}
//             width={windowSize[0] > 600 ? 600 : 300}
//             height={windowSize[1] > 400 ? 400 : 200}
//             style={{ backgroundColor: 'white' }}
//         />
//     );
// };

// export default Board;



import React, { useRef, useEffect, useState } from 'react';
import io from 'socket.io-client';

interface MyBoard {
    initialBrushColor: string;
    initialBrushSize: number;
}

const Board: React.FC<MyBoard> = ({ initialBrushColor, initialBrushSize }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [socket, setSocket] = useState(null);
    const [brushColor, setBrushColor] = useState(initialBrushColor);
    const [brushSize, setBrushSize] = useState(initialBrushSize);
    const [isErasing, setIsErasing] = useState(false);
    const [isDrawingShape, setIsDrawingShape] = useState('');
    const [history, setHistory] = useState<string[]>([]);
    const [redoStack, setRedoStack] = useState<string[]>([]);
    const [chatMessages, setChatMessages] = useState<string[]>([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const newSocket = io('http://192.168.1.174:5000');
        console.log("Connected to socket:", newSocket);
        setSocket(newSocket);
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on('canvasImage', (data) => {
                const image = new Image();
                image.src = data;
                const canvas = canvasRef.current;
                const ctx = canvas?.getContext('2d');
                image.onload = () => {
                    ctx?.drawImage(image, 0, 0);
                };
            });

            socket.on('chatMessage', (message) => {
                setChatMessages((prevMessages) => [...prevMessages, message]);
            });
        }
    }, [socket]);

    useEffect(() => {
        let isDrawing = false;
        let startX = 0;
        let startY = 0;

        const startDrawing = (e: MouseEvent) => {
            isDrawing = true;
            startX = e.offsetX;
            startY = e.offsetY;
            if (isDrawingShape) {
                drawShape(e.offsetX, e.offsetY, isDrawingShape, true);
            }
        };

        const draw = (e: MouseEvent) => {
            if (!isDrawing) return;

            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (ctx && !isDrawingShape) {
                ctx.strokeStyle = isErasing ? 'white' : brushColor;
                ctx.lineWidth = brushSize;
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(e.offsetX, e.offsetY);
                ctx.stroke();
                startX = e.offsetX;
                startY = e.offsetY;
            }
        };

        const endDrawing = () => {
            isDrawing = false;
            const canvas = canvasRef.current;
            if (canvas) {
                saveState(canvas);
                socket?.emit('canvasImage', canvas.toDataURL());
            }
        };

        const canvas = canvasRef.current;
        if (canvas) {
            canvas.addEventListener('mousedown', startDrawing);
            canvas.addEventListener('mousemove', draw);
            canvas.addEventListener('mouseup', endDrawing);
            canvas.addEventListener('mouseout', endDrawing);
        }

        return () => {
            if (canvas) {
                canvas.removeEventListener('mousedown', startDrawing);
                canvas.removeEventListener('mousemove', draw);
                canvas.removeEventListener('mouseup', endDrawing);
                canvas.removeEventListener('mouseout', endDrawing);
            }
        };
    }, [brushColor, brushSize, isErasing, socket, isDrawingShape]);

    const saveState = (canvas: HTMLCanvasElement) => {
        const dataURL = canvas.toDataURL();
        setHistory([...history, dataURL]);
        setRedoStack([]);
    };

    const handleUndo = () => {
        if (history.length > 0) {
            const prevState = history.pop();
            setRedoStack([...(redoStack || []), canvasRef.current.toDataURL()]);
            setHistory(history);
            restoreCanvas(prevState);
        }
    };

    const handleRedo = () => {
        if (redoStack.length > 0) {
            const nextState = redoStack.pop();
            setHistory([...history, canvasRef.current.toDataURL()]);
            restoreCanvas(nextState);
        }
    };

    const restoreCanvas = (dataURL: string | undefined) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx && dataURL) {
            const image = new Image();
            image.src = dataURL;
            image.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(image, 0, 0);
            };
        }
    };

    const handleClearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            socket?.emit('canvasImage', canvas?.toDataURL());
        }
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        const link = document.createElement('a');
        link.download = 'canvas.png';
        link.href = canvas.toDataURL();
        link.click();
    };

    const sendMessage = () => {
        if (message && socket) {
            socket.emit('chatMessage', message);
            setMessage('');
        }
    };

    const drawShape = (x: number, y: number, shape: string, preview: boolean = false) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !shape) return;

        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;

        switch (shape) {
            case 'rectangle':
                ctx.strokeRect(startX, startY, x - startX, y - startY);
                break;
            case 'circle':
                ctx.beginPath();
                const radius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
                ctx.arc(startX, startY, radius, 0, Math.PI * 2);
                ctx.stroke();
                break;
            default:
                break;
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '10px' }}>
                <label>
                    Brush Color:
                    <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} />
                </label>

                <label style={{ marginLeft: '10px' }}>
                    Brush Size:
                    <input type="range" min="1" max="20" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} />
                </label>

                <button onClick={() => setIsErasing(!isErasing)} style={{ marginLeft: '10px' }}>
                    {isErasing ? 'Brush' : 'Eraser'}
                </button>

                <button onClick={() => setIsDrawingShape('rectangle')} style={{ marginLeft: '10px' }}>Rectangle</button>
                <button onClick={() => setIsDrawingShape('circle')} style={{ marginLeft: '10px' }}>Circle</button>

                <button onClick={handleUndo} style={{ marginLeft: '10px' }}>Undo</button>
                <button onClick={handleRedo} style={{ marginLeft: '10px' }}>Redo</button>
                <button onClick={handleClearCanvas} style={{ marginLeft: '10px' }}>Clear</button>
                <button onClick={handleSave} style={{ marginLeft: '10px' }}>Save</button>
            </div>

            <canvas ref={canvasRef} width={1400} height={600} style={{ backgroundColor: 'white', border: '1px solid #000' }} />

            <div>
                <h3>Chat</h3>
                <div style={{ border: '1px solid black', height: '200px', overflowY: 'scroll', padding: '5px', marginBottom: '10px' }}>
                    {chatMessages.map((msg, index) => (
                        <div key={index}>{msg}</div>
                    ))}
                </div>
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message"
                    style={{ marginRight: '5px' }}
                />
                <button onClick={sendMessage}>Send</button>
            </div>
        </div>
    );
};

export default Board;
