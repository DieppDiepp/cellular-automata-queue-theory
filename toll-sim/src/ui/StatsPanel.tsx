import React from 'react';

interface StatsPanelProps {
    time: number;
    passedCars: number;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ time, passedCars }) => {
    return (
        <div className="panel-card stats-panel">
            <div className="stat-item">
                <span className="stat-label">Time</span>
                <span className="stat-value">{time} s</span>
            </div>
            <div className="stat-item">
                <span className="stat-label">Passed Cars</span>
                <span className="stat-value">{passedCars}</span>
            </div>
        </div>
    );
};
