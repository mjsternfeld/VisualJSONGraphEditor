// CustomDialogNode.js
import React, {  useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { Handle, useUpdateNodeInternals } from '@xyflow/react';


const CustomDialogNode = ({ data }) => {
    
    const { node, incomingChoices, outgoingChoices, selectedID } = data;
    //console.log("NODE: " + JSON.stringify(node));
    //console.log("INCOMINGCHOICES: " + JSON.stringify(incomingChoices));
    //console.log("OUTGOINGCHOICES: " + JSON.stringify(node.choices));
    //console.log("OUTGOINGCHOICES2: " + JSON.stringify(outgoingChoices));
    
    const [dialog, setDialog] = useState(node.npcDialog);

    const updateNodeInternals = useUpdateNodeInternals();

    useEffect(() => {
        //call updateNodeInternals to refresh handles when data or id changes
        updateNodeInternals(node.id);
        setDialog(node.npcDialog);
    }, [node, incomingChoices, updateNodeInternals]);


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

