import { Emotion } from "./emotion.type";

export interface Movie {
  id: number;
  title: string;
  overview: string;
  emotion: Emotion;
  posterPath: string;
  uploaded: boolean;
}