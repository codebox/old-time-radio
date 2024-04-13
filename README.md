# Old Time Radio

**You can see this code running now at [https://oldtime.radio](https://oldtime.radio)**

There are [thousands of classic radio shows from the 1930s, 40s and 50s available on The Internet Archive](https://archive.org/details/oldtimeradio), so I've made an [internet radio station](https://oldtime.radio/) for them!

<img src="https://codebox.net/assets/images/old-time-radio/oldtime-radio-website.png" alt="Website Screenshot" width="600"/>

The server-side components of the site are written in Node.js. When the site starts up it reads [this configuration file](https://github.com/codebox/old-time-radio/blob/master/data.json), which contains a list of the various radio shows that the site will broadcast. The site then uses the [Internet Archive's metadata API](https://archive.org/services/docs/api/metadata.html) to get a list of the individual episodes that are available for each show, together with the mp3 file urls for each one.

The configuration file also contains a list of channels (eg Comedy, Western, Action) and specifies which shows should be played on each one. A playlist is generated for each channel, alternating the shows with vintage radio commercials to make the listening experience more authentic. The commercials are sometimes more entertaining than the shows themselves, being very much [of](https://archive.org/details/Old_Radio_Adverts_01/OldRadio_Adv--Bromo_Quinine.mp3) [their](https://archive.org/details/Old_Radio_Adverts_01/OldRadio_Adv--Camel1.mp3) [time](https://archive.org/details/Old_Radio_Adverts_01/OldRadio_Adv--Fitch.mp3).

The audio that your hear on the site is streamed directly from The Internet Archive, my site does not host any of the content. The [Same-Origin Policy](https://en.wikipedia.org/wiki/Same-origin_policy) often limits what websites can do with remotely hosted media. Typically such media can be displayed by other websites, but not accessed by any scripts running on those sites. However the Internet Archive explicitly allows script access to their audio files by including [the following header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin) in their HTTP responses:

    Access-Control-Allow-Origin: *

This allowed me to write some JavaScript to analyse the audio signal in real-time and produce a satisfying visualisation, making the site more interesting to look at:

[Visualisation Video](https://codebox.net/assets/video/old-time-radio/audio-visualisation.mp4)

