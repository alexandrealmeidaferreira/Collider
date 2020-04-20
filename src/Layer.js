/**
 * Author: Alexandre Almeida Ferreira
 * Description: Layer for javascript canvas
 */

export class Layer {
    layers = {};
    defaultOptions = {
        layerId: 'layer0',
        width: 800,
        height: 600,
        containerId: 'LayerContainer',
        containerClass: 'LayerContainer',
        canvas: false,
        context: false,
    }

    constructor(props) {
        Object.assign(this.defaultOptions, props);
    }

    getOrCreateContainer(options) {
        let newOptions = {};
        Object.assign(newOptions, this.defaultOptions);
        if (options)
            Object.assign(newOptions, options);

        //check if container exists, if not create it
        let container = document.getElementById(newOptions.containerId);
        if (!container) {
            container = document.createElement('div');
            container.id = newOptions.containerId;
            container.classList.add(newOptions.containerClass);
            document.body.appendChild(container);
        }
        return container;
    }

    createLayer(options) {
        let newOptions = {};
        Object.assign(newOptions, this.defaultOptions);
        if (options)
            Object.assign(newOptions, options);

        newOptions.canvas = document.createElement('canvas');
        newOptions.canvas.id = newOptions.layerId;
        newOptions.canvas.width = newOptions.width;
        newOptions.canvas.height = newOptions.height;
        newOptions.context = newOptions.canvas.getContext('2d');

        //add to container
        this.getOrCreateContainer(newOptions).appendChild(newOptions.canvas);
        //add to layers list
        this.layers[newOptions.layerId] = newOptions;
        //return layer config
        return newOptions;
    }

    getLayerById(layerId) {
        return this.layers[layerId];
    }

    getAllLayers() {
        return this.layers;
    }
}