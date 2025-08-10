import React from "react";
import "./glass-container.css";

interface GlassContainerProps {
  children: React.ReactNode;
}

const GlassContainer: React.FC<GlassContainerProps> = ({ children }) => {
  return (
    <div className="glass-container">
      <div className="glass-container__front">{children}</div>
    </div>
  );
};

export default GlassContainer;
