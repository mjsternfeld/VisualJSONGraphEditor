//This component is used to represent the player dialog nodes,
//i.e., a node containing a player line of dialog and pointers
//to the NPC nodes this leads / responds to 

import React, {  useEffect, useState, } from 'react';
import { Handle, useUpdateNodeInternals } from '@xyflow/react';

const CustomChoiceNode = ({ data }) => {
    
    const {choice, selectedID} = data;
    //choice: all the data contained in this node
    //selectedID: the ID of the currently selected DialogNode in format `node-${node.id}`
    //(if the parent node is selected, this choice node is also highlighted)

    const [dialog, setDialog] = useState(choice.playerResponse);

    //console.log("DATA: " + JSON.stringify(data));
    //console.log("DATA2: " + JSON.stringify(choice));
    //console.log("CHOICENODE: selectedID: " + selectedID + ", choice.parentId: " + `node-${choice.parentId}`);

    //check if the parent node is selected, and if yes, highlight this node in red
    const isSelected = selectedID == `node-${choice.parentId}`;
    const backgroundColor = isSelected ? 'rgb(255,0,0)' : 'rgb(0, 73, 98)';

    const updateNodeInternals = useUpdateNodeInternals(); //used by ReactFlow to consider changes in the data
    useEffect(() => {
        updateNodeInternals(choice.choiceId);
        setDialog(choice.playerResponse);
    }, [choice, updateNodeInternals]);

    return (
        <div style={{ padding: 10, border: '1px dashed #222', borderRadius: 5, color:'white', background: backgroundColor }}>
            <div>{dialog}</div>
            <Handle
                type="target"
                position="top"
                style={{ left: '50%', transform: 'translateX(-50%)' }}
            />
            {!choice.isExit && (
                <Handle
                    type="source"
                    position="bottom"
                    style={{ left: '50%', transform: 'translateX(-50%)' }}
                />
            )}
        </div>
    );
};

export default CustomChoiceNode;
