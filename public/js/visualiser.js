const visualiser = (() => {
    const BACKGROUND_COLOUR = 'black',
        MAX_FREQ_DATA_VALUE = 255;

    let dataSource, isActive=true, elCanvas, ctx, width, height

    function updateCanvasSize() {
        //clearCanvas();
        width = elCanvas.width = elCanvas.offsetWidth;
        height = elCanvas.height = elCanvas.offsetHeight;
        console.log(width, height)
    }

    function clearCanvas() {
        ctx.fillStyle = BACKGROUND_COLOUR;
        ctx.fillRect(0, 0, width, height);
    }

    let step = 0;
    function paintSineWave() {
        "use strict";
        const data = dataSource(),
            WAVE_SPEED = 0.5,
            PADDING = 50,
            BUCKET_COUNT = 30,
            TWO_PI = Math.PI * 2,
            startX = PADDING,
            endX = width - PADDING;

        const dataBuckets = [],
            BUCKET_SIZE = Math.floor(data.length/BUCKET_COUNT);

        for (let i=0; i<BUCKET_COUNT; i++) {
            let bucketTotal = 0;
            for (let j=0; j<BUCKET_SIZE; j++) {
                bucketTotal += data[i*BUCKET_SIZE + j];
            }
            dataBuckets.push(bucketTotal / (BUCKET_SIZE * MAX_FREQ_DATA_VALUE));
        }

        clearCanvas();
        dataBuckets.forEach((v,i) => {
            function calcY(x) {
                const scaledX = TWO_PI * (x - startX) / (endX - startX);
                return (height/2) + Math.sin(scaledX * (i+1)) * v * height / 2;
            }
            ctx.strokeStyle= `hsl(0,0%,${Math.floor(20 + 80 * (1-v))}%)`;
            ctx.beginPath();
            let first = true;

            for (let x = startX; x < endX; x++) {
                const y = height - calcY(x - step * (i+1));
                if (first) {
                    ctx.moveTo(x, y);
                    first = false;
                }
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        });

        step = (step + WAVE_SPEED);

        requestAnimationFrame(paintSineWave);
    }

    return {
        init(_elCanvas) {
            elCanvas = _elCanvas;
            ctx = elCanvas.getContext('2d');
            updateCanvasSize();
            clearCanvas();
            paintSineWave();
        },
        setDataSource(source) {
            dataSource = source;
        },
        activate() {
            isActive = true;
        },
        deactivate() {
            clearCanvas();
            isActive = false;
        },
        onResize() {
            return updateCanvasSize;
        }
    };
})();