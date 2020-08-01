# old-time-radio

* https://www.html5rocks.com/en/tutorials/webaudio/intro/
* http://bluefaqs.com/2010/05/40-free-retro-and-vintage-fonts/
* https://css-tricks.com/circular-3d-buttons/
* https://codepen.io/fskirschbaum/pen/MYJNaj
* https://www.ibm.com/developerworks/library/wa-ioshtml5/wa-ioshtml5-pdf.pdf

## TODO
* jasmine tests probably broken now that we have adverts in there


To dump playlist for channel increase PLAYLIST_MIN_LENGTH in channel.js and then run:
```
    const audioList = require('./audioList.js').audioList;
    
    audioList.init().then(() => {
        const playlist = audioList.getListForChannel('western');
        console.log(JSON.stringify(playlist.list.filter(i => !i.commercial), null, 4));
    })
```