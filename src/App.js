import React, {  useMemo, useEffect, useState, useRef, useCallback } from 'react';
import {ReactFlow, Controls, Background, applyEdgeChanges, applyNodeChanges, addEdge} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CustomDialogNode from './components/CustomDialogNode.js';
import CustomChoiceNode from './components/CustomChoiceNode.js';
import CustomEdge from './components/CustomEdge.js';
import './App.css';



const App = () => {
    const fileInputRef = useRef(null); 
    
    const [nodes, setNodes] = useState([]); //storing graph nodes (both NPC and Player nodes)
    const [edges, setEdges] = useState([]); //storing edges
    const [selectedNodeID, setSelectedNodeID] = useState(-1); //the current node to be edited (along with its choices)


    const onNodesChange = (changes) => {
        setNodes((nds) => applyNodeChanges(changes, nds));
    };

    const onNodeDragStop = (_event, node) => {
        setNodes((nds) =>
            nds.map((n) => (n.id === node.id ? { ...n, position: node.position } : n))
        );
        //console.log(`Node ${node.id} new position:`, node.position);
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
        //console.log('React Flow loaded:', reactFlowInstance);
    };

    //set the custom node and edge types to be used by ReactFlow
    const nodeTypes = useMemo(() => ({
        dialogNode: CustomDialogNode,
        choiceNode: CustomChoiceNode,
    }), []);
    const edgeTypes = useMemo(() => ({
        edgeTypes: CustomEdge
    }), []);

    useEffect(() => {
        //console.log("Updated nodes: ", JSON.stringify(nodes));
        //console.log("Updated edges: ", JSON.stringify(edges));
        //console.log("Updated selectedNodeID: ", JSON.stringify(selectedNodeID));
    }, [nodes, edges, selectedNodeID]);


    //this function is used to import a .json file and generate nodes and edges based on its contents
    const handleImport = (event) => {
        const file = event.target.files[0]; //parse file selected from file explorer dialog
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const dialogTree = JSON.parse(e.target.result);
                    if (!dialogTree.nodes || !Array.isArray(dialogTree.nodes)) //error handling for incorrect json structure
                        throw new Error("Imported JSON does not contain a valid 'nodes' array.");
    
                    //start out with empty arrays that are populated during the file parsing
                    const newNodes = [];
                    const newEdges = [];
    
                    //iterate over NPC dialog nodes (the contents of the "nodes" array)
                    dialogTree.nodes.forEach((node) => {

                        //fetch the player choice nodes that lead to the current NPC dialog node
                        const incomingChoices = dialogTree.nodes
                            .flatMap(n => n.choices)
                            .filter(choice => choice.nextNodeID === node.id && node.id !== 0);
                        

                        //console.log("incoming choices: " + JSON.stringify(incomingChoices));
                        
                        const dialogNodeId = `node-${node.id}`; //construct id string (this is to differentiate the NPC nodes from the Player nodes) 
                        const outgoingChoices = structuredClone(node.choices); //copy choices array because the original gets deleted later on
                        
                        //add the current (NPC) node along with the new fields that weren't contained in the original json file (incomingChoices, dialogNodeId)
                        newNodes.push({
                            id: dialogNodeId,
                            type: 'dialogNode', //node type for reactflow
                            data: {
                                node: node,
                                incomingChoices: incomingChoices,
                                outgoingChoices: outgoingChoices
                            },
                            position: { x: Math.random() * 400, y: Math.random() * 400 },
                        });
    
                        //iterate over available player responses to the current NPC dialog node
                        //create a choice node for each outgoing choice (player response) in the dialog node
                        node.choices.forEach((choice) => {
                            const choiceNodeId = `choice-${choice.choiceId}`; //create string id to differentiate from NPC node IDs
                            newNodes.push({
                                id: choiceNodeId,
                                type: 'choiceNode', //node type for reactflow
                                data: { choice: { 
                                    ...choice, //keep existing attributes
                                    parentId: node.id //add the parentId attribute (the ID of the NPC node this player node is a response to)
                                } },
                                position: { x: Math.random() * 400, y: Math.random() * 400 },
                            });
    

                            //create edge from NPC dialog node to player choice node (DtC)
                            //console.log("Pushing edge with source: " + dialogNodeId + " and target: " + choiceNodeId);
                            newEdges.push({
                                id: `DtC-${node.id}-${choice.choiceId}`,
                                source: dialogNodeId,
                                target: choiceNodeId,
                                type: 'simplebezier',
                                animated: true,
                                style: {}
                            });
    
                            //edge from choice node to next dialog node (CtD)
                            if (choice.nextNodeID !== undefined) { //check if there even is an outgoing edge
                                
                                const nextDialogNodeId = `node-${choice.nextNodeID}`;
                                //console.log("Pushing edge with source: " + choiceNodeId + " and target: " + nextDialogNodeId);
                                newEdges.push({
                                    id: `CtD-${choiceNodeId}-${nextDialogNodeId}`,
                                    source: choiceNodeId,
                                    target: nextDialogNodeId,
                                    type: 'simplebezier',
                                    animated: true
                                });
                            }
                        });
                    });

                    //set positions to avoid overlapping 
                    calculatePositions(newNodes);
                    
                    //delete unnecessary (redundant) DialogNode attribute (the choices array), otherwise it gets confusing later when the array would have to be overwritten for the export
                    newNodes.filter(nodeElement => nodeElement.type === "dialogNode")
                            .forEach(n => {delete n.data.node.choices;});
                    
                    //console.log("NEWNODES: " + JSON.stringify(newNodes));
                    //console.log("NEWEDGES: " + JSON.stringify(newEdges));

                    setNodes(newNodes);
                    setEdges(newEdges);
                } catch (error) {
                    console.error("Error parsing JSON:", error);
                }
            };
            reader.readAsText(file);
        }
    };

    //this updates the nodes' positions to (mostly) avoid them from overlapping and for better readability 
    const calculatePositions = (newNodes) => {
        const xSpacing = 700;
        const ySpacing = 300;
        const dialogNodes = newNodes.filter(node => node.type === "dialogNode");
        const choiceNodes = newNodes.filter(node => node.type === "choiceNode");
        
        let currentX = 0;
        let currentY = 0;
    
        dialogNodes.forEach((node, index) => {
            node.position = { x: currentX, y: currentY }; 
            currentX += xSpacing;
            if (index > 0 && index % 3 === 0) {
                currentX = 0;
                currentY += ySpacing;
            }
        });
    
        choiceNodes.forEach((node, index) => {
            const parentId = node.data.choice.parentId;
            const parentNode = newNodes.find(n => n.id === `node-${parentId}`);
            
            if (parentNode && parentNode.position) {
                const offsetX = (index % 2 === 0 ? -xSpacing / 3 : xSpacing / 3);
                const offsetY = ySpacing / 2; 
    
                node.position = {
                    x: parentNode.position.x + offsetX,
                    y: parentNode.position.y + offsetY
                };
            }
        });
    };

    //opens a file explorer dialog to select a json file to import
    const handleImportClick = () => {
        fileInputRef.current.click();
    };


    //create a json file following the required structure from all the current nodes and edges
    const handleExport = () => {

        const exportCopy = nodes;
        //fetch NPC dialog and player choice nodes separately
        const dialogNodes = exportCopy.filter(node => node.type === "dialogNode");
        const choiceNodes = exportCopy.filter(node => node.type === "choiceNode");
    
        //iterate over NPC dialog nodes
        dialogNodes.forEach(node => {
            //delete unnecessary attributes (they were only relevant for reactflow)
            delete node.position;
            delete node.type;
            delete node.incomingChoices;
            delete node.measured;
            delete node.selected;
            delete node.dragging;
    
            //get the nested data fields to get them to the correct level / depth in the output json
            node.id = node.data.node.id;
            node.npcDialog = node.data.node.npcDialog;
    
            //overwrite old choices with the updated ones from the ChoiceNodes
            //the outgoing choices array, i.e., the possible player responses
            node.choices = choiceNodes
                .map(cn => cn.data)
                .map(choice => choice.choice)
                .filter(cnd => cnd.parentId == node.id); //fetch relevant choices (that are children of the current DialogNode)
    
            delete node.data; //delete data once all its required fields have been extracted
        });
    
        //create output json containing a "nodes" array with the final output nodes
        const json = JSON.stringify({ nodes: dialogNodes }, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
    
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dialogTree.json';
        a.click();
        URL.revokeObjectURL(url);
    };
    


    //this method creates a new NPC dialog node (called from the "Create NPC line" button in the UI)
    const handleCreateNode = useCallback(() => {

        setNodes((prevNodes) => {
            //find the highest ID and increment it for the new node
            const maxId = Math.max(
                0,
                ...prevNodes
                    .filter(node => node.type === "dialogNode")
                    .map(node => node.data.node.id)
            );
            const newId = maxId + 1;
    
            //console.log("creating new node with id " + newId);
    
            const newNode = {
                id: `node-${newId}`,
                type: "dialogNode",
                data: {
                    node: { id: newId, npcDialog: "Enter your NPC dialog here" },
                    incomingChoices: [],
                    outgoingChoices: [],
                },
                position: { x: Math.random() * 400, y: Math.random() * 400 },
            };
    
            //return new nodes array with added node
            return [...prevNodes, newNode];
        });

    }, []);

    //this is called when the user selects a dialog node for editing by clicking it
    //sets the selected ID on all the NPC dialog nodes, which in turn highlights the selected node and its player response nodes
    const handleNodeClick = useCallback((_event, node) => {
        if(node.type === "dialogNode")
            setSelectedNodeID(node.id);
    }, []);

    const setNodesAndEdges = (localNodes, localEdges) => {
        //console.log("ASDF: " + localNodes.filter(n => n.type === "dialogNode").map(n => n.data.node.npcDialog));
        setNodes(localNodes);
        setEdges(localEdges);
    }


    //this component is used to display a selected node's fields (editable) and ChoiceEditor components for the outgoing player response nodes
    const NodeEditor = ({currentNodeId, nodesArray, edgesArray, setNodesAndEdges, setSelectedNodeID}) => {
        
        //local copies of nodes and edges so changes are only applied on confirmation
        let localNodesArray = structuredClone(nodesArray);
        let localEdgesArray = structuredClone(edgesArray);
        
        //current NPC dialog node which is displayed and editable in this NodeEditor
        const [NPCDialog, setNPCDialog] = useState(localNodesArray.find(n => n.id === currentNodeId).data.node.npcDialog);

        //the outgoing player choice nodes of the current NPC node
        const currentChoices = localNodesArray
            .filter(n => n.type === "choiceNode" //get all choices...
                && `node-${n.data.choice.parentId}` == currentNodeId); //...that are connected to the current node

        //console.log("CURRENTCHOICESINNODEEDITOR: " + JSON.stringify(currentChoices));

        //updates the "NPCDialog" string in the local copy of the current node, as well as in the localNodesArray 
        function handleNPCDialogChange(event) {
            const newDialog = event.target.value;
            setNPCDialog(newDialog);
            const updatedNode = localNodesArray.find(n => n.id === currentNodeId);
            if (updatedNode)
                updatedNode.data.node.npcDialog = newDialog;    
            //console.log(event.target.value + "," + updatedNode.data.node.npcDialog);
        }

        //generic function to update fields in choice nodes (called from the choice editor)
        const handleChoiceChange = (choiceId, field, newValue) => {
            const choiceNode = currentChoices.find(n => n.id === choiceId); //fetch choice node
            //console.log("HANDLECHOICECHANGE: choiceNode = " + JSON.stringify(choiceNode));
            if (choiceNode){
                
                //special edge case, 'rewire' the node: if the updated field is the nextNodeID, that means we need to adjust the node's outgoing edge
                if(field == "nextNodeID"){ 
                    //remove old edge to old nextNodeID
                    localEdgesArray = localEdgesArray.filter(edge => edge.id != `CtD-${choiceId}-node-${choiceNode.data.choice.nextNodeID}`);

                    //add new edge to new dialogNode
                    localEdgesArray.push({
                        id: `CtD-${choiceId}-${newValue}`,
                        source: `${choiceId}`,
                        target: `node-${newValue}`,
                        type: 'simplebezier',
                        animated: true,
                        style: {}
                    });
                }
                choiceNode.data.choice[field] = newValue; //update the field in the choice node
            }
        }

        //deletes a choice / player response node from this NPC dialog node
        const deleteChoice = (choiceId) =>{
            //console.log("nodes array " + localNodesArray);
            //console.log("DELETECHOICE: previous nodes: " + JSON.stringify(localNodesArray));
            //console.log("DELETECHOICE: previous edges: " + JSON.stringify(localEdgesArray));
            const deletedChoice = localNodesArray.find(n => n.id === choiceId);
            //console.log("DELETECHOICE: deletedChoice: " + JSON.stringify(deletedChoice));
            if (!deletedChoice) {
                //console.log("Choice not found");
                return;
            }

            //fetch IDs of previous / next node for edge removal 
            const parentId = deletedChoice.data.choice.parentId;
            const nextNodeId = deletedChoice.data.choice.nextNodeID; 

            //remove the two edges related to this choice
            localEdgesArray = localEdgesArray.filter(edge => 
                edge.id !== `DtC-${parentId}-${choiceId}` && 
                edge.id !== `CtD-choice-${choiceId}-node-${nextNodeId}`
            );
            
            //update parent node's outgoing choices
            const parentNode = localNodesArray
                .filter(n => n.type == "dialogNode")
                .find(node => node.data.node.id == parentId);
            //console.log("choiceId: " + choiceId);
            //console.log("parentNode: " + JSON.stringify(parentNode));
            parentNode.data.outgoingChoices = parentNode.data.outgoingChoices.filter(
                choice => `choice-${choice.choiceId}` != choiceId
            );
            //console.log("updated outgoing choices: " + JSON.stringify(parentNode.data.outgoingChoices)); 

            //update next node's incoming choices (remove this choice since it no longer leads to that node)
            if(!deletedChoice.data.choice.isExit){ //if it's an exit node, it has no next NPC dialog node
                const nextNode = localNodesArray
                    .filter(n => n.type == "dialogNode")
                    .find(node => node.data.node.id == nextNodeId);
                if(nextNode)
                    nextNode.data.incomingChoices = nextNode.data.incomingChoices.filter(
                        choice => `choice-${choice.choiceId}` != choiceId  
                    );
            }

            //remove the choice itself
            localNodesArray = localNodesArray.filter(n => n.id !== choiceId);

            //console.log("DELETECHOICE: current nodes: " + JSON.stringify(localNodesArray));
            //console.log("DELETECHOICE: current edges: " + JSON.stringify(localEdgesArray));

            //update nodes and edges with changes
            setNodesAndEdges(localNodesArray, localEdgesArray); //here we update the "real" arrays, because otherwise there's no visual feedback for choice deletion
        }

        //this creates a new player response / choice node (a possible response to this NPC dialog node)
        const handleAddChoice = () => {

            const parentId = currentNodeId.split('-')[1]; //fetch the int ID from the string ID (since that string has the pattern 'node-${intId}')
            
            const maxId = Math.max( //determine the choiceID (int)
                0,
                ...localNodesArray
                    .filter(node => node.type == "choiceNode")
                    .map(node => node.data.choice.choiceId)
            );
            const newId = maxId + 1;

            //console.log("creating new node with id " + newId);
            //create new choice with default values
            const newNode = {
                id: `choice-${newId}`,
                type: "choiceNode",
                data: {
                    choice: { 
                        choiceId: newId,
                        nextNodeID: -1,
                        playerResponse: "Enter your player dialog here",
                        seen: false,
                        parentId: parentId,
                        companionReaction: "neutral",
                        dqt: {},
                        dqc: {},
                        isExit: false
                    },
                },
                position: { x: Math.random() * 400, y: Math.random() * 400 },
            };
            localNodesArray.push(newNode);

            //create edge connecting the NPC dialog node to the newly created player choice node
            const newEdge = {
                id: `DtC-${parentId}-${newId}`,
                source: `node-${parentId}`,
                target: `choice-${newId}`,
                type: "simplebezier",
                animated: true,
                style: {}
            };
            localEdgesArray.push(newEdge);

            localNodesArray //add the new player choice node to the npc dialog node's outgoing choices
                .filter(node => node.type == "dialogNode")
                .find(node => node.id == currentNodeId).data.outgoingChoices.push(newNode.data.choice);
            
            setNodesAndEdges(localNodesArray, localEdgesArray); //immediately updating the "real" arrays because otherwise there's no visual feedback
        }

        //deletes the entire NPC dialog node and its outgoing player response nodes
        const handleDeleteNode = () => {

            //fetch choices
            const choicesToBeDeleted = localNodesArray
            .filter(n => n.type == "choiceNode")
            .filter(choice => `node-${choice.data.choice.parentId}` == currentNodeId); 
         
            //delete choice nodes and its edges
            choicesToBeDeleted.forEach(choice => {
                deleteChoice(choice.data.choice.choiceId);
            });

            //delete incoming edges to current node, and update nextNodeIDs of their sources 
            const prevChoicesToBeDeleted = localNodesArray
                .filter(n => n.type == "choiceNode")
                .filter(choice => choice.data.choice.nextNodeID == currentNodeId);
            prevChoicesToBeDeleted.forEach(choice => {
                choice.data.choice.nextNodeID = -1;
            });

            localEdgesArray = localEdgesArray.filter(edge => edge.target != `node-${currentNodeId}`
            );

            //delete outgoing choices
            const edgesToBeDeleted = localNodesArray
                .filter(n => n.type == "choiceNode")
                .filter(choice => `node-${choice.data.choice.parentId}` == currentNodeId); 

            localNodesArray = localNodesArray.filter(n => 
                !edgesToBeDeleted.includes(n));

            localNodesArray = localNodesArray.filter(node => node.id != currentNodeId);
            setSelectedNodeID(-1);

            setNodesAndEdges(localNodesArray, localEdgesArray); //immediately update "real" arrays, otherwise there's no visual feedback

        }

        //applies the changes to the fields of the currently selected node, as well as the player response / choice nodes 
        const saveChanges = () => {
            //create a deep clone of nodesArray to apply updates
            const updatedNodes = nodesArray.map(node => {
                if (node.id === currentNodeId) {
                    //update main node's NPCDialog
                    return {
                        ...node, //keep other fields the same
                        data: {
                            ...node.data,
                            node: {
                                ...node.data.node, //keep other data fields the same
                                npcDialog: NPCDialog //update NPCDialog field
                            }
                        }
                    };
                } else if (currentChoices.some(choice => choice.id === node.id)) {
                    //update choice nodes that match IDs in currentChoices
                    const choiceNode = currentChoices.find(choice => choice.id === node.id);
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            choice: {
                                ...node.data.choice, //keep the other fields, while updating all the field editable in the ChoiceEditor
                                playerResponse: choiceNode.data.choice.playerResponse,
                                companionReaction: choiceNode.data.choice.companionReaction,
                                isExit: choiceNode.data.choice.isExit,
                                nextNodeID: choiceNode.data.choice.nextNodeID
                            }
                        }
                    };
                }
                return node; //return unchanged nodes
            });
        
            const updatedEdges = structuredClone(localEdgesArray);
            setNodesAndEdges(updatedNodes, updatedEdges); //update "real" arrays to permanently save changes
        };
        
        
        return (
            <div style={{ alignItems: 'center', display:'grid' }}>
                <p>Currently editing node with id: {currentNodeId}</p>
                <table>
                <tbody>
                    <tr>
                        <td style={{width: '50%'}}>NPC Dialog:</td>
                        <td>
                            <input
                            type="text"
                            value={NPCDialog}
                            onChange={handleNPCDialogChange}
                            />
                        </td>
                    </tr>
                    
                </tbody>
                
                </table>
                
                {/*dynamically create choice editors based on the number of choice nodes this NPC node has*/}
                {currentChoices.map(choice => (
                    <div>
                        <ChoiceEditor 
                            key={choice.id}
                            data={choice.data}
                            onChoiceChange={(field, newValue) => handleChoiceChange(choice.id, field, newValue)} 
                        />
                        <button className='choice-editor-button' onClick={() => deleteChoice(choice.id)} style={{ width: '100%' }}>
                            Remove Player Response / Choice
                        </button>
                    </div>
                ))}
                <hr style={{width:'99%'}}></hr>
                <button className='node-editor-button' onClick={() => handleAddChoice()}>Add Player Response / Choice</button>    
                <hr style={{width:'99%'}}></hr>
                <button className='node-editor-button' onClick={() => handleDeleteNode()}>Delete Node</button>
                <button className='node-editor-button' onClick={saveChanges}>Save Changes</button>
            </div>
        )
    };

    //this component is used as a subcomponent of the NodeEditor to edit the player choice nodes belonging to that NPC node
    const ChoiceEditor = ({data, onChoiceChange}) => {
        
        const {choiceId, nextNodeID, playerResponse, companionReaction, dqc, dqt, isExit} = data.choice; //define data contained in the node's choice field
        
        //local copies of editable choice fields
        const [playerResponseField, setPlayerResponseField] = useState(playerResponse);
        const [companionReactionField, setCompanionReactionField] = useState(companionReaction);
        const [isExitField, setisExitField] = useState(isExit);
        const [nextNodeIdField, setNextNodeIdField] = useState(nextNodeID);
        
        //update methods for each editable choice field 

        function handlePlayerResponseFieldChange(event) {
            const newPlayerResponse = event.target.value;
            setPlayerResponseField(newPlayerResponse);
            onChoiceChange("playerResponse", newPlayerResponse);
        }

        function handleCompanionReactionFieldChange(event){
            const newCompanionReaction = event.target.value;
            setCompanionReactionField(newCompanionReaction);
            onChoiceChange("companionReaction", newCompanionReaction);
        }

        function handleIsExitFieldChange(event){
            const newIsExit = event.target.checked;
            setisExitField(newIsExit);
            onChoiceChange("isExit", newIsExit);
        }

        function handleNextNodeIdFieldChange(event){
            const newNextNodeId = event.target.value;
            setNextNodeIdField(newNextNodeId);
            onChoiceChange("nextNodeID", newNextNodeId);
        }

        return (
            <div>
                <hr></hr>
                <tr><td>choice id:</td><td>{choiceId}</td></tr>
                <tr>
                    <td>nextNodeID:</td>
                    <td>
                        <input 
                            type="number"
                            value={nextNodeIdField}
                            onChange={handleNextNodeIdFieldChange}
                        />
                    </td>
                </tr>
                <tr>
                    <td>Player response</td>
                    <td>
                        <input
                            style={{width:'95%'}}
                            type="text" 
                            value={playerResponseField}
                            onChange={handlePlayerResponseFieldChange}
                        />
                    </td>
                </tr>
                <tr>
                    <td>Companion reaction</td>
                    <td>
                        <select
                            style={{width:'100%'}}
                            value={companionReactionField}
                            onChange={handleCompanionReactionFieldChange}
                        >
                            <option value="hate">hate</option>
                            <option value="dislike">dislike</option>
                            <option value="neutral">neutral</option>
                            <option value="like">like</option>
                            <option value="love">love</option>
                        </select>
                    </td>
                </tr>
                <tr>
                    <td>isExit?</td> 
                    <td>
                        <input 
                            type='checkbox'
                            checked={isExitField}
                            onChange={handleIsExitFieldChange}
                        />
                    </td>
                </tr>
            </div>
        );
    };

    //the main app component. Contains title header bar, sidepanel with buttons for import/export and a button for creating new NPC nodes, as well as the actual reactflow container to display the trees
    return (
        <div className="app-container">
            <header className="header">
                <h1 style={{marginLeft: '20px'}}>VisualJSONGraphEditor</h1>
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
                    <hr style={{width:'100%', marginTop:'20px'}}/>
                    <button className='sidebar-buttons-1' onClick={handleCreateNode}>
                        Create NPC line
                    </button>
                </aside>
                <div className="flow-container">
                    <ReactFlow 
                        nodes={nodes.map(node => ({
                            ...node, //spread existing node properties
                            data: {
                                ...node.data, //spread existing data properties
                                selectedID: selectedNodeID //pass selectedNodeID in the data object
                                //this is so we can notify the node that it's selected, for highlighting
                            }
                        }))}
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
                        onNodeClick={handleNodeClick}
                        connectOnClick={false} //don't allow user to create new edges manually
                    >
                        <Controls/>
                        <Background/>
                    </ReactFlow>
                </div>
                {(selectedNodeID != -1) && <aside className="editor">
                    <h3>Node editor</h3>
                    <NodeEditor 
                        currentNodeId={selectedNodeID}
                        nodesArray={nodes}
                        edgesArray={edges}
                        setNodesAndEdges={setNodesAndEdges}
                        setSelectedNodeID={setSelectedNodeID}
                    />
                </aside>}
            </div>
        </div>
    );
};

export default App;