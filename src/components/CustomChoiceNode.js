// CustomChoiceNode.js
import React, {  useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { Handle } from '@xyflow/react';

const CustomChoiceNode = ({ data }) => {
    
    const {choice} = data;
    console.log("DATA: " + JSON.stringify(data));
    console.log("DATA2: " + JSON.stringify(choice));
    


    return (
        <div style={{ padding: 10, border: '1px dashed #222', borderRadius: 5, color:'white' }}>
            <div>{choice.playerResponse}</div>
            
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
