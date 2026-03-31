import type { BasePrimitive } from "./primitive.type";
import type { Behaviour } from "./behavior.type";

export interface Block {
  block_id: string;
  block_description: string;
  block_version: string;
  elements: Array<BasePrimitive>;
  behaviours?: Array<Behaviour>;
}
