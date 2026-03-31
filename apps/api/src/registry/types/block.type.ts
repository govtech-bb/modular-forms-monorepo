import type { BasePrimitive } from "./primitive.type";
import type { Behaviour } from "./behavior.type";

export interface Block {
  blockId: string;
  blockDescription: string;
  blockVersion: string;
  elements: Array<BasePrimitive>;
  behaviours?: Array<Behaviour>;
}
