function buildSnowMachine(elCanvas) {
    const maxSnowflakeCount = config.snow.maxFlakeCount,
        minSize = config.snow.minFlakeSize,
        maxSize = config.snow.maxFlakeSize,
        minXSpeed = -config.snow.maxXSpeed,
        maxXSpeed = config.snow.maxXSpeed,
        minYSpeed = config.snow.minYSpeed,
        maxYSpeed = config.snow.maxYSpeed,
        windSpeedDelta = config.snow.windSpeedDelta,
        windSpeedChangeIntervalMillis = config.snow.windSpeedChangeIntervalSeconds * 1000,
        snowflakeAddIntervalMillis = config.snow.snowflakeAddIntervalSeconds * 1000,
        distanceColourFade = config.snow.distanceColourFade;

        let snowFlakeCount = 0, running = false, currentWindSpeed = 0, targetWindSpeed = 0,
        lastWindSpeedChangeTs = Date.now(),
        lastAddedSnowflakeTs = Date.now();

    function buildSnowflake() {
        const distance = rndRange(0, 1);
        return {
            x: (rndRange(0, 2) - 0.5) * elCanvas.width,
            y: 0,
            size: ((1 - distance) * (maxSize - minSize)) + minSize,
            speedX: rndRange(minXSpeed, maxXSpeed),
            speedY: ((1-distance) * (maxYSpeed - minYSpeed)) + minYSpeed,
            color: `rgba(255, 255, 255, ${1 - distance/distanceColourFade})`,
            distance
        }
    }

    function drawSnowflake(snowflake) {
        const ctx = elCanvas.getContext('2d');
        ctx.beginPath();
        ctx.arc(snowflake.x, snowflake.y, snowflake.size, 0, 2 * Math.PI);
        ctx.fillStyle = snowflake.color;
        ctx.fill();
    }
    function updateSnowflake(snowflake) {
        snowflake.x += snowflake.speedX + (currentWindSpeed * (1 - snowflake.distance / 2));
        snowflake.y += snowflake.speedY;
        if (snowflake.y > elCanvas.height) {
            Object.assign(snowflake, buildSnowflake());
        }
    }
    function updateCanvas() {
        const ctx = elCanvas.getContext('2d');
        ctx.clearRect(0, 0, elCanvas.width, elCanvas.height);
        if (lastWindSpeedChangeTs + windSpeedChangeIntervalMillis < Date.now()) {
            targetWindSpeed = rndRange(-config.snow.windSpeedMax, config.snow.windSpeedMax);
            lastWindSpeedChangeTs = Date.now();
        }
        if (Math.abs(targetWindSpeed - currentWindSpeed) < windSpeedDelta) {
            currentWindSpeed = targetWindSpeed;
        } else {
            currentWindSpeed += Math.sign(targetWindSpeed - currentWindSpeed) * windSpeedDelta;
        }
        if (snowflakes.length < snowFlakeCount) {
            if (lastAddedSnowflakeTs + snowflakeAddIntervalMillis < Date.now()) {
                snowflakes.push(buildSnowflake());
                lastAddedSnowflakeTs = Date.now();
            }
        }
        snowflakes.forEach(updateSnowflake);
        snowflakes.forEach(drawSnowflake);
        if (running) {
            requestAnimationFrame(updateCanvas);
        }
    }
    const snowflakes = [];
    return {
        start(intensity) {
            snowFlakeCount = Math.round(maxSnowflakeCount * intensity);
            running = true;
            updateCanvas();
        },
        stop() {
            running = false;
            snowflakes.length = 0;
        }
    }
}