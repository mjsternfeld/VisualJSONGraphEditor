import React, { useState, useRef } from 'react';
import ReactFlow from 'react-flow-renderer';
import './App.css';

const App = () => {
    const fileInputRef = useRef(null); 
    const [elements, setElements] = useState([]); //storing graph nodes

    //import json from .json file with structure {"nodes": [<the actual nodes>]}
    //nodes need to have an "id" field
    const handleImport = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    console.log("Imported JSON Data:", data);
    
                    //check if 'nodes' is present and an array
                    if (!data.nodes || !Array.isArray(data.nodes))
                        throw new Error("Imported JSON does not contain a valid 'nodes' array.");
    
                    //create nodes from the imported data
                    const newElements = data.nodes.map((node) => ({
                        id: node.id, //ensure unique ID
                        data: { ...node }, //keep all data intact
                    }));
    
                    setElements(newElements);
                } catch (error) {
                    console.error("Error parsing JSON:", error);
                }
            };
            reader.readAsText(file);
        }
    };
    

    const handleImportClick = () => {
        fileInputRef.current.click(); // Trigger file input dialog
    };

    const handleExport = () => {
        const nodes = elements.map((element) => ({
            id: element.id, // Keep the node ID
            ...element.data // Include all custom data associated with the node
        }));
    
        const json = JSON.stringify({ nodes }, null, 2); // Wrap nodes in an object
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
    
        const a = document.createElement('a');
        a.href = url;
        a.download = 'graph.json';
        a.click();
        URL.revokeObjectURL(url); // Clean up the URL object
    };
    

    return (
        <div className="app-container">
            <header className="header">
                <h1>VisualJSONGraphEditor</h1>
            </header>
            <div className="sidebar-and-flow-container">
                <aside className="sidebar">
                    <button className="sidebar-buttons-1" onClick={handleImportClick}>
                        Import JSON
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} //attach ref to input
                        style={{ display: 'none' }} //hide the input
                        accept=".json" //only allow JSON files
                        onChange={handleImport} //handle file selection
                    />
                    <button className="sidebar-buttons-1" onClick={handleExport}>
                        Export JSON
                    </button>
                </aside>
                <div className="flow-container">
                    <ReactFlow elements={elements} />
                </div>
            </div>
        </div>
    );
};

export default App;
