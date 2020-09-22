window.onload = () => {
    const model = {};

    view.init(model);

    view.setVisualisationDataSource(audioPlayer.getData);
    visualiser.init(view.getCanvas());
    window.addEventListener('resize', visualiser.onResize());
    playlist.init(model);

    function playNextFromCurrentChannel() {
        "use strict";
        return playlist.getNext()
            .then(nextItem => {
                const {url, name, offset} = nextItem;
                model.track = {name, url};

                return audioPlayer.load(url, offset)
                    .then(() => {
                        audioPlayer.play();
                        view.updatePlayState(model);
                    })
                    .catch(() => {
                        return playNextFromCurrentChannel();
                    })
            });
    }

    view.onChannelSelected(channelId => {
        "use strict";
        model.track = null;
        model.playlist = null;
        model.channel = channelId;
        view.updatePlayState(model);
        visualiser.activate();
        playNextFromCurrentChannel();
        audioPlayer.play();
    });

    view.onChannelDeselected(() => {
        "use strict";
        model.track = model.channel = model.playlist = null;
        audioPlayer.stop();
        view.updatePlayState(model);
        setTimeout(() => {
            visualiser.deactivate();
        }, 2000);
    });

    channelBuilder.onChannelRequested(showIndexes => {
        "use strict";
         return service.getChannelCodeForShows(showIndexes);
    });

    audioPlayer.onAudioEnded(() => {
        "use strict";
        playNextFromCurrentChannel();
    });

    const channels = new URLSearchParams(window.location.search).get('channels');
    if (channels) {
        view.setChannels(model.channels = channels.split(','));
    } else {
        service.getChannels().then(channels => {
            "use strict";
            view.setChannels(model.channels = channels);
        }).catch(err => messageManager.httpError());
    }

    service.getShowList().then(shows => {
        channelBuilder.populate(model.shows = shows);
    });
};
