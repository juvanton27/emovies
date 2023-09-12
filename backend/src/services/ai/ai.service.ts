import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import * as fs from 'fs';
import { InferenceModel, createCompletion, loadModel } from 'gpt4all';
import * as path from 'path';
import { Observable, bindCallback, concatMap, from, map, of } from 'rxjs';
import { Emotion, allEmotions } from '../../model/emotion.type';
import { Movie } from '../../model/movie.model';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name)
  private model: InferenceModel;

  constructor() {
    from(loadModel('ggml-vicuna-7b-1.1-q4_2')).subscribe((m: InferenceModel) => this.model = m);
  }

  findEmotionFromSummary(summary: string): Observable<Emotion> {
    this.logger.verbose('Finding emotion ...');
    const emotions: string = allEmotions.join(', ');
    return from(createCompletion(this.model, [
      { role: 'user', content: `For a movie whose summary is "${summary}", which emotion results most between ${emotions} ? Answer in one word, the emotion` }
    ])).pipe(
      map((response: any) => {
        if (!response || response?.choices.length === 0) throw new Error('Error while asking for a rephrase');
        const generatedSentence: string = response.choices[0].message.content;
        let emotion: Emotion;
        for (const word of generatedSentence.split(' ')) {
          if (allEmotions.includes(word as Emotion)) {
            emotion = word as Emotion;
            break;
          }
        }
        if (!emotion) throw new Error('Error while retreiving the emotion of the summary');
        this.logger.verbose(`Found emotion "${emotion}" !`);
        return emotion;
      }),
    );
  }

  rephraseSummary(summary: string): Observable<string> {
    this.logger.verbose('Rephrasing summary ...');
    return from(createCompletion(this.model, [
      { role: 'user', content: `Rephrase this summary for me as if you had to convince a friend who\'s name is "Movios" to watch it: "${summary}"` }
    ])).pipe(
      map((response: any) => {
        if (!response || response?.choices.length === 0) throw new Error('Error while asking for a rephrase');
        let summary: string = response.choices[0].message.content;
        summary = summary.substring(1, summary.length - 1);
        this.logger.verbose(`Rephrased to : "${summary.slice(0, 30)}"`);
        return summary;
      })
    )
  }

  prepareTextFromTemplate(movie: Movie): string {
    const templatePath: string = 'data/document/template.txt';
    let template: string;
    try {
      template = fs.readFileSync(templatePath, 'utf8');
    } catch (err) {
      throw new Error('Error while reading template');
    }
    const tokens = template.match(/<([^>]+)>/g);
    if (!tokens) throw new Error('Not token found in template');
    this.logger.verbose(`Found tokens "${tokens.map(t => t.replace(/<|>/g, '')).join(',')}"`);
    tokens.forEach(token => {
      let replacement: string;
      switch (token) {
        case '<emotion>':
          replacement = movie.emotion;
          break;
        case '<film>':
          replacement = movie.title;
          break;
        case '<summary>':
          replacement = movie.overview;
          break;
        default:
          this.logger.verbose(`Unknown token "${token}". Skipping ...`);
          break;
      }
      if (replacement) template = template.replace(token, replacement);
    });
    this.logger.verbose(`Final text is :\n"${template}..."`);
    return template;
  }

  textToSpeech(text: string, filename: string): Observable<string> {
    const outputDir: string = 'data/audio';
    const outputFile: string = `${outputDir}/${filename}`;
    if (fs.existsSync(outputFile)) {
      this.logger.verbose(`Text to Speech audio already exists : ${outputFile}. Just retreiving it`);
      return of(outputFile);
    }
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    text = text.replaceAll("\"", "\\\"");
    const command: string = `mimic3 --voice en_US/vctk_low "${text}" > ${outputFile}`;
    this.logger.verbose(`Transforming text to speech with command "${command.slice(0, 100)}..."`);
    return bindCallback(exec)(command, {}).pipe(
      map(([error, stdout, stderr]) => {
        if (error) throw new Error(`Error while transforming text to speech: ${error.message}`);
        this.logger.verbose(`File saved to ${outputFile}`);
        return outputFile;
      }),
    );
  }

  speechToVideo(filepath: string): Observable<string> {
    const id: string = path.basename(filepath, path.extname(filepath));
    const sourceImage: string = 'data/image/speech_to_video.jpeg';
    const outputDir: string = 'data/video';
    const outputFile: string = `${outputDir}/stv_${id}.mp4`;
    if (fs.existsSync(outputFile)) {
      this.logger.verbose(`Speech to Video video already exists : ${outputFile}. Just retreiving it`);
      return of(outputFile);
    }
    const command: string = `cd data/utils/SadTalker && python3 inference.py --driven_audio ../../../${filepath} --source_image ../../../${sourceImage} --result_dir ../../../${outputDir} --still --preprocess full --enhancer gfpgan`; // Forced to change directory
    this.logger.verbose(`Transforming speech to video with command "${command}"`)
    return bindCallback(exec)(command, {}).pipe(
      map(([error, stdout, stderr]) => {
        if (error) throw new Error(`Error while transforming speech to video: ${error.message}`);
        this.cleanSpeechToVideoResult(outputFile);
        this.logger.verbose(`File saved to directory ${outputDir}`);
        return outputFile;
      }),
    );
  }

  private cleanSpeechToVideoResult(outputFile: string): void {
    const outputDir: string = path.dirname(outputFile);
    const nameToRemove: string = `${new Date().getFullYear()}_`;
    fs.readdirSync(outputDir).forEach((file: string) => {
      if (file.startsWith(nameToRemove)) {
        const filepath: string = `${outputDir}/${file}`;
        if (fs.statSync(filepath).isDirectory()) {
          fs.rmdirSync(filepath, { recursive: true });
        } else {
          fs.copyFileSync(filepath, outputFile);
          fs.unlinkSync(filepath);
        }
      }
    });
  }

  mountVideo(movie: Movie): Observable<string> {
    const id: number = movie.id;
    const imageDir: string = 'data/image';
    const tempDir: string = `data/temp/${id}`;
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const resultPath: string = `data/video/${id}.mp4`;
    if (fs.existsSync(resultPath)) {
      this.logger.verbose(`Video for movie "${movie.title}" already mounted at "${resultPath}". Just retreiving it ...`);
      return of(resultPath);
    }

    const imagePath: string = `${imageDir}/${id}.jpg`;
    if (!fs.existsSync(imagePath)) throw new Error(`${imagePath} does not exists !`);
    const stvVideoPath: string = `data/video/stv_${id}.mp4`;
    if (!fs.existsSync(stvVideoPath)) throw new Error(`${stvVideoPath} does not exists !`);

    this.logger.verbose(`Begin video mounting from "${imagePath}" and "${stvVideoPath}" ...`);
    return bindCallback(exec)(`convert ${imagePath} -crop 1080x1920+0+0 ${tempDir}/cropped.jpg`, {}).pipe(
      concatMap(([error, stdout, stderr]) => {
        if (error) throw new Error(`Error while cropping "${imagePath}" : ${error}`);
        this.logger.verbose(`Cropped to "${tempDir}/cropped.jpg"`);

        return bindCallback(exec)(`convert ${tempDir}/cropped.jpg -blur 0x100 ${tempDir}/blurred.jpg`, {});
      }),
      concatMap(([error, stdout, stderr]) => {
        if (error) throw new Error(`Error while blurring "${tempDir}/cropped.jpg" : ${error}`);
        this.logger.verbose(`Blurred to "${tempDir}/blurred.jpg"`);

        return bindCallback(exec)(`ffprobe -i ${stvVideoPath} -show_entries format=duration -v quiet -of csv="p=0"`, {}).pipe(
          map(([error, stdout, stderr]) => {
            if (error) throw new Error(`Error while retreiving duration of ${stvVideoPath} : ${error}`);
            const duration = Math.ceil(+stdout?.toString().trim());
            if (isNaN(duration)) throw new Error(`Error while parsing ${stdout}`);
            return duration;
          }),
        );
      }),
      concatMap((duration: number) => {
        this.logger.verbose(`Creating background video of ${duration} seconds`);
        return bindCallback(exec)(`ffmpeg -loop 1 -i ${tempDir}/blurred.jpg -c:v libx264 -t ${duration} -pix_fmt yuv420p  ${tempDir}/background.mp4`, {}).pipe(
          concatMap(([error, stdout, stderr]) => {
            if (error) throw new Error(`Error while creating "${tempDir}/background.mp4" : ${error}`);
            this.logger.verbose(`Background created in "${tempDir}/background.mp4"`);
    
            return bindCallback(exec)(`identify ${imagePath}`, {}).pipe(
              map(([error, stdout, stderr]) => {
                if (error) throw new Error(`Error while retreiving size of image "${imagePath}" : ${error}`);
                const size = stdout.toString().split(' ')[2];
                const [x, y] = size?.split('x');
                if (!size || x === undefined || y === undefined) throw new Error('Error while spliting size');
                return {x,y};
              }),
            );
          }),
          concatMap(({x,y}) => {
            this.logger.verbose(`Image of size ${x}x${y}`);
            return bindCallback(exec)(`convert -size ${x}x${y} xc:none -draw "roundrectangle 0,0,${x},${y},100,100" ${tempDir}/mask.png`, {}).pipe(
              concatMap(([error, stdout, stderr]) => {
                if (error) throw new Error(`Error while creating border radius mask : ${error}`);
                this.logger.verbose(`Border radius mask created to ${tempDir}/mask.png`);
                
                return bindCallback(exec)(`convert -size ${x}x${y} ${imagePath} ${tempDir}/mask.png -compose copyopacity -composite ${tempDir}/cover_radius.png`, {});
              }),
            );
          }),
          concatMap(([error, stdout, stderr]) => {
            if (error) throw new Error(`Error while creating cover with radius "${tempDir}/cover_radius.png" : ${error}`);
            this.logger.verbose(`Cover with radius created "${tempDir}/cover_radius.png"`);
    
            return bindCallback(exec)(`convert ${tempDir}/cover_radius.png -resize x600 ${tempDir}/cover_radius_resized.png`, {});
          }),
          concatMap(([error, stdout, stderr]) => {
            if (error) throw new Error(`Error while resizing cover radius "${tempDir}/cover_radius.png"`);
            this.logger.verbose(`Cover radius resized "${tempDir}/cover_radius_resized.png"`);
    
            return bindCallback(exec)(`ffmpeg -i ${tempDir}/background.mp4 -i ${tempDir}/cover_radius_resized.png -filter_complex "[0:v][1:v] overlay=(W-w)/2:200:enable='between(t,2,${duration})'" -pix_fmt yuv420p -c:a copy ${tempDir}/background_and_cover.mp4`, {});
          }),
        );
      }),
      concatMap(([error, stdout, stderr]) => {
        if (error) throw new Error(`Error while adding "${tempDir}/cover_radius_resized.png" on "${tempDir}/background.mp4" : ${error}`);
        this.logger.verbose(`Cover "${tempDir}/cover_radius_resized.png" added to "${tempDir}/background.mp4" at "${tempDir}/background_and_cover.mp4"`);

        return bindCallback(exec)(`ffmpeg -i ${tempDir}/background_and_cover.mp4 -i ${stvVideoPath} -filter_complex "\
        [1]format=yuva444p,geq=lum='p(X,Y)':a='st(1,pow(min(W/2,H/2),2))+st(3,pow(X-(W/2),2)+pow(Y-(H/2),2));if(lte(ld(3),ld(1)),255,0)'[circular shaped video];\
        [circular shaped video]scale=w=-1:h=500[circular shaped video small];\
        [0][circular shaped video small]overlay=(W-w)/2:1000" -filter_complex_threads 1\
        -map 0:a? -metadata:s:a:0 title="Sound main movie" -disposition:a:0 default -map 1:a -metadata:s:a:1 title="Sound overlayed movie"\
        -disposition:a:1 none -c:v libx264 -preset ultrafast -shortest ${tempDir}/${id}.mp4`, {});
      }),
      concatMap(([error, stdout, stderr]) => {
        if (error) throw new Error(`Error while adding circle stv Video "${stvVideoPath}" : ${error}`);
        this.logger.verbose(`StvVideo "${stvVideoPath}" successfully added to "${tempDir}/${id}.mp4"`);

        return bindCallback(exec)(`auto_subtitle ${tempDir}/${id}.mp4 -o data/video`, {});
      }),
      map(([error, stdout, stderr]) => {
        if (error) throw new Error(`Error while adding subtitles "${tempDir}/${id}.mp4" : ${error}`);
        this.logger.verbose(`Subtitles successfully added to "${tempDir}/${id}.mp4"`);
        fs.rmSync(tempDir, {recursive: true});
        this.logger.verbose(`Temporary directory "${tempDir}" successfully removed`);
        return resultPath;
      }),
    )
  }
}
