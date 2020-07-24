const visualiser = (() => {
    const BACKGROUND_COLOUR = 'black';

    let dataSource, isActive=true, elCanvas, ctx;

    function updateCanvasSize() {
        elCanvas.width = elCanvas.offsetWidth;
        elCanvas.height = elCanvas.offsetHeight;
    }

    function clearCanvas() {
        ctx.fillStyle = BACKGROUND_COLOUR;
        ctx.fillRect(0, 0, elCanvas.clientWidth, elCanvas.clientHeight);
    }
    function paintCanvas() {
        function paint(colour, multiplier) {
            const data = dataSource();
            ctx.lineWidth = 2;
            ctx.strokeStyle = colour;
            ctx.beginPath();
            var sliceWidth = elCanvas.clientWidth * 1.0 / data.length;
            var x = 0;
            for(var i = 0; i < data.length; i++) {
                var v = data[i] / 128.0;
                var y = multiplier * v * elCanvas.clientHeight/2;

                if(i === 0 || x*3 >= elCanvas.clientWidth - 9) {
                    ctx.moveTo(x*3, elCanvas.clientHeight - y);
                } else {
                    ctx.lineTo(x*3, elCanvas.clientHeight - y);
                }

                x += sliceWidth;
            }
            ctx.stroke();
        }
        if (isActive && dataSource) {
            clearCanvas();
            paint('#41FF05', 1)
            paint('#41FF0588', 0.5)
        }
        requestAnimationFrame(paintCanvas);
    }

    return {
        init(_elCanvas) {
            elCanvas = _elCanvas;
            ctx = elCanvas.getContext('2d');
            updateCanvasSize();
            clearCanvas();
            paintCanvas();
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