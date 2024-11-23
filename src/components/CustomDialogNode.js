//This component is used to represent the NPC dialog nodes, 
//i.e., a node containing an NPC line of dialog and pointers
//to player responses to that NPC line.
import React, {  useEffect, useState } from 'react';
import { Handle, useUpdateNodeInternals } from '@xyflow/react';


const CustomDialogNode = ({ data }) => {
    
    const { node, incomingChoices, outgoingChoices, selectedID } = data;
    //node: the 
    //incomingChoices: the list of player choices (dialog lines) that lead to this node as the NPC's response
    //outgoingChoices: the list of player choices (dialog lines) the player can say to respond to this node (this NPC dialog line)
    //selectedID: the ID of the currently selected DialogNode in format `node-${node.id}`, used for highlighting the selected nodes and its outgoing choices

    //console.log("NODE: " + JSON.stringify(node));
    //console.log("INCOMINGCHOICES: " + JSON.stringify(incomingChoices));
    //console.log("OUTGOINGCHOICES: " + JSON.stringify(node.choices));
    //console.log("OUTGOINGCHOICES2: " + JSON.stringify(outgoingChoices));
    
    const [dialog, setDialog] = useState(node.npcDialog);

    const updateNodeInternals = useUpdateNodeInternals(); //used by ReactFlow to consider changes in the data

    useEffect(() => {
        //call updateNodeInternals to refresh handles when data or id changes
        updateNodeInternals(node.id);
        setDialog(node.npcDialog);
    }, [node, incomingChoices, updateNodeInternals]);


    //check if this node is the currently selected one and highlight the node (and its choices) in red
    const isSelected = selectedID == `node-${node.id}`; 
    //console.log("selectedID: " + selectedID + ", node.id: " + node.id + ", " + isSelected);
    const backgroundColor = isSelected ? 'rgb(255,0,0)' : 'rgb(0, 112, 0)';

    return (
        <div style={{ padding: 10, border: '1px solid #222', borderRadius: 5, color:'white', background: backgroundColor }}>
            <div style={{width:'100%', textAlign:'center'}}>{node.id}</div>
            <hr style={{width:'100%'}}/>
            <div>{dialog}</div>
            <Handle
                type="source"
                position="bottom"
            />
            <Handle
                type="target"
                position="top"
            />
        </div>
    );
};

export default CustomDialogNode;

