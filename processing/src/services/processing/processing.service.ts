import { Inject, Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import * as fs from 'fs';
import { Observable, bindCallback, concatMap, map, of } from 'rxjs';
import { Movie } from '../../model/movie.model';
import * as path from 'path';
import { Emotion } from '../../model/emotion.type';
import { MoviesService } from '../movies/movies.service';
import { LoggerService } from '../logger/logger.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProcessingService {
  private readonly dataDir: string;
  private readonly resultsDir: string;

  constructor(
    private readonly moviesService: MoviesService,
    @Inject(LoggerService) private logger: LoggerService,
    private readonly configService: ConfigService,
  ) {
    this.dataDir = configService.get<string>('directory.data');
    this.resultsDir = configService.get<string>('directory.results');
  }

  mountVideo(movie: Movie): Observable<string> {
    const id: number = movie.id;
    const imageDir: string = `${this.dataDir}/image`;
    const tempDir: string = `${this.dataDir}/temp/${id}`;
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const resultDir: string = `${this.resultsDir}/`;
    const resultPath: string = `${resultDir}${id}.mp4`;
    if (fs.existsSync(resultPath)) {
      this.logger.verbose(`Video for movie "${movie.title}" already mounted at "${resultPath}". Just retreiving it ...`);
      return of(resultPath);
    }
    if (!fs.existsSync(resultDir)) fs.mkdirSync(resultDir, { recursive: true });

    const imagePath: string = `${imageDir}/${id}.jpg`;
    if (!fs.existsSync(imagePath)) throw new Error(`${imagePath} does not exists !`);
    const stvVideoPath: string = `${this.dataDir}/video/stv_${id}.mp4`;
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
        return bindCallback(exec)(`ffmpeg -y -loop 1 -i ${tempDir}/blurred.jpg -c:v libx264 -t ${duration} -pix_fmt yuv420p  ${tempDir}/background.mp4`, {}).pipe(
          concatMap(([error, stdout, stderr]) => {
            if (error) throw new Error(`Error while creating "${tempDir}/background.mp4" : ${error}`);
            this.logger.verbose(`Background created in "${tempDir}/background.mp4"`);

            return bindCallback(exec)(`identify ${imagePath}`, {}).pipe(
              map(([error, stdout, stderr]) => {
                if (error) throw new Error(`Error while retreiving size of image "${imagePath}" : ${error}`);
                const size = stdout.toString().split(' ')[2];
                const [x, y] = size?.split('x');
                if (!size || x === undefined || y === undefined) throw new Error('Error while spliting size');
                return { x, y };
              }),
            );
          }),
          concatMap(({ x, y }) => {
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

            return bindCallback(exec)(`convert ${tempDir}/cover_radius.png -resize x800 ${tempDir}/cover_radius_resized.png`, {});
          }),
          concatMap(([error, stdout, stderr]) => {
            if (error) throw new Error(`Error while resizing cover radius "${tempDir}/cover_radius.png"`);
            this.logger.verbose(`Cover radius resized "${tempDir}/cover_radius_resized.png"`);

            return bindCallback(exec)(`ffmpeg -y -i ${tempDir}/background.mp4 -i ${tempDir}/cover_radius_resized.png -filter_complex "[0:v][1:v] overlay=(W-w)/2:250:enable='between(t,2,${duration})'" -pix_fmt yuv420p -c:a copy ${tempDir}/background_and_cover.mp4`, {});
          }),
        );
      }),
      concatMap(([error, stdout, stderr]) => {
        if (error) throw new Error(`Error while adding "${tempDir}/cover_radius_resized.png" on "${tempDir}/background.mp4" : ${error}`);
        this.logger.verbose(`Cover "${tempDir}/cover_radius_resized.png" added to "${tempDir}/background.mp4" at "${tempDir}/background_and_cover.mp4"`);

        return bindCallback(exec)(`ffmpeg -y -i ${tempDir}/background_and_cover.mp4 -i ${stvVideoPath} -filter_complex "\
        [1]format=yuva444p,geq=lum='p(X,Y)':a='st(1,pow(min(W/2,H/2),2))+st(3,pow(X-(W/2),2)+pow(Y-(H/2),2));if(lte(ld(3),ld(1)),255,0)'[circular shaped video];\
        [circular shaped video]scale=w=-1:h=300[circular shaped video small];\
        [0][circular shaped video small]overlay=(W-w)/2:1300" -filter_complex_threads 1\
        -map 0:a? -metadata:s:a:0 title="Sound main movie" -disposition:a:0 default -map 1:a -metadata:s:a:1 title="Sound overlayed movie"\
        -disposition:a:1 none -c:v libx264 -preset ultrafast -shortest ${tempDir}/${id}.mp4`, {});
      }),
      concatMap(([error, stdout, stderr]) => {
        if (error) throw new Error(`Error while adding circle stv Video "${stvVideoPath}" : ${error}`);
        this.logger.verbose(`StvVideo "${stvVideoPath}" successfully added to "${tempDir}/${id}.mp4"`);

        return bindCallback(exec)(`auto_subtitle ${tempDir}/${id}.mp4 -o ${resultDir}`, {});
      }),
      map(([error, stdout, stderr]) => {
        if (error) throw new Error(`Error while adding subtitles "${tempDir}/${id}.mp4" : ${error}`);
        this.logger.verbose(`Subtitles successfully added to "${tempDir}/${id}.mp4"`);
        fs.rmSync(tempDir, { recursive: true });
        this.logger.verbose(`Temporary directory "${tempDir}" successfully removed`);
        return resultPath;
      }),
    )
  }

  createVideoTitleByEmotion(emotion: Emotion): Observable<string> {
    return this.moviesService.countByEmotion(emotion).pipe(
      map((count: number) => `You're feeling ${emotion} ? #${count+1}`),
    );
  }

  /**
   * Upload the provided video on YouTube
   * @param title the title that will be displayed on YouTube
   * @param path the path of the video
   * @returns if the uploaded has succeeded
   */
  uploadOnYouTube(title: string, description: string, videoPath: string): Observable<boolean> {
    this.logger.verbose(`Uploading "${videoPath}" ...`);
    const pythonScriptPath: string = `utils/youtube-bot/main.py`;
    const absPath = path.resolve(videoPath);
    const command: string = `python3 ${pythonScriptPath} --title "${title}" --description "${description}" --path "${absPath}"`;
    return bindCallback(exec)(command, {}).pipe(
      map(([error, stdout, stderr]) => {
        if (error) throw new Error(`Error while uploading video to YouTube : ${error}`);
        if (stdout) {
          this.logger.verbose(stdout.toString());
          return true;
        } else return false;
      }),
    );
  }
}
