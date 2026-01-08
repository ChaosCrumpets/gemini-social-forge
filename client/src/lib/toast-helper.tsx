import React from 'react';
import { toast } from '@/hooks/use-toast';

export const showSuccess = (message: string) => {
    toast({
        title: "Success",
        description: message,
        variant: "default",
        duration: 3000,
    });
};

export const showError = (message: string, action?: { label: string; onClick: () => void }) => {
    toast({
        title: "Error",
        description: message,
        variant: "destructive",
        duration: 5000,
        action: action ? (
            <div
                onClick={(e) => {
                    e.preventDefault();
                    action.onClick();
                }}
                className="cursor-pointer font-medium hover:underline"
            >
                {action.label}
            </div>
        ) : undefined
    });
};

export const showLoading = (message: string) => {
    toast({
        title: "Loading...",
        description: message,
        duration: 2000,
    });
};

export const dismissToast = () => {
    // no-op currently
};
