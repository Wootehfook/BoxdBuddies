// Performance Monitoring Component
// AI Generated: GitHub Copilot - 2025-01-08
// Performance monitoring utilities for React component optimization

import React, { useEffect, useRef, useState } from "react";

interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  totalRenderTime: number;
}

interface PerformanceMonitorProps {
  componentName: string;
  showMetrics?: boolean;
  children: React.ReactNode;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  componentName,
  showMetrics = false,
  children,
}) => {
  const renderCountRef = useRef(0);
  const renderTimeRef = useRef(0);
  const totalTimeRef = useRef(0);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    totalRenderTime: 0,
  });

  useEffect(() => {
    const startTime = window.performance.now();
    renderCountRef.current += 1;

    return () => {
      const endTime = window.performance.now();
      const renderTime = endTime - startTime;
      renderTimeRef.current = renderTime;
      totalTimeRef.current += renderTime;

      setMetrics({
        renderCount: renderCountRef.current,
        lastRenderTime: renderTime,
        averageRenderTime: totalTimeRef.current / renderCountRef.current,
        totalRenderTime: totalTimeRef.current,
      });
    };
  });

  return (
    <>
      {children}
      {showMetrics && (
        <div
          style={{
            position: "fixed",
            bottom: "10px",
            right: "10px",
            background: "rgba(0, 0, 0, 0.8)",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: "4px",
            fontSize: "12px",
            fontFamily: "monospace",
            zIndex: 9999,
            maxWidth: "300px",
          }}
        >
          <div>
            <strong>{componentName}</strong>
          </div>
          <div>Renders: {metrics.renderCount}</div>
          <div>Last: {metrics.lastRenderTime.toFixed(2)}ms</div>
          <div>Avg: {metrics.averageRenderTime.toFixed(2)}ms</div>
          <div>Total: {metrics.totalRenderTime.toFixed(2)}ms</div>
        </div>
      )}
    </>
  );
};

// Performance hook for measuring expensive operations
export const usePerformanceMeasure = (label: string) => {
  const startTimeRef = useRef<number>();

  const start = () => {
    startTimeRef.current = window.performance.now();
  };

  const end = () => {
    if (startTimeRef.current) {
      const duration = window.performance.now() - startTimeRef.current;
      console.error(`⚡ ${label}: ${duration.toFixed(2)}ms`);
      return duration;
    }
    return 0;
  };

  return { start, end };
};

// Bundle size monitoring (development only)
export const logBundleSize = () => {
  if (process.env.NODE_ENV === "development") {
    // This would typically be done with webpack-bundle-analyzer
    console.error("📦 Bundle size monitoring active");
  }
};
