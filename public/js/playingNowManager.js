function buildPlayingNowManager(model, elCanvas) {
    const ctx = elCanvas.getContext('2d'),
        updatePeriodSeconds = 7;
    let updateTimerId, canvasWidth, canvasHeight;

    function fillTextMultiLine(textAndOffsets, initialY) {
        const lineHeight = ctx.measureText("M").width * 1.5;
        textAndOffsets.forEach(textAndOffset => {
            const {text, offset} = textAndOffset,
                lineWidth = Math.min(ctx.measureText(text).width, canvasWidth * 0.9),
                y = initialY + lineHeight * offset;
            ctx.fillText(text, (canvasWidth - lineWidth) / 2, y, lineWidth);
        });
    }

    function describeChannel(channelId) {
        const channel = model.channels.find(channel => channel.id === channelId),
            channelName = channel.name.substring(0, 1).toUpperCase() + channel.name.substring(1).toLowerCase();
        if (model.isSingleShowMode() || model.isUserChannelMode()) {
            return channelName;
        } else {
            return `The ${channelName} Channel`;
        }
    }


    function prepareCanvas() {
        const ratio = window.devicePixelRatio || 1;
        elCanvas.width = (canvasWidth = elCanvas.offsetWidth) * ratio;
        elCanvas.height = (canvasHeight = elCanvas.offsetHeight) * ratio;
        ctx.scale(ratio, ratio);

        ctx.fillStyle = '#ccc';
        ctx.font = '40px Bellerose';
        elCanvas.style.animation = `pulse ${updatePeriodSeconds}s infinite`;
    }

    let playingNowData, currentIndex = 0;
    function updateCurrentIndex() {
        currentIndex = (currentIndex + 1) % playingNowData.length;
    }

    let running = false;
    function renderCurrentInfo() {
        if (!running) {
            return;
        }
        ctx.clearRect(0, 0, elCanvas.width, elCanvas.height);
        const channelId = playingNowData[currentIndex].channelId,
            channelDescription = describeChannel(channelId),
            playingNowName = playingNowData[currentIndex].list[0].showName;

        fillTextMultiLine([
            {text: 'Now Playing on', offset: 0},
            {text: channelDescription, offset: 1.2},
            {text: playingNowName.toUpperCase(), offset: 3}
            ], canvasHeight / 3);

        requestAnimationFrame(renderCurrentInfo);
    }

    return {
        start(details) {
            this.update(details);
            prepareCanvas();
            if (!updateTimerId) {
                running = true;
                renderCurrentInfo();
                updateTimerId = setInterval(updateCurrentIndex, updatePeriodSeconds * 1000);
            }
        },
        update(details) {
            playingNowData = details;
        },
        stop() {
            if (updateTimerId) {
                running = false;
                clearInterval(updateTimerId);
                updateTimerId = 0;
                playingNowData = null;
            }
        }
    };
}