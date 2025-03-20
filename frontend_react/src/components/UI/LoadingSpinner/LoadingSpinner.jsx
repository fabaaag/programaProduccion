import React from 'react';
import './LoadingSpinner.css';

export function LoadingSpinner({ message = "Cargando...", overlay = false, size="normal"}) {
    const containerClass = overlay ? "loader-container overlay" : "loader-container";
    const sizeClass = size === "small" ? "small-loader": "";
    return (
        <div className={`${containerClass} ${sizeClass}`}>
            <div className="pulse-loader">
                <div className="pulse-bubble pulse-bubble-1"></div>
                <div className="pulse-bubble pulse-bubble-2"></div>
                <div className="pulse-bubble pulse-bubble-3"></div>
            </div>
            <p className="loading-message">{message}</p>
        </div>
    );
}

export default LoadingSpinner;