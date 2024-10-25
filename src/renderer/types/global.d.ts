declare global {
    interface Window {
        React: typeof import('react');
        ReactDOM: {
            createRoot(container: Element | DocumentFragment): {
                render(element: React.ReactNode): void;
            };
        };
    }
}

export {};