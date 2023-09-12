# Emovie
This application allows you to generate TikTok/Shorts videos whose main subject are films based on your emotions.
This application can/has :
  - Generate shorts
  - Generate and publish videos
  - A web interface

## Installation
To run all the project you will need :
  - An account on The Movie DB (https://www.themoviedb.org)
  - A GPT cli
  - A TTS (Text To Speech)
  - A Speech to video
  - An auto subtitle
Only available on Linux (Ubuntu) for the moment ...
### Ubuntu
#### GPT cli
For this part, I choosed GPT4All (https://gpt4all.io/) that's a free version of ChatGPT.
I installed the npm package with `npm install gpt4all@alpha`
#### TTS
I choose mimic3 (https://mycroft.ai/mimic-3/), cause it has the best ease/quality ratio.
I installed the pyhton package with `pip3 install mycroft-mimic3-tts[all]` (\[all\] is used to install more than just English)
Then it is usable with command `mimic3 --voice <voice> "<text>" > output.wav`
#### Speech to Video
I choose SadTalker (https://github.com/OpenTalker/SadTalker)
I didn't find other way to clone repo directly in `backend/data/utils/SadTalker`
Don't forget to read SadTalker repo to be aware of its requirements
#### Auto subtitles
I choose auto subtitles (https://github.com/m1guelpf/auto-subtitle). Doing it myself was to tricky
I installed the python package with `pip3 install git+https://github.com/m1guelpf/auto-subtitle.git`
Then it is usable with command `auto_subtitle /path/to/video.mp4 -o subtitled/`
I had to patch it by replacing `auto_subtilte/auto_subtitle/cli.py` to redesign subtitle to be on center of the screen

`ffmpeg.concat(
    video.filter('subtitles', srt_path, force_style="Fontsize=14,OutlineColour=&H40000000,MarginV=128"), audio, v=1, a=1
  ).output(out_path).run(quiet=True, overwrite_output=True)`

I also had to patch openAI/whisper package (https://github.com/openai/whisper) by replacing this part in `whisper/whisperdecoding.py`. I added `-4.5` instead of `max_text_token_logprob`. This allows to have shorter subtitles

`logprobs = F.log_softmax(logits.float(), dim=-1)
for k in range(tokens.shape[0]):
  timestamp_logprob = logprobs[k, self.tokenizer.timestamp_begin :].logsumexp(
    dim=-1
  )
  max_text_token_logprob = logprobs[k, : self.tokenizer.timestamp_begin].max()
  if timestamp_logprob > -4.5:
    logits[k, : self.tokenizer.timestamp_begin] = -np.inf`

Once it is patched, you can install it globally with `pip3 install .` on root folder
