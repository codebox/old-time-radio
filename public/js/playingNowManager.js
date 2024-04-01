function buildPlayingNowManager(model, elCanvas) {
    const ctx = elCanvas.getContext('2d'),
        updatePeriodSeconds = 7,
        spriteCoords = [
            {x: 3, y: 16, w: 540, h: 93},
            {x: 633, y: 1, w: 549, h: 125},
            {x: 2, y: 264, w: 540, h: 103},
            {x: 635, y: 261, w: 548, h: 123},
            {x: 2, y: 499, w: 539, h: 147},
            {x: 615, y: 531, w: 583, h: 103},
            {x: 1, y: 788, w: 540, h: 111},
            {x: 630, y: 790, w: 549, h: 82},
            {x: 0, y: 1043, w: 540, h: 87},
            {x: 632, y: 1037, w: 553, h: 128}
        ],
        minPrintableRegionHeight = 150,
        maxPrintableRegionHeight = 200,
        spriteImage = new Image();

    spriteImage.src = 'swirl_sprites.jpg';

    let updateTimerId, canvasWidth, canvasHeight, spacing, imageHeight, initialY, lineHeight, canvasSizeOk;

    function fillTextMultiLine(textAndOffsets) {
        let nextY = initialY;

        textAndOffsets.forEach(textAndOffset => {
            const {text, imageCoords} = textAndOffset;
            if (text) {
                const lineWidth = Math.min(ctx.measureText(text).width, canvasWidth * 0.9),
                    y = nextY + lineHeight;
                ctx.fillText(text, (canvasWidth - lineWidth) / 2, y, lineWidth);
                nextY += lineHeight + spacing;

            } else if (imageCoords) {
                const {x:sx, y:sy, w:sw, h:sh} = imageCoords,
                    dh = imageHeight,
                    dw = dh * sw / sh,
                    dx = (canvasWidth - dw) / 2,
                    dy = nextY + spacing;
                try {
                    ctx.drawImage(spriteImage, sx, sy, sw, sh, dx, dy, dw, dh);
                } catch (e) {
                    // ignore, the image hasn't loaded yet
                }
                nextY += (dh + 2 * spacing);
            }
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

        const printableRegionHeight = Math.min(maxPrintableRegionHeight, Math.max(minPrintableRegionHeight, canvasHeight / 2));
        ctx.fillStyle = '#ccc';
        ctx.font = `${Math.round(printableRegionHeight / 5)}px Bellerose`;
        elCanvas.style.animation = `pulse ${updatePeriodSeconds}s infinite`;

        lineHeight = printableRegionHeight / 5;
        spacing = printableRegionHeight / 20;
        imageHeight = printableRegionHeight / 5;
        initialY = (canvasHeight - printableRegionHeight) / 2;
        canvasSizeOk = initialY >= 0;
    }

    let playingNowData, currentIndex = 0, spriteIndex = 0;
    function updateCurrentIndex() {
        spriteIndex = (spriteIndex + 1) % spriteCoords.length;
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
            {text: 'Now Playing on'},
            {text: channelDescription},
            {imageCoords: spriteCoords[spriteIndex]},
            {text: playingNowName.toUpperCase()}
        ]);

        requestAnimationFrame(renderCurrentInfo);
    }

    return {
        start(details) {
            this.update(details);
            prepareCanvas();
            if (!updateTimerId && canvasSizeOk) {
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