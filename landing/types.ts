import React from 'react';

export interface Feature {
    title: string;
    description: string;
    icon: React.ReactNode;
}

export interface MetricData {
    name: string;
    value: number;
    fill: string;
}

export interface OrderStatusData {
    month: string;
    completed: number;
    delayed: number;
    projected: number;
}