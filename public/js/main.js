window.onload = () => {
    const model = {};

    // function isIOS(){
    //     "use strict";
    //     return /iPad|iPhone|iPod/.test(navigator.platform)
    //         || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    // }
    //
    view.init(model);
    //
    // if (isIOS()) {
    //     view.iosError();
    //     return;
    // }

    view.setVisualisationDataSource(audioPlayer.getData);
    visualiser.init(view.getCanvas());
    window.addEventListener('resize', visualiser.onResize());
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
        model.channel = model.playlist = null;
        audioPlayer.stop();
        view.updatePlayState(model);
        setTimeout(() => {
            visualiser.deactivate();
        }, 2000);
    });

    audioPlayer.onAudioEnded(() => {
        "use strict";
        playNextFromCurrentChannel();
    });

    service.getChannels().then(channels => {
        "use strict";
        view.setChannels(model.channels = channels);
    }).catch(err => messageManager.httpError());

};
