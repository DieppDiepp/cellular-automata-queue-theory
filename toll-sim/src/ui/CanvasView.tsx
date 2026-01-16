import React, { useEffect, useRef } from 'react';
import type { Grid } from '../core/FanOutRule';
import { COLS, CELL, BOOTH_X, DIV_START, LOCK_START, MERGE_START } from '../core/constants';

interface CanvasViewProps {
    grid: Grid;
    tick: number; // Used to trigger redraws even if grid ref is stable
    L: number;    // Number of highway lanes
    showMergeDebug: boolean;
}

export const CanvasView: React.FC<CanvasViewProps> = ({ grid, tick, L, showMergeDebug }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const B = grid.length; // Dynamic B from grid

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Draw Background Zones

        // Highway Zone (0 to DIV_START) - Green tint
        // Only valid for lanes 0..L-1
        ctx.fillStyle = 'rgba(0, 255, 0, 0.05)';
        ctx.fillRect(0, 0, DIV_START * CELL, L * CELL);

        // Void/Blocked area in Highway Zone for lanes >= L
        if (L < B) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // Darker to show "no lane"
            ctx.fillRect(0, L * CELL, DIV_START * CELL, (B - L) * CELL);

            // Optional: Draw explicit boundary line at L
            ctx.strokeStyle = '#666';
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(0, L * CELL);
            ctx.lineTo(DIV_START * CELL, L * CELL);
            ctx.stroke();
        }

        // Fan-out zone (DIV_START to LOCK_START) - Yellow tint
        ctx.fillStyle = 'rgba(255, 255, 0, 0.05)';
        ctx.fillRect(DIV_START * CELL, 0, (LOCK_START - DIV_START) * CELL, B * CELL);

        // Lane commitment zone (LOCK_START to MERGE_START) - Red tint
        ctx.fillStyle = 'rgba(255, 0, 0, 0.05)';
        ctx.fillRect(LOCK_START * CELL, 0, (MERGE_START - LOCK_START) * CELL, B * CELL);

        // Merge Zone (MERGE_START to COLS) - Blue/Purple tint
        ctx.fillStyle = 'rgba(0, 0, 255, 0.05)';
        ctx.fillRect(MERGE_START * CELL, 0, (COLS - MERGE_START) * CELL, B * CELL);

        // Draw Contraction Guide Lines (Visual Only)
        // NOTE: These lines are purely illustrative to show the "contraction" concept.
        // They do NOT imply geometric movement; cars still move one discrete lane per timestep.
        ctx.strokeStyle = 'rgba(100, 100, 255, 0.2)';
        ctx.setLineDash([]);
        ctx.beginPath();
        for (let i = 0; i <= B; i++) {
            const yStart = i * CELL;
            const yEnd = i * (L / B) * CELL; // Map booth boundary to highway boundary
            ctx.moveTo(MERGE_START * CELL, yStart);
            ctx.lineTo(COLS * CELL, yEnd);
        }
        ctx.stroke();

        // Zone Labels
        ctx.fillStyle = '#666';
        ctx.font = '10px sans-serif';
        ctx.fillText('Highway', 5, 10);
        ctx.fillText('Queue Zone', DIV_START * CELL + 5, 10);
        ctx.fillText('Booths', LOCK_START * CELL + 5, 10);

        ctx.fillStyle = '#FF0000';
        ctx.font = '10px Arial';
        ctx.fillText("MERGE ENTRY (Junction)", MERGE_START * CELL + 5, 10);
        ctx.fillStyle = 'rgba(75, 0, 130, 0.5)';
        ctx.fillText("MERGE ZONE", MERGE_START * CELL + 5, B * CELL - 5);

        // Booth line
        ctx.strokeStyle = 'red';
        ctx.beginPath();
        const boothPixelX = BOOTH_X * CELL;
        ctx.moveTo(boothPixelX, 0);
        ctx.lineTo(boothPixelX, B * CELL);
        ctx.stroke();

        // Draw Contraction Guide Lines (Visual Only)
        // NOTE: These lines are purely illustrative to show the "contraction" concept.
        // They do NOT imply geometric movement; cars still move one discrete lane per timestep.
        ctx.strokeStyle = 'rgba(100, 100, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.beginPath();
        for (let i = 0; i <= B; i++) {
            const yStart = i * CELL;
            const yEnd = i * (L / B) * CELL; // Map booth boundary to highway boundary
            ctx.moveTo(MERGE_START * CELL, yStart);
            ctx.lineTo(COLS * CELL, yEnd);
        }
        ctx.stroke();

        // 2. Draw Lane Lines (Dashed)
        ctx.strokeStyle = '#333';
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        for (let i = 1; i < B; i++) {
            const y = i * CELL;
            ctx.moveTo(0, y);
            ctx.lineTo(COLS * CELL, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // 3. Draw Cars
        for (let i = 0; i < B; i++) {
            for (let x = 0; x < COLS; x++) {
                const car = grid[i][x];
                if (car) {
                    const xPos = x * CELL;
                    const yPos = i * CELL;

                    // Draw Car Body
                    ctx.fillStyle = car.type === 'ETC' ? '#4CAF50' : '#2196F3';

                    // Visual feedback for "Blocked/Waiting" in Merge Zone
                    // If in vanishing lane (>= L) and in Merge Zone, strictly highlight
                    let isWaiting = false;
                    if (x >= MERGE_START && i >= L) {
                        // We can assume if it's still here, it's waiting to merge
                        isWaiting = true;
                    }

                    // Dim if waiting
                    ctx.globalAlpha = isWaiting ? 0.6 : 1.0;

                    ctx.fillRect(xPos + 2, yPos + 2, CELL - 4, CELL - 4);

                    // Reset Alpha
                    ctx.globalAlpha = 1.0;

                    // Waiting Border
                    if (isWaiting && showMergeDebug) {
                        ctx.strokeStyle = 'red';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(xPos + 2, yPos + 2, CELL - 4, CELL - 4);
                    }

                    // Teleport Visualization
                    if (car.isTeleporting) {
                        ctx.fillStyle = 'rgba(255, 215, 0, 0.5)'; // Gold highlight
                        ctx.fillRect(xPos, yPos, CELL, CELL);
                    }

                    // ... Text ...
                    ctx.fillStyle = '#FFF';
                    ctx.font = '10px Arial';
                    ctx.fillText(car.id.toString(), xPos + 4, yPos + CELL / 2 + 4);

                    // Merge Debug Overlay
                    if (x >= MERGE_START && car.mergeTargetLane !== undefined) {
                        // Arrow
                        if (car.mergeTargetLane !== i) {
                            const centerX = xPos + CELL / 2;
                            const centerY = yPos + CELL / 2;
                            ctx.fillStyle = '#FFF';
                            ctx.beginPath();
                            if (car.mergeTargetLane < i) { // Up
                                ctx.moveTo(centerX, centerY - 6);
                                ctx.lineTo(centerX - 4, centerY);
                                ctx.lineTo(centerX + 4, centerY);
                            } else { // Down
                                ctx.moveTo(centerX, centerY + 6);
                                ctx.lineTo(centerX - 4, centerY);
                                ctx.lineTo(centerX + 4, centerY);
                            }
                            ctx.fill();
                        }

                        if (showMergeDebug) {
                            ctx.fillStyle = '#FF0';
                            ctx.font = '9px monospace';
                            ctx.fillText(`${i}->${car.mergeTargetLane}`, xPos, yPos - 2);
                        }
                    }
                }
            }
        }

    }, [grid, tick, L, showMergeDebug]);

    const height = grid.length * CELL;
    const width = COLS * CELL;

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            style={{ border: '1px solid #444', background: '#222' }}
        />
    );
};
