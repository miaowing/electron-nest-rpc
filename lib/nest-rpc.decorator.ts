import 'reflect-metadata';
import { Type } from '@nestjs/common';
import { nestRPC } from './nest-rpc.renderer';

export const UseRPC = <T = any>(cls: Type<T>, classname?: string) => (target, property) => {
  target[property] = nestRPC(cls, classname);
  return target;
};
