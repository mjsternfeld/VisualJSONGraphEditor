import React, {  useMemo, useEffect, useState, useRef, useCallback } from 'react';
import {ReactFlow, Controls, Background, applyEdgeChanges, applyNodeChanges, addEdge} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CustomDialogNode from './components/CustomDialogNode.js';
import CustomChoiceNode from './components/CustomChoiceNode.js';
import CustomEdge from './components/CustomEdge.js';
import './App.css';



const App = () => {
    const fileInputRef = useRef(null); 
    
    const [nodes, setNodes] = useState([]); // storing graph nodes and edges
    const [edges, setEdges] = useState([]); // storing graph nodes and edges
    

    const onNodesChange = (changes) => {
        setNodes((nds) => applyNodeChanges(changes, nds));
    };

    const onNodeDragStop = (event, node) => {
        setNodes((nds) =>
            nds.map((n) => (n.id === node.id ? { ...n, position: node.position } : n))
        );
        console.log(`Node ${node.id} new position:`, node.position);
    };
    
    const onEdgesChange = useCallback(
        (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        [],
    );

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        []
    );


    const onLoad = (reactFlowInstance) => {
        reactFlowInstance.fitView();
        console.log('React Flow loaded:', reactFlowInstance);
    };

    const nodeTypes = useMemo(() => ({
        dialogNode: CustomDialogNode,
        choiceNode: CustomChoiceNode,
    }), []);

    const edgeTypes = useMemo(() => ({
        edgeTypes: CustomEdge
    }), []);



    useEffect(() => {
        console.log("Updated nodes: ", JSON.stringify(nodes));
        console.log("Updated edges: ", JSON.stringify(edges));
    }, [nodes, edges]);


    const handleImport = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const dialogTree = JSON.parse(e.target.result);
                    if (!dialogTree.nodes || !Array.isArray(dialogTree.nodes))
                        throw new Error("Imported JSON does not contain a valid 'nodes' array.");
    
                    const newNodes = [];
                    const newEdges = [];
    
                    dialogTree.nodes.forEach((node) => {
                        //prepare incomingChoices for dynamic target handles
                        //these are the choice nodes that lead to the current dialog node
                        const incomingChoices = dialogTree.nodes
                            .flatMap(n => n.choices)
                            .filter(choice => choice.nextNodeID === node.id && node.id !== 0);
                        
                        console.log("incoming choices: " + JSON.stringify(incomingChoices));
                        
                        const dialogNodeId = `node-${node.id}`; 
                        // Dialog node with dynamic choices and incoming connections
                        newNodes.push({
                            id: dialogNodeId,
                            type: 'dialogNode',
                            data: {
                                node: node,
                                incomingChoices: incomingChoices
                            },
                            position: { x: Math.random() * 400, y: Math.random() * 400 },
                        });
    
                        // Create a choice node for each choice in the dialog node
                        node.choices.forEach((choice, index) => {
                            const choiceNodeId = `choice-${choice.choiceId}`;
                            newNodes.push({
                                id: choiceNodeId,
                                type: 'choiceNode',
                                data: { choice: { 
                                    ...choice,       // Spread the existing choice data
                                    parentId: node.id // Add the parentId attribute
                                } },
                                position: { x: Math.random() * 400, y: Math.random() * 400 },
                            });
    
                            // Edge from dialog node to choice node
                            const sourceHandleDtC = `source-node-${node.id}-to-choice-${choice.choiceId}`;
                            const targetHandleDtC = `${choice.choiceId}-target`;

                            console.log("Pushing edge with source: " + dialogNodeId 
                                + " and sourceHandle: " + sourceHandleDtC 
                                + " and target: " + choiceNodeId 
                                + " and targetHandle: " + targetHandleDtC);
                            
                            newEdges.push({
                                id: `DtC-${node.id}-${choice.choiceId}`,
                                source: dialogNodeId,
                                sourceHandle: sourceHandleDtC,
                                target: choiceNodeId,
                                targetHandle: targetHandleDtC,
                                type: 'simplebezier',
                                animated: true,
                                style: {}
                            });
    
                            // Edge from choice node to next dialog node
                            if (choice.nextNodeID !== undefined) {
                                
                                const nextDialogNodeId = `node-${choice.nextNodeID}`;
                                const sourceHandleCtD = `${choice.choiceId}-source`;
                                const targetHandleCtD = `target-choice-${choice.choiceId}-to-node-${choice.nextNodeID}`;

                                console.log("Pushing edge with source: " + choiceNodeId 
                                    + " and sourceHandle: " + sourceHandleCtD 
                                    + " and target: " + nextDialogNodeId 
                                    + " and targetHandle: " + targetHandleCtD);

                                newEdges.push({
                                    id: `CtD-${choiceNodeId}-${nextDialogNodeId}`,
                                    source: choiceNodeId,
                                    sourceHandle: sourceHandleCtD,
                                    target: nextDialogNodeId,
                                    targetHandle: targetHandleCtD,
                                    type: 'simplebezier',
                                    animated: true
                                });
                            }
                        });
                    });

                    //set positions to avoid overlapping 
                    calculatePositions(newNodes);
                    

                    setNodes(newNodes);
                    setEdges(newEdges);
                } catch (error) {
                    console.error("Error parsing JSON:", error);
                }
            };
            reader.readAsText(file);
        }
    };
    
    

    const handleImportClick = () => {
        fileInputRef.current.click();
    };

    const calculatePositions = (newNodes) => {
        const xSpacing = 700; // Horizontal spacing between dialog nodes
        const ySpacing = 300;  // Vertical spacing between levels
        const dialogNodes = newNodes.filter(node => node.type === "dialogNode");
        const choiceNodes = newNodes.filter(node => node.type === "choiceNode");
        
        let currentX = 0;
        let currentY = 0;
    
        // Position dialog nodes in a grid-like structure
        dialogNodes.forEach((node, index) => {
            node.position = { x: currentX, y: currentY };  // Directly set position on node
            currentX += xSpacing;
            if (index > 0 && index % 3 === 0) { // Move to the next row every 3 nodes
                currentX = 0;
                currentY += ySpacing;
            }
        });
    
        // Position choice nodes relative to their parent dialog node
        choiceNodes.forEach((node, index) => {
            const parentId = node.data.choice.parentId;
            const parentNode = newNodes.find(n => n.id === `node-${parentId}`);
            
            // If the parent position is defined, position the choice node near it
            if (parentNode && parentNode.position) {
                const offsetX = (index % 2 === 0 ? -xSpacing / 3 : xSpacing / 3);  // Alternate choice node X positioning
                const offsetY = ySpacing / 2; // Place choice nodes slightly below the parent
    
                node.position = {
                    x: parentNode.position.x + offsetX,
                    y: parentNode.position.y + offsetY
                };
            }
        });
    };
    
    
    
    
    
    


    const handleExport = () => {
        
        const exportCopy = nodes;
        const dialogNodes = exportCopy.filter(node => node.type === "dialogNode");
        const choiceNodes = exportCopy.filter(node => node.type === "choiceNode");
        console.log("CHOICENODES: " + JSON.stringify(choiceNodes));

        //delete unnecessary attributes that are just there for ReactFlow
        //also add the nested data back to the top level
        dialogNodes.forEach(node => {
                    
            //delete unnecessary attributes
            delete node.position;
            delete node.type;
            delete node.incomingChoices;
            delete node.measured;
            
            
            //get the nested data fields
            node.id = node.data.node.id;
            node.npcDialog = node.data.node.npcDialog;
            
            //overwrite old choices with the updated ones from the ChoiceNoces
            //(the map operations are because the data is nested)
            node.choices = choiceNodes.map(cn => cn.data).map(choice => choice.choice).filter(cnd => cnd.parentId === node.id); //fetch relevant choices (that are children of the current DialogNode)
            


            delete node.data; //delete data at the end when we finished fetching the required nested attributes

        });

        

        const json = JSON.stringify({ dialogNodes }, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'dialogTree.json';
        a.click();
        URL.revokeObjectURL(url);
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
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept=".json"
                        onChange={handleImport}
                    />
                    <button className="sidebar-buttons-1" onClick={handleExport}>
                        Export JSON
                    </button>
                </aside>
                <div className="flow-container">
                    <ReactFlow 
                        nodes={nodes}
                        edges={edges}
                        onLoad={onLoad}
                        style={{ width: '100%', height: '90vh' }}
                        colorMode='dark'
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        onNodesChange={onNodesChange}
                        onNodeDragStop={onNodeDragStop}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        fitView
                    >
                        <Controls/>
                        <Background/>
                    </ReactFlow>
                </div>
            </div>
        </div>
    );
};

export default App;
