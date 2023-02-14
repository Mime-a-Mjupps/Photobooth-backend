#!/bin/bash
dir="content"
inotifywait -m "$dir" -e close_write --format '%w%f' |
    while IFS=' ' read -r fname
    do
	if [ "${fname##*.}" = "webm" ]; then
       		echo "Converting webm to mp4";
		ffmpeg -nostdin -i "$fname" -movflags faststart -profile:v high -level 4.2 -vsync vfr "${fname/webm/mp4}"
		echo "Done with convertion!";
		rm "$fname";
   	fi
    done
