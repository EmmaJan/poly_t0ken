// Mock Figma API for testing
global.figma = {
    root: {
        getPluginData: jest.fn(),
        setPluginData: jest.fn()
    },
    ui: {
        postMessage: jest.fn()
    },
    variables: {
        getLocalVariableCollections: jest.fn(() => []),
        getVariableById: jest.fn()
    },
    currentPage: {
        selection: []
    },
    getNodeById: jest.fn(),
    notify: jest.fn(),
    showUI: jest.fn(),
    clientStorage: {
        getAsync: jest.fn(() => Promise.resolve(null)),
        setAsync: jest.fn(() => Promise.resolve())
    }
};

// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};
