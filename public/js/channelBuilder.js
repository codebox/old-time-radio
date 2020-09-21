const channelBuilder = (() => {
    let channelBuilderModel, selectionChangedHandler = () => {};

    function updateView() {
        "use strict";
        channelBuilderModel.forEach(item => {
            item.element.classList.toggle('selected', item.selected);
        });
    }

    function buildShowButtonElement(modelItem) {
        const el = document.createElement('li');
        el.innerHTML = modelItem.name;
        el.dataset.index = modelItem.index;
        el.classList.add('showButton');
        el.modelItem = modelItem;
        el.onclick = () => {
            modelItem.selected = ! modelItem.selected;
            updateView();
            selectionChangedHandler(channelBuilderModel);
        };
        return el;
    }

    return {
        init(elContainer, shows) {
            "use strict";
            elContainer.innerHTML = '';

            channelBuilderModel = shows.filter(show => !show.isCommercial).map(show => {
                const modelItem = {
                    index: show.index,
                    name: show.name,
                    selected: false
                },
                el = buildShowButtonElement(modelItem);
                modelItem.element = el;

                elContainer.appendChild(el);
                return modelItem;
            });

            selectionChangedHandler(channelBuilderModel);
        },
        onSelectionChanged(handler) {
            "use strict";
            selectionChangedHandler = handler;
        },
        getSelectedIndexes() {
            "use strict";
            return channelBuilderModel.filter(item => item.selected).map(item => item.index);
        }
    };
})();