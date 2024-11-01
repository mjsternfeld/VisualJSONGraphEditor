// CustomDialogNode.js
import React, {  useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { Handle, useUpdateNodeInternals } from '@xyflow/react';


const CustomDialogNode = ({ data }) => {
    
    const { node, incomingChoices } = data;
    const outgoingChoices = node.choices;
    console.log("NODE: " + JSON.stringify(node));
    console.log("INCOMINGCHOICES: " + JSON.stringify(incomingChoices));
    console.log("OUTGOINGCHOICES: " + JSON.stringify(node.choices));
    console.log("OUTGOINGCHOICES2: " + JSON.stringify(outgoingChoices));
    

    const updateNodeInternals = useUpdateNodeInternals();

    useEffect(() => {
        // Call updateNodeInternals to refresh handles when data or id changes
        updateNodeInternals(node.id);
    }, [node, incomingChoices, updateNodeInternals]);

    return (
        <div style={{ padding: 10, border: '1px solid #222', borderRadius: 5, color:'white' }}>
            <div>{node.npcDialog}</div>
            
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
                        style={{ left: `${(index + 1) * (100 / (node.choices.length + 1))}%` }} // Adjust left position dynamically
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

