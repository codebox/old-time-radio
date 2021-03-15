window.onload = () => {
    const model = buildModel(),
        view = buildView();

    view.setChannels(model.channels);

    view.on('channelButtonClick', channelId => {
        "use strict";
        if (channelId === model.channelId) {
            model.channelId = null;
            view.setNoChannelSelected();
        } else {
            model.channelId = channelId;
            view.setChannelLoading(channelId);
        }
    });


};
