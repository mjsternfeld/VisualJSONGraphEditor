// CustomChoiceNode.js
import React, {  useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { Handle, useUpdateNodeInternals } from '@xyflow/react';

const CustomChoiceNode = ({ data }) => {
    
    const {choice, selectedID} = data;
    const [dialog, setDialog] = useState(choice.playerResponse);


    console.log("DATA: " + JSON.stringify(data));
    console.log("DATA2: " + JSON.stringify(choice));
    
    console.log("CHOICENODE: selectedID: " + selectedID + ", choice.parentId: " + `node-${choice.parentId}`);
    const isSelected = selectedID == `node-${choice.parentId}`;

    const backgroundColor = isSelected ? 'rgb(255,0,0)' : 'rgb(0, 73, 98)';

    const updateNodeInternals = useUpdateNodeInternals();
    useEffect(() => {
        updateNodeInternals(choice.choiceId);
        setDialog(choice.playerResponse);
    }, [choice, updateNodeInternals]);



    return (
        <div style={{ padding: 10, border: '1px dashed #222', borderRadius: 5, color:'white', background: backgroundColor }}>
            <div>{dialog}</div>
            
            {/* exactly one input */}
            <Handle
                type="target"
                position="top"
                id={`${choice.choiceId}-target`}
                style={{ left: '50%', transform: 'translateX(-50%)' }} // Centered at the bottom
            />
            
            {/* exactly one output (unless it's an exit node) */}
            {!choice.isExit && (
                <Handle
                    type="source"
                    position="bottom"
                    id={`${choice.choiceId}-source`}
                    style={{ left: '50%', transform: 'translateX(-50%)' }} // Centered at the top
                />
            )}
        </div>
    );
};

export default CustomChoiceNode;
