import { config } from './config.mjs';
import { rndRange } from './utils.mjs';
import type { SnowMachine } from './types.mjs';

type Snowflake = {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    color: string;
    distance: number;
};

export function buildSnowMachine(elCanvas: HTMLCanvasElement): SnowMachine {
    const maxSnowflakeCount = config.snow.maxFlakeCount;
    const minSize = config.snow.minFlakeSize;
    const maxSize = config.snow.maxFlakeSize;
    const minXSpeed = -config.snow.maxXSpeed;
    const maxXSpeed = config.snow.maxXSpeed;
    const minYSpeed = config.snow.minYSpeed;
    const maxYSpeed = config.snow.maxYSpeed;
    const windSpeedDelta = config.snow.windSpeedDelta;
    const windSpeedChangeIntervalMillis = config.snow.windSpeedChangeIntervalSeconds * 1000;
    const snowflakeAddIntervalMillis = config.snow.snowflakeAddIntervalSeconds * 1000;
    const distanceColourFade = config.snow.distanceColourFade;

    let snowFlakeCount = 0;
    let running = false;
    let currentWindSpeed = 0;
    let targetWindSpeed = 0;
    let lastWindSpeedChangeTs = Date.now();
    let lastAddedSnowflakeTs = Date.now();

    function buildSnowflake(): Snowflake {
        const distance = rndRange(0, 1);
        return {
            x: (rndRange(0, 2) - 0.5) * elCanvas.width,
            y: 0,
            size: ((1 - distance) * (maxSize - minSize)) + minSize,
            speedX: rndRange(minXSpeed, maxXSpeed),
            speedY: ((1 - distance) * (maxYSpeed - minYSpeed)) + minYSpeed,
            color: `rgba(255, 255, 255, ${1 - distance / distanceColourFade})`,
            distance
        };
    }

    function drawSnowflake(snowflake: Snowflake) {
        const ctx = elCanvas.getContext('2d')!;
        ctx.beginPath();
        ctx.arc(snowflake.x, snowflake.y, snowflake.size, 0, 2 * Math.PI);
        ctx.fillStyle = snowflake.color;
        ctx.fill();
    }

    function updateSnowflake(snowflake: Snowflake) {
        snowflake.x += snowflake.speedX + (currentWindSpeed * (1 - snowflake.distance / 2));
        snowflake.y += snowflake.speedY;
        if (snowflake.y > elCanvas.height) {
            Object.assign(snowflake, buildSnowflake());
        }
    }

    function updateCanvas() {
        const ctx = elCanvas.getContext('2d')!;
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

    const snowflakes: Snowflake[] = [];

    return {
        start(intensity: number) {
            snowFlakeCount = Math.round(maxSnowflakeCount * intensity);
            running = true;
            updateCanvas();
        },
        stop() {
            running = false;
            snowflakes.length = 0;
        }
    };
}
