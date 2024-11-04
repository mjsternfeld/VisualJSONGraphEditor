import React from 'react';
import { getBezierPath } from 'react-flow-renderer';

const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, style = {}, markerEnd }) => {
    //custom bezier curve for more spacing in edges
    const offsetX = Math.abs(targetX - sourceX) * 0.5;
    const offsetY = Math.abs(targetY - sourceY) * 0.5;

    const [path] = getBezierPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition: 'bottom',
        targetPosition: 'top',
        controlX1: sourceX + offsetX,
        controlY1: sourceY + offsetY,
        controlX2: targetX - offsetX,
        controlY2: targetY - offsetY,
    });

    return (
        <path
            id={id}
            style={{
                ...style,
                stroke: '#4a90e2',       //color
                strokeWidth: 2.5,        //thicker edge
                opacity: 0.8,
            }}
            d={path}
            fill="none"
            markerEnd={markerEnd}
        />
    );
};

export default CustomEdge;
