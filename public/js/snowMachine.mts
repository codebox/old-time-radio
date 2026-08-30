import { config } from './config.mjs';
import { rndRange } from './utils.mjs';
import type { SnowMachine } from './types.mjs';

type Snowflake = {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    opacity: number;
    distance: number;
    sprite: FlakeSprite;
    angle: number;
    spin: number;
};

type BranchDesign = {
    position: number;
    length: number;
    angle: number;
};

type FlakeDesign = {
    branches: BranchDesign[];
    tipLength: number;
    tipAngle: number;
    coreRadius: number;
    lineWidth: number;
};

// Each design is pre-rendered at several resolutions, so that a flake drawn a
// few pixels across is scaled down from a similarly-sized sprite rather than
// from the largest one, which would blur it into a smudge.
const SPRITE_RESOLUTIONS = [8, 16, 32, 64],
    ARM_COUNT = 6;

type FlakeSprite = HTMLCanvasElement[];

function buildFlakeDesign(): FlakeDesign {
    const branchCount = Math.round(rndRange(2, 3)),
        branches: BranchDesign[] = [];
    for (let i = 0; i < branchCount; i++) {
        branches.push({
            position: rndRange(0.25, 0.85),
            length: rndRange(0.2, 0.4),
            angle: rndRange(Math.PI / 4, Math.PI / 3)
        });
    }
    return {
        branches,
        tipLength: rndRange(0.15, 0.3),
        tipAngle: rndRange(Math.PI / 5, Math.PI / 3),
        coreRadius: rndRange(0.1, 0.22),
        lineWidth: rndRange(0.045, 0.075)
    };
}

function drawArm(ctx: CanvasRenderingContext2D, design: FlakeDesign, armLength: number) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(armLength, 0);
    design.branches.forEach(branch => {
        const startX = branch.position * armLength,
            branchLength = branch.length * armLength,
            endX = startX + Math.cos(branch.angle) * branchLength,
            endY = Math.sin(branch.angle) * branchLength;
        ctx.moveTo(startX, 0);
        ctx.lineTo(endX, endY);
        ctx.moveTo(startX, 0);
        ctx.lineTo(endX, -endY);
    });
    // A pair of short branches at the very tip of the arm, forming a V.
    const tipLength = design.tipLength * armLength,
        tipX = armLength - Math.cos(design.tipAngle) * tipLength,
        tipY = Math.sin(design.tipAngle) * tipLength;
    ctx.moveTo(armLength, 0);
    ctx.lineTo(tipX, tipY);
    ctx.moveTo(armLength, 0);
    ctx.lineTo(tipX, -tipY);
    ctx.stroke();
}

function renderSprite(design: FlakeDesign, resolution: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d')!,
        centre = resolution / 2,
        lineWidth = Math.max(resolution * design.lineWidth, 0.7),
        armLength = centre - lineWidth;

    canvas.width = canvas.height = resolution;
    ctx.translate(centre, centre);
    ctx.strokeStyle = ctx.fillStyle = '#fff';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let arm = 0; arm < ARM_COUNT; arm++) {
        ctx.save();
        ctx.rotate(arm * 2 * Math.PI / ARM_COUNT);
        drawArm(ctx, design, armLength);
        ctx.restore();
    }

    // A solid hexagonal plate at the centre, like the nucleus of a real flake.
    const coreRadius = design.coreRadius * armLength;
    ctx.beginPath();
    for (let corner = 0; corner < ARM_COUNT; corner++) {
        const angle = corner * 2 * Math.PI / ARM_COUNT;
        ctx.lineTo(Math.cos(angle) * coreRadius, Math.sin(angle) * coreRadius);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    return canvas;
}

function buildFlakeSprite(): FlakeSprite {
    const design = buildFlakeDesign();
    return SPRITE_RESOLUTIONS.map(resolution => renderSprite(design, resolution));
}

function pickSpriteResolution(sprite: FlakeSprite, diameter: number): HTMLCanvasElement {
    const index = SPRITE_RESOLUTIONS.findIndex(resolution => resolution >= diameter);
    return index === -1 ? sprite[sprite.length - 1] : sprite[index];
}

export function buildSnowMachine(elCanvas: HTMLCanvasElement): SnowMachine {
    const maxSnowflakeCount = config.snow.maxFlakeCount,
        minSize = config.snow.minFlakeSize,
        maxSize = config.snow.maxFlakeSize,
        minXSpeed = -config.snow.maxXSpeed,
        maxXSpeed = config.snow.maxXSpeed,
        minYSpeed = config.snow.minYSpeed,
        maxYSpeed = config.snow.maxYSpeed,
        maxSpinSpeed = config.snow.maxSpinSpeed,
        windSpeedDelta = config.snow.windSpeedDelta,
        windSpeedChangeIntervalMillis = config.snow.windSpeedChangeIntervalSeconds * 1000,
        snowflakeAddIntervalMillis = config.snow.snowflakeAddIntervalSeconds * 1000,
        distanceColourFade = config.snow.distanceColourFade;

        let snowFlakeCount = 0, running = false, currentWindSpeed = 0, targetWindSpeed = 0,
        lastWindSpeedChangeTs = Date.now(),
        lastAddedSnowflakeTs = Date.now(),
        sprites: FlakeSprite[] = [];

    function buildSnowflake(): Snowflake {
        const distance = rndRange(0, 1);
        return {
            x: (rndRange(0, 2) - 0.5) * elCanvas.width,
            y: 0,
            size: ((1 - distance) * (maxSize - minSize)) + minSize,
            speedX: rndRange(minXSpeed, maxXSpeed),
            speedY: ((1 - distance) * (maxYSpeed - minYSpeed)) + minYSpeed,
            opacity: 1 - distance / distanceColourFade,
            distance,
            sprite: sprites[Math.floor(Math.random() * sprites.length)],
            angle: rndRange(0, 2 * Math.PI),
            spin: rndRange(-maxSpinSpeed, maxSpinSpeed) * (1 - distance)
        };
    }

    function drawSnowflake(snowflake: Snowflake) {
        const ctx = elCanvas.getContext('2d')!,
            diameter = snowflake.size * 2,
            sprite = pickSpriteResolution(snowflake.sprite, diameter);
        ctx.save();
        ctx.globalAlpha = snowflake.opacity;
        ctx.translate(snowflake.x, snowflake.y);
        ctx.rotate(snowflake.angle);
        ctx.drawImage(sprite, -snowflake.size, -snowflake.size, diameter, diameter);
        ctx.restore();
    }

    function updateSnowflake(snowflake: Snowflake) {
        snowflake.x += snowflake.speedX + (currentWindSpeed * (1 - snowflake.distance / 2));
        snowflake.y += snowflake.speedY;
        snowflake.angle += snowflake.spin;
        if (snowflake.y > elCanvas.height + snowflake.size) {
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
            if (!sprites.length) {
                sprites = Array.from({length: config.snow.flakeDesignCount}, buildFlakeSprite);
            }
            if (!running) {
                running = true;
                updateCanvas();
            }
        },
        stop() {
            running = false;
            snowflakes.length = 0;
        }
    };
}
