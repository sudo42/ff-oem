About This Software
-------------------

**WARNING:** This extension is neither …
  - packaged
  - thouroughly testes
  - approved or endorsed by RWTH or FSMPI
  - well supported
  - the answer to life, universe, and everything
  - readable

**Use at your own risk!**

Further development is necessary and will take place when I find some more free time …

### does it have a name?

Not really … at least nothing that I'd consider final.

Nevertheless, in the code it is called _Open Excellence Media_  or for short **OEM**.


### what is it good for?


Most videos (eg. lecture recordings) embedded in RWTH Aachen University's moodle are hosted on an OpenCast.
These videos are usually embedded using an iframe, which makes it (intentionally) hard to download them for offline use.

This extension want's to help by liberating lecture recordings and other videos provided in this rather restrictive manner.

How?
By placing a bow with direct links to the videos above them.

### reasons for downloading vidoes
  - a bad internet connection (streaming feels like 90% buffering and 10% watching)
  - learning on the train, at the beach, in the park, … you get it
  - personal archive to re-watch lecture contents in a few semesters (relevant for exams, personal interest, …)
  - …

### how to use it
This is, how it should (approximately) look:
![Partial screenshot of a (dummy) course page showing the download link inserted by this add-on.
Text: "Download video: Lecture Fundamentals of applied theoretical sciences"
Below are the links: "640x360 (mp4)", "1280x720 (mp4)", and "1920x1080 (mp4)".](https://git.fsmpi.rwth-aachen.de/moodleOpenCastDownloads/ff-ext/-/raw/_static-resources/images/screenshot-buttons.png)

  - The text "Download video: $nameOfVideo" should appear below each embedded video.
  - It should be possible to simply click on it, which should reveal a set of links.
  - These should be direct links to video files (with the displayed resolution).
  - Hover (on desktop, probably long-press on mobile? didn't try that) a link to see more details.

### where to get it?
Sadly, this extension was not accepted into Mozilla's offizial addon gallery, because the target audience is too limited.
Nevertheless it is possible to get extensions signed by Mozilla and self-distribute them.
(With a bit of luck even automated updates should work just fine.)

#### downloads, with caveats _\*sigh\*_

You should (hopefully) be able to get the latest version from:\
<https://dev.sudo42.de/public/ff-addons/openexcellencemedia-latest.xpi>\
**Caveat:**
Simply clicking the link is unlikely to work.
Firefox seems to block installations of extensions, if a link does not point to the same domain.\
I'm sorry … please just copy it and open the page yourself.

The [releases page of this project](https://git.fsmpi.rwth-aachen.de/moodleOpenCastDownloads/ff-ext/-/releases) should contain them as well.\
**Caveat:**
This one has caveats as well: GitLab will usually deliver the files in a way, that they are downloaded instead of prompting for installtion.\
You should nevertheless be able to install the downloaded file from Firefox's addon page.

#### grab the source

And, of course, you can build this extension from source on your own.
Or modify it to work as user script.
This project is licensed unser EUPL, so feel free to use, read, adapt, or share the code.

### 2do
  - [X] going to bed
  - [ ] styling (I love CSS, not joking here!)
  - [ ] adding links in video-only tabs, too
  - [ ] packaging
  - [ ] good name + icon
  - [ ] further investigation into the OpenCast API (looks like one might be able to have some fun with it)
  - [ ] …
