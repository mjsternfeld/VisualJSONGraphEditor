// CustomDialogNode.js
import React, {  useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { Handle, useUpdateNodeInternals } from '@xyflow/react';


const CustomDialogNode = ({ data }) => {
    
    const { node, incomingChoices, outgoingChoices, selectedID } = data;
    console.log("NODE: " + JSON.stringify(node));
    console.log("INCOMINGCHOICES: " + JSON.stringify(incomingChoices));
    console.log("OUTGOINGCHOICES: " + JSON.stringify(node.choices));
    console.log("OUTGOINGCHOICES2: " + JSON.stringify(outgoingChoices));
    
    const [dialog, setDialog] = useState(node.npcDialog);

    const updateNodeInternals = useUpdateNodeInternals();

    useEffect(() => {
        // Call updateNodeInternals to refresh handles when data or id changes
        updateNodeInternals(node.id);
        setDialog(node.npcDialog);
    }, [node, incomingChoices, updateNodeInternals]);


    const isSelected = selectedID == `node-${node.id}`;
    console.log("selectedID: " + selectedID + ", node.id: " + node.id + ", " + isSelected);
    const backgroundColor = isSelected ? 'rgb(255,0,0)' : 'rgb(0, 112, 0)';

    return (
        <div style={{ padding: 10, border: '1px solid #222', borderRadius: 5, color:'white', background: backgroundColor }}>
            <div>{dialog}</div>
            
            {/* Create source handle at the bottom */}
            {/* Outgoing edges to choices */}
            {outgoingChoices.map((choice, index) => {
                
                const handleId  = `source-node-${node.id}-to-choice-${choice.choiceId}`;
                console.log("Creating handle with id: " + handleId);

                return (
                    <Handle
                        key={handleId}
                        type="source"
                        position="bottom"
                        id={handleId}
                        style={{ left: `${(index + 1) * (100 / (outgoingChoices.length + 1))}%` }} // Adjust left position dynamically
                    />
                )

            })}
            
            {/* Create target handles at the top */}
            {/* Incoming edges from choices */}
            {incomingChoices.map((choice, index) =>  {
                
                const handleId  = `target-choice-${choice.choiceId}-to-node-${node.id}`;
                console.log("Creating handle with id: " + handleId);

                return (
                    <Handle
                        key={handleId}
                        type="target"
                        position="top"
                        id={handleId}
                        style={{ left: `${(index + 1) * (100 / (incomingChoices.length + 1))}%`, transform: 'translateX(-50%)' }} // Centered at the bottom
                    />
                )

            })}
        </div>
    );
};

export default CustomDialogNode;

