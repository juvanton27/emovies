import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import * as fs from 'fs';
import { InferenceModel, createCompletion, loadModel } from 'gpt4all';
import * as path from 'path';
import { Observable, bindCallback, from, map, of } from 'rxjs';
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
        summary = summary.substring(1, summary.length-1);
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
          fs.rmdirSync(filepath, {recursive: true});
        } else {
          fs.copyFileSync(filepath, outputFile);
          fs.unlinkSync(filepath);
        }
      }
    });
  }

  mountVideo(movie: Movie, stvVideoPath: string): void {
    
  }
}
