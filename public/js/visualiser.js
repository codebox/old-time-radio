const visualiser = (() => {
    const BACKGROUND_COLOUR = 'black',
        MAX_FREQ_DATA_VALUE = 255;

    let dataSource, isActive=true, elCanvas, ctx, width, height

    function updateCanvasSize() {
        clearCanvas();
        width = elCanvas.width = elCanvas.offsetWidth;
        height = elCanvas.height = elCanvas.offsetHeight;
        console.log(width, height)
    }

    function clearCanvas() {
        ctx.fillStyle = BACKGROUND_COLOUR;
        ctx.fillRect(0, 0, width, height);
    }
    function paintCanvasGraph() {
        function paint(colour, multiplier) {
            const data = dataSource();
            ctx.lineWidth = 2;
            ctx.strokeStyle = colour;
            ctx.beginPath();
            var sliceWidth = width * 1.0 / data.length;
            var x = 0;
            for(var i = 0; i < data.length; i++) {
                var v = data[i] / 128.0;
                var y = multiplier * v * height/2;

                if(i === 0 || x*3 >= width - 9) {
                    ctx.moveTo(x*3, height - y);
                } else {
                    ctx.lineTo(x*3, height - y);
                }

                x += sliceWidth;
            }
            ctx.stroke();
        }
        if (isActive && dataSource) {
            clearCanvas();
            paint('#ddd', 1)
            paint('#aaa', 0.5)
        }
        requestAnimationFrame(paintCanvasGraph);
    }

    function paintCanvasBars() {
        const BAR_COUNT = 20,
            H_PADDING = Math.min(50, width/4),
            V_PADDING = Math.min(50, height/4),
            BAR_SPACING = 5,
            BAR_WIDTH = ((width - 2 * H_PADDING - BAR_SPACING) / BAR_COUNT) - BAR_SPACING;
        const data = dataSource();

        const dataBuckets = [],
            BUCKET_SIZE = Math.floor(data.length/BAR_COUNT);

        for (let i=0; i<BAR_COUNT; i++) {
            let bucketTotal = 0;
            for (let j=0; j<BUCKET_SIZE; j++) {
                bucketTotal += data[i*BUCKET_SIZE + j];
            }
            dataBuckets.push(bucketTotal / (BUCKET_SIZE * MAX_FREQ_DATA_VALUE));
        }

        let barStartX = H_PADDING,
            barHeightFactor = height - 2 * V_PADDING;

        clearCanvas();
        for (let i=0; i<BAR_COUNT; i++) {
            const barHeight = dataBuckets[i] * barHeightFactor;
            ctx.fillStyle= `rgba(255,255,255,${0.3 + 0.7 * dataBuckets[i]})`;
            ctx.fillRect(barStartX, V_PADDING + barHeightFactor - barHeight, BAR_WIDTH, barHeight);
            barStartX += (BAR_WIDTH + BAR_SPACING);
        }

        requestAnimationFrame(paintCanvasBars);
    }

    return {
        init(_elCanvas) {
            elCanvas = _elCanvas;
            ctx = elCanvas.getContext('2d');
            updateCanvasSize();
            clearCanvas();
            paintCanvasBars();
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