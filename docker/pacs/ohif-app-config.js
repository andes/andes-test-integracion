window.config = {
    routerBasename: '/',
    extensions: [],
    showStudyList: true,
    filterQueryParam: false,
    servers: {
        dicomWeb: [
            {
                name: 'PACS',
                wadoUriRoot: 'http://localhost:8080/dcm4chee-arc/aets/PACS/wado',
                qidoRoot: 'http://localhost:8080/dcm4chee-arc/aets/PACS/rs',
                wadoRoot: 'http://localhost:8080/dcm4chee-arc/aets/PACS/rs',
                qidoSupportsIncludeField: true,
                imageRendering: 'wadors',
                thumbnailRendering: 'wadors',
                enableStudyLazyLoad: true,
                requestOptions: {
                    auth: () => {
                        const url = new URLSearchParams(window.location.search);
                        const token = url.get('token');
                        return 'Bearer ' + token;
                    },
                },
            },
        ],
    },
    studyListFunctionsEnabled: true,
    hotkeys: [
        {
            commandName: 'incrementActiveViewport',
            label: 'Next Viewport',
            keys: ['right'],
        },
        {
            commandName: 'decrementActiveViewport',
            label: 'Previous Viewport',
            keys: ['left'],
        },
        { commandName: 'rotateViewportCW', label: 'Rotate Right', keys: ['r'] },
        { commandName: 'rotateViewportCCW', label: 'Rotate Left', keys: ['l'] },
        { commandName: 'invertViewport', label: 'Invert', keys: ['i'] },
        { commandName: 'flipViewportVertical', label: 'Flip Horizontally', keys: ['h'] },
        { commandName: 'flipViewportHorizontal', label: 'Flip Vertically', keys: ['v'] },
        { commandName: 'scaleUpViewport', label: 'Zoom In', keys: ['+'] },
        { commandName: 'scaleDownViewport', label: 'Zoom Out', keys: ['-'] },
        { commandName: 'fitViewportToWindow', label: 'Zoom to Fit', keys: ['='] },
        { commandName: 'resetViewport', label: 'Reset', keys: ['space'] },
        { commandName: 'nextImage', label: 'Next Image', keys: ['down'] },
        { commandName: 'previousImage', label: 'Previous Image', keys: ['up'] },
        {
            commandName: 'previousViewportDisplaySet',
            label: 'Previous Series',
            keys: ['pagedown'],
        },
        {
            commandName: 'nextViewportDisplaySet',
            label: 'Next Series',
            keys: ['pageup'],
        },
        { commandName: 'setZoomTool', label: 'Zoom', keys: ['z'] },
    ],
};
