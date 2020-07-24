window.onload = () => {
    const model = {};

    view.init(model);
    audioPlayer.init();
    view.setVisualisationDataSource(audioPlayer.getData);
    visualiser.init(view.getCanvas());
    window.addEventListener('resize', visualiser.onResize);
    playlist.init(model);

    function playNextFromCurrentChannel() {
        "use strict";
        return playlist.getNext()
            .then(nextItem => {
                const {url, name, offset} = nextItem;
                model.track = name;

                return audioPlayer.load(url, offset)
                    .then(() => {
                        audioPlayer.play();
                    })
                    .catch(err => alert(err));
            });
    }

    view.onChannelSelected(channelId => {
        "use strict";
        model.track = null;
        model.playlist = null;
        model.channel = channelId;
        view.updatePlayState(model);
        playNextFromCurrentChannel().then(() => {
            view.updatePlayState(model);
        });
        audioPlayer.play();
    });

    view.onChannelDeselected(() => {
        "use strict";
        model.channel = model.playlist = null;
        audioPlayer.stop();
        view.updatePlayState(model);
    });

    audioPlayer.onAudioEnded(() => {
        "use strict";
        playNextFromCurrentChannel().then(() => {
            view.updatePlayState(model);
        });
    });

    service.getChannels().then(channels => {
        "use strict";
        view.setChannels(model.channels = channels);
    });

};
