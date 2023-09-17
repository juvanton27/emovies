import { Column, Entity, PrimaryColumn } from "typeorm";
import { Emotion } from "../model/emotion.type";

@Entity('movies')
export class MovieDbo {
  @PrimaryColumn()
  id: number;

  @Column()
  title: string;

  @Column({length: 1000})
  overview: string;

  @Column()
  emotion: Emotion;

  @Column()
  poster_path: string;

  @Column({default: false})
  uploaded: boolean;
}